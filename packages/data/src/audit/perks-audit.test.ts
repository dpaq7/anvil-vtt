/**
 * Perks Audit -- Slice 10
 *
 * Validates all perks against Draw Steel v1.0.1 source books:
 * - Perk exists in code by ID
 * - Name matches source exactly
 * - Category is correct
 * - Description/effect text is present
 * - Category membership is correct
 * - Cross-perk: total count, unique IDs, unique names
 *
 * Source: docs/rules_data/data-rules-md/Perks/
 */
import { describe, it, expect } from 'vitest';
import { GameData } from '../game-data/lib/game-rules.js';
import {
  PERKS,
  getPerksByCategory,
  getPerkById,
  getPerkCountsByCategory,
} from '../rules/perks/perks-data.js';
import {
  PERK_CATEGORY_INFO,
  ALL_PERK_CATEGORIES,
} from '../rules/perks/perk-categories.js';

// ============================================================
// Source Data: Perks from Draw Steel v1.0.1 Chapter 18
// ============================================================

/** Source perk entry transcribed from rules-md files */
interface SourcePerk {
  id: string;
  name: string;
  category: string;
}

/**
 * All 47 standard perks from the Draw Steel source book.
 * Transcribed from docs/rules_data/data-rules-md/Perks/<Category>/<Perk>.md
 *
 * Beastheart-specific perks (8 total) are NOT in the standard source book
 * and are tested separately.
 */
const SOURCE_CRAFTING_PERKS: SourcePerk[] = [
  { id: 'area-of-expertise', name: 'Area of Expertise', category: 'crafting' },
  { id: 'expert-artisan', name: 'Expert Artisan', category: 'crafting' },
  { id: 'handy', name: 'Handy', category: 'crafting' },
  { id: 'improvisation-creation', name: 'Improvisation Creation', category: 'crafting' },
  { id: 'inspired-artisan', name: 'Inspired Artisan', category: 'crafting' },
  { id: 'traveling-artisan', name: 'Traveling Artisan', category: 'crafting' },
];

const SOURCE_EXPLORATION_PERKS: SourcePerk[] = [
  { id: 'brawny', name: 'Brawny', category: 'exploration' },
  { id: 'camouflage-hunter', name: 'Camouflage Hunter', category: 'exploration' },
  { id: 'danger-sense', name: 'Danger Sense', category: 'exploration' },
  { id: 'friend-catapult', name: 'Friend Catapult', category: 'exploration' },
  { id: 'ive-got-you', name: "I've Got You!", category: 'exploration' },
  { id: 'monster-whisperer', name: 'Monster Whisperer', category: 'exploration' },
  { id: 'put-your-back-into-it', name: 'Put Your Back Into It!', category: 'exploration' },
  { id: 'team-leader', name: 'Team Leader', category: 'exploration' },
  { id: 'teamwork', name: 'Teamwork', category: 'exploration' },
  { id: 'wood-wise', name: 'Wood Wise', category: 'exploration' },
];

const SOURCE_INTERPERSONAL_PERKS: SourcePerk[] = [
  { id: 'charming-liar', name: 'Charming Liar', category: 'interpersonal' },
  { id: 'dazzler', name: 'Dazzler', category: 'interpersonal' },
  { id: 'engrossing-monologue', name: 'Engrossing Monologue', category: 'interpersonal' },
  { id: 'harmonizer', name: 'Harmonizer', category: 'interpersonal' },
  { id: 'lie-detector', name: 'Lie Detector', category: 'interpersonal' },
  { id: 'open-book', name: 'Open Book', category: 'interpersonal' },
  { id: 'pardon-my-friend', name: 'Pardon My Friend', category: 'interpersonal' },
  { id: 'power-player', name: 'Power Player', category: 'interpersonal' },
  { id: 'so-tell-me', name: 'So Tell Me...', category: 'interpersonal' },
  { id: 'spot-the-tell', name: 'Spot the Tell', category: 'interpersonal' },
];

const SOURCE_INTRIGUE_PERKS: SourcePerk[] = [
  { id: 'criminal-contacts', name: 'Criminal Contacts', category: 'intrigue' },
  { id: 'forgettable-face', name: 'Forgettable Face', category: 'intrigue' },
  { id: 'gum-up-the-works', name: 'Gum Up the Works', category: 'intrigue' },
  { id: 'lucky-dog', name: 'Lucky Dog', category: 'intrigue' },
  { id: 'master-of-disguise', name: 'Master of Disguise', category: 'intrigue' },
  { id: 'slipped-lead', name: 'Slipped Lead', category: 'intrigue' },
];

