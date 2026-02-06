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
  | 'ferocity'   // Fury
  | 'piety'      // Conduit
  | 'focus'      // Tactician
  | 'insight'    // Shadow
  | 'discipline' // Null
  | 'wrath'      // Censor
  | 'clarity'    // Talent
  | 'drama'      // Troubadour
  | 'essence'    // Elementalist, Summoner
  | 'rage'       // Beastheart
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
  null: { level1: 18, perLevel: 9, recoveries: 8 },
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
  beastheart: 'rage',
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
  beastheart: ['might', 'agility'],
  censor: ['intuition', 'presence'],
  conduit: ['intuition'],
  elementalist: ['reason'],
  fury: ['might', 'agility'],
  null: ['reason', 'intuition', 'presence'],
  shadow: ['agility'],
  summoner: ['presence'],
  tactician: ['reason', 'presence'],
  talent: ['presence'],
  troubadour: ['presence'],
};

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
