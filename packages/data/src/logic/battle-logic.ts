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

import type { HeroClass } from '@anvil/types';

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
 * Simplified per-round base malice used by battle templates/previews.
 *
 * This is the constant base component (hero count) only. The full Draw Steel
 * rule grows each round — see {@link getMaliceGainForRound} for the authoritative
 * per-round gain, which the live session tracker applies during play.
 *
 * @param heroCount - Number of heroes in combat
 * @returns Base malice per round (floored at 1)
 */
export function getMalicePerRound(heroCount: number): number {
  return Math.max(1, heroCount);
}

/**
 * Malice the Director gains at the start of a given combat round.
 *
 * Draw Steel rule: at the start of each round the Director gains malice equal to
 * the number of heroes plus the current round number. Round 0 (encounter start)
 * has no per-round gain; its seeding comes from {@link getStartingMalice}.
 *
 * @param heroCount - Number of heroes in combat
 * @param roundNumber - Current round (1-indexed)
 * @returns Malice gained at the start of that round
 */
export function getMaliceGainForRound(heroCount: number, roundNumber: number): number {
  if (roundNumber < 1) return 0;
  return Math.max(0, heroCount) + roundNumber;
}

/**
 * Calculate starting malice at round 0 based on party victories.
 * Draw Steel rule: Director starts with floor(average party victories) malice.
 *
 * @param avgPartyVictories - Average victories across party members
 * @returns Starting malice for round 0
 */
export function getStartingMalice(avgPartyVictories: number): number {
  return Math.floor(Math.max(0, avgPartyVictories));
}

/**
 * Calculate total accumulated malice at the start of round N.
 *
 * Round 0 is seeded from average party victories; each subsequent round adds
 * `heroCount + roundNumber` (the documented rule), giving a total of
 * `floor(avgVictories) + heroCount * N + N(N+1)/2` at the start of round N.
 *
 * @param heroCount - Number of heroes
 * @param roundNumber - Current round (0 for encounter start, 1+ for later rounds)
 * @param avgPartyVictories - Average victories across party (for round-0 seeding)
 * @returns Total accumulated malice
 */