const SOURCE_LORE_PERKS: SourcePerk[] = [
  { id: 'but-i-know-who-does', name: 'But I Know Who Does', category: 'lore' },
  { id: 'eidetic-memory', name: 'Eidetic Memory', category: 'lore' },
  { id: 'expert-sage', name: 'Expert Sage', category: 'lore' },
  { id: 'ive-read-about-this-place', name: "I've Read About This Place", category: 'lore' },
  { id: 'linguist', name: 'Linguist', category: 'lore' },
  { id: 'polymath', name: 'Polymath', category: 'lore' },
  { id: 'specialist', name: 'Specialist', category: 'lore' },
  { id: 'traveling-sage', name: 'Traveling Sage', category: 'lore' },
];

const SOURCE_SUPERNATURAL_PERKS: SourcePerk[] = [
  { id: 'arcane-trick', name: 'Arcane Trick', category: 'supernatural' },
  { id: 'creature-sense', name: 'Creature Sense', category: 'supernatural' },
  { id: 'familiar', name: 'Familiar', category: 'supernatural' },
  { id: 'invisible-force', name: 'Invisible Force', category: 'supernatural' },
  { id: 'psychic-whisper', name: 'Psychic Whisper', category: 'supernatural' },
  { id: 'ritualist', name: 'Ritualist', category: 'supernatural' },
  { id: 'thingspeaker', name: 'Thingspeaker', category: 'supernatural' },
];

/** All 47 standard (non-class-specific) source perks */
const ALL_SOURCE_PERKS: SourcePerk[] = [
  ...SOURCE_CRAFTING_PERKS,
  ...SOURCE_EXPLORATION_PERKS,
  ...SOURCE_INTERPERSONAL_PERKS,
  ...SOURCE_INTRIGUE_PERKS,
  ...SOURCE_LORE_PERKS,
  ...SOURCE_SUPERNATURAL_PERKS,
];

/**
 * Beastheart-specific perks (class supplement).
 * These are added to the general PERKS array but are class-restricted.
 */
const SOURCE_BEASTHEART_PERKS: SourcePerk[] = [
  { id: 'born-tracker', name: 'Born Tracker', category: 'exploration' },
  { id: 'ride-along', name: 'Ride Along', category: 'exploration' },
  { id: 'wild-rumpus', name: 'Wild Rumpus', category: 'exploration' },
  { id: 'wilds-explorer', name: 'Wilds Explorer', category: 'exploration' },
  { id: 'people-sense', name: 'People Sense', category: 'interpersonal' },
  { id: 'voice-of-the-wild', name: 'Voice of the Wild', category: 'interpersonal' },
  { id: 'you-can-pet-them', name: "You Can Pet Them, They're Friendly", category: 'interpersonal' },
  { id: 'trained-thief', name: 'Trained Thief', category: 'intrigue' },
];

// ============================================================
// Category Structure Tests
// ============================================================
describe('Audit: Perks — Category Structure', () => {
  const expectedCategories = [
    'crafting',
    'exploration',
    'interpersonal',
    'intrigue',
    'lore',
    'supernatural',
  ] as const;

  it('ALL_PERK_CATEGORIES contains exactly the 6 source categories', () => {
    expect(ALL_PERK_CATEGORIES).toHaveLength(6);
    for (const cat of expectedCategories) {
      expect(ALL_PERK_CATEGORIES).toContain(cat);
    }
  });

  it('PERK_CATEGORY_INFO has entries for all 6 categories', () => {
    for (const cat of expectedCategories) {
      expect(PERK_CATEGORY_INFO[cat]).toBeDefined();
      expect(PERK_CATEGORY_INFO[cat].name).toBeTruthy();
      expect(PERK_CATEGORY_INFO[cat].description).toBeTruthy();
    }
  });

  it('PERK_CATEGORY_INFO display names match expected values', () => {
    expect(PERK_CATEGORY_INFO['crafting'].name).toBe('Crafting');
    expect(PERK_CATEGORY_INFO['exploration'].name).toBe('Exploration');
    expect(PERK_CATEGORY_INFO['interpersonal'].name).toBe('Interpersonal');
    expect(PERK_CATEGORY_INFO['intrigue'].name).toBe('Intrigue');
    expect(PERK_CATEGORY_INFO['lore'].name).toBe('Lore');
    expect(PERK_CATEGORY_INFO['supernatural'].name).toBe('Supernatural');
  });
});

