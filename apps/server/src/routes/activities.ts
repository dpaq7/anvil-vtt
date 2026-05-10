import { Hono } from 'hono';
import type { AppEnv, AuthUser } from '../types.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireCampaignDirector, requireCampaignMember } from '../lib/access.js';
import type { ActivityCard, CreateActivityCardInput, UpdateActivityCardInput } from '@anvil/types';

export const activityRoutes = new Hono<AppEnv>();

activityRoutes.use('/*', authMiddleware);

// ── Helpers ──

interface ActivityCardRow {
  id: string;
  campaign_id: string;
  activity_name: string;
  activity_type: string;
  activity_data: string | null;
  points_spent: number;
  points_total: number | null;
  notes: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
}

function rowToActivityCard(row: ActivityCardRow): ActivityCard {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    activityName: row.activity_name,
    activityType: row.activity_type as ActivityCard['activityType'],
    activityData: row.activity_data ? JSON.parse(row.activity_data) : null,
    pointsSpent: row.points_spent,
    pointsTotal: row.points_total,
    notes: row.notes,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ── Routes ──

// List activity cards with optional active filter
activityRoutes.get('/:campaignId/activities', async (c) => {
  const user = c.get('user') as AuthUser;
  const campaignId = c.req.param('campaignId');
  const isActive = c.req.query('is_active');
  const accessError = await requireCampaignMember(c, campaignId, user);
  if (accessError) return accessError;

  let query = 'SELECT * FROM activity_cards WHERE campaign_id = ?';
  const binds: unknown[] = [campaignId];

  if (isActive !== undefined) {
    query += ' AND is_active = ?';
    binds.push(isActive === 'true' ? 1 : 0);
  }

  query += ' ORDER BY updated_at DESC';

  const results = await c.env.DB.prepare(query).bind(...binds).all<ActivityCardRow>();
  return c.json({ activities: results.results.map(rowToActivityCard) });
});

// Create activity card
activityRoutes.post('/:campaignId/activities', async (c) => {
  const user = c.get('user') as AuthUser;
  const campaignId = c.req.param('campaignId');
  const accessError = await requireCampaignDirector(c, campaignId, user);
  if (accessError) return accessError;

  const body = await c.req.json<CreateActivityCardInput>();

  if (!body.activityName?.trim()) return c.json({ error: 'Activity name is required' }, 400);
  if (!body.activityType) return c.json({ error: 'Activity type is required' }, 400);

  const id = crypto.randomUUID();

  await c.env.DB.prepare(
    `INSERT INTO activity_cards (id, campaign_id, activity_name, activity_type, activity_data, points_total, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      id,
      campaignId,
      body.activityName.trim(),
      body.activityType,
      body.activityData ? JSON.stringify(body.activityData) : null,
      body.pointsTotal ?? null,
      body.notes ?? null,
    )
    .run();

  const row = await c.env.DB.prepare('SELECT * FROM activity_cards WHERE id = ?')
    .bind(id)
    .first<ActivityCardRow>();
  if (!row) return c.json({ error: 'Failed to create activity card' }, 500);

  return c.json({ activity: rowToActivityCard(row) }, 201);
});

// Update activity card progress/notes
activityRoutes.patch('/:campaignId/activities/:activityId', async (c) => {
  const user = c.get('user') as AuthUser;
  const campaignId = c.req.param('campaignId');
  const activityId = c.req.param('activityId');
  const accessError = await requireCampaignDirector(c, campaignId, user);
  if (accessError) return accessError;

  const body = await c.req.json<UpdateActivityCardInput>();

  const existing = await c.env.DB.prepare('SELECT id FROM activity_cards WHERE id = ? AND campaign_id = ?')
    .bind(activityId, campaignId)
    .first();
  if (!existing) return c.json({ error: 'Not found' }, 404);

  const sets: string[] = [];
  const vals: unknown[] = [];

  if (body.pointsSpent !== undefined) { sets.push('points_spent = ?'); vals.push(body.pointsSpent); }
  if (body.notes !== undefined) { sets.push('notes = ?'); vals.push(body.notes); }
  if (body.isActive !== undefined) { sets.push('is_active = ?'); vals.push(body.isActive ? 1 : 0); }

  if (sets.length === 0) return c.json({ error: 'No fields to update' }, 400);

  sets.push("updated_at = datetime('now')");
  vals.push(activityId);

  await c.env.DB.prepare(`UPDATE activity_cards SET ${sets.join(', ')} WHERE id = ?`)
    .bind(...vals)
    .run();

  const row = await c.env.DB.prepare('SELECT * FROM activity_cards WHERE id = ?')
    .bind(activityId)
    .first<ActivityCardRow>();
  if (!row) return c.json({ error: 'Not found' }, 404);

  return c.json({ activity: rowToActivityCard(row) });
});

// Delete activity card
activityRoutes.delete('/:campaignId/activities/:activityId', async (c) => {
  const user = c.get('user') as AuthUser;
  const campaignId = c.req.param('campaignId');
  const activityId = c.req.param('activityId');
  const accessError = await requireCampaignDirector(c, campaignId, user);
  if (accessError) return accessError;

  const existing = await c.env.DB.prepare('SELECT id FROM activity_cards WHERE id = ? AND campaign_id = ?')
    .bind(activityId, campaignId)
    .first();
  if (!existing) return c.json({ error: 'Not found' }, 404);

  await c.env.DB.prepare('DELETE FROM activity_cards WHERE id = ?').bind(activityId).run();
  return c.json({ ok: true });
});
