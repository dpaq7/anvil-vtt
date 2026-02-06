import { Hono } from 'hono';
import type { AppEnv } from '../types.js';
import { authMiddleware } from '../middleware/auth.js';
import type { CreateNpcInput, Npc, UpdateNpcInput } from '@anvil/types';

export const npcRoutes = new Hono<AppEnv>();

npcRoutes.use('/*', authMiddleware);

// ── Helpers ──

interface NpcRow {
  id: string;
  campaign_id: string;
  name: string;
  portrait_asset_id: string | null;
  location: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

function rowToNpc(row: NpcRow): Npc {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    name: row.name,
    portraitAssetId: row.portrait_asset_id,
    location: row.location,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ── Routes ──

// List NPCs with optional search
npcRoutes.get('/:campaignId/npcs', async (c) => {
  const campaignId = c.req.param('campaignId');
  const q = c.req.query('q');

  let query = 'SELECT * FROM npcs WHERE campaign_id = ?';
  const binds: unknown[] = [campaignId];

  if (q) {
    query += ' AND name LIKE ?';
    binds.push(`%${q}%`);
  }

  query += ' ORDER BY updated_at DESC';

  const results = await c.env.DB.prepare(query).bind(...binds).all<NpcRow>();
  return c.json({ npcs: results.results.map(rowToNpc) });
});

// Create NPC
npcRoutes.post('/:campaignId/npcs', async (c) => {
  const campaignId = c.req.param('campaignId');
  const body = await c.req.json<CreateNpcInput>();

  if (!body.name?.trim()) return c.json({ error: 'Name is required' }, 400);

  const id = crypto.randomUUID();

  await c.env.DB.prepare(
    'INSERT INTO npcs (id, campaign_id, name, location, notes) VALUES (?, ?, ?, ?, ?)',
  )
    .bind(id, campaignId, body.name.trim(), body.location ?? null, body.notes ?? null)
    .run();

  const row = await c.env.DB.prepare('SELECT * FROM npcs WHERE id = ?').bind(id).first<NpcRow>();
  if (!row) return c.json({ error: 'Failed to create NPC' }, 500);

  return c.json({ npc: rowToNpc(row) }, 201);
});

// Update NPC
npcRoutes.patch('/:campaignId/npcs/:npcId', async (c) => {
  const campaignId = c.req.param('campaignId');
  const npcId = c.req.param('npcId');
  const body = await c.req.json<UpdateNpcInput>();

  const existing = await c.env.DB.prepare('SELECT id FROM npcs WHERE id = ? AND campaign_id = ?')
    .bind(npcId, campaignId)
    .first();
  if (!existing) return c.json({ error: 'Not found' }, 404);

  const sets: string[] = [];
  const vals: unknown[] = [];

  if (body.name !== undefined) { sets.push('name = ?'); vals.push(body.name.trim()); }
  if (body.location !== undefined) { sets.push('location = ?'); vals.push(body.location); }
  if (body.notes !== undefined) { sets.push('notes = ?'); vals.push(body.notes); }

  if (sets.length === 0) return c.json({ error: 'No fields to update' }, 400);

  sets.push("updated_at = datetime('now')");
  vals.push(npcId);

  await c.env.DB.prepare(`UPDATE npcs SET ${sets.join(', ')} WHERE id = ?`)
    .bind(...vals)
    .run();

  const row = await c.env.DB.prepare('SELECT * FROM npcs WHERE id = ?').bind(npcId).first<NpcRow>();
  if (!row) return c.json({ error: 'Not found' }, 404);

  return c.json({ npc: rowToNpc(row) });
});

// Delete NPC
npcRoutes.delete('/:campaignId/npcs/:npcId', async (c) => {
  const campaignId = c.req.param('campaignId');
  const npcId = c.req.param('npcId');

  const existing = await c.env.DB.prepare('SELECT id FROM npcs WHERE id = ? AND campaign_id = ?')
    .bind(npcId, campaignId)
    .first();
  if (!existing) return c.json({ error: 'Not found' }, 404);

  await c.env.DB.prepare('DELETE FROM npcs WHERE id = ?').bind(npcId).run();
  return c.json({ ok: true });
});
