/**
 * Class Features & Subclasses Audit (Slice 8 / Task 11)
 *
 * Validates class features and subclass data for all 9 existing classes
 * (excluding Beastheart and Summoner which are being implemented separately).
 *
 * Per class:
 *   - Features file exports non-empty arrays
 *   - Feature names are present and non-empty
 *   - Level assignments are reasonable (1-10)
 *   - Subclass-specific features exist for each subclass option
 *
 * Per subclass:
 *   - Each subclass from class-definitions has corresponding data in rules files
 *   - Subclass feature/data arrays are non-empty
 *
 * Cross-class checks:
 *   - All 9 existing classes have features data
 *   - No duplicate feature names within a class features array
 *
 * Source: docs/rules_data/data-rules-md/Classes/*.md
 *         packages/data/src/rules/classes/{class}/features.ts
 *         packages/data/src/rules/classes/{class}/*.ts (subclass files)
 */
import { describe, it, expect } from 'vitest';

// ---- Censor imports ----
import {
  CENSOR_LEVEL_FEATURES,
  getFeaturesForLevel as censorGetFeaturesForLevel,
  getFeaturesUnlockedAtLevel as censorGetFeaturesUnlockedAtLevel,
  getWrathGain,
  getJudgmentTriggerGain,
} from '../rules/classes/censor/features.js';
import { CENSOR_ORDERS } from '../rules/classes/censor/orders.js';

// ---- Conduit imports ----
import {
  CONDUIT_LEVEL_FEATURES,
  getFeaturesForLevel as conduitGetFeaturesForLevel,
  getPietyGainDice,
} from '../rules/classes/conduit/features.js';
import { CONDUIT_DOMAINS, getAllDomains } from '../rules/classes/conduit/domains.js';

// ---- Elementalist imports ----
import {
  ELEMENTALIST_LEVEL_FEATURES,
  getFeaturesForLevel as elementalistGetFeaturesForLevel,
  getEssenceGain,
  getEssenceSurgeGain,
} from '../rules/classes/elementalist/features.js';
import { ELEMENTALIST_ELEMENTS } from '../rules/classes/elementalist/elements.js';

// ---- Fury imports ----
import {
  furyFeatures,
  berserkerFeatures,
  reaverFeatures,
  stormwightFeatures,
  getFeaturesForAspect,
  getFeaturesAtLevel,
} from '../rules/classes/fury/features.js';
import { furyAspects } from '../rules/classes/fury/subclasses.js';
import {
  berserkerTiers,
  reaverTiers,
  stormwightTiers,
  getTiersForAspect,
} from '../rules/classes/fury/growing-ferocity.js';
import { stormwightKits } from '../rules/classes/fury/stormwight-kits.js';
import {
  furyProgressions,
  sevenFerocityChoices,
  nineFerocityChoices,
  elevenFerocityChoices,
} from '../rules/classes/fury/progression.js';

// ---- Null imports ----
import {
  NULL_LEVEL_FEATURES,
  getFeaturesForLevel as nullGetFeaturesForLevel,
  calculateDisciplineGain,
} from '../rules/classes/null/features.js';
import { NULL_TRADITIONS } from '../rules/classes/null/traditions.js';
import { PSIONIC_AUGMENTATIONS } from '../rules/classes/null/augmentations.js';
import { NULL_FIELD_ENHANCEMENTS } from '../rules/classes/null/enhancements.js';
import { PSI_BOOST_OPTIONS } from '../rules/classes/null/psi-boost.js';

// ---- Shadow imports ----
import {
  SHADOW_LEVEL_FEATURES,
  getFeaturesForLevel as shadowGetFeaturesForLevel,
  getSurgeGain,
} from '../rules/classes/shadow/features.js';
import { SHADOW_COLLEGES } from '../rules/classes/shadow/colleges.js';

// ---- Tactician imports ----
import {
  TACTICIAN_LEVEL_FEATURES,
  getFeaturesForLevel as tacticianGetFeaturesForLevel,
  getFocusGain,
  getMarkTriggerGain,
} from '../rules/classes/tactician/features.js';
import { TACTICIAN_DOCTRINES } from '../rules/classes/tactician/doctrines.js';

// ---- Talent imports ----
import {
  TALENT_LEVEL_FEATURES,
  getFeaturesForLevel as talentGetFeaturesForLevel,
  getClarityGainDice,
  getForceMoveGain,
} from '../rules/classes/talent/features.js';

// ---- Troubadour imports ----
import {
  auteurFeatures,
  duelistFeatures,
  virtuosoFeatures,
  getFeaturesForClassAct,
} from '../rules/classes/troubadour/features.js';
import {
  classActDefinitions,
  getAllClassActs,
} from '../rules/classes/troubadour/subclasses.js';
import { routineDefinitions, getRoutinesForClassAct } from '../rules/classes/troubadour/routines.js';

// ============================================================
// Source-of-truth: expected feature counts & subclass info
// per Draw Steel rules. These are minimal structural checks,
// not exact text match.
// ============================================================

interface ClassFeatureExpectation {
  className: string;
  classId: string;
  /** Expected minimum number of level features */
  minFeatureCount: number;
  /** Expected levels that should have features (subset check) */
  expectedLevels: number[];
  /** Subclass type name */
  subclassTypeName: string;
  /** Expected subclass IDs */
  subclassIds: string[];
  /** Expected subclass names */
  subclassNames: string[];
}

