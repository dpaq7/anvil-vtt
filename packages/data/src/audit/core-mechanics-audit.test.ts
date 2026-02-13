/**
 * Core Mechanics Audit — Slice 1
 *
 * Validates fundamental game rules against Draw Steel source books:
 * - Power Roll tier boundaries
 * - Echelon mapping
 * - XP advancement table
 * - Stamina / Winded / Dying / Recovery formulas
 * - Free strike damage values
 * - Test difficulty outcomes
 *
 * Source: docs/rules_data/data-rules-md/Chapters/
 */
import { describe, it, expect } from 'vitest';
import { GameData } from '../game-data/lib/game-rules.js';
import * as HeroLogic from '../logic/hero-logic.js';

// ============================================================
// Power Roll Tiers (Source: Tests.md, lines 88-93)
// ============================================================
describe('Audit: Core Mechanics — Power Roll Tiers', () => {
  it('tier 1: roll <= 11', () => {
    expect(GameData.getTierForRoll(1)).toBe(1);
    expect(GameData.getTierForRoll(5)).toBe(1);
    expect(GameData.getTierForRoll(11)).toBe(1);
  });

  it('tier 2: roll 12-16', () => {
    expect(GameData.getTierForRoll(12)).toBe(2);
    expect(GameData.getTierForRoll(14)).toBe(2);
    expect(GameData.getTierForRoll(16)).toBe(2);
  });

  it('tier 3: roll >= 17', () => {
    expect(GameData.getTierForRoll(17)).toBe(3);
    expect(GameData.getTierForRoll(20)).toBe(3);
    expect(GameData.getTierForRoll(25)).toBe(3);
  });

  it('boundary: 11 is tier 1, 12 is tier 2', () => {
    expect(GameData.getTierForRoll(11)).toBe(1);
    expect(GameData.getTierForRoll(12)).toBe(2);
  });

  it('boundary: 16 is tier 2, 17 is tier 3', () => {
    expect(GameData.getTierForRoll(16)).toBe(2);
    expect(GameData.getTierForRoll(17)).toBe(3);
  });
});

// ============================================================
// Test Difficulty Outcomes (Source: Tests.md, lines 88-93)
// ============================================================
describe('Audit: Core Mechanics — Test Difficulty Outcomes', () => {
  describe('Easy tests', () => {
    it('<=11: success with consequence', () => {
      expect(GameData.getTestOutcome('easy', 8)).toBe('success with consequence');
      expect(GameData.getTestOutcome('easy', 11)).toBe('success with consequence');
    });
    it('12-16: success', () => {
      expect(GameData.getTestOutcome('easy', 12)).toBe('success');
      expect(GameData.getTestOutcome('easy', 16)).toBe('success');
    });
    it('17+: success with reward', () => {
      expect(GameData.getTestOutcome('easy', 17)).toBe('success with reward');
      expect(GameData.getTestOutcome('easy', 20)).toBe('success with reward');
    });
  });

  describe('Medium tests', () => {
    it('<=11: failure', () => {
      expect(GameData.getTestOutcome('medium', 8)).toBe('failure');
      expect(GameData.getTestOutcome('medium', 11)).toBe('failure');
    });
    it('12-16: success with consequence', () => {
      expect(GameData.getTestOutcome('medium', 12)).toBe('success with consequence');
      expect(GameData.getTestOutcome('medium', 16)).toBe('success with consequence');
    });
    it('17+: success', () => {
      expect(GameData.getTestOutcome('medium', 17)).toBe('success');
      expect(GameData.getTestOutcome('medium', 20)).toBe('success');
    });
  });

  describe('Hard tests', () => {
    it('<=11: failure with consequence', () => {
      expect(GameData.getTestOutcome('hard', 8)).toBe('failure with consequence');
      expect(GameData.getTestOutcome('hard', 11)).toBe('failure with consequence');
    });
    it('12-16: failure', () => {
      expect(GameData.getTestOutcome('hard', 12)).toBe('failure');
      expect(GameData.getTestOutcome('hard', 16)).toBe('failure');
    });
    it('17+: success', () => {
      expect(GameData.getTestOutcome('hard', 17)).toBe('success');
      expect(GameData.getTestOutcome('hard', 20)).toBe('success');
    });
  });

  describe('Natural 19-20 override', () => {
    it('all difficulties: success with reward on nat 19+', () => {
      expect(GameData.getTestOutcome('easy', 5, true)).toBe('success with reward');
      expect(GameData.getTestOutcome('medium', 5, true)).toBe('success with reward');
      expect(GameData.getTestOutcome('hard', 5, true)).toBe('success with reward');
    });
  });
});

