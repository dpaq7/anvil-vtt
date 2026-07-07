/**
 * Forced Movement Logic tests.
 */

import { describe, it, expect } from 'vitest';
import {
  planForcedMovement,
  type OccupantFootprint,
} from './forced-movement-logic.js';
import { makeFootprint, type GridBounds } from './geometry-logic.js';

const bounds: GridBounds = { cols: 20, rows: 20 };

describe('planForcedMovement', () => {
  it('pushes a target directly away from the source', () => {
    const source = makeFootprint(5, 5, 1);
    const target = makeFootprint(6, 5, 1);
    const plan = planForcedMovement('push', source, target, 3, [], bounds);
    expect(plan.direction).toEqual({ x: 1, y: 0 });
    expect(plan.finalPosition).toEqual({ x: 9, y: 5 });
    expect(plan.collided).toBe(false);
    expect(plan.remainingSquares).toBe(0);
  });

  it('pulls a target toward the source', () => {
    const source = makeFootprint(5, 5, 1);
    const target = makeFootprint(9, 5, 1);
    const plan = planForcedMovement('pull', source, target, 2, [], bounds);
    expect(plan.direction).toEqual({ x: -1, y: 0 });
    expect(plan.finalPosition).toEqual({ x: 7, y: 5 });
  });

  it('stops against a blocking token and reports remaining squares', () => {
    const source = makeFootprint(5, 5, 1);
    const target = makeFootprint(6, 5, 1);
    const wall: OccupantFootprint = { id: 'blocker', footprint: makeFootprint(8, 5, 1) };
    const plan = planForcedMovement('push', source, target, 5, [wall], bounds);
    expect(plan.collided).toBe(true);
    expect(plan.collisionWith).toBe('blocker');
    expect(plan.finalPosition).toEqual({ x: 7, y: 5 }); // stops just before (8,5)
    expect(plan.remainingSquares).toBe(4); // moved 1 of 5
  });

  it('stops at the grid edge', () => {
    const source = makeFootprint(2, 0, 1);
    const target = makeFootprint(1, 0, 1);
    const plan = planForcedMovement('push', source, target, 5, [], bounds);
    expect(plan.direction).toEqual({ x: -1, y: 0 });
    expect(plan.finalPosition).toEqual({ x: 0, y: 0 });
    expect(plan.collided).toBe(true);
    expect(plan.collisionWith).toBe('edge');
    expect(plan.remainingSquares).toBe(4);
  });

  it('adds a big-vs-little bonus square when the source is larger', () => {
    const ogre = makeFootprint(5, 5, 2); // occupies (5,5)-(6,6)
    const target = makeFootprint(7, 5, 1);
    const plan = planForcedMovement('push', ogre, target, 2, [], bounds);
    expect(plan.bigVsLittleBonus).toBe(1);
    expect(plan.totalDistance).toBe(3);
  });

  it('slides in the caller-provided direction', () => {
    const source = makeFootprint(0, 0, 1);
    const target = makeFootprint(5, 5, 1);
    const plan = planForcedMovement('slide', source, target, 2, [], bounds, { x: 0, y: 1 });
    expect(plan.direction).toEqual({ x: 0, y: 1 });
    expect(plan.finalPosition).toEqual({ x: 5, y: 7 });
  });
});
