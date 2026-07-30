import { Hono } from 'hono';
import type { Context } from 'hono';
import type { AppEnv, AuthUser } from '../types.js';
import { authMiddleware } from '../middleware/auth.js';
import { sessionRateLimits } from '../security/rate-limits.js';
import { hashToken } from '../security/tokens.js';

export const sessionRoutes = new Hono<AppEnv>();

sessionRoutes.use('/*', authMiddleware);

const LIVE_STATUSES = ['lobby', 'active'] as const;
const VALID_STATUSES = ['draft', 'lobby', 'active', 'paused', 'completed'] as const;
const ROOM_CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const ROOM_CODE_LENGTH = 10;
const ROOM_CODE_ATTEMPTS = 8;

interface SessionAccessRow {
  id: string;
  campaign_id: string;
  status: string;
  director_id: string;
  room_code: string | null;
  active_scene_id: string | null;
}

interface MembershipRow {
  role: 'director' | 'player';
  hero_id: string | null;
}

function normalizeRoomCode(code: string): string {
  return code.trim().replace(/\s+/g, '').toUpperCase();
}

function isLiveStatus(status: string): boolean {
  return LIVE_STATUSES.includes(status as (typeof LIVE_STATUSES)[number]);
}

function isValidStatus(status: string): boolean {
  return VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number]);
}

async function getSessionAccess(c: Context<AppEnv>, sessionId: string): Promise<SessionAccessRow | null> {
  return c.env.DB.prepare(
    `SELECT gs.id, gs.campaign_id, gs.status, gs.room_code, gs.active_scene_id, c.director_id
     FROM game_sessions gs
     JOIN campaigns c ON gs.campaign_id = c.id
     WHERE gs.id = ? AND c.deleted_at IS NULL`,
  )
    .bind(sessionId)
    .first<SessionAccessRow>();
}

async function getCampaignMembership(c: Context<AppEnv>, campaignId: string, userId: string): Promise<MembershipRow | null> {
  return c.env.DB.prepare(
    'SELECT role, hero_id FROM campaign_members WHERE campaign_id = ? AND user_id = ?',
  )
    .bind(campaignId, userId)
    .first<MembershipRow>();
}

async function hasSessionAccess(c: Context<AppEnv>, session: SessionAccessRow, user: AuthUser): Promise<boolean> {
  if (session.director_id === user.id) return true;
  return (await getCampaignMembership(c, session.campaign_id, user.id)) !== null;
}

async function assertHeroOwnership(c: Context<AppEnv>, heroId: string | null | undefined, userId: string): Promise<boolean> {
  if (!heroId) return true;
  const hero = await c.env.DB.prepare('SELECT id FROM heroes WHERE id = ? AND user_id = ? AND deleted_at IS NULL')
    .bind(heroId, userId)
    .first<{ id: string }>();
  return hero !== null;
}

function makeRoomCode(): string {
  const bytes = new Uint8Array(ROOM_CODE_LENGTH);
  crypto.getRandomValues(bytes);
  let code = '';
  for (const byte of bytes) code += ROOM_CODE_CHARS[byte % ROOM_CODE_CHARS.length];
  return code;
}

async function generateUniqueRoomCode(c: Context<AppEnv>, sessionId: string): Promise<string | null> {
  for (let attempt = 0; attempt < ROOM_CODE_ATTEMPTS; attempt += 1) {
    const roomCode = makeRoomCode();
    const duplicate = await c.env.DB.prepare(
      `SELECT id FROM game_sessions
       WHERE room_code = ? AND id <> ? AND status IN ('lobby', 'active')
       LIMIT 1`,
    )
      .bind(roomCode, sessionId)
      .first<{ id: string }>();
    if (!duplicate) return roomCode;
  }
  return null;
}

async function enforceSessionAdmissionLimit(
  c: Context<AppEnv>,
  namespace: string,
  user: AuthUser,
): Promise<Response | null> {
  return namespace === 'room-code-lookup'
    ? sessionRateLimits.roomCodeLookup(c, user.id)
    : sessionRateLimits.roomCodeJoin(c, user.id);
}

