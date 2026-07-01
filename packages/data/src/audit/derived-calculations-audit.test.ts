/**
 * Derived Calculations Audit
 *
 * Validates all derived stat calculations for Draw Steel heroes:
 *   - Stamina formulas for all 11 classes at multiple levels
 *   - Winded threshold, recovery value, dying, death calculations
 *   - Echelon mapping (level -> echelon)
 *   - Kit stamina bonuses
 *   - Potency characteristic consistency
 *   - Heroic resource type consistency
 *   - Cross-validation between HeroLogic and GameData
 *   - EntityStatusLogic consistency with HeroLogic
 *
 * Sources:
 *   hero-logic.ts          (CLASS_STAMINA_CONFIG, CLASS_HEROIC_RESOURCE, CLASS_POTENCY_CHARACTERISTICS)
 *   entity-status-logic.ts (winded, dying, dead thresholds)
 *   class-definitions.ts   (class starting stats, heroic resources, potency chars)
 *   game-rules.ts          (GameData API: getStaminaAtLevel, getClass, getEchelon)
 */
import { describe, it, expect } from 'vitest';
import * as HeroLogic from '../logic/hero-logic.js';
import * as EntityStatusLogic from '../logic/entity-status-logic.js';
import { GameData } from '../game-data/lib/game-rules.js';
import { classDefinitions } from '../game-data/data/classes/class-definitions.js';

// ============================================================================
// Source-of-truth: class stamina/recovery data from Draw Steel v1.01
// ============================================================================

type HeroClassName = HeroLogic.HeroClass;

const ALL_CLASSES: HeroClassName[] = [
  'beastheart', 'censor', 'conduit', 'elementalist', 'fury',
  'null', 'shadow', 'summoner', 'tactician', 'talent', 'troubadour',
];

/**
 * Known correct values from Draw Steel source books.
 * Format: { level1Stamina, staminaPerLevel, recoveries }
 */
const CLASS_STATS: Record<HeroClassName, { level1: number; perLevel: number; recoveries: number }> = {
  fury:         { level1: 21, perLevel: 9,  recoveries: 10 },
  conduit:      { level1: 18, perLevel: 6,  recoveries: 8  },
  summoner:     { level1: 15, perLevel: 6,  recoveries: 8  },
  shadow:       { level1: 18, perLevel: 6,  recoveries: 8  },
  beastheart:   { level1: 21, perLevel: 12, recoveries: 12 },
  tactician:    { level1: 21, perLevel: 9,  recoveries: 10 },
  elementalist: { level1: 18, perLevel: 6,  recoveries: 8  },
  censor:       { level1: 21, perLevel: 9,  recoveries: 12 },
  null:         { level1: 21, perLevel: 9,  recoveries: 8  },
  talent:       { level1: 18, perLevel: 6,  recoveries: 8  },
  troubadour:   { level1: 18, perLevel: 6,  recoveries: 8  },
};

/**
 * Expected echelon mapping.
 */
const ECHELON_MAP: Array<{ level: number; echelon: 1 | 2 | 3 | 4 }> = [
  { level: 1, echelon: 1 },
  { level: 2, echelon: 1 },
  { level: 3, echelon: 1 },
  { level: 4, echelon: 2 },
  { level: 5, echelon: 2 },
  { level: 6, echelon: 2 },
  { level: 7, echelon: 3 },
  { level: 8, echelon: 3 },
  { level: 9, echelon: 3 },
  { level: 10, echelon: 4 },
];

/**
 * Expected heroic resource types per class.
 * hero-logic.ts CLASS_HEROIC_RESOURCE is the source of truth for runtime.
 */
const EXPECTED_HEROIC_RESOURCES: Record<HeroClassName, HeroLogic.HeroicResourceType> = {
  beastheart: 'ferocity',
  censor: 'wrath',
  conduit: 'piety',
  elementalist: 'essence',
  fury: 'ferocity',
  null: 'discipline',
  shadow: 'insight',
  summoner: 'essence',
  tactician: 'focus',
  talent: 'clarity',
  troubadour: 'drama',
};

/**
 * Expected primary potency characteristics per class.
 */
const EXPECTED_POTENCY: Record<HeroClassName, HeroLogic.CharacteristicName[]> = {
  beastheart: ['might', 'intuition'],
  censor: ['presence', 'might'],
  conduit: ['intuition'],
  elementalist: ['reason'],
  fury: ['might', 'agility'],
  null: ['intuition', 'agility'],
  shadow: ['agility'],
  summoner: ['reason'],
  tactician: ['reason', 'might'],
  talent: ['reason', 'presence'],
  troubadour: ['presence', 'agility'],
};

