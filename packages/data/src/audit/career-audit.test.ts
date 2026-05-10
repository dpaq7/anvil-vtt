/**
 * Career Audit — Validates all 18 careers against Draw Steel source books
 *
 * Checks for each career:
 * - Career exists in code by name and id
 * - Skills granted match source
 * - Languages granted match source
 * - Renown value matches source
 * - Wealth tier matches source (if available)
 * - Project Points match source (if available)
 * - Perk type matches source
 * - Inciting incident options exist (non-empty string)
 *
 * Source: docs/rules_data/data-rules-md/Careers/*.md
 */
import { describe, it, expect } from 'vitest';
import { GameData } from '../game-data/lib/game-rules.js';
import { careers } from '../game-data/data/reference-data.js';

// ============================================================
// Helper: validate a single career against source data
// ============================================================
interface CareerSourceData {
  id: string;
  name: string;
  skills: string[];
  languages: string[];
  renown: number;
  wealth: number;
  projectPoints: number;
  perkType: string;
}

/**
 * Source data for all 18 careers, extracted from:
 *   docs/rules_data/data-rules-md/Careers/*.md
 *
 * Skills encoding:
 *   - Named skills (e.g., 'Sneak', 'Rumors') are specific required skills
 *   - Group names (e.g., 'Interpersonal', 'Exploration') mean "one skill from that group"
 *   - 'Crafting/Exploration' means "one skill from either crafting or exploration group"
 *   - 'Music/Perform' means "Music or Perform skill"
 *
 * Languages encoding:
 *   - ['1 Language'] or ['2 Languages'] for chooseable languages
 *   - [] for no languages granted
 */
