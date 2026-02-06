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
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  }),
);

// Health check
app.get('/api/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

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

export default app;

// Durable Object stub export — implemented in Phase 4
export { SessionRoom } from './durable-objects/SessionRoom.js';