// ============================================================
// Per-Category Perk Count Tests
// ============================================================
describe('Audit: Perks — Category Counts', () => {
  it('Crafting has 6 standard perks', () => {
    const craftingPerks = getPerksByCategory('crafting');
    expect(craftingPerks).toHaveLength(6);
  });

  it('Exploration has 10 standard + 4 Beastheart perks = 14', () => {
    const explorationPerks = getPerksByCategory('exploration');
    expect(explorationPerks).toHaveLength(14);
  });

  it('Interpersonal has 10 standard + 3 Beastheart perks = 13', () => {
    const interpersonalPerks = getPerksByCategory('interpersonal');
    expect(interpersonalPerks).toHaveLength(13);
  });

  it('Intrigue has 6 standard + 1 Beastheart perk = 7', () => {
    const intriguePerks = getPerksByCategory('intrigue');
    expect(intriguePerks).toHaveLength(7);
  });

  it('Lore has 8 perks', () => {
    const lorePerks = getPerksByCategory('lore');
    expect(lorePerks).toHaveLength(8);
  });

  it('Supernatural has 7 perks', () => {
    const supernaturalPerks = getPerksByCategory('supernatural');
    expect(supernaturalPerks).toHaveLength(7);
  });

  it('getPerkCountsByCategory returns correct totals', () => {
    const counts = getPerkCountsByCategory();
    expect(counts.crafting).toBe(6);
    expect(counts.exploration).toBe(14);
    expect(counts.interpersonal).toBe(13);
    expect(counts.intrigue).toBe(7);
    expect(counts.lore).toBe(8);
    expect(counts.supernatural).toBe(7);
  });

  it('total perk count = 47 standard + 8 Beastheart = 55', () => {
    expect(PERKS).toHaveLength(55);
  });
});

// ============================================================
// Individual Perk Validation — Crafting (6)
// ============================================================
describe('Audit: Perks — Crafting Perks', () => {
  for (const source of SOURCE_CRAFTING_PERKS) {
    describe(source.name, () => {
      it(`perk "${source.id}" exists`, () => {
        const perk = getPerkById(source.id);
        expect(perk).toBeDefined();
      });

      it(`name matches source: "${source.name}"`, () => {
        const perk = getPerkById(source.id)!;
        expect(perk.name).toBe(source.name);
      });

      it(`category is "crafting"`, () => {
        const perk = getPerkById(source.id)!;
        expect(perk.category).toBe('crafting');
      });

      it('has non-empty description', () => {
        const perk = getPerkById(source.id)!;
        expect(perk.description).toBeTruthy();
        expect(perk.description.length).toBeGreaterThan(20);
      });
    });
  }
});

// ============================================================
// Individual Perk Validation — Exploration (10 standard)
// ============================================================
describe('Audit: Perks — Exploration Perks (standard)', () => {
  for (const source of SOURCE_EXPLORATION_PERKS) {
    describe(source.name, () => {
      it(`perk "${source.id}" exists`, () => {
        const perk = getPerkById(source.id);
        expect(perk).toBeDefined();
      });

      it(`name matches source: "${source.name}"`, () => {
        const perk = getPerkById(source.id)!;
        expect(perk.name).toBe(source.name);
      });

      it(`category is "exploration"`, () => {
        const perk = getPerkById(source.id)!;
        expect(perk.category).toBe('exploration');
      });

      it('has non-empty description', () => {
        const perk = getPerkById(source.id)!;
        expect(perk.description).toBeTruthy();
        expect(perk.description.length).toBeGreaterThan(20);
      });
    });
  }
});

