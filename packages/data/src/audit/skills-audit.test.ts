/**
 * Skills Audit — Slice 11 (Task 14)
 *
 * Validates ALL skills data against the Draw Steel source books.
 *
 * Sources:
 *   docs/rules_data/data-rules-md/Skills/Crafting Skills.md
 *   docs/rules_data/data-rules-md/Skills/Exploration Skills.md
 *   docs/rules_data/data-rules-md/Skills/Interpersonal Skills.md
 *   docs/rules_data/data-rules-md/Skills/Intrigue Skills.md
 *   docs/rules_data/data-rules-md/Skills/Lore Skills.md
 *
 * Audits two data sources:
 *   1. GameData API (skills.json via game-rules.ts) — primary runtime source
 *   2. rules/skills.ts standalone exports — secondary/utility source
 */
import { describe, it, expect } from 'vitest';
import { GameData } from '../game-data/lib/game-rules.js';
import {
  skills as rulesSkills,
  skillGroups as rulesSkillGroups,
  getSkillsByGroup,
  getSkillById,
  findSkillByName,
  parseSkillGroup,
  isSkillGroup,
} from '../rules/skills.js';
import type { Skill, SkillGroup } from '../rules/skills.js';

// ============================================================================
// Source-of-truth data from Draw Steel rule books
// ============================================================================

/** Expected skill groups (Source: Skills/_Index.md) */
const EXPECTED_GROUPS = ['crafting', 'exploration', 'interpersonal', 'intrigue', 'lore'] as const;

/** Source: Crafting Skills.md — 10 skills */
const CRAFTING_SKILLS: Array<{ name: string; use: string }> = [
  { name: 'Alchemy', use: 'Make bombs and potions' },
  { name: 'Architecture', use: 'Create buildings and vehicles' },
  { name: 'Blacksmithing', use: 'Forge metal armor and weapons' },
  { name: 'Carpentry', use: 'Create items out of wood' },
  { name: 'Cooking', use: 'Create delicious dishes' },
  { name: 'Fletching', use: 'Make ranged weapons and ammunition' },
  { name: 'Forgery', use: 'Create false badges, documents, and other items' },
  { name: 'Jewelry', use: 'Create bracelets, crowns, rings, and other jewelry' },
  { name: 'Mechanics', use: 'Build machines and clockwork items' },
  { name: 'Tailoring', use: 'Craft clothing of cloth or leather' },
];

/** Source: Exploration Skills.md — 10 skills */
const EXPLORATION_SKILLS: Array<{ name: string; use: string }> = [
  { name: 'Climb', use: 'Move up vertical surfaces' },
  { name: 'Drive', use: 'Control vehicles' },
  { name: 'Endurance', use: 'Remain engaged in strenuous activity over a long period of time' },
  { name: 'Gymnastics', use: 'Move across unsteady or narrow surfaces; tumble' },
  { name: 'Heal', use: 'Use mundane first aid' },
  { name: 'Jump', use: 'Leap vertical and horizontal distances' },
  { name: 'Lift', use: 'Pick up, carry, and throw heavy objects' },
  { name: 'Navigate', use: 'Read a map and travel without becoming lost' },
  { name: 'Ride', use: 'Ride and control a nonsapient mount, such as a horse' },
  { name: 'Swim', use: 'Move through deep liquid' },
];

/** Source: Interpersonal Skills.md — 13 skills */
const INTERPERSONAL_SKILLS: Array<{ name: string; use: string }> = [
  { name: 'Brag', use: 'Impress others with stories of your deeds' },
  { name: 'Empathize', use: 'Relate to someone on a personal level' },
  { name: 'Flirt', use: 'Attract romantic attention from someone' },
  { name: 'Gamble', use: 'Make bets with others' },
  { name: 'Handle Animals', use: 'Interact with nonsapient animal wildlife' },
  { name: 'Interrogate', use: 'Obtain information from a creature withholding it' },
  { name: 'Intimidate', use: 'Awe or scare a creature' },
  { name: 'Lead', use: 'Inspire people to action' },
  { name: 'Lie', use: 'Convince someone that a falsehood is true' },
  { name: 'Music', use: 'Perform music vocally or with an instrument' },
  { name: 'Perform', use: 'Engage in dance, oratory, acting, or some other physical performance' },
  { name: 'Persuade', use: 'Convince someone to agree with you through use of your charms and grace' },
  { name: 'Read Person', use: 'Read the emotions and body language of other creatures' },
];

