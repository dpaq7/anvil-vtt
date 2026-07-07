/**
 * Geometry Logic tests — Chebyshev distance, footprints, AoE templates,
 * flanking and high ground.
 */

import { describe, it, expect } from 'vitest';
import * as Geo from './geometry-logic.js';
import { parseDistance } from './ability-logic.js';

const has = (cells: Geo.GridPoint[], x: number, y: number) =>
  cells.some((c) => c.x === x && c.y === y);

describe('chebyshevDistance', () => {
  it('treats diagonal like orthogonal', () => {
    expect(Geo.chebyshevDistance({ x: 0, y: 0 }, { x: 3, y: 0 })).toBe(3);
    expect(Geo.chebyshevDistance({ x: 0, y: 0 }, { x: 3, y: 3 })).toBe(3);
    expect(Geo.chebyshevDistance({ x: 0, y: 0 }, { x: 3, y: 2 })).toBe(3);
  });
});

describe('footprint distance', () => {
  it('measures from the nearest square of a large token', () => {
    const ogre = Geo.makeFootprint(5, 5, 2); // occupies (5,5)-(6,6)
    expect(Geo.distanceFromFootprint(ogre, { x: 6, y: 6 })).toBe(0); // inside
    expect(Geo.distanceFromFootprint(ogre, { x: 8, y: 6 })).toBe(2); // 2 east of the (6,*) edge
    expect(Geo.distanceFromFootprint(ogre, { x: 7, y: 7 })).toBe(1); // diagonal off the corner
  });

  it('measures between two footprints and detects adjacency', () => {
    const a = Geo.makeFootprint(0, 0, 1);
    const b = Geo.makeFootprint(2, 0, 1);
    expect(Geo.distanceBetweenFootprints(a, b)).toBe(2);
    expect(Geo.areAdjacent(a, Geo.makeFootprint(1, 0, 1))).toBe(true);
    expect(Geo.areAdjacent(a, Geo.makeFootprint(1, 1, 1))).toBe(true); // diagonal touch
  });
});

describe('getSquaresInRange', () => {
  it('returns a filled (2N+1)^2 block', () => {
    const cells = Geo.getSquaresInRange({ x: 0, y: 0 }, 1);
    expect(cells).toHaveLength(9);
    expect(has(cells, -1, -1)).toBe(true);
    expect(has(cells, 1, 1)).toBe(true);
  });

  it('clamps to bounds', () => {
    const cells = Geo.getSquaresInRange({ x: 0, y: 0 }, 1, { cols: 5, rows: 5 });
    // negative cells dropped → only the 4 in-bounds cells of the 3x3
    expect(cells.every((c) => c.x >= 0 && c.y >= 0)).toBe(true);
    expect(cells).toHaveLength(4);
  });
});

describe('AoE templates', () => {
  it('cube is anchored at its min corner', () => {
    const cube = Geo.getCubeSquares({ x: 3, y: 3 }, 2);
    expect(cube).toHaveLength(4);
    expect(has(cube, 3, 3)).toBe(true);
    expect(has(cube, 4, 4)).toBe(true);
    expect(has(cube, 5, 5)).toBe(false);
  });

  it('line extends along the direction with the given length', () => {
    const line = Geo.getLineSquares({ x: 0, y: 0 }, { x: 1, y: 0 }, 3, 1);
    expect(line).toHaveLength(3);
    expect(has(line, 0, 0)).toBe(true);
    expect(has(line, 2, 0)).toBe(true);
  });

  it('line width spreads perpendicular to the direction', () => {
    const line = Geo.getLineSquares({ x: 0, y: 0 }, { x: 1, y: 0 }, 2, 3);
    expect(line).toHaveLength(6); // 2 long × 3 wide
    // width centered on the line → y in {-1,0,1}
    expect(has(line, 0, -1)).toBe(true);
    expect(has(line, 0, 1)).toBe(true);
  });

  it('aura includes the caster footprint and reaches its radius', () => {
    const caster = Geo.makeFootprint(4, 4, 1);
    const aura = Geo.getAuraSquares(caster, 1);
    expect(aura).toHaveLength(9);
    expect(has(aura, 4, 4)).toBe(true); // the caster's own square
  });

  it('getAffectedSquares dispatches on parsed type', () => {
    const caster = Geo.makeFootprint(0, 0, 1);
    const cube = Geo.getAffectedSquares(parseDistance('2 cube within 10'), { x: 5, y: 5 });
    expect(cube).toHaveLength(4);

    const burst = Geo.getAffectedSquares(parseDistance('1 burst'), { x: 0, y: 0 }, {
      casterFootprint: caster,
    });
    expect(burst).toHaveLength(9);

    const melee = Geo.getAffectedSquares(parseDistance('Melee 1'), { x: 0, y: 0 });
    expect(melee).toHaveLength(0); // no area template
  });
});

describe('flanking', () => {
  const target = Geo.makeFootprint(5, 5, 1);

  it('is true when allies are on directly opposite sides', () => {
    const attacker = Geo.makeFootprint(4, 5, 1); // west
    const ally = Geo.makeFootprint(6, 5, 1); // east
    expect(Geo.isFlanked(attacker, target, [ally])).toBe(true);
  });

  it('is true on opposite diagonal corners', () => {
    const attacker = Geo.makeFootprint(4, 4, 1); // NW
    const ally = Geo.makeFootprint(6, 6, 1); // SE
    expect(Geo.isFlanked(attacker, target, [ally])).toBe(true);
  });

  it('is false when the ally is on the same side / adjacent but not opposite', () => {
    const attacker = Geo.makeFootprint(4, 5, 1); // west
    const ally = Geo.makeFootprint(5, 4, 1); // north — not opposite of west
    expect(Geo.isFlanked(attacker, target, [ally])).toBe(false);
  });

  it('is false when the attacker is not adjacent', () => {
    const attacker = Geo.makeFootprint(2, 5, 1); // 3 away
    const ally = Geo.makeFootprint(6, 5, 1);
    expect(Geo.isFlanked(attacker, target, [ally])).toBe(false);
  });
});

describe('hasHighGround', () => {
  it('requires the attacker to be strictly higher', () => {
    expect(Geo.hasHighGround(2, 0)).toBe(true);
    expect(Geo.hasHighGround(0, 0)).toBe(false);
    expect(Geo.hasHighGround(-1, 0)).toBe(false);
  });
});