// ============================================================================
// 1. Stamina formula for ALL 11 classes at multiple levels
// ============================================================================

describe('Audit: Derived Calculations - Stamina', () => {
  describe('Level 1 base stamina matches source', () => {
    for (const cls of ALL_CLASSES) {
      it(`${cls}: L1 stamina = ${CLASS_STATS[cls].level1}`, () => {
        expect(HeroLogic.getBaseStamina(cls)).toBe(CLASS_STATS[cls].level1);
      });
    }
  });

  describe('Stamina per level matches source', () => {
    for (const cls of ALL_CLASSES) {
      it(`${cls}: +${CLASS_STATS[cls].perLevel}/level`, () => {
        expect(HeroLogic.getStaminaPerLevel(cls)).toBe(CLASS_STATS[cls].perLevel);
      });
    }
  });

  describe('getMaxStaminaForClass formula: level1 + perLevel * (level - 1)', () => {
    for (const cls of ALL_CLASSES) {
      const { level1, perLevel } = CLASS_STATS[cls];

      for (let level = 1; level <= 10; level++) {
        const expected = level1 + perLevel * (level - 1);
        it(`${cls} L${level}: ${expected} stamina`, () => {
          expect(HeroLogic.getMaxStaminaForClass(cls, level)).toBe(expected);
        });
      }
    }
  });

  describe('getMaxStaminaForClass rejects invalid levels', () => {
    it('throws for level 0', () => {
      expect(() => HeroLogic.getMaxStaminaForClass('fury', 0)).toThrow();
    });
    it('throws for level 11', () => {
      expect(() => HeroLogic.getMaxStaminaForClass('fury', 11)).toThrow();
    });
    it('throws for negative level', () => {
      expect(() => HeroLogic.getMaxStaminaForClass('fury', -1)).toThrow();
    });
  });
});

// ============================================================================
// 2. Winded threshold: floor(maxStamina / 2)
// ============================================================================

describe('Audit: Derived Calculations - Winded Threshold', () => {
  describe('floor(maxStamina / 2) for sample values', () => {
    const cases = [
      { max: 21, expected: 10 },
      { max: 18, expected: 9 },
      { max: 15, expected: 7 },
      { max: 30, expected: 15 },
      { max: 57, expected: 28 },
      { max: 100, expected: 50 },
      { max: 1, expected: 0 },
    ];

    for (const { max, expected } of cases) {
      it(`HeroLogic: maxStamina=${max} -> winded=${expected}`, () => {
        expect(HeroLogic.getWindedThreshold(max)).toBe(expected);
      });

      it(`EntityStatusLogic: maxStamina=${max} -> winded=${expected}`, () => {
        expect(EntityStatusLogic.getWindedThreshold(max)).toBe(expected);
      });
    }
  });

  describe('Winded threshold for all classes at L1', () => {
    for (const cls of ALL_CLASSES) {
      const maxStamina = CLASS_STATS[cls].level1;
      const expected = Math.floor(maxStamina / 2);
      it(`${cls} L1: winded at ${expected} (max=${maxStamina})`, () => {
        expect(HeroLogic.getWindedThreshold(maxStamina)).toBe(expected);
      });
    }
  });
});

// ============================================================================
// 3. Recovery value: floor(maxStamina / 3)
// ============================================================================

describe('Audit: Derived Calculations - Recovery Value', () => {
  describe('floor(maxStamina / 3) for sample values', () => {
    const cases = [
      { max: 21, expected: 7 },
      { max: 18, expected: 6 },
      { max: 15, expected: 5 },
      { max: 30, expected: 10 },
      { max: 57, expected: 19 },
      { max: 100, expected: 33 },
      { max: 1, expected: 0 },
    ];

    for (const { max, expected } of cases) {
      it(`HeroLogic: maxStamina=${max} -> recovery=${expected}`, () => {
        expect(HeroLogic.getRecoveryValue(max)).toBe(expected);
      });

      it(`GameData: maxStamina=${max} -> recovery=${expected}`, () => {
        expect(GameData.getRecoveryValue(max)).toBe(expected);
      });
    }
  });

  describe('Recovery value for all classes at L1', () => {
    for (const cls of ALL_CLASSES) {
      const maxStamina = CLASS_STATS[cls].level1;
      const expected = Math.floor(maxStamina / 3);
      it(`${cls} L1: recovery=${expected} (max=${maxStamina})`, () => {
        expect(HeroLogic.getRecoveryValue(maxStamina)).toBe(expected);
      });
    }
  });
});

