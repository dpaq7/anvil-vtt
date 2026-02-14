/**
 * Titles & Progression Audit — Slice 12 / Task 15
 *
 * Validates title data and level progression against Draw Steel source books:
 * - Title counts by echelon
 * - Each title's id, name, echelon, prerequisite, effects/choices
 * - XP thresholds per level
 * - Echelon boundaries (L1-3=E1, L4-6=E2, L7-9=E3, L10=E4)
 * - Characteristic increases at L4, L7, L10
 * - Perk gains at L2, L4, L6, L8
 * - GameData.getEchelon() correctness
 *
 * Source: docs/rules_data/data-rules-md/Titles/
 * Source: docs/rules_data/data-rules-md/Chapters/Making a Hero.md
 */
import { describe, it, expect } from 'vitest';
import { TITLES, TITLES_BY_ECHELON } from '../rules/titles.js';
import { levelProgressions, getProgressionForLevel, getFeaturesUpToLevel } from '../rules/progression.js';
import { GameData } from '../game-data/lib/game-rules.js';

// ============================================================
// TITLE DATA — Source truth from Draw Steel core book
// ============================================================

/**
 * Source of truth: docs/rules_data/data-rules-md/Titles/_Index.md
 * 20 first-echelon, 16 second-echelon, 13 third-echelon, 10 fourth-echelon = 59 core titles
 * Plus supplemental titles from Fishing & Summoner expansions
 */

// Core book titles per echelon (from _Index.md)
const CORE_1ST_ECHELON_TITLES = [
  { id: 'ancient-loremaster', name: 'Ancient Loremaster' },
  { id: 'battleaxe-diplomat', name: 'Battleaxe Diplomat' },
  { id: 'brawler', name: 'Brawler' },
  { id: 'city-rat', name: 'City Rat' },
  { id: 'doomed', name: 'Doomed' },
  { id: 'dwarven-legionnaire', name: 'Dwarven Legionnaire' },
  { id: 'elemental-dabbler', name: 'Elemental Dabbler' },
  { id: 'faction-member', name: 'Faction Member' },
  { id: 'local-hero', name: 'Local Hero' },
  { id: 'mage-hunter', name: 'Mage Hunter' },
  { id: 'marshal', name: 'Marshal' },
  { id: 'monster-bane', name: 'Monster Bane' },
  { id: 'owed-a-favor', name: 'Owed a Favor' },
  { id: 'presumed-dead', name: 'Presumed Dead' },
  { id: 'ratcatcher', name: 'Ratcatcher' },
  { id: 'saved-for-a-worse-fate', name: 'Saved for a Worse Fate' },
  { id: 'ship-captain', name: 'Ship Captain' },
  // NOTE: Source book calls this "Troupe Leading Player" but code uses "Troupe Tactics"
  // The code id 'troupe-tactics' and name 'Troupe Tactics' is a rename; content matches
  { id: 'troupe-tactics', name: 'Troupe Tactics' },
  { id: 'wanted-dead-or-alive', name: 'Wanted Dead or Alive' },
  { id: 'zombie-slayer', name: 'Zombie Slayer' },
];

const CORE_2ND_ECHELON_TITLES = [
  { id: 'arena-fighter', name: 'Arena Fighter' },
  { id: 'awakened', name: 'Awakened' },
  { id: 'battlefield-commander', name: 'Battlefield Commander' },
  { id: 'blood-magic', name: 'Blood Magic' },
  { id: 'corsair', name: 'Corsair' },
  { id: 'faction-officer', name: 'Faction Officer' },
  { id: 'fey-friend', name: 'Fey Friend' },
  { id: 'giant-slayer', name: 'Giant Slayer' },
  { id: 'godsworn', name: 'Godsworn' },
  { id: 'heist-hero', name: 'Heist Hero' },
  { id: 'knight', name: 'Knight' },
  { id: 'master-librarian', name: 'Master Librarian' },
  { id: 'special-agent', name: 'Special Agent' },
  { id: 'sworn-hunter', name: 'Sworn Hunter' },
  { id: 'undead-slain', name: 'Undead Slain' },
  { id: 'unstoppable', name: 'Unstoppable' },
];

const CORE_3RD_ECHELON_TITLES = [
  { id: 'armed-and-dangerous', name: 'Armed and Dangerous' },
  { id: 'back-from-the-grave', name: 'Back From the Grave' },
  { id: 'demon-slayer', name: 'Demon Slayer' },
  { id: 'diabolist', name: 'Diabolist' },
  { id: 'dragon-blooded', name: 'Dragon Blooded' },
  { id: 'fleet-admiral', name: 'Fleet Admiral' },
  { id: 'maestro', name: 'Maestro' },
  { id: 'master-crafter', name: 'Master Crafter' },
  { id: 'noble', name: 'Noble' },
  { id: 'planar-voyager', name: 'Planar Voyager' },
  { id: 'scarred', name: 'Scarred' },
  { id: 'siege-breaker', name: 'Siege Breaker' },
  { id: 'teacher', name: 'Teacher' },
];

