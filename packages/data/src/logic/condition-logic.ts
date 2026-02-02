/**
 * Condition Logic
 *
 * Pure functions for condition effects and descriptions.
 * Reference: rules-md/Chapters/Conditions.md
 */

import type { ConditionName } from '@anvil/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Condition effect type.
 */
export interface ConditionEffect {
  name: ConditionName;
  description: string;
  endTrigger: 'save' | 'action' | 'special' | 'end-of-turn';
  mechanicalEffects: string[];
}

/**
 * Condition end trigger types.
 */
export type ConditionEndTrigger = 'save' | 'action' | 'special' | 'end-of-turn';

// ---------------------------------------------------------------------------
// Condition Definitions
// ---------------------------------------------------------------------------

/**
 * Complete condition effects reference.
 * Source of truth for condition mechanical effects.
 */
const CONDITION_EFFECTS: Record<ConditionName, ConditionEffect> = {
  bleeding: {
    name: 'bleeding',
    description: 'Taking ongoing damage at end of each turn.',
    endTrigger: 'save',
    mechanicalEffects: [
      'Take damage equal to 1d6 + level at end of each turn',
      'Creature can spend a maneuver to make a resistance roll to end',
    ],
  },
  dazed: {
    name: 'dazed',
    description: 'Limited to one action on your turn.',
    endTrigger: 'end-of-turn',
    mechanicalEffects: [
      'Can take only one action on your turn (action OR maneuver OR move)',
      'Cannot take triggered actions or free triggered actions',
    ],
  },
  frightened: {
    name: 'frightened',
    description: 'Cannot move closer to source of fear.',
    endTrigger: 'special',
    mechanicalEffects: [
      'Cannot willingly move closer to source of fear',
      'Bane on power rolls against the source',
      'Ends when source is no longer visible or within 5 squares',
    ],
  },
  grabbed: {
    name: 'grabbed',
    description: 'Speed 0, restrained by grabber.',
    endTrigger: 'action',
    mechanicalEffects: [
      'Speed becomes 0',
      'Cannot benefit from bonuses to speed',
      'Can escape with action (power roll vs grabber)',
      'Ends if grabber is moved away or incapacitated',
    ],
  },
  prone: {
    name: 'prone',
    description: 'On the ground, harder to hit at range.',
    endTrigger: 'action',
    mechanicalEffects: [
      'Bane on melee power rolls against creatures not prone',
      'Edge to ranged attacks against you',
      'Bane to melee attacks against you',
      'Can stand up as a maneuver',
    ],
  },
  restrained: {
    name: 'restrained',
    description: 'Cannot move, easier to hit.',
    endTrigger: 'action',
    mechanicalEffects: [
      'Speed becomes 0',
      'Cannot benefit from bonuses to speed',
      'Attacks against you have edge',
      'Your attacks have bane',
    ],
  },
  slowed: {
    name: 'slowed',
    description: 'Movement reduced.',
    endTrigger: 'end-of-turn',
    mechanicalEffects: [
      'Speed is halved (round down)',
      'Cannot benefit from extra movement',
    ],
  },
  taunted: {
    name: 'taunted',
    description: 'Must target the taunter.',
    endTrigger: 'special',
    mechanicalEffects: [
      'Bane on attacks against creatures other than the taunter',
      'Ends when taunter is incapacitated or combat ends',
    ],
  },
  weakened: {
    name: 'weakened',
    description: 'Deal reduced damage.',
    endTrigger: 'end-of-turn',
    mechanicalEffects: [
      'All damage dealt is halved (round down)',
      'Applies to all damage types',
    ],
  },
};

// ---------------------------------------------------------------------------
// Condition Queries
// ---------------------------------------------------------------------------

/**
 * Get the complete effect information for a condition.
 *
 * @param condition - The condition name
 * @returns Complete condition effect data
 * @throws Error if condition is not recognized
 *
 * @example
 * const effect = getConditionEffect('bleeding');
 * console.log(effect.description);
 */
export function getConditionEffect(condition: ConditionName): ConditionEffect {
  const effect = CONDITION_EFFECTS[condition];
  if (!effect) {
    throw new Error(`ConditionLogic.getConditionEffect: unknown condition '${condition}'`);
  }
  return effect;
}

/**
 * Get the human-readable description of a condition.
 *
 * @param condition - The condition name
 * @returns Short description of the condition
 */
export function getConditionDescription(condition: ConditionName): string {
  return getConditionEffect(condition).description;
}

/**
 * Get the mechanical effects of a condition as bullet points.
 *
 * @param condition - The condition name
 * @returns Array of mechanical effect descriptions
 */
export function getConditionMechanics(condition: ConditionName): string[] {
  return getConditionEffect(condition).mechanicalEffects;
}

/**
 * Get how a condition ends.
 *
 * @param condition - The condition name
 * @returns The end trigger type
 */
export function getConditionEndTrigger(condition: ConditionName): ConditionEndTrigger {
  return getConditionEffect(condition).endTrigger;
}

/**
 * Get all condition names.
 *
 * @returns Array of all valid condition names
 */
export function getAllConditionNames(): ConditionName[] {
  return Object.keys(CONDITION_EFFECTS) as ConditionName[];
}

