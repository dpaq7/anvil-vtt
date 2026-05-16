import { Hono } from 'hono';
import type { AppEnv, AuthUser } from '../types.js';
import { authMiddleware } from '../middleware/auth.js';
import { enforceRateLimit } from '../lib/rate-limit.js';

export const inviteRoutes = new Hono<AppEnv>();

function randomHex(byteLength: number): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function clampInteger(value: unknown, fallback: number, min: number, max: number): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.min(max, Math.max(min, Math.trunc(value)))
    : fallback;
}

function resultChanges(result: D1Result): number {
  const meta = result.meta as { changes?: number; rows_written?: number } | undefined;
  if (typeof meta?.changes === 'number') return meta.changes;
  return typeof meta?.rows_written === 'number' ? meta.rows_written : 0;
}

// Generate invite (auth required)
inviteRoutes.post('/campaigns/:campaignId/invites', authMiddleware, async (c) => {
  const user = c.get('user') as AuthUser;
  const campaignId = c.req.param('campaignId');

  const campaign = await c.env.DB.prepare('SELECT director_id FROM campaigns WHERE id = ? AND deleted_at IS NULL')
    .bind(campaignId)
    .first<{ director_id: string }>();
  if (!campaign || campaign.director_id !== user.id) return c.json({ error: 'Forbidden' }, 403);

  const body = await c.req.json<{ max_uses?: number; expires_hours?: number }>().catch(() => ({}));
  const maxUses = clampInteger((body as { max_uses?: number }).max_uses, 0, 0, 1000);
  const expiresHours = clampInteger((body as { expires_hours?: number }).expires_hours, 168, 1, 24 * 30);

  const id = crypto.randomUUID();
  const token = randomHex(16);
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
  const rateLimitError = await enforceRateLimit(c, {
    namespace: 'invite-lookup',
    limit: 60,
    windowSeconds: 15 * 60,
  });
  if (rateLimitError) return rateLimitError;

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
  const ipRateLimitError = await enforceRateLimit(c, {
    namespace: 'invite-accept-ip',
    limit: 30,
    windowSeconds: 15 * 60,
  });
  if (ipRateLimitError) return ipRateLimitError;

  const userRateLimitError = await enforceRateLimit(c, {
    namespace: 'invite-accept-user',
    identifier: user.id,
    limit: 20,
    windowSeconds: 60 * 60,
  });
  if (userRateLimitError) return userRateLimitError;

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

  const insertMember = await c.env.DB.prepare(
    'INSERT OR IGNORE INTO campaign_members (campaign_id, user_id, role) VALUES (?, ?, ?)',
  )
    .bind(campaignId, user.id, 'player')
    .run();

  if (resultChanges(insertMember) === 0) return c.json({ campaignId, message: 'Already a member' });

  const claimInvite = await c.env.DB.prepare(
    `UPDATE campaign_invites
     SET used_count = used_count + 1
     WHERE id = ? AND (max_uses = 0 OR used_count < max_uses)`,
  )
    .bind(invite['id'] as string)
    .run();

  if (resultChanges(claimInvite) === 0) {
    await c.env.DB.prepare('DELETE FROM campaign_members WHERE campaign_id = ? AND user_id = ? AND role = ?')
      .bind(campaignId, user.id, 'player')
      .run();
    return c.json({ error: 'Invite has reached max uses' }, 410);
  }

  return c.json({ campaignId });
});
