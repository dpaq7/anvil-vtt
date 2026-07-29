import { Hono } from 'hono';
import type { Context } from 'hono';
import type { NoteScope as NoteAudienceScope } from '@anvil/types';
import type { AppEnv, AuthUser } from '../types.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireCampaignMember } from '../security/authorization.js';
import { NOTE_LIMITS } from '../policy/limits.js';
import { jsonError, readJsonBody } from '../security/request.js';
import { noteRateLimits } from '../security/rate-limits.js';
import { escapeLikePattern } from '../security/validation.js';
import {
  normalizeNoteSearchQuery,
  parseCreateNoteFolderInput,
  parseCreateNoteInput,
  parseReorderNotesInput,
  parseUpdateNoteFolderInput,
  parseUpdateNoteInput,
} from '../contracts/notes.js';
import {
  assertOwnedNoteFolder,
  campaignNoteScope,
  ensureAutoNoteFolders,
  getOwnedNote,
  getOwnedNoteFolder,
  noteFolderTable,
  noteScopeBinds,
  noteScopeWhere,
  noteTable,
  personalNoteScope,
  rowToFolder,
  rowToNote,
  type NoteFolderRow,
  type NoteRow,
  type NoteScope,
} from '../repositories/notes.js';

type ScopeResolver = (
  c: Context<AppEnv>,
  requested?: NoteAudienceScope | null,
) => NoteScope | Response | Promise<NoteScope | Response>;

export const noteRoutes = new Hono<AppEnv>();
export const personalNoteRoutes = new Hono<AppEnv>();

noteRoutes.use('/*', authMiddleware);
noteRoutes.use('/:campaignId/*', async (c, next) => {
  const user = c.get('user') as AuthUser;
  const accessError = await requireCampaignMember(c, c.req.param('campaignId'), user);
  if (accessError) return accessError;
  await next();
});

personalNoteRoutes.use('/*', authMiddleware);

function bindScope(scope: NoteScope, userId: string, extra: unknown[] = []): unknown[] {
  return [...noteScopeBinds(scope, userId), ...extra];
}

function requestedNoteScope(value: unknown): NoteAudienceScope | null {
  return value === 'director' || value === 'player' ? value : null;
}

function isResponse(value: NoteScope | Response): value is Response {
  return value instanceof Response;
}

async function getAllowedCampaignNoteScopes(
  c: Context<AppEnv>,
  campaignId: string,
  user: AuthUser,
): Promise<NoteAudienceScope[]> {
  const row = await c.env.DB.prepare(
    `SELECT c.director_id, cm.role
     FROM campaigns c
     JOIN campaign_members cm ON cm.campaign_id = c.id AND cm.user_id = ?
     WHERE c.id = ? AND c.deleted_at IS NULL`,
  )
    .bind(user.id, campaignId)
    .first<{ director_id: string; role: string }>();

  if (!row) return [];
  if (row.director_id === user.id || row.role === 'director') return ['director', 'player'];
  return ['player'];
}

async function resolveCampaignNoteScope(
  c: Context<AppEnv>,
  requested?: NoteAudienceScope | null,
): Promise<NoteScope | Response> {
  const campaignId = c.req.param('campaignId') ?? '';
  const user = c.get('user') as AuthUser;
  const allowedScopes = await getAllowedCampaignNoteScopes(c, campaignId, user);
  const fallback = allowedScopes.includes(user.role as NoteAudienceScope)
    ? user.role as NoteAudienceScope
    : allowedScopes[0];
  const audience = requested ?? requestedNoteScope(c.req.query('scope')) ?? fallback;
  if (!audience || !allowedScopes.includes(audience)) {
    return c.json({ error: 'Forbidden note scope' }, 403);
  }
  return campaignNoteScope(campaignId, audience);
}

