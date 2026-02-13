/**
 * Universal Combat Actions
 *
 * Defines the standard actions available to all creatures in Draw Steel combat,
 * independent of class or ancestry. These include Catch Breath, Free Strike,
 * Grab, Knockback, Hide, Aid Attack, Defend, Charge, and Stand Up.
 *
 * Each action specifies its action economy cost, conditions, and resolution.
 * Pure data + helper functions — no state mutation.
 *
 * Reference: Draw Steel Core Rules - Combat Actions
 */

import type { ActionType, TurnActionState } from './battle-logic.js';
import type { Tier } from './roll-logic.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * A universal combat action available to all creatures.
 */
export interface UniversalAction {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Short description for the UI */
  description: string;
  /** What action economy slot this uses */
  actionType: ActionType;
  /** Keywords for ability interactions */
  keywords: string[];
  /** Distance / range text */
  distance: string;
  /** Target description */
  target: string;
  /** Whether this uses a power roll */
  hasPowerRoll: boolean;
  /** The characteristic used for the power roll (if any) */
  powerRollCharacteristic?: 'might' | 'agility' | 'reason' | 'intuition' | 'presence';
  /** Tier result descriptions (if hasPowerRoll) */
  tier1Effect?: string;
  tier2Effect?: string;
  tier3Effect?: string;
  /** Static effect text (for non-roll actions) */
  effect: string;
  /** When this action triggers (for triggered actions) */
  trigger?: string;
  /** Conditions that prevent use */
  restrictions?: string[];
  /** Whether only heroes can use this */
  heroOnly: boolean;
  /** Whether only the director can use this */
  directorOnly: boolean;
}

/**
 * Result of resolving a Catch Breath action.
 */
export interface CatchBreathResult {
  /** Amount healed */
  healAmount: number;
  /** Whether the creature used a recovery */
  recoverySpent: boolean;
  /** Remaining recoveries after use */
  recoveriesRemaining: number;
}

/**
 * Result of resolving a Grab action.
 */
export interface GrabResult {
  /** Whether the grab succeeded */
  success: boolean;
  /** The tier of the power roll */
  tier: Tier;
  /** Whether the target is now grabbed */
  targetGrabbed: boolean;
  /** Damage dealt (tier 3 only — some interpretations) */
  damage: number;
}

/**
 * Result of resolving a Knockback action.
 */
export interface KnockbackResult {
  /** Whether knockback succeeded */
  success: boolean;
  /** The tier of the power roll */
  tier: Tier;
  /** Squares the target is pushed */
  pushDistance: number;
  /** Whether the target falls prone */
  targetProne: boolean;
}

/**
 * Result of resolving a Hide action.
 */
export interface HideResult {
  /** Whether the creature is now hidden */
  hidden: boolean;
  /** The tier of the power roll */
  tier: Tier;
}

// ---------------------------------------------------------------------------
// Universal Action Definitions
// ---------------------------------------------------------------------------

/**
 * Catch Breath — Main action.
 * Spend a Recovery to regain stamina equal to your recovery value.
 * Winded creatures can only Catch Breath or take maneuvers/move.
 */
export const CATCH_BREATH: UniversalAction = {
  id: 'catch-breath',
  name: 'Catch Breath',
  description: 'Spend a recovery to regain stamina equal to your recovery value.',
  actionType: 'main',
  keywords: [],
  distance: 'Self',
  target: 'Self',
  hasPowerRoll: false,
  effect: 'You spend a recovery and regain stamina equal to your recovery value (floor(maxStamina / 3)).',
  heroOnly: false,
  directorOnly: false,
};

/**
 * Free Strike — Main action (or triggered).
 * A basic melee or ranged attack available to all creatures.
 * Deals characteristic modifier + weapon damage.
 */
