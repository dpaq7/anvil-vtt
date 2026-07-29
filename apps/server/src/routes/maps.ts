import { Hono } from 'hono';
import type { AppEnv, AuthUser } from '../types.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireCampaignDirector, requireCampaignMember } from '../security/authorization.js';
import { assetDataUrl, validateOwnedMapAsset } from '../security/assets.js';
import { escapeLikePattern } from '../security/validation.js';
import type { CreateMapInput, MapAsset, UpdateMapInput } from '@anvil/types';

export const mapRoutes = new Hono<AppEnv>();

mapRoutes.use('/*', authMiddleware);

interface MapRow {
  id: string;
  campaign_id: string;
  name: string;
  asset_id: string | null;
  scene_type: string | null;
  grid_type: string;
  size: string;
  width: number | null;
  height: number | null;
  created_at: string;
  updated_at: string;
}

async function hydrateMap(db: D1Database, row: MapRow): Promise<MapAsset> {
  const [terrains, biomes, tags] = await Promise.all([
    db.prepare('SELECT terrain FROM map_terrains WHERE map_id = ?').bind(row.id).all<{ terrain: string }>(),
    db.prepare('SELECT biome FROM map_biomes WHERE map_id = ?').bind(row.id).all<{ biome: string }>(),
    db.prepare('SELECT tag FROM map_tags WHERE map_id = ?').bind(row.id).all<{ tag: string }>(),
  ]);

  return {
    id: row.id,
    campaignId: row.campaign_id,
    name: row.name,
    assetId: row.asset_id,
    imageUrl: row.asset_id ? assetDataUrl(row.asset_id) : undefined,
    sceneType: row.scene_type as MapAsset['sceneType'],
    gridType: (row.grid_type ?? 'gridded') as MapAsset['gridType'],
    size: (row.size ?? 'medium') as MapAsset['size'],
    width: row.width,
    height: row.height,
    terrains: terrains.results.map((r) => r.terrain) as MapAsset['terrains'],
    biomes: biomes.results.map((r) => r.biome) as MapAsset['biomes'],
    tags: tags.results.map((r) => r.tag),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function insertJoinTables(db: D1Database, mapId: string, terrains?: string[], biomes?: string[], tags?: string[]) {
  const stmts: D1PreparedStatement[] = [];
  for (const t of terrains ?? []) stmts.push(db.prepare('INSERT INTO map_terrains (map_id, terrain) VALUES (?, ?)').bind(mapId, t));
  for (const b of biomes ?? []) stmts.push(db.prepare('INSERT INTO map_biomes (map_id, biome) VALUES (?, ?)').bind(mapId, b));
  for (const tag of tags ?? []) stmts.push(db.prepare('INSERT INTO map_tags (map_id, tag) VALUES (?, ?)').bind(mapId, tag));
  if (stmts.length > 0) await db.batch(stmts);
}

async function deleteJoinTables(db: D1Database, mapId: string) {
  await db.batch([
    db.prepare('DELETE FROM map_terrains WHERE map_id = ?').bind(mapId),
    db.prepare('DELETE FROM map_biomes WHERE map_id = ?').bind(mapId),
    db.prepare('DELETE FROM map_tags WHERE map_id = ?').bind(mapId),
  ]);
}

mapRoutes.get('/:campaignId/maps', async (c) => {
  const user = c.get('user') as AuthUser;
  const campaignId = c.req.param('campaignId');
  const membershipError = await requireCampaignMember(c, campaignId, user);
  if (membershipError) return membershipError;

  const sceneType = c.req.query('scene_type');
  const terrain = c.req.query('terrain');
  const biome = c.req.query('biome');
  const gridType = c.req.query('grid_type');
  const size = c.req.query('size');
  const tag = c.req.query('tag');
  const q = c.req.query('q');

  let query = 'SELECT * FROM maps WHERE campaign_id = ?';
  const binds: unknown[] = [campaignId];
  if (sceneType) { query += ' AND scene_type = ?'; binds.push(sceneType); }
  if (gridType) { query += ' AND grid_type = ?'; binds.push(gridType); }
  if (size) { query += ' AND size = ?'; binds.push(size); }
  if (q) { query += " AND name LIKE ? ESCAPE '\\'"; binds.push(`%${escapeLikePattern(q)}%`); }
  if (terrain) { query += ' AND id IN (SELECT map_id FROM map_terrains WHERE terrain = ?)'; binds.push(terrain); }
  if (biome) { query += ' AND id IN (SELECT map_id FROM map_biomes WHERE biome = ?)'; binds.push(biome); }
  if (tag) { query += ' AND id IN (SELECT map_id FROM map_tags WHERE tag = ?)'; binds.push(tag); }
  query += ' ORDER BY updated_at DESC';

  const results = await c.env.DB.prepare(query).bind(...binds).all<MapRow>();
  const maps = await Promise.all(results.results.map((row) => hydrateMap(c.env.DB, row)));
  return c.json({ maps });
});

mapRoutes.post('/:campaignId/maps', async (c) => {
  const user = c.get('user') as AuthUser;
  const campaignId = c.req.param('campaignId');
  const directorError = await requireCampaignDirector(c, campaignId, user);
  if (directorError) return directorError;

  const body = await c.req.json<CreateMapInput & { assetId?: string }>();
  if (!body.name?.trim()) return c.json({ error: 'Name is required' }, 400);
  const assetError = await validateOwnedMapAsset(c, body.assetId, user);
  if (assetError) return assetError;

  const id = crypto.randomUUID();
  await c.env.DB.prepare(
    `INSERT INTO maps (id, campaign_id, name, asset_id, scene_type, grid_type, size, width, height)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(
    id,
    campaignId,
    body.name.trim(),
    body.assetId ?? null,
    body.sceneType ?? null,
    body.gridType ?? 'gridded',
    body.size ?? 'medium',
    body.width ?? null,
    body.height ?? null,
  ).run();

  await insertJoinTables(c.env.DB, id, body.terrains, body.biomes, body.tags);
  const row = await c.env.DB.prepare('SELECT * FROM maps WHERE id = ?').bind(id).first<MapRow>();
  if (!row) return c.json({ error: 'Failed to create map' }, 500);
  return c.json({ map: await hydrateMap(c.env.DB, row) }, 201);
});

mapRoutes.patch('/:campaignId/maps/:mapId', async (c) => {
  const user = c.get('user') as AuthUser;
  const campaignId = c.req.param('campaignId');
  const directorError = await requireCampaignDirector(c, campaignId, user);
  if (directorError) return directorError;

  const mapId = c.req.param('mapId');
  const body = await c.req.json<UpdateMapInput>();
  const existing = await c.env.DB.prepare('SELECT * FROM maps WHERE id = ? AND campaign_id = ?').bind(mapId, campaignId).first<MapRow>();
  if (!existing) return c.json({ error: 'Not found' }, 404);

  const sets: string[] = [];
  const vals: unknown[] = [];
  if (body.name !== undefined) { sets.push('name = ?'); vals.push(body.name.trim()); }
  if (body.sceneType !== undefined) { sets.push('scene_type = ?'); vals.push(body.sceneType); }
  if (body.gridType !== undefined) { sets.push('grid_type = ?'); vals.push(body.gridType); }
  if (body.size !== undefined) { sets.push('size = ?'); vals.push(body.size); }
  if (sets.length > 0) {
    sets.push("updated_at = datetime('now')");
    vals.push(mapId);
    await c.env.DB.prepare(`UPDATE maps SET ${sets.join(', ')} WHERE id = ?`).bind(...vals).run();
  }

  if (body.terrains !== undefined || body.biomes !== undefined || body.tags !== undefined) {
    const oldTerrains = (await c.env.DB.prepare('SELECT terrain FROM map_terrains WHERE map_id = ?').bind(mapId).all<{ terrain: string }>()).results.map((r) => r.terrain);
    const oldBiomes = (await c.env.DB.prepare('SELECT biome FROM map_biomes WHERE map_id = ?').bind(mapId).all<{ biome: string }>()).results.map((r) => r.biome);
    const oldTags = (await c.env.DB.prepare('SELECT tag FROM map_tags WHERE map_id = ?').bind(mapId).all<{ tag: string }>()).results.map((r) => r.tag);
    await deleteJoinTables(c.env.DB, mapId);
    await insertJoinTables(c.env.DB, mapId, body.terrains ?? oldTerrains, body.biomes ?? oldBiomes, body.tags ?? oldTags);
  }

  const row = await c.env.DB.prepare('SELECT * FROM maps WHERE id = ?').bind(mapId).first<MapRow>();
  if (!row) return c.json({ error: 'Not found' }, 404);
  return c.json({ map: await hydrateMap(c.env.DB, row) });
});

mapRoutes.delete('/:campaignId/maps/:mapId', async (c) => {
  const user = c.get('user') as AuthUser;
  const campaignId = c.req.param('campaignId');
  const directorError = await requireCampaignDirector(c, campaignId, user);
  if (directorError) return directorError;

  const mapId = c.req.param('mapId');
  const existing = await c.env.DB.prepare('SELECT * FROM maps WHERE id = ? AND campaign_id = ?').bind(mapId, campaignId).first<MapRow>();
  if (!existing) return c.json({ error: 'Not found' }, 404);

  if (existing.asset_id) {
    const asset = await c.env.DB.prepare('SELECT storage_key FROM assets WHERE id = ?').bind(existing.asset_id).first<{ storage_key: string }>();
    if (asset) {
      await c.env.ASSETS.delete(asset.storage_key);
      await c.env.DB.prepare('DELETE FROM assets WHERE id = ?').bind(existing.asset_id).run();
    }
  }

  await c.env.DB.prepare('DELETE FROM maps WHERE id = ?').bind(mapId).run();
  return c.json({ ok: true });
});
