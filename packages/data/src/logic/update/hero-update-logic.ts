/**
 * Hero Update Logic
 *
 * Ensures backward compatibility when loading hero data from Supabase.
 * Adds missing fields with sensible defaults without breaking existing data.
 *
 * Reference: Forge Steel src/logic/update/hero-update-logic.ts
 *
 * Usage:
 *   import { HeroUpdateLogic } from '@anvil/data';
 *
 *   const hero = await fetchHeroFromDatabase(id);
 *   HeroUpdateLogic.update(hero);  // Mutates in place
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Minimal hero interface for update logic.
 * Uses `unknown` for flexibility - actual type checking happens at runtime.
 */
export interface HeroLike {
  id?: string;
  name?: string;
  level?: number;
  heroClass?: string;
  ancestry?: string | null;
  ancestryTraits?: string[];
  culture?: CultureLike | null;
  career?: string | null;
  incitingIncident?: string | null;
  subclass?: string | null;
  complication?: unknown;
  characteristics?: CharacteristicsLike | null;
  kit?: string | null;
  selectedSkills?: string[];
  selectedLanguages?: string[];
  selectedPerks?: string[];
  selectedTitles?: unknown[];
  selectedAbilities?: string[];
  pronouns?: string | null;
  backstory?: string | null;
  appearance?: string | null;
  portraitUrl?: string | null;
  maxStamina?: number | null;
  currentStamina?: number | null;
  maxRecoveries?: number | null;
  currentRecoveries?: number | null;
  speed?: number | null;
  stability?: number;
  size?: string;
  heroicResource?: number;
  heroTokens?: number;
  victories?: number;
  xp?: number;
  status?: string;
  // State fields (for runtime tracking)
  state?: HeroStateLike;
  // Metadata
  version?: number;
  folder?: string;
  // Feature collections
  features?: unknown[];
  abilityCustomizations?: unknown[];
  conditions?: ConditionLike[];
  inventory?: unknown[];
  projects?: unknown[];
}

interface CultureLike {
  environment?: string | null;
  organization?: string | null;
  upbringing?: string | null;
}

interface CharacteristicsLike {
  might?: number;
  agility?: number;
  reason?: number;
  intuition?: number;
  presence?: number;
}

interface HeroStateLike {
  currentStamina?: number;
  tempStamina?: number;
  surges?: number;
  recoveriesUsed?: number;
  heroicResource?: number;
  conditions?: ConditionLike[];
  inventory?: unknown[];
  projects?: unknown[];
  notes?: string;
  xp?: number;
  wealth?: number;
}

interface ConditionLike {
  name?: string;
  text?: string;
  ends?: string;
  stacks?: number;
}

// ---------------------------------------------------------------------------
// Hero Update Logic
// ---------------------------------------------------------------------------

/**
 * Update hero structure to current schema version.
 * Safe to call multiple times (idempotent).
 *
 * @param hero - Hero object to update (mutated in place)
 */
export function update(hero: HeroLike): void {
  updateStructure(hero);
  updateState(hero);
  updateNestedStructures(hero);
}

/**
 * Add missing top-level fields with defaults.
 */
