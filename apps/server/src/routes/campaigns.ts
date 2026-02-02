import { Hono } from 'hono';
import type { AppEnv, AuthUser } from '../types.js';
import { authMiddleware } from '../middleware/auth.js';

export const campaignRoutes = new Hono<AppEnv>();

campaignRoutes.use('/*', authMiddleware);

// List campaigns for current user (as director or member)
campaignRoutes.get('/', async (c) => {
  const user = c.get('user') as AuthUser;
  const directed = await c.env.DB.prepare(
    `SELECT id, name, description, cover_image_url, settings, created_at, updated_at
     FROM campaigns WHERE director_id = ? AND deleted_at IS NULL ORDER BY updated_at DESC`,
  )
    .bind(user.id)
    .all();

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
  const body = await c.req.json<{ name: string; description?: string }>();

  if (!body.name?.trim()) {
    return c.json({ error: 'Name is required' }, 400);
  }

  const id = crypto.randomUUID();
  await c.env.DB.prepare(
    'INSERT INTO campaigns (id, director_id, name, description) VALUES (?, ?, ?, ?)',
  )
    .bind(id, user.id, body.name.trim(), body.description?.trim() ?? '')
    .run();

  // Add director as campaign member
  await c.env.DB.prepare(
    'INSERT INTO campaign_members (campaign_id, user_id, role) VALUES (?, ?, ?)',
  )
    .bind(id, user.id, 'director')
    .run();

  return c.json({ id }, 201);
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
