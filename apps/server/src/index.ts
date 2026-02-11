import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { AppEnv } from './types.js';
import { authRoutes } from './routes/auth.js';
import { assetRoutes } from './routes/assets.js';
import { campaignRoutes } from './routes/campaigns.js';
import { moduleRoutes } from './routes/modules.js';
import { sessionRoutes } from './routes/sessions.js';
import { sceneRoutes } from './routes/scenes.js';
import { inviteRoutes } from './routes/invites.js';
import { heroRoutes } from './routes/heroes.js';
import { mapRoutes } from './routes/maps.js';
import { npcRoutes } from './routes/npcs.js';
import { sceneMonsterRoutes } from './routes/scene-monsters.js';
import { audioRoutes } from './routes/audio.js';
import { customTerrainRoutes } from './routes/custom-terrain.js';
import { activityRoutes } from './routes/activities.js';
import { montageTestRoutes } from './routes/montage-tests.js';
import { noteRoutes } from './routes/notes.js';
import { gameSessionRoutes } from './routes/game-sessions.js';

const app = new Hono<AppEnv>();

// CORS
app.use(
  '/api/*',
  cors({
    origin: (origin, c) => {
      const frontendUrl = c.env.FRONTEND_URL || 'http://localhost:5173';
      return origin === frontendUrl ? origin : '';
    },
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  }),
);

// Health check
app.get('/api/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

// WebSocket upgrade — token-based auth, must be registered before sub-router auth middlewares
app.get('/api/sessions/:id/ws', async (c) => {
  const sessionId = c.req.param('id');
  const token = c.req.query('token');

  if (!token) {
    return c.json({ error: 'Missing token' }, 401);
  }

  // Validate token
  const row = await c.env.DB.prepare(
    'SELECT * FROM ws_tokens WHERE id = ? AND session_id = ? AND expires_at > datetime(\'now\')',
  )
    .bind(token, sessionId)
    .first<{ user_id: string; session_id: string; campaign_id: string; role: string; hero_id: string | null }>();
  if (!row) return c.json({ error: 'Invalid or expired token' }, 401);

  // Delete used token (single-use)
  await c.env.DB.prepare('DELETE FROM ws_tokens WHERE id = ?').bind(token).run();

  // Look up user details
  const user = await c.env.DB.prepare('SELECT id, username, avatar_url FROM users WHERE id = ?')
    .bind(row.user_id)
    .first<{ id: string; username: string; avatar_url: string | null }>();
  if (!user) return c.json({ error: 'User not found' }, 401);

  // Forward to Durable Object
  const doId = c.env.SESSION_ROOM.idFromName(sessionId);
  const stub = c.env.SESSION_ROOM.get(doId);

  const wsUrl = new URL('/ws', 'https://do');
  wsUrl.searchParams.set('userId', user.id);
  wsUrl.searchParams.set('username', user.username);
  wsUrl.searchParams.set('avatarUrl', user.avatar_url ?? '');
  wsUrl.searchParams.set('role', row.role);
  wsUrl.searchParams.set('sessionId', sessionId);
  wsUrl.searchParams.set('campaignId', row.campaign_id);
  if (row.hero_id) {
    wsUrl.searchParams.set('heroId', row.hero_id);
  }

  // Create a new request with the upgrade headers
  const upgradeRequest = new Request(wsUrl.toString(), {
    headers: c.req.raw.headers,
  });

  return stub.fetch(upgradeRequest);
});

// Routes
app.route('/api/auth', authRoutes);
app.route('/api/campaigns', campaignRoutes);
app.route('/api', moduleRoutes);
app.route('/api', sessionRoutes);
app.route('/api', sceneRoutes);
app.route('/api', inviteRoutes);
app.route('/api/assets', assetRoutes);
app.route('/api/heroes', heroRoutes);
app.route('/api/campaigns', mapRoutes);
app.route('/api/campaigns', npcRoutes);
app.route('/api/campaigns', audioRoutes);
app.route('/api', sceneMonsterRoutes);
app.route('/api/campaigns', customTerrainRoutes);
app.route('/api/campaigns', activityRoutes);
app.route('/api', montageTestRoutes);
app.route('/api/campaigns', noteRoutes);
app.route('/api', gameSessionRoutes);

export default app;

// Durable Object stub export — implemented in Phase 4
export { SessionRoom } from './durable-objects/SessionRoom.js';
