import { Hono } from 'hono';
import type { AppEnv, AuthUser } from '../types.js';
import { authMiddleware } from '../middleware/auth.js';
import { HeroLogic, GameData, WizardLogic, PERKS, classPerkAtLevel, getAvailablePerkCategories } from '@anvil/data';
import type { CharacterInProgress, Characteristics, LevelUpChoice } from '@anvil/data';
import type { HeroSummary } from '@anvil/types';
import { HERO_LIMITS } from '../policy/limits.js';
import { deleteOwnedAssetIfUnreferenced } from '../repositories/assets.js';
import { validateOwnedImageAsset, validateOwnedPortraitAsset } from '../security/assets.js';
import { jsonError, readJsonBody } from '../security/request.js';
import {
  calculateHeroVitals,
  normalizeExternalPortraitUrl,
  portraitUrlForAsset,
  validateHeroCreationRules,
} from '../services/hero-rules.js';

export const heroRoutes = new Hono<AppEnv>();

heroRoutes.use('/*', authMiddleware);

// Tracker fields players may update out of session (in session, SessionRoom
// applies the same clamping via hero_tracker_update).
const TRACKER_DATA_KEYS = [
  'staminaCurrent',
  'recoveriesCurrent',
  'victories',
  'xp',
  'heroicResourceCurrent',
] as const;
const TRACKER_VALUE_MAX = 9999;

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

