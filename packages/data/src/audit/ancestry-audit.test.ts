/**
 * Ancestry Audit
 *
 * Validates all 12 ancestries against Draw Steel source books.
 * Checks name, size, speed, ancestry points, signature trait names,
 * and purchased trait names/costs for each ancestry.
 *
 * Source: docs/rules_data/data-rules-md/Ancestries/*.md
 */
import { describe, it, expect } from 'vitest';
import { GameData } from '../game-data/lib/game-rules.js';

// ============================================================
// Source-of-truth data extracted from the Ancestry MD files
// ============================================================

interface SourceAncestry {
  id: string;
  name: string;
  size: string;
  speed: number;
  ancestryPoints: number;
  signatureTraitName: string;
  purchasedTraits: Array<{ name: string; cost: number }>;
}

/**
 * Ground-truth ancestry data extracted from:
 *   docs/rules_data/data-rules-md/Ancestries/*.md
 *
 * For size and speed: Most ancestries default to 1M / speed 5.
 * Hakaan explicitly states size 1L via "Big!" trait.
 * Polder explicitly states size 1S via "Small!" trait.
 * Revenant's "Former Life" says speed is 5 and size varies (code defaults to 1M).
 */
const SOURCE_ANCESTRIES: SourceAncestry[] = [
  {
    id: 'devil',
    name: 'Devil',
    size: '1M',
    speed: 5,
    ancestryPoints: 3,
    signatureTraitName: 'Silver Tongue',
    purchasedTraits: [
      { name: 'Barbed Tail', cost: 1 },
      { name: 'Beast Legs', cost: 1 },
      { name: 'Glowing Eyes', cost: 1 },
      { name: 'Hellsight', cost: 1 },
      { name: 'Impressive Horns', cost: 2 },
      { name: 'Prehensile Tail', cost: 2 },
      { name: 'Wings', cost: 2 },
    ],
  },
  {
    id: 'dragon-knight',
    name: 'Dragon Knight',
    size: '1M',
    speed: 5,
    ancestryPoints: 3,
    signatureTraitName: 'Wyrmplate',
    purchasedTraits: [
      { name: 'Draconian Guard', cost: 1 },
      { name: 'Draconian Pride', cost: 2 },
      { name: 'Dragon Breath', cost: 2 },
      { name: 'Prismatic Scales', cost: 1 },
      { name: 'Remember Your Oath', cost: 1 },
      { name: 'Wings', cost: 2 },
    ],
  },
  {
    id: 'dwarf',
    name: 'Dwarf',
    size: '1M',
    speed: 5,
    ancestryPoints: 3,
    signatureTraitName: 'Runic Carving',
    purchasedTraits: [
      { name: 'Great Fortitude', cost: 2 },
      { name: 'Grounded', cost: 1 },
      { name: 'Spark Off Your Skin', cost: 2 },
      { name: 'Stand Tough', cost: 1 },
      { name: 'Stone Singer', cost: 1 },
    ],
  },
  {
    id: 'hakaan',
    name: 'Hakaan',
    size: '1L',
    speed: 5,
    ancestryPoints: 3,
    signatureTraitName: 'Big!',
    purchasedTraits: [
      { name: 'All Is a Feather', cost: 1 },
      { name: 'Doomsight', cost: 2 },
      { name: 'Forceful', cost: 1 },
      { name: 'Great Fortitude', cost: 2 },
      { name: 'Stand Tough', cost: 1 },
    ],
  },
  {
    id: 'high-elf',
    name: 'High Elf',
    size: '1M',
    speed: 5,
    ancestryPoints: 3,
    signatureTraitName: 'High Elf Glamor',
    purchasedTraits: [
      { name: 'Glamor of Terror', cost: 2 },
      { name: 'Graceful Retreat', cost: 1 },
      { name: 'High Senses', cost: 1 },
      { name: 'Otherworldly Grace', cost: 2 },
      { name: 'Revisit Memory', cost: 1 },
      { name: 'Unstoppable Mind', cost: 2 },
    ],
  },
  {
    id: 'human',
    name: 'Human',
    size: '1M',
    speed: 5,
    ancestryPoints: 3,
    signatureTraitName: 'Detect the Supernatural',
    purchasedTraits: [
      { name: "Can't Take Hold", cost: 1 },
      { name: 'Determination', cost: 2 },
      { name: 'Perseverance', cost: 1 },
      { name: 'Resist the Unnatural', cost: 1 },
      { name: 'Staying Power', cost: 2 },
    ],
  },
  {
    id: 'memonek',
    name: 'Memonek',
    size: '1M',
    speed: 5,
    ancestryPoints: 4,
    // Memonek has TWO signature traits: Fall Lightly and Lightweight
    // The code combines them into one signature feature
    signatureTraitName: 'Fall Lightly',
    purchasedTraits: [
      { name: 'I Am Law', cost: 1 },
      { name: 'Keeper of Order', cost: 2 },
      { name: 'Lightning Nimbleness', cost: 2 },
      { name: 'Nonstop', cost: 2 },
      { name: 'Systematic Mind', cost: 1 },
      { name: 'Unphased', cost: 1 },
      { name: 'Useful Emotion', cost: 1 },
    ],
  },
  {
    id: 'orc',
    name: 'Orc',
    size: '1M',
    speed: 5,
    ancestryPoints: 3,
    signatureTraitName: 'Relentless',
    purchasedTraits: [
      { name: 'Bloodfire Rush', cost: 1 },
      { name: 'Glowing Recovery', cost: 2 },
      { name: 'Grounded', cost: 1 },
      { name: 'Nonstop', cost: 2 },
      { name: 'Passionate Artisan', cost: 1 },
    ],
  },
  {
    id: 'polder',
    name: 'Polder',
    size: '1S',
    speed: 5,
    ancestryPoints: 4,
    // Polder has TWO signature traits: Shadowmeld and Small!
    // The code combines them into one signature feature
    signatureTraitName: 'Shadowmeld',
    purchasedTraits: [
      { name: 'Corruption Immunity', cost: 1 },
      { name: 'Fearless', cost: 2 },
      { name: 'Graceful Retreat', cost: 1 },
      { name: 'Nimblestep', cost: 2 },
      { name: 'Polder Geist', cost: 1 },
      { name: 'Reactive Tumble', cost: 1 },
    ],
  },
  {
    id: 'revenant',
    name: 'Revenant',
    size: '1M',
    speed: 5,
    ancestryPoints: 2,
    // Revenant has TWO signature traits: Former Life and Tough But Withered
    // The code uses Tough But Withered as the primary signature feature
    signatureTraitName: 'Tough But Withered',
    purchasedTraits: [
      { name: 'Bloodless', cost: 2 },
      { name: 'Previous Life (1 Point)', cost: 1 },
      { name: 'Previous Life (2 Points)', cost: 2 },
      { name: 'Undead Influence', cost: 1 },
      { name: 'Vengeance Mark', cost: 2 },
    ],
  },
  {
    id: 'time-raider',
    name: 'Time Raider',
    size: '1M',
    speed: 5,
    ancestryPoints: 3,
    signatureTraitName: 'Psychic Scar',
    purchasedTraits: [
      { name: 'Beyondsight', cost: 1 },
      { name: 'Foresight', cost: 1 },
      { name: 'Four-Armed Athletics', cost: 1 },
      { name: 'Four-Armed Martial Arts', cost: 2 },
      { name: 'Psionic Gift', cost: 2 },
      { name: 'Unstoppable Mind', cost: 2 },
    ],
  },
  {
    id: 'wode-elf',
    name: 'Wode Elf',
    size: '1M',
    speed: 5,
    ancestryPoints: 3,
    signatureTraitName: 'Wode Elf Glamor',
    purchasedTraits: [
      { name: 'Forest Walk', cost: 1 },
      { name: 'Quick and Brutal', cost: 1 },
      { name: 'Otherworldly Grace', cost: 2 },
      { name: 'Revisit Memory', cost: 1 },
      { name: 'Swift', cost: 1 },
      { name: 'The Wode Defends', cost: 2 },
    ],
  },
];