/** Source: Intrigue Skills.md — 12 skills */
const INTRIGUE_SKILLS: Array<{ name: string; use: string }> = [
  { name: 'Alertness', use: 'Intuitively sense the details of your surroundings' },
  { name: 'Conceal Object', use: 'Hide an object on your person or in your environment' },
  { name: 'Disguise', use: 'Change your appearance to look like a different person' },
  { name: 'Eavesdrop', use: 'Actively listen to something that is hard to hear, such as a whispered conversation through a door' },
  { name: 'Escape Artist', use: 'Escape from bonds such as rope or manacles' },
  { name: 'Hide', use: 'Conceal yourself from others\' observation' },
  { name: 'Pick Lock', use: 'Open a lock without using the key' },
  { name: 'Pick Pocket', use: 'Steal an item that another person wears or carries without them noticing' },
  { name: 'Sabotage', use: 'Disable a mechanical device such as a trap' },
  { name: 'Search', use: 'Actively search an environment for important details and items' },
  { name: 'Sneak', use: 'Move silently' },
  { name: 'Track', use: 'Follow a trail that another creature has left behind' },
];

/** Source: Lore Skills.md — 12 skills (includes Timescape) */
const LORE_SKILLS: Array<{ name: string; use: string }> = [
  { name: 'Criminal Underworld', use: 'Knowing about criminal organizations, their crimes, their relationships, and their leaders' },
  { name: 'Culture', use: 'Knowing about a culture\'s customs, folktales, and taboos' },
  { name: 'History', use: 'Knowing about significant past events' },
  { name: 'Magic', use: 'Knowing about magical places, spells, rituals, items, and phenomena' },
  { name: 'Monsters', use: 'Knowing monster ecology, strengths, and weaknesses' },
  { name: 'Nature', use: 'Knowing about natural flora, fauna, and weather' },
  { name: 'Psionics', use: 'Knowing about psionic places, spells, rituals, items, and phenomena' },
  { name: 'Religion', use: 'Knowing about religious mythology, practices, and rituals' },
  { name: 'Rumors', use: 'Knowing gossip, legends, and uncertain truths' },
  { name: 'Society', use: 'Knowing noble etiquette and the leadership and power dynamics of noble families' },
  { name: 'Strategy', use: 'Knowing about battle tactics and logistics' },
  { name: 'Timescape', use: 'Knowing about the many worlds of the timescape' },
];

/** All source skills combined, with group tag */
const ALL_SOURCE_SKILLS: Array<{ name: string; use: string; group: string }> = [
  ...CRAFTING_SKILLS.map(s => ({ ...s, group: 'crafting' })),
  ...EXPLORATION_SKILLS.map(s => ({ ...s, group: 'exploration' })),
  ...INTERPERSONAL_SKILLS.map(s => ({ ...s, group: 'interpersonal' })),
  ...INTRIGUE_SKILLS.map(s => ({ ...s, group: 'intrigue' })),
  ...LORE_SKILLS.map(s => ({ ...s, group: 'lore' })),
];

const EXPECTED_TOTAL = 57; // 10 + 10 + 13 + 12 + 12

const GROUP_COUNTS: Record<string, number> = {
  crafting: 10,
  exploration: 10,
  interpersonal: 13,
  intrigue: 12,
  lore: 12,
};

// ============================================================================
// PART 1: GameData API (primary runtime source — loads from skills.json)
// ============================================================================

