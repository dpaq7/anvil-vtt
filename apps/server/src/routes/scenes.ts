import { Hono } from 'hono';
import type { AppEnv, AuthUser } from '../types.js';
import { authMiddleware } from '../middleware/auth.js';

export const sceneRoutes = new Hono<AppEnv>();

sceneRoutes.use('/*', authMiddleware);

// List scenes for a session
sceneRoutes.get('/sessions/:sessionId/scenes', async (c) => {
  const sessionId = c.req.param('sessionId');
  const results = await c.env.DB.prepare(
    'SELECT * FROM scenes WHERE game_session_id = ? AND deleted_at IS NULL ORDER BY order_index',
  )
    .bind(sessionId)
    .all();
  return c.json({ scenes: results.results });
});

// Create scene
sceneRoutes.post('/sessions/:sessionId/scenes', async (c) => {
  const user = c.get('user') as AuthUser;
  const sessionId = c.req.param('sessionId');

  // Verify director
  const session = await c.env.DB.prepare(
    `SELECT gs.*, c.director_id FROM game_sessions gs JOIN campaigns c ON gs.campaign_id = c.id WHERE gs.id = ?`,
  )
    .bind(sessionId)
    .first<{ director_id: string }>();
  if (!session || session.director_id !== user.id) return c.json({ error: 'Forbidden' }, 403);

  const body = await c.req.json<{ title: string; type: string; data?: string }>();
  if (!body.title?.trim()) return c.json({ error: 'Title is required' }, 400);

  const validTypes = ['battle', 'story', 'montage', 'negotiation', 'respite'];
  if (!validTypes.includes(body.type)) return c.json({ error: 'Invalid scene type' }, 400);

  const last = await c.env.DB.prepare(
    'SELECT MAX(order_index) as max_idx FROM scenes WHERE game_session_id = ? AND deleted_at IS NULL',
  )
    .bind(sessionId)
    .first<{ max_idx: number | null }>();

  const id = crypto.randomUUID();
  await c.env.DB.prepare(
    'INSERT INTO scenes (id, game_session_id, title, type, data, order_index) VALUES (?, ?, ?, ?, ?, ?)',
  )
    .bind(id, sessionId, body.title.trim(), body.type, body.data ?? '{}', (last?.max_idx ?? -1) + 1)
    .run();

  return c.json({ id }, 201);
});

// Get scene
sceneRoutes.get('/scenes/:id', async (c) => {
  const sceneId = c.req.param('id');
  const scene = await c.env.DB.prepare('SELECT * FROM scenes WHERE id = ? AND deleted_at IS NULL')
    .bind(sceneId)
    .first();
  if (!scene) return c.json({ error: 'Not found' }, 404);
  return c.json({ scene });
});

// Update scene
sceneRoutes.put('/scenes/:id', async (c) => {
  const user = c.get('user') as AuthUser;
  const sceneId = c.req.param('id');

  const scene = await c.env.DB.prepare(
    `SELECT s.*, c.director_id FROM scenes s
     JOIN game_sessions gs ON s.game_session_id = gs.id
     JOIN campaigns c ON gs.campaign_id = c.id
     WHERE s.id = ? AND s.deleted_at IS NULL`,
  )
    .bind(sceneId)
    .first<{ director_id: string }>();
  if (!scene || scene.director_id !== user.id) return c.json({ error: 'Forbidden' }, 403);

  const body = await c.req.json<{ title?: string; data?: string; order_index?: number }>();
  const sets: string[] = [];
  const vals: unknown[] = [];

  if (body.title !== undefined) { sets.push('title = ?'); vals.push(body.title.trim()); }
  if (body.data !== undefined) { sets.push('data = ?'); vals.push(body.data); }
  if (body.order_index !== undefined) { sets.push('order_index = ?'); vals.push(body.order_index); }

  if (sets.length === 0) return c.json({ error: 'No fields' }, 400);
  vals.push(sceneId);

  await c.env.DB.prepare(`UPDATE scenes SET ${sets.join(', ')} WHERE id = ?`)
    .bind(...vals)
    .run();

  return c.json({ ok: true });
});

// Soft delete scene
sceneRoutes.delete('/scenes/:id', async (c) => {
  const user = c.get('user') as AuthUser;
  const sceneId = c.req.param('id');

  const scene = await c.env.DB.prepare(
    `SELECT s.*, c.director_id FROM scenes s
     JOIN game_sessions gs ON s.game_session_id = gs.id
     JOIN campaigns c ON gs.campaign_id = c.id
     WHERE s.id = ? AND s.deleted_at IS NULL`,
  )
    .bind(sceneId)
    .first<{ director_id: string }>();
  if (!scene || scene.director_id !== user.id) return c.json({ error: 'Forbidden' }, 403);

  await c.env.DB.prepare("UPDATE scenes SET deleted_at = datetime('now') WHERE id = ?")
    .bind(sceneId)
    .run();

  return c.json({ ok: true });
});
