/**
 * Battle Logic Tests
 *
 * Locks in the Draw Steel malice rules: round-0 seeding from average party
 * victories and per-round gain of (heroCount + roundNumber). These mirror the
 * live session tracker in SessionRoom.
 */

import { describe, it, expect } from 'vitest';
import {
  getMalicePerRound,
  getMaliceGainForRound,
  getStartingMalice,
  getMaliceAtRound,
} from './battle-logic.js';

describe('BattleLogic malice', () => {
  describe('getStartingMalice', () => {
    it('seeds round 0 with floor(average party victories)', () => {
      expect(getStartingMalice(0)).toBe(0);
      expect(getStartingMalice(2.9)).toBe(2);
      expect(getStartingMalice(5)).toBe(5);
    });

    it('never returns a negative value', () => {
      expect(getStartingMalice(-3)).toBe(0);
    });
  });

  describe('getMaliceGainForRound', () => {
    it('gains heroCount + roundNumber at the start of each round', () => {
      expect(getMaliceGainForRound(4, 1)).toBe(5);
      expect(getMaliceGainForRound(4, 2)).toBe(6);
      expect(getMaliceGainForRound(4, 3)).toBe(7);
      expect(getMaliceGainForRound(5, 1)).toBe(6);
    });

    it('has no per-round gain before round 1', () => {
      expect(getMaliceGainForRound(4, 0)).toBe(0);
    });
  });

  describe('getMaliceAtRound', () => {
    it('accumulates round-0 seed plus each round gain', () => {
      // round 0 seed = floor(2) = 2; round1 +5, round2 +6 => 13
      expect(getMaliceAtRound(4, 2, 2)).toBe(2 + 5 + 6);
    });

    it('matches the closed form floor(avg) + heroCount*N + N(N+1)/2', () => {
      const heroCount = 4;
      const avg = 1;
      for (let n = 0; n <= 6; n += 1) {
        const expected = Math.floor(avg) + heroCount * n + (n * (n + 1)) / 2;
        expect(getMaliceAtRound(heroCount, n, avg)).toBe(expected);
      }
    });

    it('defaults average victories to 0', () => {
      expect(getMaliceAtRound(3, 1)).toBe(getMaliceGainForRound(3, 1));
    });
  });

  describe('getMalicePerRound (simplified base rate)', () => {
    it('returns the hero-count base, floored at 1', () => {
      expect(getMalicePerRound(4)).toBe(4);
      expect(getMalicePerRound(0)).toBe(1);
    });
  });
});
