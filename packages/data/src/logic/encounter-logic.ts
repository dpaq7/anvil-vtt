/**
 * Encounter Logic
 *
 * Pure functions for encounter building calculations.
 * Handles EV budget, difficulty rating, and creature selection.
 *
 * Reference: Draw Steel Encounter Building rules
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Scene difficulty levels.
 */
export type SceneDifficulty = 'easy' | 'moderate' | 'hard';

/**
 * EV budget result.
 */
export interface EVBudgetResult {
  min: number;
  max: number;
  target: number;
  evPerHero: number;
  effectiveHeroes: number;
}

/**
 * Creature entry for EV calculation.
 */
export interface CreatureEVEntry {
  ev: number;
  count: number;
}

/**
 * Parsed EV value.
 */
export interface ParsedEV {
  value: number;
  isVariable: boolean;
  original: string;
}

/**
 * Encounter rating result.
 */
export interface EncounterRatingResult {
  difficulty: SceneDifficulty | 'trivial' | 'deadly';
  totalEV: number;
  budgetMin: number;
  budgetMax: number;
  percentOfTarget: number;
}

// ---------------------------------------------------------------------------
// EV Budget Data
// ---------------------------------------------------------------------------

/**
 * EV per hero by level and difficulty.
 * Based on Draw Steel encounter building rules.
 */
const EV_PER_HERO: Record<number, Record<SceneDifficulty, number>> = {
  1: { easy: 8, moderate: 12, hard: 16 },
  2: { easy: 10, moderate: 14, hard: 18 },
  3: { easy: 12, moderate: 18, hard: 24 },
  4: { easy: 14, moderate: 20, hard: 26 },
  5: { easy: 16, moderate: 22, hard: 30 },
  6: { easy: 18, moderate: 26, hard: 34 },
  7: { easy: 20, moderate: 28, hard: 38 },
  8: { easy: 22, moderate: 32, hard: 42 },
  9: { easy: 24, moderate: 34, hard: 46 },
  10: { easy: 26, moderate: 38, hard: 50 },
};

// ---------------------------------------------------------------------------
// EV Budget Calculations
// ---------------------------------------------------------------------------

/**
 * Get EV per hero for a given level and difficulty.
 *
 * @param level - Party average level (1-10)
 * @param difficulty - Encounter difficulty
 * @returns EV per hero
 */
export function getEVPerHero(level: number, difficulty: SceneDifficulty): number {
  const clampedLevel = Math.max(1, Math.min(10, level));
  return EV_PER_HERO[clampedLevel]?.[difficulty] ?? 12;
}

/**
 * Calculate effective hero count.
 * Victories increase effective party strength.
 *
 * Formula: heroes + floor(victories / 2)
 *
 * @param heroCount - Actual hero count
 * @param victories - Party victories
 * @returns Effective hero count
 */
export function getEffectiveHeroCount(heroCount: number, victories: number): number {
  return heroCount + Math.floor(victories / 2);
}

/**
 * Calculate party EV budget for encounter building.
 *
 * @param partySize - Number of heroes
 * @param averageLevel - Party average level
 * @param difficulty - Target difficulty
 * @param victories - Party victories (default 0)
 * @returns EV budget result
 */
export function getPartyEVBudget(
  partySize: number,
  averageLevel: number,
  difficulty: SceneDifficulty,
  victories = 0
): EVBudgetResult {
  const evPerHero = getEVPerHero(averageLevel, difficulty);
  const effectiveHeroes = getEffectiveHeroCount(partySize, victories);
  const target = evPerHero * effectiveHeroes;

  return {
    min: Math.floor(target * 0.9),
    max: Math.ceil(target * 1.1),
    target,
    evPerHero,
    effectiveHeroes,
  };
}

// ---------------------------------------------------------------------------
// EV Parsing
// ---------------------------------------------------------------------------

/**
 * Parse an EV string value.
 * Handles formats like "12", "6 (minion)", "Variable", etc.
 *
 * @param evString - EV string to parse
 * @returns Parsed EV
 */
export function parseEV(evString: string | number): ParsedEV {
  if (typeof evString === 'number') {
    return { value: evString, isVariable: false, original: String(evString) };
  }

  const original = evString.trim();

  // Check for variable/special cases
  if (
    original.toLowerCase() === 'variable' ||
    original.toLowerCase() === 'varies' ||
    original === '-' ||
    original === ''
  ) {
    return { value: 0, isVariable: true, original };
  }

  // Extract number from string (handles "12", "6 (minion)", etc.)
  const match = original.match(/^(\d+)/);
  if (match && match[1]) {
    return {
      value: parseInt(match[1], 10),
      isVariable: false,
      original,
    };
  }

  return { value: 0, isVariable: true, original };
}

// ---------------------------------------------------------------------------
// Encounter EV Calculation
// ---------------------------------------------------------------------------

/**
 * Calculate total EV for an encounter.
 *
 * @param creatures - Array of creatures with EV and count
 * @returns Total encounter EV
 */
export function calculateEncounterEV(creatures: CreatureEVEntry[]): number {
  return creatures.reduce((sum, c) => sum + c.ev * c.count, 0);
}

/**
 * Calculate EV contribution of a single creature entry.
 *
 * @param ev - Creature EV
 * @param count - Number of creatures
 * @returns Total EV for this entry
 */
export function calculateCreatureEV(ev: number, count: number): number {
  return ev * count;
}

