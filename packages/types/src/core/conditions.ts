/**
 * Draw Steel Conditions
 * All standard conditions in Draw Steel
 */

export type ConditionId =
  | 'bleeding'
  | 'dazed'
  | 'frightened'
  | 'grabbed'
  | 'prone'
  | 'restrained'
  | 'slowed'
  | 'taunted'
  | 'weakened';

/**
 * How a condition ends
 * - 'eot': Automatically ends at end of turn
 * - 'save': Must roll 6+ on d10 at end of turn (save ends)
 * - 'source-turn': Ends at end of source's turn
 * - 'target-turn': Ends at end of target's turn
 * - 'manual': No automatic end, must be removed manually
 * - 'grabbed-escape': Ends when Escape Grab succeeds
 * - 'effect': Ends when triggering effect ends
 */
export type ConditionEndTrigger =
  | 'eot'
  | 'save'
  | 'source-turn'
  | 'target-turn'
  | 'manual'
  | 'grabbed-escape'
  | 'effect';

export interface ActiveCondition {
  id: string;
  conditionId: ConditionId;
  /** How this condition ends */
  endTrigger: ConditionEndTrigger;
  /** Turns remaining, undefined means save ends */
  turnsRemaining?: number;
  /** ID of creature/effect that caused it */
  sourceEntityId?: string;
  /** Name for display */
  sourceName?: string;
  /** Timestamp when applied */
  appliedAt: number;
  /** Additional effect text */
  effect?: string;
  /** For potency checks */
  potencyLevel?: 'weak' | 'average' | 'strong';
}

/**
 * All valid condition IDs for validation
 */
export const CONDITION_IDS: readonly ConditionId[] = [
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
