import { Hono } from 'hono';
import type { Context } from 'hono';
import type { AppEnv, AuthUser } from '../types.js';
import { authMiddleware } from '../middleware/auth.js';

export const assetRoutes = new Hono<AppEnv>();

assetRoutes.use('/*', authMiddleware);

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const VALID_TYPES = ['map', 'token', 'portrait', 'handout', 'audio', 'other'] as const;

interface AssetRow {
  id: string;
  user_id: string;
  name: string;
  type: string;
  storage_key: string;
  content_type: string | null;
  file_size: number | null;
}

function extensionForContentType(contentType: string): string {
  const normalized = contentType.toLowerCase().split(';')[0]?.trim() ?? '';
  const known: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'audio/mpeg': 'mp3',
    'audio/mp3': 'mp3',
    'audio/wav': 'wav',
    'audio/x-wav': 'wav',
    'audio/ogg': 'ogg',
    'audio/webm': 'webm',
    'application/pdf': 'pdf',
  };
  return known[normalized] ?? 'bin';
}

function isAllowedContentType(assetType: string, contentType: string): boolean {
  const normalized = contentType.toLowerCase().split(';')[0]?.trim() ?? '';
  if (assetType === 'map' || assetType === 'token' || assetType === 'portrait') return normalized.startsWith('image/');
  if (assetType === 'audio') return normalized.startsWith('audio/');
  if (assetType === 'handout') return normalized.startsWith('image/') || normalized === 'application/pdf' || normalized.startsWith('text/');
  return normalized.startsWith('image/') || normalized.startsWith('audio/') || normalized === 'application/pdf' || normalized === 'application/octet-stream';
}

async function canAccessAsset(c: Context<AppEnv>, assetId: string, userId: string): Promise<boolean> {
  const row = await c.env.DB.prepare('SELECT id FROM assets WHERE id = ? AND user_id = ?')
    .bind(assetId, userId)
    .first<{ id: string }>();
  if (row) return true;

  const linked = await c.env.DB.prepare(
    `SELECT 1
     FROM campaign_members cm
     WHERE cm.user_id = ? AND (
       EXISTS (SELECT 1 FROM maps m WHERE m.asset_id = ? AND m.campaign_id = cm.campaign_id)
       OR EXISTS (SELECT 1 FROM audio_assets aa WHERE aa.asset_id = ? AND aa.campaign_id = cm.campaign_id)
       OR EXISTS (SELECT 1 FROM custom_terrain ct WHERE ct.asset_id = ? AND ct.campaign_id = cm.campaign_id)
       OR EXISTS (SELECT 1 FROM monster_portraits mp WHERE mp.asset_id = ? AND mp.campaign_id = cm.campaign_id)
       OR EXISTS (SELECT 1 FROM npcs n WHERE n.portrait_asset_id = ? AND n.campaign_id = cm.campaign_id)
     )
     LIMIT 1`,
  )
    .bind(userId, assetId, assetId, assetId, assetId, assetId)
    .first<{ 1: number }>();
  return linked !== null;
}

function parseRange(rangeHeader: string | null, size: number): { start: number; end: number } | null {
  if (!rangeHeader?.startsWith('bytes=')) return null;
  const [startRaw, endRaw] = rangeHeader.slice('bytes='.length).split('-', 2);
  if (!startRaw && !endRaw) return null;

  if (!startRaw && endRaw) {
    const suffixLength = Number.parseInt(endRaw, 10);
    if (!Number.isFinite(suffixLength) || suffixLength <= 0) return null;
    return { start: Math.max(0, size - suffixLength), end: size - 1 };
  }

  const start = Number.parseInt(startRaw ?? '', 10);
  const end = endRaw ? Number.parseInt(endRaw, 10) : size - 1;
  if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end < start || start >= size) return null;
  return { start, end: Math.min(end, size - 1) };
}