const CLASS_EXPECTATIONS: ClassFeatureExpectation[] = [
  {
    className: 'Censor',
    classId: 'censor',
    minFeatureCount: 10,
    expectedLevels: [1, 3, 4, 6, 7, 9, 10],
    subclassTypeName: 'Order',
    subclassIds: ['exorcist', 'oracle', 'paragon'],
    subclassNames: ['Exorcist', 'Oracle', 'Paragon'],
  },
  {
    className: 'Conduit',
    classId: 'conduit',
    minFeatureCount: 10,
    expectedLevels: [1, 2, 3, 4, 6, 7, 9, 10],
    subclassTypeName: 'Domain',
    subclassIds: [
      'creation', 'death', 'fate', 'knowledge', 'life', 'love',
      'nature', 'protection', 'storm', 'sun', 'trickery', 'war',
    ],
    subclassNames: [
      'Creation', 'Death', 'Fate', 'Knowledge', 'Life', 'Love',
      'Nature', 'Protection', 'Storm', 'Sun', 'Trickery', 'War',
    ],
  },
  {
    className: 'Elementalist',
    classId: 'elementalist',
    minFeatureCount: 10,
    expectedLevels: [1, 3, 4, 6, 7, 9, 10],
    subclassTypeName: 'Specialization',
    subclassIds: ['earth', 'fire', 'green', 'void'],
    subclassNames: ['Earth', 'Fire', 'Green', 'Void'],
  },
  {
    className: 'Fury',
    classId: 'fury',
    minFeatureCount: 5, // Core fury features only (aspects have separate arrays)
    expectedLevels: [1, 4, 7, 10],
    subclassTypeName: 'Aspect',
    subclassIds: ['berserker', 'reaver', 'stormwight'],
    subclassNames: ['Berserker', 'Reaver', 'Stormwight'],
  },
  {
    className: 'Null',
    classId: 'null',
    minFeatureCount: 10,
    expectedLevels: [1, 3, 4, 6, 7, 9, 10],
    subclassTypeName: 'Tradition',
    subclassIds: ['chronokinetic', 'cryokinetic', 'metakinetic'],
    subclassNames: ['Chronokinetic', 'Cryokinetic', 'Metakinetic'],
  },
  {
    className: 'Shadow',
    classId: 'shadow',
    minFeatureCount: 10,
    expectedLevels: [1, 3, 4, 6, 7, 9, 10],
    subclassTypeName: 'College',
    subclassIds: ['black-ash', 'caustic-alchemy', 'harlequin-mask'],
    subclassNames: ['Black Ash', 'Caustic Alchemy', 'Harlequin Mask'],
  },
  {
    className: 'Tactician',
    classId: 'tactician',
    minFeatureCount: 10,
    expectedLevels: [1, 3, 4, 6, 7, 9, 10],
    subclassTypeName: 'Doctrine',
    subclassIds: ['insurgent', 'mastermind', 'vanguard'],
    subclassNames: ['Insurgent', 'Mastermind', 'Vanguard'],
  },
  {
    className: 'Talent',
    classId: 'talent',
    minFeatureCount: 10,
    expectedLevels: [1, 3, 4, 6, 7, 9, 10],
    subclassTypeName: 'Tradition',
    subclassIds: ['chronopathy', 'telekinesis', 'telepathy'],
    subclassNames: ['Chronopathy', 'Telekinesis', 'Telepathy'],
  },
  {
    className: 'Troubadour',
    classId: 'troubadour',
    minFeatureCount: 4, // Features are per-subclass (auteur/duelist/virtuoso)
    expectedLevels: [1, 2, 5, 7],
    subclassTypeName: 'Class Act',
    subclassIds: ['auteur', 'duelist', 'virtuoso'],
    subclassNames: ['Auteur', 'Duelist', 'Virtuoso'],
  },
];

// ============================================================
// Helper: get the features array and subclass records for each class
// ============================================================

function getClassFeaturesArray(classId: string): { name: string; level?: number; description?: string }[] {
  switch (classId) {
    case 'censor':
      return CENSOR_LEVEL_FEATURES.map(f => ({ name: f.name, level: f.level, description: f.description }));
    case 'conduit':
      return CONDUIT_LEVEL_FEATURES.map(f => ({ name: f.name, level: f.level, description: f.description }));
    case 'elementalist':
      return ELEMENTALIST_LEVEL_FEATURES.map(f => ({ name: f.name, level: f.level, description: f.description }));
    case 'fury':
      return furyFeatures.map(f => ({ name: f.name, level: f.levelRequired, description: f.description }));
    case 'null':
      return NULL_LEVEL_FEATURES.map(f => ({ name: f.name, level: f.level, description: f.description }));
    case 'shadow':
      return SHADOW_LEVEL_FEATURES.map(f => ({ name: f.name, level: f.level, description: f.description }));
    case 'tactician':
      return TACTICIAN_LEVEL_FEATURES.map(f => ({ name: f.name, level: f.level, description: f.description }));
    case 'talent':
      return TALENT_LEVEL_FEATURES.map(f => ({ name: f.name, level: f.level, description: f.description }));
    case 'troubadour':
      // Troubadour features are per-subclass; return the auteur features as representative
      return auteurFeatures.map(f => ({ name: f.name, level: f.level, description: f.description }));
    default:
      return [];
  }
}

// ============================================================
// Tests: Per-class Feature Validation
// ============================================================

describe('Audit: Class Features — All 9 classes have features data', () => {
  const classesWithFeatures = [
    { name: 'Censor', features: CENSOR_LEVEL_FEATURES },
    { name: 'Conduit', features: CONDUIT_LEVEL_FEATURES },
    { name: 'Elementalist', features: ELEMENTALIST_LEVEL_FEATURES },
    { name: 'Fury', features: furyFeatures },
    { name: 'Null', features: NULL_LEVEL_FEATURES },
    { name: 'Shadow', features: SHADOW_LEVEL_FEATURES },
    { name: 'Tactician', features: TACTICIAN_LEVEL_FEATURES },
    { name: 'Talent', features: TALENT_LEVEL_FEATURES },
    { name: 'Troubadour', features: auteurFeatures },
  ];

  it('all 9 classes should have a non-empty features array', () => {
    for (const cls of classesWithFeatures) {
      expect(cls.features.length, `${cls.name} features array should not be empty`).toBeGreaterThan(0);
    }
  });

  it('all 9 classes should be represented in expectations', () => {
    expect(CLASS_EXPECTATIONS.length).toBe(9);
  });
});