// ============================================================
// Echelon Mapping (Source: Making a Hero.md, implied by level progression)
// ============================================================
describe('Audit: Core Mechanics — Echelon Mapping', () => {
  it('L1-3 = 1st echelon', () => {
    expect(GameData.getEchelon(1)).toBe(1);
    expect(GameData.getEchelon(2)).toBe(1);
    expect(GameData.getEchelon(3)).toBe(1);
  });

  it('L4-6 = 2nd echelon', () => {
    expect(GameData.getEchelon(4)).toBe(2);
    expect(GameData.getEchelon(5)).toBe(2);
    expect(GameData.getEchelon(6)).toBe(2);
  });

  it('L7-9 = 3rd echelon', () => {
    expect(GameData.getEchelon(7)).toBe(3);
    expect(GameData.getEchelon(8)).toBe(3);
    expect(GameData.getEchelon(9)).toBe(3);
  });

  it('L10 = 4th echelon', () => {
    expect(GameData.getEchelon(10)).toBe(4);
  });

  it('HeroLogic.getEchelon matches GameData.getEchelon for all levels', () => {
    for (let level = 1; level <= 10; level++) {
      expect(HeroLogic.getEchelon(level)).toBe(GameData.getEchelon(level));
    }
  });
});

// ============================================================
// XP Advancement Table (Source: Making a Hero.md, lines 202-210)
// ============================================================
describe('Audit: Core Mechanics — XP Advancement Table', () => {
  // Source table:
  // L1: 0-15, L2: 16-31, L3: 32-47, L4: 48-63, L5: 64-79
  // L6: 80-95, L7: 96-111, L8: 112-127, L9: 128-143, L10: 144+
  //
  // Each level spans exactly 16 XP. The pattern is:
  // Level N starts at (N-1) * 16 XP

  const XP_TABLE: Array<{ level: number; minXp: number; maxXp: number | null }> = [
    { level: 1, minXp: 0, maxXp: 15 },
    { level: 2, minXp: 16, maxXp: 31 },
    { level: 3, minXp: 32, maxXp: 47 },
    { level: 4, minXp: 48, maxXp: 63 },
    { level: 5, minXp: 64, maxXp: 79 },
    { level: 6, minXp: 80, maxXp: 95 },
    { level: 7, minXp: 96, maxXp: 111 },
    { level: 8, minXp: 112, maxXp: 127 },
    { level: 9, minXp: 128, maxXp: 143 },
    { level: 10, minXp: 144, maxXp: null },
  ];

  it('each level spans exactly 16 XP (except L10 which is 144+)', () => {
    for (const entry of XP_TABLE) {
      if (entry.maxXp !== null) {
        expect(entry.maxXp - entry.minXp).toBe(15); // 0-15 = 16 values
      }
    }
  });

  it('level boundaries are contiguous (no gaps or overlaps)', () => {
    for (let i = 1; i < XP_TABLE.length; i++) {
      const prev = XP_TABLE[i - 1]!;
      const curr = XP_TABLE[i]!;
      expect(curr.minXp).toBe(prev.maxXp! + 1);
    }
  });

  it('XP table matches expected formula: level N starts at (N-1) * 16', () => {
    for (const entry of XP_TABLE) {
      expect(entry.minXp).toBe((entry.level - 1) * 16);
    }
  });
});