export const FREE_STRIKE: UniversalAction = {
  id: 'free-strike',
  name: 'Free Strike',
  description: 'A basic weapon attack. Can also be used as a triggered action when provoked.',
  actionType: 'main',
  keywords: ['Attack', 'Melee', 'Ranged', 'Weapon'],
  distance: 'Melee 1 or Ranged 5',
  target: 'One creature or object',
  hasPowerRoll: true,
  powerRollCharacteristic: 'might',
  tier1Effect: 'Weapon damage + characteristic modifier (half damage)',
  tier2Effect: 'Weapon damage + characteristic modifier',
  tier3Effect: 'Weapon damage + characteristic modifier + bonus damage',
  effect: 'Make a basic weapon attack.',
  trigger: 'An enemy within reach moves away without shifting, or an enemy within reach makes a ranged attack.',
  heroOnly: false,
  directorOnly: false,
};

/**
 * Grab — Maneuver.
 * Attempt to grab a creature of your size or smaller within reach.
 */
export const GRAB: UniversalAction = {
  id: 'grab',
  name: 'Grab',
  description: 'Attempt to grab a creature of your size or smaller within reach.',
  actionType: 'maneuver',
  keywords: ['Melee'],
  distance: 'Melee 1',
  target: 'One creature your size or smaller',
  hasPowerRoll: true,
  powerRollCharacteristic: 'might',
  tier1Effect: 'No effect',
  tier2Effect: 'The target is grabbed (escape ends)',
  tier3Effect: 'The target is grabbed (escape ends)',
  effect: 'Contested by the target\'s Might or Agility (target chooses).',
  restrictions: ['Target must be your size or smaller'],
  heroOnly: false,
  directorOnly: false,
};

/**
 * Knockback — Maneuver.
 * Attempt to push a creature within reach.
 */
export const KNOCKBACK: UniversalAction = {
  id: 'knockback',
  name: 'Knockback',
  description: 'Attempt to push a creature within reach away from you.',
  actionType: 'maneuver',
  keywords: ['Melee'],
  distance: 'Melee 1',
  target: 'One creature',
  hasPowerRoll: true,
  powerRollCharacteristic: 'might',
  tier1Effect: 'Push 1',
  tier2Effect: 'Push 2',
  tier3Effect: 'Push 3; target falls prone',
  effect: 'Contested by the target\'s Might.',
  heroOnly: false,
  directorOnly: false,
};

/**
 * Hide — Maneuver.
 * Attempt to become hidden from enemies.
 * Requires cover or concealment.
 */
export const HIDE: UniversalAction = {
  id: 'hide',
  name: 'Hide',
  description: 'Attempt to become hidden from enemies. Requires cover or concealment.',
  actionType: 'maneuver',
  keywords: [],
  distance: 'Self',
  target: 'Self',
  hasPowerRoll: true,
  powerRollCharacteristic: 'agility',
  tier1Effect: 'You are not hidden',
  tier2Effect: 'You are hidden',
  tier3Effect: 'You are hidden; you can move without breaking stealth this turn',
  effect: 'You must have cover or concealment to attempt to hide.',
  restrictions: ['Requires cover or concealment from all enemies'],
  heroOnly: false,
  directorOnly: false,
};

/**
 * Aid Attack — Maneuver.
 * Help an adjacent ally with their next attack.
 */
export const AID_ATTACK: UniversalAction = {
  id: 'aid-attack',
  name: 'Aid Attack',
  description: 'Help an adjacent ally gain an edge on their next attack against a target you can see.',
  actionType: 'maneuver',
  keywords: [],
  distance: 'Melee 1',
  target: 'One ally',
  hasPowerRoll: false,
  effect: 'Choose an ally adjacent to you. The next attack they make before the start of your next turn gains an edge.',
  heroOnly: false,
  directorOnly: false,
};

/**
 * Defend — Main action.
 * Take a defensive stance until the start of your next turn.
 */
export const DEFEND: UniversalAction = {
  id: 'defend',
  name: 'Defend',
  description: 'Take a defensive stance. Attacks against you have a bane until your next turn.',
  actionType: 'main',
  keywords: [],
  distance: 'Self',
  target: 'Self',
  hasPowerRoll: false,
  effect: 'Until the start of your next turn, all attacks against you have a bane, and you gain damage resistance equal to your level.',
  heroOnly: false,
  directorOnly: false,
};