export function getMaliceAtRound(
  heroCount: number,
  roundNumber: number,
  avgPartyVictories: number = 0
): number {
  let total = getStartingMalice(avgPartyVictories);
  for (let round = 1; round <= roundNumber; round += 1) {
    total += getMaliceGainForRound(heroCount, round);
  }
  return total;
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

/**
 * Determine which side goes first based on initiative roll.
 * Draw Steel: Roll 1d10 — 6+ heroes go first, 5 or less villains go first.
 *
 * @param initiativeRoll - Result of 1d10
 * @returns The first side
 */
export function getFirstSide(initiativeRoll: number): 'heroes' | 'villains' {
  return initiativeRoll >= 6 ? 'heroes' : 'villains';
}

/**
 * Get the opposing side.
 *
 * @param side - Current side
 * @returns The other side
 */
export function getOppositeSide(side: 'heroes' | 'villains'): 'heroes' | 'villains' {
  return side === 'heroes' ? 'villains' : 'heroes';
}

/**
 * Determine if a side has finished acting this round.
 * A side is done when all its entities are in the actedThisRound set.
 *
 * @param sideEntityIds - Entity IDs on this side
 * @param actedThisRound - Entity IDs that have acted this round
 * @returns True if all entities on this side have acted
 */
export function isSideDone(
  sideEntityIds: string[],
  actedThisRound: string[]
): boolean {
  return sideEntityIds.every((id) => actedThisRound.includes(id));
}

/**
 * Get the entities on a side that haven't acted yet this round.
 *
 * @param sideEntityIds - Entity IDs on this side
 * @param actedThisRound - Entity IDs that have acted this round
 * @returns Entity IDs that can still act
 */
export function getUnactedEntities(
  sideEntityIds: string[],
  actedThisRound: string[]
): string[] {
  return sideEntityIds.filter((id) => !actedThisRound.includes(id));
}

/**
 * Determine what happens when a turn ends.
 * Returns the next active side and whether a new round starts.
 *
 * Logic:
 * 1. The current entity is marked as having acted.
 * 2. If the current side has more entities that haven't acted, stay on this side.
 * 3. Otherwise, switch to the other side.
 * 4. If both sides have all acted, start a new round.
 *
 * @param activeSide - Currently active side
 * @param heroEntityIds - All hero entity IDs
 * @param villainEntityIds - All villain entity IDs
 * @param actedThisRound - Entities that have acted (AFTER adding the current entity)
 * @param firstSide - Which side went first this round (for next round's first side)
 * @returns Next state info
 */
export function resolveEndTurn(
  activeSide: 'heroes' | 'villains',
  heroEntityIds: string[],
  villainEntityIds: string[],
  actedThisRound: string[],
  firstSide: 'heroes' | 'villains'
): {
  nextSide: 'heroes' | 'villains';
  newRound: boolean;
} {
  const currentSideIds = activeSide === 'heroes' ? heroEntityIds : villainEntityIds;
  const otherSideIds = activeSide === 'heroes' ? villainEntityIds : heroEntityIds;
  const otherSide = getOppositeSide(activeSide);

  const currentSideDone = isSideDone(currentSideIds, actedThisRound);
  const otherSideDone = isSideDone(otherSideIds, actedThisRound);

  // Both sides done → new round
  if (currentSideDone && otherSideDone) {
    return { nextSide: firstSide, newRound: true };
  }

  // Current side still has entities → stay (side-based: turns alternate between sides)
  // But in Draw Steel, each side takes ALL their turns before switching.
  // So we stay on the same side until everyone has acted.
  if (!currentSideDone) {
    return { nextSide: activeSide, newRound: false };
  }

  // Current side done, other side not → switch
  return { nextSide: otherSide, newRound: false };
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
 * Heroic resource generation trigger types.
 * Each class has specific triggers for gaining their resource.
 */
export type HeroicResourceTrigger =
  | 'turn-start'        // Most classes: gain at start of turn
  | 'damage-taken'      // Fury: Ferocity on taking damage
  | 'flanking'          // Shadow: Insight on flanking
  | 'hiding'            // Shadow: Insight on successfully hiding
  | 'ally-triggered'    // Tactician: Focus when ally uses triggered action
  | 'kill'              // Various: some classes gain on defeating enemy
  | 'winded'            // Fury: bonus Ferocity when becoming winded
  | 'companion-adjacent-damage' // Beastheart: Ferocity when a creature adjacent to companion takes damage
  | 'prayer'            // Conduit: Piety from Pray maneuver
  | 'judgment'          // Censor: Wrath from Judgment feature
  | 'minion-summoned'   // Summoner: Essence tracking
  | 'routine-active';   // Troubadour: Drama from active routines

/**
 * Per-class heroic resource configuration.
 */
export interface HeroicResourceConfig {
  /** Resource name (e.g., "Ferocity", "Clarity") */
  name: string;
  /** Maximum resource (null = no cap) */
  maxResource: number | null;
  /** Minimum resource (most are 0, Talent can go negative) */
  minResource: number;
  /** Triggers that generate this resource */
  gainTriggers: HeroicResourceTrigger[];
  /** Base amount gained at turn start (0 if no turn-start trigger) */
  turnStartGain: number;
}

/**
 * Resource configuration per class.
 */
export const CLASS_HEROIC_RESOURCE_CONFIG: Record<HeroClass, HeroicResourceConfig> = {
  beastheart: {
    name: 'Ferocity',
    maxResource: null,
    minResource: 0,
    gainTriggers: ['turn-start', 'companion-adjacent-damage'],
    turnStartGain: 1,
  },
  censor: {
    name: 'Wrath',
    maxResource: null,
    minResource: 0,
    gainTriggers: ['judgment', 'turn-start'],
    turnStartGain: 1,
  },
  conduit: {
    name: 'Piety',
    maxResource: null,
    minResource: 0,
    gainTriggers: ['prayer', 'turn-start'],
    turnStartGain: 1,
  },
  elementalist: {
    name: 'Essence',
    maxResource: null,
    minResource: 0,
    gainTriggers: ['turn-start'],
    turnStartGain: 3,
  },
  fury: {
    name: 'Ferocity',
    maxResource: null,
    minResource: 0,
    gainTriggers: ['damage-taken', 'winded', 'kill'],
    turnStartGain: 0, // Fury doesn't gain at turn start
  },
  null: {
    name: 'Discipline',
    maxResource: null,
    minResource: 0,
    gainTriggers: ['turn-start'],
    turnStartGain: 2,
  },
  shadow: {
    name: 'Insight',
    maxResource: null,
    minResource: 0,
    gainTriggers: ['flanking', 'hiding', 'turn-start'],
    turnStartGain: 1,
  },
  summoner: {
    name: 'Essence',
    maxResource: null,
    minResource: 0,
    gainTriggers: ['turn-start'],
    turnStartGain: 2,
  },
  tactician: {
    name: 'Focus',
    maxResource: null,
    minResource: 0,
    gainTriggers: ['turn-start', 'ally-triggered'],
    turnStartGain: 2,
  },
  talent: {
    name: 'Clarity',
    maxResource: null,
    minResource: -10, // Can go negative (Strained state)
    gainTriggers: ['turn-start'],
    turnStartGain: 2,
  },
  troubadour: {
    name: 'Drama',
    maxResource: null,
    minResource: 0,
    gainTriggers: ['turn-start', 'routine-active'],
    turnStartGain: 1,
  },
};

/**
 * Get heroic resource configuration for a class.
 *
 * @param heroClass - The hero class
 * @returns Resource configuration
 */
export function getHeroicResourceConfig(heroClass: HeroClass): HeroicResourceConfig {
  return CLASS_HEROIC_RESOURCE_CONFIG[heroClass];
}

/**
 * Calculate heroic resource gained at turn start for a class.
 *
 * @param heroClass - The hero class
 * @returns Resource generated at turn start
 */
export function calculateTurnStartResource(heroClass: HeroClass): number {
  return CLASS_HEROIC_RESOURCE_CONFIG[heroClass].turnStartGain;
}

/**
 * @deprecated Use calculateTurnStartResource with heroClass instead.
 * Calculate heroic resource generated at turn start (legacy generic 1d3).
 */
export function calculateHeroicResourceGeneration(d3Roll: number): number {
  return Math.max(1, Math.min(3, d3Roll));
}

/**
 * Get maximum heroic resource cap for a class.
 * Most classes have no cap (returns null).
 *
 * @param heroClass - The hero class
 * @returns Maximum heroic resource or null if no cap
 */
export function getMaxHeroicResource(heroClass?: HeroClass): number | null {
  if (!heroClass) return null; // Legacy: no cap
  return CLASS_HEROIC_RESOURCE_CONFIG[heroClass].maxResource;
}

/**
 * Get minimum heroic resource for a class.
 * Most classes have min 0, Talent can go negative.
 *
 * @param heroClass - The hero class
 * @returns Minimum heroic resource
 */
export function getMinHeroicResource(heroClass: HeroClass): number {
  return CLASS_HEROIC_RESOURCE_CONFIG[heroClass].minResource;
}

/**
 * Apply heroic resource bounds.
 *
 * @param current - Current resource
 * @param heroClass - The hero class (optional for legacy support)
 * @returns Bounded resource value
 */
export function capHeroicResource(current: number, heroClass?: HeroClass): number {
  const min = heroClass ? getMinHeroicResource(heroClass) : 0;
  const max = heroClass ? getMaxHeroicResource(heroClass) : null;

  let result = Math.max(min, current);
  if (max !== null) {
    result = Math.min(max, result);
  }
  return result;
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
