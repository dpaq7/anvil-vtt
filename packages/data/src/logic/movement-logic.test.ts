/**
 * Movement Logic tests — condition-adjusted budgets and costed paths.
 */

import { describe, it, expect } from 'vitest';
import { getMovementBudget, buildMovementPath } from './movement-logic.js';
import { createTurnActionState } from './battle-logic.js';
import type { GridPoint } from './geometry-logic.js';

const straightPath = (n: number): GridPoint[] =>
  Array.from({ length: n + 1 }, (_, i) => ({ x: i, y: 0 }));

describe('getMovementBudget', () => {
  it('returns full speed with no conditions', () => {
    const b = getMovementBudget(5, createTurnActionState(5), []);
    expect(b).toMatchObject({ totalSpeed: 5, remaining: 5, canShift: true, isImmobilized: false });
  });

  it('caps a slowed creature at speed 2 and forbids shifting', () => {
    const b = getMovementBudget(6, createTurnActionState(6), ['slowed']);
    expect(b.totalSpeed).toBe(2);
    expect(b.remaining).toBe(2);
    expect(b.canShift).toBe(false);
  });

  it('does not raise the speed of an already-slower creature', () => {
    const b = getMovementBudget(1, createTurnActionState(1), ['slowed']);
    expect(b.totalSpeed).toBe(1);
  });

  it('immobilizes grabbed and restrained creatures', () => {
    expect(getMovementBudget(5, createTurnActionState(5), ['grabbed'])).toMatchObject({
      totalSpeed: 0,
      remaining: 0,
      isImmobilized: true,
      canShift: false,
    });
    expect(getMovementBudget(5, createTurnActionState(5), ['restrained']).isImmobilized).toBe(true);
  });

  it('flags crawl for prone creatures', () => {
    expect(getMovementBudget(5, createTurnActionState(5), ['prone']).mustCrawl).toBe(true);
  });

  it('reflects already-spent movement via moveRemaining', () => {
    const state = { ...createTurnActionState(5), moveRemaining: 2 };
    expect(getMovementBudget(5, state, []).remaining).toBe(2);
  });
});

describe('buildMovementPath', () => {
  it('charges 1 per square, not counting the start square', () => {
    const budget = getMovementBudget(5, createTurnActionState(5), []);
    const path = buildMovementPath(straightPath(3), budget);
    expect(path.totalCost).toBe(3);
    expect(path.overBudget).toBe(false);
    expect(path.steps).toHaveLength(3);
    expect(path.steps[2]!.cumulativeCost).toBe(3);
  });

  it('flags over-budget once the running cost exceeds remaining', () => {
    const budget = getMovementBudget(3, createTurnActionState(3), []);
    const path = buildMovementPath(straightPath(5), budget);
    expect(path.overBudget).toBe(true);
    expect(path.steps[2]!.overBudget).toBe(false); // cost 3 == remaining 3
    expect(path.steps[3]!.overBudget).toBe(true); // cost 4 > 3
  });

  it('doubles per-square cost while crawling (prone)', () => {
    const budget = getMovementBudget(5, createTurnActionState(5), ['prone']);
    const path = buildMovementPath(straightPath(2), budget);
    expect(path.totalCost).toBe(4); // 2 squares × 2
  });

  it('counts diagonal steps as 1 (Chebyshev)', () => {
    const budget = getMovementBudget(5, createTurnActionState(5), []);
    const diagonal: GridPoint[] = [
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 2 },
    ];
    expect(buildMovementPath(diagonal, budget).totalCost).toBe(2);
  });
});
