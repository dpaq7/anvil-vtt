/**
 * Roll Logic
 *
 * Pure functions for power roll calculations.
 * Reference: rules-md/Chapters/Tests.md, rules-md/Chapters/The Basics.md
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Power roll tier result.
 * - Tier 1: ≤11 (failure/weak success)
 * - Tier 2: 12-16 (success)
 * - Tier 3: 17+ (critical success)
 */
export type Tier = 1 | 2 | 3;

/**
 * Test difficulty levels.
 */
export type TestDifficulty = 'easy' | 'medium' | 'hard';

/**
 * Test outcome result.
 */
export type TestOutcome =
  | 'failure with consequence'
  | 'failure'
  | 'success with consequence'
  | 'success'
  | 'success with reward';

/**
 * Power roll result structure.
 */
export interface PowerRollResult {
  dice: number[];
  kept: number[];
  total: number;
  tier: Tier;
  hasEdge: boolean;
  hasBane: boolean;
  isNatural19Or20: boolean;
}

// ---------------------------------------------------------------------------
// Tier Calculation
// ---------------------------------------------------------------------------

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
 * getTier(8);  // Returns 1
 * getTier(14); // Returns 2
 * getTier(20); // Returns 3
 */
export function getTier(total: number): Tier {
  if (typeof total !== 'number' || Number.isNaN(total)) {
    throw new Error(`RollLogic.getTier: total must be a number, got ${typeof total}`);
  }

  if (total >= 17) return 3;
  if (total >= 12) return 2;
  return 1;
}

/**
 * Get tier description text.
 *
 * @param tier - The tier (1, 2, or 3)
 * @returns Human-readable tier description
 */
export function getTierDescription(tier: Tier): string {
  switch (tier) {
    case 1:
      return 'Tier 1 (11 or lower)';
    case 2:
      return 'Tier 2 (12-16)';
    case 3:
      return 'Tier 3 (17 or higher)';
  }
}

// ---------------------------------------------------------------------------
// Edge & Bane Calculation
// ---------------------------------------------------------------------------

/**
 * Calculate net modifier from edges and banes.
 * Edges and banes cancel out 1-for-1.
 *
 * @param edges - Number of edges
 * @param banes - Number of banes
 * @returns Net value (positive = edges, negative = banes, 0 = neutral)
 * @throws Error if inputs are negative
 *
 * @example
 * getNetEdgeBane(2, 1);  // Returns 1 (1 edge)
 * getNetEdgeBane(1, 3);  // Returns -2 (2 banes)
 * getNetEdgeBane(2, 2);  // Returns 0 (cancel out)
 */
export function getNetEdgeBane(edges: number, banes: number): number {
  if (typeof edges !== 'number' || edges < 0) {
    throw new Error(`RollLogic.getNetEdgeBane: edges must be non-negative number, got ${edges}`);
  }
  if (typeof banes !== 'number' || banes < 0) {
    throw new Error(`RollLogic.getNetEdgeBane: banes must be non-negative number, got ${banes}`);
  }

  return edges - banes;
}

/**
 * Calculate total d10s to roll based on edges/banes.
 * Base roll is 2d10; net edges/banes add dice (keep best/worst 2).
 *
 * @param edges - Number of edges
 * @param banes - Number of banes
 * @returns Total dice to roll (minimum 2)
 *
 * @example
 * getDiceCount(0, 0);  // Returns 2 (base roll)
 * getDiceCount(2, 0);  // Returns 4 (roll 4d10, keep best 2)
 * getDiceCount(0, 1);  // Returns 3 (roll 3d10, keep worst 2)
 */
export function getDiceCount(edges: number, banes: number): number {
  if (typeof edges !== 'number' || edges < 0) {
    throw new Error(`RollLogic.getDiceCount: edges must be non-negative number, got ${edges}`);
  }
  if (typeof banes !== 'number' || banes < 0) {
    throw new Error(`RollLogic.getDiceCount: banes must be non-negative number, got ${banes}`);
  }

  return 2 + Math.abs(edges - banes);
}

/**
 * Determine whether to keep highest or lowest dice.
 *
 * @param edges - Number of edges
 * @param banes - Number of banes
 * @returns 'highest' if edges >= banes, 'lowest' otherwise
 */
export function getKeepMode(edges: number, banes: number): 'highest' | 'lowest' {
  return edges >= banes ? 'highest' : 'lowest';
}

/**
 * Select which dice to keep from a roll.
 *
 * @param dice - Array of die results
 * @param keepCount - Number of dice to keep (usually 2)
 * @param mode - Whether to keep highest or lowest
 * @returns Array of kept dice (sorted by value)
 */
export function selectKeptDice(
  dice: number[],
  keepCount: number,
  mode: 'highest' | 'lowest'
): number[] {
  if (dice.length < keepCount) {
    throw new Error(
      `RollLogic.selectKeptDice: not enough dice (${dice.length}) to keep ${keepCount}`
    );
  }

  const sorted = [...dice].sort((a, b) => (mode === 'highest' ? b - a : a - b));
  return sorted.slice(0, keepCount);
}

// ---------------------------------------------------------------------------
// Test Outcome
// ---------------------------------------------------------------------------

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
 * @param isNatural19Or20 - Whether the roll was a natural 19 or 20 on the dice
 * @returns String describing the outcome
 * @throws Error if inputs are invalid
 */