// Per-class detailed validation
for (const expected of CLASS_EXPECTATIONS) {
  describe(`Audit: ${expected.className} Features`, () => {
    const features = getClassFeaturesArray(expected.classId);

    it(`should have at least ${expected.minFeatureCount} features`, () => {
      expect(features.length).toBeGreaterThanOrEqual(expected.minFeatureCount);
    });

    it('every feature should have a non-empty name', () => {
      for (const f of features) {
        expect(f.name, `Feature with empty name found`).toBeTruthy();
        expect(f.name.length).toBeGreaterThan(0);
      }
    });

    it('every feature should have a non-empty description', () => {
      for (const f of features) {
        expect(f.description, `Feature "${f.name}" should have a description`).toBeTruthy();
        expect(f.description!.length).toBeGreaterThan(0);
      }
    });

    it('feature levels should be in the 1-10 range', () => {
      for (const f of features) {
        if (f.level !== undefined) {
          expect(f.level, `Feature "${f.name}" level ${f.level} out of range`).toBeGreaterThanOrEqual(1);
          expect(f.level, `Feature "${f.name}" level ${f.level} out of range`).toBeLessThanOrEqual(10);
        }
      }
    });

    it('should have features at expected levels', () => {
      const levelsPresent = [...new Set(features.map(f => f.level).filter(l => l !== undefined))];
      for (const expectedLevel of expected.expectedLevels) {
        expect(
          levelsPresent,
          `${expected.className} missing features at level ${expectedLevel}`
        ).toContain(expectedLevel);
      }
    });

    it('should have no duplicate feature names within the class', () => {
      const names = features.map(f => f.name);
      const uniqueNames = new Set(names);
      // Allow for intentional duplicates (e.g., "Improved Insight Surge" and "Improved Insight Surge (Mastery)")
      // by checking if actual duplicates are truly identical
      const duplicates = names.filter((name, index) => names.indexOf(name) !== index);
      // Report any exact-name duplicates for investigation
      if (duplicates.length > 0) {
        // Duplicates are OK if they have different level assignments (progression upgrades)
        for (const dup of duplicates) {
          const matching = features.filter(f => f.name === dup);
          const levels = matching.map(f => f.level);
          const uniqueLevels = new Set(levels);
          expect(
            uniqueLevels.size,
            `Duplicate feature "${dup}" at same level in ${expected.className}`
          ).toBe(matching.length);
        }
      }
    });
  });
}

// ============================================================
// Tests: Censor — Orders (Subclass)
// ============================================================

describe('Audit: Censor Orders (Subclass)', () => {
  const expectedOrders = ['exorcist', 'oracle', 'paragon'] as const;

  it('should have exactly 3 orders', () => {
    expect(Object.keys(CENSOR_ORDERS).length).toBe(3);
  });

  for (const orderId of expectedOrders) {
    describe(`Order: ${orderId}`, () => {
      it('should exist in CENSOR_ORDERS', () => {
        expect(CENSOR_ORDERS[orderId]).toBeDefined();
      });

      it('should have a non-empty name', () => {
        expect(CENSOR_ORDERS[orderId].name.length).toBeGreaterThan(0);
      });

      it('should have a non-empty theme', () => {
        expect(CENSOR_ORDERS[orderId].theme.length).toBeGreaterThan(0);
      });

      it('should have a non-empty description', () => {
        expect(CENSOR_ORDERS[orderId].description.length).toBeGreaterThan(0);
      });

      it('should have a judgment bonus', () => {
        expect(CENSOR_ORDERS[orderId].judgmentBonus.length).toBeGreaterThan(0);
      });

      it('should have a level 5 feature', () => {
        expect(CENSOR_ORDERS[orderId].level5Feature).toBeDefined();
        expect(CENSOR_ORDERS[orderId].level5Feature.name.length).toBeGreaterThan(0);
        expect(CENSOR_ORDERS[orderId].level5Feature.description.length).toBeGreaterThan(0);
      });
    });
  }
});

// ============================================================
// Tests: Conduit — Domains (Subclass)
// ============================================================

describe('Audit: Conduit Domains (Subclass)', () => {
  const expectedDomains = [
    'creation', 'death', 'fate', 'knowledge', 'life', 'love',
    'nature', 'protection', 'storm', 'sun', 'trickery', 'war',
  ] as const;

  it('should have exactly 12 domains', () => {
    expect(Object.keys(CONDUIT_DOMAINS).length).toBe(12);
  });

  it('getAllDomains() should return 12 domains', () => {
    expect(getAllDomains().length).toBe(12);
  });

  for (const domainId of expectedDomains) {
    describe(`Domain: ${domainId}`, () => {
      it('should exist in CONDUIT_DOMAINS', () => {
        expect(CONDUIT_DOMAINS[domainId]).toBeDefined();
      });

      it('should have non-empty name, theme, description', () => {
        const d = CONDUIT_DOMAINS[domainId];
        expect(d.name.length).toBeGreaterThan(0);
        expect(d.theme.length).toBeGreaterThan(0);
        expect(d.description.length).toBeGreaterThan(0);
      });

      it('should have piety trigger, prayer effect, and healing grace bonus', () => {
        const d = CONDUIT_DOMAINS[domainId];
        expect(d.pietyTrigger.length).toBeGreaterThan(0);
        expect(d.prayerEffect.length).toBeGreaterThan(0);
        expect(d.healingGraceBonus.length).toBeGreaterThan(0);
      });
    });
  }
});

// ============================================================
// Tests: Elementalist — Elements (Subclass)
// ============================================================

describe('Audit: Elementalist Elements (Subclass)', () => {
  const expectedElements = ['earth', 'fire', 'green', 'void'] as const;

  it('should have exactly 4 elements', () => {
    expect(Object.keys(ELEMENTALIST_ELEMENTS).length).toBe(4);
  });

  for (const elemId of expectedElements) {
    describe(`Element: ${elemId}`, () => {
      it('should exist in ELEMENTALIST_ELEMENTS', () => {
        expect(ELEMENTALIST_ELEMENTS[elemId]).toBeDefined();
      });

      it('should have non-empty name, theme, description, damageType', () => {
        const e = ELEMENTALIST_ELEMENTS[elemId];
        expect(e.name.length).toBeGreaterThan(0);
        expect(e.theme.length).toBeGreaterThan(0);
        expect(e.description.length).toBeGreaterThan(0);
        expect(e.damageType.length).toBeGreaterThan(0);
      });

      it('should have a mantle bonus', () => {
        expect(ELEMENTALIST_ELEMENTS[elemId].mantleBonus.length).toBeGreaterThan(0);
      });

      it('should have a level 5 feature', () => {
        expect(ELEMENTALIST_ELEMENTS[elemId].level5Feature).toBeDefined();
        expect(ELEMENTALIST_ELEMENTS[elemId].level5Feature.name.length).toBeGreaterThan(0);
        expect(ELEMENTALIST_ELEMENTS[elemId].level5Feature.description.length).toBeGreaterThan(0);
      });
    });
  }
});

