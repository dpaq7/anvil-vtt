import { Hono } from 'hono';
import type { AppEnv, AuthUser } from '../types.js';
import { authMiddleware } from '../middleware/auth.js';

export const moduleRoutes = new Hono<AppEnv>();

moduleRoutes.use('/*', authMiddleware);

// List modules for a campaign
moduleRoutes.get('/campaigns/:campaignId/modules', async (c) => {
  const campaignId = c.req.param('campaignId');
  const results = await c.env.DB.prepare(
    'SELECT * FROM modules WHERE campaign_id = ? ORDER BY order_index',
  )
    .bind(campaignId)
    .all();
  return c.json({ modules: results.results });
});

// Create module
moduleRoutes.post('/campaigns/:campaignId/modules', async (c) => {
  const user = c.get('user') as AuthUser;
  const campaignId = c.req.param('campaignId');

  const campaign = await c.env.DB.prepare('SELECT director_id FROM campaigns WHERE id = ? AND deleted_at IS NULL')
    .bind(campaignId)
    .first<{ director_id: string }>();
  if (!campaign || campaign.director_id !== user.id) return c.json({ error: 'Forbidden' }, 403);

  const body = await c.req.json<{ name: string; description?: string }>();
  if (!body.name?.trim()) return c.json({ error: 'Name is required' }, 400);

  // Get next order_index
  const last = await c.env.DB.prepare(
    'SELECT MAX(order_index) as max_idx FROM modules WHERE campaign_id = ?',
  )
    .bind(campaignId)
    .first<{ max_idx: number | null }>();

  const id = crypto.randomUUID();
  await c.env.DB.prepare(
    'INSERT INTO modules (id, campaign_id, name, description, order_index) VALUES (?, ?, ?, ?, ?)',
  )
    .bind(id, campaignId, body.name.trim(), body.description?.trim() ?? '', (last?.max_idx ?? -1) + 1)
    .run();

  return c.json({ id }, 201);
});

// Update module
moduleRoutes.put('/modules/:id', async (c) => {
  const user = c.get('user') as AuthUser;
  const moduleId = c.req.param('id');

  const mod = await c.env.DB.prepare(
    `SELECT m.*, c.director_id FROM modules m JOIN campaigns c ON m.campaign_id = c.id WHERE m.id = ?`,
  )
    .bind(moduleId)
    .first<{ director_id: string }>();
  if (!mod || mod.director_id !== user.id) return c.json({ error: 'Forbidden' }, 403);

  const body = await c.req.json<{ name?: string; description?: string; order_index?: number }>();
  const sets: string[] = [];
  const vals: unknown[] = [];

  if (body.name !== undefined) { sets.push('name = ?'); vals.push(body.name.trim()); }
  if (body.description !== undefined) { sets.push('description = ?'); vals.push(body.description.trim()); }
  if (body.order_index !== undefined) { sets.push('order_index = ?'); vals.push(body.order_index); }

  if (sets.length === 0) return c.json({ error: 'No fields' }, 400);
  vals.push(moduleId);

  await c.env.DB.prepare(`UPDATE modules SET ${sets.join(', ')} WHERE id = ?`)
    .bind(...vals)
    .run();

  return c.json({ ok: true });
});

// Delete module
moduleRoutes.delete('/modules/:id', async (c) => {
  const user = c.get('user') as AuthUser;
  const moduleId = c.req.param('id');

  const mod = await c.env.DB.prepare(
    `SELECT m.*, c.director_id FROM modules m JOIN campaigns c ON m.campaign_id = c.id WHERE m.id = ?`,
  )
    .bind(moduleId)
    .first<{ director_id: string }>();
  if (!mod || mod.director_id !== user.id) return c.json({ error: 'Forbidden' }, 403);

  await c.env.DB.prepare('DELETE FROM modules WHERE id = ?').bind(moduleId).run();
  return c.json({ ok: true });
});
