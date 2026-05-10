/**
 * @fileoverview Draw Steel Game Data Access Layer
 *
 * Single source of truth for all game data access.
 * NEVER import game data directly - always use GameData functions.
 *
 * @example
 * // ✅ DO THIS:
 * import { GameData } from '@/lib/game-rules';
 * const ancestry = GameData.getAncestry('human');
 *
 * // ❌ NEVER DO THIS:
 * import data from '../data/game-data.json';
 *
 * @see /docs/GAME_DATA.md for usage guidelines
 */

// Import consolidated JSON data files (copied from Anvil docs)
// Using import with JSON assertion for ESM compatibility
import abilitiesJson from '../generated/abilities.json' with { type: 'json' };
import featuresJson from '../generated/features.json' with { type: 'json' };
// Generated files - run `pnpm --filter @anvil/data generate-data` to regenerate
import monstersJson from '../generated/monsters.json' with { type: 'json' };
import trapsJson from '../generated/traps.json' with { type: 'json' };
// Parsed from MD files
import skillsJson from '../generated/skills.json' with { type: 'json' };
import ancestriesRawJson from '../generated/ancestries-raw.json' with { type: 'json' };
// Existing structured data (richer than MD)
import { ALL_CONDITIONS, type ConditionDefinition as SourceCondition } from '../data/conditions.js';
import {
  ancestries as sourceAncestries,
  careers as sourceCareers,
  kits as sourceKits,
  languages as sourceLanguages,
  environmentOptions,
  organizationOptions,
  upbringingOptions,
} from '../data/reference-data.js';
import { CLASS_RESOURCE_CONFIG } from '../data/class-resources.js';
import { PERKS } from '../data/perks/perks-data.js';
import { classDefinitions as sourceClassDefinitions, type ClassDefinition } from '../data/classes/class-definitions.js';

import type {
  DrawSteelData,
  Feature,
  Ability,
  Trait,
  AncestryDefinition,
  CareerDefinition,
  CultureBenefit,
  KitDefinition,
  KitSignatureAbility,
  SkillDefinition,
  ConditionDefinition,
  PerkDefinition,
  LanguageDefinition,
  HeroClassDefinition,
  SubclassDefinition,
  ClassRole,
  MonsterStatblock,
  TrapStatblock,
  Characteristic,
  HeroClass,
  HeroicResource,
  ConditionName,
  Tier,
  TestDifficulty,
  SkillGroup,
  PerkCategory,
} from '../types/game-data.js';

import {
  isHeroClass,
  isCharacteristic,
  isConditionName,
  isAbility,
  isTrait,
} from '../types/game-data.js';

// ============================================
// INTERNAL: Data Store
// ============================================

// ============================================
// CLASS STATS (stamina/recovery base values)
// ============================================

/**
 * Class stamina configuration.
 * Each class has a base stamina at level 1 and gains per level after.
 */
const CLASS_STAMINA_CONFIG: Record<HeroClass, { level1: number; perLevel: number; recoveries: number }> = {
  beastheart: { level1: 21, perLevel: 12, recoveries: 12 },
  censor: { level1: 21, perLevel: 9, recoveries: 12 },
  conduit: { level1: 18, perLevel: 6, recoveries: 8 },
  elementalist: { level1: 18, perLevel: 6, recoveries: 8 },
  fury: { level1: 21, perLevel: 9, recoveries: 10 },
  null: { level1: 21, perLevel: 9, recoveries: 8 },
  shadow: { level1: 18, perLevel: 6, recoveries: 8 },
  summoner: { level1: 15, perLevel: 6, recoveries: 8 },
  tactician: { level1: 21, perLevel: 9, recoveries: 10 },
  talent: { level1: 18, perLevel: 6, recoveries: 8 },
  troubadour: { level1: 18, perLevel: 6, recoveries: 8 },
};

/**
 * Build HeroClassDefinition array from existing class-definitions.ts data.
 * Converts the ClassDefinition format to HeroClassDefinition.
 */
function buildClassDefinitions(): HeroClassDefinition[] {
  return Object.values(sourceClassDefinitions).map((source: ClassDefinition): HeroClassDefinition => {
    const staminaConfig = CLASS_STAMINA_CONFIG[source.id];

    // Convert subclasses from SubclassOption to SubclassDefinition
    const subclasses: SubclassDefinition[] = source.subclasses.map((sub) => ({
      id: sub.id,
      name: sub.name,
      description: sub.description,
    }));

    // Convert starting characteristics to proper format
    const startingCharacteristics: Partial<Record<Characteristic, number>> = {};
    for (const [key, value] of Object.entries(source.startingCharacteristics)) {
      if (value !== undefined) {
        startingCharacteristics[key as Characteristic] = value;
      }
    }

    return {
      id: source.id,
      name: source.name,
      description: source.description,
      role: source.role as ClassRole,
      masterClass: source.masterClass,
      heroicResource: source.heroicResource.type as HeroicResource,
      heroicResourceDef: {
        name: source.heroicResource.name,
        type: source.heroicResource.type as HeroicResource,
        startingAmount: source.heroicResource.startingAmount,
        gainPerTurn: source.heroicResource.gainPerTurn,
        gainTrigger: source.heroicResource.gainTrigger,
      },
      primaryCharacteristic: source.potencyCharacteristic as Characteristic,
      potencyCharacteristic: source.potencyCharacteristic as Characteristic,
      baseStats: {
        stamina: {
          level1: staminaConfig.level1,
          perLevel: staminaConfig.perLevel,
        },
        recoveries: staminaConfig.recoveries,
        characteristicArrays: [[2, 2, -1, -1, 0], [2, 1, 1, -1, -1], [2, 1, 0, 0, -1]], // Default arrays
        skills: source.fixedSkills || [], // Skills from source or empty
      },
      potency: {
        weak: `${source.potencyCharacteristic || 'Might'} - 2`,
        average: `${source.potencyCharacteristic || 'Might'} - 1`,
        strong: `${source.potencyCharacteristic || 'Might'}`,
      },
      startingCharacteristics,
      subclassName: source.subclassName,
      subclassNamePlural: source.subclassNamePlural,
      subclassSelectCount: source.subclassSelectCount,
      subclasses,
      levelProgression: [],
      fixedSkills: source.fixedSkills,
      skillGroupChoices: source.skillGroupChoices,
    };
  });
}

