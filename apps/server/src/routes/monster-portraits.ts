import { Hono } from 'hono';
import type { Context } from 'hono';
import type { AppEnv, AuthUser } from '../types.js';
import { authMiddleware } from '../middleware/auth.js';
import type { MonsterPortrait } from '@anvil/types';

export const monsterPortraitRoutes = new Hono<AppEnv>();

monsterPortraitRoutes.use('/*', authMiddleware);

interface PortraitRow {
  id: string;
  campaign_id: string;
  monster_name: string;
  asset_id: string;
  created_at: string;
  updated_at: string;
}

async function getCampaignRole(c: Context<AppEnv>, campaignId: string, userId: string): Promise<string | null> {
  const row = await c.env.DB.prepare(
    `SELECT cm.role FROM campaign_members cm
     JOIN campaigns c ON c.id = cm.campaign_id
     WHERE cm.campaign_id = ? AND cm.user_id = ? AND c.deleted_at IS NULL`,
  ).bind(campaignId, userId).first<{ role: string }>();
  return row?.role ?? null;
}

async function requireCampaignMember(c: Context<AppEnv>, campaignId: string, user: AuthUser): Promise<Response | null> {
  return (await getCampaignRole(c, campaignId, user.id)) ? null : c.json({ error: 'Forbidden' }, 403);
}

async function requireCampaignDirector(c: Context<AppEnv>, campaignId: string, user: AuthUser): Promise<Response | null> {
  return (await getCampaignRole(c, campaignId, user.id)) === 'director' ? null : c.json({ error: 'Forbidden' }, 403);
}

async function validateOwnedPortraitAsset(c: Context<AppEnv>, assetId: string, user: AuthUser): Promise<Response | null> {
  const asset = await c.env.DB.prepare('SELECT type, content_type FROM assets WHERE id = ? AND user_id = ?')
    .bind(assetId, user.id)
    .first<{ type: string; content_type: string | null }>();
  if (!asset) return c.json({ error: 'Asset not found' }, 404);
  if (asset.type !== 'portrait') return c.json({ error: 'Asset must be a portrait' }, 400);
  if (asset.content_type && !asset.content_type.toLowerCase().startsWith('image/')) return c.json({ error: 'Asset must be an image' }, 400);
  return null;
}

function rowToPortrait(row: PortraitRow): MonsterPortrait {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    monsterName: row.monster_name,
    assetId: row.asset_id,
    portraitUrl: `/api/assets/${row.asset_id}/data`,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

monsterPortraitRoutes.get('/:campaignId/monster-portraits', async (c) => {
  const user = c.get('user') as AuthUser;
  const campaignId = c.req.param('campaignId');
  const membershipError = await requireCampaignMember(c, campaignId, user);
  if (membershipError) return membershipError;

  const results = await c.env.DB.prepare('SELECT * FROM monster_portraits WHERE campaign_id = ? ORDER BY monster_name ASC')
    .bind(campaignId)
    .all<PortraitRow>();
  return c.json({ portraits: results.results.map(rowToPortrait) });
});

monsterPortraitRoutes.post('/:campaignId/monster-portraits', async (c) => {
  const user = c.get('user') as AuthUser;
  const campaignId = c.req.param('campaignId');
  const directorError = await requireCampaignDirector(c, campaignId, user);
  if (directorError) return directorError;

  const body = await c.req.json<{ monsterName: string; assetId: string }>();
  if (!body.monsterName?.trim()) return c.json({ error: 'monsterName is required' }, 400);
  if (!body.assetId?.trim()) return c.json({ error: 'assetId is required' }, 400);
  const assetError = await validateOwnedPortraitAsset(c, body.assetId, user);
  if (assetError) return assetError;

  const monsterName = body.monsterName.trim();
  const existing = await c.env.DB.prepare('SELECT asset_id FROM monster_portraits WHERE campaign_id = ? AND monster_name = ?')
    .bind(campaignId, monsterName)
    .first<{ asset_id: string }>();

  if (existing && existing.asset_id !== body.assetId) {
    const oldAsset = await c.env.DB.prepare('SELECT storage_key FROM assets WHERE id = ?').bind(existing.asset_id).first<{ storage_key: string }>();
    if (oldAsset) {
      await c.env.ASSETS.delete(oldAsset.storage_key);
      await c.env.DB.prepare('DELETE FROM assets WHERE id = ?').bind(existing.asset_id).run();
    }
  }

  const id = crypto.randomUUID();
  await c.env.DB.prepare(
    `INSERT INTO monster_portraits (id, campaign_id, monster_name, asset_id)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(campaign_id, monster_name)
     DO UPDATE SET asset_id = excluded.asset_id, updated_at = datetime('now')`,
  ).bind(id, campaignId, monsterName, body.assetId).run();

  const row = await c.env.DB.prepare('SELECT * FROM monster_portraits WHERE campaign_id = ? AND monster_name = ?')
    .bind(campaignId, monsterName)
    .first<PortraitRow>();
  if (!row) return c.json({ error: 'Failed to save portrait' }, 500);
  return c.json({ portrait: rowToPortrait(row) }, 201);
});

monsterPortraitRoutes.delete('/:campaignId/monster-portraits/:monsterName', async (c) => {
  const user = c.get('user') as AuthUser;
  const campaignId = c.req.param('campaignId');
  const directorError = await requireCampaignDirector(c, campaignId, user);
  if (directorError) return directorError;

  const monsterName = decodeURIComponent(c.req.param('monsterName'));
  const row = await c.env.DB.prepare('SELECT * FROM monster_portraits WHERE campaign_id = ? AND monster_name = ?')
    .bind(campaignId, monsterName)
    .first<PortraitRow>();
  if (!row) return c.json({ error: 'Not found' }, 404);

  const asset = await c.env.DB.prepare('SELECT storage_key FROM assets WHERE id = ?').bind(row.asset_id).first<{ storage_key: string }>();
  if (asset) {
    await c.env.ASSETS.delete(asset.storage_key);
    await c.env.DB.prepare('DELETE FROM assets WHERE id = ?').bind(row.asset_id).run();
  }

  await c.env.DB.prepare('DELETE FROM monster_portraits WHERE id = ?').bind(row.id).run();
  return c.json({ ok: true });
});