function validateCreatedCharacter(character: CharacterInProgress): string | null {
  return validateHeroCreationRules(character);
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

function hydrateHeroSummary(row: HeroRow): HeroSummary {
  const heroClass = row.hero_class;
  const level = row.level;
  let data: Record<string, unknown> = {};
  try { data = JSON.parse(row.data || '{}'); } catch { /* empty */ }

  // Resolve ancestry name from compendium
  const ancestryDef = row.ancestry ? GameData.getAncestry(row.ancestry) : null;

  const { staminaMax, recoveriesMax, recoveryValue } = calculateHeroVitals({
    heroClass,
    level,
    kit: row.kit,
    data,
  });

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

/**
 * Minimal summary used when full hydration throws (e.g. malformed hero data or
 * an unknown class/kit), so one bad record can't 500 the whole list.
 */
function fallbackHeroSummary(row: HeroRow): HeroSummary {
  return {
    id: row.id,
    name: row.name,
    level: row.level,
    heroClass: row.hero_class,
    subclass: row.subclass,
    portraitAssetId: row.portrait_asset_id,
    portraitUrl: portraitUrlForHero(row),
    ancestry: row.ancestry ? { id: row.ancestry, name: row.ancestry } : null,
    staminaMax: null,
    recoveriesMax: null,
    recoveryValue: null,
    staminaCurrent: null,
    recoveriesCurrent: null,
    victories: 0,
    xp: 0,
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
  const summaries = result.results.map((row) => {
    try {
      return hydrateHeroSummary(row);
    } catch (err) {
      console.error('[heroes] failed to hydrate hero', row.id, err);
      return fallbackHeroSummary(row);
    }
  });
  return c.json(summaries);
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
  const raw = await readJsonBody<{
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
  }>(c, { maxBytes: HERO_LIMITS.jsonBodyBytes, label: 'Hero' });
  if (!raw.ok) return jsonError(c, raw);
  const body = raw.value;

  const rawData = isRecord(body.data) ? body.data : {};
  const character = buildCharacterFromPayload({ ...body, data: rawData });
  const creationError = validateCreatedCharacter(character);
  if (creationError) return c.json({ error: creationError }, 400);

  const id = crypto.randomUUID();
  const portraitAssetId = body.portraitAssetId ?? null;
  const portraitError = await validateOwnedPortraitAsset(c, portraitAssetId, user);
  if (portraitError) return portraitError;
  const portraitUrl = portraitAssetId ? portraitUrlForAsset(portraitAssetId) : normalizeExternalPortraitUrl(body.portraitUrl);
  if (!portraitAssetId && body.portraitUrl && !portraitUrl) return c.json({ error: 'Portrait URL must be a valid HTTPS URL' }, 400);
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

  const raw = await readJsonBody<{ choices?: LevelUpChoice[]; perkId?: string | null }>(
    c,
    { maxBytes: HERO_LIMITS.jsonBodyBytes, label: 'Advancement' },
  );
  if (!raw.ok) return jsonError(c, raw);
  const body = raw.value;
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

  const raw = await readJsonBody<{
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
  }>(c, { maxBytes: HERO_LIMITS.jsonBodyBytes, label: 'Hero update' });
  if (!raw.ok) return jsonError(c, raw);
  const body = raw.value;

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
    const portraitUrl = portraitAssetId ? portraitUrlForAsset(portraitAssetId) : normalizeExternalPortraitUrl(body.portraitUrl);
    if (!portraitAssetId && body.portraitUrl && !portraitUrl) return c.json({ error: 'Portrait URL must be a valid HTTPS URL' }, 400);
    vals.push(portraitUrl);
  } else if (body.portraitUrl !== undefined) {
    const portraitUrl = normalizeExternalPortraitUrl(body.portraitUrl);
    if (body.portraitUrl && !portraitUrl) return c.json({ error: 'Portrait URL must be a valid HTTPS URL' }, 400);
    sets.push('portrait_url = ?');
    vals.push(portraitUrl);
  }
  if (body.data !== undefined) {
    const hasInventory = Object.prototype.hasOwnProperty.call(body.data, 'inventory');
    const hasHeroBannerAssetId = Object.prototype.hasOwnProperty.call(body.data, 'heroBannerAssetId');
    const trackerKeys = TRACKER_DATA_KEYS.filter((key) =>
      Object.prototype.hasOwnProperty.call(body.data, key),
    );
    if (!hasInventory && !hasHeroBannerAssetId && trackerKeys.length === 0) {
      return c.json({ error: 'Only inventory, hero banner, and tracker data can be updated directly' }, 400);
    }

    const existingData = parseJson<Record<string, unknown>>(existing.data, {});
    const nextData = { ...existingData };

    if (hasInventory) {
      const inventory = body.data['inventory'];
      if (!Array.isArray(inventory) || JSON.stringify(inventory).length > HERO_LIMITS.inventoryBytes) {
        return c.json({ error: 'Invalid inventory update' }, 400);
      }
      nextData['inventory'] = inventory;
    }

    if (hasHeroBannerAssetId) {
      const rawHeroBannerAssetId = body.data['heroBannerAssetId'];
      if (
        rawHeroBannerAssetId !== null
        && rawHeroBannerAssetId !== undefined
        && typeof rawHeroBannerAssetId !== 'string'
      ) {
        return c.json({ error: 'Invalid hero banner image' }, 400);
      }
      const heroBannerAssetId = stringValue(rawHeroBannerAssetId);
      const bannerError = await validateOwnedImageAsset(c, heroBannerAssetId, user);
      if (bannerError) return bannerError;
      if (heroBannerAssetId) {
        nextData['heroBannerAssetId'] = heroBannerAssetId;
      } else {
        delete nextData['heroBannerAssetId'];
      }
    }

    for (const key of trackerKeys) {
      const value = body.data[key];
      if (value === null) {
        // null resets a "current" tracker to its derived default (treated as full)
        delete nextData[key];
        continue;
      }
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        return c.json({ error: `Invalid ${key} value` }, 400);
      }
      nextData[key] = Math.max(0, Math.min(TRACKER_VALUE_MAX, Math.round(value)));
    }

    sets.push('data = ?');
    vals.push(JSON.stringify(nextData));
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
    await deleteOwnedAssetIfUnreferenced(c.env.DB, c.env.ASSETS, existing.portrait_asset_id, user.id);
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
    await deleteOwnedAssetIfUnreferenced(c.env.DB, c.env.ASSETS, existing.portrait_asset_id, user.id);
  }
  return c.json({ ok: true });
});
