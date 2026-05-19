/**
 * Wizard Logic
 *
 * Pure functions for character creation wizard calculations.
 * Works with CharacterInProgress (partial hero state during creation).
 *
 * Reference: Character Creation rules from rules-md/
 */

import { GameData } from '../game-data/index.js';
import { portfolios } from '../portfolios/index.js';
import { BEASTHEART_COMPANION_OPTIONS } from '../rules/classes/beastheart/companions.js';
import { getAvailablePerkCategories, getClassPerkLevels } from '../rules/perks/index.js';
import * as HeroLogic from './hero-logic.js';
import type { MinionTemplate, PortfolioType } from '@anvil/types';

const CAREER_SKILL_GROUP_NAMES = new Set(['crafting', 'exploration', 'interpersonal', 'intrigue', 'lore']);
const SKILL_GROUP_NAMES = ['crafting', 'exploration', 'interpersonal', 'intrigue', 'lore'] as const;
export const CHARACTERISTIC_ORDER: HeroLogic.CharacteristicName[] = [
  'might',
  'agility',
  'reason',
  'intuition',
  'presence',
];

export function isCareerSkillChoice(skillName: string): boolean {
  return skillName.includes('/') || CAREER_SKILL_GROUP_NAMES.has(skillName.toLowerCase());
}

export function isSkillGroupName(value: string): boolean {
  return SKILL_GROUP_NAMES.includes(value.toLowerCase() as (typeof SKILL_GROUP_NAMES)[number]);
}

type GameDataAbility = ReturnType<typeof GameData.getAbilitiesByClassAndLevel>[number];

export interface AbilityChoiceSlot {
  id: string;
  label: string;
  description: string;
  kind: 'ability' | 'minion';
  costAmount: number | null;
  abilityType?: string;
  level: number;
  minionCostAmount?: number;
}

export interface ClassSkillChoiceSlot {
  id: string;
  label: string;
  description: string;
  groups: string[];
  index: number;
}

export interface CompanionChoiceOption {
  id: string;
  name: string;
  level: number;
  roles: string[];
  ancestry?: string[];
  size?: string;
  speed?: string;
  stability?: number;
  signatureAbility?: string;
}

export interface SummonerMinionChoiceOption {
  id: string;
  name: string;
  essenceCost: number;
  minionsPerSummon: number;
  size: string;
  speed: number;
  stamina: number | number[];
  stability: number;
  freeStrike: number;
  role: string;
  keywords: string[];
  movementModes: string[];
  freeStrikeDamageType: string;
  traits: Array<{ name: string; description: string }>;
  signatureAbilityName?: string;
}

export interface PerkChoiceSlot {
  id: string;
  label: string;
  description: string;
  categories: string[];
  source: 'career' | 'class';
  level?: number;
  selectedPerkId: string | null;
}

export interface CharacteristicAssignmentRules {
  fixed: Partial<HeroLogic.Characteristics>;
  fixedNames: HeroLogic.CharacteristicName[];
  remainingNames: HeroLogic.CharacteristicName[];
  arrays: number[][];
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Culture selection during character creation.
 */
export interface CultureSelection {
  environment: string | null;
  organization: string | null;
  upbringing: string | null;
  preset?: string | null;
  language?: string | null;
}

/**
 * Complication selection during character creation.
 */
export interface Complication {
  id: string;
  name: string;
  description?: string;
}

/**
 * Title selection during character creation.
 */
export interface Title {
  id: string;
  name: string;
  description?: string;
  effect?: string;
}

/**
 * A single choice made during level-up.
 */
export interface LevelUpChoice {
  featureId: string;
  choiceId: string;
  category?: string;
}

export interface LevelUpFeatureChoiceOption {
  id: string;
  name: string;
  description: string;
}

export interface LevelUpFeatureView {
  id: string;
  name: string;
  description: string;
  type: 'automatic' | 'choice';
  choices?: LevelUpFeatureChoiceOption[];
  category?: string;
}

/**
 * Character in progress during wizard steps.
 * Contains nullable fields as selections are made step by step.
 */
export interface CharacterInProgress {
  // Step 0: Level Selection (1-10)
  level: number;

  // Step 1: Ancestry
  ancestry: string | null;
  ancestryTraits: string[];

  // Step 2: Culture
  culture: CultureSelection;

  // Step 3: Career
  career: string | null;
  incitingIncident: string | null;

  // Step 4: Class
  heroClass: HeroLogic.HeroClass | null;

  // Step 5: Subclass
  subclass: string | string[] | null;

  // Step 6: Complications
  complication: Complication | null;

  // Step 7: Characteristics
  characteristics: HeroLogic.Characteristics | null;

  // Step 8: Kit
  kit: string | null;
  secondaryKit?: string | null;

  // Step 9: Skills
  selectedSkills: string[];
  // Skills selected from culture sources (environment, organization, upbringing)
  cultureSkills?: {
    environment?: string;
    organization?: string;
    upbringing?: string;
  };
  // Skills selected from career choice options (e.g., "Crafting/Exploration")
  careerSkillChoices?: string[];
  // Skills selected from class choice options.
  classSkillChoices?: string[];

  // Step 10: Languages
  selectedLanguages: string[];

  // Step 11: Perks
  selectedPerks: string[];
  careerPerk?: string | null;

  // Step 12: Titles
  selectedTitles: Title[];

  // Step 13: Abilities
  selectedAbilities: string[];
  abilityChoices?: Record<string, string>;
  summonerMinionChoices?: Record<string, string>;
  companion?: string | null;

  // Step 14: Personal Details
  name: string;
  pronouns: string;
  backstory: string;
  appearance: string;
  portraitUrl: string | null;