// ============================================================
// Tests
// ============================================================

describe('Audit: Ancestries — All 12 present', () => {
  it('should have exactly 12 ancestries', () => {
    const all = GameData.getAllAncestries();
    expect(all.length).toBe(12);
  });

  it('should contain all expected ancestry IDs', () => {
    const ids = GameData.getAncestryIds();
    const expectedIds = SOURCE_ANCESTRIES.map((a) => a.id);
    for (const id of expectedIds) {
      expect(ids).toContain(id);
    }
  });
});

// Per-ancestry detailed validation
for (const source of SOURCE_ANCESTRIES) {
  describe(`Audit: Ancestry — ${source.name}`, () => {
    it(`should exist with id "${source.id}"`, () => {
      const ancestry = GameData.getAncestry(source.id);
      expect(ancestry).toBeDefined();
    });

    it(`should have name "${source.name}"`, () => {
      const ancestry = GameData.getAncestry(source.id);
      expect(ancestry?.name).toBe(source.name);
    });

    it(`should have size "${source.size}"`, () => {
      const ancestry = GameData.getAncestry(source.id);
      expect(ancestry?.size).toBe(source.size);
    });

    it(`should have speed ${source.speed}`, () => {
      const ancestry = GameData.getAncestry(source.id);
      expect(ancestry?.speed).toBe(source.speed);
    });

    it(`should have ${source.ancestryPoints} ancestry points`, () => {
      const ancestry = GameData.getAncestry(source.id);
      expect(ancestry?.ancestryPoints).toBe(source.ancestryPoints);
    });

    it(`should have signature trait containing "${source.signatureTraitName}"`, () => {
      const ancestry = GameData.getAncestry(source.id) as any;
      // The code stores signature trait in signatureFeature.name
      // Some ancestries combine multiple signature traits into one entry
      const sigName: string = ancestry?.signatureFeature?.name ?? '';
      expect(sigName.toLowerCase()).toContain(source.signatureTraitName.toLowerCase());
    });

    it(`should have ${source.purchasedTraits.length} purchased traits`, () => {
      const ancestry = GameData.getAncestry(source.id) as any;
      expect(ancestry?.purchasedTraits?.length).toBe(source.purchasedTraits.length);
    });

    // Validate each purchased trait exists with correct name and cost
    for (const sourceTrait of source.purchasedTraits) {
      it(`purchased trait "${sourceTrait.name}" should exist with cost ${sourceTrait.cost}`, () => {
        const ancestry = GameData.getAncestry(source.id) as any;
        const traits = ancestry?.purchasedTraits ?? [];

        // Match by name (the code may use slightly different names for IDs)
        const match = traits.find(
          (t: any) => t.name === sourceTrait.name
        );

        expect(match).toBeDefined();
        if (match) {
          expect(match.cost).toBe(sourceTrait.cost);
        }
      });
    }
  });
}