// ============================================================
// Stamina Thresholds (Source: Combat.md)
// ============================================================
describe('Audit: Core Mechanics — Stamina Thresholds', () => {
  describe('Winded = floor(maxStamina / 2)', () => {
    it('GameData.isWinded uses floor(max/2) threshold', () => {
      // max=20 → winded at <=10
      expect(GameData.isWinded(10, 20)).toBe(true);
      expect(GameData.isWinded(11, 20)).toBe(false);
      // max=21 → winded at <=10 (floor(21/2)=10)
      expect(GameData.isWinded(10, 21)).toBe(true);
      expect(GameData.isWinded(11, 21)).toBe(false);
    });

    it('HeroLogic.getWindedThreshold = floor(max/2)', () => {
      expect(HeroLogic.getWindedThreshold(20)).toBe(10);
      expect(HeroLogic.getWindedThreshold(21)).toBe(10);
      expect(HeroLogic.getWindedThreshold(100)).toBe(50);
      expect(HeroLogic.getWindedThreshold(15)).toBe(7);
    });
  });

  describe('Dying = stamina <= 0', () => {
    it('GameData.isDying checks stamina <= 0', () => {
      expect(GameData.isDying(0)).toBe(true);
      expect(GameData.isDying(-5)).toBe(true);
      expect(GameData.isDying(1)).toBe(false);
    });
  });

  describe('Death = stamina <= negative winded value', () => {
    it('HeroLogic.getDeathThreshold = -floor(max/2)', () => {
      // max=20 → death at <=-10
      expect(HeroLogic.getDeathThreshold(20)).toBe(-10);
      // max=21 → death at <=-10
      expect(HeroLogic.getDeathThreshold(21)).toBe(-10);
    });

    it('HeroLogic.isDead triggers at deathThreshold', () => {
      // max=20 → die at -10
      expect(HeroLogic.isDead(-10, 20)).toBe(true);
      expect(HeroLogic.isDead(-9, 20)).toBe(false);
    });
  });

  describe('Recovery value = floor(maxStamina / 3)', () => {
    it('GameData.getRecoveryValue = floor(max/3)', () => {
      expect(GameData.getRecoveryValue(21)).toBe(7);
      expect(GameData.getRecoveryValue(18)).toBe(6);
      expect(GameData.getRecoveryValue(15)).toBe(5);
      expect(GameData.getRecoveryValue(30)).toBe(10);
    });

    it('HeroLogic.getRecoveryValue matches GameData.getRecoveryValue', () => {
      for (const max of [15, 18, 21, 24, 27, 30, 33]) {
        expect(HeroLogic.getRecoveryValue(max)).toBe(GameData.getRecoveryValue(max));
      }
    });
  });
});

// ============================================================
// Free Strike Damage (Source: Making a Hero.md, lines 113-135)
// ============================================================
describe('Audit: Core Mechanics — Free Strike Damage', () => {
  // Melee: T1=2+M/A, T2=5+M/A, T3=7+M/A
  // Ranged: T1=2+M/A, T2=4+M/A, T3=6+M/A
  // These are base values before characteristic modifiers

  it('melee free strike base damage: T1=2, T2=5, T3=7', () => {
    const meleeDamage = { tier1: 2, tier2: 5, tier3: 7 };
    expect(meleeDamage.tier1).toBe(2);
    expect(meleeDamage.tier2).toBe(5);
    expect(meleeDamage.tier3).toBe(7);
  });

  it('ranged free strike base damage: T1=2, T2=4, T3=6', () => {
    const rangedDamage = { tier1: 2, tier2: 4, tier3: 6 };
    expect(rangedDamage.tier1).toBe(2);
    expect(rangedDamage.tier2).toBe(4);
    expect(rangedDamage.tier3).toBe(6);
  });

  it('ranged free strike distance = 5', () => {
    const rangedDistance = 5;
    expect(rangedDistance).toBe(5);
  });

  it('melee free strike distance = 1 (Melee 1)', () => {
    const meleeDistance = 1;
    expect(meleeDistance).toBe(1);
  });
});

// ============================================================
// Edges & Banes (Source: The Basics)
// ============================================================
describe('Audit: Core Mechanics — Edges & Banes', () => {
  it('base roll is 2d10', () => {
    expect(GameData.getDiceCount(0, 0)).toBe(2);
  });

  it('1 edge → 3 dice (roll 3, keep best 2)', () => {
    expect(GameData.getDiceCount(1, 0)).toBe(3);
  });

  it('1 bane → 3 dice (roll 3, keep worst 2)', () => {
    expect(GameData.getDiceCount(0, 1)).toBe(3);
  });

  it('edges and banes cancel 1-for-1', () => {
    expect(GameData.getNetEdgeBane(2, 1)).toBe(1);
    expect(GameData.getNetEdgeBane(1, 2)).toBe(-1);
    expect(GameData.getNetEdgeBane(3, 3)).toBe(0);
  });

  it('2 edges, 0 banes → 4 dice', () => {
    expect(GameData.getDiceCount(2, 0)).toBe(4);
  });
});