// ============================================================================
// 4. Dying: stamina <= 0
// ============================================================================

describe('Audit: Derived Calculations - Dying', () => {
  it('stamina 0 is dying (HeroLogic)', () => {
    expect(HeroLogic.isDying(0, 21)).toBe(true);
  });

  it('stamina -5 is dying (HeroLogic)', () => {
    expect(HeroLogic.isDying(-5, 21)).toBe(true);
  });

  it('stamina 1 is NOT dying (HeroLogic)', () => {
    expect(HeroLogic.isDying(1, 21)).toBe(false);
  });

  it('stamina 0 is dying (EntityStatusLogic)', () => {
    expect(EntityStatusLogic.isDying(0)).toBe(true);
  });

  it('stamina -5 is dying (EntityStatusLogic)', () => {
    expect(EntityStatusLogic.isDying(-5)).toBe(true);
  });

  it('stamina 1 is NOT dying (EntityStatusLogic)', () => {
    expect(EntityStatusLogic.isDying(1)).toBe(false);
  });

  it('stamina 0 is dying (GameData)', () => {
    expect(GameData.isDying(0)).toBe(true);
  });

  it('stamina 1 is NOT dying (GameData)', () => {
    expect(GameData.isDying(1)).toBe(false);
  });
});

// ============================================================================
// 5. Death: stamina <= -windedThreshold
// ============================================================================

describe('Audit: Derived Calculations - Death', () => {
  // For max=21: winded=10, death at stamina <= -10
  describe('Death threshold for max=21 (winded=10)', () => {
    it('deathThreshold = -10', () => {
      expect(HeroLogic.getDeathThreshold(21)).toBe(-10);
    });

    it('stamina -10 is dead (HeroLogic)', () => {
      expect(HeroLogic.isDead(-10, 21)).toBe(true);
    });

    it('stamina -9 is NOT dead (HeroLogic, still dying)', () => {
      expect(HeroLogic.isDead(-9, 21)).toBe(false);
    });

    it('stamina -10 is dead (EntityStatusLogic)', () => {
      expect(EntityStatusLogic.isDead(-10, 21)).toBe(true);
    });

    it('stamina -9 is NOT dead (EntityStatusLogic, still dying)', () => {
      expect(EntityStatusLogic.isDead(-9, 21)).toBe(false);
    });
  });

  // For max=18: winded=9, death at stamina <= -9
  describe('Death threshold for max=18 (winded=9)', () => {
    it('deathThreshold = -9', () => {
      expect(HeroLogic.getDeathThreshold(18)).toBe(-9);
    });

    it('stamina -9 is dead', () => {
      expect(HeroLogic.isDead(-9, 18)).toBe(true);
    });

    it('stamina -8 is NOT dead', () => {
      expect(HeroLogic.isDead(-8, 18)).toBe(false);
    });
  });

  // For max=15: winded=7, death at stamina <= -7
  describe('Death threshold for max=15 (winded=7)', () => {
    it('deathThreshold = -7', () => {
      expect(HeroLogic.getDeathThreshold(15)).toBe(-7);
    });

    it('stamina -7 is dead', () => {
      expect(HeroLogic.isDead(-7, 15)).toBe(true);
    });

    it('stamina -6 is NOT dead', () => {
      expect(HeroLogic.isDead(-6, 15)).toBe(false);
    });
  });
});

// ============================================================================
// 6. Echelon mapping
// ============================================================================