noteRoutes.get('/:campaignId/note-scopes', async (c) => {
  const campaignId = c.req.param('campaignId') ?? '';
  const user = c.get('user') as AuthUser;
  const scopes = await getAllowedCampaignNoteScopes(c, campaignId, user);
  const defaultScope = scopes.includes(user.role as NoteAudienceScope)
    ? user.role as NoteAudienceScope
    : scopes[0] ?? 'player';
  return c.json({ scopes, defaultScope });
});

function registerNoteHandlers(
  routes: Hono<AppEnv>,
  prefix: string,
  resolveScope: ScopeResolver,
) {
  // ── Folder Routes ──

  routes.get(`${prefix}/note-folders`, async (c) => {
    const scope = await resolveScope(c);
    if (isResponse(scope)) return scope;
    const user = c.get('user') as AuthUser;

    await ensureAutoNoteFolders(c.env.DB, scope, user.id);

    const results = await c.env.DB.prepare(
      `SELECT * FROM ${noteFolderTable(scope)} WHERE ${noteScopeWhere(scope)} ORDER BY sort_order ASC`,
    )
      .bind(...noteScopeBinds(scope, user.id))
      .all<NoteFolderRow>();

    return c.json({ folders: results.results.map((row) => rowToFolder(row, scope)) });
  });

  routes.post(`${prefix}/note-folders`, async (c) => {
    const user = c.get('user') as AuthUser;
    const rateLimitError = await noteRateLimits.write(c, user.id);
    if (rateLimitError) return rateLimitError;

    const raw = await readJsonBody<unknown>(c, { maxBytes: NOTE_LIMITS.jsonBodyBytes, label: 'Folder' });
    if (!raw.ok) return jsonError(c, raw);
    const parsed = parseCreateNoteFolderInput(raw.value);
    if (!parsed.ok) return jsonError(c, parsed);
    const body = parsed.value;
    const scope = await resolveScope(c, body.scope);
    if (isResponse(scope)) return scope;

    if (body.parentFolderId && !(await assertOwnedNoteFolder(c.env.DB, scope, user.id, body.parentFolderId))) {
      return c.json({ error: 'Parent folder not found' }, 404);
    }

    const maxOrder = await c.env.DB.prepare(
      `SELECT MAX(sort_order) as max_order FROM ${noteFolderTable(scope)}
       WHERE ${noteScopeWhere(scope)} AND parent_folder_id ${body.parentFolderId ? '= ?' : 'IS NULL'}`,
    )
      .bind(...bindScope(scope, user.id, body.parentFolderId ? [body.parentFolderId] : []))
      .first<{ max_order: number | null }>();

    const id = crypto.randomUUID();
    const sortOrder = (maxOrder?.max_order ?? -1) + 1;

    if (scope.kind === 'campaign') {
      await c.env.DB.prepare(
        'INSERT INTO note_folders (id, campaign_id, user_id, scope, parent_folder_id, name, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
      )
        .bind(id, scope.campaignId, user.id, scope.audience, body.parentFolderId ?? null, body.name, sortOrder)
        .run();
    } else {
      await c.env.DB.prepare(
        'INSERT INTO personal_note_folders (id, user_id, parent_folder_id, name, sort_order) VALUES (?, ?, ?, ?, ?)',
      )
        .bind(id, user.id, body.parentFolderId ?? null, body.name, sortOrder)
        .run();
    }

    const row = await getOwnedNoteFolder(c.env.DB, scope, user.id, id);
    if (!row) return c.json({ error: 'Failed to create folder' }, 500);

    return c.json({ folder: rowToFolder(row, scope) }, 201);
  });

  routes.patch(`${prefix}/note-folders/:folderId`, async (c) => {
    const scope = await resolveScope(c);
    if (isResponse(scope)) return scope;
    const folderId = c.req.param('folderId');
    const user = c.get('user') as AuthUser;
    const rateLimitError = await noteRateLimits.write(c, user.id);
    if (rateLimitError) return rateLimitError;

    const raw = await readJsonBody<unknown>(c, { maxBytes: NOTE_LIMITS.jsonBodyBytes, label: 'Folder update' });
    if (!raw.ok) return jsonError(c, raw);
    const parsed = parseUpdateNoteFolderInput(raw.value);
    if (!parsed.ok) return jsonError(c, parsed);
    const body = parsed.value;

    const existing = await getOwnedNoteFolder(c.env.DB, scope, user.id, folderId);
    if (!existing) return c.json({ error: 'Not found' }, 404);

    if (existing.is_auto_generated === 1 && body.name !== undefined) {
      return c.json({ error: 'Cannot rename auto-generated folders' }, 400);
    }

    const sets: string[] = [];
    const vals: unknown[] = [];

    if (body.name !== undefined) {
      sets.push('name = ?');
      vals.push(body.name.trim());
    }
    if (body.parentFolderId !== undefined) {
      if (body.parentFolderId === folderId) return c.json({ error: 'Folder cannot be its own parent' }, 400);
      if (body.parentFolderId && !(await assertOwnedNoteFolder(c.env.DB, scope, user.id, body.parentFolderId))) {
        return c.json({ error: 'Parent folder not found' }, 404);
      }
      sets.push('parent_folder_id = ?');
      vals.push(body.parentFolderId);
    }
    if (body.sortOrder !== undefined) {
      sets.push('sort_order = ?');
      vals.push(body.sortOrder);
    }

    if (sets.length === 0) return c.json({ error: 'No fields to update' }, 400);

    sets.push("updated_at = datetime('now')");
    vals.push(folderId);

    await c.env.DB.prepare(`UPDATE ${noteFolderTable(scope)} SET ${sets.join(', ')} WHERE id = ?`)
      .bind(...vals)
      .run();

    const row = await getOwnedNoteFolder(c.env.DB, scope, user.id, folderId);
    if (!row) return c.json({ error: 'Not found' }, 404);

    return c.json({ folder: rowToFolder(row, scope) });
  });

  routes.delete(`${prefix}/note-folders/:folderId`, async (c) => {
    const scope = await resolveScope(c);
    if (isResponse(scope)) return scope;
    const folderId = c.req.param('folderId');
    const user = c.get('user') as AuthUser;
    const rateLimitError = await noteRateLimits.write(c, user.id);
    if (rateLimitError) return rateLimitError;

    const existing = await getOwnedNoteFolder(c.env.DB, scope, user.id, folderId);
    if (!existing) return c.json({ error: 'Not found' }, 404);

    if (existing.is_auto_generated === 1) {
      return c.json({ error: 'Cannot delete auto-generated folders' }, 400);
    }

    await c.env.DB.prepare(`DELETE FROM ${noteFolderTable(scope)} WHERE id = ?`).bind(folderId).run();
    return c.json({ ok: true });
  });

  // ── Note Routes ──

  routes.get(`${prefix}/notes`, async (c) => {
    const scope = await resolveScope(c);
    if (isResponse(scope)) return scope;
    const user = c.get('user') as AuthUser;

    const results = await c.env.DB.prepare(
      `SELECT * FROM ${noteTable(scope)} WHERE ${noteScopeWhere(scope)} ORDER BY sort_order ASC`,
    )
      .bind(...noteScopeBinds(scope, user.id))
      .all<NoteRow>();

    return c.json({ notes: results.results.map((row) => rowToNote(row, scope)) });
  });

  routes.get(`${prefix}/notes/search`, async (c) => {
    const scope = await resolveScope(c);
    if (isResponse(scope)) return scope;
    const user = c.get('user') as AuthUser;
    const q = normalizeNoteSearchQuery(c.req.query('q'));

    if (!q) return c.json({ notes: [] });

    const term = `%${escapeLikePattern(q)}%`;
    const results = await c.env.DB.prepare(
      `SELECT * FROM ${noteTable(scope)}
       WHERE ${noteScopeWhere(scope)} AND (title LIKE ? ESCAPE '\\' OR content LIKE ? ESCAPE '\\')
       ORDER BY updated_at DESC`,
    )
      .bind(...bindScope(scope, user.id, [term, term]))
      .all<NoteRow>();

    return c.json({ notes: results.results.map((row) => rowToNote(row, scope)) });
  });

  routes.post(`${prefix}/notes`, async (c) => {
    const user = c.get('user') as AuthUser;
    const rateLimitError = await noteRateLimits.write(c, user.id);
    if (rateLimitError) return rateLimitError;

    const raw = await readJsonBody<unknown>(c, { maxBytes: NOTE_LIMITS.jsonBodyBytes, label: 'Note' });
    if (!raw.ok) return jsonError(c, raw);
    const parsed = parseCreateNoteInput(raw.value);
    if (!parsed.ok) return jsonError(c, parsed);
    const body = parsed.value;
    const scope = await resolveScope(c, body.scope);
    if (isResponse(scope)) return scope;

    if (!(await assertOwnedNoteFolder(c.env.DB, scope, user.id, body.folderId))) {
      return c.json({ error: 'Folder not found' }, 404);
    }

    const maxOrder = await c.env.DB.prepare(
      `SELECT MAX(sort_order) as max_order FROM ${noteTable(scope)} WHERE folder_id = ?`,
    )
      .bind(body.folderId)
      .first<{ max_order: number | null }>();

    const id = crypto.randomUUID();
    const sortOrder = (maxOrder?.max_order ?? -1) + 1;

    if (scope.kind === 'campaign') {
      await c.env.DB.prepare(
        'INSERT INTO notes (id, campaign_id, user_id, scope, folder_id, title, content, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      )
        .bind(id, scope.campaignId, user.id, scope.audience, body.folderId, body.title, body.content ?? '', sortOrder)
        .run();
    } else {
      await c.env.DB.prepare(
        'INSERT INTO personal_notes (id, user_id, folder_id, title, content, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
      )
        .bind(id, user.id, body.folderId, body.title, body.content ?? '', sortOrder)
        .run();
    }

    const row = await getOwnedNote(c.env.DB, scope, user.id, id);
    if (!row) return c.json({ error: 'Failed to create note' }, 500);

    return c.json({ note: rowToNote(row, scope) }, 201);
  });

  routes.patch(`${prefix}/notes/:noteId`, async (c) => {
    const scope = await resolveScope(c);
    if (isResponse(scope)) return scope;
    const noteId = c.req.param('noteId');
    const user = c.get('user') as AuthUser;
    const rateLimitError = await noteRateLimits.write(c, user.id);
    if (rateLimitError) return rateLimitError;

    const raw = await readJsonBody<unknown>(c, { maxBytes: NOTE_LIMITS.jsonBodyBytes, label: 'Note update' });
    if (!raw.ok) return jsonError(c, raw);
    const parsed = parseUpdateNoteInput(raw.value);
    if (!parsed.ok) return jsonError(c, parsed);
    const body = parsed.value;

    const existing = await getOwnedNote(c.env.DB, scope, user.id, noteId);
    if (!existing) return c.json({ error: 'Not found' }, 404);

    const sets: string[] = [];
    const vals: unknown[] = [];

    if (body.title !== undefined) {
      sets.push('title = ?');
      vals.push(body.title);
    }
    if (body.content !== undefined) {
      sets.push('content = ?');
      vals.push(body.content);
    }
    if (body.folderId !== undefined) {
      if (!(await assertOwnedNoteFolder(c.env.DB, scope, user.id, body.folderId))) {
        return c.json({ error: 'Folder not found' }, 404);
      }
      sets.push('folder_id = ?');
      vals.push(body.folderId);
    }
    if (body.sortOrder !== undefined) {
      sets.push('sort_order = ?');
      vals.push(body.sortOrder);
    }

    if (sets.length === 0) return c.json({ error: 'No fields to update' }, 400);

    sets.push("updated_at = datetime('now')");
    vals.push(noteId);

    await c.env.DB.prepare(`UPDATE ${noteTable(scope)} SET ${sets.join(', ')} WHERE id = ?`)
      .bind(...vals)
      .run();

    const row = await getOwnedNote(c.env.DB, scope, user.id, noteId);
    if (!row) return c.json({ error: 'Not found' }, 404);

    return c.json({ note: rowToNote(row, scope) });
  });

  routes.delete(`${prefix}/notes/:noteId`, async (c) => {
    const scope = await resolveScope(c);
    if (isResponse(scope)) return scope;
    const noteId = c.req.param('noteId');
    const user = c.get('user') as AuthUser;
    const rateLimitError = await noteRateLimits.write(c, user.id);
    if (rateLimitError) return rateLimitError;

    const existing = await getOwnedNote(c.env.DB, scope, user.id, noteId);
    if (!existing) return c.json({ error: 'Not found' }, 404);

    await c.env.DB.prepare(`DELETE FROM ${noteTable(scope)} WHERE id = ?`).bind(noteId).run();
    return c.json({ ok: true });
  });

  routes.put(`${prefix}/notes/reorder`, async (c) => {
    const scope = await resolveScope(c);
    if (isResponse(scope)) return scope;
    const user = c.get('user') as AuthUser;
    const rateLimitError = await noteRateLimits.write(c, user.id);
    if (rateLimitError) return rateLimitError;

    const raw = await readJsonBody<unknown>(c, { maxBytes: NOTE_LIMITS.jsonBodyBytes, label: 'Reorder request' });
    if (!raw.ok) return jsonError(c, raw);
    const parsed = parseReorderNotesInput(raw.value);
    if (!parsed.ok) return jsonError(c, parsed);
    const body = parsed.value;

    const stmts: D1PreparedStatement[] = [];

    for (const item of body.items) {
      if (item.folderId !== undefined) {
        if (!(await assertOwnedNoteFolder(c.env.DB, scope, user.id, item.folderId))) {
          return c.json({ error: 'Folder not found' }, 404);
        }
        stmts.push(
          c.env.DB.prepare(
            `UPDATE ${noteTable(scope)}
             SET sort_order = ?, folder_id = ?, updated_at = datetime('now')
             WHERE id = ? AND ${noteScopeWhere(scope)}`,
          ).bind(item.sortOrder, item.folderId, item.id, ...noteScopeBinds(scope, user.id)),
        );
      } else if (item.parentFolderId !== undefined) {
        if (item.parentFolderId === item.id) return c.json({ error: 'Folder cannot be its own parent' }, 400);
        if (item.parentFolderId && !(await assertOwnedNoteFolder(c.env.DB, scope, user.id, item.parentFolderId))) {
          return c.json({ error: 'Parent folder not found' }, 404);
        }
        stmts.push(
          c.env.DB.prepare(
            `UPDATE ${noteFolderTable(scope)}
             SET sort_order = ?, parent_folder_id = ?, updated_at = datetime('now')
             WHERE id = ? AND ${noteScopeWhere(scope)}`,
          ).bind(item.sortOrder, item.parentFolderId, item.id, ...noteScopeBinds(scope, user.id)),
        );
      } else {
        stmts.push(
          c.env.DB.prepare(
            `UPDATE ${noteTable(scope)}
             SET sort_order = ?, updated_at = datetime('now')
             WHERE id = ? AND ${noteScopeWhere(scope)}`,
          ).bind(item.sortOrder, item.id, ...noteScopeBinds(scope, user.id)),
        );
        stmts.push(
          c.env.DB.prepare(
            `UPDATE ${noteFolderTable(scope)}
             SET sort_order = ?, updated_at = datetime('now')
             WHERE id = ? AND ${noteScopeWhere(scope)}`,
          ).bind(item.sortOrder, item.id, ...noteScopeBinds(scope, user.id)),
        );
      }
    }

    await c.env.DB.batch(stmts);
    return c.json({ ok: true });
  });
}

registerNoteHandlers(noteRoutes, '/:campaignId', resolveCampaignNoteScope);
registerNoteHandlers(personalNoteRoutes, '/personal', () => personalNoteScope);