const SOURCE_CAREERS: CareerSourceData[] = [
  // ──────────────────────────────────────────
  // Agent (Source: Agent.md)
  // Skills: "The Sneak skill from the intrigue skill group, plus one skill from the
  //   interpersonal group and one other skill from the intrigue group"
  // Languages: Two languages
  // Perk: One intrigue perk
  // ──────────────────────────────────────────
  {
    id: 'agent',
    name: 'Agent',
    skills: ['Sneak', 'Interpersonal', 'Intrigue'],
    languages: ['2 Languages'],
    renown: 0,
    wealth: 0,
    projectPoints: 0,
    perkType: 'intrigue',
  },

  // ──────────────────────────────────────────
  // Aristocrat (Source: Aristocrat.md)
  // Skills: "One skill from the interpersonal skill group and one skill from the lore group"
  // Languages: One language
  // Renown: +1, Wealth: +1
  // Perk: One lore perk
  // ──────────────────────────────────────────
  {
    id: 'aristocrat',
    name: 'Aristocrat',
    skills: ['Interpersonal', 'Lore'],
    languages: ['1 Language'],
    renown: 1,
    wealth: 1,
    projectPoints: 0,
    perkType: 'lore',
  },

  // ──────────────────────────────────────────
  // Artisan (Source: Artisan.md)
  // Skills: "Two skills from the crafting skill group"
  // Languages: One language
  // Project Points: 240
  // Perk: One crafting perk
  // ──────────────────────────────────────────
  {
    id: 'artisan',
    name: 'Artisan',
    skills: ['Crafting', 'Crafting'],
    languages: ['1 Language'],
    renown: 0,
    wealth: 0,
    projectPoints: 240,
    perkType: 'crafting',
  },

  // ──────────────────────────────────────────
  // Beggar (Source: Beggar.md)
  // Skills: "The Rumors skill (from the lore skill group), plus one skill from the
  //   exploration group and one skill from the interpersonal group"
  // Languages: Two languages
  // Perk: One interpersonal perk
  // ──────────────────────────────────────────
  {
    id: 'beggar',
    name: 'Beggar',
    skills: ['Rumors', 'Exploration', 'Interpersonal'],
    languages: ['2 Languages'],
    renown: 0,
    wealth: 0,
    projectPoints: 0,
    perkType: 'interpersonal',
  },

  // ──────────────────────────────────────────
  // Criminal (Source: Criminal.md)
  // Skills: "The Criminal Underworld skill (from the lore skill group), plus two
  //   skills from the intrigue group"
  // Languages: One language
  // Project Points: 120
  // Perk: One intrigue perk
  // ──────────────────────────────────────────
  {
    id: 'criminal',
    name: 'Criminal',
    skills: ['Criminal Underworld', 'Intrigue', 'Intrigue'],
    languages: ['1 Language'],
    renown: 0,
    wealth: 0,
    projectPoints: 120,
    perkType: 'intrigue',
  },

  // ──────────────────────────────────────────
  // Disciple (Source: Disciple.md)
  // Skills: "The Religion skill (from the lore skill group), plus two more skills
  //   from the lore group"
  // Languages: (none listed)
  // Project Points: 240
  // Perk: One supernatural perk
  // ──────────────────────────────────────────
  {
    id: 'disciple',
    name: 'Disciple',
    skills: ['Religion', 'Lore', 'Lore'],
    languages: [],
    renown: 0,
    wealth: 0,
    projectPoints: 240,
    perkType: 'supernatural',
  },

  // ──────────────────────────────────────────
  // Explorer (Source: Explorer.md)
  // Skills: "The Navigate skill (from the exploration skill group), plus two more
  //   skills from the exploration group"
  // Languages: Two languages
  // Perk: One exploration perk
  // ──────────────────────────────────────────
  {
    id: 'explorer',
    name: 'Explorer',
    skills: ['Navigate', 'Exploration', 'Exploration'],
    languages: ['2 Languages'],
    renown: 0,
    wealth: 0,
    projectPoints: 0,
    perkType: 'exploration',
  },

  // ──────────────────────────────────────────
  // Farmer (Source: Farmer.md)
  // Skills: "The Handle Animals skill (from the interpersonal skill group), plus
  //   two skills from the exploration group"
  // Languages: One language
  // Project Points: 120
  // Perk: One exploration perk
  // ──────────────────────────────────────────
  {
    id: 'farmer',
    name: 'Farmer',
    skills: ['Handle Animals', 'Exploration', 'Exploration'],
    languages: ['1 Language'],
    renown: 0,
    wealth: 0,
    projectPoints: 120,
    perkType: 'exploration',
  },

  // ──────────────────────────────────────────
  // Gladiator (Source: Gladiator.md)
  // Skills: "Two skills from the exploration skill group"
  // Languages: One language
  // Renown: +2
  // Perk: One exploration perk
  // ──────────────────────────────────────────
  {
    id: 'gladiator',
    name: 'Gladiator',
    skills: ['Exploration', 'Exploration'],
    languages: ['1 Language'],
    renown: 2,
    wealth: 0,
    projectPoints: 0,
    perkType: 'exploration',
  },

  // ──────────────────────────────────────────
  // Laborer (Source: Laborer.md)
  // Skills: "The Endurance skill (from the exploration skill group), plus two skills
  //   from either the crafting group or the exploration group"
  // Languages: One language
  // Project Points: 120
  // Perk: One exploration perk
  // ──────────────────────────────────────────
  {
    id: 'laborer',
    name: 'Laborer',
    skills: ['Endurance', 'Crafting/Exploration', 'Crafting/Exploration'],
    languages: ['1 Language'],
    renown: 0,
    wealth: 0,
    projectPoints: 120,
    perkType: 'exploration',
  },

  // ──────────────────────────────────────────
  // Mage's Apprentice (Source: Mages Apprentice.md)
  // Skills: "The Magic skill (from the lore skill group), plus two other skills
  //   from the lore group"
  // Languages: One language
  // Renown: +1
  // Perk: One supernatural perk
  // ──────────────────────────────────────────
  {
    id: 'mages-apprentice',
    name: "Mage's Apprentice",
    skills: ['Magic', 'Lore', 'Lore'],
    languages: ['1 Language'],
    renown: 1,
    wealth: 0,
    projectPoints: 0,
    perkType: 'supernatural',
  },

  // ──────────────────────────────────────────
  // Performer (Source: Performer.md)
  // Skills: "The Music or Perform skill (from the interpersonal skill group), plus
  //   two more skills from the interpersonal group"
  // Languages: (none listed)
  // Renown: +2
  // Perk: One interpersonal perk
  // ──────────────────────────────────────────
  {
    id: 'performer',
    name: 'Performer',
    skills: ['Music/Perform', 'Interpersonal', 'Interpersonal'],
    languages: [],
    renown: 2,
    wealth: 0,
    projectPoints: 0,
    perkType: 'interpersonal',
  },

  // ──────────────────────────────────────────
  // Politician (Source: Politician.md)
  // Skills: "Two skills from the interpersonal skill group"
  // Languages: One language
  // Renown: +1, Wealth: +1
  // Perk: One interpersonal perk
  // ──────────────────────────────────────────
  {
    id: 'politician',
    name: 'Politician',
    skills: ['Interpersonal', 'Interpersonal'],
    languages: ['1 Language'],
    renown: 1,
    wealth: 1,
    projectPoints: 0,
    perkType: 'interpersonal',
  },

  // ──────────────────────────────────────────
  // Sage (Source: Sage.md)
  // Skills: "Two skills from the lore skill group"
  // Languages: One language
  // Project Points: 240
  // Perk: One lore perk
  // ──────────────────────────────────────────
  {
    id: 'sage',
    name: 'Sage',
    skills: ['Lore', 'Lore'],
    languages: ['1 Language'],
    renown: 0,
    wealth: 0,
    projectPoints: 240,
    perkType: 'lore',
  },

  // ──────────────────────────────────────────
  // Sailor (Source: Sailor.md)
  // Skills: "Swim (from the exploration skill group), plus two more skills from
  //   the exploration group"
  // Languages: Two languages
  // Perk: One exploration perk
  // ──────────────────────────────────────────
  {
    id: 'sailor',
    name: 'Sailor',
    skills: ['Swim', 'Exploration', 'Exploration'],
    languages: ['2 Languages'],
    renown: 0,
    wealth: 0,
    projectPoints: 0,
    perkType: 'exploration',
  },

  // ──────────────────────────────────────────
  // Soldier (Source: Soldier.md)
  // Skills: "One skill from the exploration skill group and one skill from the
  //   intrigue group"
  // Languages: Two languages
  // Renown: +1
  // Perk: One exploration perk
  // ──────────────────────────────────────────
  {
    id: 'soldier',
    name: 'Soldier',
    skills: ['Exploration', 'Intrigue'],
    languages: ['2 Languages'],
    renown: 1,
    wealth: 0,
    projectPoints: 0,
    perkType: 'exploration',
  },

  // ──────────────────────────────────────────
  // Warden (Source: Warden.md)
  // Skills: "Nature (from the lore skill group), plus one skill from the exploration
  //   group and one skill from the intrigue group"
  // Languages: One language
  // Project Points: 120
  // Perk: One exploration perk
  // ──────────────────────────────────────────
  {
    id: 'warden',
    name: 'Warden',
    skills: ['Nature', 'Exploration', 'Intrigue'],
    languages: ['1 Language'],
    renown: 0,
    wealth: 0,
    projectPoints: 120,
    perkType: 'exploration',
  },

  // ──────────────────────────────────────────
  // Watch Officer (Source: Watch Officer.md)
  // Skills: "Alertness (from the intrigue skill group), plus two more skills from
  //   the intrigue group"
  // Languages: Two languages
  // Perk: One exploration perk
  // ──────────────────────────────────────────
  {
    id: 'watch-officer',
    name: 'Watch Officer',
    skills: ['Alertness', 'Intrigue', 'Intrigue'],
    languages: ['2 Languages'],
    renown: 0,
    wealth: 0,
    projectPoints: 0,
    perkType: 'exploration',
  },
];