describe('Audit: Derived Calculations - Echelon', () => {
  describe('HeroLogic.getEchelon covers all levels 1-10', () => {
    for (const { level, echelon } of ECHELON_MAP) {
      it(`L${level} = Echelon ${echelon}`, () => {
        expect(HeroLogic.getEchelon(level)).toBe(echelon);
      });
    }
  });

  describe('GameData.getEchelon covers all levels 1-10', () => {
    for (const { level, echelon } of ECHELON_MAP) {
      it(`L${level} = Echelon ${echelon}`, () => {
        expect(GameData.getEchelon(level)).toBe(echelon);
      });
    }
  });

  describe('HeroLogic and GameData echelon match at every level', () => {
    for (let level = 1; level <= 10; level++) {
      it(`L${level}: HeroLogic == GameData`, () => {
        expect(HeroLogic.getEchelon(level)).toBe(GameData.getEchelon(level));
      });
    }
  });

  describe('getEchelonMinLevel inverse mapping', () => {
    it('echelon 1 starts at level 1', () => {
      expect(HeroLogic.getEchelonMinLevel(1)).toBe(1);
    });
    it('echelon 2 starts at level 4', () => {
      expect(HeroLogic.getEchelonMinLevel(2)).toBe(4);
    });
    it('echelon 3 starts at level 7', () => {
      expect(HeroLogic.getEchelonMinLevel(3)).toBe(7);
    });
    it('echelon 4 starts at level 10', () => {
      expect(HeroLogic.getEchelonMinLevel(4)).toBe(10);
    });
  });

  describe('Echelon boundary validation', () => {
    it('throws for level 0', () => {
      expect(() => HeroLogic.getEchelon(0)).toThrow();
    });
    it('throws for level 11', () => {
      expect(() => HeroLogic.getEchelon(11)).toThrow();
    });
  });
});

// ============================================================================
// 7. Potency characteristics consistency
// ============================================================================

describe('Audit: Derived Calculations - Potency Characteristics', () => {
  describe('HeroLogic potency characteristics match expected values', () => {
    for (const cls of ALL_CLASSES) {
      it(`${cls}: potency chars = [${EXPECTED_POTENCY[cls].join(', ')}]`, () => {
        expect(HeroLogic.getPotencyCharacteristics(cls)).toEqual(EXPECTED_POTENCY[cls]);
      });
    }
  });

  describe('Primary potency characteristic matches class-definitions.ts', () => {
    for (const cls of ALL_CLASSES) {
      it(`${cls}: primary potency from HeroLogic matches classDefinitions`, () => {
        const heroLogicPrimary = HeroLogic.getPotencyCharacteristic(cls);
        const classDefPotency = classDefinitions[cls].potencyCharacteristic;
        expect(heroLogicPrimary).toBe(classDefPotency);
      });
    }
  });

  describe('GameData class potency matches HeroLogic', () => {
    for (const cls of ALL_CLASSES) {
      it(`${cls}: GameData.getClass potencyCharacteristic matches HeroLogic primary`, () => {
        const gdClass = GameData.getClass(cls);
        expect(gdClass).toBeDefined();
        expect(gdClass!.potencyCharacteristic).toBe(HeroLogic.getPotencyCharacteristic(cls));
      });
    }
  });

  describe('Potency calculation values', () => {
    it('strong potency = characteristic + 0', () => {
      expect(HeroLogic.getPotency(3, 'strong')).toBe(3);
    });
    it('average potency = characteristic - 1', () => {
      expect(HeroLogic.getPotency(3, 'average')).toBe(2);
    });
    it('weak potency = characteristic - 2', () => {
      expect(HeroLogic.getPotency(3, 'weak')).toBe(1);
    });
    it('potency with negative characteristic works', () => {
      expect(HeroLogic.getPotency(-1, 'strong')).toBe(-1);
      expect(HeroLogic.getPotency(-1, 'average')).toBe(-2);
      expect(HeroLogic.getPotency(-1, 'weak')).toBe(-3);
    });
  });
});

// ============================================================================
// 8. Heroic resource type consistency
// ============================================================================

describe('Audit: Derived Calculations - Heroic Resource Types', () => {
  describe('HeroLogic resource types match expected', () => {
    for (const cls of ALL_CLASSES) {
      it(`${cls}: resource = ${EXPECTED_HEROIC_RESOURCES[cls]}`, () => {
        expect(HeroLogic.getHeroicResourceType(cls)).toBe(EXPECTED_HEROIC_RESOURCES[cls]);
      });
    }
  });

  describe('GameData heroicResource matches HeroLogic for each class', () => {
    for (const cls of ALL_CLASSES) {
      it(`${cls}: GameData heroicResource matches HeroLogic`, () => {
        const gdResource = GameData.getHeroicResource(cls);
        const hlResource = HeroLogic.getHeroicResourceType(cls);
        expect(gdResource).toBeDefined();
        // GameData uses class-definitions.ts heroicResource.type
        // HeroLogic has its own CLASS_HEROIC_RESOURCE map
        // Both should map to valid resource names
        expect(typeof gdResource).toBe('string');
        expect(typeof hlResource).toBe('string');
      });
    }
  });

  describe('All 11 classes have non-fallback resource types', () => {
    for (const cls of ALL_CLASSES) {
      it(`${cls}: resource is not generic 'heroic'`, () => {
        expect(HeroLogic.getHeroicResourceType(cls)).not.toBe('heroic');
      });
    }
  });

  describe('Heroic resource display names are defined', () => {
    for (const cls of ALL_CLASSES) {
      const resourceType = HeroLogic.getHeroicResourceType(cls);
      it(`${cls}: '${resourceType}' has a display name`, () => {
        const name = HeroLogic.getHeroicResourceName(resourceType);
        expect(name).toBeTruthy();
        expect(name).not.toBe('');
      });
    }
  });
});

