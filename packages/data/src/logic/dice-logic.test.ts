/**
 * Dice Logic Tests
 *
 * Tests for dice rolling, notation parsing, and result creation.
 */

import { describe, it, expect, vi } from 'vitest';
import * as DiceLogic from './dice-logic.js';

describe('DiceLogic', () => {
  // ---------------------------------------------------------------------------
  // rollDie
  // ---------------------------------------------------------------------------

  describe('rollDie', () => {
    it('returns a value between 1 and sides (inclusive)', () => {
      for (let i = 0; i < 100; i++) {
        const result = DiceLogic.rollDie(6);
        expect(result).toBeGreaterThanOrEqual(1);
        expect(result).toBeLessThanOrEqual(6);
      }
    });

    it('returns integer values', () => {
      for (let i = 0; i < 10; i++) {
        const result = DiceLogic.rollDie(10);
        expect(Number.isInteger(result)).toBe(true);
      }
    });

    it('throws error for invalid sides', () => {
      expect(() => DiceLogic.rollDie(0)).toThrow();
      expect(() => DiceLogic.rollDie(-1)).toThrow();
      expect(() => DiceLogic.rollDie(1.5)).toThrow();
    });
  });

  // ---------------------------------------------------------------------------
  // rollDice
  // ---------------------------------------------------------------------------

  describe('rollDice', () => {
    it('returns array with correct length', () => {
      const result = DiceLogic.rollDice(3, 6);
      expect(result).toHaveLength(3);
    });

    it('returns values in valid range', () => {
      const result = DiceLogic.rollDice(5, 10);
      result.forEach((value) => {
        expect(value).toBeGreaterThanOrEqual(1);
        expect(value).toBeLessThanOrEqual(10);
      });
    });

    it('throws error for invalid count', () => {
      expect(() => DiceLogic.rollDice(0, 6)).toThrow();
      expect(() => DiceLogic.rollDice(-1, 6)).toThrow();
    });
  });

  // ---------------------------------------------------------------------------
  // powerRoll
  // ---------------------------------------------------------------------------

  describe('powerRoll', () => {
    it('returns a valid DiceRollResult', () => {
      const result = DiceLogic.powerRoll();
      expect(result.rolls).toHaveLength(2);
      expect(result.notation).toBe('2d10');
      expect(result.source).toBe('local');
      expect(result.modifier).toBe(0);
    });

    it('calculates correct total without modifier', () => {
      const result = DiceLogic.powerRoll();
      const expectedTotal = result.rolls[0]! + result.rolls[1]!;
      expect(result.total).toBe(expectedTotal);
      expect(result.finalTotal).toBe(expectedTotal);
    });

    it('applies positive modifier correctly', () => {
      const result = DiceLogic.powerRoll(5);
      expect(result.modifier).toBe(5);
      expect(result.finalTotal).toBe(result.total + 5);
      expect(result.notation).toBe('2d10+5');
    });

    it('applies negative modifier correctly', () => {
      const result = DiceLogic.powerRoll(-2);
      expect(result.modifier).toBe(-2);
      expect(result.finalTotal).toBe(result.total - 2);
      expect(result.notation).toBe('2d10-2');
    });

    it('assigns tier based on finalTotal', () => {
      const result = DiceLogic.powerRoll();
      expect(result.tier).toBeDefined();
      expect([1, 2, 3]).toContain(result.tier);
    });
  });

  // ---------------------------------------------------------------------------
  // parseNotation
  // ---------------------------------------------------------------------------

  describe('parseNotation', () => {
    it('parses simple notation (2d6)', () => {
      const result = DiceLogic.parseNotation('2d6');
      expect(result).toEqual({ count: 2, sides: 6, modifier: 0 });
    });

    it('parses notation with positive modifier (1d10+3)', () => {
      const result = DiceLogic.parseNotation('1d10+3');
      expect(result).toEqual({ count: 1, sides: 10, modifier: 3 });
    });

    it('parses notation with negative modifier (3d8-2)', () => {
      const result = DiceLogic.parseNotation('3d8-2');
      expect(result).toEqual({ count: 3, sides: 8, modifier: -2 });
    });

    it('is case-insensitive', () => {
      const result = DiceLogic.parseNotation('2D10');
      expect(result).toEqual({ count: 2, sides: 10, modifier: 0 });
    });

    it('throws error for invalid notation', () => {
      expect(() => DiceLogic.parseNotation('invalid')).toThrow();
      expect(() => DiceLogic.parseNotation('d6')).toThrow();
      expect(() => DiceLogic.parseNotation('2d')).toThrow();
      expect(() => DiceLogic.parseNotation('2d6++')).toThrow();
    });
  });

  // ---------------------------------------------------------------------------
  // rollNotation
  // ---------------------------------------------------------------------------

  describe('rollNotation', () => {
    it('rolls correct number of dice', () => {
      const result = DiceLogic.rollNotation('3d6');
      expect(result.rolls).toHaveLength(3);
    });

    it('calculates total correctly', () => {
      const result = DiceLogic.rollNotation('2d6+5');
      const diceTotal = result.rolls.reduce((sum, r) => sum + r, 0);
      expect(result.total).toBe(diceTotal);
      expect(result.finalTotal).toBe(diceTotal + 5);
    });

    it('adds tier for 2d10 rolls', () => {
      const result = DiceLogic.rollNotation('2d10');
      expect(result.tier).toBeDefined();
    });

    it('does not add tier for non-2d10 rolls', () => {
      const result = DiceLogic.rollNotation('2d6');
      expect(result.tier).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // manualResult
  // ---------------------------------------------------------------------------

  describe('manualResult', () => {
    it('creates result with source manual', () => {
      const result = DiceLogic.manualResult(14);
      expect(result.source).toBe('manual');
    });

    it('uses provided total as finalTotal', () => {
      const result = DiceLogic.manualResult(15);
      expect(result.finalTotal).toBe(15);
    });

    it('has empty rolls array', () => {
      const result = DiceLogic.manualResult(12);
      expect(result.rolls).toEqual([]);
    });

    it('calculates tier for power rolls', () => {
      const tier1 = DiceLogic.manualResult(8);
      expect(tier1.tier).toBe(1);

      const tier2 = DiceLogic.manualResult(14);
      expect(tier2.tier).toBe(2);

      const tier3 = DiceLogic.manualResult(20);
      expect(tier3.tier).toBe(3);
    });

    it('respects custom notation', () => {
      const result = DiceLogic.manualResult(10, '2d6+3');
      expect(result.notation).toBe('2d6+3');
      expect(result.modifier).toBe(3);
      expect(result.total).toBe(7); // 10 - 3
      expect(result.tier).toBeUndefined(); // Not a power roll
    });
  });

  // ---------------------------------------------------------------------------
  // serverResult
  // ---------------------------------------------------------------------------

  describe('serverResult', () => {
    it('creates result with source server', () => {
      const result = DiceLogic.serverResult([7, 5]);
      expect(result.source).toBe('server');
    });

    it('uses provided dice values', () => {
      const result = DiceLogic.serverResult([7, 5], 3);
      expect(result.rolls).toEqual([7, 5]);
      expect(result.total).toBe(12);
      expect(result.modifier).toBe(3);
      expect(result.finalTotal).toBe(15);
    });

    it('calculates tier for 2d10', () => {
      const result = DiceLogic.serverResult([8, 6], 2, '2d10+2');
      expect(result.tier).toBe(2); // 16 total
    });
  });

  // ---------------------------------------------------------------------------
  // Specific die types
  // ---------------------------------------------------------------------------

  describe('rollD3', () => {
    it('returns values between 1 and 3', () => {
      for (let i = 0; i < 50; i++) {
        const result = DiceLogic.rollD3();
        expect(result.finalTotal).toBeGreaterThanOrEqual(1);
        expect(result.finalTotal).toBeLessThanOrEqual(3);
      }
    });

    it('has correct notation', () => {
      const result = DiceLogic.rollD3();
      expect(result.notation).toBe('1d3');
    });
  });

  describe('rollD6', () => {
    it('returns values between 1 and 6 for single die', () => {
      const result = DiceLogic.rollD6();
      expect(result.finalTotal).toBeGreaterThanOrEqual(1);
      expect(result.finalTotal).toBeLessThanOrEqual(6);
      expect(result.notation).toBe('1d6');
    });

    it('returns correct range for multiple dice', () => {
      const result = DiceLogic.rollD6(3);
      expect(result.finalTotal).toBeGreaterThanOrEqual(3);
      expect(result.finalTotal).toBeLessThanOrEqual(18);
      expect(result.notation).toBe('3d6');
    });
  });

  describe('rollD10', () => {
    it('returns values between 1 and 10', () => {
      const result = DiceLogic.rollD10();
      expect(result.finalTotal).toBeGreaterThanOrEqual(1);
      expect(result.finalTotal).toBeLessThanOrEqual(10);
    });
  });

  // ---------------------------------------------------------------------------
  // Utility functions
  // ---------------------------------------------------------------------------

  describe('hasTier', () => {
    it('returns true for power roll results', () => {
      const result = DiceLogic.powerRoll();
      expect(DiceLogic.hasTier(result)).toBe(true);
    });

    it('returns false for non-power rolls', () => {
      const result = DiceLogic.rollD6();
      expect(DiceLogic.hasTier(result)).toBe(false);
    });
  });

  describe('formatResult', () => {
    it('formats result without modifier', () => {
      const result = DiceLogic.serverResult([7, 5], 0);
      const formatted = DiceLogic.formatResult(result);
      expect(formatted).toContain('7 + 5');
      expect(formatted).toContain('= 12');
    });

    it('formats result with positive modifier', () => {
      const result = DiceLogic.serverResult([7, 5], 3);
      const formatted = DiceLogic.formatResult(result);
      expect(formatted).toContain('+ 3');
      expect(formatted).toContain('= 15');
    });

    it('formats result with negative modifier', () => {
      const result = DiceLogic.serverResult([7, 5], -2);
      const formatted = DiceLogic.formatResult(result);
      expect(formatted).toContain('- 2');
      expect(formatted).toContain('= 10');
    });

    it('includes tier for power rolls', () => {
      const result = DiceLogic.serverResult([8, 6], 2, '2d10+2');
      const formatted = DiceLogic.formatResult(result);
      expect(formatted).toContain('Tier');
    });
  });
});