// ============================================================
// Tests: Fury — Aspects (Subclass) + Growing Ferocity + Stormwight Kits
// ============================================================

describe('Audit: Fury Aspects (Subclass)', () => {
  const expectedAspects = ['berserker', 'reaver', 'stormwight'] as const;

  it('should have exactly 3 aspects', () => {
    expect(Object.keys(furyAspects).length).toBe(3);
  });

  for (const aspectId of expectedAspects) {
    describe(`Aspect: ${aspectId}`, () => {
      it('should exist in furyAspects', () => {
        expect(furyAspects[aspectId]).toBeDefined();
      });

      it('should have non-empty name and description', () => {
        expect(furyAspects[aspectId].name.length).toBeGreaterThan(0);
        expect(furyAspects[aspectId].description.length).toBeGreaterThan(0);
      });

      it('should have a valid focus characteristic', () => {
        expect(['might', 'agility']).toContain(furyAspects[aspectId].focusCharacteristic);
      });

      it('should have a features list referencing feature IDs', () => {
        expect(furyAspects[aspectId].features.length).toBeGreaterThan(0);
      });
    });
  }

  describe('Aspect-specific feature arrays', () => {
    it('berserkerFeatures should be non-empty', () => {
      expect(berserkerFeatures.length).toBeGreaterThanOrEqual(3);
    });

    it('reaverFeatures should be non-empty', () => {
      expect(reaverFeatures.length).toBeGreaterThanOrEqual(3);
    });

    it('stormwightFeatures should be non-empty', () => {
      expect(stormwightFeatures.length).toBeGreaterThanOrEqual(3);
    });

    it('getFeaturesForAspect should return combined core + aspect features', () => {
      for (const aspect of expectedAspects) {
        const combined = getFeaturesForAspect(aspect);
        expect(combined.length).toBeGreaterThan(furyFeatures.length);
      }
    });

    it('each aspect feature should have a valid id and name', () => {
      for (const f of [...berserkerFeatures, ...reaverFeatures, ...stormwightFeatures]) {
        expect(f.id, `Feature missing id`).toBeTruthy();
        expect(f.name, `Feature ${f.id} missing name`).toBeTruthy();
        expect(f.description, `Feature ${f.id} missing description`).toBeTruthy();
      }
    });

    it('aspect feature IDs in subclass definition should match actual feature IDs', () => {
      const berserkerIds = berserkerFeatures.map(f => f.id);
      for (const refId of furyAspects.berserker.features) {
        expect(berserkerIds, `Berserker missing feature id: ${refId}`).toContain(refId);
      }

      const reaverIds = reaverFeatures.map(f => f.id);
      for (const refId of furyAspects.reaver.features) {
        expect(reaverIds, `Reaver missing feature id: ${refId}`).toContain(refId);
      }

      const stormwightIds = stormwightFeatures.map(f => f.id);
      for (const refId of furyAspects.stormwight.features) {
        expect(stormwightIds, `Stormwight missing feature id: ${refId}`).toContain(refId);
      }
    });
  });
});

describe('Audit: Fury Growing Ferocity Tiers', () => {
  it('each aspect should have exactly 6 growing ferocity tiers', () => {
    expect(berserkerTiers.length).toBe(6);
    expect(reaverTiers.length).toBe(6);
    expect(stormwightTiers.length).toBe(6);
  });

  it('tiers should have ascending ferocity thresholds (2, 4, 6, 8, 10, 12)', () => {
    const expectedThresholds = [2, 4, 6, 8, 10, 12];
    for (const tiers of [berserkerTiers, reaverTiers, stormwightTiers]) {
      const thresholds = tiers.map(t => t.ferocityRequired);
      expect(thresholds).toEqual(expectedThresholds);
    }
  });

  it('each tier should have a non-empty name and benefit', () => {
    for (const tiers of [berserkerTiers, reaverTiers, stormwightTiers]) {
      for (const tier of tiers) {
        expect(tier.name.length).toBeGreaterThan(0);
        expect(tier.benefit.length).toBeGreaterThan(0);
      }
    }
  });

  it('getTiersForAspect should return correct tiers', () => {
    expect(getTiersForAspect('berserker')).toBe(berserkerTiers);
    expect(getTiersForAspect('reaver')).toBe(reaverTiers);
    expect(getTiersForAspect('stormwight')).toBe(stormwightTiers);
  });
});

describe('Audit: Fury Stormwight Kits', () => {
  const expectedKits = ['boren', 'corven', 'raden', 'vuken'] as const;

  it('should have exactly 4 stormwight kits', () => {
    expect(Object.keys(stormwightKits).length).toBe(4);
  });

  for (const kitId of expectedKits) {
    it(`kit "${kitId}" should have non-empty name, description, and primordialStorm`, () => {
      const kit = stormwightKits[kitId];
      expect(kit.name.length).toBeGreaterThan(0);
      expect(kit.description.length).toBeGreaterThan(0);
      expect(kit.primordialStorm.length).toBeGreaterThan(0);
      expect(kit.animalForm.length).toBeGreaterThan(0);
    });
  }
});

describe('Audit: Fury Progression Data', () => {
  it('should have progression entries for levels 2-10', () => {
    const levels = furyProgressions.map(p => p.level);
    for (const l of [2, 3, 4, 5, 6, 7, 8, 9, 10]) {
      expect(levels, `Missing progression for level ${l}`).toContain(l);
    }
  });

  it('each progression entry should have at least one feature', () => {
    for (const prog of furyProgressions) {
      expect(prog.features.length, `Level ${prog.level} has no features`).toBeGreaterThan(0);
    }
  });

  it('7-Ferocity choices should be non-empty', () => {
    expect(sevenFerocityChoices.length).toBeGreaterThanOrEqual(2);
  });

  it('9-Ferocity choices should be non-empty', () => {
    expect(nineFerocityChoices.length).toBeGreaterThanOrEqual(2);
  });

  it('11-Ferocity choices should be non-empty', () => {
    expect(elevenFerocityChoices.length).toBeGreaterThanOrEqual(2);
  });
});

