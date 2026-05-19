import { Hono } from 'hono';
import type { Context } from 'hono';
import type { AppEnv, AuthUser } from '../types.js';
import { authMiddleware } from '../middleware/auth.js';
import { isAllowedAssetContentType } from '../lib/assets.js';
import { HeroLogic, GameData, WizardLogic, PERKS, classPerkAtLevel, getAvailablePerkCategories } from '@anvil/data';
import type { CharacterInProgress, Characteristics, LevelUpChoice } from '@anvil/data';
import type { HeroSummary } from '@anvil/types';

export const heroRoutes = new Hono<AppEnv>();

heroRoutes.use('/*', authMiddleware);

// ── Helpers ──

interface HeroRow {
  id: string;
  name: string;
  ancestry: string | null;
  culture?: string | null;
  career?: string | null;
  hero_class: string | null;
  subclass: string | null;
  level: number;
  characteristics?: string | null;
  kit: string | null;
  skills?: string | null;
  abilities?: string | null;
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

function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

function normalizeCharacteristics(value: unknown): Characteristics | null {
  if (!isRecord(value)) return null;
  const entries = ['might', 'agility', 'reason', 'intuition', 'presence'] as const;
  const result: Partial<Characteristics> = {};
  for (const key of entries) {
    const raw = value[key];
    if (typeof raw !== 'number' || !Number.isFinite(raw)) return null;
    result[key] = raw;
  }
  return result as Characteristics;
}

function normalizeLevelUpChoices(value: unknown): Record<number, LevelUpChoice[]> {
  if (!isRecord(value)) return {};
  const choices: Record<number, LevelUpChoice[]> = {};
  for (const [key, rawChoices] of Object.entries(value)) {
    const level = Number(key);
    if (!Number.isInteger(level) || level < 2 || level > 10 || !Array.isArray(rawChoices)) continue;
    choices[level] = rawChoices.flatMap((choice): LevelUpChoice[] => {
      if (!isRecord(choice)) return [];
      const featureId = stringValue(choice['featureId']);
      const choiceId = stringValue(choice['choiceId']);
      if (!featureId || !choiceId) return [];
      return [{
        featureId,
        choiceId,
        category: stringValue(choice['category']) ?? undefined,
      }];
    });
  }
  return choices;
}

function unique(values: string[]): string[] {
  return values.filter((value, index, all) => value && all.indexOf(value) === index);
}

function titleCaseId(value: string): string {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function resolveSkillName(choiceId: string): string {
  const skill = GameData.getSkill(choiceId) ?? GameData.getAllSkills().find((candidate) => {
    const normalized = candidate.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return normalized === choiceId.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  });
  return skill?.name ?? titleCaseId(choiceId);
}

function buildCharacterFromPayload(input: {
  name?: unknown;
  level?: unknown;
  ancestry?: unknown;
  culture?: unknown;
  career?: unknown;
  heroClass?: unknown;
  subclass?: unknown;
  characteristics?: unknown;
  kit?: unknown;
  portraitUrl?: unknown;
  data?: Record<string, unknown>;
}): CharacterInProgress {
  const data = input.data ?? {};
  const character = WizardLogic.createEmptyCharacter();
  character.name = stringValue(input.name) ?? '';
  character.level = typeof input.level === 'number' && Number.isInteger(input.level) ? input.level : 1;
  character.ancestry = stringValue(input.ancestry);
  character.culture = isRecord(data['culture'])
    ? {
        environment: stringValue(data['culture']['environment']),
        organization: stringValue(data['culture']['organization']),
        upbringing: stringValue(data['culture']['upbringing']),
        preset: stringValue(data['culture']['preset']),
        language: stringValue(data['culture']['language']),
      }
    : parseJson(input.culture as string | null | undefined, character.culture);
  character.career = stringValue(input.career);
  const heroClass = stringValue(input.heroClass);
  character.heroClass = heroClass && HeroLogic.isValidHeroClass(heroClass) ? heroClass : null;
  const subclass = data['subclass'] ?? input.subclass;
  character.subclass = Array.isArray(subclass) ? stringArray(subclass) : stringValue(subclass);
  character.characteristics = normalizeCharacteristics(input.characteristics);
  character.kit = stringValue(input.kit);
  character.secondaryKit = stringValue(data['secondaryKit']);
  character.cultureSkills = isRecord(data['cultureSkills'])
    ? {
        environment: stringValue(data['cultureSkills']['environment']) ?? undefined,
        organization: stringValue(data['cultureSkills']['organization']) ?? undefined,
        upbringing: stringValue(data['cultureSkills']['upbringing']) ?? undefined,
      }
    : {};
  character.careerSkillChoices = stringArray(data['careerSkillChoices']);
  character.classSkillChoices = stringArray(data['classSkillChoices']);
  character.ancestryTraits = stringArray(data['ancestryTraits']);
  character.careerPerk = stringValue(data['careerPerk']);
  character.selectedPerks = stringArray(data['selectedPerks']).filter((perkId) => perkId !== character.careerPerk);
  character.selectedLanguages = stringArray(data['selectedLanguages']);
  character.selectedTitles = Array.isArray(data['selectedTitles']) ? data['selectedTitles'] as CharacterInProgress['selectedTitles'] : [];
  character.selectedAbilities = stringArray(data['selectedAbilities']);
  character.abilityChoices = isRecord(data['abilityChoices'])
    ? Object.fromEntries(Object.entries(data['abilityChoices']).filter(([, value]) => typeof value === 'string')) as Record<string, string>
    : {};
  character.summonerMinionChoices = isRecord(data['summonerMinionChoices'])
    ? Object.fromEntries(Object.entries(data['summonerMinionChoices']).filter(([, value]) => typeof value === 'string')) as Record<string, string>
    : {};
  character.companion = stringValue(data['companion']);
  character.complication = isRecord(data['complication'])
    ? {
        id: stringValue(data['complication']['id']) ?? 'custom',
        name: stringValue(data['complication']['name']) ?? 'Complication',
        description: stringValue(data['complication']['description']) ?? undefined,
      }
    : null;
  character.incitingIncident = stringValue(data['incitingIncident']);
  character.pronouns = stringValue(data['pronouns']) ?? '';
  character.backstory = stringValue(data['backstory']) ?? '';
  character.appearance = stringValue(data['appearance']) ?? '';
  character.portraitUrl = stringValue(input.portraitUrl);
  character.levelUpChoices = normalizeLevelUpChoices(data['levelUpChoices']);
  return character;
}

function validatePerkSelections(character: CharacterInProgress): string | null {
  for (const slot of WizardLogic.getPerkChoiceSlots(character)) {
    if (!slot.selectedPerkId) return `Select ${slot.label} perk`;
    const perk = PERKS.find((candidate) => candidate.id === slot.selectedPerkId);
    if (!perk) return `Invalid perk for ${slot.label}`;
    if (!slot.categories.includes(perk.category)) return `Invalid perk category for ${slot.label}`;
  }
  return null;
}

function validateCreatedCharacter(character: CharacterInProgress): string | null {
  if (!Number.isInteger(character.level) || character.level < 1 || character.level > 10) return 'Level must be 1-10';
  if (!WizardLogic.isCharacterComplete(character)) return 'Hero creation choices are incomplete';
  return validatePerkSelections(character);
}

function sanitizeHeroDataForCreation(character: CharacterInProgress, rawData: Record<string, unknown>): Record<string, unknown> {
  return {
    ...rawData,
    heroClass: character.heroClass,
    subclass: character.subclass,
    culture: character.culture,
    kit: character.kit,
    secondaryKit: character.secondaryKit,
    cultureSkills: character.cultureSkills,
    careerSkillChoices: character.careerSkillChoices,
    classSkillChoices: character.classSkillChoices,
    ancestryTraits: character.ancestryTraits,
    incitingIncident: character.incitingIncident,
    careerPerk: character.careerPerk,
    selectedLanguages: character.selectedLanguages,
    selectedPerks: WizardLogic.getSelectedPerkIds(character),
    selectedTitles: character.selectedTitles,
    abilityChoices: character.abilityChoices,
    summonerMinionChoices: character.summonerMinionChoices,
    companion: character.companion,
    pronouns: character.pronouns,
    backstory: character.backstory,
    appearance: character.appearance,
    levelUpChoices: character.levelUpChoices,
  };
}

function buildCharacterFromHero(row: HeroRow & Record<string, unknown>, data: Record<string, unknown>, level: number): CharacterInProgress {
  return buildCharacterFromPayload({
    name: row.name,
    level,
    ancestry: row.ancestry,
    culture: row.culture,
    career: row.career,
    heroClass: row.hero_class,
    subclass: row.subclass,
    characteristics: parseJson(row.characteristics ?? null, {}),
    kit: row.kit,
    portraitUrl: row.portrait_url,
    data,
  });
}

function levelUpChoiceMap(features: ReturnType<typeof WizardLogic.getLevelUpFeatures>, choices: LevelUpChoice[]): LevelUpChoice[] | null {
  const normalized: LevelUpChoice[] = [];
  for (const feature of features.filter((item) => item.type === 'choice' && (item.choices?.length ?? 0) > 0)) {
    const selected = choices.find((choice) => choice.featureId === feature.id);
    if (!selected || !feature.choices?.some((option) => option.id === selected.choiceId)) return null;
    normalized.push({
      featureId: feature.id,
      choiceId: selected.choiceId,
      category: feature.category,
    });
  }
  return normalized;
}

function selectedPerksFromData(data: Record<string, unknown>): string[] {
  return unique(stringArray(data['selectedPerks']));
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

  const rawData = isRecord(body.data) ? body.data : {};
  const character = buildCharacterFromPayload({ ...body, data: rawData });
  const creationError = validateCreatedCharacter(character);
  if (creationError) return c.json({ error: creationError }, 400);

  const id = crypto.randomUUID();
  const portraitAssetId = body.portraitAssetId ?? null;
  const portraitError = await validateOwnedPortraitAsset(c, portraitAssetId, user);
  if (portraitError) return portraitError;
  const portraitUrl = portraitAssetId ? portraitUrlForAsset(portraitAssetId) : body.portraitUrl ?? null;
  const heroData = sanitizeHeroDataForCreation(character, rawData);
  const skills = WizardLogic.getSelectedSkillNames(character);
  const abilities = WizardLogic.getSelectedAbilityIds(character);
  const subclass = Array.isArray(character.subclass) ? character.subclass.join(',') : character.subclass;

  await c.env.DB.prepare(
    `INSERT INTO heroes (id, user_id, name, ancestry, culture, career, hero_class, subclass, level, characteristics, kit, skills, abilities, portrait_asset_id, portrait_url, data)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      id,
      user.id,
      character.name,
      character.ancestry,
      JSON.stringify(character.culture),
      character.career,
      character.heroClass,
      subclass,
      character.level,
      JSON.stringify(character.characteristics ?? {}),
      character.kit,
      JSON.stringify(skills),
      JSON.stringify(abilities),
      portraitAssetId,
      portraitUrl,
      JSON.stringify(heroData),
    )
    .run();

  return c.json({ id }, 201);
});

// Advance hero by one level. XP and rule choices are validated server-side.
heroRoutes.post('/:id/advance', async (c) => {
  const user = c.get('user') as AuthUser;
  const heroId = c.req.param('id');
  const row = await c.env.DB.prepare(
    `SELECT * FROM heroes WHERE id = ? AND user_id = ? AND deleted_at IS NULL`,
  )
    .bind(heroId, user.id)
    .first<HeroRow & Record<string, unknown>>();
  if (!row) return c.json({ error: 'Not found' }, 404);
  if (!row.hero_class || !HeroLogic.isValidHeroClass(row.hero_class)) return c.json({ error: 'Hero class is required' }, 400);
  if (row.level >= 10) return c.json({ error: 'Hero is already maximum level' }, 400);

  const body = await c.req.json<{ choices?: LevelUpChoice[]; perkId?: string | null }>();
  const data = parseJson<Record<string, unknown>>(row.data, {});
  const xp = typeof data['xp'] === 'number' && Number.isFinite(data['xp']) ? data['xp'] : 0;
  if (!HeroLogic.canAdvanceLevel(row.level, xp)) return c.json({ error: 'Not enough XP to advance' }, 400);

  const nextLevel = row.level + 1;
  const existingChoices = normalizeLevelUpChoices(data['levelUpChoices']);
  const validationCharacter = buildCharacterFromHero(row, { ...data, levelUpChoices: existingChoices }, nextLevel);
  const features = WizardLogic.getLevelUpFeatures(validationCharacter, nextLevel);
  const normalizedChoices = levelUpChoiceMap(features, Array.isArray(body.choices) ? body.choices : []);
  if (!normalizedChoices) return c.json({ error: 'Invalid level-up choices' }, 400);

  const nextChoices = { ...existingChoices, [nextLevel]: normalizedChoices };
  const nextCharacter = buildCharacterFromHero(row, { ...data, levelUpChoices: nextChoices }, nextLevel);
  const errors = WizardLogic.getLevelUpValidationErrors(nextCharacter, nextLevel);
  if (errors.length > 0) return c.json({ error: errors[0] }, 400);

  const selectedPerks = selectedPerksFromData(data);
  if (classPerkAtLevel(row.hero_class, nextLevel)) {
    const perkId = stringValue(body.perkId);
    if (!perkId) return c.json({ error: 'Select a perk for this level' }, 400);
    const perk = PERKS.find((candidate) => candidate.id === perkId);
    const categories = getAvailablePerkCategories(row.hero_class, nextLevel);
    if (!perk || !categories.includes(perk.category)) return c.json({ error: 'Invalid perk for this level' }, 400);
    if (selectedPerks.includes(perkId)) return c.json({ error: 'Perk is already selected' }, 400);
    selectedPerks.push(perkId);
  }

  const gainedAbilities = normalizedChoices
    .filter((choice) => choice.category === 'ability')
    .map((choice) => choice.choiceId);
  const gainedSkills = normalizedChoices
    .filter((choice) => choice.category === 'skill')
    .map((choice) => resolveSkillName(choice.choiceId));
  const automaticSkills = row.hero_class === 'beastheart' && nextLevel >= 9 ? ['Nature'] : [];
  const nextAbilities = unique([...parseJson<string[]>(row.abilities ?? null, []), ...gainedAbilities]);
  const nextSkills = unique([...parseJson<string[]>(row.skills ?? null, []), ...automaticSkills, ...gainedSkills]);
  const nextData = {
    ...data,
    levelUpChoices: nextChoices,
    selectedPerks,
  };

  await c.env.DB.prepare(
    `UPDATE heroes
     SET level = ?, abilities = ?, skills = ?, data = ?, updated_at = datetime('now'), version = version + 1
     WHERE id = ? AND user_id = ?`,
  )
    .bind(nextLevel, JSON.stringify(nextAbilities), JSON.stringify(nextSkills), JSON.stringify(nextData), heroId, user.id)
    .run();

  return c.json({ ok: true, level: nextLevel, abilities: nextAbilities, skills: nextSkills, data: nextData });
});

// Update hero
heroRoutes.put('/:id', async (c) => {
  const user = c.get('user') as AuthUser;
  const heroId = c.req.param('id');

  const existing = await c.env.DB.prepare(
    `SELECT id, portrait_asset_id, data FROM heroes WHERE id = ? AND user_id = ? AND deleted_at IS NULL`,
  )
    .bind(heroId, user.id)
    .first<{ id: string; portrait_asset_id: string | null; data: string | null }>();
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

  if (
    body.level !== undefined
    || body.skills !== undefined
    || body.abilities !== undefined
    || body.heroClass !== undefined
    || body.subclass !== undefined
    || body.characteristics !== undefined
    || body.kit !== undefined
    || body.ancestry !== undefined
    || body.culture !== undefined
    || body.career !== undefined
  ) {
    return c.json({ error: 'Use the validated hero creation or advancement flow for rule fields' }, 400);
  }

  if (body.portraitAssetId !== undefined) {
    const portraitError = await validateOwnedPortraitAsset(c, body.portraitAssetId, user);
    if (portraitError) return portraitError;
  }

  const sets: string[] = [];
  const vals: unknown[] = [];

  if (body.name !== undefined) { sets.push('name = ?'); vals.push(body.name); }
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
  if (body.data !== undefined) {
    const inventory = body.data['inventory'];
    if (inventory !== undefined) {
      if (!Array.isArray(inventory) || JSON.stringify(inventory).length > 128 * 1024) {
        return c.json({ error: 'Invalid inventory update' }, 400);
      }
      const existingData = parseJson<Record<string, unknown>>(existing.data, {});
      sets.push('data = ?');
      vals.push(JSON.stringify({ ...existingData, inventory }));
    } else {
      return c.json({ error: 'Only inventory data can be updated directly' }, 400);
    }
  }

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
