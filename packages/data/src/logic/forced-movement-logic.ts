/**
 * Forced Movement Logic
 *
 * Plans push / pull / slide across the grid: the straight-line (or chosen) path a
 * target travels, where it stops when it collides with a token or the grid edge,
 * and how many squares of movement remain unspent (which drives slam damage,
 * computed elsewhere so dice stay server-side).
 *
 * Walls and difficult terrain are out of scope, so collisions are only against
 * other token footprints or the grid boundary.
 */

import type {
  GridPoint,
  TokenFootprint,
  GridBounds,
} from './geometry-logic.js';
import {
  makeFootprint,
  footprintCenter,
  normalizeDirection,
  distanceBetweenFootprints,
} from './geometry-logic.js';

/** A token that can block forced movement. */
export interface OccupantFootprint {
  id: string;
  footprint: TokenFootprint;
}

export type ForcedMovementType = 'push' | 'pull' | 'slide';

/** The planned outcome of a forced movement. */
export interface ForcedMovementPlan {
  /** Direction the target actually travels (8-way unit vector). */
  direction: GridPoint;
  /** Top-left cell of the target at each step, starting at its origin. */
  path: GridPoint[];
  /** Final top-left cell of the target. */
  finalPosition: GridPoint;
  /** True if the target stopped early against a token or the grid edge. */
  collided: boolean;
  /** What it collided with: an occupant id, or 'edge'. */
  collisionWith?: string;
  /** Squares of the intended distance that could not be completed. */
  remainingSquares: number;
  /** Extra square added because the source is larger than the target. */
  bigVsLittleBonus: number;
  /** Total intended distance including the big-vs-little bonus. */
  totalDistance: number;
}

/**
 * Plan a forced movement.
 *
 * @param type - push (away from source), pull (toward source), or slide (arbitrary).
 * @param source - The forcing creature's footprint (defines push/pull direction).
 * @param target - The moved creature's footprint.
 * @param distance - Base distance in squares.
 * @param occupants - Other tokens that can block (should NOT include the target).
 * @param bounds - Grid bounds; leaving them counts as an 'edge' collision.
 * @param direction - Required for slide; ignored for push/pull.
 * @param bigVsLittle - When true, adds +1 square (larger creature force-moving a
 *   smaller one with a melee weapon). Defaults to comparing footprint edge lengths.
 */
export function planForcedMovement(
  type: ForcedMovementType,
  source: TokenFootprint,
  target: TokenFootprint,
  distance: number,
  occupants: readonly OccupantFootprint[],
  bounds: GridBounds,
  direction?: GridPoint,
  bigVsLittle?: boolean
): ForcedMovementPlan {
  const dir = resolveDirection(type, source, target, direction);
  const bonus = (bigVsLittle ?? source.size > target.size) ? 1 : 0;
  const totalDistance = Math.max(0, distance) + bonus;

  const start: GridPoint = { x: target.x, y: target.y };
  const path: GridPoint[] = [start];
  let current = start;
  let collided = false;
  let collisionWith: string | undefined;
  let completed = 0;

  for (let step = 0; step < totalDistance; step++) {
    const next: GridPoint = { x: current.x + dir.x, y: current.y + dir.y };
    const nextFp = makeFootprint(next.x, next.y, target.size);

    if (!withinBounds(nextFp, bounds)) {
      collided = true;
      collisionWith = 'edge';
      break;
    }

    const blocker = occupants.find(
      (o) => o.id !== undefined && distanceBetweenFootprints(nextFp, o.footprint) === 0
    );
    if (blocker) {
      collided = true;
      collisionWith = blocker.id;
      break;
    }

    current = next;
    path.push(current);
    completed++;
  }

  return {
    direction: dir,
    path,
    finalPosition: current,
    collided,
    collisionWith,
    remainingSquares: totalDistance - completed,
    bigVsLittleBonus: bonus,
    totalDistance,
  };
}

function resolveDirection(
  type: ForcedMovementType,
  source: TokenFootprint,
  target: TokenFootprint,
  direction?: GridPoint
): GridPoint {
  if (type === 'slide') {
    return normalizeDirection(direction ?? { x: 1, y: 0 });
  }
  const sc = footprintCenter(source);
  const tc = footprintCenter(target);
  const away = { x: tc.x - sc.x, y: tc.y - sc.y };
  if (type === 'push') return normalizeDirection(away);
  // pull: toward the source
  return normalizeDirection({ x: -away.x, y: -away.y });
}

function withinBounds(fp: TokenFootprint, bounds: GridBounds): boolean {
  return (
    fp.x >= 0 &&
    fp.y >= 0 &&
    fp.x + fp.size - 1 < bounds.cols &&
    fp.y + fp.size - 1 < bounds.rows
  );
}