// ============================================
// INTERNAL: Data Store
// ============================================

/**
 * Lazily initialized data store.
 * Data is loaded on first access to any GameData function.
 */
let _data: DrawSteelData | null = null;

/**
 * Initialize and return the game data store.
 * Called lazily on first data access.
 *
 * @internal
 */
function getData(): DrawSteelData {
  if (!_data) {
    _data = initializeData();
  }
  return _data;
}

/**
 * Load and index all game data from source files.
 * This is called once on first data access.
 *
 * @internal
 */
function initializeData(): DrawSteelData {
  // ─────────────────────────────────────────────
  // JSON Data Loading
  // ─────────────────────────────────────────────

  // Both JSON files wrap their arrays in a `features` property
  const abilitiesData = abilitiesJson as { features: Feature[] };
  const featuresData = featuresJson as { features: Feature[] };

  // Combine and deduplicate features from both sources. item_id is not globally
  // unique (for example, many classes have a level 2 "perk" feature), so use
  // the semantic content code as the primary key.
  const featureMap = new Map<string, Feature>();

  for (const feature of [...abilitiesData.features, ...featuresData.features]) {
    const key =
      feature.metadata?.scc?.[0] ??
      [
        feature.metadata?.class,
        feature.metadata?.subclass,
        feature.metadata?.level,
        feature.metadata?.item_id,
        feature.name,
      ]
        .filter(Boolean)
        .join(':');
    if (key && !featureMap.has(key)) {
      featureMap.set(key, feature);
    }
  }

  const allFeatures = Array.from(featureMap.values());

  // Separate abilities from traits
  const abilities = allFeatures.filter(
    (f): f is Ability => f.feature_type === 'ability'
  );

  // ─────────────────────────────────────────────
  // Monster & Trap Data Loading
  // ─────────────────────────────────────────────

  // Cast imported JSON to appropriate types (using unknown to bypass strict checks)
  const monstersData = monstersJson as unknown as {
    statblocks: MonsterStatblock[];
    features: Feature[];
  };
  const trapsData = trapsJson as unknown as { traps: TrapStatblock[] };

  // ─────────────────────────────────────────────
  // Skills Data Loading (from parsed MD)
  // ─────────────────────────────────────────────

  const skillsData = skillsJson as {
    skillGroups: Array<{ id: string; name: string; group: string; scc: string[] }>;
    skills: Array<{ name: string; use: string; group: string }>;
  };

  // Map parsed skills to SkillDefinition format
  const skills: SkillDefinition[] = skillsData.skills.map((s) => ({
    name: s.name,
    group: s.group as SkillGroup,
    description: s.use,
  }));

  // ─────────────────────────────────────────────
  // Conditions Data Loading (from existing structured data)
  // ─────────────────────────────────────────────

  // Transform existing conditions to our ConditionDefinition format
  const conditions: ConditionDefinition[] = ALL_CONDITIONS.map((c: SourceCondition) => ({
    id: c.id as ConditionName,
    name: c.name,
    effect: c.rulesDescription,
    endTrigger: c.saveEnds ? 'save' : (c.saveRequired.includes('maneuver') ? 'action' : 'special'),
  }));

  // ─────────────────────────────────────────────
  // Ancestry Lore Loading (from parsed MD)
  // ─────────────────────────────────────────────

  const ancestryRawData = ancestriesRawJson as {
    ancestries: Array<{ id: string; rawContent: string }>;
  };

  const getIntroLore = (rawContent: string): string => {
    const withoutHeading = rawContent.replace(/^##\s+[^\n]+\n+/, '').trim();
    const intro = withoutHeading.split(/\n###\s+/)[0] ?? '';
    return intro
      .split(/\n{2,}/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean)
      .slice(0, 2)
      .join('\n\n');
  };

  const ancestryLoreById = new Map(
    ancestryRawData.ancestries.map((ancestry) => [
      ancestry.id,
      getIntroLore(ancestry.rawContent),
    ])
  );

  const ancestries = sourceAncestries.map((ancestry) => ({
    ...ancestry,
    lore: ancestryLoreById.get(ancestry.id),
  }));

  // ─────────────────────────────────────────────
  // Careers Data Loading (from existing reference data)
  // ─────────────────────────────────────────────

  // Cast existing careers to CareerDefinition format
  const careers = sourceCareers as CareerDefinition[];

  // ─────────────────────────────────────────────
  // Cultures Data Loading (from existing reference data)
  // ─────────────────────────────────────────────

  // Transform culture options to CultureBenefit format
  const cultures: CultureBenefit[] = [
    ...environmentOptions.map((o) => ({
      id: o.type,
      name: o.name,
      type: 'environment' as const,
      effect: `Grants skills from ${o.skills.join(', ')} groups`,
      skill: o.skills[0],
      skills: o.skills,
    })),
    ...organizationOptions.map((o) => ({
      id: o.type,
      name: o.name,
      type: 'organization' as const,
      effect: `Grants skills from ${o.skills.join(', ')} groups`,
      skill: o.skills[0],
      skills: o.skills,
    })),
    ...upbringingOptions.map((o) => ({
      id: o.type,
      name: o.name,
      type: 'upbringing' as const,
      effect: `Grants skills: ${o.skills.join(', ')}`,
      skill: o.skills[0],
      skills: o.skills,
    })),
  ];

  const data: DrawSteelData = {
    // From JSON - now populated
    abilities,
    features: allFeatures,
    monsters: monstersData.statblocks,
    traps: trapsData.traps,

    // From existing reference data + parsed MD (using unknown to bypass strict checks)
    ancestries: ancestries as unknown as AncestryDefinition[],
    careers,
    cultures,
    kits: sourceKits as unknown as KitDefinition[],
    skills,
    conditions,
    perks: PERKS as unknown as PerkDefinition[],
    languages: sourceLanguages as unknown as LanguageDefinition[],
    classes: buildClassDefinitions(),

    // Cross-reference index
    byScc: {},
  };

  // Build scc index after loading
  buildSccIndex(data);

  // Log load stats for debugging (in development only)
  if (typeof process !== 'undefined' && process.env?.['NODE_ENV'] === 'development') {
    console.log(
      `[GameData] Loaded: ${abilities.length} abilities, ${allFeatures.length} features, ` +
        `${data.monsters.length} monsters, ${data.traps.length} traps, ` +
        `${skills.length} skills, ${conditions.length} conditions, ` +
        `${careers.length} careers, ${cultures.length} cultures, ` +
        `${data.kits.length} kits, ${data.classes.length} classes`
    );
  }

  return data;
}

/**
 * Build the scc cross-reference index for fast lookups.
 *
 * @internal
 */
function buildSccIndex(data: DrawSteelData): void {
  // Index abilities by scc
  for (const ability of data.abilities) {
    const sccList = ability.metadata?.scc;
    if (sccList && Array.isArray(sccList)) {
      for (const scc of sccList) {
        data.byScc[scc] = ability;
      }
    }
  }

  // Index features by scc
  for (const feature of data.features) {
    const sccList = feature.metadata?.scc;
    if (sccList && Array.isArray(sccList)) {
      for (const scc of sccList) {
        data.byScc[scc] = feature;
      }
    }
  }

  // Index ancestries, careers, kits by their id (derived from scc)
  for (const ancestry of data.ancestries) {
    data.byScc[`ancestry:${ancestry.id}`] = ancestry;
  }
  for (const career of data.careers) {
    data.byScc[`career:${career.id}`] = career;
  }
  for (const kit of data.kits) {
    data.byScc[`kit:${kit.id}`] = kit;
  }
}

// ============================================
// VALIDATION HELPERS
// ============================================

/**
 * Validate that a value is a non-negative number.
 * @throws Error if validation fails
 */
function validateNonNegative(value: number, name: string): void {
  if (typeof value !== 'number' || isNaN(value)) {
    throw new Error(`${name} must be a number, got: ${typeof value}`);
  }
  if (value < 0) {
    throw new Error(`${name} must be non-negative, got: ${value}`);
  }
}

/**
 * Validate that a value is a positive number.
 * @throws Error if validation fails
 */
function validatePositive(value: number, name: string): void {
  if (typeof value !== 'number' || isNaN(value)) {
    throw new Error(`${name} must be a number, got: ${typeof value}`);
  }
  if (value <= 0) {
    throw new Error(`${name} must be positive, got: ${value}`);
  }
}

/**
 * Validate that a level is in valid range (1-10).
 * @throws Error if validation fails
 */
function validateLevel(level: number): void {
  if (typeof level !== 'number' || isNaN(level)) {
    throw new Error(`Level must be a number, got: ${typeof level}`);
  }
  if (level < 1 || level > 10 || !Number.isInteger(level)) {
    throw new Error(`Level must be an integer between 1 and 10, got: ${level}`);
  }
}

// ============================================
// GAME DATA ACCESS LAYER
// ============================================

export const GameData = {
  // ═══════════════════════════════════════════
  // ABILITIES & FEATURES (from JSON)
  // ═══════════════════════════════════════════

  /**
   * Get all abilities from the abilities.json source.
   * @returns Array of all hero abilities
   */
  getAllAbilities: (): Feature[] => getData().abilities,

  /**
   * Get all features from the features.json source.
   * @returns Array of all hero features
   */
  getAllFeatures: (): Feature[] => getData().features,

  /**
   * Get class features for a specific class and level.
   * @param heroClass - The class to filter by
   * @param level - The level to filter by (1-10)
   * @returns Array of matching class features
   */
  getFeaturesByClassAndLevel: (heroClass: HeroClass, level: number): Feature[] => {
    validateLevel(level);
    return getData().features.filter(
      (f) => f.metadata.class === heroClass && f.metadata.level === level
    );
  },

  /**
   * Find an ability by its item_id.
   * @param id - The item_id to search for (kebab-case)
   * @returns The matching ability or undefined
   */
  getAbility: (id: string): Feature | undefined =>
    getData().abilities.find((a) => a.metadata.item_id === id),

  /**
   * Find a feature by its item_id.
   * @param id - The item_id to search for (kebab-case)
   * @returns The matching feature or undefined
   */
  getFeature: (id: string): Feature | undefined =>
    getData().features.find((f) => f.metadata.item_id === id),

  /**
   * Get all abilities for a specific class.
   * @param heroClass - The class to filter by
   * @returns Array of abilities for that class
   */
  getAbilitiesByClass: (heroClass: HeroClass): Feature[] =>
    getData().abilities.filter((a) => a.metadata.class === heroClass),

  /**
   * Get abilities for a class at a specific level.
   * @param heroClass - The class to filter by
   * @param level - The level to filter by (1-10)
   * @returns Array of matching abilities
   */
  getAbilitiesByClassAndLevel: (heroClass: HeroClass, level: number): Feature[] => {
    validateLevel(level);
    return getData().abilities.filter(
      (a) => a.metadata.class === heroClass && a.metadata.level === level
    );
  },

  /**
   * Get all abilities for a specific subclass.
   * @param subclass - The subclass name to filter by
   * @returns Array of subclass-specific abilities
   */
  getAbilitiesBySubclass: (subclass: string): Feature[] =>
    getData().abilities.filter((a) => a.metadata.subclass === subclass),

  /**
   * Get all signature abilities (class and kit signatures).
   * @returns Array of signature abilities
   */
  getSignatureAbilities: (): Feature[] =>
    getData().abilities.filter((a) => a.metadata.ability_type === 'Signature'),

  /**
   * Get common abilities available to all characters (Heal, Charge, Defend, etc.).
   * @returns Array of common abilities
   */
  getCommonAbilities: (): Feature[] =>
    getData().abilities.filter((a) => a.metadata.class === 'combat'),

  // ═══════════════════════════════════════════
  // KITS (from MD)
  // ═══════════════════════════════════════════

  /**
   * Get all equipment kits.
   * @returns Array of all kit definitions
   */
  getAllKits: (): KitDefinition[] => getData().kits,

  /**
   * Find a kit by its id.
   * @param id - Kit identifier (kebab-case)
   * @returns The kit definition or undefined
   */
  getKit: (id: string): KitDefinition | undefined =>
    getData().kits.find((k) => k.id === id),

  /**
   * Find a kit by name (case-insensitive).
   * @param name - Kit display name
   * @returns The kit definition or undefined
   */
  getKitByName: (name: string): KitDefinition | undefined =>
    getData().kits.find((k) => k.name.toLowerCase() === name.toLowerCase()),

  /**
   * Get a kit's signature ability.
   * @param kitId - Kit identifier
   * @returns The signature ability or undefined
   */
  getKitAbility: (kitId: string): KitSignatureAbility | undefined =>
    getData().kits.find((k) => k.id === kitId)?.signatureAbility,

  // ═══════════════════════════════════════════
  // ANCESTRIES (from MD)
  // ═══════════════════════════════════════════

  /**
   * Get all playable ancestries.
   * @returns Array of all ancestry definitions
   */
  getAllAncestries: (): AncestryDefinition[] => getData().ancestries,

  /**
   * Find an ancestry by id.
   * @param id - Ancestry identifier (kebab-case)
   * @returns The ancestry definition or undefined
   */
  getAncestry: (id: string): AncestryDefinition | undefined =>
    getData().ancestries.find((a) => a.id === id),

  /**
   * Find an ancestry by name (case-insensitive).
   * @param name - Ancestry display name
   * @returns The ancestry definition or undefined
   */
  getAncestryByName: (name: string): AncestryDefinition | undefined =>
    getData().ancestries.find((a) => a.name.toLowerCase() === name.toLowerCase()),

  /**
   * Get all ancestry ids.
   * @returns Array of valid ancestry identifiers
   */
  getAncestryIds: (): string[] => getData().ancestries.map((a) => a.id),

  /**
   * Check if a string is a valid ancestry id.
   * @param id - String to validate
   * @returns True if this is a known ancestry id
   */
  isValidAncestryId: (id: string): boolean =>
    getData().ancestries.some((a) => a.id === id),

  /**
   * Check if a string is a valid ancestry name.
   * @param name - String to validate (case-insensitive)
   * @returns True if this is a known ancestry name
   */
  isValidAncestryName: (name: string): boolean =>
    getData().ancestries.some((a) => a.name.toLowerCase() === name.toLowerCase()),

  // ═══════════════════════════════════════════
  // CAREERS (from MD)
  // ═══════════════════════════════════════════

  /**
   * Get all career options.
   * @returns Array of all career definitions
   */
  getAllCareers: (): CareerDefinition[] => getData().careers,

  /**
   * Find a career by id.
   * @param id - Career identifier (kebab-case)
   * @returns The career definition or undefined
   */
  getCareer: (id: string): CareerDefinition | undefined =>
    getData().careers.find((c) => c.id === id),

  /**
   * Find a career by name (case-insensitive).
   * @param name - Career display name
   * @returns The career definition or undefined
   */
  getCareerByName: (name: string): CareerDefinition | undefined =>
    getData().careers.find((c) => c.name.toLowerCase() === name.toLowerCase()),

  // ═══════════════════════════════════════════
  // CULTURES (from MD)
  // ═══════════════════════════════════════════

  /**
   * Get all culture benefits.
   * @returns Array of all culture benefit definitions
   */
  getAllCultures: (): CultureBenefit[] => getData().cultures,

  /**
   * Get culture benefits filtered by type.
   * @param type - Culture category to filter by
   * @returns Array of matching culture benefits
   */
  getCulturesByType: (type: 'environment' | 'organization' | 'upbringing'): CultureBenefit[] =>
    getData().cultures.filter((c) => c.type === type),

  /**
   * Find a culture benefit by id.
   * @param id - Culture identifier
   * @returns The culture benefit or undefined
   */
  getCulture: (id: string): CultureBenefit | undefined =>
    getData().cultures.find((c) => c.id === id),

  // ═══════════════════════════════════════════
  // CLASSES (from MD + JSON)
  // ═══════════════════════════════════════════

  /**
   * Get all class definitions.
   * @returns Array of all hero class definitions
   */
  getAllClasses: (): HeroClassDefinition[] => getData().classes,

  /**
   * Find a class by id.
   * @param id - Class identifier
   * @returns The class definition or undefined
   */
  getClass: (id: HeroClass): HeroClassDefinition | undefined =>
    getData().classes.find((c) => c.id === id),

  /**
   * Find a class by name (case-insensitive).
   * @param name - Class display name
   * @returns The class definition or undefined
   */
  getClassByName: (name: string): HeroClassDefinition | undefined =>
    getData().classes.find((c) => c.name.toLowerCase() === name.toLowerCase()),

  /**
   * Get the heroic resource for a class.
   * @param heroClass - Class identifier
   * @returns The heroic resource type or undefined
   */
  getHeroicResource: (heroClass: HeroClass): HeroicResource | undefined =>
    getData().classes.find((c) => c.id === heroClass)?.heroicResource,

  /**
   * Get subclass options for a class.
   * @param heroClass - Class identifier
   * @returns Array of subclass definitions
   */
  getSubclasses: (heroClass: HeroClass): SubclassDefinition[] =>
    getData().classes.find((c) => c.id === heroClass)?.subclasses ?? [],

  /**
   * Find a specific subclass by class and subclass id.
   * @param heroClass - Class identifier
   * @param subclassId - Subclass identifier
   * @returns The subclass definition or undefined
   */
  getSubclass: (heroClass: HeroClass, subclassId: string): SubclassDefinition | undefined =>
    getData().classes.find((c) => c.id === heroClass)?.subclasses.find((s) => s.id === subclassId),

  /**
   * Get the subclass type name for a class (e.g., "Circle", "Domain", "Aspect").
   * @param heroClass - Class identifier
   * @returns The subclass type name or "Subclass"
   */
  getSubclassTypeName: (heroClass: HeroClass): string =>
    getData().classes.find((c) => c.id === heroClass)?.subclassName ?? 'Subclass',

  /**
   * Get the plural form of subclass type name for a class.
   * @param heroClass - Class identifier
   * @returns The plural subclass type name
   */
  getSubclassTypeNamePlural: (heroClass: HeroClass): string => {
    const classDef = getData().classes.find((c) => c.id === heroClass);
    return classDef?.subclassNamePlural ?? `${classDef?.subclassName ?? 'Subclass'}s`;
  },

  /**
   * Get how many subclasses a class can select (1 for most, 2 for Conduit).
   * @param heroClass - Class identifier
   * @returns Number of subclasses to select
   */
  getSubclassSelectCount: (heroClass: HeroClass): number =>
    getData().classes.find((c) => c.id === heroClass)?.subclassSelectCount ?? 1,

  /**
   * Check if a class requires multiple subclass selections.
   * @param heroClass - Class identifier
   * @returns True if class needs more than 1 subclass
   */
  requiresMultipleSubclasses: (heroClass: HeroClass): boolean =>
    (getData().classes.find((c) => c.id === heroClass)?.subclassSelectCount ?? 1) > 1,

  /**
   * Get color for a class role (for UI theming).
   * @param role - Class combat role
   * @returns Hex color code
   */
  getClassRoleColor: (role: ClassRole): string => {
    switch (role) {
      case 'Defender':
        return '#3b82f6'; // Blue
      case 'Controller':
        return '#a855f7'; // Purple
      case 'Striker':
        return '#ef4444'; // Red
      case 'Support':
        return '#22c55e'; // Green
    }
  },

  // ═══════════════════════════════════════════
  // SKILLS (from MD)
  // ═══════════════════════════════════════════

  /**
   * Get all skills.
   * @returns Array of all skill definitions
   */
  getAllSkills: (): SkillDefinition[] => getData().skills,

  /**
   * Get skills filtered by group.
   * @param group - Skill group to filter by
   * @returns Array of skills in that group
   */
  getSkillsByGroup: (group: SkillGroup): SkillDefinition[] =>
    getData().skills.filter((s) => s.group === group),

  /**
   * Find a skill by name (case-insensitive).
   * @param name - Skill name
   * @returns The skill definition or undefined
   */
  getSkill: (name: string): SkillDefinition | undefined =>
    getData().skills.find((s) => s.name.toLowerCase() === name.toLowerCase()),

  // ═══════════════════════════════════════════
  // CONDITIONS (from MD)
  // ═══════════════════════════════════════════

  /**
   * Get all condition definitions.
   * @returns Array of all conditions
   */
  getAllConditions: (): ConditionDefinition[] => getData().conditions,

  /**
   * Find a condition by id.
   * @param id - Condition identifier
   * @returns The condition definition or undefined
   */
  getCondition: (id: ConditionName): ConditionDefinition | undefined =>
    getData().conditions.find((c) => c.id === id),

  // ═══════════════════════════════════════════
  // PERKS (from MD)
  // ═══════════════════════════════════════════

  /**
   * Get all perk definitions.
   * @returns Array of all perks
   */
  getAllPerks: (): PerkDefinition[] => getData().perks,

  /**
   * Get perks filtered by category.
   * @param category - Perk category to filter by
   * @returns Array of perks in that category
   */
  getPerksByCategory: (category: PerkCategory): PerkDefinition[] =>
    getData().perks.filter((p) => p.category === category),

  /**
   * Find a perk by id.
   * @param id - Perk identifier
   * @returns The perk definition or undefined
   */
  getPerk: (id: string): PerkDefinition | undefined =>
    getData().perks.find((p) => p.id === id),

  // ═══════════════════════════════════════════
  // LANGUAGES
  // ═══════════════════════════════════════════

  /**
   * Get all languages.
   * @returns Array of all language definitions
   */
  getAllLanguages: (): LanguageDefinition[] => getData().languages,

  /**
   * Find a language by id.
   * @param id - Language identifier
   * @returns The language definition or undefined
   */
  getLanguage: (id: string): LanguageDefinition | undefined =>
    getData().languages.find((l) => l.id === id),

  /**
   * Find a language by name (case-insensitive).
   * @param name - Language display name
   * @returns The language definition or undefined
   */
  getLanguageByName: (name: string): LanguageDefinition | undefined =>
    getData().languages.find((l) => l.name.toLowerCase() === name.toLowerCase()),

  /**
   * Get languages that heroes can select (excludes default and dead languages).
   * @returns Array of selectable languages
   */
  getSelectableLanguages: (): LanguageDefinition[] =>
    getData().languages.filter((l) => !l.isDefault && !l.isDead),

  /**
   * Get the default language that all heroes know (Caelian).
   * @returns The default language or undefined
   */
  getDefaultLanguage: (): LanguageDefinition | undefined =>
    getData().languages.find((l) => l.isDefault),

  /**
   * Get dead languages (used for research).
   * @returns Array of dead languages
   */
  getDeadLanguages: (): LanguageDefinition[] =>
    getData().languages.filter((l) => l.isDead),

  // ═══════════════════════════════════════════
  // MONSTERS (from JSON)
  // ═══════════════════════════════════════════

  /**
   * Get all monster statblocks.
   * @returns Array of all monsters
   */
  getAllMonsters: (): MonsterStatblock[] => getData().monsters,

  /**
   * Find a monster by name (case-insensitive).
   * @param name - Monster name
   * @returns The monster statblock or undefined
   */
  getMonster: (name: string): MonsterStatblock | undefined =>
    getData().monsters.find((m) => m.name.toLowerCase() === name.toLowerCase()),

  /**
   * Get monsters filtered by role.
   * @param role - Monster role to filter by
   * @returns Array of monsters with that role
   */
  getMonstersByRole: (role: string): MonsterStatblock[] =>
    getData().monsters.filter((m) => m.roles.includes(role as any)),

  /**
   * Get monsters filtered by level.
   * @param level - Challenge level (1-10+)
   * @returns Array of monsters at that level
   */
  getMonstersByLevel: (level: number): MonsterStatblock[] => {
    validatePositive(level, 'Monster level');
    return getData().monsters.filter((m) => m.level === level);
  },

  // ═══════════════════════════════════════════
  // TRAPS & DYNAMIC TERRAIN (from JSON)
  // ═══════════════════════════════════════════

  /**
   * Get all traps and dynamic terrain.
   * @returns Array of all trap statblocks
   */
  getAllTraps: (): TrapStatblock[] => getData().traps,

  /**
   * Find a trap by name (case-insensitive).
   * @param name - Trap name
   * @returns The trap statblock or undefined
   */
  getTrap: (name: string): TrapStatblock | undefined =>
    getData().traps.find((t) => t.name.toLowerCase() === name.toLowerCase()),

  // ═══════════════════════════════════════════
  // CROSS-REFERENCE (by scc code)
  // ═══════════════════════════════════════════

  /**
   * Look up any entity by its semantic content code (scc).
   * @param scc - The scc code to look up
   * @returns The matching entity or undefined
   */
  getByScc: (scc: string): Feature | AncestryDefinition | CareerDefinition | KitDefinition | undefined =>
    getData().byScc[scc],

  // ═══════════════════════════════════════════
  // RULE CALCULATIONS
  // Reference: rules-md/Chapters/
  // ═══════════════════════════════════════════

  // ───────────────────────────────────────────
  // POWER ROLLS & TIERS
  // Reference: rules-md/Chapters/Tests.md lines 88-93
  // ───────────────────────────────────────────

  /**
   * Determine tier from power roll total.
   *
   * Tier thresholds (from Tests.md):
   * - Tier 1: ≤11
   * - Tier 2: 12-16
   * - Tier 3: 17+
   *
   * @param total - The total of the power roll (2d10 + characteristic + bonuses)
   * @returns Tier 1, 2, or 3
   * @throws Error if total is not a valid number
   *
   * @example
   * GameData.getTierForRoll(8);  // Returns 1
   * GameData.getTierForRoll(14); // Returns 2
   * GameData.getTierForRoll(20); // Returns 3
   */
  getTierForRoll: (total: number): Tier => {
    if (typeof total !== 'number' || isNaN(total)) {
      throw new Error(`Power roll total must be a number, got: ${typeof total}`);
    }
    if (total >= 17) return 3;
    if (total >= 12) return 2;
    return 1;
  },

  /**
   * Get test outcome based on difficulty and roll total.
   *
   * Test Difficulty Outcomes Table (from Tests.md):
   * | Roll    | Easy                    | Medium                  | Hard                    |
   * |---------|-------------------------|-------------------------|-------------------------|
   * | ≤11     | Success with consequence| Failure                 | Failure with consequence|
   * | 12-16   | Success                 | Success with consequence| Failure                 |
   * | 17+     | Success with reward     | Success                 | Success                 |
   * | Nat 19+ | Success with reward     | Success with reward     | Success with reward     |
   *
   * @param difficulty - Test difficulty level
   * @param total - Power roll total
   * @param isNatural19Or20 - Whether the roll was a natural 19 or 20
   * @returns String describing the outcome
   * @throws Error if inputs are invalid
   */
  getTestOutcome: (
    difficulty: TestDifficulty,
    total: number,
    isNatural19Or20: boolean = false
  ): string => {
    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      throw new Error(`Invalid difficulty: ${difficulty}. Must be 'easy', 'medium', or 'hard'.`);
    }
    if (typeof total !== 'number' || isNaN(total)) {
      throw new Error(`Power roll total must be a number, got: ${typeof total}`);
    }

    if (isNatural19Or20) return 'success with reward';

    const tier = GameData.getTierForRoll(total);

    const outcomes: Record<TestDifficulty, Record<Tier, string>> = {
      easy: {
        1: 'success with consequence',
        2: 'success',
        3: 'success with reward',
      },
      medium: {
        1: 'failure',
        2: 'success with consequence',
        3: 'success',
      },
      hard: {
        1: 'failure with consequence',
        2: 'failure',
        3: 'success',
      },
    };

    return outcomes[difficulty][tier];
  },

  // ───────────────────────────────────────────
  // STAMINA & RECOVERY
  // Reference: rules-md/Chapters/Combat.md
  // ───────────────────────────────────────────

  /**
   * Calculate recovery value (stamina regained when spending a recovery).
   * Recovery value = max stamina ÷ 3 (rounded down)
   *
   * @param maxStamina - Maximum stamina of the creature
   * @returns Recovery value
   * @throws Error if maxStamina is not positive
   */
  getRecoveryValue: (maxStamina: number): number => {
    validatePositive(maxStamina, 'Max stamina');
    return Math.floor(maxStamina / 3);
  },

  /**
   * Determine if a creature is winded (at or below half stamina).
   * Winded creatures may have reduced capabilities per certain abilities.
   *
   * @param currentStamina - Current stamina
   * @param maxStamina - Maximum stamina
   * @returns True if winded
   * @throws Error if inputs are invalid
   */
  isWinded: (currentStamina: number, maxStamina: number): boolean => {
    validateNonNegative(currentStamina, 'Current stamina');
    validatePositive(maxStamina, 'Max stamina');
    return currentStamina <= Math.floor(maxStamina / 2);
  },

  /**
   * Determine if a creature is dying (at 0 or negative stamina).
   *
   * @param currentStamina - Current stamina
   * @returns True if dying
   */
  isDying: (currentStamina: number): boolean => {
    if (typeof currentStamina !== 'number' || isNaN(currentStamina)) {
      throw new Error(`Current stamina must be a number, got: ${typeof currentStamina}`);
    }
    return currentStamina <= 0;
  },

  // ───────────────────────────────────────────
  // POTENCY
  // Reference: rules-md/Classes/ (individual class files)
  // ───────────────────────────────────────────

  /**
   * Calculate potency value for a characteristic.
   *
   * Potency levels (standard across classes):
   * - Weak: Characteristic - 2
   * - Average: Characteristic - 1
   * - Strong: Characteristic (no modifier)
   *
   * @param characteristicValue - The characteristic score
   * @param potencyLevel - 'weak', 'average', or 'strong'
   * @returns Calculated potency value
   * @throws Error if inputs are invalid
   */
  getPotency: (
    characteristicValue: number,
    potencyLevel: 'weak' | 'average' | 'strong'
  ): number => {
    if (typeof characteristicValue !== 'number' || isNaN(characteristicValue)) {
      throw new Error(`Characteristic value must be a number, got: ${typeof characteristicValue}`);
    }
    if (!['weak', 'average', 'strong'].includes(potencyLevel)) {
      throw new Error(`Invalid potency level: ${potencyLevel}. Must be 'weak', 'average', or 'strong'.`);
    }

    const modifiers = { weak: -2, average: -1, strong: 0 };
    return characteristicValue + modifiers[potencyLevel];
  },

  // ───────────────────────────────────────────
  // SIZE & SPACE
  // Reference: rules-md/Chapters/Combat.md lines 30-52
  // ───────────────────────────────────────────

  /**
   * Get the number of squares a creature of given size occupies.
   *
   * Size occupancy:
   * - 1T, 1S, 1M, 1L: 1 square (1x1)
   * - 2: 4 squares (2x2)
   * - 3: 9 squares (3x3)
   * - etc.
   *
   * @param size - Size notation (e.g., "1M", "2", "3")
   * @returns Number of squares occupied (1 for size 1, N² for size N)
   */
  getSpaceForSize: (size: string): number => {
    if (typeof size !== 'string') {
      throw new Error(`Size must be a string, got: ${typeof size}`);
    }
    // Size 1T, 1S, 1M, 1L all occupy 1 square
    if (size.startsWith('1')) return 1;
    // Numeric sizes occupy N×N squares
    const numericSize = parseInt(size);
    if (isNaN(numericSize)) return 1;
    return numericSize * numericSize;
  },

  /**
   * Compare two sizes.
   *
   * Size order: 1T < 1S < 1M < 1L < 2 < 3 < 4 < 5 < ...
   *
   * @param a - First size
   * @param b - Second size
   * @returns Negative if a < b, 0 if equal, positive if a > b
   */
  compareSize: (a: string, b: string): number => {
    const sizeOrder = ['1T', '1S', '1M', '1L', '2', '3', '4', '5'];
    const indexA = sizeOrder.indexOf(a);
    const indexB = sizeOrder.indexOf(b);

    // Handle sizes not in list (larger than 5)
    if (indexA === -1 && indexB === -1) {
      const numA = parseInt(a);
      const numB = parseInt(b);
      if (isNaN(numA) || isNaN(numB)) return 0;
      return numA - numB;
    }
    if (indexA === -1) return 1; // a is larger (not in standard list)
    if (indexB === -1) return -1; // b is larger

    return indexA - indexB;
  },

  // ───────────────────────────────────────────
  // EDGES & BANES
  // Reference: rules-md/Chapters/The Basics.md
  // ───────────────────────────────────────────

  /**
   * Calculate net modifier from edges and banes.
   * Edges and banes cancel out 1-for-1.
   *
   * @param edges - Number of edges
   * @param banes - Number of banes
   * @returns Net value (positive = edges, negative = banes)
   * @throws Error if inputs are negative
   */
  getNetEdgeBane: (edges: number, banes: number): number => {
    validateNonNegative(edges, 'Edges');
    validateNonNegative(banes, 'Banes');
    return edges - banes;
  },

  /**
   * Calculate total d10s to roll based on edges/banes.
   * Base roll is 2d10; net edges/banes add dice (keep best/worst 2).
   *
   * @param edges - Number of edges
   * @param banes - Number of banes
   * @returns Total dice to roll (minimum 2)
   */
  getDiceCount: (edges: number, banes: number): number => {
    validateNonNegative(edges, 'Edges');
    validateNonNegative(banes, 'Banes');
    return 2 + Math.abs(edges - banes);
  },

  // ───────────────────────────────────────────
  // LEVEL & ECHELON
  // Reference: rules-md/Classes/ (advancement tables)
  // ───────────────────────────────────────────

  /**
   * Get echelon for a given level.
   *
   * Echelon progression:
   * - Echelon 1: Levels 1-3
   * - Echelon 2: Levels 4-6
   * - Echelon 3: Levels 7-9
   * - Echelon 4: Level 10
   *
   * @param level - Character level (1-10)
   * @returns Echelon (1-4)
   * @throws Error if level is out of range
   */
  getEchelon: (level: number): 1 | 2 | 3 | 4 => {
    validateLevel(level);
    if (level <= 3) return 1;
    if (level <= 6) return 2;
    if (level <= 9) return 3;
    return 4;
  },

  /**
   * Calculate stamina at a given level for a class.
   *
   * Formula: level1Stamina + (perLevelStamina × (level - 1))
   *
   * @param heroClass - Class identifier
   * @param level - Character level (1-10)
   * @returns Total stamina at that level, or undefined if class not found
   * @throws Error if level is invalid
   */
  getStaminaAtLevel: (heroClass: HeroClass, level: number): number | undefined => {
    validateLevel(level);
    const classDef = getData().classes.find((c) => c.id === heroClass);
    if (!classDef) return undefined;

    const { level1, perLevel } = classDef.baseStats.stamina;
    return level1 + perLevel * (level - 1);
  },

  // ═══════════════════════════════════════════
  // TYPE GUARDS (re-exported for convenience)
  // ═══════════════════════════════════════════

  /** Check if a string is a valid HeroClass */
  isValidHeroClass: isHeroClass,

  /** Check if a string is a valid Characteristic */
  isValidCharacteristic: isCharacteristic,

  /** Check if a string is a valid ConditionName */
  isValidConditionName: isConditionName,

  /** Check if a feature is an Ability */
  isAbility,

  /** Check if a feature is a Trait */
  isTrait,
} as const;

// ============================================
// TYPE EXPORTS (for convenience)
// ============================================

export type {
  Feature,
  Ability,
  Trait,
  AncestryDefinition,
  CareerDefinition,
  CultureBenefit,
  KitDefinition,
  SkillDefinition,
  ConditionDefinition,
  PerkDefinition,
  HeroClassDefinition,
  MonsterStatblock,
  TrapStatblock,
  Effect,
  FeatureMetadata,
  Characteristic,
  HeroClass,
  HeroicResource,
  Tier,
  TestDifficulty,
  ConditionName,
  Keyword,
  ActionType,
  Size,
  MonsterRole,
  SkillGroup,
  PerkCategory,
} from '../types/game-data.js';

export {
  isHeroClass,
  isCharacteristic,
  isConditionName,
  isAbility,
  isTrait,
  isPowerRollEffect,
  hasNestedFeatures,
} from '../types/game-data.js';