/**
 * Charge — Main action.
 * Move up to your speed in a straight line and make a free strike at the end.
 * You must move at least 2 squares.
 */
export const CHARGE: UniversalAction = {
  id: 'charge',
  name: 'Charge',
  description: 'Move in a straight line and make a free strike at the end.',
  actionType: 'main',
  keywords: ['Attack', 'Melee', 'Weapon'],
  distance: 'Special',
  target: 'One creature',
  hasPowerRoll: true,
  powerRollCharacteristic: 'might',
  tier1Effect: 'Free strike damage (half)',
  tier2Effect: 'Free strike damage',
  tier3Effect: 'Free strike damage + bonus',
  effect: 'Move up to your speed in a straight line (must move at least 2 squares), then make a free strike against an adjacent creature. The attack has an edge.',
  restrictions: ['Must move at least 2 squares in a straight line'],
  heroOnly: false,
  directorOnly: false,
};

/**
 * Stand Up — Free maneuver.
 * Stand up from prone. Uses no action economy.
 */
export const STAND_UP: UniversalAction = {
  id: 'stand-up',
  name: 'Stand Up',
  description: 'Stand up from the prone condition.',
  actionType: 'maneuver',
  keywords: [],
  distance: 'Self',
  target: 'Self',
  hasPowerRoll: false,
  effect: 'You stand up, ending the prone condition on yourself. This can be done as a free maneuver on your turn.',
  heroOnly: false,
  directorOnly: false,
};

/**
 * Escape Grab — Maneuver.
 * Attempt to break free from a grab.
 */
export const ESCAPE_GRAB: UniversalAction = {
  id: 'escape-grab',
  name: 'Escape Grab',
  description: 'Attempt to break free from being grabbed.',
  actionType: 'maneuver',
  keywords: [],
  distance: 'Self',
  target: 'Self',
  hasPowerRoll: true,
  powerRollCharacteristic: 'might',
  tier1Effect: 'You remain grabbed',
  tier2Effect: 'You escape the grab',
  tier3Effect: 'You escape the grab and can shift 1 square',
  effect: 'Contested by the grabber\'s Might. You can use Might or Agility (your choice).',
  restrictions: ['Must be grabbed'],
  heroOnly: false,
  directorOnly: false,
};

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

/**
 * All universal combat actions, keyed by ID.
 */
export const UNIVERSAL_ACTIONS: Record<string, UniversalAction> = {
  [CATCH_BREATH.id]: CATCH_BREATH,
  [FREE_STRIKE.id]: FREE_STRIKE,
  [GRAB.id]: GRAB,
  [KNOCKBACK.id]: KNOCKBACK,
  [HIDE.id]: HIDE,
  [AID_ATTACK.id]: AID_ATTACK,
  [DEFEND.id]: DEFEND,
  [CHARGE.id]: CHARGE,
  [STAND_UP.id]: STAND_UP,
  [ESCAPE_GRAB.id]: ESCAPE_GRAB,
};

/**
 * Get all universal actions as an array.
 */
export function getAllUniversalActions(): UniversalAction[] {
  return Object.values(UNIVERSAL_ACTIONS);
}

/**
 * Get a universal action by ID.
 */
export function getUniversalAction(id: string): UniversalAction | undefined {
  return UNIVERSAL_ACTIONS[id];
}

// ---------------------------------------------------------------------------
// Availability Helpers
// ---------------------------------------------------------------------------

/**
 * Get universal actions available given the current turn action state.
 *
 * @param turnState - Current turn action state
 * @param conditions - Active conditions on the creature (e.g., 'grabbed', 'prone')
 * @returns Actions available to the creature
 */
export function getAvailableUniversalActions(
  turnState: TurnActionState,
  conditions: string[] = []
): UniversalAction[] {
  return getAllUniversalActions().filter((action) => {
    // Check action economy
    if (!canUseUniversalAction(turnState, action)) return false;

    // Check condition-specific availability
    if (action.id === 'escape-grab' && !conditions.includes('grabbed')) return false;
    if (action.id === 'stand-up' && !conditions.includes('prone')) return false;

    return true;
  });
}

