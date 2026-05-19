/**
 * Hero Logic
 *
 * Pure functions for hero stat calculations.
 * Works with both complete Hero objects and partial CharacterInProgress wizard state.
 *
 * Reference: rules-md/Classes/ (individual class files)
 */

import { GameData } from '../game-data/index.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Hero class identifiers (Draw Steel classes).
 */
export type HeroClass =
  | 'beastheart'
  | 'censor'
  | 'conduit'
  | 'elementalist'
  | 'fury'
  | 'null'
  | 'shadow'
  | 'summoner'
  | 'tactician'
  | 'talent'
  | 'troubadour';

/**
 * Echelon (tier of play) based on level.
 */
export type Echelon = 1 | 2 | 3 | 4;

/**
 * Heroic resource types by class.
 */
export type HeroicResourceType =
  | 'ferocity'   // Beastheart, Fury
  | 'piety'      // Conduit
  | 'focus'      // Tactician
  | 'insight'    // Shadow
  | 'discipline' // Null
  | 'wrath'      // Censor
  | 'clarity'    // Talent
  | 'drama'      // Troubadour
  | 'essence'    // Elementalist, Summoner
  | 'rage'       // Legacy fallback
  | 'heroic';    // Generic fallback

/**
 * Health status based on stamina.
 */
export type HealthStatus = 'healthy' | 'injured' | 'winded' | 'dying' | 'dead';

/**
 * Characteristics (the 5 attributes).
 */
export interface Characteristics {
  might: number;
  agility: number;
  reason: number;
  intuition: number;
  presence: number;
}

export type CharacteristicName = keyof Characteristics;

export interface LevelAdvancementChoice {
  featureId: string;
  choiceId: string;
  category?: string;
}

export type LevelAdvancementChoices = Record<number, LevelAdvancementChoice[]>;

// ---------------------------------------------------------------------------
// Class Configuration (stamina base values)
// ---------------------------------------------------------------------------

/**
 * Class stamina and recovery configuration.
 * Source of truth for class-based stat calculations.
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
 * Heroic resource type by class.
 */
const CLASS_HEROIC_RESOURCE: Record<HeroClass, HeroicResourceType> = {
  beastheart: 'ferocity',
  censor: 'wrath',
  conduit: 'piety',
  elementalist: 'essence',
  fury: 'ferocity',
  null: 'discipline',
  shadow: 'insight',
  summoner: 'essence',
  tactician: 'focus',
  talent: 'clarity',
  troubadour: 'drama',
};

/**
 * Potency characteristic by class.
 */
const CLASS_POTENCY_CHARACTERISTICS: Record<HeroClass, CharacteristicName[]> = {
  beastheart: ['might', 'intuition'],
  censor: ['presence', 'might'],
  conduit: ['intuition'],
  elementalist: ['reason'],
  fury: ['might', 'agility'],
  null: ['intuition', 'agility'],
  shadow: ['agility'],
  summoner: ['reason'],
  tactician: ['reason', 'might'],
  talent: ['reason', 'presence'],
  troubadour: ['presence', 'agility'],
};

const CHARACTERISTIC_NAMES: CharacteristicName[] = [
  'might',
  'agility',
  'reason',
  'intuition',
  'presence',
];

const XP_PER_LEVEL = 16;
const MAX_HERO_LEVEL = 10;

// ---------------------------------------------------------------------------
// Level & Echelon
// ---------------------------------------------------------------------------

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
export function getEchelon(level: number): Echelon {
  if (typeof level !== 'number' || level < 1 || level > 10) {
    throw new Error(`HeroLogic.getEchelon: level must be 1-10, got ${level}`);
  }

  if (level <= 3) return 1;
  if (level <= 6) return 2;
  if (level <= 9) return 3;
  return 4;
}

/**
 * Get the minimum level for an echelon.
 *
 * @param echelon - The echelon (1-4)
 * @returns Minimum level for that echelon
 */