// ============================================================
// Completeness: All 18 careers exist
// ============================================================
describe('Audit: Careers — Completeness', () => {
  it('should have exactly 18 careers in code', () => {
    const allCareers = GameData.getAllCareers();
    expect(allCareers.length).toBe(18);
  });

  it('should have exactly 18 careers in reference-data', () => {
    expect(careers.length).toBe(18);
  });

  it('all expected career IDs are present', () => {
    const expectedIds = SOURCE_CAREERS.map((c) => c.id).sort();
    const codeIds = GameData.getAllCareers()
      .map((c) => c.id)
      .sort();
    expect(codeIds).toEqual(expectedIds);
  });

  it('all expected career names are present', () => {
    const expectedNames = SOURCE_CAREERS.map((c) => c.name).sort();
    const codeNames = GameData.getAllCareers()
      .map((c) => c.name)
      .sort();
    expect(codeNames).toEqual(expectedNames);
  });
});

// ============================================================
// Per-career validation against source books
// ============================================================
describe('Audit: Careers — Per-Career Validation', () => {
  for (const source of SOURCE_CAREERS) {
    describe(`${source.name} (${source.id})`, () => {
      it('exists via GameData.getCareer(id)', () => {
        const career = GameData.getCareer(source.id);
        expect(career).toBeDefined();
        expect(career!.name).toBe(source.name);
      });

      it('exists via GameData.getCareerByName(name)', () => {
        const career = GameData.getCareerByName(source.name);
        expect(career).toBeDefined();
        expect(career!.id).toBe(source.id);
      });

      it(`skills match source: [${source.skills.join(', ')}]`, () => {
        const career = GameData.getCareer(source.id)!;
        expect(career.skills).toEqual(source.skills);
      });

      it(`languages match source: [${source.languages.join(', ') || 'none'}]`, () => {
        const career = GameData.getCareer(source.id)!;
        expect(career.languages).toEqual(source.languages);
      });

      it(`renown matches source: ${source.renown}`, () => {
        const career = GameData.getCareer(source.id)!;
        expect(career.renown).toBe(source.renown);
      });

      it(`wealth matches source: ${source.wealth}`, () => {
        const career = GameData.getCareer(source.id)!;
        expect(career.wealth).toBe(source.wealth);
      });

      it(`projectPoints matches source: ${source.projectPoints}`, () => {
        const career = GameData.getCareer(source.id)!;
        expect(career.projectPoints).toBe(source.projectPoints);
      });

      it(`perkType matches source: ${source.perkType}`, () => {
        const career = GameData.getCareer(source.id)!;
        expect(career.perkType).toBe(source.perkType);
      });

      it('has a non-empty inciting incident', () => {
        const career = GameData.getCareer(source.id)!;
        expect(career.incitingIncident).toBeDefined();
        expect(career.incitingIncident.length).toBeGreaterThan(0);
      });
    });
  }
});

