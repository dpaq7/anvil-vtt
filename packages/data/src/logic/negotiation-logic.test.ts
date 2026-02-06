import { describe, it, expect } from 'vitest';
import {
  getStartingInterest,
  getStartingPatience,
  clampInterest,
  clampPatience,
  getInterestDescription,
  getPhase,
  getTier,
  getInterestChange,
  getPatienceChange,
  resolveArgument,
} from './negotiation-logic.js';

describe('NegotiationLogic', () => {
  describe('getStartingInterest', () => {
    it('returns 0 for hostile attitude', () => {
      expect(getStartingInterest('hostile')).toBe(0);
    });

    it('returns 0 for suspicious attitude', () => {
      expect(getStartingInterest('suspicious')).toBe(0);
    });

    it('returns 0 for neutral attitude', () => {
      expect(getStartingInterest('neutral')).toBe(0);
    });

    it('returns 1 for open attitude', () => {
      expect(getStartingInterest('open')).toBe(1);
    });

    it('returns 2 for friendly attitude', () => {
      expect(getStartingInterest('friendly')).toBe(2);
    });

    it('returns 3 for trusting attitude', () => {
      expect(getStartingInterest('trusting')).toBe(3);
    });
  });

  describe('getStartingPatience', () => {
    it('returns 2 for hostile attitude', () => {
      expect(getStartingPatience('hostile')).toBe(2);
    });

    it('returns 3 for suspicious attitude', () => {
      expect(getStartingPatience('suspicious')).toBe(3);
    });

    it('returns 4 for neutral attitude', () => {
      expect(getStartingPatience('neutral')).toBe(4);
    });

    it('returns 5 for open attitude', () => {
      expect(getStartingPatience('open')).toBe(5);
    });

    it('returns 6 for friendly attitude', () => {
      expect(getStartingPatience('friendly')).toBe(6);
    });

    it('returns 7 for trusting attitude', () => {
      expect(getStartingPatience('trusting')).toBe(7);
    });
  });

  describe('clampInterest', () => {
    it('clamps interest to minimum 0', () => {
      expect(clampInterest(-5, 5)).toBe(0);
    });

    it('clamps interest to maximum', () => {
      expect(clampInterest(10, 5)).toBe(5);
    });

    it('leaves valid interest unchanged', () => {
      expect(clampInterest(3, 5)).toBe(3);
    });
  });

  describe('clampPatience', () => {
    it('clamps patience to minimum 0', () => {
      expect(clampPatience(-2, 5)).toBe(0);
    });

    it('clamps patience to maximum', () => {
      expect(clampPatience(8, 5)).toBe(5);
    });

    it('leaves valid patience unchanged', () => {
      expect(clampPatience(3, 5)).toBe(3);
    });
  });

  describe('getInterestDescription', () => {
    it('returns "No, and..." for interest 0', () => {
      expect(getInterestDescription(0)).toBe('No, and...');
    });

    it('returns "No." for interest 1', () => {
      expect(getInterestDescription(1)).toBe('No.');
    });

    it('returns "No, but..." for interest 2', () => {
      expect(getInterestDescription(2)).toBe('No, but...');
    });

    it('returns "Yes, but..." for interest 3', () => {
      expect(getInterestDescription(3)).toBe('Yes, but...');
    });

    it('returns "Yes." for interest 4', () => {
      expect(getInterestDescription(4)).toBe('Yes.');
    });

    it('returns "Yes, and..." for interest 5', () => {
      expect(getInterestDescription(5)).toBe('Yes, and...');
    });
  });

  describe('getPhase', () => {
    it('returns success when interest reaches target', () => {
      expect(getPhase(5, 3, 5)).toBe('success');
    });

    it('returns success when interest exceeds target', () => {
      expect(getPhase(6, 3, 5)).toBe('success');
    });

    it('returns failure when patience is 0', () => {
      expect(getPhase(2, 0, 5)).toBe('failure');
    });

    it('returns active when negotiation is ongoing', () => {
      expect(getPhase(2, 3, 5)).toBe('active');
      expect(getPhase(4, 2, 5)).toBe('active');
    });

    it('returns success before failure when interest meets target at 0 patience', () => {
      // Interest check happens first, so reaching target at 0 patience = success
      expect(getPhase(5, 0, 5)).toBe('success');
    });
  });

  describe('getTier', () => {
    it('returns tier 1 for rolls <= 11', () => {
      expect(getTier(2)).toBe(1);
      expect(getTier(11)).toBe(1);
    });

    it('returns tier 2 for rolls 12-16', () => {
      expect(getTier(12)).toBe(2);
      expect(getTier(14)).toBe(2);
      expect(getTier(16)).toBe(2);
    });

    it('returns tier 3 for rolls >= 17', () => {
      expect(getTier(17)).toBe(3);
      expect(getTier(20)).toBe(3);
    });
  });

  describe('getInterestChange', () => {
    it('returns 0 for tier 1', () => {
      expect(getInterestChange(1, false)).toBe(0);
      expect(getInterestChange(1, true)).toBe(0); // Motivation doesn't help tier 1
    });

    it('returns 1 for tier 2', () => {
      expect(getInterestChange(2, false)).toBe(1);
    });

    it('returns 2 for tier 2 with motivation', () => {
      expect(getInterestChange(2, true)).toBe(2);
    });

    it('returns 2 for tier 3', () => {
      expect(getInterestChange(3, false)).toBe(2);
    });

    it('returns 3 for tier 3 with motivation', () => {
      expect(getInterestChange(3, true)).toBe(3);
    });
  });

  describe('getPatienceChange', () => {
    it('returns -1 for tier 1', () => {
      expect(getPatienceChange(1, false)).toBe(-1);
    });

    it('returns 0 for tier 2', () => {
      expect(getPatienceChange(2, false)).toBe(0);
    });

    it('returns 0 for tier 3', () => {
      expect(getPatienceChange(3, false)).toBe(0);
    });

    it('returns -2 for tier 1 with pitfall', () => {
      expect(getPatienceChange(1, true)).toBe(-2);
    });

    it('returns -1 for tier 2 with pitfall', () => {
      expect(getPatienceChange(2, true)).toBe(-1);
    });

    it('allows custom pitfall loss', () => {
      expect(getPatienceChange(2, true, 2)).toBe(-2);
    });
  });

  describe('resolveArgument', () => {
    it('resolves tier 1 result correctly', () => {
      const result = resolveArgument(8, false, false);
      expect(result.tier).toBe(1);
      expect(result.interestChange).toBe(0);
      expect(result.patienceChange).toBe(-1);
    });

    it('resolves tier 2 with motivation correctly', () => {
      const result = resolveArgument(14, true, false);
      expect(result.tier).toBe(2);
      expect(result.interestChange).toBe(2);
      expect(result.patienceChange).toBe(0);
      expect(result.usedMotivation).toBe(true);
    });

    it('resolves tier 3 with pitfall correctly', () => {
      const result = resolveArgument(18, false, true);
      expect(result.tier).toBe(3);
      expect(result.interestChange).toBe(2);
      expect(result.patienceChange).toBe(-1);
      expect(result.hitPitfall).toBe(true);
    });
  });
});