// Lookup session by room code. Auth is required by the router middleware, but campaign membership is not:
// a valid live room code is the session-level invitation for players to join.
sessionRoutes.get('/sessions/by-code/:code', async (c) => {
  const user = c.get('user') as AuthUser;
  const rateLimitError = await enforceSessionAdmissionLimit(c, 'room-code-lookup', user);
  if (rateLimitError) return rateLimitError;

  const code = normalizeRoomCode(c.req.param('code'));
  if (!new RegExp(`^[${ROOM_CODE_CHARS}]{${ROOM_CODE_LENGTH}}$`).test(code)) {
    return c.json({ error: 'Invalid room code' }, 404);
  }

  const session = await c.env.DB.prepare(
    `SELECT gs.id, gs.name, gs.campaign_id, gs.status, c.name as campaign_name
     FROM game_sessions gs JOIN campaigns c ON gs.campaign_id = c.id
     WHERE gs.room_code = ? AND gs.status IN ('lobby', 'active') AND c.deleted_at IS NULL`,
  )
    .bind(code)
    .first<{ id: string; name: string; campaign_id: string; status: string; campaign_name: string }>();
  if (!session) return c.json({ error: 'Invalid room code' }, 404);
  return c.json({ session });
});

// Issue a short-lived WS token (valid 30s) — lets the client auth without cookies on the WS upgrade
sessionRoutes.post('/sessions/:id/ws-token', async (c) => {
  const user = c.get('user') as AuthUser;
  const sessionId = c.req.param('id');

  const session = await getSessionAccess(c, sessionId);
  if (!session) return c.json({ error: 'Not found' }, 404);
  if (!isLiveStatus(session.status)) return c.json({ error: 'Session not active' }, 400);

  const role = session.director_id === user.id ? 'director' : 'player';
  const membership = role === 'director'
    ? null
    : await getCampaignMembership(c, session.campaign_id, user.id);
  if (role !== 'director' && !membership) return c.json({ error: 'Forbidden' }, 403);

  const participant = await c.env.DB.prepare(
    'SELECT hero_id, code_verified FROM session_participants WHERE game_session_id = ? AND user_id = ?',
  )
    .bind(sessionId, user.id)
    .first<{ hero_id: string | null; code_verified: number }>();

  // Players must have passed the room code (set at /join) to (re)connect.
  if (role !== 'director' && participant?.code_verified !== 1) {
    return c.json({ error: 'Room code required — rejoin from the Live page.' }, 403);
  }

  const token = crypto.randomUUID();
  // Store only the digest: the plaintext is returned to the client once, so a
  // database read cannot be replayed to open a socket.
  const tokenHash = await hashToken(token);
  const expiresAt = new Date(Date.now() + 30_000).toISOString();

  await c.env.DB.prepare(
    'INSERT INTO ws_tokens (id, user_id, session_id, campaign_id, role, hero_id, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
  )
    .bind(tokenHash, user.id, sessionId, session.campaign_id, role, participant?.hero_id ?? membership?.hero_id ?? null, expiresAt)
    .run();

  return c.json({ token });
});

// NOTE: WebSocket upgrade route (GET /sessions/:id/ws) is registered directly on the app
// in index.ts to avoid sub-router auth middleware conflicts. See index.ts.