export function getEchelonMinLevel(echelon: Echelon): number {
  switch (echelon) {
    case 1:
      return 1;
    case 2:
      return 4;
    case 3:
      return 7;
    case 4:
      return 10;
  }
}

/**
 * Get the minimum XP required to be a specific level.
 *
 * Draw Steel advancement uses 16 XP bands:
 * - Level 1: 0 XP
 * - Level 2: 16 XP
 * - ...
 * - Level 10: 144 XP
 */
export function getMinXPForLevel(level: number): number {
  if (typeof level !== 'number' || level < 1 || level > MAX_HERO_LEVEL || !Number.isInteger(level)) {
    throw new Error(`HeroLogic.getMinXPForLevel: level must be 1-10, got ${level}`);
  }

  return (level - 1) * XP_PER_LEVEL;
}

/**
 * Get the total XP threshold for the next level, or null at level 10.
 */
export function getMinXPForNextLevel(currentLevel: number): number | null {
  if (typeof currentLevel !== 'number' || currentLevel < 1 || currentLevel > MAX_HERO_LEVEL || !Number.isInteger(currentLevel)) {
    throw new Error(`HeroLogic.getMinXPForNextLevel: level must be 1-10, got ${currentLevel}`);
  }

  if (currentLevel >= MAX_HERO_LEVEL) return null;
  return getMinXPForLevel(currentLevel + 1);
}

/**
 * Get remaining XP needed to advance one level.
 */
export function getXPNeededForNextLevel(currentLevel: number, currentXP: number): number | null {
  const nextThreshold = getMinXPForNextLevel(currentLevel);
  if (nextThreshold === null) return null;
  return Math.max(0, nextThreshold - currentXP);
}

/**
 * Determine the highest level unlocked by a total XP value.
 */
export function getLevelForXP(xp: number): number {
  const totalXP = Math.max(0, Math.floor(Number.isFinite(xp) ? xp : 0));
  return Math.min(MAX_HERO_LEVEL, Math.floor(totalXP / XP_PER_LEVEL) + 1);
}

/**
 * Check whether a hero can advance one level with their current XP.
 */
export function canAdvanceLevel(currentLevel: number, currentXP: number): boolean {
  const nextThreshold = getMinXPForNextLevel(currentLevel);
  return nextThreshold !== null && currentXP >= nextThreshold;
}

// ---------------------------------------------------------------------------
// Stamina Calculations
// ---------------------------------------------------------------------------

/**
 * Get base stamina for a class at level 1.
 *
 * @param heroClass - The hero's class
 * @returns Base stamina at level 1
 */
export function getBaseStamina(heroClass: HeroClass): number {
  const config = CLASS_STAMINA_CONFIG[heroClass];
  if (!config) {
    throw new Error(`HeroLogic.getBaseStamina: unknown class '${heroClass}'`);
  }
  return config.level1;
}

/**
 * Get stamina gained per level for a class.
 *
 * @param heroClass - The hero's class
 * @returns Stamina gained per level
 */
export function getStaminaPerLevel(heroClass: HeroClass): number {
  const config = CLASS_STAMINA_CONFIG[heroClass];
  if (!config) {
    throw new Error(`HeroLogic.getStaminaPerLevel: unknown class '${heroClass}'`);
  }
  return config.perLevel;
}

/**
 * Calculate maximum stamina for a hero at a given level.
 * Does NOT include kit bonuses - use getMaxStaminaWithKit for that.
 *
 * Formula: level1Stamina + (perLevelStamina × (level - 1))
 *
 * @param heroClass - The hero's class
 * @param level - Character level (1-10)
 * @returns Maximum stamina from class only
 */
export function getMaxStaminaForClass(heroClass: HeroClass, level: number): number {
  if (typeof level !== 'number' || level < 1 || level > 10) {
    throw new Error(`HeroLogic.getMaxStaminaForClass: level must be 1-10, got ${level}`);
  }

  const config = CLASS_STAMINA_CONFIG[heroClass];
  if (!config) {
    throw new Error(`HeroLogic.getMaxStaminaForClass: unknown class '${heroClass}'`);
  }

  return config.level1 + config.perLevel * (level - 1);
}