export function updateStructure(hero: HeroLike): void {
  // Metadata defaults
  if (hero.version === undefined) hero.version = 1;
  if (hero.folder === undefined) hero.folder = '';

  // Core fields
  if (hero.level === undefined) hero.level = 1;
  if (hero.status === undefined) hero.status = 'active';

  // Array fields
  if (hero.ancestryTraits === undefined) hero.ancestryTraits = [];
  if (hero.selectedSkills === undefined) hero.selectedSkills = [];
  if (hero.selectedLanguages === undefined) hero.selectedLanguages = [];
  if (hero.selectedPerks === undefined) hero.selectedPerks = [];
  if (hero.selectedTitles === undefined) hero.selectedTitles = [];
  if (hero.selectedAbilities === undefined) hero.selectedAbilities = [];
  if (hero.features === undefined) hero.features = [];
  if (hero.abilityCustomizations === undefined) hero.abilityCustomizations = [];
  if (hero.conditions === undefined) hero.conditions = [];
  if (hero.inventory === undefined) hero.inventory = [];
  if (hero.projects === undefined) hero.projects = [];

  // Combat stats - nullable in DB, default to 0 for runtime
  if (hero.maxStamina === undefined || hero.maxStamina === null) hero.maxStamina = 0;
  if (hero.currentStamina === undefined || hero.currentStamina === null) {
    hero.currentStamina = hero.maxStamina;
  }
  if (hero.maxRecoveries === undefined || hero.maxRecoveries === null) hero.maxRecoveries = 8;
  if (hero.currentRecoveries === undefined || hero.currentRecoveries === null) {
    hero.currentRecoveries = hero.maxRecoveries;
  }
  if (hero.speed === undefined || hero.speed === null) hero.speed = 5;
  if (hero.stability === undefined) hero.stability = 0;
  if (hero.size === undefined) hero.size = '1M';

  // Resources
  if (hero.heroicResource === undefined) hero.heroicResource = 0;
  if (hero.heroTokens === undefined) hero.heroTokens = 0;
  if (hero.victories === undefined) hero.victories = 0;
  if (hero.xp === undefined) hero.xp = 0;

  // Personal details
  if (hero.pronouns === undefined) hero.pronouns = null;
  if (hero.backstory === undefined) hero.backstory = null;
  if (hero.appearance === undefined) hero.appearance = null;
  if (hero.portraitUrl === undefined) hero.portraitUrl = null;
}

/**
 * Add missing state fields with defaults.
 */
export function updateState(hero: HeroLike): void {
  // Create state if missing
  if (hero.state === undefined) {
    hero.state = createDefaultState(hero);
    return;
  }

  const state = hero.state;

  // Stamina
  if (state.currentStamina === undefined) {
    state.currentStamina = hero.maxStamina ?? 0;
  }
  if (state.tempStamina === undefined) state.tempStamina = 0;
  if (state.surges === undefined) state.surges = 0;
  if (state.recoveriesUsed === undefined) state.recoveriesUsed = 0;

  // Resources
  if (state.heroicResource === undefined) state.heroicResource = 0;
  if (state.xp === undefined) state.xp = hero.xp ?? 0;
  if (state.wealth === undefined) state.wealth = 1;

  // Collections
  if (state.conditions === undefined) state.conditions = [];
  if (state.inventory === undefined) state.inventory = [];
  if (state.projects === undefined) state.projects = [];

  // Other
  if (state.notes === undefined) state.notes = '';

  // Update condition structure
  state.conditions.forEach(updateCondition);
}

/**
 * Create default hero state.
 */
export function createDefaultState(hero: HeroLike): HeroStateLike {
  return {
    currentStamina: hero.maxStamina ?? 0,
    tempStamina: 0,
    surges: 0,
    recoveriesUsed: 0,
    heroicResource: 0,
    conditions: [],
    inventory: [],
    projects: [],
    notes: '',
    xp: hero.xp ?? 0,
    wealth: 1,
  };
}

/**
 * Update nested structures (culture, characteristics, etc.).
 */
export function updateNestedStructures(hero: HeroLike): void {
  // Culture
  if (hero.culture) {
    if (hero.culture.environment === undefined) hero.culture.environment = null;
    if (hero.culture.organization === undefined) hero.culture.organization = null;
    if (hero.culture.upbringing === undefined) hero.culture.upbringing = null;
  }

  // Characteristics
  if (hero.characteristics) {
    if (hero.characteristics.might === undefined) hero.characteristics.might = 0;
    if (hero.characteristics.agility === undefined) hero.characteristics.agility = 0;
    if (hero.characteristics.reason === undefined) hero.characteristics.reason = 0;
    if (hero.characteristics.intuition === undefined) hero.characteristics.intuition = 0;
    if (hero.characteristics.presence === undefined) hero.characteristics.presence = 0;
  }

  // Conditions on hero (not in state)
  if (hero.conditions) {
    hero.conditions.forEach(updateCondition);
  }
}

/**
 * Update condition structure to have required fields.
 */
export function updateCondition(condition: ConditionLike): void {
  if (condition.text === undefined) condition.text = '';
  if (condition.ends === undefined) condition.ends = 'endOfTurn';
  if (condition.stacks === undefined) condition.stacks = 1;
}

// ---------------------------------------------------------------------------
// Migration Helpers
// ---------------------------------------------------------------------------

/**
 * Migrate deprecated field names to new names.
 * Call this when schema changes rename fields.
 *
 * @param hero - Hero to migrate
 */
