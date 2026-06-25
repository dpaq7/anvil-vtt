import { Hono } from 'hono';
import type { AppEnv, AuthUser } from '../types.js';
import { authMiddleware } from '../middleware/auth.js';
import {
  requireSceneDirector,
  requireSceneMember,
  requireSessionDirector,
  requireSessionMember,
} from '../lib/access.js';
import { sceneRateLimits } from '../security/rate-limits.js';

export const sceneRoutes = new Hono<AppEnv>();

sceneRoutes.use('/*', authMiddleware);

// List scenes for a session
sceneRoutes.get('/sessions/:sessionId/scenes', async (c) => {
  const user = c.get('user') as AuthUser;
  const sessionId = c.req.param('sessionId');
  const accessError = await requireSessionMember(c, sessionId, user);
  if (accessError) return accessError;

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

  const limited = await sceneRateLimits.write(c, user.id);
  if (limited) return limited;

  const accessError = await requireSessionDirector(c, sessionId, user);
  if (accessError) return accessError;

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
  const user = c.get('user') as AuthUser;
  const sceneId = c.req.param('id');
  const accessError = await requireSceneMember(c, sceneId, user);
  if (accessError) return accessError;

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

  const limited = await sceneRateLimits.write(c, user.id);
  if (limited) return limited;

  const accessError = await requireSceneDirector(c, sceneId, user);
  if (accessError) return accessError;

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

  const limited = await sceneRateLimits.write(c, user.id);
  if (limited) return limited;

  const accessError = await requireSceneDirector(c, sceneId, user);
  if (accessError) return accessError;

  await c.env.DB.prepare("UPDATE scenes SET deleted_at = datetime('now') WHERE id = ?")
    .bind(sceneId)
    .run();

  return c.json({ ok: true });
});