// List sessions for a campaign
sessionRoutes.get('/campaigns/:campaignId/sessions', async (c) => {
  const user = c.get('user') as AuthUser;
  const campaignId = c.req.param('campaignId');
  const membership = await getCampaignMembership(c, campaignId, user.id);
  if (!membership) return c.json({ error: 'Forbidden' }, 403);

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

  if (body.module_id) {
    const module = await c.env.DB.prepare('SELECT id FROM modules WHERE id = ? AND campaign_id = ?')
      .bind(body.module_id, campaignId)
      .first<{ id: string }>();
    if (!module) return c.json({ error: 'Module not found' }, 404);
  }

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

// Get session (includes director_id from campaigns for role detection)
sessionRoutes.get('/sessions/:id', async (c) => {
  const user = c.get('user') as AuthUser;
  const sessionId = c.req.param('id');
  const session = await c.env.DB.prepare(
    `SELECT gs.*, c.director_id
     FROM game_sessions gs
     JOIN campaigns c ON gs.campaign_id = c.id
     WHERE gs.id = ? AND c.deleted_at IS NULL`,
  )
    .bind(sessionId)
    .first<SessionAccessRow & Record<string, unknown>>();
  if (!session) return c.json({ error: 'Not found' }, 404);
  if (!(await hasSessionAccess(c, session, user))) return c.json({ error: 'Forbidden' }, 403);
  return c.json({ session });
});

// Update session metadata. Lifecycle status changes should use go-live/start/end endpoints.
sessionRoutes.put('/sessions/:id', async (c) => {
  const user = c.get('user') as AuthUser;
  const sessionId = c.req.param('id');

  const session = await getSessionAccess(c, sessionId);
  if (!session || session.director_id !== user.id) return c.json({ error: 'Forbidden' }, 403);
  if (isLiveStatus(session.status)) return c.json({ error: 'Cannot edit a live session' }, 400);

  const body = await c.req.json<{ name?: string; description?: string; status?: string; order_index?: number }>();
  const sets: string[] = [];
  const vals: unknown[] = [];

  if (body.name !== undefined) {
    const name = body.name.trim();
    if (!name) return c.json({ error: 'Name is required' }, 400);
    sets.push('name = ?');
    vals.push(name);
  }
  if (body.description !== undefined) { sets.push('description = ?'); vals.push(body.description.trim()); }
  if (body.status !== undefined) {
    if (!isValidStatus(body.status)) return c.json({ error: 'Invalid status' }, 400);
    if (body.status === 'lobby' || body.status === 'active') {
      return c.json({ error: 'Use lifecycle endpoints to start live sessions' }, 400);
    }
    sets.push('status = ?');
    vals.push(body.status);
  }
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

  const session = await getSessionAccess(c, sessionId);
  if (!session || session.director_id !== user.id) return c.json({ error: 'Forbidden' }, 403);
  if (isLiveStatus(session.status)) return c.json({ error: 'End the live session before deleting it' }, 400);

  await c.env.DB.prepare('DELETE FROM game_sessions WHERE id = ?').bind(sessionId).run();
  return c.json({ ok: true });
});

// Go Live
sessionRoutes.put('/sessions/:id/go-live', async (c) => {
  const user = c.get('user') as AuthUser;
  const sessionId = c.req.param('id');

  const session = await getSessionAccess(c, sessionId);
  if (!session || session.director_id !== user.id) return c.json({ error: 'Forbidden' }, 403);
  if (isLiveStatus(session.status)) return c.json({ error: 'Session is already live' }, 400);

  const body = await c.req.json<{ sceneId?: string | null }>();

  const otherLive = await c.env.DB.prepare(
    `SELECT id FROM game_sessions
     WHERE campaign_id = ? AND id <> ? AND status IN ('lobby', 'active')
     LIMIT 1`,
  )
    .bind(session.campaign_id, sessionId)
    .first<{ id: string }>();
  if (otherLive) return c.json({ error: 'Campaign already has a live session' }, 409);

  const roomCode = await generateUniqueRoomCode(c, sessionId);
  if (!roomCode) return c.json({ error: 'Could not allocate room code' }, 503);

  let activeSceneId = body.sceneId?.trim() || null;
  if (activeSceneId) {
    const scene = await c.env.DB.prepare(
      'SELECT id FROM scenes WHERE id = ? AND game_session_id = ? AND deleted_at IS NULL',
    )
      .bind(activeSceneId, sessionId)
      .first<{ id: string }>();
    if (!scene) return c.json({ error: 'Scene not found' }, 404);
  } else {
    const firstScene = await c.env.DB.prepare(
      'SELECT id FROM scenes WHERE game_session_id = ? AND deleted_at IS NULL ORDER BY order_index LIMIT 1',
    )
      .bind(sessionId)
      .first<{ id: string }>();
    activeSceneId = firstScene?.id ?? null;
  }

  await c.env.DB.prepare(
    `UPDATE game_sessions
     SET room_code = ?, status = 'lobby', started_at = datetime('now'), ended_at = NULL, active_scene_id = ?
     WHERE id = ?`,
  )
    .bind(roomCode, activeSceneId, sessionId)
    .run();

  return c.json({ ok: true, roomCode });
});

// Start session (from lobby to active)
sessionRoutes.post('/sessions/:id/start', async (c) => {
  const user = c.get('user') as AuthUser;
  const sessionId = c.req.param('id');

  const session = await getSessionAccess(c, sessionId);
  if (!session || session.director_id !== user.id) return c.json({ error: 'Forbidden' }, 403);
  if (session.status !== 'lobby') return c.json({ error: 'Session must be in lobby state' }, 400);

  await c.env.DB.prepare("UPDATE game_sessions SET status = 'active', started_at = COALESCE(started_at, datetime('now')) WHERE id = ?")
    .bind(sessionId)
    .run();

  const doId = c.env.SESSION_ROOM.idFromName(sessionId);
  const stub = c.env.SESSION_ROOM.get(doId);
  await stub.fetch(new Request('https://do/start', { method: 'POST' }));

  return c.json({ ok: true });
});

// Get participants
sessionRoutes.get('/sessions/:id/participants', async (c) => {
  const user = c.get('user') as AuthUser;
  const sessionId = c.req.param('id');
  const session = await getSessionAccess(c, sessionId);
  if (!session) return c.json({ error: 'Not found' }, 404);
  if (!(await hasSessionAccess(c, session, user))) return c.json({ error: 'Forbidden' }, 403);

  const results = await c.env.DB.prepare(
    `SELECT sp.*, u.username, u.avatar_url
     FROM session_participants sp JOIN users u ON sp.user_id = u.id
     WHERE sp.game_session_id = ?`,
  )
    .bind(sessionId)
    .all();
  return c.json({ participants: results.results });
});

// End session — forwards to DO to save snapshots, then marks completed
sessionRoutes.post('/sessions/:id/end', async (c) => {
  const user = c.get('user') as AuthUser;
  const sessionId = c.req.param('id');

  const session = await getSessionAccess(c, sessionId);
  if (!session || session.director_id !== user.id) return c.json({ error: 'Forbidden' }, 403);
  if (session.status === 'completed') return c.json({ ok: true });
  if (!isLiveStatus(session.status)) return c.json({ error: 'Session is not live' }, 400);

  const doId = c.env.SESSION_ROOM.idFromName(sessionId);
  const stub = c.env.SESSION_ROOM.get(doId);
  const endUrl = new URL('/end', 'https://do');
  endUrl.searchParams.set('sessionId', sessionId);

  await stub.fetch(new Request(endUrl.toString(), { method: 'POST' }));

  return c.json({ ok: true });
});

// Join session
sessionRoutes.post('/sessions/:id/join', async (c) => {
  const user = c.get('user') as AuthUser;
  const rateLimitError = await enforceSessionAdmissionLimit(c, 'session-join', user);
  if (rateLimitError) return rateLimitError;

  const sessionId = c.req.param('id');
  const body = await c.req.json<{ hero_id?: string | null; room_code?: string }>();

  const session = await getSessionAccess(c, sessionId);
  if (!session) return c.json({ error: 'Not found' }, 404);
  if (!isLiveStatus(session.status)) return c.json({ error: 'Session not active' }, 400);
  if (!(await assertHeroOwnership(c, body.hero_id, user.id))) return c.json({ error: 'Hero not found' }, 404);

  const role = session.director_id === user.id ? 'director' : 'player';

  // Everyone but the Director must present the session's room code to join.
  if (role === 'player') {
    const provided = typeof body.room_code === 'string' ? normalizeRoomCode(body.room_code) : '';
    const expected = session.room_code ? normalizeRoomCode(session.room_code) : '';
    if (!expected || provided !== expected) {
      return c.json({ error: 'Invalid room code' }, 403);
    }
  }
  await c.env.DB.prepare(
    `INSERT INTO campaign_members (campaign_id, user_id, hero_id, role)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(campaign_id, user_id) DO UPDATE SET hero_id = excluded.hero_id`,
  )
    .bind(session.campaign_id, user.id, body.hero_id ?? null, role)
    .run();

  // Mark the participant as code-verified (they passed the room code above);
  // ws-token issuance requires this so reconnects can't bypass the code.
  await c.env.DB.prepare(
    `INSERT INTO session_participants (game_session_id, user_id, hero_id, status, code_verified)
     VALUES (?, ?, ?, 'joined', 1)
     ON CONFLICT(game_session_id, user_id) DO UPDATE SET hero_id = excluded.hero_id, code_verified = 1`,
  )
    .bind(sessionId, user.id, body.hero_id ?? null)
    .run();

  return c.json({ ok: true });
});