/**
 * Check if a universal action can be used given the turn action state.
 *
 * @param turnState - Current turn action state
 * @param action - The action to check
 * @returns True if the action can be used
 */
export function canUseUniversalAction(
  turnState: TurnActionState,
  action: UniversalAction
): boolean {
  switch (action.actionType) {
    case 'main':
      // Main action requires main action slot (not used and not converted)
      return !turnState.mainActionUsed && turnState.mainConvertedTo === null;

    case 'maneuver':
      // Can use maneuver if slot available, or if main was converted to maneuver
      if (!turnState.maneuverUsed) return true;
      if (turnState.mainConvertedTo === 'maneuver' && !turnState.mainActionUsed) return true;
      return false;

    case 'move':
      return turnState.moveRemaining > 0;

    case 'triggered':
      return !turnState.triggeredUsedThisRound;

    default:
      return false;
  }
}

// ---------------------------------------------------------------------------
// Resolution Helpers
// ---------------------------------------------------------------------------

/**
 * Calculate recovery value (Catch Breath healing).
 * Draw Steel rule: recovery = floor(maxStamina / 3)
 *
 * @param maxStamina - Creature's maximum stamina
 * @returns Recovery value
 */
export function calculateRecoveryValue(maxStamina: number): number {
  return Math.floor(maxStamina / 3);
}

/**
 * Resolve a Catch Breath action.
 *
 * @param currentStamina - Current stamina
 * @param maxStamina - Maximum stamina
 * @param recoveriesRemaining - Number of recoveries left
 * @returns Result of catching breath
 */
export function resolveCatchBreath(
  currentStamina: number,
  maxStamina: number,
  recoveriesRemaining: number
): CatchBreathResult {
  if (recoveriesRemaining <= 0) {
    return { healAmount: 0, recoverySpent: false, recoveriesRemaining: 0 };
  }

  const recoveryValue = calculateRecoveryValue(maxStamina);
  const healAmount = Math.min(recoveryValue, maxStamina - currentStamina);

  return {
    healAmount,
    recoverySpent: true,
    recoveriesRemaining: recoveriesRemaining - 1,
  };
}

/**
 * Resolve a Grab power roll result.
 *
 * @param tier - Tier of the power roll
 * @returns Grab result
 */
export function resolveGrab(tier: Tier): GrabResult {
  switch (tier) {
    case 1:
      return { success: false, tier, targetGrabbed: false, damage: 0 };
    case 2:
      return { success: true, tier, targetGrabbed: true, damage: 0 };
    case 3:
      return { success: true, tier, targetGrabbed: true, damage: 0 };
  }
}

/**
 * Resolve a Knockback power roll result.
 *
 * @param tier - Tier of the power roll
 * @returns Knockback result
 */
export function resolveKnockback(tier: Tier): KnockbackResult {
  switch (tier) {
    case 1:
      return { success: true, tier, pushDistance: 1, targetProne: false };
    case 2:
      return { success: true, tier, pushDistance: 2, targetProne: false };
    case 3:
      return { success: true, tier, pushDistance: 3, targetProne: true };
  }
}

/**
 * Resolve a Hide power roll result.
 *
 * @param tier - Tier of the power roll
 * @returns Hide result
 */
export function resolveHide(tier: Tier): HideResult {
  switch (tier) {
    case 1:
      return { hidden: false, tier };
    case 2:
      return { hidden: true, tier };
    case 3:
      return { hidden: true, tier };
  }
}

/**
 * Resolve an Escape Grab power roll result.
 *
 * @param tier - Tier of the power roll
 * @returns Object with escape result
 */
export function resolveEscapeGrab(tier: Tier): { escaped: boolean; canShift: boolean; tier: Tier } {
  switch (tier) {
    case 1:
      return { escaped: false, canShift: false, tier };
    case 2:
      return { escaped: true, canShift: false, tier };
    case 3:
      return { escaped: true, canShift: true, tier };
  }
}

/**
 * Get the Defend damage resistance bonus for a creature's level.
 *
 * @param level - Creature's level
 * @returns Damage resistance value
 */
export function getDefendResistance(level: number): number {
  return Math.max(1, level);
}
