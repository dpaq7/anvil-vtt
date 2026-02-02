import { Hono } from 'hono';
import type { AppEnv, AuthUser } from '../types.js';
import { authMiddleware } from '../middleware/auth.js';

export const inviteRoutes = new Hono<AppEnv>();

// Generate invite (auth required)
inviteRoutes.post('/campaigns/:campaignId/invites', authMiddleware, async (c) => {
  const user = c.get('user') as AuthUser;
  const campaignId = c.req.param('campaignId');

  const campaign = await c.env.DB.prepare('SELECT director_id FROM campaigns WHERE id = ? AND deleted_at IS NULL')
    .bind(campaignId)
    .first<{ director_id: string }>();
  if (!campaign || campaign.director_id !== user.id) return c.json({ error: 'Forbidden' }, 403);

  const body = await c.req.json<{ max_uses?: number; expires_hours?: number }>().catch(() => ({}));
  const maxUses = (body as { max_uses?: number }).max_uses ?? 0;
  const expiresHours = (body as { expires_hours?: number }).expires_hours ?? 168; // 7 days

  const id = crypto.randomUUID();
  const token = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
  const expiresAt = new Date(Date.now() + expiresHours * 60 * 60 * 1000).toISOString();

  await c.env.DB.prepare(
    'INSERT INTO campaign_invites (id, campaign_id, token, expires_at, max_uses) VALUES (?, ?, ?, ?, ?)',
  )
    .bind(id, campaignId, token, expiresAt, maxUses)
    .run();

  return c.json({ token }, 201);
});

// Get invite info (public, no auth needed for viewing)
inviteRoutes.get('/invites/:token', async (c) => {
  const token = c.req.param('token');

  const invite = await c.env.DB.prepare(
    `SELECT ci.*, c.name as campaign_name, c.description as campaign_description, u.username as director_name
     FROM campaign_invites ci
     JOIN campaigns c ON ci.campaign_id = c.id
     JOIN users u ON c.director_id = u.id
     WHERE ci.token = ? AND ci.expires_at > datetime('now')`,
  )
    .bind(token)
    .first();

  if (!invite) return c.json({ error: 'Invalid or expired invite' }, 404);

  const maxUses = invite['max_uses'] as number;
  const usedCount = invite['used_count'] as number;
  if (maxUses > 0 && usedCount >= maxUses) {
    return c.json({ error: 'Invite has reached max uses' }, 410);
  }

  return c.json({
    campaignId: invite['campaign_id'],
    campaignName: invite['campaign_name'],
    campaignDescription: invite['campaign_description'],
    directorName: invite['director_name'],
  });
});

// Accept invite (auth required)
inviteRoutes.post('/invites/:token/accept', authMiddleware, async (c) => {
  const user = c.get('user') as AuthUser;
  const token = c.req.param('token');

  const invite = await c.env.DB.prepare(
    'SELECT * FROM campaign_invites WHERE token = ? AND expires_at > datetime(\'now\')',
  )
    .bind(token)
    .first();

  if (!invite) return c.json({ error: 'Invalid or expired invite' }, 404);

  const maxUses = invite['max_uses'] as number;
  const usedCount = invite['used_count'] as number;
  if (maxUses > 0 && usedCount >= maxUses) {
    return c.json({ error: 'Invite has reached max uses' }, 410);
  }

  const campaignId = invite['campaign_id'] as string;

  // Check if already a member
  const existing = await c.env.DB.prepare(
    'SELECT * FROM campaign_members WHERE campaign_id = ? AND user_id = ?',
  )
    .bind(campaignId, user.id)
    .first();

  if (existing) return c.json({ campaignId, message: 'Already a member' });

  // Add member + increment used_count
  await c.env.DB.batch([
    c.env.DB.prepare('INSERT INTO campaign_members (campaign_id, user_id, role) VALUES (?, ?, ?)').bind(
      campaignId, user.id, 'player',
    ),
    c.env.DB.prepare('UPDATE campaign_invites SET used_count = used_count + 1 WHERE id = ?').bind(
      invite['id'] as string,
    ),
  ]);

  return c.json({ campaignId });
});
