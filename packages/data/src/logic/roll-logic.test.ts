/**
 * Roll Logic Tests
 *
 * Locks in the Draw Steel power-roll rules: tier thresholds and edge/bane
 * resolution. These are core to every test and ability resolution.
 */

import { describe, it, expect } from 'vitest';
import * as RollLogic from './roll-logic.js';

describe('RollLogic.getTier', () => {
  it('returns tier 1 for totals <= 11', () => {
    expect(RollLogic.getTier(2)).toBe(1);
    expect(RollLogic.getTier(11)).toBe(1);
  });

  it('returns tier 2 for totals 12-16', () => {
    expect(RollLogic.getTier(12)).toBe(2);
    expect(RollLogic.getTier(16)).toBe(2);
  });

  it('returns tier 3 for totals >= 17', () => {
    expect(RollLogic.getTier(17)).toBe(3);
    expect(RollLogic.getTier(25)).toBe(3);
  });

  it('treats the 11/12 and 16/17 boundaries exactly', () => {
    expect(RollLogic.getTier(11)).toBe(1);
    expect(RollLogic.getTier(12)).toBe(2);
    expect(RollLogic.getTier(16)).toBe(2);
    expect(RollLogic.getTier(17)).toBe(3);
  });

  it('throws on non-numeric input', () => {
    expect(() => RollLogic.getTier(Number.NaN)).toThrow();
  });
});

describe('RollLogic edge/bane resolution', () => {
  it('cancels edges and banes 1-for-1', () => {
    expect(RollLogic.getNetEdgeBane(2, 2)).toBe(0);
    expect(RollLogic.getNetEdgeBane(2, 1)).toBe(1);
    expect(RollLogic.getNetEdgeBane(1, 3)).toBe(-2);
  });

  it('maps net edges/banes to the correct roll state', () => {
    expect(RollLogic.getRollState(0, 0)).toBe('standard');
    expect(RollLogic.getRollState(1, 0)).toBe('edge');
    expect(RollLogic.getRollState(2, 0)).toBe('double-edge');
    expect(RollLogic.getRollState(0, 1)).toBe('bane');
    expect(RollLogic.getRollState(0, 2)).toBe('double-bane');
    expect(RollLogic.getRollState(3, 1)).toBe('double-edge');
  });

  it('applies flat +/-2 for single edge/bane and 0 for double', () => {
    expect(RollLogic.getRollStateBonus('edge')).toBe(2);
    expect(RollLogic.getRollStateBonus('bane')).toBe(-2);
    expect(RollLogic.getRollStateBonus('double-edge')).toBe(0);
    expect(RollLogic.getRollStateBonus('double-bane')).toBe(0);
    expect(RollLogic.getRollStateBonus('standard')).toBe(0);
  });

  it('shifts tier by +/-1 only for double edge/bane', () => {
    expect(RollLogic.getTierShift('double-edge')).toBe(1);
    expect(RollLogic.getTierShift('double-bane')).toBe(-1);
    expect(RollLogic.getTierShift('edge')).toBe(0);
  });

  it('clamps shifted tiers to the [1, 3] range', () => {
    expect(RollLogic.shiftTier(3, 1)).toBe(3);
    expect(RollLogic.shiftTier(1, -1)).toBe(1);
    expect(RollLogic.shiftTier(2, 1)).toBe(3);
    expect(RollLogic.shiftTier(2, -1)).toBe(1);
  });
});
