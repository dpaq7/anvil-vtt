import { Hono } from 'hono';
import type { AppEnv, AuthUser } from '../types.js';
import { authMiddleware } from '../middleware/auth.js';
import { getSessionCookie } from '../middleware/auth.js';

export const sessionRoutes = new Hono<AppEnv>();

sessionRoutes.use('/*', authMiddleware);

// Lookup session by room code (public — no auth needed for the lookup itself)
sessionRoutes.get('/sessions/by-code/:code', async (c) => {
  const code = c.req.param('code').toUpperCase();
  const session = await c.env.DB.prepare(
    `SELECT gs.id, gs.name, gs.campaign_id, gs.status, c.name as campaign_name
     FROM game_sessions gs JOIN campaigns c ON gs.campaign_id = c.id
     WHERE gs.room_code = ? AND gs.status IN ('lobby', 'active')`,
  )
    .bind(code)
    .first<{ id: string; name: string; campaign_id: string; status: string; campaign_name: string }>();
  if (!session) return c.json({ error: 'Invalid room code' }, 404);
  return c.json({ session });
});

// WebSocket upgrade — forwards to SessionRoom DO
sessionRoutes.get('/sessions/:id/ws', async (c) => {
  const user = c.get('user') as AuthUser;
  const sessionId = c.req.param('id');

  // Verify session exists and user is a campaign member
  const session = await c.env.DB.prepare(
    `SELECT gs.id, gs.campaign_id, gs.status, c.director_id
     FROM game_sessions gs JOIN campaigns c ON gs.campaign_id = c.id WHERE gs.id = ?`,
  )
    .bind(sessionId)
    .first<{ id: string; campaign_id: string; status: string; director_id: string }>();
  if (!session) return c.json({ error: 'Not found' }, 404);
  if (session.status !== 'lobby' && session.status !== 'active') {
    return c.json({ error: 'Session not active' }, 400);
  }

  const role = session.director_id === user.id ? 'director' : 'player';

  // Forward to Durable Object
  const doId = c.env.SESSION_ROOM.idFromName(sessionId);
  const stub = c.env.SESSION_ROOM.get(doId);

  const wsUrl = new URL('/ws', 'https://do');
  wsUrl.searchParams.set('userId', user.id);
  wsUrl.searchParams.set('username', user.username);
  wsUrl.searchParams.set('avatarUrl', user.avatarUrl ?? '');
  wsUrl.searchParams.set('role', role);
  wsUrl.searchParams.set('sessionId', sessionId);
  wsUrl.searchParams.set('campaignId', session.campaign_id);

  // Get participant's hero ID if they have one
  const participant = await c.env.DB.prepare(
    'SELECT hero_id FROM session_participants WHERE game_session_id = ? AND user_id = ?',
  )
    .bind(sessionId, user.id)
    .first<{ hero_id: string | null }>();
  if (participant?.hero_id) {
    wsUrl.searchParams.set('heroId', participant.hero_id);
  }

  // Create a new request with the upgrade headers
  const upgradeRequest = new Request(wsUrl.toString(), {
    headers: c.req.raw.headers,
  });

  return stub.fetch(upgradeRequest);
});

// List sessions for a campaign
sessionRoutes.get('/campaigns/:campaignId/sessions', async (c) => {
  const campaignId = c.req.param('campaignId');
  const results = await c.env.DB.prepare(
    'SELECT * FROM game_sessions WHERE campaign_id = ? ORDER BY order_index',
  )
    .bind(campaignId)
    .all();
  return c.json({ sessions: results.results });
});

// Create session
sessionRoutes.post('/campaigns/:campaignId/sessions', async (c) => {
  const user = c.get('user') as AuthUser;
  const campaignId = c.req.param('campaignId');

  const campaign = await c.env.DB.prepare('SELECT director_id FROM campaigns WHERE id = ? AND deleted_at IS NULL')
    .bind(campaignId)
    .first<{ director_id: string }>();
  if (!campaign || campaign.director_id !== user.id) return c.json({ error: 'Forbidden' }, 403);

  const body = await c.req.json<{ name: string; description?: string; module_id?: string }>();
  if (!body.name?.trim()) return c.json({ error: 'Name is required' }, 400);

  const last = await c.env.DB.prepare(
    'SELECT MAX(order_index) as max_idx FROM game_sessions WHERE campaign_id = ?',
  )
    .bind(campaignId)
    .first<{ max_idx: number | null }>();

  const id = crypto.randomUUID();
  await c.env.DB.prepare(
    'INSERT INTO game_sessions (id, campaign_id, module_id, name, description, order_index) VALUES (?, ?, ?, ?, ?, ?)',
  )
    .bind(id, campaignId, body.module_id ?? null, body.name.trim(), body.description?.trim() ?? '', (last?.max_idx ?? -1) + 1)
    .run();

  return c.json({ id }, 201);
});

// Get session
sessionRoutes.get('/sessions/:id', async (c) => {
  const sessionId = c.req.param('id');
  const session = await c.env.DB.prepare('SELECT * FROM game_sessions WHERE id = ?')
    .bind(sessionId)
    .first();
  if (!session) return c.json({ error: 'Not found' }, 404);
  return c.json({ session });
});

