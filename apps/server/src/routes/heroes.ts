import { Hono } from 'hono';
import type { Context } from 'hono';
import type { AppEnv, AuthUser } from '../types.js';
import { authMiddleware } from '../middleware/auth.js';
import { isAllowedAssetContentType } from '../lib/assets.js';
import { HeroLogic, GameData } from '@anvil/data';
import type { HeroSummary } from '@anvil/types';

export const heroRoutes = new Hono<AppEnv>();

heroRoutes.use('/*', authMiddleware);

// ── Helpers ──

interface HeroRow {
  id: string;
  name: string;
  ancestry: string | null;
  hero_class: string | null;
  subclass: string | null;
  level: number;
  kit: string | null;
  portrait_asset_id: string | null;
  portrait_url: string | null;
  data: string;
  created_at: string;
  updated_at: string;
}

function portraitUrlForAsset(assetId: string): string {
  return `/api/assets/${assetId}/data`;
}

function portraitUrlForHero(row: Pick<HeroRow, 'portrait_asset_id' | 'portrait_url'>): string | null {
  return row.portrait_asset_id ? portraitUrlForAsset(row.portrait_asset_id) : row.portrait_url;
}

async function validateOwnedPortraitAsset(
  c: Context<AppEnv>,
  assetId: string | null | undefined,
  user: AuthUser,
): Promise<Response | null> {
  if (assetId == null) return null;

  const asset = await c.env.DB.prepare('SELECT type, content_type FROM assets WHERE id = ? AND user_id = ?')
    .bind(assetId, user.id)
    .first<{ type: string; content_type: string | null }>();
  if (!asset) return c.json({ error: 'Asset not found' }, 404);
  if (asset.type !== 'portrait') return c.json({ error: 'Asset must be a portrait' }, 400);
  if (asset.content_type && !isAllowedAssetContentType('portrait', asset.content_type)) {
    return c.json({ error: 'Asset must be an image' }, 400);
  }
  return null;
}

async function deleteOwnedAssetIfUnreferenced(
  c: Context<AppEnv>,
  assetId: string,
  userId: string,
): Promise<void> {
  const linked = await c.env.DB.prepare(
    `SELECT 1 WHERE
      EXISTS (SELECT 1 FROM maps WHERE asset_id = ?)
      OR EXISTS (SELECT 1 FROM audio_assets WHERE asset_id = ?)
      OR EXISTS (SELECT 1 FROM custom_terrain WHERE asset_id = ?)
      OR EXISTS (SELECT 1 FROM monster_portraits WHERE asset_id = ?)
      OR EXISTS (SELECT 1 FROM npcs WHERE portrait_asset_id = ?)
      OR EXISTS (SELECT 1 FROM heroes WHERE portrait_asset_id = ? AND deleted_at IS NULL)
     LIMIT 1`,
  )
    .bind(assetId, assetId, assetId, assetId, assetId, assetId)
    .first<{ 1: number }>();
  if (linked) return;

  const asset = await c.env.DB.prepare('SELECT storage_key FROM assets WHERE id = ? AND user_id = ?')
    .bind(assetId, userId)
    .first<{ storage_key: string }>();
  if (!asset) return;

  await c.env.ASSETS.delete(asset.storage_key);
  await c.env.DB.prepare('DELETE FROM assets WHERE id = ?').bind(assetId).run();
}