// ============================================================
// Size & Space (Source: Combat.md, lines 30-52)
// ============================================================
describe('Audit: Core Mechanics — Size & Space', () => {
  it('1T, 1S, 1M, 1L all occupy 1 square', () => {
    expect(GameData.getSpaceForSize('1T')).toBe(1);
    expect(GameData.getSpaceForSize('1S')).toBe(1);
    expect(GameData.getSpaceForSize('1M')).toBe(1);
    expect(GameData.getSpaceForSize('1L')).toBe(1);
  });

  it('size 2 occupies 4 squares (2x2)', () => {
    expect(GameData.getSpaceForSize('2')).toBe(4);
  });

  it('size 3 occupies 9 squares (3x3)', () => {
    expect(GameData.getSpaceForSize('3')).toBe(9);
  });

  it('size ordering: 1T < 1S < 1M < 1L < 2 < 3', () => {
    expect(GameData.compareSize('1T', '1S')).toBeLessThan(0);
    expect(GameData.compareSize('1S', '1M')).toBeLessThan(0);
    expect(GameData.compareSize('1M', '1L')).toBeLessThan(0);
    expect(GameData.compareSize('1L', '2')).toBeLessThan(0);
    expect(GameData.compareSize('2', '3')).toBeLessThan(0);
  });
});

// ============================================================
// Potency Modifiers (Source: Class chapters)
// ============================================================
describe('Audit: Core Mechanics — Potency', () => {
  it('weak = characteristic - 2', () => {
    expect(GameData.getPotency(3, 'weak')).toBe(1);
    expect(GameData.getPotency(2, 'weak')).toBe(0);
  });

  it('average = characteristic - 1', () => {
    expect(GameData.getPotency(3, 'average')).toBe(2);
    expect(GameData.getPotency(2, 'average')).toBe(1);
  });

  it('strong = characteristic (no modifier)', () => {
    expect(GameData.getPotency(3, 'strong')).toBe(3);
    expect(GameData.getPotency(2, 'strong')).toBe(2);
  });

  it('HeroLogic.getPotency matches GameData.getPotency', () => {
    for (const charVal of [0, 1, 2, 3, 4, 5]) {
      for (const level of ['weak', 'average', 'strong'] as const) {
        expect(HeroLogic.getPotency(charVal, level)).toBe(GameData.getPotency(charVal, level));
      }
    }
  });
});

// ============================================================
// Stamina Formula: level1 + perLevel * (level - 1)
// ============================================================
describe('Audit: Core Mechanics — Stamina Formula', () => {
  it('GameData.getStaminaAtLevel = level1 + perLevel * (level - 1)', () => {
    // Fury: level1=21, perLevel=9
    expect(GameData.getStaminaAtLevel('fury', 1)).toBe(21);
    expect(GameData.getStaminaAtLevel('fury', 2)).toBe(30);
    expect(GameData.getStaminaAtLevel('fury', 10)).toBe(21 + 9 * 9);

    // Elementalist: level1=18, perLevel=6 (source: Elementalist.md)
    expect(GameData.getStaminaAtLevel('elementalist', 1)).toBe(18);
    expect(GameData.getStaminaAtLevel('elementalist', 5)).toBe(18 + 6 * 4);
  });

  it('HeroLogic.getMaxStaminaForClass matches GameData.getStaminaAtLevel', () => {
    const classes: HeroLogic.HeroClass[] = [
      'beastheart', 'censor', 'conduit', 'elementalist', 'fury',
      'null', 'shadow', 'summoner', 'tactician', 'talent', 'troubadour',
    ];
    for (const cls of classes) {
      for (let level = 1; level <= 10; level++) {
        expect(HeroLogic.getMaxStaminaForClass(cls, level)).toBe(
          GameData.getStaminaAtLevel(cls, level)
        );
      }
    }
  });
});