  // Level-up choices (for levels 2-10)
  levelUpChoices: Record<number, LevelUpChoice[]>;
}

/**
 * Derived stats calculated from character choices.
 */
export interface DerivedStats {
  stamina: number;
  speed: number;
  stability: number;
  size: string;
  recoveries: number;
}

/**
 * Granted item from a source (ancestry, career, etc.).
 */
export interface GrantedItem {
  id: string;
  name: string;
  source: string;
}

/**
 * All granted items from character selections.
 */
export interface GrantedItems {
  skills: GrantedItem[];
  languages: GrantedItem[];
}

/**
 * Validation result for a wizard step.
 */
export interface StepValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Status of a wizard step.
 */
export type StepStatus = 'complete' | 'incomplete' | 'not-begun';

/**
 * Definition of a wizard step.
 */
export interface WizardStepDefinition {
  id: string;
  label: string;
  required: boolean;
  /** For level-up steps, the level number (2-10) */
  levelUpLevel?: number;
}

// ---------------------------------------------------------------------------
// Characteristic Assignment Rules
// ---------------------------------------------------------------------------

function sameNumberMultiset(values: number[], target: number[]): boolean {
  if (values.length !== target.length) return false;

  const sortedValues = [...values].sort((a, b) => b - a);
  const sortedTarget = [...target].sort((a, b) => b - a);

  return sortedValues.every((value, index) => value === sortedTarget[index]);
}

/**
 * Get class-specific characteristic assignment rules for hero creation.
 *
 * Draw Steel classes automatically set one or two characteristics to +2.
 * The class then exposes arrays for only the remaining characteristics.
 */
export function getCharacteristicAssignmentRules(
  heroClass: HeroLogic.HeroClass | null | undefined
): CharacteristicAssignmentRules | null {
  if (!heroClass) return null;

  const classDef = GameData.getClass(heroClass);
  if (!classDef) return null;

  const fixed: Partial<HeroLogic.Characteristics> = {};
  for (const [name, value] of Object.entries(classDef.startingCharacteristics)) {
    if (typeof value === 'number') {
      fixed[name as HeroLogic.CharacteristicName] = value;
    }
  }

  const fixedNames = CHARACTERISTIC_ORDER.filter((name) => fixed[name] !== undefined);
  const remainingNames = CHARACTERISTIC_ORDER.filter((name) => fixed[name] === undefined);
  const arrays = classDef.baseStats.characteristicArrays
    .filter((array) => array.length === remainingNames.length)
    .map((array) => [...array]);

  return {
    fixed,
    fixedNames,
    remainingNames,
    arrays,
  };
}

/**
 * Validate a hero creation characteristic assignment against the selected class.
 */
export function isValidStartingCharacteristics(
  characteristics: HeroLogic.Characteristics | null | undefined,
  heroClass: HeroLogic.HeroClass | null | undefined
): boolean {
  if (!characteristics) return false;

  const rules = getCharacteristicAssignmentRules(heroClass);
  if (!rules) return false;

  for (const name of rules.fixedNames) {
    if (characteristics[name] !== rules.fixed[name]) {
      return false;
    }
  }

  const remainingValues = rules.remainingNames.map((name) => characteristics[name]);
  return rules.arrays.some((array) => sameNumberMultiset(remainingValues, array));
}

// ---------------------------------------------------------------------------
// Slot-Driven Creation Choices
// ---------------------------------------------------------------------------

const ONE_SIGNATURE_CLASSES = new Set<HeroLogic.HeroClass>([
  'beastheart',
  'censor',
  'fury',
  'shadow',
  'troubadour',
]);

const TWO_SIGNATURE_CLASSES = new Set<HeroLogic.HeroClass>([
  'conduit',
  'elementalist',
  'null',
  'talent',
]);

const SUMMONER_CIRCLE_PORTFOLIOS: Record<string, PortfolioType> = {
  blight: 'demon',
  graves: 'undead',
  spring: 'fey',
  storms: 'elemental',
};

const AUTOMATIC_ABILITY_IDS_BY_CLASS: Partial<Record<HeroLogic.HeroClass, string[]>> = {
  summoner: ['summoner-strike', 'strike-for-me'],
};

const SIGNATURE_ABILITY_SLOT: Omit<AbilityChoiceSlot, 'id' | 'label'> = {
  description: 'Choose one signature ability. Signature abilities are free to use.',
  kind: 'ability',
  abilityType: 'Signature',
  costAmount: null,
  level: 1,
};

const THREE_COST_ABILITY_SLOT: Omit<AbilityChoiceSlot, 'id' | 'label'> = {
  description: 'Choose one ability that costs 3 heroic resource.',
  kind: 'ability',
  costAmount: 3,
  level: 1,
};

const FIVE_COST_ABILITY_SLOT: Omit<AbilityChoiceSlot, 'id' | 'label'> = {
  description: 'Choose one ability that costs 5 heroic resource.',
  kind: 'ability',
  costAmount: 5,
  level: 1,
};

const SUMMONER_ABILITY_SLOTS: Omit<AbilityChoiceSlot, 'id'>[] = [
  {
    label: 'Signature Minion 1',
    description: 'Choose one 1-essence signature minion from your circle portfolio.',
    kind: 'minion',
    costAmount: null,
    minionCostAmount: 1,
    level: 1,
  },
  {
    label: 'Signature Minion 2',
    description: 'Choose a second 1-essence signature minion from your circle portfolio.',
    kind: 'minion',
    costAmount: null,
    minionCostAmount: 1,
    level: 1,
  },
  {
    label: '3-Essence Minion',
    description: 'Choose one 3-essence minion from your circle portfolio.',
    kind: 'minion',
    costAmount: null,
    minionCostAmount: 3,
    level: 1,
  },
  {
    label: '5-Essence Ability',
    ...FIVE_COST_ABILITY_SLOT,
    description: 'Choose one ability that costs 5 essence.',
  },
];

function createAbilitySlot(
  heroClass: HeroLogic.HeroClass,
  slot: Omit<AbilityChoiceSlot, 'id'>,
  index: number,
): AbilityChoiceSlot {
  const suffix = slot.kind === 'minion'
    ? `minion-${slot.minionCostAmount}-${index + 1}`
    : slot.abilityType
      ? `${normalizeChoiceId(slot.abilityType)}-${index + 1}`
      : `cost-${slot.costAmount}`;

  return {
    ...slot,
    id: `class:${heroClass}:level-${slot.level}:${suffix}`,
  };
}

function createLevelOneAbilitySlots(heroClass: HeroLogic.HeroClass): AbilityChoiceSlot[] {
  if (heroClass === 'summoner') {
    return SUMMONER_ABILITY_SLOTS.map((slot, index) => createAbilitySlot(heroClass, slot, index));
  }

  const slots: Omit<AbilityChoiceSlot, 'id'>[] = [];

  if (ONE_SIGNATURE_CLASSES.has(heroClass)) {
    slots.push({ label: 'Signature Ability', ...SIGNATURE_ABILITY_SLOT });
  } else if (TWO_SIGNATURE_CLASSES.has(heroClass)) {
    slots.push(
      { label: 'Signature Ability 1', ...SIGNATURE_ABILITY_SLOT },
      { label: 'Signature Ability 2', ...SIGNATURE_ABILITY_SLOT },
    );
  }

  slots.push(
    { label: '3pt Ability', ...THREE_COST_ABILITY_SLOT },
    { label: '5pt Ability', ...FIVE_COST_ABILITY_SLOT },
  );

  return slots.map((slot, index) => createAbilitySlot(heroClass, slot, index));
}

function normalizeChoiceId(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function getAbilityFeatureId(feature: GameDataAbility): string {
  return feature.metadata.item_id ?? feature.metadata.scc?.[0] ?? normalizeChoiceId(feature.name);
}

export function getAbilityChoiceSlots(character: CharacterInProgress): AbilityChoiceSlot[] {
  if (!character.heroClass) return [];

  const slots = createLevelOneAbilitySlots(character.heroClass);

  return slots.filter((slot) => {
    if (slot.kind === 'minion') {
      return getSummonerMinionOptionsForSlot(character, slot).length > 0;
    }
    return getAbilityOptionsForSlot(character, slot).length > 0;
  });
}

function abilityMatchesSlot(ability: GameDataAbility, slot: AbilityChoiceSlot): boolean {
  if (slot.kind !== 'ability') return false;
  if (ability.feature_type !== 'ability') return false;

  const abilityType = ability.metadata.ability_type;
  const costAmount = ability.metadata.cost_amount;

  if (slot.abilityType) {
    return abilityType === slot.abilityType;
  }

  return costAmount === slot.costAmount;
}

export function getAbilityOptionsForSlot(
  character: CharacterInProgress,
  slot: AbilityChoiceSlot
): GameDataAbility[] {
  if (!character.heroClass || slot.kind !== 'ability') return [];

  return GameData.getAbilitiesByClassAndLevel(character.heroClass, slot.level).filter((ability) =>
    abilityMatchesSlot(ability, slot)
  );
}

function getSummonerPortfolio(character: CharacterInProgress) {
  if (character.heroClass !== 'summoner') return null;
  const subclassId = Array.isArray(character.subclass) ? character.subclass[0] : character.subclass;
  const portfolioType = subclassId ? SUMMONER_CIRCLE_PORTFOLIOS[subclassId] : null;
  return portfolioType ? portfolios[portfolioType] : null;
}

function minionTemplateToChoice(template: MinionTemplate): SummonerMinionChoiceOption {
  return {
    id: template.id,
    name: template.name,
    essenceCost: template.essenceCost,
    minionsPerSummon: template.minionsPerSummon,
    size: template.size,
    speed: template.speed,
    stamina: template.stamina,
    stability: template.stability,
    freeStrike: template.freeStrike,
    role: template.role,
    keywords: template.keywords,
    movementModes: template.movementModes,
    freeStrikeDamageType: template.freeStrikeDamageType,
    traits: template.traits,
    signatureAbilityName: template.signatureAbility?.name,
  };
}

export function getSummonerMinionOptionsForSlot(
  character: CharacterInProgress,
  slot: AbilityChoiceSlot
): SummonerMinionChoiceOption[] {
  if (slot.kind !== 'minion') return [];

  const portfolio = getSummonerPortfolio(character);
  if (!portfolio) return [];

  const minions = slot.minionCostAmount === 1
    ? portfolio.signatureMinions
    : portfolio.unlockedMinions.filter((minion) => minion.essenceCost === slot.minionCostAmount);

  return minions.map(minionTemplateToChoice);
}

export function getSelectedChoiceIdForSlot(
  character: CharacterInProgress,
  slot: AbilityChoiceSlot
): string | undefined {
  return slot.kind === 'minion'
    ? character.summonerMinionChoices?.[slot.id]
    : character.abilityChoices?.[slot.id];
}

export function getSelectedSummonerMinionIds(character: CharacterInProgress): string[] {
  const ids: string[] = [];
  const push = (id: string | null | undefined) => {
    if (id && !ids.includes(id)) ids.push(id);
  };

  for (const slot of getAbilityChoiceSlots(character)) {
    if (slot.kind === 'minion') {
      push(getSelectedChoiceIdForSlot(character, slot));
    }
  }

  return ids;
}

export function getAutomaticAbilityIds(character: CharacterInProgress): string[] {
  if (!character.heroClass) return [];
  return [...(AUTOMATIC_ABILITY_IDS_BY_CLASS[character.heroClass] ?? [])];
}

export function getSelectedAbilityIds(character: CharacterInProgress): string[] {
  const ids: string[] = [];
  const push = (id: string | null | undefined) => {
    if (id && !ids.includes(id)) ids.push(id);
  };

  for (const id of getAutomaticAbilityIds(character)) {
    push(id);
  }

  for (const slot of getAbilityChoiceSlots(character)) {
    if (slot.kind !== 'ability') continue;
    push(getSelectedChoiceIdForSlot(character, slot));
  }

  for (const id of character.selectedAbilities ?? []) {
    push(id);
  }

  for (const choice of getLevelUpChoicesByCategory(character, 'ability')) {
    push(choice.choiceId);
  }

  return ids;
}

export function hasCompleteAbilitySelections(character: CharacterInProgress): boolean {
  const slots = getAbilityChoiceSlots(character);
  if (slots.length === 0) return !!character.heroClass;

  const selectedIds: string[] = [];

  return slots.every((slot) => {
    const selectedId = getSelectedChoiceIdForSlot(character, slot);
    if (!selectedId) return false;
    selectedIds.push(selectedId);

    if (slot.kind === 'minion') {
      return getSummonerMinionOptionsForSlot(character, slot).some(
        (minion) => minion.id === selectedId
      );
    }

    return getAbilityOptionsForSlot(character, slot).some(
      (ability) => getAbilityFeatureId(ability) === selectedId
    );
  }) && new Set(selectedIds).size === selectedIds.length;
}

export function getClassSkillChoiceSlots(character: CharacterInProgress): ClassSkillChoiceSlot[] {
  if (!character.heroClass) return [];

  const classDef = GameData.getClass(character.heroClass);
  if (!classDef) return [];

  const slots: ClassSkillChoiceSlot[] = [];
  for (const groupChoice of classDef.skillGroupChoices) {
    const groups = groupChoice.groups.map((group) => group.toLowerCase());
    for (let i = 0; i < groupChoice.count; i++) {
      slots.push({
        id: `class-skill-${slots.length}`,
        label: `Class: ${classDef.name} (Choice ${slots.length + 1})`,
        description: `Choose 1 skill from: ${groups.join(' or ')}`,
        groups,
        index: slots.length,
      });
    }
  }

  return slots;
}

export function getPerkChoiceSlots(character: CharacterInProgress): PerkChoiceSlot[] {
  const slots: PerkChoiceSlot[] = [];

  if (character.career) {
    const career = GameData.getCareer(character.career);
    if (career) {
      slots.push({
        id: 'career-perk',
        label: `Career: ${career.name}`,
        description: `Choose one ${career.perkType} perk granted by your career.`,
        categories: [career.perkType],
        source: 'career',
        selectedPerkId: character.careerPerk ?? null,
      });
    }
  }

  if (character.heroClass) {
    const perkLevels = getClassPerkLevels(character.heroClass);
    for (const perkLevel of perkLevels) {
      if (perkLevel <= character.level) {
        const categories = getAvailablePerkCategories(character.heroClass, perkLevel);
        slots.push({
          id: `class-perk:${perkLevel}`,
          label: `Level ${perkLevel}`,
          description: `Choose one perk gained at level ${perkLevel}.`,
          categories,
          source: 'class',
          level: perkLevel,
          selectedPerkId: character.selectedPerks?.[slots.filter((slot) => slot.source === 'class').length] ?? null,
        });
      }
    }
  }

  return slots;
}

export function getSelectedPerkIds(character: CharacterInProgress): string[] {
  const ids: string[] = [];
  const push = (id: string | null | undefined) => {
    if (id && !ids.includes(id)) ids.push(id);
  };

  push(character.careerPerk);
  for (const id of character.selectedPerks ?? []) {
    push(id);
  }

  return ids;
}

export function isCompanionRequired(character: CharacterInProgress): boolean {
  return character.heroClass === 'beastheart';
}

export function getCompanionOptions(): CompanionChoiceOption[] {
  return BEASTHEART_COMPANION_OPTIONS.map((companion) => ({
    id: companion.id,
    name: companion.name,
    level: companion.level,
    roles: companion.roles,
    ancestry: companion.ancestry,
    size: companion.size,
    speed: companion.speed,
    stability: companion.stability,
    signatureAbility: companion.signatureAbility,
  }));
}

export function getKitSelectionsNeeded(character: CharacterInProgress): number {
  return character.heroClass === 'tactician' ? 2 : 1;
}

export function getSelectedKitIds(character: CharacterInProgress): string[] {
  const ids: string[] = [];
  const push = (id: string | null | undefined) => {
    if (id && !ids.includes(id)) ids.push(id);
  };

  push(character.kit);
  if (character.heroClass === 'tactician') {
    push(character.secondaryKit);
  }

  return ids;
}

// ---------------------------------------------------------------------------
// Derived Stats Calculation
// ---------------------------------------------------------------------------

/**
 * Default derived stats when required selections are missing.
 */
const DEFAULT_DERIVED_STATS: DerivedStats = {
  stamina: 18,
  speed: 5,
  stability: 0,
  size: '1M',
  recoveries: 8,
};

/**
 * Calculate derived stats from character choices.
 * Returns default values if required choices haven't been made.
 *
 * @param character - The character in progress
 * @returns Derived combat stats
 */
export function calculateDerivedStats(character: CharacterInProgress): DerivedStats {
  // Need heroClass to calculate stamina
  if (!character.heroClass) {
    return { ...DEFAULT_DERIVED_STATS };
  }

  const level = character.level || 1;
  const echelon = HeroLogic.getEchelon(level);

  // Get ancestry data for speed and size
  const ancestry = character.ancestry
    ? GameData.getAncestry(character.ancestry)
    : null;

  // Get kit data for bonuses. Tacticians benefit from two kits through Field Arsenal.
  const kits = getSelectedKitIds(character)
    .map((kitId) => GameData.getKit(kitId))
    .filter((kit): kit is NonNullable<ReturnType<typeof GameData.getKit>> => !!kit);

  // Add kit stamina bonus (kit stamina is per echelon)
  const kitStaminaBonus = kits.reduce((total, kit) => total + kit.staminaPerEchelon, 0) * echelon;
  const levelUpStaminaBonus = HeroLogic.getLevelAdvancementStaminaBonus(
    character.heroClass,
    level,
    character.levelUpChoices,
  );

  // Get recoveries from class
  const recoveries = HeroLogic.getMaxRecoveries(character.heroClass);

  // Calculate speed: ancestry base + kit bonus
  const baseSpeed = ancestry?.speed ?? 5;
  const speedBonus = kits.reduce((total, kit) => total + kit.speedBonus, 0);

  // Get stability from kit
  const stability = kits.reduce((total, kit) => total + kit.stabilityBonus, 0);

  // Get size from ancestry
  const size = ancestry?.size ?? '1M';

  return {
    stamina: HeroLogic.getMaxStaminaForClass(character.heroClass, level) + kitStaminaBonus + levelUpStaminaBonus,
    speed: baseSpeed + speedBonus,
    stability,
    size,
    recoveries,
  };
}

/**
 * Check if derived stats can be calculated (has required selections).
 *
 * @param character - The character in progress
 * @returns True if required selections are made
 */
export function canCalculateDerivedStats(character: CharacterInProgress): boolean {
  return character.heroClass !== null;
}

// ---------------------------------------------------------------------------
// Granted Items Calculation
// ---------------------------------------------------------------------------

/**
 * Calculate skills and languages granted by character selections.
 *
 * @param character - The character in progress
 * @returns Granted skills and languages
 */
export function calculateGrantedItems(character: CharacterInProgress): GrantedItems {
  const skills: GrantedItem[] = [];
  const languages: GrantedItem[] = [];

  // Default language - all heroes know Caelian
  languages.push({
    id: 'caelian',
    name: 'Caelian',
    source: 'Default',
  });

  if (character.culture.language) {
    const cultureLanguage =
      GameData.getLanguage(character.culture.language) ??
      GameData.getLanguageByName(character.culture.language);
    const languageName = cultureLanguage?.name ?? character.culture.language;
    languages.push({
      id: cultureLanguage?.id ?? languageName.toLowerCase().replace(/\s+/g, '-'),
      name: languageName,
      source: 'Culture',
    });
  }

  // From Career - careers grant specific skills
  if (character.career) {
    const career = GameData.getCareer(character.career);
    if (career) {
      for (const skillName of career.skills) {
        // Fixed named skills are granted; groups and slash-separated entries are player choices.
        if (!isCareerSkillChoice(skillName)) {
          skills.push({
            id: skillName.toLowerCase().replace(/\s+/g, '-'),
            name: skillName,
            source: `Career: ${career.name}`,
          });
        }
      }
    }
  }

  // From Class - some classes grant fixed starting skills
  if (character.heroClass) {
    const classDef = GameData.getClass(character.heroClass);
    if (classDef) {
      for (const skillName of classDef.fixedSkills) {
        skills.push({
          id: skillName.toLowerCase().replace(/\s+/g, '-'),
          name: skillName,
          source: `Class: ${classDef.name}`,
        });
      }
    }
  }

  // Remove duplicates by id
  const uniqueSkills = skills.filter(
    (skill, index, self) => index === self.findIndex((s) => s.id === skill.id)
  );

  const uniqueLanguages = languages.filter(
    (lang, index, self) => index === self.findIndex((l) => l.id === lang.id)
  );

  return {
    skills: uniqueSkills,
    languages: uniqueLanguages,
  };
}

/**
 * Calculate number of additional skill selections needed.
 *
 * @param character - The character in progress
 * @returns Number of skill selections required
 */
export function getSkillSelectionsNeeded(character: CharacterInProgress): number {
  // 1 skill from each culture source: environment, organization, upbringing
  let selections = 0;
  if (character.culture.environment) selections++;
  if (character.culture.organization) selections++;
  if (character.culture.upbringing) selections++;

  if (character.career) {
    const career = GameData.getCareer(character.career);
    if (career) {
      const choiceSkills = career.skills.filter(isCareerSkillChoice);
      selections += choiceSkills.length;
    }
  }

  selections += getClassSkillChoiceSlots(character).length;

  return selections;
}

/**
 * Count required player-made skill selections already chosen.
 *
 * @param character - The character in progress
 * @returns Number of culture/career choice selections made
 */
export function getSkillSelectionsMade(character: CharacterInProgress): number {
  let selections = 0;
  if (character.cultureSkills?.environment) selections++;
  if (character.cultureSkills?.organization) selections++;
  if (character.cultureSkills?.upbringing) selections++;

  if (character.career) {
    const career = GameData.getCareer(character.career);
    const choiceCount = career?.skills.filter(isCareerSkillChoice).length ?? 0;
    for (let i = 0; i < choiceCount; i++) {
      if (character.careerSkillChoices?.[i]) selections++;
    }
  }

  for (const slot of getClassSkillChoiceSlots(character)) {
    if (character.classSkillChoices?.[slot.index]) selections++;
  }

  return selections;
}

/**
 * Resolve the final unique skill names to persist on the hero.
 * Includes automatic grants and player-selected culture/career choices.
 *
 * @param character - The character in progress
 * @returns Unique skill names in stable display order
 */
export function getSelectedSkillNames(character: CharacterInProgress): string[] {
  const names: string[] = [];
  const push = (skillName: string | null | undefined) => {
    if (skillName && !names.includes(skillName)) {
      names.push(skillName);
    }
  };

  for (const granted of calculateGrantedItems(character).skills) {
    push(granted.name);
  }

  push(character.cultureSkills?.environment);
  push(character.cultureSkills?.organization);
  push(character.cultureSkills?.upbringing);

  for (const choice of character.careerSkillChoices ?? []) {
    push(choice);
  }

  for (const choice of character.classSkillChoices ?? []) {
    push(choice);
  }

  for (const skillName of getAutomaticLevelUpSkillNames(character)) {
    push(skillName);
  }

  for (const choice of getLevelUpChoicesByCategory(character, 'skill')) {
    push(resolveSkillChoiceName(choice.choiceId));
  }

  return names;
}

// ---------------------------------------------------------------------------
// Level-Up Feature Choices
// ---------------------------------------------------------------------------

type GameDataFeature = ReturnType<typeof GameData.getAllFeatures>[number];
type GameDataSkill = ReturnType<typeof GameData.getAllSkills>[number];
type EffectWithNestedFeatures = {
  effect?: string;
  name?: string;
  features?: GameDataFeature[];
  tier1?: string;
  tier2?: string;
  tier3?: string;
};

const ORDINAL_LEVEL = /^(\d+)(st|nd|rd|th)-level\s+/i;

const SUMMONER_WARD_CHOICES: LevelUpFeatureChoiceOption[] = [
  {
    id: 'conjured-ward',
    name: 'Conjured Ward',
    description: 'You gain a +3 bonus to Stamina, increasing by +3 at levels 4, 7, and 10.',
  },
  {
    id: 'emergency-ward',
    name: 'Emergency Ward',
    description: 'The first time each round you take damage, shift 1 and summon a signature minion into the square you left.',
  },
  {
    id: 'howling-ward',
    name: 'Howling Ward',
    description: 'Enemies that start their turn adjacent to you take damage equal to your Reason.',
  },
  {
    id: 'snare-ward',
    name: 'Snare Ward',
    description: 'When an adjacent creature damages you, pull that creature toward one of your minions within Summoner Range.',
  },
];

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripSubclassPrefix(name: string): string {
  return name
    .replace(/^College of the\s+/i, '')
    .replace(/^College of\s+/i, '')
    .replace(/^Domain of\s+/i, '')
    .replace(/^The\s+/i, '')
    .trim();
}

function featureId(feature: GameDataFeature): string {
  return feature.metadata?.scc?.[0] ?? feature.metadata?.item_id ?? normalizeChoiceId(feature.name);
}

function effectText(effect: EffectWithNestedFeatures): string {
  const parts = [
    effect.effect ? (effect.name ? `${effect.name}: ${effect.effect}` : effect.effect) : effect.name,
    effect.tier1 ? `<=11: ${effect.tier1}` : null,
    effect.tier2 ? `12-16: ${effect.tier2}` : null,
    effect.tier3 ? `17+: ${effect.tier3}` : null,
  ].filter((part): part is string => Boolean(part));

  return parts.join('\n');
}

function featureDescription(feature: GameDataFeature): string {
  const text = ((feature.effects ?? []) as EffectWithNestedFeatures[])
    .map(effectText)
    .filter(Boolean)
    .join('\n\n');

  return text || feature.name;
}

function nestedChoiceFeatures(feature: GameDataFeature): GameDataFeature[] {
  return ((feature.effects ?? []) as EffectWithNestedFeatures[])
    .flatMap((effect) => effect.features ?? []);
}

function getSubclassTokens(
  heroClass: HeroLogic.HeroClass,
  subclass: string | string[] | null
): string[] {
  if (!subclass) return [];
  const ids = Array.isArray(subclass) ? subclass : [subclass];
  return ids.flatMap((id) => {
    const option = GameData.getSubclass(heroClass, id);
    const name = option?.name ?? id;
    return [id.replace(/-/g, ' '), name, stripSubclassPrefix(name)].map(normalizeText);
  });
}

function featureMatchesSubclass(
  feature: GameDataFeature,
  heroClass: HeroLogic.HeroClass,
  subclass: string | string[] | null
): boolean {
  const selectedTokens = getSubclassTokens(heroClass, subclass);
  if (selectedTokens.length === 0) return true;

  const metadataSubclass = feature.metadata?.subclass;
  if (metadataSubclass) {
    return selectedTokens.includes(normalizeText(metadataSubclass));
  }

  const featureName = normalizeText(feature.name.replace(ORDINAL_LEVEL, ''));
  if (selectedTokens.some((token) => token && featureName.includes(token))) {
    return true;
  }

  const allSubclassMarkers = GameData.getSubclasses(heroClass).flatMap((option) => [
    normalizeText(option.id.replace(/-/g, ' ')),
    normalizeText(stripSubclassPrefix(option.name)),
  ]);
  const referencesAnotherSubclass = allSubclassMarkers.some(
    (marker) => marker && featureName.includes(marker)
  );

  return !referencesAnotherSubclass;
}

function skillDescription(skill: GameDataSkill): string {
  const skillRecord = skill as GameDataSkill & { description?: string; use?: string; group?: string };
  return skillRecord.description ?? skillRecord.use ?? skill.name;
}

function skillChoiceOptions(group?: string): LevelUpFeatureChoiceOption[] {
  return GameData.getAllSkills()
    .filter((skill) => !group || (skill as GameDataSkill & { group?: string }).group === group)
    .map((skill) => ({
      id: skill.name,
      name: skill.name,
      description: skillDescription(skill),
    }));
}

function characteristicChoiceOptions(heroClass: HeroLogic.HeroClass): LevelUpFeatureChoiceOption[] {
  const fixed = new Set(HeroLogic.getAdvancementFixedCharacteristics(heroClass));
  if (fixed.size !== 1) return [];

  return CHARACTERISTIC_ORDER
    .filter((name) => !fixed.has(name))
    .map((name) => ({
      id: name,
      name: name.charAt(0).toUpperCase() + name.slice(1),
      description: `Increase ${name} by 1.`,
    }));
}

function abilityChoicesByCost(
  heroClass: HeroLogic.HeroClass,
  cost: number
): LevelUpFeatureChoiceOption[] {
  return GameData.getAbilitiesByClass(heroClass)
    .filter((ability) => ability.metadata.cost_amount === cost)
    .map((ability) => ({
      id: getAbilityFeatureId(ability),
      name: ability.name,
      description: featureDescription(ability),
    }));
}

function abilityChoiceFeature(
  heroClass: HeroLogic.HeroClass,
  level: number,
  cost: number
): LevelUpFeatureView {
  const resource = HeroLogic.getHeroicResourceName(HeroLogic.getHeroicResourceType(heroClass));
  return {
    id: `${heroClass}-level-${level}-cost-${cost}-ability`,
    name: `${cost}-${resource} Ability`,
    description: `Choose one ${cost}-${resource} ability.`,
    type: 'choice',
    category: 'ability',
    choices: abilityChoicesByCost(heroClass, cost),
  };
}

function skillChoiceFeature(
  heroClass: HeroLogic.HeroClass,
  level: number,
  id = `${heroClass}-level-${level}-skill`,
  group?: string
): LevelUpFeatureView {
  return {
    id,
    name: 'Skill',
    description: group ? `Choose one ${group} skill.` : 'Choose one skill.',
    type: 'choice',
    category: 'skill',
    choices: skillChoiceOptions(group),
  };
}

function characteristicChoiceFeature(
  heroClass: HeroLogic.HeroClass,
  level: number
): LevelUpFeatureView | null {
  const choices = characteristicChoiceOptions(heroClass);
  if (choices.length === 0) return null;

  return {
    id: `${heroClass}-level-${level}-characteristic-choice`,
    name: 'Characteristic Increase',
    description: `Choose one non-primary characteristic to increase by 1.`,
    type: 'choice',
    category: 'characteristic',
    choices,
  };
}

function choiceCategory(
  feature: GameDataFeature,
  choices: GameDataFeature[]
): string | undefined {
  const name = feature.name.toLowerCase();
  if (choices.some((choice) => choice.feature_type === 'ability') || name.includes('ability')) {
    return 'ability';
  }
  if (name.includes('skill')) return 'skill';
  if (name.includes('characteristic')) return 'characteristic';
  if (name.includes('ward')) return 'ward';
  return feature.metadata?.item_id;
}

function generatedLevelUpFeatures(character: CharacterInProgress, level: number): LevelUpFeatureView[] {
  if (!character.heroClass) return [];

  return GameData.getAllFeatures()
    .filter((feature) => feature.feature_type !== 'ability')
    .filter((feature) => feature.metadata?.class === character.heroClass && feature.metadata?.level === level)
    .filter((feature) => featureMatchesSubclass(feature, character.heroClass!, character.subclass))
    .map((feature) => {
      const loweredName = feature.name.toLowerCase();

      if (loweredName === 'skill') {
        return skillChoiceFeature(character.heroClass!, level, featureId(feature));
      }

      if (loweredName === 'characteristic increase') {
        const choiceFeature = characteristicChoiceFeature(character.heroClass!, level);
        if (choiceFeature) {
          return {
            ...choiceFeature,
            id: featureId(feature),
            description: featureDescription(feature),
          };
        }
      }

      const nested = nestedChoiceFeatures(feature);
      const choices = nested.map((choice) => ({
        id: featureId(choice),
        name: choice.name,
        description: featureDescription(choice),
      }));

      return {
        id: featureId(feature),
        name: feature.name,
        description: featureDescription(feature),
        type: choices.length > 0 ? 'choice' : 'automatic',
        choices,
        category: choiceCategory(feature, nested),
      };
    });
}

function masterClassFallbackFeatures(
  heroClass: HeroLogic.HeroClass,
  level: number
): LevelUpFeatureView[] {
  if (heroClass === 'beastheart') {
    switch (level) {
      case 2:
        return [
          { id: 'beastheart-2-perk', name: 'Perk', description: 'Gain one exploration, interpersonal, or intrigue perk.', type: 'automatic' },
          { id: 'beastheart-2-best-friend', name: "Everyone's Best Friend", description: 'Your companion can help improve a montage test tier once per round.', type: 'automatic' },
        ];
      case 3:
        return [abilityChoiceFeature(heroClass, level, 7)];
      case 4:
        return [
          { id: 'beastheart-4-characteristics', name: 'Characteristic Increase', description: 'Your Might and Intuition scores each increase to 3.', type: 'automatic' },
          { id: 'beastheart-4-perk', name: 'Perk', description: 'Gain one perk.', type: 'automatic' },
          skillChoiceFeature(heroClass, level),
          { id: 'beastheart-4-unchained-ferocity', name: 'Unchained Ferocity', description: 'The first time each round that a creature adjacent to your companion takes damage, you gain 3 ferocity.', type: 'automatic' },
        ];
      case 5:
        return [abilityChoiceFeature(heroClass, level, 9)];
      case 6:
        return [
          { id: 'beastheart-6-perk', name: 'Perk', description: 'Gain one exploration, interpersonal, or intrigue perk.', type: 'automatic' },
        ];
      case 7:
        return [
          { id: 'beastheart-7-characteristics', name: 'Characteristic Increase', description: 'Each characteristic score increases by 1, to a maximum of 4.', type: 'automatic' },
          { id: 'beastheart-7-greater-ferocity', name: 'Greater Ferocity', description: 'At the start of your turn, you gain 1d3 + 1 ferocity.', type: 'automatic' },
          skillChoiceFeature(heroClass, level),
        ];
      case 8:
        return [
          { id: 'beastheart-8-perk', name: 'Perk', description: 'Gain one perk.', type: 'automatic' },
          abilityChoiceFeature(heroClass, level, 11),
        ];
      case 9:
        return [
          { id: 'beastheart-9-avatar-green', name: 'Avatar of the Green', description: "Your companion's Reason increases and they can communicate telepathically within 10 squares.", type: 'automatic' },
          { id: 'beastheart-9-nature-skill', name: 'Nature Skill', description: 'You gain Nature.', type: 'automatic' },
          skillChoiceFeature(heroClass, level, 'beastheart-9-lore-skill', 'lore'),
        ];
      case 10:
        return [
          { id: 'beastheart-10-characteristics', name: 'Characteristic Increase', description: 'Your Might and Intuition scores each increase to 5.', type: 'automatic' },
          { id: 'beastheart-10-final-evolution', name: 'Final Evolution', description: 'At the start of your turn, you gain 2d3 + 1 ferocity.', type: 'automatic' },
          { id: 'beastheart-10-perk', name: 'Perk', description: 'Gain one exploration, interpersonal, or intrigue perk.', type: 'automatic' },
          { id: 'beastheart-10-ferox', name: 'Ferox', description: 'You gain the epic resource ferox when you finish a respite.', type: 'automatic' },
          skillChoiceFeature(heroClass, level),
        ];
      default:
        return [];
    }
  }

  if (heroClass === 'summoner') {
    switch (level) {
      case 2:
        return [
          { id: 'summoner-2-perk', name: 'Perk', description: 'Gain one intrigue, lore, or supernatural perk.', type: 'automatic' },
          { id: 'summoner-2-dominion', name: 'Dominion', description: 'Once per encounter, you can summon a fixture from your circle.', type: 'automatic' },
        ];
      case 3:
        return [
          { id: 'summoner-3-kit', name: "Summoner's Kit", description: 'Your Summoner Strike improves and uses Summoner Range.', type: 'automatic' },
          { id: 'summoner-3-ward', name: 'Ward', description: 'Choose one ward from your Summoner Kit.', type: 'choice', category: 'ward', choices: SUMMONER_WARD_CHOICES },
          abilityChoiceFeature(heroClass, level, 7),
        ];
      case 4:
        return [
          { id: 'summoner-4-reason', name: 'Reason Increase', description: 'Your Reason score increases to 3.', type: 'automatic' },
          characteristicChoiceFeature(heroClass, level)!,
          { id: 'summoner-4-minion-improvement', name: 'Minion Improvement', description: 'Your maximum number of minions increases by 4 and your minions improve.', type: 'automatic' },
          { id: 'summoner-4-perk', name: 'Perk', description: 'Gain one perk.', type: 'automatic' },
          skillChoiceFeature(heroClass, level),
        ].filter((feature): feature is LevelUpFeatureView => Boolean(feature));
      case 5:
        return [];
      case 6:
        return [
          { id: 'summoner-6-perk', name: 'Perk', description: 'Gain one intrigue, lore, or supernatural perk.', type: 'automatic' },
          { id: 'summoner-6-return-source', name: 'Return to the Source', description: "You can travel to your circle's source as a respite activity.", type: 'automatic' },
          { id: 'summoner-6-minion-machinations', name: 'Minion Machinations', description: 'Your maximum number of followers increases by 2.', type: 'automatic' },
          { id: 'summoner-6-ward', name: 'Kit Improvement', description: 'Choose one additional ward from your Summoner Kit.', type: 'choice', category: 'ward', choices: SUMMONER_WARD_CHOICES },
          abilityChoiceFeature(heroClass, level, 9),
        ];
      case 7:
        return [
          { id: 'summoner-7-characteristics', name: 'Characteristic Increase', description: 'Each characteristic score increases by 1, to a maximum of 4.', type: 'automatic' },
          { id: 'summoner-7-minion-improvement', name: 'Minion Improvement', description: 'Your minions improve and you can summon an additional signature minion each turn.', type: 'automatic' },
          { id: 'summoner-7-font-creation', name: 'Font of Creation', description: 'At the start of your turn, you gain 3 essence.', type: 'automatic' },
          { id: 'summoner-7-life-for-mine', name: 'Their Life for Mine', description: 'You can sacrifice minions and essence to prevent death.', type: 'automatic' },
          skillChoiceFeature(heroClass, level),
        ];
      case 8:
        return [
          { id: 'summoner-8-perk', name: 'Perk', description: 'Gain one perk.', type: 'automatic' },
          { id: 'summoner-8-portfolio-champion', name: 'Portfolio Champion', description: 'You can add a champion to your portfolio.', type: 'automatic' },
        ];
      case 9:
        return [
          { id: 'summoner-9-kit-improvement', name: 'Kit Improvement', description: 'Your Summoner Strike potency improves and you choose one additional ward.', type: 'choice', category: 'ward', choices: SUMMONER_WARD_CHOICES },
          { id: 'summoner-9-steward', name: 'Steward of Two Worlds', description: 'Your equipment and regalia mark you as commander of your army.', type: 'automatic' },
          abilityChoiceFeature(heroClass, level, 11),
        ];
      case 10:
        return [
          { id: 'summoner-10-reason', name: 'Reason Increase', description: 'Your Reason score increases to 5.', type: 'automatic' },
          characteristicChoiceFeature(heroClass, level)!,
          { id: 'summoner-10-minion-improvement', name: 'Minion Improvement', description: 'Your minions improve and your encounter-opening summons scale with Victories.', type: 'automatic' },
          { id: 'summoner-10-eidos', name: 'Eidos', description: 'You gain the epic resource eidos when you finish a respite.', type: 'automatic' },
          { id: 'summoner-10-no-matter-cost', name: 'No Matter the Cost', description: 'Sacrificed minions reduce heroic ability or minion costs by the same amount.', type: 'automatic' },
          { id: 'summoner-10-among-ranks', name: 'Among Our Ranks', description: 'As a respite activity, summon a willing ally to join your party.', type: 'automatic' },
          { id: 'summoner-10-perk', name: 'Perk', description: 'Gain one intrigue, interpersonal, or supernatural perk.', type: 'automatic' },
          skillChoiceFeature(heroClass, level),
        ].filter((feature): feature is LevelUpFeatureView => Boolean(feature));
      default:
        return [];
    }
  }

  return [];
}

export function getLevelUpFeatures(character: CharacterInProgress, level: number): LevelUpFeatureView[] {
  if (!character.heroClass || level < 2 || level > 10) return [];

  const generated = generatedLevelUpFeatures(character, level);
  if (generated.length > 0) return generated;

  return masterClassFallbackFeatures(character.heroClass, level);
}

export function getLevelUpChoicesByCategory(
  character: CharacterInProgress,
  category: string
): LevelUpChoice[] {
  return Object.values(character.levelUpChoices ?? {})
    .flat()
    .filter((choice) => choice.category === category);
}

function resolveSkillChoiceName(choiceId: string): string {
  const direct = GameData.getSkill(choiceId);
  if (direct) return direct.name;

  const normalized = normalizeChoiceId(choiceId);
  const bySlug = GameData.getAllSkills().find((skill) => normalizeChoiceId(skill.name) === normalized);
  return bySlug?.name ?? choiceId;
}

function getAutomaticLevelUpSkillNames(character: CharacterInProgress): string[] {
  const names: string[] = [];
  if (character.heroClass === 'beastheart' && character.level >= 9) {
    names.push('Nature');
  }
  return names;
}

export function getLevelUpValidationErrors(
  character: CharacterInProgress,
  level: number
): string[] {
  if (!character.heroClass) return ['Class is required before level-up choices'];

  const features = getLevelUpFeatures(character, level);
  const choiceFeatures = features.filter(
    (feature) => feature.type === 'choice' && (feature.choices?.length ?? 0) > 0
  );
  const choices = character.levelUpChoices[level] ?? [];
  const errors: string[] = [];

  for (const feature of choiceFeatures) {
    const selected = choices.find((choice) => choice.featureId === feature.id);
    if (!selected) {
      errors.push(`Choose ${feature.name}`);
      continue;
    }

    if (!feature.choices?.some((option) => option.id === selected.choiceId)) {
      errors.push(`Choose a valid option for ${feature.name}`);
    }
  }

  return errors;
}

export function isLevelUpStepComplete(character: CharacterInProgress, level: number): boolean {
  if (!character.heroClass) return false;
  return getLevelUpValidationErrors(character, level).length === 0;
}

/**
 * Calculate number of additional language selections needed.
 *
 * @param character - The character in progress
 * @returns Number of language selections required
 */
export function getLanguageSelectionsNeeded(character: CharacterInProgress): number {
  let selections = 0;

  if (character.career) {
    const career = GameData.getCareer(character.career);
    if (career?.languages) {
      for (const langGrant of career.languages) {
        // Parse "1 Language" or "2 Languages"
        const match = langGrant.match(/^(\d+)\s+Languages?$/i);
        if (match && match[1]) {
          selections += parseInt(match[1], 10);
        }
      }
    }
  }

  return selections;
}

// ---------------------------------------------------------------------------
// Step Validation
// ---------------------------------------------------------------------------

/**
 * Wizard step IDs for the new breadcrumb-based wizard.
 */
export const WIZARD_STEP_IDS = {
  LEVEL: 'level',
  ANCESTRY: 'ancestry',
  CULTURE: 'culture',
  CAREER: 'career',
  CLASS: 'class',
  SUBCLASS: 'subclass',
  COMPLICATION: 'complication',
  CHARACTERISTICS: 'characteristics',
  KIT: 'kit',
  SKILLS: 'skills',
  LANGUAGES: 'languages',
  PERKS: 'perks',
  TITLES: 'titles',
  ABILITIES: 'abilities',
  PERSONAL: 'personal',
  REVIEW: 'review',
} as const;

/**
 * Base wizard steps (before level-up steps are added).
 */
export const BASE_WIZARD_STEPS: WizardStepDefinition[] = [
  { id: WIZARD_STEP_IDS.LEVEL, label: 'Level', required: true },
  { id: WIZARD_STEP_IDS.ANCESTRY, label: 'Ancestry', required: true },
  { id: WIZARD_STEP_IDS.CULTURE, label: 'Culture', required: true },
  { id: WIZARD_STEP_IDS.CAREER, label: 'Career', required: true },
  { id: WIZARD_STEP_IDS.CLASS, label: 'Class', required: true },
  { id: WIZARD_STEP_IDS.SUBCLASS, label: 'Subclass', required: true },
  { id: WIZARD_STEP_IDS.COMPLICATION, label: 'Complication', required: false },
  { id: WIZARD_STEP_IDS.CHARACTERISTICS, label: 'Characteristics', required: true },
  { id: WIZARD_STEP_IDS.KIT, label: 'Kit', required: true },
  { id: WIZARD_STEP_IDS.SKILLS, label: 'Skills', required: true },
  { id: WIZARD_STEP_IDS.LANGUAGES, label: 'Languages', required: true },
  { id: WIZARD_STEP_IDS.PERKS, label: 'Perks', required: true },
  { id: WIZARD_STEP_IDS.TITLES, label: 'Titles', required: false },
  { id: WIZARD_STEP_IDS.ABILITIES, label: 'Abilities', required: true },
  { id: WIZARD_STEP_IDS.PERSONAL, label: 'Personal', required: true },
];

/**
 * Generate wizard steps based on selected level.
 * For level > 1, adds level-up steps (L2, L3, ...) after the base steps.
 *
 * @param level - The character's level (1-10)
 * @returns Array of step definitions including level-up steps
 */
export function generateWizardSteps(level: number): WizardStepDefinition[] {
  const steps = [...BASE_WIZARD_STEPS];

  // Add level-up steps for levels 2 and above
  for (let lvl = 2; lvl <= level; lvl++) {
    steps.push({
      id: `level-${lvl}`,
      label: `L${lvl}`,
      required: true,
      levelUpLevel: lvl,
    });
  }

  // Always end with Review
  steps.push({ id: WIZARD_STEP_IDS.REVIEW, label: 'Review', required: false });

  return steps;
}

/**
 * Get the step status based on character state.
 *
 * @param character - The character in progress
 * @param stepId - The step ID to check
 * @returns Step status: 'complete', 'incomplete', or 'not-begun'
 */
export function getStepStatus(
  character: CharacterInProgress,
  stepId: string
): StepStatus {
  // Handle level-up steps
  if (stepId.startsWith('level-')) {
    const lvl = parseInt(stepId.replace('level-', ''), 10);
    if (character.heroClass) {
      return isLevelUpStepComplete(character, lvl) ? 'complete' : 'incomplete';
    }
    return 'not-begun';
  }

  switch (stepId) {
    case WIZARD_STEP_IDS.LEVEL:
      return character.level >= 1 ? 'complete' : 'incomplete';

    case WIZARD_STEP_IDS.ANCESTRY:
      if (character.ancestry) return 'complete';
      if (character.level >= 1) return 'incomplete';
      return 'not-begun';

    case WIZARD_STEP_IDS.CULTURE:
      if (
        character.culture.environment &&
        character.culture.organization &&
        character.culture.upbringing
      ) {
        return 'complete';
      }
      if (character.ancestry) return 'incomplete';
      return 'not-begun';

    case WIZARD_STEP_IDS.CAREER:
      if (character.career) return 'complete';
      if (character.culture.environment) return 'incomplete';
      return 'not-begun';

    case WIZARD_STEP_IDS.CLASS:
      if (character.heroClass) return 'complete';
      if (character.career) return 'incomplete';
      return 'not-begun';

    case WIZARD_STEP_IDS.SUBCLASS:
      if (character.subclass) {
        if (character.heroClass) {
          const selectCount = GameData.getSubclassSelectCount(character.heroClass);
          const selectedCount = Array.isArray(character.subclass)
            ? character.subclass.length
            : 1;
          if (selectedCount >= selectCount && (!isCompanionRequired(character) || character.companion)) {
            return 'complete';
          }
        }
        return 'incomplete';
      }
      if (character.heroClass) return 'incomplete';
      return 'not-begun';

    case WIZARD_STEP_IDS.COMPLICATION:
      // Optional step - complete if visited or has content
      if (character.complication) return 'complete';
      if (character.subclass) return 'incomplete';
      return 'not-begun';

    case WIZARD_STEP_IDS.CHARACTERISTICS:
      if (character.characteristics) {
        if (isValidStartingCharacteristics(character.characteristics, character.heroClass)) return 'complete';
        return 'incomplete';
      }
      if (character.subclass) return 'incomplete';
      return 'not-begun';

    case WIZARD_STEP_IDS.KIT:
      if (getSelectedKitIds(character).length >= getKitSelectionsNeeded(character)) return 'complete';
      if (character.characteristics) return 'incomplete';
      return 'not-begun';

    case WIZARD_STEP_IDS.SKILLS:
      const skillsNeeded = getSkillSelectionsNeeded(character);
      if (getSkillSelectionsMade(character) >= skillsNeeded) return 'complete';
      if (character.kit) return 'incomplete';
      return 'not-begun';

    case WIZARD_STEP_IDS.LANGUAGES:
      const langsNeeded = getLanguageSelectionsNeeded(character);
      if (character.selectedLanguages.length >= langsNeeded) return 'complete';
      if (character.selectedSkills.length > 0) return 'incomplete';
      return 'not-begun';

    case WIZARD_STEP_IDS.PERKS:
      const perkSlots = getPerkChoiceSlots(character);
      if (perkSlots.length === 0 || perkSlots.every((slot) => !!slot.selectedPerkId)) return 'complete';
      if (character.career) return 'incomplete';
      return 'not-begun';

    case WIZARD_STEP_IDS.TITLES:
      // Optional step
      if (character.selectedTitles.length > 0) return 'complete';
      if (character.selectedLanguages.length > 0) return 'incomplete';
      return 'not-begun';

    case WIZARD_STEP_IDS.ABILITIES:
      if (hasCompleteAbilitySelections(character)) return 'complete';
      const abilityPrereqPerkSlots = getPerkChoiceSlots(character);
      if (
        abilityPrereqPerkSlots.length > 0 &&
        abilityPrereqPerkSlots.every((slot) => !!slot.selectedPerkId)
      ) {
        return 'incomplete';
      }
      return 'not-begun';

    case WIZARD_STEP_IDS.PERSONAL:
      if (character.name.trim()) return 'complete';
      if (hasCompleteAbilitySelections(character)) return 'incomplete';
      return 'not-begun';

    case WIZARD_STEP_IDS.REVIEW:
      // Review is complete if character is complete
      return isCharacterComplete(character) ? 'complete' : 'incomplete';

    default:
      return 'not-begun';
  }
}

/**
 * Legacy wizard step numbers for reference.
 * @deprecated Use WIZARD_STEP_IDS and generateWizardSteps for the new wizard.
 */
export const WIZARD_STEPS = {
  ANCESTRY: 1,
  CULTURE: 2,
  CAREER: 3,
  CLASS: 4,
  SUBCLASS: 5,
  COMPLICATIONS: 6,
  CHARACTERISTICS: 7,
  KIT: 8,
  SKILLS: 9,
  LANGUAGES: 10,
  PERKS: 11,
  TITLES: 12,
  ABILITIES: 13,
  PERSONAL: 14,
  REVIEW: 15,
} as const;

/**
 * Validate a specific wizard step.
 *
 * @param character - The character in progress
 * @param step - The step number to validate
 * @returns Validation result
 */
export function validateStep(
  character: CharacterInProgress,
  step: number
): StepValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  switch (step) {
    case WIZARD_STEPS.ANCESTRY:
      if (!character.ancestry) {
        errors.push('Ancestry is required');
      }
      break;

    case WIZARD_STEPS.CULTURE:
      if (!character.culture.environment) {
        errors.push('Environment is required');
      }
      if (!character.culture.organization) {
        errors.push('Organization is required');
      }
      if (!character.culture.upbringing) {
        errors.push('Upbringing is required');
      }
      break;

    case WIZARD_STEPS.CAREER:
      if (!character.career) {
        errors.push('Career is required');
      }
      break;

    case WIZARD_STEPS.CLASS:
      if (!character.heroClass) {
        errors.push('Class is required');
      }
      break;

    case WIZARD_STEPS.SUBCLASS:
      if (!character.subclass) {
        errors.push('Subclass is required');
      } else if (character.heroClass) {
        const selectCount = GameData.getSubclassSelectCount(character.heroClass);
        const selectedCount = Array.isArray(character.subclass)
          ? character.subclass.length
          : 1;
        if (selectedCount < selectCount) {
          errors.push(`Select ${selectCount} subclass(es)`);
        }
        if (isCompanionRequired(character) && !character.companion) {
          errors.push('Companion is required');
        }
      }
      break;

    case WIZARD_STEPS.CHARACTERISTICS:
      if (!character.characteristics) {
        errors.push('Characteristics are required');
      } else if (!character.heroClass) {
        errors.push('Class is required before assigning characteristics');
      } else if (!isValidStartingCharacteristics(character.characteristics, character.heroClass)) {
        errors.push('Characteristics must match the selected class fixed stats and remaining-stat array');
      }
      break;

    case WIZARD_STEPS.KIT:
      const kitsNeeded = getKitSelectionsNeeded(character);
      const kitsSelected = getSelectedKitIds(character).length;
      if (kitsSelected < kitsNeeded) {
        errors.push(kitsNeeded === 1 ? 'Kit is required' : `Select ${kitsNeeded} kits (have ${kitsSelected})`);
      }
      break;

    case WIZARD_STEPS.SKILLS:
      const skillsNeeded = getSkillSelectionsNeeded(character);
      const skillsMade = getSkillSelectionsMade(character);
      if (skillsMade < skillsNeeded) {
        errors.push(`Select ${skillsNeeded} skills (have ${skillsMade})`);
      }
      break;

    case WIZARD_STEPS.LANGUAGES:
      const langsNeeded = getLanguageSelectionsNeeded(character);
      if (character.selectedLanguages.length < langsNeeded) {
        errors.push(`Select ${langsNeeded} languages (have ${character.selectedLanguages.length})`);
      }
      break;

    case WIZARD_STEPS.PERKS:
      const perkSlots = getPerkChoiceSlots(character);
      const completedPerkSlots = perkSlots.filter((slot) => !!slot.selectedPerkId).length;
      if (completedPerkSlots < perkSlots.length) {
        errors.push(`Select ${perkSlots.length} perks (have ${completedPerkSlots})`);
      }
      break;

    case WIZARD_STEPS.ABILITIES:
      if (!character.heroClass) {
        errors.push('Class is required before abilities');
      } else if (!hasCompleteAbilitySelections(character)) {
        const abilitySlots = getAbilityChoiceSlots(character);
        const completeSlots = abilitySlots.filter((slot) => !!getSelectedChoiceIdForSlot(character, slot)).length;
        errors.push(`Select ${abilitySlots.length} ability choices (have ${completeSlots})`);
      }
      break;

    case WIZARD_STEPS.PERSONAL:
      if (!character.name.trim()) {
        errors.push('Name is required');
      }
      break;

    // Optional steps don't fail validation
    case WIZARD_STEPS.COMPLICATIONS:
    case WIZARD_STEPS.TITLES:
    case WIZARD_STEPS.REVIEW:
      // These steps are optional or just review
      break;
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Check if a step is complete (valid).
 *
 * @param character - The character in progress
 * @param step - The step number
 * @returns True if step is complete
 */
export function isStepComplete(character: CharacterInProgress, step: number): boolean {
  return validateStep(character, step).valid;
}

/**
 * Check if all required steps are complete.
 *
 * @param character - The character in progress
 * @returns True if character is ready to be created
 */
export function isCharacterComplete(character: CharacterInProgress): boolean {
  const requiredSteps = [
    WIZARD_STEPS.ANCESTRY,
    WIZARD_STEPS.CULTURE,
    WIZARD_STEPS.CAREER,
    WIZARD_STEPS.CLASS,
    WIZARD_STEPS.SUBCLASS,
    WIZARD_STEPS.CHARACTERISTICS,
    WIZARD_STEPS.KIT,
    WIZARD_STEPS.SKILLS,
    WIZARD_STEPS.LANGUAGES,
    WIZARD_STEPS.PERKS,
    WIZARD_STEPS.ABILITIES,
    WIZARD_STEPS.PERSONAL,
  ];

  if (!requiredSteps.every((step) => isStepComplete(character, step))) {
    return false;
  }

  for (let level = 2; level <= character.level; level += 1) {
    if (!isLevelUpStepComplete(character, level)) {
      return false;
    }
  }

  return true;
}

/**
 * Get the first incomplete required step.
 *
 * @param character - The character in progress
 * @returns Step number of first incomplete step, or null if all complete
 */
export function getFirstIncompleteStep(character: CharacterInProgress): number | null {
  const requiredSteps = [
    WIZARD_STEPS.ANCESTRY,
    WIZARD_STEPS.CULTURE,
    WIZARD_STEPS.CAREER,
    WIZARD_STEPS.CLASS,
    WIZARD_STEPS.SUBCLASS,
    WIZARD_STEPS.CHARACTERISTICS,
    WIZARD_STEPS.KIT,
    WIZARD_STEPS.SKILLS,
    WIZARD_STEPS.LANGUAGES,
    WIZARD_STEPS.PERKS,
    WIZARD_STEPS.ABILITIES,
    WIZARD_STEPS.PERSONAL,
  ];

  for (const step of requiredSteps) {
    if (!isStepComplete(character, step)) {
      return step;
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Character Factory
// ---------------------------------------------------------------------------

/**
 * Create a new empty CharacterInProgress.
 *
 * @returns Fresh character in progress
 */
export function createEmptyCharacter(): CharacterInProgress {
  return {
    level: 1,
    ancestry: null,
    ancestryTraits: [],
    culture: {
      environment: null,
      organization: null,
      upbringing: null,
      preset: null,
      language: null,
    },
    career: null,
    incitingIncident: null,
    heroClass: null,
    subclass: null,
    complication: null,
    characteristics: null,
    kit: null,
    secondaryKit: null,
    selectedSkills: [],
    cultureSkills: {},
    careerSkillChoices: [],
    classSkillChoices: [],
    selectedLanguages: [],
    selectedPerks: [],
    careerPerk: null,
    selectedTitles: [],
    selectedAbilities: [],
    abilityChoices: {},
    summonerMinionChoices: {},
    companion: null,
    name: '',
    pronouns: '',
    backstory: '',
    appearance: '',
    portraitUrl: null,
    levelUpChoices: {},
  };
}

/**
 * Create default characteristics (all zeros).
 *
 * @returns Default characteristics
 */
export function createDefaultCharacteristics(): HeroLogic.Characteristics {
  return {
    might: 0,
    agility: 0,
    reason: 0,
    intuition: 0,
    presence: 0,
  };
}

// ---------------------------------------------------------------------------
// Progress Calculation
// ---------------------------------------------------------------------------

/**
 * Calculate wizard progress percentage.
 *
 * @param character - The character in progress
 * @returns Progress percentage (0-100)
 */
export function getWizardProgress(character: CharacterInProgress): number {
  const requiredSteps = [
    WIZARD_STEPS.ANCESTRY,
    WIZARD_STEPS.CULTURE,
    WIZARD_STEPS.CAREER,
    WIZARD_STEPS.CLASS,
    WIZARD_STEPS.SUBCLASS,
    WIZARD_STEPS.CHARACTERISTICS,
    WIZARD_STEPS.KIT,
    WIZARD_STEPS.SKILLS,
    WIZARD_STEPS.LANGUAGES,
    WIZARD_STEPS.PERKS,
    WIZARD_STEPS.ABILITIES,
    WIZARD_STEPS.PERSONAL,
  ];

  const completedCount = requiredSteps.filter((step) =>
    isStepComplete(character, step)
  ).length;

  return Math.round((completedCount / requiredSteps.length) * 100);
}