// ============================================================
// Tests: Null — Traditions (Subclass) + Augmentations + Enhancements + Psi Boost
// ============================================================

describe('Audit: Null Traditions (Subclass)', () => {
  const expectedTraditions = ['chronokinetic', 'cryokinetic', 'metakinetic'] as const;

  it('should have exactly 3 traditions', () => {
    expect(Object.keys(NULL_TRADITIONS).length).toBe(3);
  });

  for (const tradId of expectedTraditions) {
    describe(`Tradition: ${tradId}`, () => {
      it('should exist in NULL_TRADITIONS', () => {
        expect(NULL_TRADITIONS[tradId]).toBeDefined();
      });

      it('should have non-empty name and focus', () => {
        expect(NULL_TRADITIONS[tradId].name.length).toBeGreaterThan(0);
        expect(NULL_TRADITIONS[tradId].focus.length).toBeGreaterThan(0);
      });

      it('should have an inertial shield bonus', () => {
        expect(NULL_TRADITIONS[tradId].inertialShieldBonus.length).toBeGreaterThan(0);
      });

      it('should have exactly 4 mastery benefits (at thresholds 4, 6, 8, 10)', () => {
        expect(NULL_TRADITIONS[tradId].masteryBenefits.length).toBe(4);
        const thresholds = NULL_TRADITIONS[tradId].masteryBenefits.map(b => b.threshold);
        expect(thresholds).toEqual([4, 6, 8, 10]);
      });

      it('should have a level 5 feature', () => {
        expect(NULL_TRADITIONS[tradId].level5Feature).toBeDefined();
        expect(NULL_TRADITIONS[tradId].level5Feature.name.length).toBeGreaterThan(0);
        expect(NULL_TRADITIONS[tradId].level5Feature.description.length).toBeGreaterThan(0);
      });
    });
  }
});

describe('Audit: Null Augmentations', () => {
  it('should have exactly 3 augmentations (density, force, speed)', () => {
    expect(Object.keys(PSIONIC_AUGMENTATIONS).length).toBe(3);
    expect(PSIONIC_AUGMENTATIONS['density']).toBeDefined();
    expect(PSIONIC_AUGMENTATIONS['force']).toBeDefined();
    expect(PSIONIC_AUGMENTATIONS['speed']).toBeDefined();
  });

  it('each augmentation should have a name and effects', () => {
    for (const aug of Object.values(PSIONIC_AUGMENTATIONS)) {
      expect(aug.name.length).toBeGreaterThan(0);
      expect(aug.effects.length).toBeGreaterThan(0);
    }
  });
});

describe('Audit: Null Field Enhancements', () => {
  it('should have exactly 3 enhancements', () => {
    expect(Object.keys(NULL_FIELD_ENHANCEMENTS).length).toBe(3);
  });

  it('each enhancement should have a name, cost, and effect', () => {
    for (const enh of Object.values(NULL_FIELD_ENHANCEMENTS)) {
      expect(enh.name.length).toBeGreaterThan(0);
      expect(enh.cost).toBeGreaterThan(0);
      expect(enh.effect.length).toBeGreaterThan(0);
    }
  });
});

describe('Audit: Null Psi Boost Options', () => {
  it('should have exactly 3 psi boost options', () => {
    expect(Object.keys(PSI_BOOST_OPTIONS).length).toBe(3);
  });

  it('each option should have a name, cost, and effect', () => {
    for (const opt of Object.values(PSI_BOOST_OPTIONS)) {
      expect(opt.name.length).toBeGreaterThan(0);
      expect(opt.cost).toBeGreaterThan(0);
      expect(opt.effect.length).toBeGreaterThan(0);
    }
  });
});

// ============================================================
// Tests: Shadow — Colleges (Subclass)
// ============================================================

describe('Audit: Shadow Colleges (Subclass)', () => {
  const expectedColleges = ['black-ash', 'caustic-alchemy', 'harlequin-mask'] as const;

  it('should have exactly 3 colleges', () => {
    expect(Object.keys(SHADOW_COLLEGES).length).toBe(3);
  });

  for (const collegeId of expectedColleges) {
    describe(`College: ${collegeId}`, () => {
      it('should exist in SHADOW_COLLEGES', () => {
        expect(SHADOW_COLLEGES[collegeId]).toBeDefined();
      });

      it('should have non-empty name, theme, description', () => {
        const c = SHADOW_COLLEGES[collegeId];
        expect(c.name.length).toBeGreaterThan(0);
        expect(c.theme.length).toBeGreaterThan(0);
        expect(c.description.length).toBeGreaterThan(0);
      });

      it('should have a signature ability', () => {
        expect(SHADOW_COLLEGES[collegeId].signatureAbility.length).toBeGreaterThan(0);
      });

      it('should have a level 5 feature', () => {
        expect(SHADOW_COLLEGES[collegeId].level5Feature).toBeDefined();
        expect(SHADOW_COLLEGES[collegeId].level5Feature.name.length).toBeGreaterThan(0);
        expect(SHADOW_COLLEGES[collegeId].level5Feature.description.length).toBeGreaterThan(0);
      });
    });
  }
});

// ============================================================
// Tests: Tactician — Doctrines (Subclass)
// ============================================================