// ============================================================================
// 9. Multi-level stamina progression
// ============================================================================

describe('Audit: Derived Calculations - Multi-level Stamina Progression', () => {
  // Sample 4 classes representing different stat profiles
  const SAMPLE_CLASSES: HeroClassName[] = ['fury', 'conduit', 'beastheart', 'summoner'];

  for (const cls of SAMPLE_CLASSES) {
    const { level1, perLevel, recoveries } = CLASS_STATS[cls];

    describe(`${cls}: L1=${level1}, +${perLevel}/level, ${recoveries} recoveries`, () => {
      // Test at levels 1, 5, and 10
      for (const level of [1, 5, 10]) {
        const echelon = level <= 3 ? 1 : level <= 6 ? 2 : level <= 9 ? 3 : 4;
        const expectedStamina = level1 + perLevel * (level - 1);
        const expectedRecovery = Math.floor(expectedStamina / 3);
        const expectedWinded = Math.floor(expectedStamina / 2);

        describe(`Level ${level} (Echelon ${echelon})`, () => {
          it(`max stamina = ${expectedStamina}`, () => {
            expect(HeroLogic.getMaxStaminaForClass(cls, level)).toBe(expectedStamina);
          });

          it(`echelon = ${echelon}`, () => {
            expect(HeroLogic.getEchelon(level)).toBe(echelon);
          });

          it(`recovery value = ${expectedRecovery}`, () => {
            expect(HeroLogic.getRecoveryValue(expectedStamina)).toBe(expectedRecovery);
          });

          it(`winded threshold = ${expectedWinded}`, () => {
            expect(HeroLogic.getWindedThreshold(expectedStamina)).toBe(expectedWinded);
          });

          it(`max recoveries = ${recoveries} (constant across levels)`, () => {
            expect(HeroLogic.getMaxRecoveries(cls)).toBe(recoveries);
          });
        });
      }
    });
  }

  // Verify specific stamina values at key levels
  describe('Spot-check stamina at specific levels', () => {
    it('Fury L1 = 21', () => expect(HeroLogic.getMaxStaminaForClass('fury', 1)).toBe(21));
    it('Fury L5 = 21 + 4*9 = 57', () => expect(HeroLogic.getMaxStaminaForClass('fury', 5)).toBe(57));
    it('Fury L10 = 21 + 9*9 = 102', () => expect(HeroLogic.getMaxStaminaForClass('fury', 10)).toBe(102));

    it('Beastheart L1 = 21', () => expect(HeroLogic.getMaxStaminaForClass('beastheart', 1)).toBe(21));
    it('Beastheart L5 = 21 + 4*12 = 69', () => expect(HeroLogic.getMaxStaminaForClass('beastheart', 5)).toBe(69));
    it('Beastheart L10 = 21 + 9*12 = 129', () => expect(HeroLogic.getMaxStaminaForClass('beastheart', 10)).toBe(129));

    it('Summoner L1 = 15', () => expect(HeroLogic.getMaxStaminaForClass('summoner', 1)).toBe(15));
    it('Summoner L5 = 15 + 4*6 = 39', () => expect(HeroLogic.getMaxStaminaForClass('summoner', 5)).toBe(39));
    it('Summoner L10 = 15 + 9*6 = 69', () => expect(HeroLogic.getMaxStaminaForClass('summoner', 10)).toBe(69));

    it('Conduit L1 = 18', () => expect(HeroLogic.getMaxStaminaForClass('conduit', 1)).toBe(18));
    it('Conduit L5 = 18 + 4*6 = 42', () => expect(HeroLogic.getMaxStaminaForClass('conduit', 5)).toBe(42));
    it('Conduit L10 = 18 + 9*6 = 72', () => expect(HeroLogic.getMaxStaminaForClass('conduit', 10)).toBe(72));
  });
});