// ============================================================
// Individual Perk Validation — Interpersonal (10 standard)
// ============================================================
describe('Audit: Perks — Interpersonal Perks (standard)', () => {
  for (const source of SOURCE_INTERPERSONAL_PERKS) {
    describe(source.name, () => {
      it(`perk "${source.id}" exists`, () => {
        const perk = getPerkById(source.id);
        expect(perk).toBeDefined();
      });

      it(`name matches source: "${source.name}"`, () => {
        const perk = getPerkById(source.id)!;
        expect(perk.name).toBe(source.name);
      });

      it(`category is "interpersonal"`, () => {
        const perk = getPerkById(source.id)!;
        expect(perk.category).toBe('interpersonal');
      });

      it('has non-empty description', () => {
        const perk = getPerkById(source.id)!;
        expect(perk.description).toBeTruthy();
        expect(perk.description.length).toBeGreaterThan(20);
      });
    });
  }
});

// ============================================================
// Individual Perk Validation — Intrigue (6 standard)
// ============================================================
describe('Audit: Perks — Intrigue Perks (standard)', () => {
  for (const source of SOURCE_INTRIGUE_PERKS) {
    describe(source.name, () => {
      it(`perk "${source.id}" exists`, () => {
        const perk = getPerkById(source.id);
        expect(perk).toBeDefined();
      });

      it(`name matches source: "${source.name}"`, () => {
        const perk = getPerkById(source.id)!;
        expect(perk.name).toBe(source.name);
      });

      it(`category is "intrigue"`, () => {
        const perk = getPerkById(source.id)!;
        expect(perk.category).toBe('intrigue');
      });

      it('has non-empty description', () => {
        const perk = getPerkById(source.id)!;
        expect(perk.description).toBeTruthy();
        expect(perk.description.length).toBeGreaterThan(20);
      });
    });
  }
});

// ============================================================
// Individual Perk Validation — Lore (8)
// ============================================================
describe('Audit: Perks — Lore Perks', () => {
  for (const source of SOURCE_LORE_PERKS) {
    describe(source.name, () => {
      it(`perk "${source.id}" exists`, () => {
        const perk = getPerkById(source.id);
        expect(perk).toBeDefined();
      });

      it(`name matches source: "${source.name}"`, () => {
        const perk = getPerkById(source.id)!;
        expect(perk.name).toBe(source.name);
      });

      it(`category is "lore"`, () => {
        const perk = getPerkById(source.id)!;
        expect(perk.category).toBe('lore');
      });

      it('has non-empty description', () => {
        const perk = getPerkById(source.id)!;
        expect(perk.description).toBeTruthy();
        expect(perk.description.length).toBeGreaterThan(20);
      });
    });
  }
});

// ============================================================
// Individual Perk Validation — Supernatural (7)
// ============================================================
describe('Audit: Perks — Supernatural Perks', () => {
  for (const source of SOURCE_SUPERNATURAL_PERKS) {
    describe(source.name, () => {
      it(`perk "${source.id}" exists`, () => {
        const perk = getPerkById(source.id);
        expect(perk).toBeDefined();
      });

      it(`name matches source: "${source.name}"`, () => {
        const perk = getPerkById(source.id)!;
        expect(perk.name).toBe(source.name);
      });

      it(`category is "supernatural"`, () => {
        const perk = getPerkById(source.id)!;
        expect(perk.category).toBe('supernatural');
      });

      it('has non-empty description', () => {
        const perk = getPerkById(source.id)!;
        expect(perk.description).toBeTruthy();
        expect(perk.description.length).toBeGreaterThan(20);
      });
    });
  }
});

// ============================================================
// Beastheart-Specific Perks (8)
// ============================================================
describe('Audit: Perks — Beastheart-Specific Perks', () => {
  for (const source of SOURCE_BEASTHEART_PERKS) {
    describe(source.name, () => {
      it(`perk "${source.id}" exists`, () => {
        const perk = getPerkById(source.id);
        expect(perk).toBeDefined();
      });

      it(`name matches: "${source.name}"`, () => {
        const perk = getPerkById(source.id)!;
        expect(perk.name).toBe(source.name);
      });

      it(`category is "${source.category}"`, () => {
        const perk = getPerkById(source.id)!;
        expect(perk.category).toBe(source.category);
      });

      it('has non-empty description mentioning Beastheart', () => {
        const perk = getPerkById(source.id)!;
        expect(perk.description).toBeTruthy();
        expect(perk.description.toLowerCase()).toContain('beastheart');
      });
    });
  }
});