function hydrateHeroSummary(row: HeroRow): HeroSummary {
  const heroClass = row.hero_class;
  const level = row.level;
  let data: Record<string, unknown> = {};
  try { data = JSON.parse(row.data || '{}'); } catch { /* empty */ }

  // Resolve ancestry name from compendium
  const ancestryDef = row.ancestry ? GameData.getAncestry(row.ancestry) : null;

  // Compute stamina/recovery from class + level + kit
  let staminaMax: number | null = null;
  let recoveriesMax: number | null = null;
  let recoveryValue: number | null = null;

  if (heroClass && HeroLogic.isValidHeroClass(heroClass)) {
    const kitDef = row.kit ? GameData.getKit(row.kit) : null;
    const levelUpChoices = typeof data['levelUpChoices'] === 'object'
      ? data['levelUpChoices'] as Parameters<typeof HeroLogic.getMaxStaminaWithAdvancements>[3]
      : undefined;
    staminaMax = HeroLogic.getMaxStaminaWithAdvancements(
      heroClass,
      level,
      kitDef?.staminaPerEchelon ?? 0,
      levelUpChoices,
    );
    recoveriesMax = HeroLogic.getMaxRecoveries(heroClass);
    recoveryValue = HeroLogic.getRecoveryValue(staminaMax);
  }

  return {
    id: row.id,
    name: row.name,
    level,
    heroClass,
    subclass: row.subclass,
    portraitAssetId: row.portrait_asset_id,
    portraitUrl: portraitUrlForHero(row),
    ancestry: ancestryDef
      ? { id: row.ancestry!, name: ancestryDef.name }
      : row.ancestry
        ? { id: row.ancestry, name: row.ancestry }
        : null,
    staminaMax,
    recoveriesMax,
    recoveryValue,
    staminaCurrent: (data['staminaCurrent'] as number) ?? null,
    recoveriesCurrent: (data['recoveriesCurrent'] as number) ?? null,
    victories: (data['victories'] as number) ?? 0,
    xp: (data['xp'] as number) ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// List heroes for current user
heroRoutes.get('/', async (c) => {
  const user = c.get('user') as AuthUser;
  const result = await c.env.DB.prepare(
    `SELECT id, name, ancestry, hero_class, subclass, level, kit, portrait_asset_id, portrait_url, data, created_at, updated_at
     FROM heroes WHERE user_id = ? AND deleted_at IS NULL ORDER BY updated_at DESC`,
  )
    .bind(user.id)
    .all<HeroRow>();
  return c.json(result.results.map(hydrateHeroSummary));
});

// Get single hero
heroRoutes.get('/:id', async (c) => {
  const user = c.get('user') as AuthUser;
  const row = await c.env.DB.prepare(
    `SELECT * FROM heroes WHERE id = ? AND user_id = ? AND deleted_at IS NULL`,
  )
    .bind(c.req.param('id'), user.id)
    .first<HeroRow & Record<string, unknown>>();
  if (!row) return c.json({ error: 'Not found' }, 404);
  return c.json({ ...row, portrait_url: portraitUrlForHero(row) });
});

// Create hero
heroRoutes.post('/', async (c) => {
  const user = c.get('user') as AuthUser;
  const body = await c.req.json<{
    name: string;
    ancestry?: string;
    culture?: string;
    career?: string;
    heroClass?: string;
    subclass?: string;
    level?: number;
    characteristics?: Record<string, number>;
    kit?: string;
    skills?: string[];
    abilities?: string[];
    portraitAssetId?: string | null;
    portraitUrl?: string | null;
    data?: Record<string, unknown>;
  }>();

  const id = crypto.randomUUID();
  const portraitAssetId = body.portraitAssetId ?? null;
  const portraitError = await validateOwnedPortraitAsset(c, portraitAssetId, user);
  if (portraitError) return portraitError;
  const portraitUrl = portraitAssetId ? portraitUrlForAsset(portraitAssetId) : body.portraitUrl ?? null;

  await c.env.DB.prepare(
    `INSERT INTO heroes (id, user_id, name, ancestry, culture, career, hero_class, subclass, level, characteristics, kit, skills, abilities, portrait_asset_id, portrait_url, data)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      id,
      user.id,
      body.name,
      body.ancestry ?? null,
      body.culture ?? null,
      body.career ?? null,
      body.heroClass ?? null,
      body.subclass ?? null,
      body.level ?? 1,
      JSON.stringify(body.characteristics ?? {}),
      body.kit ?? null,
      JSON.stringify(body.skills ?? []),
      JSON.stringify(body.abilities ?? []),
      portraitAssetId,
      portraitUrl,
      JSON.stringify(body.data ?? {}),
    )
    .run();

  return c.json({ id }, 201);
});

// Update hero
heroRoutes.put('/:id', async (c) => {
  const user = c.get('user') as AuthUser;
  const heroId = c.req.param('id');

  const existing = await c.env.DB.prepare(
    `SELECT id, portrait_asset_id FROM heroes WHERE id = ? AND user_id = ? AND deleted_at IS NULL`,
  )
    .bind(heroId, user.id)
    .first<{ id: string; portrait_asset_id: string | null }>();
  if (!existing) return c.json({ error: 'Not found' }, 404);

  const body = await c.req.json<{
    name?: string;
    ancestry?: string;
    culture?: string;
    career?: string;
    heroClass?: string;
    subclass?: string;
    level?: number;
    characteristics?: Record<string, number>;
    kit?: string;
    skills?: string[];
    abilities?: string[];
    portraitAssetId?: string | null;
    portraitUrl?: string | null;
    data?: Record<string, unknown>;
  }>();

  if (body.portraitAssetId !== undefined) {
    const portraitError = await validateOwnedPortraitAsset(c, body.portraitAssetId, user);
    if (portraitError) return portraitError;
  }

  const sets: string[] = [];
  const vals: unknown[] = [];

  if (body.name !== undefined) { sets.push('name = ?'); vals.push(body.name); }
  if (body.ancestry !== undefined) { sets.push('ancestry = ?'); vals.push(body.ancestry); }
  if (body.culture !== undefined) { sets.push('culture = ?'); vals.push(body.culture); }
  if (body.career !== undefined) { sets.push('career = ?'); vals.push(body.career); }
  if (body.heroClass !== undefined) { sets.push('hero_class = ?'); vals.push(body.heroClass); }
  if (body.subclass !== undefined) { sets.push('subclass = ?'); vals.push(body.subclass); }
  if (body.level !== undefined) { sets.push('level = ?'); vals.push(body.level); }
  if (body.characteristics !== undefined) { sets.push('characteristics = ?'); vals.push(JSON.stringify(body.characteristics)); }
  if (body.kit !== undefined) { sets.push('kit = ?'); vals.push(body.kit); }
  if (body.skills !== undefined) { sets.push('skills = ?'); vals.push(JSON.stringify(body.skills)); }
  if (body.abilities !== undefined) { sets.push('abilities = ?'); vals.push(JSON.stringify(body.abilities)); }
  if (body.portraitAssetId !== undefined) {
    const portraitAssetId = body.portraitAssetId ?? null;
    sets.push('portrait_asset_id = ?');
    vals.push(portraitAssetId);
    sets.push('portrait_url = ?');
    vals.push(portraitAssetId ? portraitUrlForAsset(portraitAssetId) : body.portraitUrl ?? null);
  } else if (body.portraitUrl !== undefined) {
    sets.push('portrait_url = ?');
    vals.push(body.portraitUrl);
  }
  if (body.data !== undefined) { sets.push('data = ?'); vals.push(JSON.stringify(body.data)); }

  if (sets.length === 0) return c.json({ error: 'No fields to update' }, 400);

  sets.push("updated_at = datetime('now')");
  sets.push('version = version + 1');
  vals.push(heroId, user.id);

  await c.env.DB.prepare(
    `UPDATE heroes SET ${sets.join(', ')} WHERE id = ? AND user_id = ?`,
  )
    .bind(...vals)
    .run();

  if (
    body.portraitAssetId !== undefined
    && existing.portrait_asset_id
    && existing.portrait_asset_id !== (body.portraitAssetId ?? null)
  ) {
    await deleteOwnedAssetIfUnreferenced(c, existing.portrait_asset_id, user.id);
  }

  return c.json({ ok: true });
});

// Delete hero (soft)
heroRoutes.delete('/:id', async (c) => {
  const user = c.get('user') as AuthUser;
  const heroId = c.req.param('id');
  const existing = await c.env.DB.prepare(
    `SELECT id, portrait_asset_id FROM heroes WHERE id = ? AND user_id = ? AND deleted_at IS NULL`,
  )
    .bind(heroId, user.id)
    .first<{ id: string; portrait_asset_id: string | null }>();
  if (!existing) return c.json({ ok: true });

  await c.env.DB.prepare(
    `UPDATE heroes SET deleted_at = datetime('now') WHERE id = ? AND user_id = ? AND deleted_at IS NULL`,
  )
    .bind(heroId, user.id)
    .run();
  if (existing.portrait_asset_id) {
    await deleteOwnedAssetIfUnreferenced(c, existing.portrait_asset_id, user.id);
  }
  return c.json({ ok: true });
});
