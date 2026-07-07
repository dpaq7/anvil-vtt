/**
 * Ability Logic — distance parsing tests
 *
 * Focused on the real compendium distance grammar, including the compound forms
 * that previously fell through to `special`.
 */

import { describe, it, expect } from 'vitest';
import {
  parseDistance,
  getReach,
  isInRange,
  isInRangeAny,
} from './ability-logic.js';

describe('parseDistance', () => {
  it('parses self', () => {
    expect(parseDistance('Self')).toMatchObject({ type: 'self', baseValue: 0 });
  });

  it('parses melee with and without reach', () => {
    expect(parseDistance('Melee')).toMatchObject({ type: 'melee', baseValue: 1, reach: 1 });
    expect(parseDistance('Melee 2')).toMatchObject({ type: 'melee', baseValue: 2, reach: 2 });
  });

  it('parses ranged', () => {
    expect(parseDistance('Ranged 5')).toMatchObject({ type: 'ranged', baseValue: 5 });
  });

  it('parses a burst', () => {
    expect(parseDistance('3 burst')).toMatchObject({ type: 'burst', baseValue: 3 });
  });

  it('parses a cube with a within-origin (real data)', () => {
    expect(parseDistance('2 cube within 10')).toMatchObject({
      type: 'cube',
      baseValue: 2,
      origin: 10,
    });
  });

  it('parses a cube with a qualifier and origin', () => {
    const parsed = parseDistance('2 cube of unoccupied space within 10');
    expect(parsed).toMatchObject({ type: 'cube', baseValue: 2, origin: 10 });
    expect(parsed.qualifier).toContain('unoccupied');
  });

  it('parses "L x W line within N" (real data)', () => {
    expect(parseDistance('10 x 1 line within 5')).toMatchObject({
      type: 'line',
      baseValue: 10,
      width: 1,
      origin: 5,
    });
    expect(parseDistance('10 x 2 line within 1')).toMatchObject({
      type: 'line',
      baseValue: 10,
      width: 2,
      origin: 1,
    });
  });

  it('parses a wall with an origin', () => {
    expect(parseDistance('5 wall within 10')).toMatchObject({
      type: 'wall',
      baseValue: 5,
      origin: 10,
    });
  });

  it('parses an aura', () => {
    expect(parseDistance('3 aura')).toMatchObject({ type: 'aura', baseValue: 3 });
  });

  it('parses standalone "Within N" as ally targeting', () => {
    expect(parseDistance('Within 10')).toMatchObject({ type: 'within', baseValue: 10 });
  });

  it('parses a compound "Melee 1 or Ranged 5" into primary + alternates', () => {
    const parsed = parseDistance('Melee 1 or Ranged 5');
    expect(parsed).toMatchObject({ type: 'melee', baseValue: 1 });
    expect(parsed.alternates).toHaveLength(1);
    expect(parsed.alternates![0]).toMatchObject({ type: 'ranged', baseValue: 5 });
  });

  it('handles lowercase "or ranged" variants', () => {
    const parsed = parseDistance('Melee 1 or ranged 10');
    expect(parsed.alternates![0]).toMatchObject({ type: 'ranged', baseValue: 10 });
  });

  it('handles "1 burst, or 3 cube within 5"', () => {
    const parsed = parseDistance('1 burst, or 3 cube within 5');
    expect(parsed).toMatchObject({ type: 'burst', baseValue: 1 });
    expect(parsed.alternates![0]).toMatchObject({ type: 'cube', baseValue: 3, origin: 5 });
  });

  it('falls back to special for unknown strings', () => {
    expect(parseDistance('Special; see below')).toMatchObject({ type: 'special' });
  });

  it('handles empty / invalid input', () => {
    expect(parseDistance('')).toMatchObject({ type: 'special', baseValue: 0 });
    // @ts-expect-error deliberately passing a non-string
    expect(parseDistance(undefined)).toMatchObject({ type: 'special', baseValue: 0 });
  });
});

describe('getReach', () => {
  it('uses the origin range for placed-area templates', () => {
    expect(getReach(parseDistance('2 cube within 10'))).toBe(10);
    expect(getReach(parseDistance('10 x 1 line within 5'))).toBe(5);
  });

  it('uses base value for melee/ranged/burst/aura', () => {
    expect(getReach(parseDistance('Ranged 5'))).toBe(5);
    expect(getReach(parseDistance('3 burst'))).toBe(3);
    expect(getReach(parseDistance('Self'))).toBe(0);
  });
});

describe('isInRange / isInRangeAny', () => {
  it('checks a placed cube against its origin range, not its size', () => {
    const cube = parseDistance('2 cube within 10');
    expect(isInRange(cube, 8)).toBe(true);
    expect(isInRange(cube, 11)).toBe(false);
  });

  it('self only reaches distance 0', () => {
    expect(isInRange(parseDistance('Self'), 0)).toBe(true);
    expect(isInRange(parseDistance('Self'), 1)).toBe(false);
  });

  it('isInRangeAny succeeds when an alternate reaches', () => {
    const d = parseDistance('Melee 1 or Ranged 5');
    expect(isInRange(d, 4)).toBe(false); // primary melee 1 fails
    expect(isInRangeAny(d, 4)).toBe(true); // ranged 5 alternate reaches
    expect(isInRangeAny(d, 6)).toBe(false);
  });
});