/**
 * Calculate maximum stamina including kit bonus.
 *
 * @param heroClass - The hero's class
 * @param level - Character level (1-10)
 * @param kitStaminaPerEchelon - Kit stamina bonus per echelon (0 if no kit)
 * @returns Maximum stamina including kit bonus
 */
export function getMaxStaminaWithKit(
  heroClass: HeroClass,
  level: number,
  kitStaminaPerEchelon: number
): number {
  const baseStamina = getMaxStaminaForClass(heroClass, level);
  const echelon = getEchelon(level);
  const kitBonus = kitStaminaPerEchelon * echelon;
  return baseStamina + kitBonus;
}

function hasLevelUpChoice(
  levelUpChoices: LevelAdvancementChoices | null | undefined,
  category: string,
  choiceId: string
): boolean {
  return Object.values(levelUpChoices ?? {})
    .flat()
    .some((choice) => {
      if (choice.category !== category) return false;
      if (choice.choiceId === choiceId) return true;
      return choiceId === 'conjured-ward' && (
        choice.choiceId === 'summoner-3-2a' ||
        choice.choiceId.includes('conjured-ward')
      );
    });
}

/**
 * Calculate Stamina bonuses granted by level-up choices.
 */
export function getLevelAdvancementStaminaBonus(
  heroClass: HeroClass,
  level: number,
  levelUpChoices?: LevelAdvancementChoices | null
): number {
  if (heroClass === 'summoner' && hasLevelUpChoice(levelUpChoices, 'ward', 'conjured-ward')) {
    return 3 * getEchelon(level);
  }

  return 0;
}

/**
 * Calculate maximum stamina including kit and level-up choice bonuses.
 */
export function getMaxStaminaWithAdvancements(
  heroClass: HeroClass,
  level: number,
  kitStaminaPerEchelon: number,
  levelUpChoices?: LevelAdvancementChoices | null
): number {
  return (
    getMaxStaminaWithKit(heroClass, level, kitStaminaPerEchelon) +
    getLevelAdvancementStaminaBonus(heroClass, level, levelUpChoices)
  );
}

/**
 * Get winded threshold (half of max stamina, rounded down).
 *
 * @param maxStamina - Maximum stamina
 * @returns Winded threshold
 */
export function getWindedThreshold(maxStamina: number): number {
  if (typeof maxStamina !== 'number' || maxStamina <= 0) {
    throw new Error(`HeroLogic.getWindedThreshold: maxStamina must be positive, got ${maxStamina}`);
  }
  return Math.floor(maxStamina / 2);
}

/**
 * Get death threshold (negative of winded threshold).
 * When stamina drops to or below this, the creature dies.
 *
 * @param maxStamina - Maximum stamina
 * @returns Death threshold (negative number)
 */
export function getDeathThreshold(maxStamina: number): number {
  return -getWindedThreshold(maxStamina);
}

// ---------------------------------------------------------------------------
// Recovery Calculations
// ---------------------------------------------------------------------------

/**
 * Get base recoveries for a class.
 *
 * @param heroClass - The hero's class
 * @returns Maximum recoveries
 */
export function getMaxRecoveries(heroClass: HeroClass): number {
  const config = CLASS_STAMINA_CONFIG[heroClass];
  if (!config) {
    throw new Error(`HeroLogic.getMaxRecoveries: unknown class '${heroClass}'`);
  }
  return config.recoveries;
}

/**
 * Calculate recovery value (stamina regained when spending a recovery).
 * Recovery value = max stamina ÷ 3 (rounded down)
 *
 * @param maxStamina - Maximum stamina
 * @returns Recovery value
 */
export function getRecoveryValue(maxStamina: number): number {
  if (typeof maxStamina !== 'number' || maxStamina <= 0) {
    throw new Error(`HeroLogic.getRecoveryValue: maxStamina must be positive, got ${maxStamina}`);
  }
  return Math.floor(maxStamina / 3);
}

