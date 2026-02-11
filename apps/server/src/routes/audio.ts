import { Hono } from 'hono';
import type { AppEnv } from '../types.js';
import { authMiddleware } from '../middleware/auth.js';
import type { AudioAsset, CreateAudioInput, UpdateAudioInput } from '@anvil/types';

export const audioRoutes = new Hono<AppEnv>();

audioRoutes.use('/*', authMiddleware);

// ── Helpers ──

interface AudioRow {
  id: string;
  campaign_id: string;
  name: string;
  asset_id: string;
  duration_seconds: number | null;
  audio_type: string | null;
  mood: string | null;
  created_at: string;
}

async function hydrateAudio(db: D1Database, row: AudioRow): Promise<AudioAsset> {
  const [sceneTypes, tags] = await Promise.all([
    db.prepare('SELECT scene_type FROM audio_scene_types WHERE audio_id = ?').bind(row.id).all<{ scene_type: string }>(),
    db.prepare('SELECT tag FROM audio_tags WHERE audio_id = ?').bind(row.id).all<{ tag: string }>(),
  ]);

  return {
    id: row.id,
    campaignId: row.campaign_id,
    name: row.name,
    assetId: row.asset_id,
    audioUrl: `/api/assets/${row.asset_id}/data`,
    durationSeconds: row.duration_seconds,
    audioType: row.audio_type as AudioAsset['audioType'],
    mood: row.mood as AudioAsset['mood'],
    sceneTypes: sceneTypes.results.map((r) => r.scene_type) as AudioAsset['sceneTypes'],
    tags: tags.results.map((r) => r.tag),
    createdAt: row.created_at,
  };
}

async function insertJoinTables(
  db: D1Database,
  audioId: string,
  sceneTypes?: string[],
  tags?: string[],
) {
  const stmts: D1PreparedStatement[] = [];
  for (const st of sceneTypes ?? []) {
    stmts.push(db.prepare('INSERT INTO audio_scene_types (audio_id, scene_type) VALUES (?, ?)').bind(audioId, st));
  }
  for (const tag of tags ?? []) {
    stmts.push(db.prepare('INSERT INTO audio_tags (audio_id, tag) VALUES (?, ?)').bind(audioId, tag));
  }
  if (stmts.length > 0) {
    await db.batch(stmts);
  }
}

async function deleteJoinTables(db: D1Database, audioId: string) {
  await db.batch([
    db.prepare('DELETE FROM audio_scene_types WHERE audio_id = ?').bind(audioId),
    db.prepare('DELETE FROM audio_tags WHERE audio_id = ?').bind(audioId),
  ]);
}

// ── Routes ──

// List audio assets with optional filters
audioRoutes.get('/:campaignId/audio', async (c) => {
  const campaignId = c.req.param('campaignId');
  const sceneType = c.req.query('scene_type');
  const mood = c.req.query('mood');
  const audioType = c.req.query('audio_type');
  const tag = c.req.query('tag');
  const q = c.req.query('q');

  let query = 'SELECT * FROM audio_assets WHERE campaign_id = ?';
  const binds: unknown[] = [campaignId];

  if (mood) { query += ' AND mood = ?'; binds.push(mood); }
  if (audioType) { query += ' AND audio_type = ?'; binds.push(audioType); }
  if (q) { query += ' AND name LIKE ?'; binds.push(`%${q}%`); }

  if (sceneType) {
    query += ' AND id IN (SELECT audio_id FROM audio_scene_types WHERE scene_type = ?)';
    binds.push(sceneType);
  }
  if (tag) {
    query += ' AND id IN (SELECT audio_id FROM audio_tags WHERE tag = ?)';
    binds.push(tag);
  }

  query += ' ORDER BY created_at DESC';

  const results = await c.env.DB.prepare(query).bind(...binds).all<AudioRow>();
  const audio = await Promise.all(results.results.map((row) => hydrateAudio(c.env.DB, row)));

  return c.json({ audio });
});

