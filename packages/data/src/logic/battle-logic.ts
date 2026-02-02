/**
 * Battle Logic
 *
 * Pure functions for battle scene calculations.
 * Handles malice, action economy helpers, and damage calculations.
 *
 * NOTE: This module contains PURE calculations only.
 * State management, events, and orchestration live in CombatOrchestrator.
 *
 * Reference: Draw Steel Combat rules
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Action types available per turn.
 */
export type ActionType = 'main' | 'maneuver' | 'move' | 'triggered';

/**
 * Turn action state.
 */
export interface TurnActionState {
  mainActionUsed: boolean;
  maneuverUsed: boolean;
  moveRemaining: number;
  triggeredUsedThisRound: boolean;
  mainConvertedTo: 'move' | 'maneuver' | null;
}

/**
 * Combat side.
 */
export type CombatSide = 'heroes' | 'enemies';

/**
 * Damage type.
 */
export type DamageType =
  | 'untyped'
  | 'fire'
  | 'cold'
  | 'lightning'
  | 'acid'
  | 'poison'
  | 'psychic'
  | 'holy'
  | 'corruption';

/**
 * Damage roll result.
 */
export interface DamageRollResult {
  baseDamage: number;
  bonusDamage: number;
  totalDamage: number;
  damageType: DamageType;
}

// ---------------------------------------------------------------------------
// Malice Calculations
// ---------------------------------------------------------------------------

/**
 * Calculate malice gained per round based on hero count.
 *
 * Draw Steel rule: Director gains malice = hero count at start of each round.
 *
 * @param heroCount - Number of heroes in combat
 * @returns Malice per round
 */
export function getMalicePerRound(heroCount: number): number {
  return Math.max(1, heroCount);
}

/**
 * Calculate total malice at start of round N.
 * Assumes no malice spent.
 *
 * @param heroCount - Number of heroes
 * @param roundNumber - Current round (1-indexed)
 * @returns Total accumulated malice
 */
export function getMaliceAtRound(heroCount: number, roundNumber: number): number {
  return getMalicePerRound(heroCount) * roundNumber;
}

/**
 * Check if director has enough malice for an ability.
 *
 * @param currentMalice - Current malice
 * @param cost - Malice cost
 * @returns True if can afford
 */
export function canAffordMalice(currentMalice: number, cost: number): boolean {
  return currentMalice >= cost;
}

/**
 * Parse malice cost from string (handles "5+" format).
 *
 * @param costStr - Cost string (e.g., "5", "5+", "X")
 * @returns Parsed minimum cost or null if variable
 */
export function parseMaliceCost(costStr: string | number): number | null {
  if (typeof costStr === 'number') return costStr;

  const cleaned = costStr.trim().replace('+', '');
  if (cleaned === 'X' || cleaned === '') return null;

  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? null : parsed;
}

// ---------------------------------------------------------------------------
// Action Economy
// ---------------------------------------------------------------------------

/**
 * Check if an action type can be used.
 *
 * @param state - Current turn action state
 * @param actionType - Action to check
 * @returns True if action can be used
 */
export function canUseAction(
  state: TurnActionState,
  actionType: ActionType
): boolean {
  switch (actionType) {
    case 'main':
      return !state.mainActionUsed && state.mainConvertedTo === null;

    case 'maneuver':
      // Can use maneuver if not used OR if main was converted to maneuver
      if (!state.maneuverUsed) return true;
      if (state.mainConvertedTo === 'maneuver' && !state.mainActionUsed) return true;
      return false;

    case 'move':
      return state.moveRemaining > 0;

    case 'triggered':
      return !state.triggeredUsedThisRound;
  }
}

/**
 * Check if main action can be converted.
 *
 * @param state - Current turn action state
 * @param to - What to convert to
 * @returns True if can convert
 */
export function canConvertMain(
  state: TurnActionState,
  to: 'move' | 'maneuver'
): boolean {
  return !state.mainActionUsed && state.mainConvertedTo === null;
}

/**
 * Get available actions for current turn state.
 *
 * @param state - Current turn action state
 * @returns List of available action types
 */
export function getAvailableActions(state: TurnActionState): ActionType[] {
  const available: ActionType[] = [];

  if (canUseAction(state, 'main')) available.push('main');
  if (canUseAction(state, 'maneuver')) available.push('maneuver');
  if (canUseAction(state, 'move')) available.push('move');
  if (canUseAction(state, 'triggered')) available.push('triggered');

  return available;
}

/**
 * Get action summary for display.
 *
 * @param state - Current turn action state
 * @param baseSpeed - Entity's base speed
 * @returns Action summary object
 */
