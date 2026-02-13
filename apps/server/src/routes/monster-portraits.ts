import { Hono } from 'hono';
import type { AppEnv } from '../types.js';
import { authMiddleware } from '../middleware/auth.js';
import type { MonsterPortrait } from '@anvil/types';

export const monsterPortraitRoutes = new Hono<AppEnv>();

monsterPortraitRoutes.use('/*', authMiddleware);

// ── Helpers ──

interface PortraitRow {
  id: string;
  campaign_id: string;
  monster_name: string;
  asset_id: string;
  created_at: string;
  updated_at: string;
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

// ── Routes ──

// List all monster portraits for a campaign
monsterPortraitRoutes.get('/:campaignId/monster-portraits', async (c) => {
  const campaignId = c.req.param('campaignId');
  const results = await c.env.DB.prepare(
    'SELECT * FROM monster_portraits WHERE campaign_id = ? ORDER BY monster_name ASC',
  )
    .bind(campaignId)
    .all<PortraitRow>();
  return c.json({ portraits: results.results.map(rowToPortrait) });
});

// Create or replace a monster portrait
monsterPortraitRoutes.post('/:campaignId/monster-portraits', async (c) => {
  const campaignId = c.req.param('campaignId');
  const body = await c.req.json<{ monsterName: string; assetId: string }>();

  if (!body.monsterName?.trim()) return c.json({ error: 'monsterName is required' }, 400);
  if (!body.assetId?.trim()) return c.json({ error: 'assetId is required' }, 400);

  // Check if there's an existing portrait for this monster — clean up old asset
  const existing = await c.env.DB.prepare(
    'SELECT asset_id FROM monster_portraits WHERE campaign_id = ? AND monster_name = ?',
  )
    .bind(campaignId, body.monsterName.trim())
    .first<{ asset_id: string }>();

  if (existing && existing.asset_id !== body.assetId) {
    // Delete old asset from R2 and assets table
    const oldAsset = await c.env.DB.prepare('SELECT storage_key FROM assets WHERE id = ?')
      .bind(existing.asset_id)
      .first<{ storage_key: string }>();
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
  )
    .bind(id, campaignId, body.monsterName.trim(), body.assetId)
    .run();

  const row = await c.env.DB.prepare(
    'SELECT * FROM monster_portraits WHERE campaign_id = ? AND monster_name = ?',
  )
    .bind(campaignId, body.monsterName.trim())
    .first<PortraitRow>();

  if (!row) return c.json({ error: 'Failed to save portrait' }, 500);

  return c.json({ portrait: rowToPortrait(row) }, 201);
});

// Delete a monster portrait
monsterPortraitRoutes.delete('/:campaignId/monster-portraits/:monsterName', async (c) => {
  const campaignId = c.req.param('campaignId');
  const monsterName = decodeURIComponent(c.req.param('monsterName'));

  const row = await c.env.DB.prepare(
    'SELECT * FROM monster_portraits WHERE campaign_id = ? AND monster_name = ?',
  )
    .bind(campaignId, monsterName)
    .first<PortraitRow>();

  if (!row) return c.json({ error: 'Not found' }, 404);

  // Delete the underlying asset from R2 and assets table
  const asset = await c.env.DB.prepare('SELECT storage_key FROM assets WHERE id = ?')
    .bind(row.asset_id)
    .first<{ storage_key: string }>();
  if (asset) {
    await c.env.ASSETS.delete(asset.storage_key);
    await c.env.DB.prepare('DELETE FROM assets WHERE id = ?').bind(row.asset_id).run();
  }

  // Delete the portrait row (CASCADE from assets may already handle this, but be explicit)
  await c.env.DB.prepare('DELETE FROM monster_portraits WHERE id = ?').bind(row.id).run();

  return c.json({ ok: true });
});