// Update session
sessionRoutes.put('/sessions/:id', async (c) => {
  const user = c.get('user') as AuthUser;
  const sessionId = c.req.param('id');

  const session = await c.env.DB.prepare(
    `SELECT gs.*, c.director_id FROM game_sessions gs JOIN campaigns c ON gs.campaign_id = c.id WHERE gs.id = ?`,
  )
    .bind(sessionId)
    .first<{ director_id: string }>();
  if (!session || session.director_id !== user.id) return c.json({ error: 'Forbidden' }, 403);

  const body = await c.req.json<{ name?: string; description?: string; status?: string; order_index?: number }>();
  const sets: string[] = [];
  const vals: unknown[] = [];

  if (body.name !== undefined) { sets.push('name = ?'); vals.push(body.name.trim()); }
  if (body.description !== undefined) { sets.push('description = ?'); vals.push(body.description.trim()); }
  if (body.status !== undefined) { sets.push('status = ?'); vals.push(body.status); }
  if (body.order_index !== undefined) { sets.push('order_index = ?'); vals.push(body.order_index); }

  if (sets.length === 0) return c.json({ error: 'No fields' }, 400);
  vals.push(sessionId);

  await c.env.DB.prepare(`UPDATE game_sessions SET ${sets.join(', ')} WHERE id = ?`)
    .bind(...vals)
    .run();

  return c.json({ ok: true });
});

// Delete session
sessionRoutes.delete('/sessions/:id', async (c) => {
  const user = c.get('user') as AuthUser;
  const sessionId = c.req.param('id');

  const session = await c.env.DB.prepare(
    `SELECT gs.*, c.director_id FROM game_sessions gs JOIN campaigns c ON gs.campaign_id = c.id WHERE gs.id = ?`,
  )
    .bind(sessionId)
    .first<{ director_id: string }>();
  if (!session || session.director_id !== user.id) return c.json({ error: 'Forbidden' }, 403);

  await c.env.DB.prepare('DELETE FROM game_sessions WHERE id = ?').bind(sessionId).run();
  return c.json({ ok: true });
});

// Go Live
sessionRoutes.put('/sessions/:id/go-live', async (c) => {
  const user = c.get('user') as AuthUser;
  const sessionId = c.req.param('id');

  const session = await c.env.DB.prepare(
    `SELECT gs.*, c.director_id FROM game_sessions gs JOIN campaigns c ON gs.campaign_id = c.id WHERE gs.id = ?`,
  )
    .bind(sessionId)
    .first<{ director_id: string; status: string }>();
  if (!session || session.director_id !== user.id) return c.json({ error: 'Forbidden' }, 403);

  const body = await c.req.json<{ roomCode: string }>();
  if (!body.roomCode?.trim()) return c.json({ error: 'Room code is required' }, 400);

  await c.env.DB.prepare(
    "UPDATE game_sessions SET room_code = ?, status = 'lobby', started_at = datetime('now') WHERE id = ?",
  )
    .bind(body.roomCode.trim(), sessionId)
    .run();

  return c.json({ ok: true });
});

// Start session (from lobby to active)
sessionRoutes.post('/sessions/:id/start', async (c) => {
  const user = c.get('user') as AuthUser;
  const sessionId = c.req.param('id');

  const session = await c.env.DB.prepare(
    `SELECT gs.*, c.director_id FROM game_sessions gs JOIN campaigns c ON gs.campaign_id = c.id WHERE gs.id = ?`,
  )
    .bind(sessionId)
    .first<{ director_id: string; status: string }>();
  if (!session || session.director_id !== user.id) return c.json({ error: 'Forbidden' }, 403);
  if (session.status !== 'lobby') return c.json({ error: 'Session must be in lobby state' }, 400);

  await c.env.DB.prepare("UPDATE game_sessions SET status = 'active' WHERE id = ?")
    .bind(sessionId)
    .run();

  return c.json({ ok: true });
});

// Get participants
sessionRoutes.get('/sessions/:id/participants', async (c) => {
  const sessionId = c.req.param('id');
  const results = await c.env.DB.prepare(
    `SELECT sp.*, u.username, u.avatar_url
     FROM session_participants sp JOIN users u ON sp.user_id = u.id
     WHERE sp.game_session_id = ?`,
  )
    .bind(sessionId)
    .all();
  return c.json({ participants: results.results });
});

// Join session
sessionRoutes.post('/sessions/:id/join', async (c) => {
  const user = c.get('user') as AuthUser;
  const sessionId = c.req.param('id');
  const body = await c.req.json<{ hero_id?: string }>();

  await c.env.DB.prepare(
    `INSERT INTO session_participants (game_session_id, user_id, hero_id, status)
     VALUES (?, ?, ?, 'joined')
     ON CONFLICT(game_session_id, user_id) DO UPDATE SET hero_id = excluded.hero_id`,
  )
    .bind(sessionId, user.id, body.hero_id ?? null)
    .run();

  return c.json({ ok: true });
});