export function getActionSummary(
  state: TurnActionState,
  baseSpeed: number
): {
  mainAvailable: boolean;
  maneuverAvailable: boolean;
  moveUsed: number;
  moveRemaining: number;
  triggeredAvailable: boolean;
  mainConverted: 'move' | 'maneuver' | null;
} {
  const totalMove = state.mainConvertedTo === 'move' ? baseSpeed * 2 : baseSpeed;
  const moveUsed = totalMove - state.moveRemaining;

  return {
    mainAvailable: canUseAction(state, 'main'),
    maneuverAvailable: canUseAction(state, 'maneuver'),
    moveUsed,
    moveRemaining: state.moveRemaining,
    triggeredAvailable: canUseAction(state, 'triggered'),
    mainConverted: state.mainConvertedTo,
  };
}

/**
 * Create initial turn action state.
 *
 * @param baseSpeed - Entity's base speed
 * @param triggeredUsedThisRound - Whether triggered was used this round
 * @returns Initial turn action state
 */
export function createTurnActionState(
  baseSpeed: number,
  triggeredUsedThisRound = false
): TurnActionState {
  return {
    mainActionUsed: false,
    maneuverUsed: false,
    moveRemaining: baseSpeed,
    triggeredUsedThisRound,
    mainConvertedTo: null,
  };
}

// ---------------------------------------------------------------------------
// Damage Calculations
// ---------------------------------------------------------------------------

/**
 * Calculate damage for an ability tier.
 *
 * @param baseDamage - Base damage dice total
 * @param tierBonus - Bonus from tier (usually tier-1)
 * @param characteristicBonus - Characteristic modifier
 * @param otherBonuses - Other damage bonuses
 * @returns Total damage
 */
export function calculateDamage(
  baseDamage: number,
  tierBonus: number,
  characteristicBonus: number,
  otherBonuses = 0
): number {
  return Math.max(0, baseDamage + tierBonus + characteristicBonus + otherBonuses);
}

/**
 * Calculate free strike damage.
 * Free strikes deal weapon damage characteristic modifier.
 *
 * @param characteristicBonus - Characteristic modifier (usually might or agility)
 * @param weaponDamage - Base weapon damage
 * @returns Free strike damage
 */
export function calculateFreeStrikeDamage(
  characteristicBonus: number,
  weaponDamage: number
): number {
  return Math.max(1, weaponDamage + characteristicBonus);
}

/**
 * Calculate bleeding damage.
 * Bleeding: 1d6 + target's level damage at end of turn.
 *
 * @param d6Roll - Result of 1d6
 * @param targetLevel - Target's level
 * @returns Bleeding damage
 */
export function calculateBleedingDamage(d6Roll: number, targetLevel: number): number {
  return Math.max(1, d6Roll + targetLevel);
}

/**
 * Calculate slam damage from forced movement collision.
 * 1d6 per remaining square of forced movement.
 *
 * @param remainingSquares - Squares that couldn't be moved
 * @param d6Rolls - Array of d6 results
 * @returns Slam damage
 */
export function calculateSlamDamage(
  remainingSquares: number,
  d6Rolls: number[]
): number {
  const dice = d6Rolls.slice(0, remainingSquares);
  return dice.reduce((sum, d) => sum + d, 0);
}

// ---------------------------------------------------------------------------
// Initiative
// ---------------------------------------------------------------------------

/**
 * Determine who chooses first based on initiative roll.
 *
 * Draw Steel: Roll 1d10
 * - 1-5: Director chooses who goes first
 * - 6-10: Players choose who goes first
 *
 * @param initiativeRoll - Result of 1d10
 * @returns Who chooses first
 */
export function whoChoosesFirst(initiativeRoll: number): 'director' | 'players' {
  return initiativeRoll >= 6 ? 'players' : 'director';
}

/**
 * Check if surprise affects first side determination.
 * If only one side is surprised, the other side goes first.
 *
 * @param heroSurprised - Whether heroes are surprised
 * @param enemySurprised - Whether enemies are surprised
 * @returns First side or null if no surprise
 */
export function getSurpriseFirstSide(
  heroSurprised: boolean,
  enemySurprised: boolean
): CombatSide | null {
  if (heroSurprised && !enemySurprised) return 'enemies';
  if (enemySurprised && !heroSurprised) return 'heroes';
  return null;
}

// ---------------------------------------------------------------------------
// Round Progress
// ---------------------------------------------------------------------------

/**
 * Calculate round progress percentage.
 *
 * @param actedCount - Number of combatants who have acted
 * @param totalCount - Total combatants
 * @returns Progress percentage (0-100)
 */
export function getRoundProgress(actedCount: number, totalCount: number): number {
  if (totalCount <= 0) return 100;
  return Math.round((actedCount / totalCount) * 100);
}

/**
 * Check if round is complete (all combatants acted).
 *
 * @param actedCount - Number of combatants who have acted
 * @param totalCount - Total combatants
 * @returns True if round is complete
 */