// ============================================================
// Cross-ancestry validation
// ============================================================

describe('Audit: Ancestries — Cross-checks', () => {
  it('all ancestries should have a non-empty signature feature', () => {
    for (const source of SOURCE_ANCESTRIES) {
      const ancestry = GameData.getAncestry(source.id) as any;
      expect(ancestry?.signatureFeature).toBeDefined();
      expect(ancestry?.signatureFeature?.name).toBeTruthy();
    }
  });

  it('all ancestries should have speed >= 5', () => {
    for (const ancestry of GameData.getAllAncestries() as any[]) {
      expect(ancestry.speed).toBeGreaterThanOrEqual(5);
    }
  });

  it('all ancestries should have ancestry points between 2 and 4', () => {
    for (const ancestry of GameData.getAllAncestries() as any[]) {
      expect(ancestry.ancestryPoints).toBeGreaterThanOrEqual(2);
      expect(ancestry.ancestryPoints).toBeLessThanOrEqual(4);
    }
  });

  it('only Hakaan should be size 1L', () => {
    const largeAncestries = (GameData.getAllAncestries() as any[]).filter(
      (a) => a.size === '1L'
    );
    expect(largeAncestries.length).toBe(1);
    expect(largeAncestries[0].id).toBe('hakaan');
  });

  it('only Polder should be size 1S', () => {
    const smallAncestries = (GameData.getAllAncestries() as any[]).filter(
      (a) => a.size === '1S'
    );
    expect(smallAncestries.length).toBe(1);
    expect(smallAncestries[0].id).toBe('polder');
  });

  it('Memonek and Polder should have 4 ancestry points (all others have 2 or 3)', () => {
    const memonek = GameData.getAncestry('memonek') as any;
    const polder = GameData.getAncestry('polder') as any;
    expect(memonek?.ancestryPoints).toBe(4);
    expect(polder?.ancestryPoints).toBe(4);
  });

  it('Revenant should have 2 ancestry points (the lowest)', () => {
    const revenant = GameData.getAncestry('revenant') as any;
    expect(revenant?.ancestryPoints).toBe(2);
  });

  it('each purchased trait cost should be 1 or 2', () => {
    for (const ancestry of GameData.getAllAncestries() as any[]) {
      for (const trait of ancestry.purchasedTraits ?? []) {
        expect(trait.cost).toBeGreaterThanOrEqual(1);
        expect(trait.cost).toBeLessThanOrEqual(2);
      }
    }
  });
});
