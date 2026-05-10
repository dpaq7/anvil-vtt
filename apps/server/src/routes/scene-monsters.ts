import { Hono } from 'hono';
import type { AppEnv, AuthUser } from '../types.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireSceneDirector, requireSceneMember } from '../lib/access.js';
import type { AddSceneMonstersInput, SceneMonster } from '@anvil/types';

export const sceneMonsterRoutes = new Hono<AppEnv>();

sceneMonsterRoutes.use('/*', authMiddleware);

// ── Helpers ──

interface SceneMonsterRow {
  id: string;
  scene_id: string;
  monster_name: string;
  quantity: number;
  created_at: string;
}

function rowToSceneMonster(row: SceneMonsterRow): SceneMonster {
  return {
    id: row.id,
    sceneId: row.scene_id,
    monsterName: row.monster_name,
    quantity: row.quantity,
    createdAt: row.created_at,
  };
}

// ── Routes ──

// List monsters in a scene
sceneMonsterRoutes.get('/scenes/:sceneId/monsters', async (c) => {
  const user = c.get('user') as AuthUser;
  const sceneId = c.req.param('sceneId');
  const accessError = await requireSceneMember(c, sceneId, user);
  if (accessError) return accessError;

  const results = await c.env.DB.prepare(
    'SELECT * FROM scene_monsters WHERE scene_id = ? ORDER BY created_at DESC',
  )
    .bind(sceneId)
    .all<SceneMonsterRow>();

  return c.json({ monsters: results.results.map(rowToSceneMonster) });
});

// Add monster(s) to a scene
sceneMonsterRoutes.post('/scenes/:sceneId/monsters', async (c) => {
  const user = c.get('user') as AuthUser;
  const sceneId = c.req.param('sceneId');
  const accessError = await requireSceneDirector(c, sceneId, user);
  if (accessError) return accessError;

  const body = await c.req.json<AddSceneMonstersInput>();

  if (!body.monsterName?.trim()) return c.json({ error: 'Monster name is required' }, 400);
  if (!body.quantity || body.quantity < 1) return c.json({ error: 'Quantity must be at least 1' }, 400);

  const id = crypto.randomUUID();

  await c.env.DB.prepare(
    'INSERT INTO scene_monsters (id, scene_id, monster_name, quantity) VALUES (?, ?, ?, ?)',
  )
    .bind(id, sceneId, body.monsterName.trim(), body.quantity)
    .run();

  const row = await c.env.DB.prepare('SELECT * FROM scene_monsters WHERE id = ?')
    .bind(id)
    .first<SceneMonsterRow>();
  if (!row) return c.json({ error: 'Failed to add monster' }, 500);

  return c.json({ monster: rowToSceneMonster(row) }, 201);
});

// Remove a monster entry from a scene
sceneMonsterRoutes.delete('/scenes/:sceneId/monsters/:entryId', async (c) => {
  const user = c.get('user') as AuthUser;
  const sceneId = c.req.param('sceneId');
  const entryId = c.req.param('entryId');
  const accessError = await requireSceneDirector(c, sceneId, user);
  if (accessError) return accessError;

  const existing = await c.env.DB.prepare(
    'SELECT id FROM scene_monsters WHERE id = ? AND scene_id = ?',
  )
    .bind(entryId, sceneId)
    .first();
  if (!existing) return c.json({ error: 'Not found' }, 404);

  await c.env.DB.prepare('DELETE FROM scene_monsters WHERE id = ?').bind(entryId).run();
  return c.json({ ok: true });
});
