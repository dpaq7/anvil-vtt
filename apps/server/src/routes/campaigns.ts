import { Hono } from 'hono';
import type { AppEnv, AuthUser } from '../types.js';
import { authMiddleware } from '../middleware/auth.js';
import { ensureMcdmDemoCampaignForUser } from '../lib/demo-campaigns.js';
import { campaignRateLimits } from '../security/rate-limits.js';

export const campaignRoutes = new Hono<AppEnv>();

campaignRoutes.use('/*', authMiddleware);

interface CampaignCreateBody {
  name: string;
  description?: string;
  sourceModuleIds?: string[];
  sourceSceneIds?: string[];
}

interface SourceModuleRow {
  id: string;
  name: string;
  description: string | null;
}

interface SourceSessionRow {
  id: string;
  name: string;
  description: string | null;
  order_index: number;
}

interface SourceSceneRow {
  id: string;
  game_session_id: string;
  module_id: string | null;
  title: string;
  type: string;
  data: string | null;
  order_index: number;
}

interface LibraryModuleRow {
  id: string;
  name: string;
  campaign_name: string;
  session_count: number;
  scene_count: number;
}

interface LibrarySceneRow {
  id: string;
  title: string;
  type: string;
  campaign_name: string;
  module_name: string | null;
  session_name: string;
}

async function nextCampaignOrder(db: D1Database, table: 'modules' | 'game_sessions', campaignId: string): Promise<number> {
  const row = await db.prepare(
    `SELECT MAX(order_index) as max_idx FROM ${table} WHERE campaign_id = ?`,
  )
    .bind(campaignId)
    .first<{ max_idx: number | null }>();
  return (row?.max_idx ?? -1) + 1;
}

function buildSceneInsertStatements(
  db: D1Database,
  targetSessionId: string,
  scenes: SourceSceneRow[],
): D1PreparedStatement[] {
  return scenes.map((scene, index) =>
    db.prepare(
      'INSERT INTO scenes (id, game_session_id, title, type, data, order_index) VALUES (?, ?, ?, ?, ?, ?)',
    ).bind(crypto.randomUUID(), targetSessionId, scene.title, scene.type, scene.data ?? '{}', index),
  );
}