export function getTestOutcome(
  difficulty: TestDifficulty,
  total: number,
  isNatural19Or20: boolean = false
): TestOutcome {
  if (!['easy', 'medium', 'hard'].includes(difficulty)) {
    throw new Error(
      `RollLogic.getTestOutcome: invalid difficulty '${difficulty}'. Must be 'easy', 'medium', or 'hard'.`
    );
  }
  if (typeof total !== 'number' || Number.isNaN(total)) {
    throw new Error(`RollLogic.getTestOutcome: total must be a number, got ${typeof total}`);
  }

  // Natural 19-20 always grants success with reward
  if (isNatural19Or20) return 'success with reward';

  const tier = getTier(total);

  const outcomes: Record<TestDifficulty, Record<Tier, TestOutcome>> = {
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
}

/**
 * Check if a test outcome is a success (any kind).
 *
 * @param outcome - The test outcome
 * @returns True if the outcome is some form of success
 */
export function isSuccess(outcome: TestOutcome): boolean {
  return outcome.includes('success');
}

/**
 * Check if a test outcome is a failure (any kind).
 *
 * @param outcome - The test outcome
 * @returns True if the outcome is some form of failure
 */
export function isFailure(outcome: TestOutcome): boolean {
  return outcome.includes('failure');
}

/**
 * Check if a test outcome has a consequence.
 *
 * @param outcome - The test outcome
 * @returns True if the outcome includes a consequence
 */
export function hasConsequence(outcome: TestOutcome): boolean {
  return outcome.includes('consequence');
}

/**
 * Check if a test outcome has a reward.
 *
 * @param outcome - The test outcome
 * @returns True if the outcome includes a reward
 */
export function hasReward(outcome: TestOutcome): boolean {
  return outcome.includes('reward');
}

// ---------------------------------------------------------------------------
// Natural Roll Detection
// ---------------------------------------------------------------------------

/**
 * Check if dice result includes a natural 19 or 20.
 * For power rolls with 2 kept dice, this means the sum of kept dice is 19+.
 *
 * @param keptDice - The dice that were kept (usually 2)
 * @returns True if this is a natural 19 or 20
 */
export function isNatural19Or20(keptDice: number[]): boolean {
  if (keptDice.length !== 2) return false;

  const sum = keptDice[0] + keptDice[1];
  return sum >= 19;
}

/**
 * Check if dice result is a natural 1 (snake eyes on 2d10).
 *
 * @param keptDice - The dice that were kept (usually 2)
 * @returns True if both dice are 1
 */
export function isSnakeEyes(keptDice: number[]): boolean {
  if (keptDice.length !== 2) return false;
  return keptDice[0] === 1 && keptDice[1] === 1;
}

// ---------------------------------------------------------------------------
// Roll Summary
// ---------------------------------------------------------------------------

/**
 * Calculate power roll summary from dice and characteristic.
 *
 * @param dice - All dice rolled
 * @param edges - Number of edges
 * @param banes - Number of banes
 * @param characteristicValue - The characteristic modifier
 * @param bonuses - Any additional flat bonuses
 * @returns Complete power roll result
 */
export function calculatePowerRoll(
  dice: number[],
  edges: number,
  banes: number,
  characteristicValue: number,
  bonuses: number = 0
): PowerRollResult {
  const keepMode = getKeepMode(edges, banes);
  const kept = selectKeptDice(dice, 2, keepMode);
  const diceTotal = kept[0] + kept[1];
  const total = diceTotal + characteristicValue + bonuses;

  return {
    dice,
    kept,
    total,
    tier: getTier(total),
    hasEdge: edges > banes,
    hasBane: banes > edges,
    isNatural19Or20: isNatural19Or20(kept),
  };
}

// ---------------------------------------------------------------------------
// Tier Display
// ---------------------------------------------------------------------------

/**
 * Color names for tier display.
 */
export type TierColor = 'gray' | 'blue' | 'green';

/**
 * Get color name for a tier result.
 *
 * - Tier 1: gray (miss/weak result)
 * - Tier 2: blue (standard success)
 * - Tier 3: green (critical success)
 *
 * @param tier - The tier (1, 2, or 3)
 * @returns Color name for styling
 */
export function getTierColor(tier: Tier): TierColor {
  switch (tier) {
    case 1:
      return 'gray';
    case 2:
      return 'blue';
    case 3:
      return 'green';
  }
}

/**
 * Get Tailwind classes for tier color.
 *
 * @param tier - The tier (1, 2, or 3)
 * @returns Tailwind color classes for text and background
 */
export function getTierColorClass(tier: Tier): string {
  switch (tier) {
    case 1:
      return 'text-neutral-400 bg-neutral-900/50';
    case 2:
      return 'text-blue-400 bg-blue-900/50';
    case 3:
      return 'text-emerald-400 bg-emerald-900/50';
  }
}

/**
 * Get CSS variable for tier color.
 *
 * @param tier - The tier (1, 2, or 3)
 * @returns CSS variable string
 */
export function getTierColorVar(tier: Tier): string {
  switch (tier) {
    case 1:
      return 'var(--text-muted)';
    case 2:
      return 'var(--accent-primary)';
    case 3:
      return 'var(--status-success)';
  }
}