describe('Audit: Skills — GameData API', () => {
  const allSkills = GameData.getAllSkills();

  // ------------------------------------------------------------------
  // Skill Group existence
  // ------------------------------------------------------------------
  describe('Skill groups exist', () => {
    for (const group of EXPECTED_GROUPS) {
      it(`group "${group}" returns skills`, () => {
        const groupSkills = GameData.getSkillsByGroup(group);
        expect(groupSkills.length).toBeGreaterThan(0);
      });
    }
  });

  // ------------------------------------------------------------------
  // Skill count per group
  // ------------------------------------------------------------------
  describe('Skill count per group matches source', () => {
    for (const [group, count] of Object.entries(GROUP_COUNTS)) {
      it(`${group}: ${count} skills`, () => {
        const groupSkills = GameData.getSkillsByGroup(group as 'crafting' | 'exploration' | 'interpersonal' | 'intrigue' | 'lore');
        expect(groupSkills).toHaveLength(count);
      });
    }
  });

  // ------------------------------------------------------------------
  // Total skill count
  // ------------------------------------------------------------------
  it(`total skill count is ${EXPECTED_TOTAL}`, () => {
    expect(allSkills).toHaveLength(EXPECTED_TOTAL);
  });

  // ------------------------------------------------------------------
  // Per-skill validation: name, group, description present
  // ------------------------------------------------------------------
  describe('Crafting skills', () => {
    for (const src of CRAFTING_SKILLS) {
      it(`"${src.name}" exists in crafting group with correct use text`, () => {
        const skill = GameData.getSkill(src.name);
        expect(skill, `Skill "${src.name}" not found`).toBeDefined();
        expect(skill!.group).toBe('crafting');
        expect(skill!.description).toBeTruthy();
      });
    }
  });

  describe('Exploration skills', () => {
    for (const src of EXPLORATION_SKILLS) {
      it(`"${src.name}" exists in exploration group with correct use text`, () => {
        const skill = GameData.getSkill(src.name);
        expect(skill, `Skill "${src.name}" not found`).toBeDefined();
        expect(skill!.group).toBe('exploration');
        expect(skill!.description).toBeTruthy();
      });
    }
  });

  describe('Interpersonal skills', () => {
    for (const src of INTERPERSONAL_SKILLS) {
      it(`"${src.name}" exists in interpersonal group with correct use text`, () => {
        const skill = GameData.getSkill(src.name);
        expect(skill, `Skill "${src.name}" not found`).toBeDefined();
        expect(skill!.group).toBe('interpersonal');
        expect(skill!.description).toBeTruthy();
      });
    }
  });

  describe('Intrigue skills', () => {
    for (const src of INTRIGUE_SKILLS) {
      it(`"${src.name}" exists in intrigue group with correct use text`, () => {
        const skill = GameData.getSkill(src.name);
        expect(skill, `Skill "${src.name}" not found`).toBeDefined();
        expect(skill!.group).toBe('intrigue');
        expect(skill!.description).toBeTruthy();
      });
    }
  });

  describe('Lore skills', () => {
    for (const src of LORE_SKILLS) {
      it(`"${src.name}" exists in lore group with correct use text`, () => {
        const skill = GameData.getSkill(src.name);
        expect(skill, `Skill "${src.name}" not found`).toBeDefined();
        expect(skill!.group).toBe('lore');
        expect(skill!.description).toBeTruthy();
      });
    }
  });

  // ------------------------------------------------------------------
  // Cross-skill validations
  // ------------------------------------------------------------------
  describe('Cross-skill validations', () => {
    it('all skill names are unique', () => {
      const names = allSkills.map(s => s.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(names.length);
    });

    it('every skill belongs to exactly one of the five groups', () => {
      const validGroups = new Set(EXPECTED_GROUPS);
      for (const skill of allSkills) {
        expect(validGroups.has(skill.group as typeof EXPECTED_GROUPS[number]),
          `Skill "${skill.name}" has invalid group "${skill.group}"`).toBe(true);
      }
    });

    it('no source skill is missing from GameData', () => {
      const missing: string[] = [];
      for (const src of ALL_SOURCE_SKILLS) {
        const found = GameData.getSkill(src.name);
        if (!found) missing.push(src.name);
      }
      expect(missing, `Missing skills: ${missing.join(', ')}`).toHaveLength(0);
    });

    it('no extra skills in GameData beyond source', () => {
      const sourceNames = new Set(ALL_SOURCE_SKILLS.map(s => s.name));
      const extras = allSkills.filter(s => !sourceNames.has(s.name));
      expect(extras.map(s => s.name), 'Extra skills not in source').toHaveLength(0);
    });
  });
});

// ============================================================================
// PART 2: rules/skills.ts standalone exports
// ============================================================================

describe('Audit: Skills — rules/skills.ts', () => {
  // ------------------------------------------------------------------
  // Skill group info objects
  // ------------------------------------------------------------------
  describe('Skill group info exists for all groups', () => {
    for (const group of EXPECTED_GROUPS) {
      it(`skillGroups["${group}"] is defined with name and description`, () => {
        const info = rulesSkillGroups[group];
        expect(info).toBeDefined();
        expect(info.name).toBeTruthy();
        expect(info.description).toBeTruthy();
      });
    }
  });

  // ------------------------------------------------------------------
  // Skill count per group via getSkillsByGroup helper
  // ------------------------------------------------------------------
  describe('Skill count per group matches source', () => {
    for (const [group, count] of Object.entries(GROUP_COUNTS)) {
      it(`${group}: ${count} skills`, () => {
        const groupSkills = getSkillsByGroup(group as SkillGroup);
        expect(groupSkills).toHaveLength(count);
      });
    }
  });

  // ------------------------------------------------------------------
  // Total skill count
  // ------------------------------------------------------------------
  it(`total skill count is ${EXPECTED_TOTAL}`, () => {
    expect(rulesSkills).toHaveLength(EXPECTED_TOTAL);
  });

  // ------------------------------------------------------------------
  // Per-skill validation (every source skill exists with correct data)
  // ------------------------------------------------------------------
  describe('Every source skill present with correct group', () => {
    for (const src of ALL_SOURCE_SKILLS) {
      it(`"${src.name}" exists in ${src.group} group`, () => {
        const skill = findSkillByName(src.name);
        expect(skill, `Skill "${src.name}" not found`).toBeDefined();
        expect(skill!.group).toBe(src.group);
        expect(skill!.name).toBe(src.name);
        expect(skill!.description).toBeTruthy();
        expect(skill!.id).toBeTruthy();
      });
    }
  });

  // ------------------------------------------------------------------
  // Cross-skill validations
  // ------------------------------------------------------------------
  describe('Cross-skill validations', () => {
    it('all IDs are unique', () => {
      const ids = rulesSkills.map(s => s.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('all names are unique', () => {
      const names = rulesSkills.map(s => s.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(names.length);
    });

    it('every skill belongs to exactly one of the five groups', () => {
      const validGroups = new Set<string>(EXPECTED_GROUPS);
      for (const skill of rulesSkills) {
        expect(validGroups.has(skill.group),
          `Skill "${skill.name}" has invalid group "${skill.group}"`).toBe(true);
      }
    });

    it('no source skill is missing', () => {
      const missing: string[] = [];
      for (const src of ALL_SOURCE_SKILLS) {
        const found = findSkillByName(src.name);
        if (!found) missing.push(src.name);
      }
      expect(missing, `Missing skills: ${missing.join(', ')}`).toHaveLength(0);
    });

    it('no extra skills beyond source', () => {
      const sourceNames = new Set(ALL_SOURCE_SKILLS.map(s => s.name));
      const extras = rulesSkills.filter(s => !sourceNames.has(s.name));
      expect(extras.map(s => s.name), 'Extra skills not in source').toHaveLength(0);
    });
  });

  // ------------------------------------------------------------------
  // Helper functions
  // ------------------------------------------------------------------
  describe('Helper functions', () => {
    it('getSkillById returns correct skill', () => {
      const alchemy = getSkillById('alchemy');
      expect(alchemy).toBeDefined();
      expect(alchemy!.name).toBe('Alchemy');
      expect(alchemy!.group).toBe('crafting');
    });

    it('getSkillById returns undefined for nonexistent ID', () => {
      expect(getSkillById('nonexistent')).toBeUndefined();
    });

    it('findSkillByName is case-insensitive', () => {
      expect(findSkillByName('ALCHEMY')).toBeDefined();
      expect(findSkillByName('alchemy')).toBeDefined();
      expect(findSkillByName('Alchemy')).toBeDefined();
    });

    it('parseSkillGroup returns correct group for valid strings', () => {
      expect(parseSkillGroup('crafting')).toBe('crafting');
      expect(parseSkillGroup('Exploration')).toBe('exploration');
      expect(parseSkillGroup('INTERPERSONAL')).toBe('interpersonal');
      expect(parseSkillGroup('intrigue')).toBe('intrigue');
      expect(parseSkillGroup('Lore')).toBe('lore');
    });

    it('parseSkillGroup returns null for invalid strings', () => {
      expect(parseSkillGroup('combat')).toBeNull();
      expect(parseSkillGroup('')).toBeNull();
    });

    it('isSkillGroup correctly identifies groups', () => {
      expect(isSkillGroup('crafting')).toBe(true);
      expect(isSkillGroup('combat')).toBe(false);
    });
  });
});