// Gather the INSERT statements that clone the selected modules/scenes into a
// new campaign. All reads happen up front; the returned statements are executed
// together in one db.batch() so the clone is atomic.
async function collectCopyStatements(
  db: D1Database,
  userId: string,
  targetCampaignId: string,
  sourceModuleIds: string[],
  sourceSceneIds: string[],
): Promise<D1PreparedStatement[]> {
  const uniqueModuleIds = [...new Set(sourceModuleIds.filter(Boolean))];
  const uniqueSceneIds = [...new Set(sourceSceneIds.filter(Boolean))];
  let moduleOrder = await nextCampaignOrder(db, 'modules', targetCampaignId);
  let sessionOrder = await nextCampaignOrder(db, 'game_sessions', targetCampaignId);
  const statements: D1PreparedStatement[] = [];

  for (const sourceModuleId of uniqueModuleIds) {
    const module = await db.prepare(
      `SELECT m.id, m.name, m.description
       FROM modules m
       JOIN campaigns c ON c.id = m.campaign_id
       JOIN campaign_members cm ON cm.campaign_id = c.id AND cm.user_id = ?
       WHERE m.id = ? AND c.deleted_at IS NULL`,
    )
      .bind(userId, sourceModuleId)
      .first<SourceModuleRow>();
    if (!module) continue;

    const newModuleId = crypto.randomUUID();
    statements.push(
      db.prepare(
        'INSERT INTO modules (id, campaign_id, name, description, order_index) VALUES (?, ?, ?, ?, ?)',
      ).bind(newModuleId, targetCampaignId, module.name, module.description ?? '', moduleOrder),
    );
    moduleOrder += 1;

    const sourceSessions = await db.prepare(
      `SELECT id, name, description, order_index
       FROM game_sessions
       WHERE module_id = ?
       ORDER BY order_index`,
    )
      .bind(sourceModuleId)
      .all<SourceSessionRow>();

    for (const sourceSession of sourceSessions.results) {
      const newSessionId = crypto.randomUUID();
      statements.push(
        db.prepare(
          'INSERT INTO game_sessions (id, campaign_id, module_id, name, description, order_index) VALUES (?, ?, ?, ?, ?, ?)',
        ).bind(newSessionId, targetCampaignId, newModuleId, sourceSession.name, sourceSession.description ?? '', sessionOrder),
      );
      sessionOrder += 1;

      const sourceScenes = await db.prepare(
        `SELECT s.id, s.game_session_id, gs.module_id, s.title, s.type, s.data, s.order_index
         FROM scenes s
         JOIN game_sessions gs ON gs.id = s.game_session_id
         WHERE s.game_session_id = ? AND s.deleted_at IS NULL
         ORDER BY s.order_index`,
      )
        .bind(sourceSession.id)
        .all<SourceSceneRow>();
      statements.push(...buildSceneInsertStatements(db, newSessionId, sourceScenes.results));
    }
  }

  const standaloneScenes: SourceSceneRow[] = [];
  for (const sourceSceneId of uniqueSceneIds) {
    const scene = await db.prepare(
      `SELECT s.id, s.game_session_id, gs.module_id, s.title, s.type, s.data, s.order_index
       FROM scenes s
       JOIN game_sessions gs ON gs.id = s.game_session_id
       JOIN campaigns c ON c.id = gs.campaign_id
       JOIN campaign_members cm ON cm.campaign_id = c.id AND cm.user_id = ?
       WHERE s.id = ? AND s.deleted_at IS NULL AND c.deleted_at IS NULL`,
    )
      .bind(userId, sourceSceneId)
      .first<SourceSceneRow>();
    if (!scene) continue;
    if (scene.module_id && uniqueModuleIds.includes(scene.module_id)) continue;
    standaloneScenes.push(scene);
  }

  if (standaloneScenes.length > 0) {
    const newSessionId = crypto.randomUUID();
    statements.push(
      db.prepare(
        'INSERT INTO game_sessions (id, campaign_id, module_id, name, description, order_index) VALUES (?, ?, ?, ?, ?, ?)',
      ).bind(newSessionId, targetCampaignId, null, 'Selected Scenes', '', sessionOrder),
    );
    statements.push(...buildSceneInsertStatements(db, newSessionId, standaloneScenes));
  }

  return statements;
}

// List campaigns for current user (as director or member)
campaignRoutes.get('/', async (c) => {
  const user = c.get('user') as AuthUser;

  if (user.role === 'director') {
    await ensureMcdmDemoCampaignForUser(c.env.DB, user.id);
  }

  const directed =
    user.role === 'director'
      ? await c.env.DB.prepare(
          `SELECT id, name, description, cover_image_url, settings, created_at, updated_at
           FROM campaigns WHERE director_id = ? AND deleted_at IS NULL ORDER BY updated_at DESC`,
        )
          .bind(user.id)
          .all()
      : { results: [] };

  const joined = await c.env.DB.prepare(
    `SELECT c.id, c.name, c.description, c.cover_image_url, c.settings, c.created_at, c.updated_at, cm.role
     FROM campaign_members cm JOIN campaigns c ON cm.campaign_id = c.id
     WHERE cm.user_id = ? AND c.deleted_at IS NULL AND cm.role = 'player'
     ORDER BY c.updated_at DESC`,
  )
    .bind(user.id)
    .all();

  return c.json({ directed: directed.results, joined: joined.results });
});

