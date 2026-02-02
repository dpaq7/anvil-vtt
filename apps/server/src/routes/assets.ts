import { Hono } from 'hono';
import type { AppEnv, AuthUser } from '../types.js';
import { authMiddleware } from '../middleware/auth.js';

export const assetRoutes = new Hono<AppEnv>();

assetRoutes.use('/*', authMiddleware);

// Upload asset directly to R2
assetRoutes.post('/upload', async (c) => {
  const user = c.get('user') as AuthUser;
  const body = await c.req.json<{ name: string; type: string; contentType: string }>();

  const validTypes = ['map', 'token', 'portrait', 'handout', 'other'];
  if (!validTypes.includes(body.type)) return c.json({ error: 'Invalid type' }, 400);
  if (!body.name?.trim()) return c.json({ error: 'Name is required' }, 400);

  const id = crypto.randomUUID();
  const ext = body.contentType.split('/')[1] || 'bin';
  const storageKey = `${user.id}/${id}.${ext}`;

  await c.env.DB.prepare(
    'INSERT INTO assets (id, user_id, name, type, storage_key) VALUES (?, ?, ?, ?, ?)',
  )
    .bind(id, user.id, body.name.trim(), body.type, storageKey)
    .run();

  return c.json({ id, storageKey });
});

// Complete upload (client uploads bytes in a second request)
assetRoutes.put('/:id/data', async (c) => {
  const user = c.get('user') as AuthUser;
  const assetId = c.req.param('id');

  const asset = await c.env.DB.prepare('SELECT * FROM assets WHERE id = ? AND user_id = ?')
    .bind(assetId, user.id)
    .first<{ storage_key: string }>();
  if (!asset) return c.json({ error: 'Not found' }, 404);

  const data = await c.req.arrayBuffer();
  await c.env.ASSETS.put(asset.storage_key, data);

  return c.json({ ok: true });
});

// List assets
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

// Delete asset
assetRoutes.delete('/:id', async (c) => {
  const user = c.get('user') as AuthUser;
  const assetId = c.req.param('id');

  const asset = await c.env.DB.prepare('SELECT * FROM assets WHERE id = ? AND user_id = ?')
    .bind(assetId, user.id)
    .first<{ storage_key: string }>();
  if (!asset) return c.json({ error: 'Not found' }, 404);

  await c.env.ASSETS.delete(asset.storage_key);
  await c.env.DB.prepare('DELETE FROM assets WHERE id = ?').bind(assetId).run();

  return c.json({ ok: true });
});