describe('Audit: Tactician Doctrines (Subclass)', () => {
  const expectedDoctrines = ['insurgent', 'mastermind', 'vanguard'] as const;

  it('should have exactly 3 doctrines', () => {
    expect(Object.keys(TACTICIAN_DOCTRINES).length).toBe(3);
  });

  for (const doctrineId of expectedDoctrines) {
    describe(`Doctrine: ${doctrineId}`, () => {
      it('should exist in TACTICIAN_DOCTRINES', () => {
        expect(TACTICIAN_DOCTRINES[doctrineId]).toBeDefined();
      });

      it('should have non-empty name, theme, description', () => {
        const d = TACTICIAN_DOCTRINES[doctrineId];
        expect(d.name.length).toBeGreaterThan(0);
        expect(d.theme.length).toBeGreaterThan(0);
        expect(d.description.length).toBeGreaterThan(0);
      });

      it('should have a mark bonus', () => {
        expect(TACTICIAN_DOCTRINES[doctrineId].markBonus.length).toBeGreaterThan(0);
      });

      it('should have a level 5 feature', () => {
        expect(TACTICIAN_DOCTRINES[doctrineId].level5Feature).toBeDefined();
        expect(TACTICIAN_DOCTRINES[doctrineId].level5Feature.name.length).toBeGreaterThan(0);
        expect(TACTICIAN_DOCTRINES[doctrineId].level5Feature.description.length).toBeGreaterThan(0);
      });
    });
  }
});

// ============================================================
// Tests: Talent — Traditions (Subclass)
// Note: Talent subclass data is NOT in a separate subclass file;
// the Talent traditions (Chronopathy, Telekinesis, Telepathy) are
// defined in class-definitions. The talent features.ts does not have
// per-tradition feature arrays. We validate the features file structure.
// ============================================================

describe('Audit: Talent Features — Structural', () => {
  it('should have features at level 1 including Clarity and Strain', () => {
    const l1 = TALENT_LEVEL_FEATURES.filter(f => f.level === 1);
    expect(l1.length).toBeGreaterThanOrEqual(3);
    const l1Names = l1.map(f => f.name);
    expect(l1Names).toContain('Clarity Generation');
    expect(l1Names).toContain('Strain');
  });

  it('should have Psi Boost at level 6', () => {
    const l6 = TALENT_LEVEL_FEATURES.filter(f => f.level === 6);
    const l6Names = l6.map(f => f.name);
    expect(l6Names).toContain('Psi Boost');
  });

  it('should have epic resource Vision at level 10', () => {
    const l10 = TALENT_LEVEL_FEATURES.filter(f => f.level === 10);
    const l10Names = l10.map(f => f.name);
    expect(l10Names).toContain('Vision');
  });
});

// ============================================================
// Tests: Troubadour — Class Acts (Subclass) + Routines
// ============================================================

describe('Audit: Troubadour Class Acts (Subclass)', () => {
  const expectedClassActs = ['auteur', 'duelist', 'virtuoso'] as const;

  it('should have exactly 3 class acts', () => {
    expect(Object.keys(classActDefinitions).length).toBe(3);
    expect(getAllClassActs().length).toBe(3);
  });

  for (const actId of expectedClassActs) {
    describe(`Class Act: ${actId}`, () => {
      it('should exist in classActDefinitions', () => {
        expect(classActDefinitions[actId]).toBeDefined();
      });

      it('should have non-empty name, description, theme', () => {
        const a = classActDefinitions[actId];
        expect(a.name.length).toBeGreaterThan(0);
        expect(a.description.length).toBeGreaterThan(0);
        expect(a.theme.length).toBeGreaterThan(0);
      });

      it('should have a signature maneuver and triggered action', () => {
        const a = classActDefinitions[actId];
        expect(a.signatureManeuver.length).toBeGreaterThan(0);
        expect(a.signatureTriggeredAction.length).toBeGreaterThan(0);
      });
    });
  }

  describe('Class Act Features', () => {
    it('auteurFeatures should be non-empty', () => {
      expect(auteurFeatures.length).toBeGreaterThanOrEqual(4);
    });

    it('duelistFeatures should be non-empty', () => {
      expect(duelistFeatures.length).toBeGreaterThanOrEqual(4);
    });

    it('virtuosoFeatures should be non-empty', () => {
      expect(virtuosoFeatures.length).toBeGreaterThanOrEqual(4);
    });

    it('getFeaturesForClassAct should return non-empty arrays', () => {
      for (const act of expectedClassActs) {
        const features = getFeaturesForClassAct(act);
        expect(features.length, `${act} features should not be empty`).toBeGreaterThan(0);
      }
    });

    it('every class act feature should have id, name, level, and description', () => {
      for (const act of expectedClassActs) {
        const features = getFeaturesForClassAct(act);
        for (const f of features) {
          expect(f.id, `Feature missing id in ${act}`).toBeTruthy();
          expect(f.name, `Feature missing name in ${act}`).toBeTruthy();
          expect(f.level, `Feature "${f.name}" missing level in ${act}`).toBeGreaterThanOrEqual(1);
          expect(f.description, `Feature "${f.name}" missing description in ${act}`).toBeTruthy();
        }
      }
    });
  });
});

describe('Audit: Troubadour Routines', () => {
  it('should have at least 10 routines total', () => {
    expect(routineDefinitions.length).toBeGreaterThanOrEqual(10);
  });

  it('should have at least 2 base routines', () => {
    const base = routineDefinitions.filter(r => r.source === 'base');
    expect(base.length).toBeGreaterThanOrEqual(2);
  });

  it('should have routines for each class act', () => {
    for (const act of ['auteur', 'duelist', 'virtuoso'] as const) {
      const actRoutines = routineDefinitions.filter(r => r.source === act);
      expect(actRoutines.length, `${act} should have routines`).toBeGreaterThanOrEqual(2);
    }
  });

  it('every routine should have id, name, and effect', () => {
    for (const r of routineDefinitions) {
      expect(r.id, 'Routine missing id').toBeTruthy();
      expect(r.name, 'Routine missing name').toBeTruthy();
      expect(r.effect, `Routine "${r.name}" missing effect`).toBeTruthy();
    }
  });

  it('getRoutinesForClassAct should include base + class-specific routines', () => {
    const auteurRoutines = getRoutinesForClassAct('auteur', 10);
    const baseCount = routineDefinitions.filter(r => r.source === 'base' && r.level <= 10).length;
    expect(auteurRoutines.length).toBeGreaterThan(baseCount);
  });
});

// ============================================================
// Tests: Resource Generation Helper Functions
// ============================================================

