import { Hono } from 'hono';
import type { Context } from 'hono';
import type {
  SceneImportDocument,
  SceneImportModule,
  SceneImportRequest,
  SceneImportResult,
  SceneImportScene,
  SceneImportSession,
  SceneType,
} from '@anvil/types';
import { SCENE_IMPORT_FORMAT } from '@anvil/types';
import type { AppEnv, AuthUser } from '../types.js';
import { authMiddleware } from '../middleware/auth.js';

export const sceneImportRoutes = new Hono<AppEnv>();

sceneImportRoutes.use('/*', authMiddleware);

const VALID_SCENE_TYPES = new Set<SceneType>(['battle', 'story', 'montage', 'negotiation', 'respite']);

interface ImportIds {
  moduleIds: string[];
  sessionIds: string[];
  sceneIds: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function ordered<T extends { orderIndex?: number }>(items: T[] | undefined): T[] {
  return (items ?? [])
    .map((item, index) => ({ item, index }))
    .sort((a, b) => (a.item.orderIndex ?? a.index) - (b.item.orderIndex ?? b.index))
    .map(({ item }) => item);
}

function normalizeImportBody(raw: unknown): { document?: SceneImportDocument; error?: string } {
  const maybeRequest = isRecord(raw) && isRecord(raw['document'])
    ? raw as unknown as SceneImportRequest
    : { document: raw } as SceneImportRequest;
  const document = maybeRequest.document;

  if (!isRecord(document)) return { error: 'Import document must be a JSON object' };
  if (document['format'] !== SCENE_IMPORT_FORMAT) return { error: `Unsupported import format: expected ${SCENE_IMPORT_FORMAT}` };
  if (document['version'] !== 1) return { error: 'Unsupported scene import version' };

  const campaign = document['campaign'];
  if (!isRecord(campaign) || !nonEmptyString(campaign['name'])) {
    return { error: 'Campaign name is required' };
  }

  const modules = document['modules'];
  const sessions = document['sessions'];
  if (modules !== undefined && !Array.isArray(modules)) return { error: 'modules must be an array' };
  if (sessions !== undefined && !Array.isArray(sessions)) return { error: 'sessions must be an array' };

  for (const module of (Array.isArray(modules) ? modules : [])) {
    const error = validateModule(module);
    if (error) return { error };
  }
  for (const session of (Array.isArray(sessions) ? sessions : [])) {
    const error = validateSession(session);
    if (error) return { error };
  }

  const moduleCount = Array.isArray(modules) ? modules.length : 0;
  const sessionCount = Array.isArray(sessions) ? sessions.length : 0;
  if (moduleCount + sessionCount === 0) return { error: 'Import document must contain at least one module or session' };

  return { document: document as SceneImportDocument };
}

function validateModule(value: unknown): string | null {
  if (!isRecord(value)) return 'Each module must be an object';
  if (!nonEmptyString(value['name'])) return 'Module name is required';
  if (!Array.isArray(value['sessions'])) return 'Module sessions must be an array';
  if (value['sessions'].length === 0) return 'Each imported module must contain at least one session';
  for (const session of value['sessions']) {
    const error = validateSession(session);
    if (error) return error;
  }
  return null;
}

function validateSession(value: unknown): string | null {
  if (!isRecord(value)) return 'Each session must be an object';
  if (!nonEmptyString(value['name'])) return 'Session name is required';
  if (!Array.isArray(value['scenes'])) return 'Session scenes must be an array';
  if (value['scenes'].length === 0) return 'Each imported session must contain at least one scene';
  for (const scene of value['scenes']) {
    const error = validateScene(scene);
    if (error) return error;
  }
  return null;
}

function validateScene(value: unknown): string | null {
  if (!isRecord(value)) return 'Each scene must be an object';
  if (!nonEmptyString(value['title'])) return 'Scene title is required';
  if (!VALID_SCENE_TYPES.has(value['type'] as SceneType)) return `Invalid scene type: ${String(value['type'])}`;
  if (value['data'] !== undefined && !isRecord(value['data'])) return 'Scene data must be an object';
  return null;
}

async function assertCampaignDirector(c: Context<AppEnv>, campaignId: string, userId: string): Promise<boolean> {
  const campaign = await c.env.DB.prepare(
    'SELECT director_id FROM campaigns WHERE id = ? AND deleted_at IS NULL',
  )
    .bind(campaignId)
    .first<{ director_id: string }>();
  return campaign?.director_id === userId;
}

async function nextOrder(c: Context<AppEnv>, table: 'modules' | 'game_sessions', whereColumn: string, whereValue: string): Promise<number> {
  const row = await c.env.DB.prepare(
    `SELECT MAX(order_index) as max_idx FROM ${table} WHERE ${whereColumn} = ?`,
  )
    .bind(whereValue)
    .first<{ max_idx: number | null }>();
  return (row?.max_idx ?? -1) + 1;
}

async function insertImportedScene(c: Context<AppEnv>, sessionId: string, scene: SceneImportScene, orderIndex: number): Promise<string> {
  const id = crypto.randomUUID();
  await c.env.DB.prepare(
    'INSERT INTO scenes (id, game_session_id, title, type, data, order_index) VALUES (?, ?, ?, ?, ?, ?)',
  )
    .bind(id, sessionId, scene.title.trim(), scene.type, JSON.stringify(scene.data ?? {}), orderIndex)
    .run();
  return id;
}

async function insertImportedSession(
  c: Context<AppEnv>,
  campaignId: string,
  moduleId: string | null,
  session: SceneImportSession,
  orderIndex: number,
  ids: ImportIds,
): Promise<void> {
  const id = crypto.randomUUID();
  await c.env.DB.prepare(
    'INSERT INTO game_sessions (id, campaign_id, module_id, name, description, order_index) VALUES (?, ?, ?, ?, ?, ?)',
  )
    .bind(id, campaignId, moduleId, session.name.trim(), session.description?.trim() ?? '', orderIndex)
    .run();
  ids.sessionIds.push(id);

  for (const [index, scene] of ordered(session.scenes).entries()) {
    ids.sceneIds.push(await insertImportedScene(c, id, scene, index));
  }
}

async function insertImportedModule(
  c: Context<AppEnv>,
  campaignId: string,
  module: SceneImportModule,
  moduleOrderIndex: number,
  sessionOrderStart: number,
  ids: ImportIds,
): Promise<number> {
  const id = crypto.randomUUID();
  await c.env.DB.prepare(
    'INSERT INTO modules (id, campaign_id, name, description, order_index) VALUES (?, ?, ?, ?, ?)',
  )
    .bind(id, campaignId, module.name.trim(), module.description?.trim() ?? '', moduleOrderIndex)
    .run();
  ids.moduleIds.push(id);

  let nextSessionOrder = sessionOrderStart;
  for (const session of ordered(module.sessions)) {
    await insertImportedSession(c, campaignId, id, session, nextSessionOrder, ids);
    nextSessionOrder += 1;
  }
  return nextSessionOrder;
}

async function importIntoCampaign(c: Context<AppEnv>, campaignId: string, document: SceneImportDocument): Promise<ImportIds> {
  const ids: ImportIds = { moduleIds: [], sessionIds: [], sceneIds: [] };
  let moduleOrder = await nextOrder(c, 'modules', 'campaign_id', campaignId);
  let sessionOrder = await nextOrder(c, 'game_sessions', 'campaign_id', campaignId);

  for (const module of ordered(document.modules)) {
    sessionOrder = await insertImportedModule(c, campaignId, module, moduleOrder, sessionOrder, ids);
    moduleOrder += 1;
  }

  for (const session of ordered(document.sessions)) {
    await insertImportedSession(c, campaignId, null, session, sessionOrder, ids);
    sessionOrder += 1;
  }

  return ids;
}

function result(campaignId: string, ids: ImportIds): SceneImportResult {
  return {
    campaignId,
    moduleIds: ids.moduleIds,
    sessionIds: ids.sessionIds,
    sceneIds: ids.sceneIds,
    imported: {
      modules: ids.moduleIds.length,
      sessions: ids.sessionIds.length,
      scenes: ids.sceneIds.length,
    },
  };
}

sceneImportRoutes.post('/import', async (c) => {
  const user = c.get('user') as AuthUser;
  const raw = await c.req.json().catch(() => null);
  const parsed = normalizeImportBody(raw);
  if (!parsed.document) return c.json({ error: parsed.error ?? 'Invalid import document' }, 400);

  const campaignId = crypto.randomUUID();
  await c.env.DB.prepare(
    'INSERT INTO campaigns (id, director_id, name, description, settings) VALUES (?, ?, ?, ?, ?)',
  )
    .bind(
      campaignId,
      user.id,
      parsed.document.campaign.name.trim(),
      parsed.document.campaign.description?.trim() ?? '',
      JSON.stringify(parsed.document.campaign.settings ?? {}),
    )
    .run();

  await c.env.DB.prepare(
    'INSERT INTO campaign_members (campaign_id, user_id, role) VALUES (?, ?, ?)',
  )
    .bind(campaignId, user.id, 'director')
    .run();

  const ids = await importIntoCampaign(c, campaignId, parsed.document);
  return c.json(result(campaignId, ids), 201);
});

sceneImportRoutes.post('/:campaignId/import', async (c) => {
  const user = c.get('user') as AuthUser;
  const campaignId = c.req.param('campaignId');
  if (!(await assertCampaignDirector(c, campaignId, user.id))) return c.json({ error: 'Forbidden' }, 403);

  const raw = await c.req.json().catch(() => null);
  const parsed = normalizeImportBody(raw);
  if (!parsed.document) return c.json({ error: parsed.error ?? 'Invalid import document' }, 400);

  const ids = await importIntoCampaign(c, campaignId, parsed.document);
  return c.json(result(campaignId, ids), 201);
});