export function migrateDeprecatedFields(hero: HeroLike): void {
  // Example migrations (uncomment when needed):
  //
  // if ((hero as any).oldFieldName !== undefined) {
  //   hero.newFieldName = (hero as any).oldFieldName;
  //   delete (hero as any).oldFieldName;
  // }

  // Migration: ancestry_traits -> ancestryTraits (snake_case from DB)
  const heroAny = hero as Record<string, unknown>;
  if (heroAny['ancestry_traits'] !== undefined && hero.ancestryTraits === undefined) {
    hero.ancestryTraits = heroAny['ancestry_traits'] as string[];
    delete heroAny['ancestry_traits'];
  }

  // Migration: hero_class -> heroClass
  if (heroAny['hero_class'] !== undefined && hero.heroClass === undefined) {
    hero.heroClass = heroAny['hero_class'] as string;
    delete heroAny['hero_class'];
  }

  // Migration: inciting_incident -> incitingIncident
  if (heroAny['inciting_incident'] !== undefined && hero.incitingIncident === undefined) {
    hero.incitingIncident = heroAny['inciting_incident'] as string | null;
    delete heroAny['inciting_incident'];
  }

  // Migration: portrait_url -> portraitUrl
  if (heroAny['portrait_url'] !== undefined && hero.portraitUrl === undefined) {
    hero.portraitUrl = heroAny['portrait_url'] as string | null;
    delete heroAny['portrait_url'];
  }

  // Migration: max_stamina -> maxStamina
  if (heroAny['max_stamina'] !== undefined && hero.maxStamina === undefined) {
    hero.maxStamina = heroAny['max_stamina'] as number;
    delete heroAny['max_stamina'];
  }

  // Migration: current_stamina -> currentStamina
  if (heroAny['current_stamina'] !== undefined && hero.currentStamina === undefined) {
    hero.currentStamina = heroAny['current_stamina'] as number;
    delete heroAny['current_stamina'];
  }

  // Migration: max_recoveries -> maxRecoveries
  if (heroAny['max_recoveries'] !== undefined && hero.maxRecoveries === undefined) {
    hero.maxRecoveries = heroAny['max_recoveries'] as number;
    delete heroAny['max_recoveries'];
  }

  // Migration: current_recoveries -> currentRecoveries
  if (heroAny['current_recoveries'] !== undefined && hero.currentRecoveries === undefined) {
    hero.currentRecoveries = heroAny['current_recoveries'] as number;
    delete heroAny['current_recoveries'];
  }

  // Migration: heroic_resource -> heroicResource
  if (heroAny['heroic_resource'] !== undefined && hero.heroicResource === undefined) {
    hero.heroicResource = heroAny['heroic_resource'] as number;
    delete heroAny['heroic_resource'];
  }

  // Migration: hero_tokens -> heroTokens
  if (heroAny['hero_tokens'] !== undefined && hero.heroTokens === undefined) {
    hero.heroTokens = heroAny['hero_tokens'] as number;
    delete heroAny['hero_tokens'];
  }

  // Migration: selected_skills -> selectedSkills
  if (heroAny['selected_skills'] !== undefined && hero.selectedSkills === undefined) {
    hero.selectedSkills = heroAny['selected_skills'] as string[];
    delete heroAny['selected_skills'];
  }

  // Migration: selected_languages -> selectedLanguages
  if (heroAny['selected_languages'] !== undefined && hero.selectedLanguages === undefined) {
    hero.selectedLanguages = heroAny['selected_languages'] as string[];
    delete heroAny['selected_languages'];
  }

  // Migration: selected_perks -> selectedPerks
  if (heroAny['selected_perks'] !== undefined && hero.selectedPerks === undefined) {
    hero.selectedPerks = heroAny['selected_perks'] as string[];
    delete heroAny['selected_perks'];
  }

  // Migration: selected_titles -> selectedTitles
  if (heroAny['selected_titles'] !== undefined && hero.selectedTitles === undefined) {
    hero.selectedTitles = heroAny['selected_titles'] as unknown[];
    delete heroAny['selected_titles'];
  }

  // Migration: selected_abilities -> selectedAbilities
  if (heroAny['selected_abilities'] !== undefined && hero.selectedAbilities === undefined) {
    hero.selectedAbilities = heroAny['selected_abilities'] as string[];
    delete heroAny['selected_abilities'];
  }
}