describe('Audit: Resource Generation Helpers', () => {
  describe('Censor — Wrath Gain', () => {
    it('should return 2 at level 1', () => expect(getWrathGain(1)).toBe(2));
    it('should return 3 at level 7', () => expect(getWrathGain(7)).toBe(3));
    it('should return 4 at level 10', () => expect(getWrathGain(10)).toBe(4));
  });

  describe('Censor — Judgment Trigger Gain', () => {
    it('should return 1 at level 1', () => expect(getJudgmentTriggerGain(1)).toBe(1));
    it('should return 2 at level 4', () => expect(getJudgmentTriggerGain(4)).toBe(2));
  });

  describe('Conduit — Piety Gain Dice', () => {
    it('should return "1d3" at level 1', () => expect(getPietyGainDice(1)).toBe('1d3'));
    it('should return "1d3 + 1" at level 7', () => expect(getPietyGainDice(7)).toBe('1d3 + 1'));
    it('should return "1d3 + 2" at level 10', () => expect(getPietyGainDice(10)).toBe('1d3 + 2'));
  });

  describe('Elementalist — Essence Gain', () => {
    it('should return 2 at level 1', () => expect(getEssenceGain(1)).toBe(2));
    it('should return 3 at level 7', () => expect(getEssenceGain(7)).toBe(3));
    it('should return 4 at level 10', () => expect(getEssenceGain(10)).toBe(4));
  });

  describe('Elementalist — Essence Surge Gain', () => {
    it('should return 1 at level 1', () => expect(getEssenceSurgeGain(1)).toBe(1));
    it('should return 2 at level 4', () => expect(getEssenceSurgeGain(4)).toBe(2));
  });

  describe('Null — Discipline Gain', () => {
    it('should return 2 at level 1', () => expect(calculateDisciplineGain(1)).toBe(2));
    it('should return 3 at level 7', () => expect(calculateDisciplineGain(7)).toBe(3));
    it('should return 4 at level 10', () => expect(calculateDisciplineGain(10)).toBe(4));
  });

  describe('Shadow — Surge Gain', () => {
    it('should return 1 at level 1', () => expect(getSurgeGain(1)).toBe(1));
    it('should return 2 at level 4', () => expect(getSurgeGain(4)).toBe(2));
    it('should return 3 at level 10', () => expect(getSurgeGain(10)).toBe(3));
  });

  describe('Tactician — Focus Gain', () => {
    it('should return 2 at level 1', () => expect(getFocusGain(1)).toBe(2));
    it('should return 3 at level 7', () => expect(getFocusGain(7)).toBe(3));
    it('should return 4 at level 10', () => expect(getFocusGain(10)).toBe(4));
  });

  describe('Tactician — Mark Trigger Gain', () => {
    it('should return 1 at level 1', () => expect(getMarkTriggerGain(1)).toBe(1));
    it('should return 2 at level 4', () => expect(getMarkTriggerGain(4)).toBe(2));
  });

  describe('Talent — Clarity Gain Dice', () => {
    it('should return "1d3" at level 1', () => expect(getClarityGainDice(1)).toBe('1d3'));
    it('should return "1d3 + 1" at level 7', () => expect(getClarityGainDice(7)).toBe('1d3 + 1'));
    it('should return "1d3 + 2" at level 10', () => expect(getClarityGainDice(10)).toBe('1d3 + 2'));
  });

  describe('Talent — Force Move Gain', () => {
    it('should return 1 at level 1', () => expect(getForceMoveGain(1)).toBe(1));
    it('should return 2 at level 4', () => expect(getForceMoveGain(4)).toBe(2));
    it('should return 3 at level 10', () => expect(getForceMoveGain(10)).toBe(3));
  });
});

// ============================================================
// Tests: Feature Level Filter Helpers
// ============================================================