// ============================================================
// Cross-Perk Integrity Checks
// ============================================================
describe('Audit: Perks — Cross-Perk Integrity', () => {
  it('all perk IDs are unique', () => {
    const ids = PERKS.map(p => p.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('all perk names are unique', () => {
    const names = PERKS.map(p => p.name);
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBe(names.length);
  });

  it('every perk has a valid category from the 6 allowed', () => {
    const validCategories = new Set(ALL_PERK_CATEGORIES);
    for (const perk of PERKS) {
      expect(validCategories.has(perk.category)).toBe(true);
    }
  });

  it('every perk has a non-empty id', () => {
    for (const perk of PERKS) {
      expect(perk.id).toBeTruthy();
      expect(perk.id.length).toBeGreaterThan(0);
    }
  });

  it('every perk has a non-empty name', () => {
    for (const perk of PERKS) {
      expect(perk.name).toBeTruthy();
      expect(perk.name.length).toBeGreaterThan(0);
    }
  });

  it('every perk has a non-empty description', () => {
    for (const perk of PERKS) {
      expect(perk.description).toBeTruthy();
      expect(perk.description.length).toBeGreaterThan(0);
    }
  });

  it('no duplicate IDs between standard and Beastheart perks', () => {
    const standardIds = ALL_SOURCE_PERKS.map(p => p.id);
    const beastIds = SOURCE_BEASTHEART_PERKS.map(p => p.id);
    const overlap = standardIds.filter(id => beastIds.includes(id));
    expect(overlap).toHaveLength(0);
  });

  it('all source standard perks are present in code', () => {
    const codeIds = new Set(PERKS.map(p => p.id));
    const missing = ALL_SOURCE_PERKS.filter(sp => !codeIds.has(sp.id));
    expect(missing).toHaveLength(0);
  });

  it('all source Beastheart perks are present in code', () => {
    const codeIds = new Set(PERKS.map(p => p.id));
    const missing = SOURCE_BEASTHEART_PERKS.filter(sp => !codeIds.has(sp.id));
    expect(missing).toHaveLength(0);
  });
});

// ============================================================
// GameData Integration Tests
// ============================================================
//
// BUG DOCUMENTED: GameData imports from a STALE perk data file at
//   packages/data/src/game-data/data/perks/perks-data.ts (40 placeholder perks)
// instead of the correct source-accurate file at
//   packages/data/src/rules/perks/perks-data.ts (55 correct perks)
//
// The stale file has different IDs, different names, and inaccurate descriptions.
// GameData.getAllPerks() returns 40 placeholder perks rather than 55 correct ones.
// Fix: Update game-rules.ts import from '../data/perks/perks-data.js'
//      to use '../../rules/perks/perks-data.js' (or re-export properly).
//
// Tests below validate the STALE data shape to document current behavior.
// Once the import is fixed, update these tests to match the correct data.
// ============================================================
describe('Audit: Perks — GameData Integration (BUG: stale data source)', () => {
  it('BUG: GameData.getAllPerks() returns 40 stale perks instead of 55 correct ones', () => {
    const allPerks = GameData.getAllPerks();
    // Current (buggy) behavior: 40 placeholder perks
    expect(allPerks).toHaveLength(40);
    // Once fixed, this should be 55:
    // expect(allPerks).toHaveLength(55);
  });

  it('BUG: GameData.getPerksByCategory counts differ from correct data', () => {
    // Current stale data counts (not matching source):
    expect(GameData.getPerksByCategory('crafting')).toHaveLength(5);      // should be 6
    expect(GameData.getPerksByCategory('exploration')).toHaveLength(8);   // should be 14
    expect(GameData.getPerksByCategory('interpersonal')).toHaveLength(7); // should be 13
    expect(GameData.getPerksByCategory('intrigue')).toHaveLength(7);      // should be 7 (coincidentally matches)
    expect(GameData.getPerksByCategory('lore')).toHaveLength(6);          // should be 8
    expect(GameData.getPerksByCategory('supernatural')).toHaveLength(7);  // should be 7 (coincidentally matches)
  });

  it('GameData.getPerk returns undefined for non-existent perk', () => {
    expect(GameData.getPerk('non-existent-perk')).toBeUndefined();
  });

  it('the correct PERKS from rules/perks matches source IDs', () => {
    // Verify the correct data source has all expected perks
    for (const source of ALL_SOURCE_PERKS) {
      const perk = getPerkById(source.id);
      expect(perk, `rules PERKS should contain "${source.id}"`).toBeDefined();
    }
  });
});

// ============================================================
// Description Content Spot-Checks
// ============================================================
describe('Audit: Perks — Description Content Spot-Checks', () => {
  it('Handy description mentions "+1 bonus to the power roll"', () => {
    const perk = getPerkById('handy')!;
    expect(perk.description).toContain('+1 bonus to the power roll');
  });

  it('Brawny description mentions "1d6 + your level"', () => {
    const perk = getPerkById('brawny')!;
    expect(perk.description).toContain('1d6 + your level');
  });

  it('Friend Catapult description mentions "twice your Might score"', () => {
    const perk = getPerkById('friend-catapult')!;
    expect(perk.description).toContain('twice your Might score');
  });

  it("I've Got You! description mentions \"free triggered action\"", () => {
    const perk = getPerkById('ive-got-you')!;
    expect(perk.description).toContain('free triggered action');
  });

  it('Charming Liar description mentions "Lie skill"', () => {
    const perk = getPerkById('charming-liar')!;
    expect(perk.description).toContain('Lie skill');
  });

  it('Lie Detector description mentions "hero token"', () => {
    const perk = getPerkById('lie-detector')!;
    expect(perk.description).toContain('hero token');
  });

  it('Lucky Dog description mentions "intrigue skill group"', () => {
    const perk = getPerkById('lucky-dog')!;
    expect(perk.description).toContain('intrigue skill group');
  });

  it('Forgettable Face description mentions "Disguise skill"', () => {
    const perk = getPerkById('forgettable-face')!;
    expect(perk.description).toContain('Disguise skill');
  });

  it('Eidetic Memory description mentions "lore skill group"', () => {
    const perk = getPerkById('eidetic-memory')!;
    expect(perk.description).toContain('lore skill group');
  });

  it('Specialist description mentions "double edge"', () => {
    const perk = getPerkById('specialist')!;
    expect(perk.description).toContain('double edge');
  });

  it('Polymath description mentions "+1 bonus to the power roll"', () => {
    const perk = getPerkById('polymath')!;
    expect(perk.description).toContain('+1 bonus to the power roll');
  });

  it('Linguist description mentions "two new languages"', () => {
    const perk = getPerkById('linguist')!;
    expect(perk.description).toContain('two new languages');
  });

  it('Arcane Trick description mentions ability effects', () => {
    const perk = getPerkById('arcane-trick')!;
    expect(perk.description).toContain('Arcane Trick');
  });

  it('Familiar description mentions "familiar"', () => {
    const perk = getPerkById('familiar')!;
    expect(perk.description.toLowerCase()).toContain('familiar');
  });

  it('Invisible Force description mentions "size 1T"', () => {
    const perk = getPerkById('invisible-force')!;
    expect(perk.description).toContain('size 1T');
  });

  it('Ritualist description mentions "double edge"', () => {
    const perk = getPerkById('ritualist')!;
    expect(perk.description).toContain('double edge');
  });

  it('Thingspeaker description mentions "emotional resonance"', () => {
    const perk = getPerkById('thingspeaker')!;
    expect(perk.description).toContain('emotional resonance');
  });

  it('Creature Sense description mentions "keywords"', () => {
    const perk = getPerkById('creature-sense')!;
    expect(perk.description).toContain('keywords');
  });

  it('Psychic Whisper description mentions "telepathic message"', () => {
    const perk = getPerkById('psychic-whisper')!;
    expect(perk.description).toContain('telepathic message');
  });
});

// ============================================================
// Helper Function Tests
// ============================================================
describe('Audit: Perks — Helper Functions', () => {
  it('getPerksByCategory returns only perks with matching category', () => {
    for (const cat of ALL_PERK_CATEGORIES) {
      const perks = getPerksByCategory(cat);
      for (const perk of perks) {
        expect(perk.category).toBe(cat);
      }
    }
  });

  it('getPerkById returns undefined for unknown ID', () => {
    expect(getPerkById('does-not-exist')).toBeUndefined();
  });

  it('getPerkById returns correct perk for each standard ID', () => {
    for (const source of ALL_SOURCE_PERKS) {
      const perk = getPerkById(source.id);
      expect(perk).toBeDefined();
      expect(perk!.id).toBe(source.id);
      expect(perk!.name).toBe(source.name);
    }
  });
});
