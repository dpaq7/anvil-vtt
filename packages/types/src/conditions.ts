/**
 * Draw Steel Conditions
 * The nine standard conditions in Draw Steel
 */

export type ConditionName =
  | 'bleeding'    // Take damage at end of each turn
  | 'dazed'       // Can only: main action OR maneuver OR move action
  | 'frightened'  // Can't move closer to fear source, bane on attacks
  | 'grabbed'     // Speed 0, bane on attacks except vs grabber
  | 'prone'       // Melee attacks against have edge, ranged have bane
  | 'restrained'  // Speed 0, bane on attacks, attacks against have edge
  | 'slowed'      // Speed halved, can't shift
  | 'taunted'     // Bane on attacks not including taunter
  | 'weakened';   // Halved damage dealt

export type ConditionEndTrigger =
  | 'save'           // Ends on successful saving throw (end of turn)
  | 'source-turn'    // Ends at end of source's turn
  | 'target-turn'    // Ends at end of target's turn
  | 'manual'         // Ends when manually removed
  | 'grabbed-escape' // Ends when Escape Grab succeeds
  | 'effect';        // Ends when triggering effect ends

/**
 * VTT condition with combat tracking
 * For hero data, use ActiveCondition from hero/common
 */
export interface VttCondition {
  id: string;
  name: ConditionName;

  /** How the condition ends */
  endTrigger: ConditionEndTrigger;
  turnsRemaining?: number;

  /** Who applied this condition */
  sourceEntityId?: string;
  /** Additional effect text */
  effect?: string;

  /** For potency checks */
  potencyLevel?: 'weak' | 'average' | 'strong';
}

/**
 * All valid condition names for validation
 */
export const VALID_CONDITIONS: readonly ConditionName[] = [
  'bleeding',
  'dazed',
  'frightened',
  'grabbed',
  'prone',
  'restrained',
  'slowed',
  'taunted',
  'weakened',
] as const;