// ---------------------------------------------------------------------------
// Health Status
// ---------------------------------------------------------------------------

/**
 * Determine health status based on current and max stamina.
 *
 * @param currentStamina - Current stamina
 * @param maxStamina - Maximum stamina
 * @returns Health status
 */
export function getHealthStatus(currentStamina: number, maxStamina: number): HealthStatus {
  const windedThreshold = getWindedThreshold(maxStamina);
  const deathThreshold = getDeathThreshold(maxStamina);

  if (currentStamina <= deathThreshold) return 'dead';
  if (currentStamina <= 0) return 'dying';
  if (currentStamina <= windedThreshold) return 'winded';
  if (currentStamina < maxStamina) return 'injured';
  return 'healthy';
}

/**
 * Check if a creature is winded (at or below half stamina).
 *
 * @param currentStamina - Current stamina
 * @param maxStamina - Maximum stamina
 * @returns True if winded
 */
export function isWinded(currentStamina: number, maxStamina: number): boolean {
  const status = getHealthStatus(currentStamina, maxStamina);
  return status === 'winded' || status === 'dying';
}

/**
 * Check if a creature is dying (at 0 or below stamina, but not dead).
 *
 * @param currentStamina - Current stamina
 * @param maxStamina - Maximum stamina
 * @returns True if dying
 */
export function isDying(currentStamina: number, maxStamina: number): boolean {
  return getHealthStatus(currentStamina, maxStamina) === 'dying';
}

/**
 * Check if a creature is dead.
 *
 * @param currentStamina - Current stamina
 * @param maxStamina - Maximum stamina
 * @returns True if dead
 */
export function isDead(currentStamina: number, maxStamina: number): boolean {
  return getHealthStatus(currentStamina, maxStamina) === 'dead';
}

// ---------------------------------------------------------------------------
// Heroic Resource
// ---------------------------------------------------------------------------

/**
 * Get the heroic resource type for a class.
 *
 * @param heroClass - The hero's class
 * @returns Heroic resource type
 */
export function getHeroicResourceType(heroClass: HeroClass): HeroicResourceType {
  return CLASS_HEROIC_RESOURCE[heroClass] ?? 'heroic';
}

/**
 * Get the display name for a heroic resource type.
 *
 * @param resourceType - The heroic resource type
 * @returns Human-readable name
 */
export function getHeroicResourceName(resourceType: HeroicResourceType): string {
  const names: Record<HeroicResourceType, string> = {
    ferocity: 'Ferocity',
    piety: 'Piety',
    focus: 'Focus',
    insight: 'Insight',
    discipline: 'Discipline',
    wrath: 'Wrath',
    clarity: 'Clarity',
    drama: 'Drama',
    essence: 'Essence',
    rage: 'Rage',
    heroic: 'Heroic Resource',
  };
  return names[resourceType];
}

/**
 * Get starting heroic resource for a class.
 * Most classes start with 0, but rules may vary.
 *
 * @param heroClass - The hero's class
 * @returns Starting heroic resource amount
 */
export function getStartingHeroicResource(heroClass: HeroClass): number {
  // Most classes start with 0 at the beginning of combat
  // Specific classes may have different rules
  return 0;
}

/**
 * Get heroic resource gained per round.
 * Most classes gain 1d3 at the start of each round.
 *
 * @param heroClass - The hero's class
 * @returns Dice expression for resource gain (e.g., "1d3")
 */
export function getHeroicResourceGainExpression(heroClass: HeroClass): string {
  // Most classes gain 1d3 at the start of each round
  // Some classes have different mechanics
  return '1d3';
}

// ---------------------------------------------------------------------------
// Potency
// ---------------------------------------------------------------------------

/**
 * Get the potency characteristic for a class.
 *
 * @param heroClass - The hero's class
 * @returns The characteristic used for potency calculations
 */