// Create campaign
campaignRoutes.post('/', async (c) => {
  const user = c.get('user') as AuthUser;
  const limited = await campaignRateLimits.write(c, user.id);
  if (limited) return limited;
  const body = await c.req.json<CampaignCreateBody>();

  if (!body.name?.trim()) {
    return c.json({ error: 'Name is required' }, 400);
  }

  const id = crypto.randomUUID();
  const db = c.env.DB;

  // Membership-checked source lookups happen first, then every write runs in a
  // single atomic batch: a failure part-way through the clone can no longer
  // leave an orphaned, half-initialized campaign behind.
  const copyStatements = await collectCopyStatements(
    db,
    user.id,
    id,
    Array.isArray(body.sourceModuleIds) ? body.sourceModuleIds : [],
    Array.isArray(body.sourceSceneIds) ? body.sourceSceneIds : [],
  );

  await db.batch([
    db.prepare('INSERT INTO campaigns (id, director_id, name, description) VALUES (?, ?, ?, ?)')
      .bind(id, user.id, body.name.trim(), body.description?.trim() ?? ''),
    db.prepare('INSERT INTO campaign_members (campaign_id, user_id, role) VALUES (?, ?, ?)')
      .bind(id, user.id, 'director'),
    ...copyStatements,
  ]);

  return c.json({ id }, 201);
});

// Prepared-state library for copying existing modules/scenes into new campaigns.
// This intentionally returns/copies scene.data only, never scenes.snapshot.
campaignRoutes.get('/library', async (c) => {
  const user = c.get('user') as AuthUser;

  if (user.role === 'director') {
    await ensureMcdmDemoCampaignForUser(c.env.DB, user.id);
  }

  const modules = await c.env.DB.prepare(
    `SELECT m.id, m.name, c.name as campaign_name,
            COUNT(DISTINCT gs.id) as session_count,
            COUNT(DISTINCT s.id) as scene_count
     FROM modules m
     JOIN campaigns c ON c.id = m.campaign_id
     JOIN campaign_members cm ON cm.campaign_id = c.id AND cm.user_id = ?
     LEFT JOIN game_sessions gs ON gs.module_id = m.id
     LEFT JOIN scenes s ON s.game_session_id = gs.id AND s.deleted_at IS NULL
     WHERE c.deleted_at IS NULL
     GROUP BY m.id
     ORDER BY c.updated_at DESC, m.order_index`,
  )
    .bind(user.id)
    .all<LibraryModuleRow>();

  const scenes = await c.env.DB.prepare(
    `SELECT s.id, s.title, s.type, c.name as campaign_name,
            m.name as module_name, gs.name as session_name
     FROM scenes s
     JOIN game_sessions gs ON gs.id = s.game_session_id
     JOIN campaigns c ON c.id = gs.campaign_id
     JOIN campaign_members cm ON cm.campaign_id = c.id AND cm.user_id = ?
     LEFT JOIN modules m ON m.id = gs.module_id
     WHERE c.deleted_at IS NULL AND s.deleted_at IS NULL
     ORDER BY c.updated_at DESC, gs.order_index, s.order_index`,
  )
    .bind(user.id)
    .all<LibrarySceneRow>();

  return c.json({ modules: modules.results, scenes: scenes.results });
});

// Get campaign
campaignRoutes.get('/:id', async (c) => {
  const user = c.get('user') as AuthUser;
  const campaignId = c.req.param('id');

  const campaign = await c.env.DB.prepare(
    'SELECT * FROM campaigns WHERE id = ? AND deleted_at IS NULL',
  )
    .bind(campaignId)
    .first();

  if (!campaign) return c.json({ error: 'Not found' }, 404);

  // Check membership
  const member = await c.env.DB.prepare(
    'SELECT role FROM campaign_members WHERE campaign_id = ? AND user_id = ?',
  )
    .bind(campaignId, user.id)
    .first();

  if (!member) return c.json({ error: 'Forbidden' }, 403);

  const members = await c.env.DB.prepare(
    `SELECT cm.user_id, cm.role, cm.hero_id, u.username, u.avatar_url
     FROM campaign_members cm JOIN users u ON cm.user_id = u.id
     WHERE cm.campaign_id = ?`,
  )
    .bind(campaignId)
    .all();

  return c.json({ campaign, members: members.results, role: member['role'] });
});