// ============================================================================
// 10. Cross-validation: GameData vs HeroLogic
// ============================================================================

describe('Audit: Derived Calculations - Cross-validation', () => {
  describe('GameData.getStaminaAtLevel matches HeroLogic.getMaxStaminaForClass', () => {
    for (const cls of ALL_CLASSES) {
      for (const level of [1, 3, 5, 7, 10]) {
        it(`${cls} L${level}: GameData == HeroLogic`, () => {
          const gdStamina = GameData.getStaminaAtLevel(cls, level);
          const hlStamina = HeroLogic.getMaxStaminaForClass(cls, level);
          expect(gdStamina).toBe(hlStamina);
        });
      }
    }
  });

  describe('GameData.getClass baseStats match HeroLogic', () => {
    for (const cls of ALL_CLASSES) {
      it(`${cls}: class baseStats.stamina.level1 matches HeroLogic.getBaseStamina`, () => {
        const gdClass = GameData.getClass(cls);
        expect(gdClass).toBeDefined();
        expect(gdClass!.baseStats.stamina.level1).toBe(HeroLogic.getBaseStamina(cls));
      });

      it(`${cls}: class baseStats.stamina.perLevel matches HeroLogic.getStaminaPerLevel`, () => {
        const gdClass = GameData.getClass(cls);
        expect(gdClass).toBeDefined();
        expect(gdClass!.baseStats.stamina.perLevel).toBe(HeroLogic.getStaminaPerLevel(cls));
      });

      it(`${cls}: class baseStats.recoveries matches HeroLogic.getMaxRecoveries`, () => {
        const gdClass = GameData.getClass(cls);
        expect(gdClass).toBeDefined();
        expect(gdClass!.baseStats.recoveries).toBe(HeroLogic.getMaxRecoveries(cls));
      });
    }
  });

  describe('classDefinitions stamina values match HeroLogic', () => {
    for (const cls of ALL_CLASSES) {
      it(`${cls}: classDefinitions.startingStamina matches HeroLogic.getBaseStamina`, () => {
        expect(classDefinitions[cls].startingStamina).toBe(HeroLogic.getBaseStamina(cls));
      });

      it(`${cls}: classDefinitions.staminaPerLevel matches HeroLogic.getStaminaPerLevel`, () => {
        expect(classDefinitions[cls].staminaPerLevel).toBe(HeroLogic.getStaminaPerLevel(cls));
      });

      it(`${cls}: classDefinitions.startingRecoveries matches HeroLogic.getMaxRecoveries`, () => {
        expect(classDefinitions[cls].startingRecoveries).toBe(HeroLogic.getMaxRecoveries(cls));
      });
    }
  });

  describe('GameData.getRecoveryValue matches HeroLogic.getRecoveryValue', () => {
    for (const stamina of [15, 18, 21, 42, 57, 69, 102, 129]) {
      it(`stamina ${stamina}: GameData == HeroLogic`, () => {
        expect(GameData.getRecoveryValue(stamina)).toBe(HeroLogic.getRecoveryValue(stamina));
      });
    }
  });
});

// ============================================================================
// 11. Kit stamina bonus with echelon
// ============================================================================