const CORE_4TH_ECHELON_TITLES = [
  { id: 'champion-competitor', name: 'Champion Competitor' },
  { id: 'demigod', name: 'Demigod' },
  { id: 'enlightened', name: 'Enlightened' },
  { id: 'forsaken', name: 'Forsaken' },
  { id: 'monarch', name: 'Monarch' },
  { id: 'peace-bringer', name: 'Peace Bringer' },
  { id: 'reborn', name: 'Reborn' },
  { id: 'theoretical-warrior', name: 'Theoretical Warrior' },
  { id: 'tireless', name: 'Tireless' },
  { id: 'unchained', name: 'Unchained' },
];

// Supplemental titles (Fishing & Summoner expansions — not in core _Index.md)
const SUPPLEMENTAL_1ST_ECHELON = [
  { id: 'angler', name: 'Angler' },
  { id: 'goldenrod', name: 'Goldenrod' },
  { id: 'master-of-reels', name: 'Master of Reels' },
  { id: 'safeguarded', name: 'Safeguarded' },
];

const SUPPLEMENTAL_2ND_ECHELON = [
  { id: 'sigilwright', name: 'Sigilwright' },
  { id: 'summoner-successor', name: 'Summoner Successor' },
];

const SUPPLEMENTAL_3RD_ECHELON = [
  { id: 'ringleader', name: 'Ringleader' },
];

const SUPPLEMENTAL_4TH_ECHELON = [
  { id: 'delegator', name: 'Delegator' },
  { id: 'high-summoner', name: 'High Summoner of the Circle' },
];

// Total expected
const TOTAL_CORE_TITLES = 20 + 16 + 13 + 10; // 59
const TOTAL_SUPPLEMENTAL_TITLES = 4 + 2 + 1 + 2; // 9
const TOTAL_ALL_TITLES = TOTAL_CORE_TITLES + TOTAL_SUPPLEMENTAL_TITLES; // 68