// ---------------------------------------------------------------------------
// Encounter Difficulty Rating
// ---------------------------------------------------------------------------

/**
 * Rate encounter difficulty based on total EV vs party budget.
 *
 * @param totalEV - Total encounter EV
 * @param partySize - Number of heroes
 * @param averageLevel - Party average level
 * @param victories - Party victories (default 0)
 * @returns Encounter rating result
 */
export function getEncounterDifficulty(
  totalEV: number,
  partySize: number,
  averageLevel: number,
  victories = 0
): EncounterRatingResult {
  const easyBudget = getPartyEVBudget(partySize, averageLevel, 'easy', victories);
  const moderateBudget = getPartyEVBudget(partySize, averageLevel, 'moderate', victories);
  const hardBudget = getPartyEVBudget(partySize, averageLevel, 'hard', victories);

  // Determine difficulty
  let difficulty: SceneDifficulty | 'trivial' | 'deadly';
  let percentOfTarget: number;
  let budgetMin: number;
  let budgetMax: number;

  if (totalEV <= easyBudget.min * 0.5) {
    difficulty = 'trivial';
    percentOfTarget = Math.round((totalEV / easyBudget.target) * 100);
    budgetMin = 0;
    budgetMax = Math.floor(easyBudget.min * 0.5);
  } else if (totalEV <= easyBudget.max) {
    difficulty = 'easy';
    percentOfTarget = Math.round((totalEV / easyBudget.target) * 100);
    budgetMin = easyBudget.min;
    budgetMax = easyBudget.max;
  } else if (totalEV <= moderateBudget.max) {
    difficulty = 'moderate';
    percentOfTarget = Math.round((totalEV / moderateBudget.target) * 100);
    budgetMin = moderateBudget.min;
    budgetMax = moderateBudget.max;
  } else if (totalEV <= hardBudget.max) {
    difficulty = 'hard';
    percentOfTarget = Math.round((totalEV / hardBudget.target) * 100);
    budgetMin = hardBudget.min;
    budgetMax = hardBudget.max;
  } else {
    difficulty = 'deadly';
    percentOfTarget = Math.round((totalEV / hardBudget.target) * 100);
    budgetMin = hardBudget.max;
    budgetMax = totalEV * 2; // Arbitrary upper bound
  }

  return {
    difficulty,
    totalEV,
    budgetMin,
    budgetMax,
    percentOfTarget,
  };
}

/**
 * Check if encounter is within budget for a difficulty.
 *
 * @param totalEV - Total encounter EV
 * @param budget - EV budget
 * @returns True if within budget
 */
export function isWithinBudget(totalEV: number, budget: EVBudgetResult): boolean {
  return totalEV >= budget.min && totalEV <= budget.max;
}

/**
 * Get EV difference from target budget.
 *
 * @param totalEV - Total encounter EV
 * @param budget - EV budget
 * @returns Difference (positive = over budget, negative = under)
 */
export function getEVDifference(totalEV: number, budget: EVBudgetResult): number {
  return totalEV - budget.target;
}

// ---------------------------------------------------------------------------
// Creature Role Recommendations
// ---------------------------------------------------------------------------

/**
 * Creature roles in Draw Steel.
 */
export type CreatureRole =
  | 'ambusher'
  | 'artillery'
  | 'brute'
  | 'controller'
  | 'defender'
  | 'harrier'
  | 'hexer'
  | 'leader'
  | 'mount'
  | 'solo'
  | 'support'
  | 'minion';

/**
 * Get recommended creature mix for an encounter.
 *
 * @param partySize - Number of heroes
 * @returns Recommended creature counts by role
 */
export function getRecommendedCreatureMix(partySize: number): {
  standardCreatures: number;
  minionsPerHero: number;
  hasSolo: boolean;
  hasLeader: boolean;
} {
  return {
    // Roughly 1 standard creature per hero
    standardCreatures: partySize,
    // 2-4 minions per hero for minion-heavy encounters
    minionsPerHero: 3,
    // Solos replace other creatures, not add to them
    hasSolo: false,
    // Leaders add tactical complexity
    hasLeader: partySize >= 4,
  };
}

/**
 * Get minion count equivalent to a standard creature.
 * Minions are worth less EV but come in groups.
 *
 * @param minionEV - EV of a single minion
 * @param standardEV - EV of the standard creature to match
 * @returns Minion count
 */
export function getMinionEquivalent(minionEV: number, standardEV: number): number {
  if (minionEV <= 0) return 0;
  return Math.ceil(standardEV / minionEV);
}

// ---------------------------------------------------------------------------
// Level Scaling
// ---------------------------------------------------------------------------

/**
 * Get recommended creature level range for party.
 *
 * @param partyLevel - Party average level
 * @returns Min and max creature level
 */
export function getCreatureLevelRange(partyLevel: number): { min: number; max: number } {
  return {
    min: Math.max(1, partyLevel - 2),
    max: partyLevel + 2,
  };
}

/**
 * Check if creature level is appropriate for party.
 *
 * @param creatureLevel - Creature level
 * @param partyLevel - Party average level
 * @returns True if appropriate
 */
export function isCreatureLevelAppropriate(
  creatureLevel: number,
  partyLevel: number
): boolean {
  const range = getCreatureLevelRange(partyLevel);
  return creatureLevel >= range.min && creatureLevel <= range.max;
}
