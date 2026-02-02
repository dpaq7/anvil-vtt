/**
 * Entity Status Logic Tests
 *
 * Tests for stamina calculations, health status, and display functions.
 */

import { describe, it, expect } from 'vitest';
import * as EntityStatusLogic from './entity-status-logic.js';

describe('EntityStatusLogic', () => {
  // ---------------------------------------------------------------------------
  // Stamina Calculations
  // ---------------------------------------------------------------------------

  describe('getStaminaPercentage', () => {
    it('returns 100 for full stamina', () => {
      expect(EntityStatusLogic.getStaminaPercentage(30, 30)).toBe(100);
    });

    it('returns 0 for zero current', () => {
      expect(EntityStatusLogic.getStaminaPercentage(0, 30)).toBe(0);
    });

    it('returns 0 for negative current', () => {
      expect(EntityStatusLogic.getStaminaPercentage(-5, 30)).toBe(0);
    });

    it('returns 0 for zero max', () => {
      expect(EntityStatusLogic.getStaminaPercentage(10, 0)).toBe(0);
    });

    it('calculates correct percentage', () => {
      expect(EntityStatusLogic.getStaminaPercentage(15, 30)).toBe(50);
      expect(EntityStatusLogic.getStaminaPercentage(9, 30)).toBe(30);
    });

    it('rounds to nearest integer', () => {
      // 10/30 = 0.333... -> 33%
      expect(EntityStatusLogic.getStaminaPercentage(10, 30)).toBe(33);
    });

    it('caps at 100% for overheal', () => {
      expect(EntityStatusLogic.getStaminaPercentage(35, 30)).toBe(100);
    });
  });

  describe('getWindedThreshold', () => {
    it('returns floor of max/2', () => {
      expect(EntityStatusLogic.getWindedThreshold(30)).toBe(15);
      expect(EntityStatusLogic.getWindedThreshold(21)).toBe(10);
      expect(EntityStatusLogic.getWindedThreshold(25)).toBe(12);
    });

    it('handles odd numbers correctly', () => {
      expect(EntityStatusLogic.getWindedThreshold(31)).toBe(15);
    });
  });

  describe('getDeathThreshold', () => {
    it('returns negative winded threshold', () => {
      expect(EntityStatusLogic.getDeathThreshold(30)).toBe(-15);
      expect(EntityStatusLogic.getDeathThreshold(21)).toBe(-10);
    });
  });

  describe('isWinded', () => {
    it('returns true when current <= winded threshold', () => {
      expect(EntityStatusLogic.isWinded(15, 30)).toBe(true);
      expect(EntityStatusLogic.isWinded(10, 30)).toBe(true);
      expect(EntityStatusLogic.isWinded(0, 30)).toBe(true);
    });

    it('returns false when current > winded threshold', () => {
      expect(EntityStatusLogic.isWinded(16, 30)).toBe(false);
      expect(EntityStatusLogic.isWinded(30, 30)).toBe(false);
    });

    it('handles boundary case exactly at threshold', () => {
      expect(EntityStatusLogic.isWinded(15, 30)).toBe(true);
    });
  });

  describe('isDying', () => {
    it('returns true when current <= 0', () => {
      expect(EntityStatusLogic.isDying(0)).toBe(true);
      expect(EntityStatusLogic.isDying(-5)).toBe(true);
    });

    it('returns false when current > 0', () => {
      expect(EntityStatusLogic.isDying(1)).toBe(false);
      expect(EntityStatusLogic.isDying(15)).toBe(false);
    });
  });

  describe('isDead', () => {
    it('returns true when current <= death threshold', () => {
      // Death threshold for max 30 is -15
      expect(EntityStatusLogic.isDead(-15, 30)).toBe(true);
      expect(EntityStatusLogic.isDead(-20, 30)).toBe(true);
    });

    it('returns false when current > death threshold', () => {
      expect(EntityStatusLogic.isDead(-14, 30)).toBe(false);
      expect(EntityStatusLogic.isDead(0, 30)).toBe(false);
    });
  });

  describe('getHealthStatus', () => {
    it('returns healthy for full stamina', () => {
      expect(EntityStatusLogic.getHealthStatus(30, 30)).toBe('healthy');
    });

    it('returns injured for partial stamina above winded', () => {
      expect(EntityStatusLogic.getHealthStatus(20, 30)).toBe('injured');
    });

    it('returns winded at or below threshold', () => {
      expect(EntityStatusLogic.getHealthStatus(15, 30)).toBe('winded');
      expect(EntityStatusLogic.getHealthStatus(10, 30)).toBe('winded');
    });

    it('returns dying at 0 or below', () => {
      expect(EntityStatusLogic.getHealthStatus(0, 30)).toBe('dying');
      expect(EntityStatusLogic.getHealthStatus(-5, 30)).toBe('dying');
    });

    it('returns dead at or below death threshold', () => {
      expect(EntityStatusLogic.getHealthStatus(-15, 30)).toBe('dead');
      expect(EntityStatusLogic.getHealthStatus(-20, 30)).toBe('dead');
    });
  });

  describe('getHealthStatusLabel', () => {
    it('returns correct labels', () => {
      expect(EntityStatusLogic.getHealthStatusLabel('healthy')).toBe('Healthy');
      expect(EntityStatusLogic.getHealthStatusLabel('injured')).toBe('Injured');
      expect(EntityStatusLogic.getHealthStatusLabel('winded')).toBe('Winded');
      expect(EntityStatusLogic.getHealthStatusLabel('dying')).toBe('Dying');
      expect(EntityStatusLogic.getHealthStatusLabel('dead')).toBe('Dead');
    });
  });

  // ---------------------------------------------------------------------------
  // Stamina Colors
  // ---------------------------------------------------------------------------

  describe('getStaminaColor', () => {
    it('returns green for high stamina', () => {
      expect(EntityStatusLogic.getStaminaColor(25, 30)).toBe('green');
    });

    it('returns yellow around 50%', () => {
      expect(EntityStatusLogic.getStaminaColor(15, 30)).toBe('yellow');
    });

    it('returns orange below 25%', () => {
      expect(EntityStatusLogic.getStaminaColor(7, 30)).toBe('orange');
    });

    it('returns red when dying', () => {
      expect(EntityStatusLogic.getStaminaColor(0, 30)).toBe('red');
      expect(EntityStatusLogic.getStaminaColor(-5, 30)).toBe('red');
    });

    it('returns black when dead', () => {
      expect(EntityStatusLogic.getStaminaColor(-15, 30)).toBe('black');
    });
  });

  describe('getStaminaColorVar', () => {
    it('returns correct CSS variables', () => {
      expect(EntityStatusLogic.getStaminaColorVar(30, 30)).toBe('var(--status-success)');
      expect(EntityStatusLogic.getStaminaColorVar(15, 30)).toBe('var(--status-warning)');
      expect(EntityStatusLogic.getStaminaColorVar(7, 30)).toBe('var(--status-caution)');
      expect(EntityStatusLogic.getStaminaColorVar(0, 30)).toBe('var(--status-danger)');
      expect(EntityStatusLogic.getStaminaColorVar(-15, 30)).toBe('var(--status-critical)');
    });
  });

  // ---------------------------------------------------------------------------
  // Display Formatting
  // ---------------------------------------------------------------------------

  describe('formatStamina', () => {
    it('formats basic stamina', () => {
      expect(EntityStatusLogic.formatStamina(15, 30)).toBe('15/30');
    });

    it('formats with temp stamina', () => {
      expect(EntityStatusLogic.formatStamina(15, 30, 5)).toBe('15/30 (+5)');
    });

    it('ignores zero temp stamina', () => {
      expect(EntityStatusLogic.formatStamina(15, 30, 0)).toBe('15/30');
    });
  });

  // ---------------------------------------------------------------------------
  // Entity Type Display
  // ---------------------------------------------------------------------------

  describe('getEntityTypeColor', () => {
    it('returns correct colors for each type', () => {
      expect(EntityStatusLogic.getEntityTypeColor('hero')).toBe('blue');
      expect(EntityStatusLogic.getEntityTypeColor('monster')).toBe('red');
      expect(EntityStatusLogic.getEntityTypeColor('companion')).toBe('purple');
      expect(EntityStatusLogic.getEntityTypeColor('minion')).toBe('green');
      expect(EntityStatusLogic.getEntityTypeColor('npc')).toBe('yellow');
      expect(EntityStatusLogic.getEntityTypeColor('object')).toBe('gray');
      expect(EntityStatusLogic.getEntityTypeColor('terrain')).toBe('gray');
    });
  });

  describe('getEntityTypeLabel', () => {
    it('returns correct labels', () => {
      expect(EntityStatusLogic.getEntityTypeLabel('hero')).toBe('Hero');
      expect(EntityStatusLogic.getEntityTypeLabel('monster')).toBe('Monster');
      expect(EntityStatusLogic.getEntityTypeLabel('companion')).toBe('Companion');
    });
  });

  describe('getHeroSubtitle', () => {
    it('formats with all parts', () => {
      expect(EntityStatusLogic.getHeroSubtitle(3, 'Human', 'Fury')).toBe('Level 3 Human Fury');
    });

    it('handles missing ancestry', () => {
      expect(EntityStatusLogic.getHeroSubtitle(3, null, 'Fury')).toBe('Level 3 Fury');
    });

    it('handles missing class', () => {
      expect(EntityStatusLogic.getHeroSubtitle(3, 'Human', null)).toBe('Level 3 Human');
    });

    it('handles minimal data', () => {
      expect(EntityStatusLogic.getHeroSubtitle(1)).toBe('Level 1');
    });
  });

  describe('getMonsterSubtitle', () => {
    it('formats with role', () => {
      expect(EntityStatusLogic.getMonsterSubtitle(5, 'Brute')).toBe('Level 5 Brute');
    });

    it('handles missing role', () => {
      expect(EntityStatusLogic.getMonsterSubtitle(5)).toBe('Level 5');
    });
  });

  // ---------------------------------------------------------------------------
  // Resource Display
  // ---------------------------------------------------------------------------

  describe('calculatePipDisplay', () => {
    it('calculates basic pip display', () => {
      const result = EntityStatusLogic.calculatePipDisplay(3, 5);
      expect(result.filled).toBe(3);
      expect(result.empty).toBe(2);
      expect(result.overflow).toBe(0);
      expect(result.hasOverflow).toBe(false);
    });

    it('handles overflow', () => {
      const result = EntityStatusLogic.calculatePipDisplay(15, 20, 10);
      expect(result.filled).toBe(10);
      expect(result.overflow).toBe(5);
      expect(result.hasOverflow).toBe(true);
    });

    it('respects display limit', () => {
      const result = EntityStatusLogic.calculatePipDisplay(5, 15, 10);
      expect(result.displayLimit).toBe(10);
    });
  });

  describe('formatResource', () => {
    it('formats with spaces', () => {
      expect(EntityStatusLogic.formatResource(5, 10)).toBe('5 / 10');
    });
  });

  describe('formatResourceCompact', () => {
    it('formats without spaces', () => {
      expect(EntityStatusLogic.formatResourceCompact(5, 10)).toBe('5/10');
    });
  });

  // ---------------------------------------------------------------------------
  // Condition Display
  // ---------------------------------------------------------------------------

  describe('getConditionSeverity', () => {
    it('returns critical for dying conditions', () => {
      expect(EntityStatusLogic.getConditionSeverity('dying')).toBe('critical');
      expect(EntityStatusLogic.getConditionSeverity('dead')).toBe('critical');
    });

    it('returns high for severe conditions', () => {
      expect(EntityStatusLogic.getConditionSeverity('bleeding')).toBe('high');
      expect(EntityStatusLogic.getConditionSeverity('restrained')).toBe('high');
    });

    it('returns medium for standard conditions', () => {
      expect(EntityStatusLogic.getConditionSeverity('dazed')).toBe('medium');
      expect(EntityStatusLogic.getConditionSeverity('frightened')).toBe('medium');
      expect(EntityStatusLogic.getConditionSeverity('prone')).toBe('medium');
    });

    it('returns low for unknown conditions', () => {
      expect(EntityStatusLogic.getConditionSeverity('custom')).toBe('low');
    });

    it('is case-insensitive', () => {
      expect(EntityStatusLogic.getConditionSeverity('BLEEDING')).toBe('high');
    });
  });

  describe('sortConditionsBySeverity', () => {
    it('sorts critical first', () => {
      const conditions = ['dazed', 'dying', 'bleeding'];
      const sorted = EntityStatusLogic.sortConditionsBySeverity(conditions);
      expect(sorted[0]).toBe('dying');
    });

    it('maintains order within same severity', () => {
      const conditions = ['dazed', 'frightened', 'prone'];
      const sorted = EntityStatusLogic.sortConditionsBySeverity(conditions);
      expect(sorted).toContain('dazed');
      expect(sorted).toContain('frightened');
      expect(sorted).toContain('prone');
    });

    it('does not mutate original array', () => {
      const conditions = ['dazed', 'dying'];
      EntityStatusLogic.sortConditionsBySeverity(conditions);
      expect(conditions[0]).toBe('dazed'); // Original unchanged
    });
  });

  describe('getConditionSummary', () => {
    it('returns empty string for no conditions', () => {
      expect(EntityStatusLogic.getConditionSummary([])).toBe('');
    });

    it('returns single condition', () => {
      expect(EntityStatusLogic.getConditionSummary(['dazed'])).toBe('dazed');
    });

    it('returns two conditions', () => {
      const summary = EntityStatusLogic.getConditionSummary(['dazed', 'prone']);
      expect(summary).toContain('dazed');
      expect(summary).toContain('prone');
    });

    it('shows overflow count', () => {
      const summary = EntityStatusLogic.getConditionSummary(['dying', 'bleeding', 'dazed', 'prone'], 2);
      expect(summary).toContain('+2 more');
    });

    it('sorts by severity before truncating', () => {
      const summary = EntityStatusLogic.getConditionSummary(['dazed', 'dying', 'bleeding'], 2);
      expect(summary).toContain('dying');
      expect(summary).toContain('bleeding');
    });
  });
});