export function getPotencyCharacteristics(heroClass: HeroClass): CharacteristicName[] {
  return CLASS_POTENCY_CHARACTERISTICS[heroClass] ?? ['might'];
}

/**
 * Get the primary potency characteristic for a class (first in list).
 *
 * @param heroClass - The hero's class
 * @returns The primary characteristic used for potency calculations
 */
export function getPotencyCharacteristic(heroClass: HeroClass): CharacteristicName {
  return CLASS_POTENCY_CHARACTERISTICS[heroClass]?.[0] ?? 'might';
}

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
 */
export function getPotency(
  characteristicValue: number,
  potencyLevel: 'weak' | 'average' | 'strong'
): number {
  if (typeof characteristicValue !== 'number') {
    throw new Error(`HeroLogic.getPotency: characteristicValue must be a number`);
  }

  const modifiers = { weak: -2, average: -1, strong: 0 };
  return characteristicValue + modifiers[potencyLevel];
}

/**
 * Get all potency values for a hero based on their potency characteristic.
 *
 * @param heroClass - The hero's class
 * @param characteristics - The hero's characteristics
 * @returns Object with weak, average, and strong potency values
 */
export function getPotencyValues(
  heroClass: HeroClass,
  characteristics: Characteristics
): { weak: number; average: number; strong: number } {
  const potencyChar = getPotencyCharacteristic(heroClass);
  const charValue = characteristics[potencyChar];

  return {
    weak: getPotency(charValue, 'weak'),
    average: getPotency(charValue, 'average'),
    strong: getPotency(charValue, 'strong'),
  };
}

// ---------------------------------------------------------------------------
// Characteristic Helpers
// ---------------------------------------------------------------------------

/**
 * Get a characteristic value from a characteristics object.
 *
 * @param characteristics - The characteristics object
 * @param name - The characteristic name
 * @returns The characteristic value
 */
export function getCharacteristic(
  characteristics: Characteristics,
  name: CharacteristicName
): number {
  return characteristics[name];
}

/**
 * Get the highest characteristic value and name.
 *
 * @param characteristics - The characteristics object
 * @returns Object with name and value of highest characteristic
 */
export function getHighestCharacteristic(
  characteristics: Characteristics
): { name: CharacteristicName; value: number } {
  const names: CharacteristicName[] = ['might', 'agility', 'reason', 'intuition', 'presence'];
  let highest: CharacteristicName = 'might';
  let highestValue = characteristics.might;

  for (const name of names) {
    if (characteristics[name] > highestValue) {
      highest = name;
      highestValue = characteristics[name];
    }
  }

  return { name: highest, value: highestValue };
}

/**
 * Get the total of all characteristics.
 *
 * @param characteristics - The characteristics object
 * @returns Sum of all characteristics
 */
export function getTotalCharacteristics(characteristics: Characteristics): number {
  return (
    characteristics.might +
    characteristics.agility +
    characteristics.reason +
    characteristics.intuition +
    characteristics.presence
  );
}

/**
 * Get the characteristic scores that increase automatically at levels 4 and 10.
 */
export function getAdvancementFixedCharacteristics(heroClass: HeroClass): CharacteristicName[] {
  return [...CLASS_POTENCY_CHARACTERISTICS[heroClass]];
}

function normalizeCharacteristics(characteristics: Partial<Characteristics>): Characteristics {
  return {
    might: typeof characteristics.might === 'number' ? characteristics.might : 0,
    agility: typeof characteristics.agility === 'number' ? characteristics.agility : 0,
    reason: typeof characteristics.reason === 'number' ? characteristics.reason : 0,
    intuition: typeof characteristics.intuition === 'number' ? characteristics.intuition : 0,
    presence: typeof characteristics.presence === 'number' ? characteristics.presence : 0,
  };
}

function setCharacteristicMinimum(
  characteristics: Characteristics,
  name: CharacteristicName,
  minimum: number
): void {
  characteristics[name] = Math.max(characteristics[name], minimum);
}