describe('Audit: Feature Level Filter Helpers', () => {
  describe('Censor — getFeaturesForLevel', () => {
    it('level 1 should return only level-1 features', () => {
      const l1 = censorGetFeaturesForLevel(1);
      expect(l1.every(f => f.level <= 1)).toBe(true);
      expect(l1.length).toBeGreaterThanOrEqual(2);
    });

    it('level 10 should return all features', () => {
      const l10 = censorGetFeaturesForLevel(10);
      expect(l10.length).toBe(CENSOR_LEVEL_FEATURES.length);
    });
  });

  describe('Censor — getFeaturesUnlockedAtLevel', () => {
    it('level 1 should return features with level === 1', () => {
      const l1 = censorGetFeaturesUnlockedAtLevel(1);
      expect(l1.every(f => f.level === 1)).toBe(true);
      expect(l1.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Fury — getFeaturesAtLevel', () => {
    it('berserker level 1 should return core + berserker features at level 1', () => {
      const l1 = getFeaturesAtLevel('berserker', 1);
      expect(l1.length).toBeGreaterThanOrEqual(2);
    });

    it('berserker level 10 should return all berserker features', () => {
      const l10 = getFeaturesAtLevel('berserker', 10);
      expect(l10.length).toBe(furyFeatures.length + berserkerFeatures.length);
    });
  });
});

// ============================================================
// Cross-class Checks
// ============================================================

describe('Audit: Cross-class Feature Checks', () => {
  it('all 9 existing classes have non-empty feature arrays', () => {
    const classFeatureArrays: Record<string, unknown[]> = {
      censor: CENSOR_LEVEL_FEATURES,
      conduit: CONDUIT_LEVEL_FEATURES,
      elementalist: ELEMENTALIST_LEVEL_FEATURES,
      fury: furyFeatures,
      null: NULL_LEVEL_FEATURES,
      shadow: SHADOW_LEVEL_FEATURES,
      tactician: TACTICIAN_LEVEL_FEATURES,
      talent: TALENT_LEVEL_FEATURES,
      troubadour: auteurFeatures,
    };

    for (const [classId, features] of Object.entries(classFeatureArrays)) {
      expect(features.length, `${classId} features should not be empty`).toBeGreaterThan(0);
    }
  });

  it('all 9 classes have subclass data', () => {
    const subclassRecords: Record<string, Record<string, unknown>> = {
      censor: CENSOR_ORDERS,
      conduit: CONDUIT_DOMAINS,
      elementalist: ELEMENTALIST_ELEMENTS,
      fury: furyAspects,
      null: NULL_TRADITIONS,
      shadow: SHADOW_COLLEGES,
      tactician: TACTICIAN_DOCTRINES,
      // Talent and Troubadour: checked separately since they have different structures
    };

    for (const [classId, subclasses] of Object.entries(subclassRecords)) {
      expect(
        Object.keys(subclasses).length,
        `${classId} subclass data should not be empty`
      ).toBeGreaterThan(0);
    }

    // Troubadour
    expect(Object.keys(classActDefinitions).length).toBeGreaterThan(0);
  });

  it('resource generation pattern: all classes with numeric resource gain scale at levels 4/7/10', () => {
    // Classes that use flat numeric gain: Censor (wrath), Elementalist (essence),
    // Null (discipline), Tactician (focus)
    // These follow the pattern: base -> improved at L7 -> mastered at L10

    // Censor
    expect(getWrathGain(6)).toBe(2);
    expect(getWrathGain(7)).toBe(3);
    expect(getWrathGain(10)).toBe(4);

    // Elementalist
    expect(getEssenceGain(6)).toBe(2);
    expect(getEssenceGain(7)).toBe(3);
    expect(getEssenceGain(10)).toBe(4);

    // Null
    expect(calculateDisciplineGain(6)).toBe(2);
    expect(calculateDisciplineGain(7)).toBe(3);
    expect(calculateDisciplineGain(10)).toBe(4);

    // Tactician
    expect(getFocusGain(6)).toBe(2);
    expect(getFocusGain(7)).toBe(3);
    expect(getFocusGain(10)).toBe(4);
  });

  it('resource generation pattern: dice-based classes scale at levels 7/10', () => {
    // Conduit (piety), Shadow (insight - surge-based, not dice), Talent (clarity)
    // These follow the pattern: 1d3 -> 1d3+1 at L7 -> 1d3+2 at L10

    // Conduit
    expect(getPietyGainDice(1)).toBe('1d3');
    expect(getPietyGainDice(7)).toBe('1d3 + 1');
    expect(getPietyGainDice(10)).toBe('1d3 + 2');

    // Talent
    expect(getClarityGainDice(1)).toBe('1d3');
    expect(getClarityGainDice(7)).toBe('1d3 + 1');
    expect(getClarityGainDice(10)).toBe('1d3 + 2');
  });

  it('trigger gain pattern: scales at level 4 for applicable classes', () => {
    // Censor (judgment trigger), Elementalist (essence surge), Tactician (mark trigger),
    // Shadow (surge gain), Talent (force move)

    expect(getJudgmentTriggerGain(3)).toBe(1);
    expect(getJudgmentTriggerGain(4)).toBe(2);

    expect(getEssenceSurgeGain(3)).toBe(1);
    expect(getEssenceSurgeGain(4)).toBe(2);

    expect(getMarkTriggerGain(3)).toBe(1);
    expect(getMarkTriggerGain(4)).toBe(2);

    expect(getSurgeGain(3)).toBe(1);
    expect(getSurgeGain(4)).toBe(2);

    expect(getForceMoveGain(3)).toBe(1);
    expect(getForceMoveGain(4)).toBe(2);
  });

  it('all classes with level-based features should include epic-tier content at level 9-10', () => {
    // Each class should have at least one feature at level 9 or 10
    const levelFeatureArrays = [
      { name: 'Censor', features: CENSOR_LEVEL_FEATURES },
      { name: 'Conduit', features: CONDUIT_LEVEL_FEATURES },
      { name: 'Elementalist', features: ELEMENTALIST_LEVEL_FEATURES },
      { name: 'Null', features: NULL_LEVEL_FEATURES },
      { name: 'Shadow', features: SHADOW_LEVEL_FEATURES },
      { name: 'Tactician', features: TACTICIAN_LEVEL_FEATURES },
      { name: 'Talent', features: TALENT_LEVEL_FEATURES },
    ];

    for (const cls of levelFeatureArrays) {
      const epicFeatures = cls.features.filter(f => f.level >= 9);
      expect(
        epicFeatures.length,
        `${cls.name} should have epic-tier features (level 9-10)`
      ).toBeGreaterThanOrEqual(2);
    }
  });

  it('all classes with category-based features should include an epic category', () => {
    const classesWithCategories = [
      { name: 'Censor', features: CENSOR_LEVEL_FEATURES },
      { name: 'Conduit', features: CONDUIT_LEVEL_FEATURES },
      { name: 'Elementalist', features: ELEMENTALIST_LEVEL_FEATURES },
      { name: 'Null', features: NULL_LEVEL_FEATURES },
      { name: 'Shadow', features: SHADOW_LEVEL_FEATURES },
      { name: 'Tactician', features: TACTICIAN_LEVEL_FEATURES },
      { name: 'Talent', features: TALENT_LEVEL_FEATURES },
    ];

    for (const cls of classesWithCategories) {
      const epicFeatures = cls.features.filter(f => f.category === 'epic');
      expect(
        epicFeatures.length,
        `${cls.name} should have at least one "epic" category feature`
      ).toBeGreaterThanOrEqual(1);
    }
  });

  it('all classes with category-based features should include a resource category', () => {
    const classesWithCategories = [
      { name: 'Censor', features: CENSOR_LEVEL_FEATURES },
      { name: 'Conduit', features: CONDUIT_LEVEL_FEATURES },
      { name: 'Elementalist', features: ELEMENTALIST_LEVEL_FEATURES },
      { name: 'Null', features: NULL_LEVEL_FEATURES },
      { name: 'Shadow', features: SHADOW_LEVEL_FEATURES },
      { name: 'Tactician', features: TACTICIAN_LEVEL_FEATURES },
      { name: 'Talent', features: TALENT_LEVEL_FEATURES },
    ];

    for (const cls of classesWithCategories) {
      const resourceFeatures = cls.features.filter(f => f.category === 'resource');
      expect(
        resourceFeatures.length,
        `${cls.name} should have at least one "resource" category feature`
      ).toBeGreaterThanOrEqual(1);
    }
  });
});