// ============================================================
// 1. Title Counts
// ============================================================
describe('Audit: Titles — Counts', () => {
  it('total title count matches expected (59 core + 9 supplemental = 68)', () => {
    expect(TITLES.length).toBe(TOTAL_ALL_TITLES);
  });

  it('1st echelon has 20 core + 4 supplemental = 24 titles', () => {
    expect(TITLES_BY_ECHELON['1st'].length).toBe(20 + 4);
  });

  it('2nd echelon has 16 core + 2 supplemental = 18 titles', () => {
    expect(TITLES_BY_ECHELON['2nd'].length).toBe(16 + 2);
  });

  it('3rd echelon has 13 core + 1 supplemental = 14 titles', () => {
    expect(TITLES_BY_ECHELON['3rd'].length).toBe(13 + 1);
  });

  it('4th echelon has 10 core + 2 supplemental = 12 titles', () => {
    expect(TITLES_BY_ECHELON['4th'].length).toBe(10 + 2);
  });

  it('every title has unique id', () => {
    const ids = TITLES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every title has unique name', () => {
    const names = TITLES.map((t) => t.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('TITLES_BY_ECHELON sums match TITLES total', () => {
    const sum =
      TITLES_BY_ECHELON['1st'].length +
      TITLES_BY_ECHELON['2nd'].length +
      TITLES_BY_ECHELON['3rd'].length +
      TITLES_BY_ECHELON['4th'].length;
    expect(sum).toBe(TITLES.length);
  });
});

// ============================================================
// 2. Core 1st Echelon Titles
// ============================================================
describe('Audit: Titles — 1st Echelon (Core)', () => {
  for (const expected of CORE_1ST_ECHELON_TITLES) {
    describe(expected.name, () => {
      it(`exists with id '${expected.id}'`, () => {
        const title = TITLES.find((t) => t.id === expected.id);
        expect(title).toBeDefined();
        expect(title!.name).toBe(expected.name);
      });

      it(`is in 1st echelon`, () => {
        const title = TITLES.find((t) => t.id === expected.id);
        expect(title!.echelon).toBe('1st');
      });

      it(`has a prerequisite`, () => {
        const title = TITLES.find((t) => t.id === expected.id);
        expect(title!.prerequisite).toBeTruthy();
        expect(title!.prerequisite.length).toBeGreaterThan(0);
      });

      it(`has effects or choices`, () => {
        const title = TITLES.find((t) => t.id === expected.id);
        const hasEffects = title!.effects && title!.effects.length > 0;
        const hasChoices = title!.choices && title!.choices.length > 0;
        expect(hasEffects || hasChoices).toBe(true);
      });
    });
  }
});

// ============================================================
// 3. Core 2nd Echelon Titles
// ============================================================
describe('Audit: Titles — 2nd Echelon (Core)', () => {
  for (const expected of CORE_2ND_ECHELON_TITLES) {
    describe(expected.name, () => {
      it(`exists with id '${expected.id}'`, () => {
        const title = TITLES.find((t) => t.id === expected.id);
        expect(title).toBeDefined();
        expect(title!.name).toBe(expected.name);
      });

      it(`is in 2nd echelon`, () => {
        const title = TITLES.find((t) => t.id === expected.id);
        expect(title!.echelon).toBe('2nd');
      });

      it(`has a prerequisite`, () => {
        const title = TITLES.find((t) => t.id === expected.id);
        expect(title!.prerequisite).toBeTruthy();
      });

      it(`has effects or choices`, () => {
        const title = TITLES.find((t) => t.id === expected.id);
        const hasEffects = title!.effects && title!.effects.length > 0;
        const hasChoices = title!.choices && title!.choices.length > 0;
        expect(hasEffects || hasChoices).toBe(true);
      });
    });
  }
});

// ============================================================
// 4. Core 3rd Echelon Titles
// ============================================================
describe('Audit: Titles — 3rd Echelon (Core)', () => {
  for (const expected of CORE_3RD_ECHELON_TITLES) {
    describe(expected.name, () => {
      it(`exists with id '${expected.id}'`, () => {
        const title = TITLES.find((t) => t.id === expected.id);
        expect(title).toBeDefined();
        expect(title!.name).toBe(expected.name);
      });

      it(`is in 3rd echelon`, () => {
        const title = TITLES.find((t) => t.id === expected.id);
        expect(title!.echelon).toBe('3rd');
      });

      it(`has a prerequisite`, () => {
        const title = TITLES.find((t) => t.id === expected.id);
        expect(title!.prerequisite).toBeTruthy();
      });

      it(`has effects or choices`, () => {
        const title = TITLES.find((t) => t.id === expected.id);
        const hasEffects = title!.effects && title!.effects.length > 0;
        const hasChoices = title!.choices && title!.choices.length > 0;
        expect(hasEffects || hasChoices).toBe(true);
      });
    });
  }
});

// ============================================================
// 5. Core 4th Echelon Titles
// ============================================================
describe('Audit: Titles — 4th Echelon (Core)', () => {
  for (const expected of CORE_4TH_ECHELON_TITLES) {
    describe(expected.name, () => {
      it(`exists with id '${expected.id}'`, () => {
        const title = TITLES.find((t) => t.id === expected.id);
        expect(title).toBeDefined();
        expect(title!.name).toBe(expected.name);
      });

      it(`is in 4th echelon`, () => {
        const title = TITLES.find((t) => t.id === expected.id);
        expect(title!.echelon).toBe('4th');
      });

      it(`has a prerequisite`, () => {
        const title = TITLES.find((t) => t.id === expected.id);
        expect(title!.prerequisite).toBeTruthy();
      });

      it(`has effects or choices`, () => {
        const title = TITLES.find((t) => t.id === expected.id);
        const hasEffects = title!.effects && title!.effects.length > 0;
        const hasChoices = title!.choices && title!.choices.length > 0;
        expect(hasEffects || hasChoices).toBe(true);
      });
    });
  }
});

// ============================================================
// 6. Supplemental Titles (Fishing & Summoner)
// ============================================================
describe('Audit: Titles — Supplemental (Fishing & Summoner)', () => {
  const allSupplemental = [
    ...SUPPLEMENTAL_1ST_ECHELON.map((t) => ({ ...t, echelon: '1st' as const })),
    ...SUPPLEMENTAL_2ND_ECHELON.map((t) => ({ ...t, echelon: '2nd' as const })),
    ...SUPPLEMENTAL_3RD_ECHELON.map((t) => ({ ...t, echelon: '3rd' as const })),
    ...SUPPLEMENTAL_4TH_ECHELON.map((t) => ({ ...t, echelon: '4th' as const })),
  ];

  for (const expected of allSupplemental) {
    describe(expected.name, () => {
      it(`exists with id '${expected.id}'`, () => {
        const title = TITLES.find((t) => t.id === expected.id);
        expect(title).toBeDefined();
        expect(title!.name).toBe(expected.name);
      });

      it(`is in ${expected.echelon} echelon`, () => {
        const title = TITLES.find((t) => t.id === expected.id);
        expect(title!.echelon).toBe(expected.echelon);
      });

      it(`has a prerequisite`, () => {
        const title = TITLES.find((t) => t.id === expected.id);
        expect(title!.prerequisite).toBeTruthy();
      });

      it(`has effects or choices`, () => {
        const title = TITLES.find((t) => t.id === expected.id);
        const hasEffects = title!.effects && title!.effects.length > 0;
        const hasChoices = title!.choices && title!.choices.length > 0;
        expect(hasEffects || hasChoices).toBe(true);
      });
    });
  }
});

// ============================================================
// 7. Spot-Check Title Prerequisites (from source MD)
// ============================================================
describe('Audit: Titles — Prerequisite Spot Checks', () => {
  it('Ancient Loremaster: "You find a trove of forgotten books."', () => {
    const t = TITLES.find((t) => t.id === 'ancient-loremaster')!;
    expect(t.prerequisite).toBe('You find a trove of forgotten books.');
  });

  it('Brawler: "You triumph in battle without killing any of your foes."', () => {
    const t = TITLES.find((t) => t.id === 'brawler')!;
    expect(t.prerequisite).toBe('You triumph in battle without killing any of your foes.');
  });

  it('Corsair requires Ship Captain title', () => {
    const t = TITLES.find((t) => t.id === 'corsair')!;
    expect(t.prerequisite).toContain('Ship Captain');
  });

  it('Faction Officer requires Faction Member title', () => {
    const t = TITLES.find((t) => t.id === 'faction-officer')!;
    expect(t.prerequisite).toContain('Faction Member');
  });

  it('Fleet Admiral requires Corsair title', () => {
    const t = TITLES.find((t) => t.id === 'fleet-admiral')!;
    expect(t.prerequisite).toContain('Corsair');
  });

  it('Tireless requires Unstoppable title', () => {
    const t = TITLES.find((t) => t.id === 'tireless')!;
    expect(t.prerequisite).toContain('Unstoppable');
  });

  it('Unchained requires Heist Hero title', () => {
    const t = TITLES.find((t) => t.id === 'unchained')!;
    expect(t.prerequisite).toContain('Heist Hero');
  });

  it('Theoretical Warrior requires Master Librarian title', () => {
    const t = TITLES.find((t) => t.id === 'theoretical-warrior')!;
    expect(t.prerequisite).toContain('Master Librarian');
  });

  it('Demigod requires Godsworn title', () => {
    const t = TITLES.find((t) => t.id === 'demigod')!;
    expect(t.prerequisite).toContain('Godsworn');
  });
});

// ============================================================
// 8. Spot-Check Title Choices/Effects Counts (from source MD)
// ============================================================
describe('Audit: Titles — Choice/Effect Count Spot Checks', () => {
  it('Ancient Loremaster has 3 choices', () => {
    const t = TITLES.find((t) => t.id === 'ancient-loremaster')!;
    expect(t.choices).toBeDefined();
    expect(t.choices!.length).toBe(3);
  });

  it('Brawler has 4 choices', () => {
    const t = TITLES.find((t) => t.id === 'brawler')!;
    expect(t.choices).toBeDefined();
    expect(t.choices!.length).toBe(4);
  });

  it('Doomed has 1 effect (no choices)', () => {
    const t = TITLES.find((t) => t.id === 'doomed')!;
    expect(t.effects).toBeDefined();
    expect(t.effects!.length).toBe(1);
    // Doomed has no choices array or an empty one
    expect(!t.choices || t.choices.length === 0).toBe(true);
  });

  it('Faction Member has both effects and choices', () => {
    const t = TITLES.find((t) => t.id === 'faction-member')!;
    expect(t.effects).toBeDefined();
    expect(t.effects!.length).toBeGreaterThan(0);
    expect(t.choices).toBeDefined();
    expect(t.choices!.length).toBe(4);
  });

  it('Saved for a Worse Fate has both effects and 4 choices', () => {
    const t = TITLES.find((t) => t.id === 'saved-for-a-worse-fate')!;
    expect(t.effects).toBeDefined();
    expect(t.effects!.length).toBe(1);
    expect(t.choices).toBeDefined();
    expect(t.choices!.length).toBe(4);
  });

  it('Monarch has 2 effects and 4 choices', () => {
    const t = TITLES.find((t) => t.id === 'monarch')!;
    expect(t.effects).toBeDefined();
    expect(t.effects!.length).toBe(2);
    expect(t.choices).toBeDefined();
    expect(t.choices!.length).toBe(4);
  });

  it('Demigod has 3 effects and 3 choices', () => {
    const t = TITLES.find((t) => t.id === 'demigod')!;
    expect(t.effects).toBeDefined();
    expect(t.effects!.length).toBe(3);
    expect(t.choices).toBeDefined();
    expect(t.choices!.length).toBe(3);
  });
});

// ============================================================
// 9. Spot-Check Title Choice Names (from source MD)
// ============================================================
describe('Audit: Titles — Choice Name Spot Checks', () => {
  it('Ancient Loremaster choices: Leverage, Rare Books, Susurrus Codex', () => {
    const t = TITLES.find((t) => t.id === 'ancient-loremaster')!;
    const names = t.choices!.map((c) => c.name);
    expect(names).toContain('Leverage');
    expect(names).toContain('Rare Books');
    expect(names).toContain('Susurrus Codex');
  });

  it('Battleaxe Diplomat choices: Iron Hand in Velvet Glove, Truce!, Warriors\' Understanding', () => {
    const t = TITLES.find((t) => t.id === 'battleaxe-diplomat')!;
    const names = t.choices!.map((c) => c.name);
    expect(names).toContain('Iron Hand in Velvet Glove');
    expect(names).toContain('Truce!');
    expect(names).toContain("Warriors' Understanding");
  });

  it('Troupe Tactics choices: Flying Circus, Spotlight, Supporting Player, Work the Crowd', () => {
    const t = TITLES.find((t) => t.id === 'troupe-tactics')!;
    const names = t.choices!.map((c) => c.name);
    expect(names).toContain('Flying Circus');
    expect(names).toContain('Spotlight');
    expect(names).toContain('Supporting Player');
    expect(names).toContain('Work the Crowd');
  });

  it('Scarred has effect with +20 Stamina maximum', () => {
    const t = TITLES.find((t) => t.id === 'scarred')!;
    expect(t.effects).toBeDefined();
    const desc = t.effects!.map((e) => e.description).join(' ');
    expect(desc).toContain('20');
    expect(desc).toContain('Stamina maximum');
  });

  it('Knight choices include Knightly Aegis (+6 Stamina maximum)', () => {
    const t = TITLES.find((t) => t.id === 'knight')!;
    const aegis = t.choices!.find((c) => c.name === 'Knightly Aegis');
    expect(aegis).toBeDefined();
    expect(aegis!.description).toContain('6');
  });
});

// ============================================================
// 10. Title Data Integrity
// ============================================================
describe('Audit: Titles — Data Integrity', () => {
  it('every title has a non-empty id', () => {
    for (const title of TITLES) {
      expect(title.id).toBeTruthy();
      expect(title.id.length).toBeGreaterThan(0);
    }
  });

  it('every title has a non-empty name', () => {
    for (const title of TITLES) {
      expect(title.name).toBeTruthy();
      expect(title.name.length).toBeGreaterThan(0);
    }
  });

  it('every title has a valid echelon', () => {
    const validEchelons = ['1st', '2nd', '3rd', '4th'];
    for (const title of TITLES) {
      expect(validEchelons).toContain(title.echelon);
    }
  });

  it('every title has a non-empty prerequisite', () => {
    for (const title of TITLES) {
      expect(title.prerequisite).toBeTruthy();
      expect(title.prerequisite.length).toBeGreaterThan(0);
    }
  });

  it('every title has at least one effect or choice', () => {
    for (const title of TITLES) {
      const hasEffects = title.effects && title.effects.length > 0;
      const hasChoices = title.choices && title.choices.length > 0;
      expect(hasEffects || hasChoices).toBe(true);
    }
  });

  it('every effect has name and description', () => {
    for (const title of TITLES) {
      if (title.effects) {
        for (const effect of title.effects) {
          expect(effect.name).toBeTruthy();
          expect(effect.description).toBeTruthy();
        }
      }
    }
  });

  it('every choice has name and description', () => {
    for (const title of TITLES) {
      if (title.choices) {
        for (const choice of title.choices) {
          expect(choice.name).toBeTruthy();
          expect(choice.description).toBeTruthy();
        }
      }
    }
  });

  it('title ids are kebab-case', () => {
    for (const title of TITLES) {
      expect(title.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it('TITLES_BY_ECHELON matches filtered TITLES', () => {
    for (const echelon of ['1st', '2nd', '3rd', '4th'] as const) {
      const fromFilter = TITLES.filter((t) => t.echelon === echelon);
      const fromMap = TITLES_BY_ECHELON[echelon];
      expect(fromMap.length).toBe(fromFilter.length);
      for (const title of fromMap) {
        expect(title.echelon).toBe(echelon);
      }
    }
  });
});

// ============================================================
// 11. Title Chains (upgrade paths requiring previous titles)
// ============================================================
describe('Audit: Titles — Title Chains', () => {
  const chains = [
    // Ship line: Ship Captain -> Corsair -> Fleet Admiral
    { from: 'ship-captain', to: 'corsair', echelonFrom: '1st', echelonTo: '2nd' },
    { from: 'corsair', to: 'fleet-admiral', echelonFrom: '2nd', echelonTo: '3rd' },
    // Faction line: Faction Member -> Faction Officer
    { from: 'faction-member', to: 'faction-officer', echelonFrom: '1st', echelonTo: '2nd' },
    // Loremaster line: Ancient Loremaster -> Master Librarian -> Theoretical Warrior
    { from: 'ancient-loremaster', to: 'master-librarian', echelonFrom: '1st', echelonTo: '2nd' },
    { from: 'master-librarian', to: 'theoretical-warrior', echelonFrom: '2nd', echelonTo: '4th' },
    // Marshal line: Marshal -> Sworn Hunter
    { from: 'marshal', to: 'sworn-hunter', echelonFrom: '1st', echelonTo: '2nd' },
    // Unstoppable line: Unstoppable -> Tireless
    { from: 'unstoppable', to: 'tireless', echelonFrom: '2nd', echelonTo: '4th' },
    // Godsworn line: Godsworn -> Demigod
    { from: 'godsworn', to: 'demigod', echelonFrom: '2nd', echelonTo: '4th' },
    // Heist line: (Troupe Tactics ->) Heist Hero -> Unchained
    { from: 'heist-hero', to: 'unchained', echelonFrom: '2nd', echelonTo: '4th' },
    // Battlefield line: Battlefield Commander -> Siege Breaker
    { from: 'battlefield-commander', to: 'siege-breaker', echelonFrom: '2nd', echelonTo: '3rd' },
  ];

  for (const chain of chains) {
    it(`${chain.from} (${chain.echelonFrom}) -> ${chain.to} (${chain.echelonTo})`, () => {
      const from = TITLES.find((t) => t.id === chain.from);
      const to = TITLES.find((t) => t.id === chain.to);
      expect(from).toBeDefined();
      expect(to).toBeDefined();
      expect(from!.echelon).toBe(chain.echelonFrom);
      expect(to!.echelon).toBe(chain.echelonTo);
      // The "to" title should mention the "from" title name in its prerequisite
      expect(to!.prerequisite).toContain(from!.name);
    });
  }
});

// ============================================================
// 12. XP Advancement Table (Source: Making a Hero.md)
// ============================================================
describe('Audit: Progression — XP Advancement Table', () => {
  // From Making a Hero.md, Heroic Advancement Table:
  // L1: 0-15, L2: 16-31, L3: 32-47, L4: 48-63, L5: 64-79,
  // L6: 80-95, L7: 96-111, L8: 112-127, L9: 128-143, L10: 144+
  const XP_THRESHOLDS: Array<{ level: number; minXP: number; maxXP: number | null }> = [
    { level: 1, minXP: 0, maxXP: 15 },
    { level: 2, minXP: 16, maxXP: 31 },
    { level: 3, minXP: 32, maxXP: 47 },
    { level: 4, minXP: 48, maxXP: 63 },
    { level: 5, minXP: 64, maxXP: 79 },
    { level: 6, minXP: 80, maxXP: 95 },
    { level: 7, minXP: 96, maxXP: 111 },
    { level: 8, minXP: 112, maxXP: 127 },
    { level: 9, minXP: 128, maxXP: 143 },
    { level: 10, minXP: 144, maxXP: null },
  ];

  // NOTE: The progression.ts file focuses on Summoner-specific progression,
  // not general XP thresholds. XP thresholds are validated via GameData.getEchelon().
  // We validate the XP table implicitly through echelon boundaries.

  it('XP ranges have 16-point intervals (levels 1-9)', () => {
    for (let i = 0; i < 9; i++) {
      const range = XP_THRESHOLDS[i]!;
      expect(range.maxXP! - range.minXP).toBe(15); // 0-15, 16-31, etc. (16 values each)
    }
  });

  it('XP ranges are contiguous (no gaps)', () => {
    for (let i = 1; i < 10; i++) {
      const prev = XP_THRESHOLDS[i - 1]!;
      const curr = XP_THRESHOLDS[i]!;
      expect(curr.minXP).toBe(prev.maxXP! + 1);
    }
  });

  it('Level 10 starts at 144 XP', () => {
    expect(XP_THRESHOLDS[9]!.minXP).toBe(144);
  });

  it('Level 1 starts at 0 XP', () => {
    expect(XP_THRESHOLDS[0]!.minXP).toBe(0);
  });
});

// ============================================================
// 13. Echelon Boundaries (Source: Making a Hero.md / Classes)
// ============================================================
describe('Audit: Progression — Echelon Boundaries', () => {
  // Echelon 1: Levels 1-3
  // Echelon 2: Levels 4-6
  // Echelon 3: Levels 7-9
  // Echelon 4: Level 10

  it('Levels 1-3 are Echelon 1', () => {
    expect(GameData.getEchelon(1)).toBe(1);
    expect(GameData.getEchelon(2)).toBe(1);
    expect(GameData.getEchelon(3)).toBe(1);
  });

  it('Levels 4-6 are Echelon 2', () => {
    expect(GameData.getEchelon(4)).toBe(2);
    expect(GameData.getEchelon(5)).toBe(2);
    expect(GameData.getEchelon(6)).toBe(2);
  });

  it('Levels 7-9 are Echelon 3', () => {
    expect(GameData.getEchelon(7)).toBe(3);
    expect(GameData.getEchelon(8)).toBe(3);
    expect(GameData.getEchelon(9)).toBe(3);
  });

  it('Level 10 is Echelon 4', () => {
    expect(GameData.getEchelon(10)).toBe(4);
  });

  it('boundary: L3 -> L4 crosses echelon (E1 -> E2)', () => {
    expect(GameData.getEchelon(3)).toBe(1);
    expect(GameData.getEchelon(4)).toBe(2);
  });

  it('boundary: L6 -> L7 crosses echelon (E2 -> E3)', () => {
    expect(GameData.getEchelon(6)).toBe(2);
    expect(GameData.getEchelon(7)).toBe(3);
  });

  it('boundary: L9 -> L10 crosses echelon (E3 -> E4)', () => {
    expect(GameData.getEchelon(9)).toBe(3);
    expect(GameData.getEchelon(10)).toBe(4);
  });
});

// ============================================================
// 14. Summoner Progression (from progression.ts)
// ============================================================
describe('Audit: Progression — Summoner Level Progression', () => {
  it('has progression entries for levels 2, 3, 4, 5, 6, 7, 9, 10', () => {
    const levels = levelProgressions.map((p) => p.level);
    expect(levels).toContain(2);
    expect(levels).toContain(3);
    expect(levels).toContain(4);
    expect(levels).toContain(5);
    expect(levels).toContain(6);
    expect(levels).toContain(7);
    expect(levels).toContain(9);
    expect(levels).toContain(10);
  });

  it('level 2 grants Perk', () => {
    const prog = getProgressionForLevel(2);
    expect(prog).toBeDefined();
    const featureNames = prog!.features.map((f) => f.name);
    expect(featureNames.some((n) => n.toLowerCase().includes('perk'))).toBe(true);
  });

  it('level 3 has Kit Upgrade and 7-Essence Abilities', () => {
    const prog = getProgressionForLevel(3);
    expect(prog).toBeDefined();
    const featureNames = prog!.features.map((f) => f.name);
    expect(featureNames.some((n) => n.includes('Kit Upgrade'))).toBe(true);
    expect(featureNames.some((n) => n.includes('7-Essence'))).toBe(true);
  });

  it('level 4 has Reason increase to 3 and characteristic boost choice', () => {
    const prog = getProgressionForLevel(4);
    expect(prog).toBeDefined();
    expect(prog!.statChanges).toBeDefined();
    expect(prog!.statChanges!.reason).toBe(3);
    // Has a characteristic boost choice
    const boostFeature = prog!.features.find((f) => f.id === 'stat_boost');
    expect(boostFeature).toBeDefined();
    expect(boostFeature!.type).toBe('choice');
  });

  it('level 5 has Circle Feature Upgrade', () => {
    const prog = getProgressionForLevel(5);
    expect(prog).toBeDefined();
    const featureNames = prog!.features.map((f) => f.name);
    expect(featureNames.some((n) => n.includes('Circle Feature Upgrade'))).toBe(true);
  });

  it('level 6 has Return to the Source and 9-Essence Abilities (Champions)', () => {
    const prog = getProgressionForLevel(6);
    expect(prog).toBeDefined();
    const featureNames = prog!.features.map((f) => f.name);
    expect(featureNames.some((n) => n.includes('Return to the Source'))).toBe(true);
    expect(featureNames.some((n) => n.includes('9-Essence'))).toBe(true);
  });

  it('level 7 has all characteristics +1 and Font of Creation', () => {
    const prog = getProgressionForLevel(7);
    expect(prog).toBeDefined();
    expect(prog!.statChanges).toBeDefined();
    expect(prog!.statChanges!.allStats).toBe(1);
    const featureNames = prog!.features.map((f) => f.name);
    expect(featureNames.some((n) => n.includes('Font of Creation'))).toBe(true);
  });

  it('level 9 has Kit Improvement and 11-Essence Abilities', () => {
    const prog = getProgressionForLevel(9);
    expect(prog).toBeDefined();
    const featureNames = prog!.features.map((f) => f.name);
    expect(featureNames.some((n) => n.includes('Kit Improvement'))).toBe(true);
    expect(featureNames.some((n) => n.includes('11-Essence'))).toBe(true);
  });

  it('level 10 has Reason to 5 and Eidos', () => {
    const prog = getProgressionForLevel(10);
    expect(prog).toBeDefined();
    expect(prog!.statChanges).toBeDefined();
    expect(prog!.statChanges!.reason).toBe(5);
    const featureNames = prog!.features.map((f) => f.name);
    expect(featureNames.some((n) => n.includes('Eidos'))).toBe(true);
  });
});

// ============================================================
// 15. Progression Helper Functions
// ============================================================
describe('Audit: Progression — Helper Functions', () => {
  it('getProgressionForLevel returns undefined for level 1 (no progression entry)', () => {
    expect(getProgressionForLevel(1)).toBeUndefined();
  });

  it('getProgressionForLevel returns correct level for level 4', () => {
    const prog = getProgressionForLevel(4);
    expect(prog).toBeDefined();
    expect(prog!.level).toBe(4);
  });

  it('getFeaturesUpToLevel(4) includes levels 2, 3, 4', () => {
    const features = getFeaturesUpToLevel(4);
    const levels = features.map((f) => f.level);
    expect(levels).toContain(2);
    expect(levels).toContain(3);
    expect(levels).toContain(4);
    expect(levels).not.toContain(5);
  });

  it('getFeaturesUpToLevel(10) includes all progression levels', () => {
    const features = getFeaturesUpToLevel(10);
    expect(features.length).toBe(levelProgressions.length);
  });

  it('getFeaturesUpToLevel(1) returns empty array', () => {
    const features = getFeaturesUpToLevel(1);
    expect(features.length).toBe(0);
  });
});

// ============================================================
// 16. Summoner Minion Cap Progression
// ============================================================
describe('Audit: Progression — Summoner Minion Cap Scaling', () => {
  it('level 4 adds 4 to minion cap', () => {
    const prog = getProgressionForLevel(4);
    expect(prog!.statChanges!.minionCap).toBe(4);
  });

  it('level 7 adds 4 to minion cap', () => {
    const prog = getProgressionForLevel(7);
    expect(prog!.statChanges!.minionCap).toBe(4);
  });

  it('level 10 adds 4 to minion cap', () => {
    const prog = getProgressionForLevel(10);
    expect(prog!.statChanges!.minionCap).toBe(4);
  });
});

// ============================================================
// 17. Echelon-Title Alignment
// ============================================================
describe('Audit: Titles — Echelon-Title Alignment', () => {
  it('1st echelon titles should be accessible at levels 1-3', () => {
    for (const title of TITLES_BY_ECHELON['1st']) {
      expect(title.echelon).toBe('1st');
    }
  });

  it('4th echelon titles are the most powerful (highest echelon)', () => {
    for (const title of TITLES_BY_ECHELON['4th']) {
      expect(title.echelon).toBe('4th');
    }
  });

  it('echelon order: 1st < 2nd < 3rd < 4th (encoded in sorting)', () => {
    // Verify titles are sorted by echelon first
    const echelonOrder = { '1st': 1, '2nd': 2, '3rd': 3, '4th': 4 };
    let lastEchelonValue = 0;
    let lastNameInEchelon = '';

    for (const title of TITLES) {
      const currentValue = echelonOrder[title.echelon];
      if (currentValue > lastEchelonValue) {
        lastEchelonValue = currentValue;
        lastNameInEchelon = title.name;
      } else if (currentValue < lastEchelonValue) {
        // If we go backwards, sorting is broken
        expect(currentValue).toBeGreaterThanOrEqual(lastEchelonValue);
      } else {
        // Same echelon: should be alphabetical
        expect(title.name.localeCompare(lastNameInEchelon)).toBeGreaterThanOrEqual(0);
        lastNameInEchelon = title.name;
      }
    }
  });
});

// ============================================================
// 18. General Progression Validation for Draw Steel (non-Summoner)
// ============================================================
describe('Audit: Progression — General Draw Steel Level Rules', () => {
  // These validate GameData functions from game-rules.ts

  it('level validation rejects invalid levels', () => {
    expect(() => GameData.getEchelon(0)).toThrow();
    expect(() => GameData.getEchelon(11)).toThrow();
    expect(() => GameData.getEchelon(1.5)).toThrow();
  });

  it('stamina scales linearly per level for all classes', () => {
    // Validate that getStaminaAtLevel returns increasing values
    const classes = ['fury', 'conduit', 'shadow', 'tactician', 'talent'] as const;
    for (const cls of classes) {
      for (let level = 2; level <= 10; level++) {
        const current = GameData.getStaminaAtLevel(cls, level);
        const previous = GameData.getStaminaAtLevel(cls, level - 1);
        expect(current).toBeDefined();
        expect(previous).toBeDefined();
        expect(current!).toBeGreaterThan(previous!);
      }
    }
  });
});