function increaseCharacteristic(
  characteristics: Characteristics,
  name: CharacteristicName,
  maximum: number
): void {
  characteristics[name] = Math.min(maximum, characteristics[name] + 1);
}

function characteristicChoiceId(choiceId: string): CharacteristicName | null {
  const id = choiceId.includes(':') ? choiceId.split(':').pop() ?? choiceId : choiceId;
  const normalized = id.toLowerCase().replace(/[^a-z]+/g, '');
  return isValidCharacteristic(normalized) ? normalized : null;
}

function getCharacteristicLevelChoices(
  levelUpChoices: LevelAdvancementChoices | null | undefined,
  level: number
): CharacteristicName[] {
  return (levelUpChoices?.[level] ?? [])
    .filter((choice) => choice.category === 'characteristic')
    .map((choice) => characteristicChoiceId(choice.choiceId))
    .filter((choice): choice is CharacteristicName => choice !== null);
}

/**
 * Apply level-based characteristic advancement to stored starting characteristics.
 *
 * Stored heroes keep their original creation characteristics. This helper derives the
 * live character-sheet values by applying the fixed class increases and the one-stat
 * choices made at levels 4 and 10.
 */
export function applyLevelAdvancementCharacteristics(
  heroClass: HeroClass,
  level: number,
  baseCharacteristics: Partial<Characteristics>,
  levelUpChoices?: LevelAdvancementChoices | null
): Characteristics {
  if (typeof level !== 'number' || level < 1 || level > 10) {
    throw new Error(`HeroLogic.applyLevelAdvancementCharacteristics: level must be 1-10, got ${level}`);
  }

  const characteristics = normalizeCharacteristics(baseCharacteristics);
  const fixed = getAdvancementFixedCharacteristics(heroClass);
  const fixedSet = new Set<CharacteristicName>(fixed);

  if (level >= 4) {
    for (const name of fixed) {
      setCharacteristicMinimum(characteristics, name, 3);
    }

    if (fixed.length === 1) {
      for (const choice of getCharacteristicLevelChoices(levelUpChoices, 4)) {
        if (!fixedSet.has(choice)) {
          increaseCharacteristic(characteristics, choice, 3);
        }
      }
    }
  }

  if (level >= 7) {
    for (const name of CHARACTERISTIC_NAMES) {
      increaseCharacteristic(characteristics, name, 4);
    }
  }

  if (level >= 10) {
    for (const name of fixed) {
      setCharacteristicMinimum(characteristics, name, 5);
    }

    if (fixed.length === 1) {
      for (const choice of getCharacteristicLevelChoices(levelUpChoices, 10)) {
        if (!fixedSet.has(choice)) {
          increaseCharacteristic(characteristics, choice, 5);
        }
      }
    }
  }

  return characteristics;
}

// ---------------------------------------------------------------------------
// Speed & Movement
// ---------------------------------------------------------------------------

/**
 * Get base speed for an ancestry.
 *
 * @param ancestryId - The ancestry ID
 * @returns Base speed (default 5 if ancestry not found)
 */
export function getBaseSpeed(ancestryId: string): number {
  const ancestry = GameData.getAncestry(ancestryId);
  return ancestry?.speed ?? 5;
}

/**
 * Get size for an ancestry.
 *
 * @param ancestryId - The ancestry ID
 * @returns Size (default '1M' if ancestry not found)
 */
export function getSize(ancestryId: string): string {
  const ancestry = GameData.getAncestry(ancestryId);
  return ancestry?.size ?? '1M';
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Check if a string is a valid hero class.
 *
 * @param value - The value to check
 * @returns True if valid hero class
 */
export function isValidHeroClass(value: string): value is HeroClass {
  return Object.keys(CLASS_STAMINA_CONFIG).includes(value);
}

/**
 * Check if a string is a valid characteristic name.
 *
 * @param value - The value to check
 * @returns True if valid characteristic name
 */
export function isValidCharacteristic(value: string): value is CharacteristicName {
  return ['might', 'agility', 'reason', 'intuition', 'presence'].includes(value);
}