// ---------------------------------------------------------------------------
// Condition State Helpers
// ---------------------------------------------------------------------------

/**
 * Check if a condition can be ended by a saving throw.
 *
 * @param condition - The condition name
 * @returns True if condition ends via save
 */
export function canEndWithSave(condition: ConditionName): boolean {
  return getConditionEffect(condition).endTrigger === 'save';
}

/**
 * Check if a condition can be ended by spending an action.
 *
 * @param condition - The condition name
 * @returns True if condition can end with action
 */
export function canEndWithAction(condition: ConditionName): boolean {
  const trigger = getConditionEffect(condition).endTrigger;
  return trigger === 'action' || trigger === 'save';
}

/**
 * Check if a condition automatically ends at end of turn.
 *
 * @param condition - The condition name
 * @returns True if condition ends at end of turn
 */
export function endsAtEndOfTurn(condition: ConditionName): boolean {
  return getConditionEffect(condition).endTrigger === 'end-of-turn';
}

/**
 * Check if a condition has special end conditions.
 *
 * @param condition - The condition name
 * @returns True if condition has special end requirements
 */
export function hasSpecialEndCondition(condition: ConditionName): boolean {
  return getConditionEffect(condition).endTrigger === 'special';
}

// ---------------------------------------------------------------------------
// Combat Effect Queries
// ---------------------------------------------------------------------------

/**
 * Check if a condition affects movement.
 *
 * @param condition - The condition name
 * @returns True if condition restricts or modifies movement
 */
export function affectsMovement(condition: ConditionName): boolean {
  return ['grabbed', 'prone', 'restrained', 'slowed', 'frightened'].includes(condition);
}

/**
 * Check if a condition affects attack rolls.
 *
 * @param condition - The condition name
 * @returns True if condition modifies attack rolls
 */
export function affectsAttacks(condition: ConditionName): boolean {
  return ['prone', 'restrained', 'taunted', 'frightened'].includes(condition);
}

/**
 * Check if a condition affects damage dealt.
 *
 * @param condition - The condition name
 * @returns True if condition modifies damage output
 */
export function affectsDamage(condition: ConditionName): boolean {
  return condition === 'weakened';
}

/**
 * Check if a condition deals damage over time.
 *
 * @param condition - The condition name
 * @returns True if condition deals ongoing damage
 */
export function dealsOngoingDamage(condition: ConditionName): boolean {
  return condition === 'bleeding';
}

/**
 * Check if a condition restricts actions.
 *
 * @param condition - The condition name
 * @returns True if condition limits available actions
 */
export function restrictsActions(condition: ConditionName): boolean {
  return condition === 'dazed';
}

/**
 * Check if a condition grants edge to attackers.
 *
 * @param condition - The condition name
 * @returns True if attackers get edge against this condition
 */
export function grantsEdgeToAttackers(condition: ConditionName): boolean {
  return ['restrained', 'prone'].includes(condition);
}

/**
 * Check if a condition imposes bane on the affected creature's attacks.
 *
 * @param condition - The condition name
 * @returns True if affected creature has bane on attacks
 */
export function imposesBaneOnAttacks(condition: ConditionName): boolean {
  return ['restrained', 'frightened', 'taunted'].includes(condition);
}

// ---------------------------------------------------------------------------
// Stacking & Interaction
// ---------------------------------------------------------------------------

/**
 * Check if two conditions can stack (apply simultaneously).
 * Most conditions can stack, but some combinations may be redundant.
 *
 * @param condition1 - First condition
 * @param condition2 - Second condition
 * @returns True if conditions can meaningfully stack
 */
export function canConditionsStack(
  condition1: ConditionName,
  condition2: ConditionName
): boolean {
  // Same condition doesn't stack
  if (condition1 === condition2) return false;

  // Restrained is a stronger version of grabbed (grabbed becomes redundant)
  if (
    (condition1 === 'grabbed' && condition2 === 'restrained') ||
    (condition1 === 'restrained' && condition2 === 'grabbed')
  ) {
    return false;
  }

  // All other combinations can stack
  return true;
}

/**
 * Get the more severe of two conditions that don't stack.
 *
 * @param condition1 - First condition
 * @param condition2 - Second condition
 * @returns The more severe condition, or the first if they stack
 */
export function getMoreSevereCondition(
  condition1: ConditionName,
  condition2: ConditionName
): ConditionName {
  // Restrained is more severe than grabbed
  if (
    (condition1 === 'grabbed' && condition2 === 'restrained') ||
    (condition1 === 'restrained' && condition2 === 'grabbed')
  ) {
    return 'restrained';
  }

  // Default to first condition
  return condition1;
}

// ---------------------------------------------------------------------------
// Display Helpers
// ---------------------------------------------------------------------------

/**
 * Get condition name formatted for display.
 *
 * @param condition - The condition name
 * @returns Capitalized condition name
 */
export function formatConditionName(condition: ConditionName): string {
  return condition.charAt(0).toUpperCase() + condition.slice(1);
}

/**
 * Get a short summary suitable for tooltips.
 *
 * @param condition - The condition name
 * @returns Short tooltip text
 */
export function getConditionTooltip(condition: ConditionName): string {
  const effect = getConditionEffect(condition);
  return `${formatConditionName(condition)}: ${effect.description}`;
}
