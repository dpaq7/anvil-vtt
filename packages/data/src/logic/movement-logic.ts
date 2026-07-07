/**
 * Movement Logic
 *
 * Turns a raw speed plus the current turn's action economy and conditions into a
 * usable movement budget, and costs a literal drawn path against it. This layer
 * is advisory: it computes whether a path is over-budget but never blocks it —
 * the caller decides what to do with an over-budget result (warn, still allow).
 *
 * The user drags the actual path square by square, so there is no pathfinding
 * here — {@link buildMovementPath} only costs the ordered squares it is given.
 * Difficult terrain is out of scope, so every normal step costs 1.
 */

import type { ConditionName } from '@anvil/types';
import type { GridPoint } from './geometry-logic.js';
import { chebyshevDistance } from './geometry-logic.js';
import type { TurnActionState } from './battle-logic.js';

/** Speed a slowed creature is capped to (Draw Steel: "speed 2 unless already lower"). */
export const SLOWED_SPEED = 2;

/** The movement a creature can actually perform right now, after conditions. */
export interface MovementBudget {
  /** Speed after condition modifiers (before spending). */
  totalSpeed: number;
  /** Squares of movement still available this turn. */
  remaining: number;
  /** False if the creature can't shift (slowed) or is immobilized. */
  canShift: boolean;
  /** True if speed is 0 from grabbed/restrained. */
  isImmobilized: boolean;
  /** True if prone and not yet stood up — each square costs 1 extra (crawl). */
  mustCrawl: boolean;
}

/** One step of a costed movement path. */
export interface PathStep {
  point: GridPoint;
  /** Movement cost of entering this square (1 normally, 2 while crawling). */
  cost: number;
  /** Running total cost through this step. */
  cumulativeCost: number;
  /** True once the running cost has exceeded the remaining budget. */
  overBudget: boolean;
}

/** A costed movement path built from an ordered list of squares. */
export interface MovementPath {
  steps: PathStep[];
  /** Total cost of the whole path. */
  totalCost: number;
  /** True if the path costs more than the budget's remaining movement. */
  overBudget: boolean;
}

/**
 * Compute the movement budget for a creature given its base speed, the turn's
 * action state (from {@link TurnActionState}), and its active conditions.
 *
 * Applies, per Draw Steel:
 * - grabbed / restrained → speed 0 (immobilized)
 * - slowed → speed capped at 2, can't shift
 * - prone → must crawl (handled as extra per-square cost, not a speed change)
 *
 * `moveRemaining` on the turn state is treated as the source of truth for how
 * much has already been spent; the condition-adjusted `totalSpeed` caps it.
 */
export function getMovementBudget(
  baseSpeed: number,
  turnState: TurnActionState,
  conditions: readonly ConditionName[] = []
): MovementBudget {
  const has = (c: ConditionName) => conditions.includes(c);

  const isImmobilized = has('grabbed') || has('restrained');
  const slowed = has('slowed');
  const mustCrawl = has('prone');

  let totalSpeed = baseSpeed;
  if (slowed) totalSpeed = Math.min(totalSpeed, SLOWED_SPEED);
  if (isImmobilized) totalSpeed = 0;

  // moveRemaining tracks spend against the raw speed; clamp it to the adjusted cap.
  const remaining = Math.max(0, Math.min(turnState.moveRemaining, totalSpeed));

  return {
    totalSpeed,
    remaining,
    canShift: !slowed && !isImmobilized,
    isImmobilized,
    mustCrawl,
  };
}

/**
 * Cost an ordered list of squares against a movement budget. The list should be
 * the literal path the user drew, each square adjacent to the previous one; any
 * non-adjacent jump is costed by its Chebyshev distance (so a sloppy path can't
 * under-count). Crawling (prone) adds 1 to every square's cost.
 *
 * `orderedSquares[0]` is the starting square and is not charged; movement is
 * charged for entering each subsequent square.
 */
export function buildMovementPath(
  orderedSquares: readonly GridPoint[],
  budget: MovementBudget
): MovementPath {
  const steps: PathStep[] = [];
  const crawlSurcharge = budget.mustCrawl ? 1 : 0;
  let cumulative = 0;

  for (let i = 1; i < orderedSquares.length; i++) {
    const prev = orderedSquares[i - 1]!;
    const point = orderedSquares[i]!;
    const stepDistance = Math.max(1, chebyshevDistance(prev, point));
    const cost = stepDistance + crawlSurcharge;
    cumulative += cost;
    steps.push({
      point,
      cost,
      cumulativeCost: cumulative,
      overBudget: cumulative > budget.remaining,
    });
  }

  return {
    steps,
    totalCost: cumulative,
    overBudget: cumulative > budget.remaining,
  };
}