// Register an asset before uploading bytes to R2.
assetRoutes.post('/upload', async (c) => {
  const user = c.get('user') as AuthUser;
  const body = await c.req.json<{ name: string; type: string; contentType: string; size?: number }>();

  if (!VALID_TYPES.includes(body.type as (typeof VALID_TYPES)[number])) return c.json({ error: 'Invalid type' }, 400);
  if (!body.name?.trim()) return c.json({ error: 'Name is required' }, 400);
  if (!body.contentType?.trim()) return c.json({ error: 'Content type is required' }, 400);
  if (!isAllowedContentType(body.type, body.contentType)) return c.json({ error: 'File type is not allowed for this asset' }, 400);
  if (body.size !== undefined && (!Number.isFinite(body.size) || body.size <= 0 || body.size > MAX_FILE_SIZE)) {
    return c.json({ error: 'File is too large' }, 400);
  }

  const id = crypto.randomUUID();
  const ext = extensionForContentType(body.contentType);
  const storageKey = `${user.id}/${id}.${ext}`;

  await c.env.DB.prepare(
    `INSERT INTO assets (id, user_id, name, type, storage_key, content_type, file_size)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(id, user.id, body.name.trim(), body.type, storageKey, body.contentType, body.size ?? null)
    .run();

  return c.json({ id, storageKey });
});

// Complete upload (client uploads bytes in a second request)
assetRoutes.put('/:id/data', async (c) => {
  const user = c.get('user') as AuthUser;
  const assetId = c.req.param('id');

  const asset = await c.env.DB.prepare('SELECT * FROM assets WHERE id = ? AND user_id = ?')
    .bind(assetId, user.id)
    .first<AssetRow>();
  if (!asset) return c.json({ error: 'Not found' }, 404);

  const contentType = c.req.header('content-type') ?? asset.content_type ?? 'application/octet-stream';
  if (!isAllowedContentType(asset.type, contentType)) return c.json({ error: 'File type is not allowed for this asset' }, 400);

  const data = await c.req.arrayBuffer();
  if (data.byteLength === 0) return c.json({ error: 'File is empty' }, 400);
  if (data.byteLength > MAX_FILE_SIZE) return c.json({ error: 'File is too large' }, 400);
  if (asset.file_size !== null && asset.file_size !== data.byteLength) return c.json({ error: 'Upload size mismatch' }, 400);

  await c.env.ASSETS.put(asset.storage_key, data, {
    httpMetadata: { contentType },
  });

  await c.env.DB.prepare("UPDATE assets SET content_type = ?, file_size = ?, uploaded_at = datetime('now') WHERE id = ?")
    .bind(contentType, data.byteLength, assetId)
    .run();

  return c.json({ ok: true });
});

// Serve asset binary from R2 (image/audio proxy)
assetRoutes.get('/:id/data', async (c) => {
  const user = c.get('user') as AuthUser;
  const assetId = c.req.param('id');

  const asset = await c.env.DB.prepare('SELECT * FROM assets WHERE id = ?')
    .bind(assetId)
    .first<AssetRow>();
  if (!asset) return c.json({ error: 'Not found' }, 404);
  if (!(await canAccessAsset(c, assetId, user.id))) return c.json({ error: 'Forbidden' }, 403);

  const object = await c.env.ASSETS.get(asset.storage_key);
  if (!object) return c.json({ error: 'File not found' }, 404);

  const size = asset.file_size ?? object.size;
  const range = parseRange(c.req.header('range') ?? null, size);
  const headers = new Headers();
  headers.set('Content-Type', object.httpMetadata?.contentType ?? asset.content_type ?? 'application/octet-stream');
  headers.set('Cache-Control', 'private, max-age=3600');
  headers.set('Accept-Ranges', 'bytes');

  if (range) {
    const fullBuffer = await object.arrayBuffer();
    const chunk = fullBuffer.slice(range.start, range.end + 1);
    headers.set('Content-Length', String(chunk.byteLength));
    headers.set('Content-Range', `bytes ${range.start}-${range.end}/${size}`);
    return new Response(chunk, { status: 206, headers });
  }

  if (size > 0) headers.set('Content-Length', String(size));
  return new Response(object.body, { headers });
});

// List assets owned by the current user
assetRoutes.get('/', async (c) => {
  const user = c.get('user') as AuthUser;
  const typeFilter = c.req.query('type');

  let query = 'SELECT * FROM assets WHERE user_id = ?';
  const binds: unknown[] = [user.id];
  if (typeFilter) {
    query += ' AND type = ?';
    binds.push(typeFilter);
  }
  query += ' ORDER BY created_at DESC';

  const results = await c.env.DB.prepare(query).bind(...binds).all();
  return c.json({ assets: results.results });
});

// Delete an owned unlinked asset. Linked campaign asset cleanup goes through the owning campaign record.
assetRoutes.delete('/:id', async (c) => {
  const user = c.get('user') as AuthUser;
  const assetId = c.req.param('id');

  const asset = await c.env.DB.prepare('SELECT * FROM assets WHERE id = ? AND user_id = ?')
    .bind(assetId, user.id)
    .first<AssetRow>();
  if (!asset) return c.json({ error: 'Not found' }, 404);

  const linked = await c.env.DB.prepare(
    `SELECT 1 WHERE
      EXISTS (SELECT 1 FROM maps WHERE asset_id = ?)
      OR EXISTS (SELECT 1 FROM audio_assets WHERE asset_id = ?)
      OR EXISTS (SELECT 1 FROM custom_terrain WHERE asset_id = ?)
      OR EXISTS (SELECT 1 FROM monster_portraits WHERE asset_id = ?)
      OR EXISTS (SELECT 1 FROM npcs WHERE portrait_asset_id = ?)
     LIMIT 1`,
  )
    .bind(assetId, assetId, assetId, assetId, assetId)
    .first<{ 1: number }>();
  if (linked) return c.json({ error: 'Asset is in use' }, 409);

  await c.env.ASSETS.delete(asset.storage_key);
  await c.env.DB.prepare('DELETE FROM assets WHERE id = ?').bind(assetId).run();

  return c.json({ ok: true });
});
