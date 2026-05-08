import { Hono } from 'hono';
import type { AppEnv, AuthUser } from '../types.js';
import { authMiddleware } from '../middleware/auth.js';
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
  portrait_url: string | null;
  data: string;
  created_at: string;
  updated_at: string;
}

function hydrateHeroSummary(row: HeroRow): HeroSummary {
  const heroClass = row.hero_class;
  const level = row.level;

  // Resolve ancestry name from compendium
  const ancestryDef = row.ancestry ? GameData.getAncestry(row.ancestry) : null;

  // Compute stamina/recovery from class + level + kit
  let staminaMax: number | null = null;
  let recoveriesMax: number | null = null;
  let recoveryValue: number | null = null;

  if (heroClass && HeroLogic.isValidHeroClass(heroClass)) {
    const kitDef = row.kit ? GameData.getKit(row.kit) : null;
    staminaMax = kitDef
      ? HeroLogic.getMaxStaminaWithKit(heroClass, level, kitDef.staminaPerEchelon)
      : HeroLogic.getMaxStaminaForClass(heroClass, level);
    recoveriesMax = HeroLogic.getMaxRecoveries(heroClass);
    recoveryValue = HeroLogic.getRecoveryValue(staminaMax);
  }

  // Parse data blob for runtime state
  let data: Record<string, unknown> = {};
  try { data = JSON.parse(row.data || '{}'); } catch { /* empty */ }

  return {
    id: row.id,
    name: row.name,
    level,
    heroClass,
    subclass: row.subclass,
    portraitUrl: row.portrait_url,
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
    `SELECT id, name, ancestry, hero_class, subclass, level, kit, portrait_url, data, created_at, updated_at
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
    .first();
  if (!row) return c.json({ error: 'Not found' }, 404);
  return c.json(row);
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
    portraitUrl?: string;
    data?: Record<string, unknown>;
  }>();

  const id = crypto.randomUUID();
  await c.env.DB.prepare(
    `INSERT INTO heroes (id, user_id, name, ancestry, culture, career, hero_class, subclass, level, characteristics, kit, skills, abilities, portrait_url, data)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      body.portraitUrl ?? null,
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
    `SELECT id FROM heroes WHERE id = ? AND user_id = ? AND deleted_at IS NULL`,
  )
    .bind(heroId, user.id)
    .first();
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
    portraitUrl?: string;
    data?: Record<string, unknown>;
  }>();

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
  if (body.portraitUrl !== undefined) { sets.push('portrait_url = ?'); vals.push(body.portraitUrl); }
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

  return c.json({ ok: true });
});

// Delete hero (soft)
heroRoutes.delete('/:id', async (c) => {
  const user = c.get('user') as AuthUser;
  await c.env.DB.prepare(
    `UPDATE heroes SET deleted_at = datetime('now') WHERE id = ? AND user_id = ? AND deleted_at IS NULL`,
  )
    .bind(c.req.param('id'), user.id)
    .run();
  return c.json({ ok: true });
});