export function isRoundComplete(actedCount: number, totalCount: number): boolean {
  return actedCount >= totalCount;
}

/**
 * Get remaining combatants in round.
 *
 * @param actedCount - Number of combatants who have acted
 * @param totalCount - Total combatants
 * @returns Remaining combatants
 */
export function getRemainingCombatants(actedCount: number, totalCount: number): number {
  return Math.max(0, totalCount - actedCount);
}

// ---------------------------------------------------------------------------
// Heroic Resource Generation
// ---------------------------------------------------------------------------

/**
 * Calculate heroic resource generated at turn start.
 * Heroes generate 1d3 of their heroic resource.
 *
 * @param d3Roll - Result of 1d3
 * @returns Resource generated
 */
export function calculateHeroicResourceGeneration(d3Roll: number): number {
  return Math.max(1, Math.min(3, d3Roll));
}

/**
 * Get maximum heroic resource cap.
 * Most classes cap at 5 heroic resource.
 *
 * @returns Maximum heroic resource
 */
export function getMaxHeroicResource(): number {
  return 5;
}

/**
 * Apply heroic resource cap.
 *
 * @param current - Current resource
 * @param max - Maximum resource (default 5)
 * @returns Capped resource value
 */
export function capHeroicResource(current: number, max = 5): number {
  return Math.min(max, Math.max(0, current));
}

// ---------------------------------------------------------------------------
// Malice Display
// ---------------------------------------------------------------------------

/**
 * Malice level thresholds.
 */
export type MaliceLevel = 'low' | 'medium' | 'high' | 'critical';

/**
 * Malice color names.
 */
export type MaliceColor = 'gray' | 'yellow' | 'orange' | 'red' | 'purple';

/**
 * Get malice level based on accumulated malice.
 *
 * Thresholds:
 * - Critical: 10+ (powerful abilities unlocked)
 * - High: 6-9 (dangerous)
 * - Medium: 3-5 (building)
 * - Low: 0-2 (minimal threat)
 *
 * @param malice - Current malice value
 * @returns Malice level
 */
export function getMaliceLevel(malice: number): MaliceLevel {
  if (malice >= 10) return 'critical';
  if (malice >= 6) return 'high';
  if (malice >= 3) return 'medium';
  return 'low';
}

/**
 * Get color for malice display.
 *
 * @param malice - Current malice value
 * @returns Color name
 */
export function getMaliceColor(malice: number): MaliceColor {
  if (malice >= 10) return 'purple';
  if (malice >= 6) return 'red';
  if (malice >= 3) return 'orange';
  if (malice >= 1) return 'yellow';
  return 'gray';
}

/**
 * Get Tailwind classes for malice color.
 *
 * @param malice - Current malice value
 * @returns Tailwind color classes
 */
export function getMaliceColorClass(malice: number): string {
  const color = getMaliceColor(malice);
  const classes: Record<MaliceColor, string> = {
    gray: 'text-neutral-400',
    yellow: 'text-amber-400',
    orange: 'text-orange-400',
    red: 'text-red-400',
    purple: 'text-purple-400 animate-pulse',
  };
  return classes[color];
}

/**
 * Get CSS variable for malice color.
 *
 * @param malice - Current malice value
 * @returns CSS variable string
 */
export function getMaliceColorVar(malice: number): string {
  const color = getMaliceColor(malice);
  const vars: Record<MaliceColor, string> = {
    gray: 'var(--text-muted)',
    yellow: 'var(--status-warning)',
    orange: 'var(--status-caution)',
    red: 'var(--status-danger)',
    purple: 'var(--mode-battle)',
  };
  return vars[color];
}

/**
 * Get description of current malice level.
 *
 * @param malice - Current malice value
 * @returns Status description text
 */
export function getMaliceLevelDescription(malice: number): string {
  const level = getMaliceLevel(malice);
  const descriptions: Record<MaliceLevel, string> = {
    low: 'The enemy is regrouping.',
    medium: 'Malice is building...',
    high: 'The enemy grows dangerous!',
    critical: 'CRITICAL: Powerful abilities available!',
  };
  return descriptions[level];
}

/**
 * Get background gradient class for malice tracker.
 *
 * @param malice - Current malice value
 * @returns Tailwind gradient classes
 */
export function getMaliceBackgroundClass(malice: number): string {
  const level = getMaliceLevel(malice);
  const gradients: Record<MaliceLevel, string> = {
    low: 'bg-gradient-to-r from-neutral-900 to-neutral-800',
    medium: 'bg-gradient-to-r from-orange-900/50 to-neutral-800',
    high: 'bg-gradient-to-r from-red-900/50 to-neutral-800',
    critical: 'bg-gradient-to-r from-purple-900/50 to-red-900/50 animate-pulse',
  };
  return gradients[level];
}