// Create audio asset
audioRoutes.post('/:campaignId/audio', async (c) => {
  const campaignId = c.req.param('campaignId');
  const body = await c.req.json<CreateAudioInput & { assetId: string }>();

  if (!body.name?.trim()) return c.json({ error: 'Name is required' }, 400);
  if (!body.assetId) return c.json({ error: 'Asset ID is required' }, 400);

  const id = crypto.randomUUID();

  await c.env.DB.prepare(
    `INSERT INTO audio_assets (id, campaign_id, name, asset_id, duration_seconds, audio_type, mood)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      id,
      campaignId,
      body.name.trim(),
      body.assetId,
      body.durationSeconds ?? null,
      body.audioType ?? null,
      body.mood ?? null,
    )
    .run();

  await insertJoinTables(c.env.DB, id, body.sceneTypes, body.tags);

  const row = await c.env.DB.prepare('SELECT * FROM audio_assets WHERE id = ?').bind(id).first<AudioRow>();
  if (!row) return c.json({ error: 'Failed to create audio asset' }, 500);

  const audio = await hydrateAudio(c.env.DB, row);
  return c.json({ audio }, 201);
});

// Update audio asset
audioRoutes.patch('/:campaignId/audio/:audioId', async (c) => {
  const campaignId = c.req.param('campaignId');
  const audioId = c.req.param('audioId');
  const body = await c.req.json<UpdateAudioInput>();

  const existing = await c.env.DB.prepare('SELECT id FROM audio_assets WHERE id = ? AND campaign_id = ?')
    .bind(audioId, campaignId)
    .first();
  if (!existing) return c.json({ error: 'Not found' }, 404);

  const sets: string[] = [];
  const vals: unknown[] = [];

  if (body.name !== undefined) { sets.push('name = ?'); vals.push(body.name.trim()); }
  if (body.audioType !== undefined) { sets.push('audio_type = ?'); vals.push(body.audioType); }
  if (body.mood !== undefined) { sets.push('mood = ?'); vals.push(body.mood); }

  if (sets.length > 0) {
    vals.push(audioId);
    await c.env.DB.prepare(`UPDATE audio_assets SET ${sets.join(', ')} WHERE id = ?`)
      .bind(...vals)
      .run();
  }

  // Replace join tables if provided
  if (body.sceneTypes !== undefined || body.tags !== undefined) {
    await deleteJoinTables(c.env.DB, audioId);
    await insertJoinTables(
      c.env.DB,
      audioId,
      body.sceneTypes ?? (await c.env.DB.prepare('SELECT scene_type FROM audio_scene_types WHERE audio_id = ?').bind(audioId).all<{ scene_type: string }>()).results.map((r) => r.scene_type),
      body.tags ?? (await c.env.DB.prepare('SELECT tag FROM audio_tags WHERE audio_id = ?').bind(audioId).all<{ tag: string }>()).results.map((r) => r.tag),
    );
  }

  const row = await c.env.DB.prepare('SELECT * FROM audio_assets WHERE id = ?').bind(audioId).first<AudioRow>();
  if (!row) return c.json({ error: 'Not found' }, 404);

  const audio = await hydrateAudio(c.env.DB, row);
  return c.json({ audio });
});

// Delete audio asset
audioRoutes.delete('/:campaignId/audio/:audioId', async (c) => {
  const campaignId = c.req.param('campaignId');
  const audioId = c.req.param('audioId');

  const existing = await c.env.DB.prepare('SELECT * FROM audio_assets WHERE id = ? AND campaign_id = ?')
    .bind(audioId, campaignId)
    .first<AudioRow>();
  if (!existing) return c.json({ error: 'Not found' }, 404);

  // Clean up R2 asset
  const asset = await c.env.DB.prepare('SELECT storage_key FROM assets WHERE id = ?')
    .bind(existing.asset_id)
    .first<{ storage_key: string }>();
  if (asset) {
    await c.env.ASSETS.delete(asset.storage_key);
    await c.env.DB.prepare('DELETE FROM assets WHERE id = ?').bind(existing.asset_id).run();
  }

  await c.env.DB.prepare('DELETE FROM audio_assets WHERE id = ?').bind(audioId).run();
  return c.json({ ok: true });
});
