import { Hono } from 'hono';
import type { AppEnv } from '../types.js';
import { authMiddleware } from '../middleware/auth.js';
import type { CreateCustomTerrainInput, CustomTerrain } from '@anvil/types';

export const customTerrainRoutes = new Hono<AppEnv>();

customTerrainRoutes.use('/*', authMiddleware);

// ── Helpers ──

interface CustomTerrainRow {
  id: string;
  campaign_id: string;
  name: string;
  asset_id: string | null;
  category: string;
  grid_width: number;
  grid_height: number;
  material: string | null;
  created_at: string;
}

function rowToCustomTerrain(row: CustomTerrainRow): CustomTerrain {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    name: row.name,
    assetId: row.asset_id,
    category: row.category as CustomTerrain['category'],
    gridWidth: row.grid_width,
    gridHeight: row.grid_height,
    material: row.material as CustomTerrain['material'],
    createdAt: row.created_at,
  };
}

// ── Routes ──

// List custom terrain with optional category filter
customTerrainRoutes.get('/:campaignId/terrain', async (c) => {
  const campaignId = c.req.param('campaignId');
  const category = c.req.query('category');

  let query = 'SELECT * FROM custom_terrain WHERE campaign_id = ?';
  const binds: unknown[] = [campaignId];

  if (category) {
    query += ' AND category = ?';
    binds.push(category);
  }

  query += ' ORDER BY created_at DESC';

  const results = await c.env.DB.prepare(query).bind(...binds).all<CustomTerrainRow>();
  return c.json({ terrain: results.results.map(rowToCustomTerrain) });
});

// Create custom terrain
customTerrainRoutes.post('/:campaignId/terrain', async (c) => {
  const campaignId = c.req.param('campaignId');
  const body = await c.req.json<CreateCustomTerrainInput & { assetId?: string }>();

  if (!body.name?.trim()) return c.json({ error: 'Name is required' }, 400);
  if (!body.category) return c.json({ error: 'Category is required' }, 400);

  const id = crypto.randomUUID();

  await c.env.DB.prepare(
    `INSERT INTO custom_terrain (id, campaign_id, name, asset_id, category, grid_width, grid_height, material)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      id,
      campaignId,
      body.name.trim(),
      body.assetId ?? null,
      body.category,
      body.gridWidth ?? 1,
      body.gridHeight ?? 1,
      body.material ?? null,
    )
    .run();

  const row = await c.env.DB.prepare('SELECT * FROM custom_terrain WHERE id = ?')
    .bind(id)
    .first<CustomTerrainRow>();
  if (!row) return c.json({ error: 'Failed to create terrain' }, 500);

  return c.json({ terrain: rowToCustomTerrain(row) }, 201);
});

// Update custom terrain metadata
customTerrainRoutes.patch('/:campaignId/terrain/:terrainId', async (c) => {
  const campaignId = c.req.param('campaignId');
  const terrainId = c.req.param('terrainId');
  const body = await c.req.json<Partial<CreateCustomTerrainInput>>();

  const existing = await c.env.DB.prepare('SELECT id FROM custom_terrain WHERE id = ? AND campaign_id = ?')
    .bind(terrainId, campaignId)
    .first();
  if (!existing) return c.json({ error: 'Not found' }, 404);

  const sets: string[] = [];
  const vals: unknown[] = [];

  if (body.name !== undefined) { sets.push('name = ?'); vals.push(body.name.trim()); }
  if (body.category !== undefined) { sets.push('category = ?'); vals.push(body.category); }
  if (body.gridWidth !== undefined) { sets.push('grid_width = ?'); vals.push(body.gridWidth); }
  if (body.gridHeight !== undefined) { sets.push('grid_height = ?'); vals.push(body.gridHeight); }
  if (body.material !== undefined) { sets.push('material = ?'); vals.push(body.material); }

  if (sets.length === 0) return c.json({ error: 'No fields to update' }, 400);

  vals.push(terrainId);
  await c.env.DB.prepare(`UPDATE custom_terrain SET ${sets.join(', ')} WHERE id = ?`)
    .bind(...vals)
    .run();

  const row = await c.env.DB.prepare('SELECT * FROM custom_terrain WHERE id = ?')
    .bind(terrainId)
    .first<CustomTerrainRow>();
  if (!row) return c.json({ error: 'Not found' }, 404);

  return c.json({ terrain: rowToCustomTerrain(row) });
});

// Delete custom terrain
customTerrainRoutes.delete('/:campaignId/terrain/:terrainId', async (c) => {
  const campaignId = c.req.param('campaignId');
  const terrainId = c.req.param('terrainId');

  const existing = await c.env.DB.prepare('SELECT * FROM custom_terrain WHERE id = ? AND campaign_id = ?')
    .bind(terrainId, campaignId)
    .first<CustomTerrainRow>();
  if (!existing) return c.json({ error: 'Not found' }, 404);

  // Clean up R2 asset if linked
  if (existing.asset_id) {
    const asset = await c.env.DB.prepare('SELECT storage_key FROM assets WHERE id = ?')
      .bind(existing.asset_id)
      .first<{ storage_key: string }>();
    if (asset) {
      await c.env.ASSETS.delete(asset.storage_key);
      await c.env.DB.prepare('DELETE FROM assets WHERE id = ?').bind(existing.asset_id).run();
    }
  }

  await c.env.DB.prepare('DELETE FROM custom_terrain WHERE id = ?').bind(terrainId).run();
  return c.json({ ok: true });
});
