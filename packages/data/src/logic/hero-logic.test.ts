/**
 * Hero Logic Tests
 *
 * Locks in the Draw Steel derived-vitals rules used everywhere stamina is shown:
 * winded threshold (50% max), death threshold (negative winded), and recovery
 * value (max stamina / 3, rounded down).
 */

import { describe, it, expect } from 'vitest';
import {
  getWindedThreshold,
  getDeathThreshold,
  getRecoveryValue,
} from './hero-logic.js';

describe('HeroLogic derived vitals', () => {
  describe('getWindedThreshold', () => {
    it('is half of max stamina, rounded down', () => {
      expect(getWindedThreshold(20)).toBe(10);
      expect(getWindedThreshold(21)).toBe(10);
      expect(getWindedThreshold(1)).toBe(0);
    });

    it('throws on non-positive max stamina', () => {
      expect(() => getWindedThreshold(0)).toThrow();
      expect(() => getWindedThreshold(-5)).toThrow();
    });
  });

  describe('getDeathThreshold', () => {
    it('is the negative of the winded threshold', () => {
      expect(getDeathThreshold(20)).toBe(-10);
      expect(getDeathThreshold(21)).toBe(-10);
    });
  });

  describe('getRecoveryValue', () => {
    it('is max stamina divided by three, rounded down', () => {
      expect(getRecoveryValue(30)).toBe(10);
      expect(getRecoveryValue(20)).toBe(6);
      expect(getRecoveryValue(25)).toBe(8);
    });
  });
});