// Update campaign
campaignRoutes.put('/:id', async (c) => {
  const user = c.get('user') as AuthUser;
  const campaignId = c.req.param('id');

  const campaign = await c.env.DB.prepare(
    'SELECT director_id FROM campaigns WHERE id = ? AND deleted_at IS NULL',
  )
    .bind(campaignId)
    .first<{ director_id: string }>();

  if (!campaign) return c.json({ error: 'Not found' }, 404);
  if (campaign.director_id !== user.id) return c.json({ error: 'Forbidden' }, 403);

  const body = await c.req.json<{ name?: string; description?: string; settings?: string }>();

  const sets: string[] = [];
  const vals: unknown[] = [];

  if (body.name !== undefined) { sets.push('name = ?'); vals.push(body.name.trim()); }
  if (body.description !== undefined) { sets.push('description = ?'); vals.push(body.description.trim()); }
  if (body.settings !== undefined) { sets.push('settings = ?'); vals.push(body.settings); }

  if (sets.length === 0) return c.json({ error: 'No fields to update' }, 400);

  sets.push("updated_at = datetime('now')");
  vals.push(campaignId);

  await c.env.DB.prepare(`UPDATE campaigns SET ${sets.join(', ')} WHERE id = ?`)
    .bind(...vals)
    .run();

  return c.json({ ok: true });
});

// Remove a member from a campaign (director only). Revokes membership, drops
// the user from this campaign's sessions, and invalidates any unused WebSocket
// tokens so a removed player loses access immediately rather than keeping it
// until their current token expires.
campaignRoutes.delete('/:campaignId/members/:userId', async (c) => {
  const user = c.get('user') as AuthUser;
  const campaignId = c.req.param('campaignId');
  const targetUserId = c.req.param('userId');

  const campaign = await c.env.DB.prepare(
    'SELECT director_id FROM campaigns WHERE id = ? AND deleted_at IS NULL',
  )
    .bind(campaignId)
    .first<{ director_id: string }>();
  if (!campaign) return c.json({ error: 'Not found' }, 404);
  if (campaign.director_id !== user.id) return c.json({ error: 'Forbidden' }, 403);
  if (targetUserId === campaign.director_id) {
    return c.json({ error: 'Cannot remove the campaign director' }, 400);
  }

  const db = c.env.DB;
  await db.batch([
    db.prepare('DELETE FROM campaign_members WHERE campaign_id = ? AND user_id = ?')
      .bind(campaignId, targetUserId),
    db.prepare(
      `DELETE FROM session_participants
       WHERE user_id = ? AND game_session_id IN (SELECT id FROM game_sessions WHERE campaign_id = ?)`,
    ).bind(targetUserId, campaignId),
    db.prepare('DELETE FROM ws_tokens WHERE user_id = ? AND campaign_id = ?')
      .bind(targetUserId, campaignId),
  ]);

  return c.json({ ok: true });
});

// Soft delete campaign
campaignRoutes.delete('/:id', async (c) => {
  const user = c.get('user') as AuthUser;
  const campaignId = c.req.param('id');

  const campaign = await c.env.DB.prepare(
    'SELECT director_id FROM campaigns WHERE id = ? AND deleted_at IS NULL',
  )
    .bind(campaignId)
    .first<{ director_id: string }>();

  if (!campaign) return c.json({ error: 'Not found' }, 404);
  if (campaign.director_id !== user.id) return c.json({ error: 'Forbidden' }, 403);

  await c.env.DB.prepare("UPDATE campaigns SET deleted_at = datetime('now') WHERE id = ?")
    .bind(campaignId)
    .run();

  return c.json({ ok: true });
});