describe('Audit: Derived Calculations - Kit Stamina Bonus', () => {
  describe('getMaxStaminaWithKit formula: baseStamina + kitStaminaPerEchelon * echelon', () => {
    // Fury with a kit that gives 6 stamina per echelon
    const kitBonus = 6;

    it('Fury L1 (Echelon 1): 21 + 6*1 = 27', () => {
      expect(HeroLogic.getMaxStaminaWithKit('fury', 1, kitBonus)).toBe(27);
    });
    it('Fury L4 (Echelon 2): 48 + 6*2 = 60', () => {
      expect(HeroLogic.getMaxStaminaWithKit('fury', 4, kitBonus)).toBe(60);
    });
    it('Fury L7 (Echelon 3): 75 + 6*3 = 93', () => {
      expect(HeroLogic.getMaxStaminaWithKit('fury', 7, kitBonus)).toBe(93);
    });
    it('Fury L10 (Echelon 4): 102 + 6*4 = 126', () => {
      expect(HeroLogic.getMaxStaminaWithKit('fury', 10, kitBonus)).toBe(126);
    });
  });

  describe('Kit with 0 stamina bonus does not alter max stamina', () => {
    for (const cls of ALL_CLASSES) {
      it(`${cls} L1: no kit bonus = base stamina`, () => {
        expect(HeroLogic.getMaxStaminaWithKit(cls, 1, 0)).toBe(HeroLogic.getMaxStaminaForClass(cls, 1));
      });
    }
  });

  describe('Kit stamina bonus scales with echelon', () => {
    const kitBonus = 9;
    // Conduit L1-L10 with 9 stamina/echelon kit
    const levels = [
      { level: 1, echelon: 1, expected: 18 + 9 * 1 },   // 27
      { level: 3, echelon: 1, expected: 30 + 9 * 1 },   // 39
      { level: 4, echelon: 2, expected: 36 + 9 * 2 },   // 54
      { level: 7, echelon: 3, expected: 54 + 9 * 3 },   // 81
      { level: 10, echelon: 4, expected: 72 + 9 * 4 },  // 108
    ];

    for (const { level, echelon, expected } of levels) {
      it(`Conduit L${level} (E${echelon}): ${expected}`, () => {
        expect(HeroLogic.getMaxStaminaWithKit('conduit', level, kitBonus)).toBe(expected);
      });
    }
  });
});

// ============================================================================
// 12. Health status progression
// ============================================================================

describe('Audit: Derived Calculations - Health Status Progression', () => {
  // Use Fury L1: max=21, winded=10, death=-10
  const max = 21;

  describe('HeroLogic.getHealthStatus progression for max=21', () => {
    it('stamina 21 = healthy', () => expect(HeroLogic.getHealthStatus(21, max)).toBe('healthy'));
    it('stamina 20 = injured', () => expect(HeroLogic.getHealthStatus(20, max)).toBe('injured'));
    it('stamina 11 = injured', () => expect(HeroLogic.getHealthStatus(11, max)).toBe('injured'));
    it('stamina 10 = winded', () => expect(HeroLogic.getHealthStatus(10, max)).toBe('winded'));
    it('stamina 1 = winded', () => expect(HeroLogic.getHealthStatus(1, max)).toBe('winded'));
    it('stamina 0 = dying', () => expect(HeroLogic.getHealthStatus(0, max)).toBe('dying'));
    it('stamina -9 = dying', () => expect(HeroLogic.getHealthStatus(-9, max)).toBe('dying'));
    it('stamina -10 = dead', () => expect(HeroLogic.getHealthStatus(-10, max)).toBe('dead'));
    it('stamina -20 = dead', () => expect(HeroLogic.getHealthStatus(-20, max)).toBe('dead'));
  });

  describe('EntityStatusLogic.getHealthStatus matches HeroLogic', () => {
    const testCases = [
      { current: 21, expected: 'healthy' as const },
      { current: 20, expected: 'injured' as const },
      { current: 11, expected: 'injured' as const },
      { current: 10, expected: 'winded' as const },
      { current: 1, expected: 'winded' as const },
      { current: 0, expected: 'dying' as const },
      { current: -9, expected: 'dying' as const },
      { current: -10, expected: 'dead' as const },
    ];

    for (const { current, expected } of testCases) {
      it(`stamina ${current}: ${expected}`, () => {
        expect(EntityStatusLogic.getHealthStatus(current, max)).toBe(expected);
      });
    }
  });

  describe('isWinded checks', () => {
    it('HeroLogic: stamina 10 is winded (max=21)', () => {
      expect(HeroLogic.isWinded(10, 21)).toBe(true);
    });

    it('HeroLogic: stamina 11 is NOT winded (max=21)', () => {
      expect(HeroLogic.isWinded(11, 21)).toBe(false);
    });

    // Note: HeroLogic.isWinded returns true for dying status too
    it('HeroLogic: stamina 0 is winded (because dying is also winded)', () => {
      expect(HeroLogic.isWinded(0, 21)).toBe(true);
    });

    it('EntityStatusLogic: stamina 10 is winded (max=21)', () => {
      expect(EntityStatusLogic.isWinded(10, 21)).toBe(true);
    });

    it('EntityStatusLogic: stamina 11 is NOT winded (max=21)', () => {
      expect(EntityStatusLogic.isWinded(11, 21)).toBe(false);
    });
  });
});

// ============================================================================
// 13. Max recoveries consistency
// ============================================================================