// ============================================================
// Cross-check: No extra or missing careers
// ============================================================
describe('Audit: Careers — No Extra/Missing Careers', () => {
  it('every career in code has a source entry', () => {
    const sourceIds = new Set(SOURCE_CAREERS.map((c) => c.id));
    for (const career of GameData.getAllCareers()) {
      expect(sourceIds.has(career.id)).toBe(true);
    }
  });

  it('every source entry has a career in code', () => {
    for (const source of SOURCE_CAREERS) {
      const career = GameData.getCareer(source.id);
      expect(career).toBeDefined();
    }
  });
});

// ============================================================
// Value constraints: renown, wealth, projectPoints bounds
// ============================================================
describe('Audit: Careers — Value Constraints', () => {
  it('renown is 0, 1, or 2 for all careers', () => {
    for (const career of GameData.getAllCareers()) {
      expect([0, 1, 2]).toContain(career.renown);
    }
  });

  it('wealth is 0 or 1 for all careers', () => {
    for (const career of GameData.getAllCareers()) {
      expect([0, 1]).toContain(career.wealth);
    }
  });

  it('projectPoints is 0, 120, or 240 for all careers', () => {
    for (const career of GameData.getAllCareers()) {
      expect([0, 120, 240]).toContain(career.projectPoints);
    }
  });

  it('perkType is a valid category for all careers', () => {
    const validPerkTypes = ['crafting', 'exploration', 'interpersonal', 'intrigue', 'lore', 'supernatural'];
    for (const career of GameData.getAllCareers()) {
      expect(validPerkTypes).toContain(career.perkType);
    }
  });

  it('skills array is non-empty for all careers', () => {
    for (const career of GameData.getAllCareers()) {
      expect(career.skills.length).toBeGreaterThan(0);
    }
  });

  it('each career has 2 or 3 skill entries', () => {
    for (const career of GameData.getAllCareers()) {
      expect(career.skills.length).toBeGreaterThanOrEqual(2);
      expect(career.skills.length).toBeLessThanOrEqual(3);
    }
  });
});

// ============================================================
// Summary statistics (sanity checks from source)
// ============================================================
describe('Audit: Careers — Summary Statistics', () => {
  it('exactly 5 careers grant renown > 0 (Aristocrat, Gladiator, Mage\'s Apprentice, Performer, Politician, Soldier)', () => {
    const withRenown = GameData.getAllCareers().filter((c) => c.renown > 0);
    // Source: Aristocrat(1), Gladiator(2), Mage's Apprentice(1), Performer(2), Politician(1), Soldier(1)
    expect(withRenown.length).toBe(6);
  });

  it('exactly 2 careers grant wealth > 0 (Aristocrat, Politician)', () => {
    const withWealth = GameData.getAllCareers().filter((c) => c.wealth > 0);
    expect(withWealth.length).toBe(2);
    const wealthNames = withWealth.map((c) => c.name).sort();
    expect(wealthNames).toEqual(['Aristocrat', 'Politician']);
  });

  it('careers granting 240 project points: Artisan, Disciple, Sage', () => {
    const with240 = GameData.getAllCareers()
      .filter((c) => c.projectPoints === 240)
      .map((c) => c.name)
      .sort();
    expect(with240).toEqual(['Artisan', 'Disciple', 'Sage']);
  });

  it('careers granting 120 project points: Criminal, Farmer, Laborer, Warden', () => {
    const with120 = GameData.getAllCareers()
      .filter((c) => c.projectPoints === 120)
      .map((c) => c.name)
      .sort();
    expect(with120).toEqual(['Criminal', 'Farmer', 'Laborer', 'Warden']);
  });

  it('careers granting 2 languages: Agent, Beggar, Explorer, Sailor, Soldier, Watch Officer', () => {
    const with2Lang = GameData.getAllCareers()
      .filter((c) => c.languages.some((l) => l.includes('2')))
      .map((c) => c.name)
      .sort();
    expect(with2Lang).toEqual(['Agent', 'Beggar', 'Explorer', 'Sailor', 'Soldier', 'Watch Officer']);
  });

  it('careers granting no languages: Disciple, Performer', () => {
    const noLang = GameData.getAllCareers()
      .filter((c) => c.languages.length === 0)
      .map((c) => c.name)
      .sort();
    expect(noLang).toEqual(['Disciple', 'Performer']);
  });
});