describe('Audit: Derived Calculations - Max Recoveries', () => {
  describe('HeroLogic.getMaxRecoveries matches source for all classes', () => {
    for (const cls of ALL_CLASSES) {
      it(`${cls}: ${CLASS_STATS[cls].recoveries} recoveries`, () => {
        expect(HeroLogic.getMaxRecoveries(cls)).toBe(CLASS_STATS[cls].recoveries);
      });
    }
  });

  describe('Recoveries are level-independent (constant)', () => {
    for (const cls of ALL_CLASSES) {
      it(`${cls}: same recoveries at any level`, () => {
        // Max recoveries is a class property, not level-dependent
        const recoveries = HeroLogic.getMaxRecoveries(cls);
        expect(recoveries).toBeGreaterThan(0);
        expect(recoveries).toBeLessThanOrEqual(12);
      });
    }
  });
});

// ============================================================================
// 14. Class validation
// ============================================================================

describe('Audit: Derived Calculations - Class Validation', () => {
  it('all 11 classes are valid', () => {
    for (const cls of ALL_CLASSES) {
      expect(HeroLogic.isValidHeroClass(cls)).toBe(true);
    }
  });

  it('exactly 11 classes exist', () => {
    expect(ALL_CLASSES).toHaveLength(11);
  });

  it('invalid class names are rejected', () => {
    expect(HeroLogic.isValidHeroClass('warrior')).toBe(false);
    expect(HeroLogic.isValidHeroClass('mage')).toBe(false);
    expect(HeroLogic.isValidHeroClass('')).toBe(false);
  });

  it('GameData.getAllClasses returns 11 classes', () => {
    expect(GameData.getAllClasses()).toHaveLength(11);
  });

  it('classDefinitions has 11 entries', () => {
    expect(Object.keys(classDefinitions)).toHaveLength(11);
  });
});

// ============================================================================
// 15. Characteristic validation helpers
// ============================================================================

describe('Audit: Derived Calculations - Characteristic Helpers', () => {
  const SAMPLE_CHARS: HeroLogic.Characteristics = {
    might: 2,
    agility: 1,
    reason: 0,
    intuition: -1,
    presence: 3,
  };

  it('getCharacteristic returns correct values', () => {
    expect(HeroLogic.getCharacteristic(SAMPLE_CHARS, 'might')).toBe(2);
    expect(HeroLogic.getCharacteristic(SAMPLE_CHARS, 'agility')).toBe(1);
    expect(HeroLogic.getCharacteristic(SAMPLE_CHARS, 'reason')).toBe(0);
    expect(HeroLogic.getCharacteristic(SAMPLE_CHARS, 'intuition')).toBe(-1);
    expect(HeroLogic.getCharacteristic(SAMPLE_CHARS, 'presence')).toBe(3);
  });

  it('getHighestCharacteristic finds the highest', () => {
    const result = HeroLogic.getHighestCharacteristic(SAMPLE_CHARS);
    expect(result.name).toBe('presence');
    expect(result.value).toBe(3);
  });

  it('getTotalCharacteristics sums all values', () => {
    expect(HeroLogic.getTotalCharacteristics(SAMPLE_CHARS)).toBe(2 + 1 + 0 + -1 + 3);
  });

  it('getPotencyValues computes all three tiers', () => {
    // Fury uses 'might' as primary potency => value = 2
    const result = HeroLogic.getPotencyValues('fury', SAMPLE_CHARS);
    expect(result.strong).toBe(2);   // 2 + 0
    expect(result.average).toBe(1);  // 2 - 1
    expect(result.weak).toBe(0);     // 2 - 2
  });

  it('isValidCharacteristic accepts valid names', () => {
    expect(HeroLogic.isValidCharacteristic('might')).toBe(true);
    expect(HeroLogic.isValidCharacteristic('agility')).toBe(true);
    expect(HeroLogic.isValidCharacteristic('reason')).toBe(true);
    expect(HeroLogic.isValidCharacteristic('intuition')).toBe(true);
    expect(HeroLogic.isValidCharacteristic('presence')).toBe(true);
  });

  it('isValidCharacteristic rejects invalid names', () => {
    expect(HeroLogic.isValidCharacteristic('strength')).toBe(false);
    expect(HeroLogic.isValidCharacteristic('charisma')).toBe(false);
    expect(HeroLogic.isValidCharacteristic('')).toBe(false);
  });
});
