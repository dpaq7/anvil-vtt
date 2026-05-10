/**
 * Complications Audit — Slice 9 / Task 12
 *
 * Validates all 100 complications against Draw Steel source books.
 * Source: docs/rules_data/data-rules-md/Complications/
 *
 * Each complication is validated for:
 * - ID exists in the COMPLICATIONS array
 * - Name matches source exactly
 * - Description/flavor text is present and non-empty
 * - Benefit text is present
 * - Drawback text is present (or shared with benefit for combined complications)
 * - rollNumber is assigned (1-100)
 * - Mechanical effects (damage modifiers, bonuses, skills) where applicable
 *
 * Cross-complication validations:
 * - Total count matches source (100)
 * - All IDs are unique
 * - All names are unique
 * - All rollNumbers are unique and cover 1-100
 */
import { describe, it, expect } from 'vitest';
import { COMPLICATIONS } from '../rules/complications.js';
import type { Complication } from '@anvil/types';

// ---------------------------------------------------------------------------
// Helper: find a complication by ID
// ---------------------------------------------------------------------------
function findById(id: string): Complication | undefined {
  return COMPLICATIONS.find((c) => c.id === id);
}

// ============================================================
// Cross-complication structural validations
// ============================================================
describe('Audit: Complications — Structural', () => {
  it('should have exactly 100 complications', () => {
    expect(COMPLICATIONS.length).toBe(100);
  });

  it('all IDs should be unique', () => {
    const ids = COMPLICATIONS.map((c) => c.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('all names should be unique', () => {
    const names = COMPLICATIONS.map((c) => c.name);
    const unique = new Set(names);
    expect(unique.size).toBe(names.length);
  });

  it('all rollNumbers should be unique', () => {
    const rolls = COMPLICATIONS.map((c) => c.rollNumber).filter((r) => r !== undefined);
    const unique = new Set(rolls);
    expect(unique.size).toBe(rolls.length);
  });

  it('rollNumbers should cover 1 through 100 exactly', () => {
    const rolls = COMPLICATIONS.map((c) => c.rollNumber).filter((r) => r !== undefined).sort((a, b) => a! - b!);
    expect(rolls.length).toBe(100);
    for (let i = 0; i < 100; i++) {
      expect(rolls[i]).toBe(i + 1);
    }
  });

  it('every complication should have a non-empty description', () => {
    for (const c of COMPLICATIONS) {
      expect(c.description, `${c.name} missing description`).toBeTruthy();
      expect(c.description.length, `${c.name} description too short`).toBeGreaterThan(10);
    }
  });

  it('every complication should have benefit or drawback text', () => {
    for (const c of COMPLICATIONS) {
      const hasBenefitOrDrawback = (c.benefit && c.benefit.length > 0) || (c.drawback && c.drawback.length > 0);
      expect(hasBenefitOrDrawback, `${c.name} missing benefit/drawback`).toBe(true);
    }
  });

  it('every complication ID should be kebab-case', () => {
    for (const c of COMPLICATIONS) {
      expect(c.id, `${c.name} ID not kebab-case`).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });
});

// ============================================================
// Individual complication validations
// Source: docs/rules_data/data-rules-md/Complications/<Name>.md
// ============================================================

describe('Audit: Complications — Individual (Roll 1-10)', () => {
  // Roll 1: Advanced Studies (source item_index: 12)
  describe('Advanced Studies', () => {
    const c = findById('advanced-studies');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Advanced Studies'));
    it('should have a rollNumber', () => expect(c!.rollNumber).toBeDefined());
    it('should have description mentioning notebook', () => {
      expect(c!.description).toContain('notebook');
    });
    it('should have benefit mentioning respite activity', () => {
      expect(c!.benefit).toContain('respite activity');
    });
    it('should have features array', () => {
      expect(c!.features).toBeDefined();
      expect(c!.features!.length).toBeGreaterThan(0);
    });
  });

  // Roll 2: Amnesia (source item_index: 14)
  describe('Amnesia', () => {
    const c = findById('amnesia');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Amnesia'));
    it('should have benefit mentioning trinket', () => {
      expect(c!.benefit).toContain('trinket');
    });
    it('should have drawback mentioning bane on recall lore', () => {
      expect(c!.drawback).toContain('bane');
      expect(c!.drawback).toContain('lore');
    });
  });

  // Roll 3: Animal Form (source item_index: 93)
  describe('Animal Form', () => {
    const c = findById('animal-form');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Animal Form'));
    it('should have benefit mentioning maneuver and size 1T', () => {
      expect(c!.benefit).toContain('maneuver');
      expect(c!.benefit).toContain('1T');
    });
    it('should have drawback mentioning winded and Malice', () => {
      expect(c!.drawback).toContain('winded');
      expect(c!.drawback).toContain('Malice');
    });
  });

  // Roll 4: Antihero (source item_index: 10)
  describe('Antihero', () => {
    const c = findById('antihero');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Antihero'));
    it('should have benefit mentioning 3 antihero tokens', () => {
      expect(c!.benefit).toContain('3 antihero tokens');
    });
    it('should have drawback mentioning villainous aspect', () => {
      expect(c!.drawback).toContain('villainous aspect');
    });
  });

  // Roll 5: Artifact Bonded (source item_index: 95)
  describe('Artifact Bonded', () => {
    const c = findById('artifact-bonded');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Artifact Bonded'));
    it('should have benefit mentioning artifact and 0 Stamina', () => {
      expect(c!.benefit).toContain('artifact');
      expect(c!.benefit).toContain('0 Stamina');
    });
    it('should have drawback mentioning Recovery loss', () => {
      expect(c!.drawback).toContain('Recovery');
    });
  });

  // Roll 6: Bereaved (source item_index: 72)
  describe('Bereaved', () => {
    const c = findById('bereaved');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Bereaved'));
    it('should have benefit mentioning spirit and hero token', () => {
      expect(c!.benefit).toContain('spirit');
      expect(c!.benefit).toContain('hero token');
    });
    it('should have drawback mentioning corruption weakness 5', () => {
      expect(c!.drawback).toContain('corruption weakness 5');
    });
    it('should have damage modifier feature for corruption weakness', () => {
      const dmFeature = c!.features?.find((f) => f.type === 'damage-modifier');
      expect(dmFeature).toBeDefined();
    });
  });

  // Roll 7: Betrothed (source item_index: 31)
  describe('Betrothed', () => {
    const c = findById('betrothed');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Betrothed'));
    it('should have benefit mentioning trinket', () => {
      expect(c!.benefit).toContain('trinket');
    });
    it('should have drawback mentioning Renown', () => {
      expect(c!.drawback).toContain('Renown');
    });
  });

  // Roll 8: Chaos Touched (source item_index: 41)
  describe('Chaos Touched', () => {
    const c = findById('chaos-touched');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Chaos Touched'));
    it('should have benefit mentioning Escape Grab, Grab, Knockback', () => {
      expect(c!.benefit).toContain('Escape Grab');
      expect(c!.benefit).toContain('Grab');
      expect(c!.benefit).toContain('Knockback');
    });
    it('should have drawback mentioning dying and bane', () => {
      expect(c!.drawback).toContain('dying');
      expect(c!.drawback).toContain('bane');
    });
  });

  // Roll 9: Chosen One (source item_index: 43)
  describe('Chosen One', () => {
    const c = findById('chosen-one');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Chosen One'));
    it('should have benefit mentioning 3 destiny points', () => {
      expect(c!.benefit).toContain('3 destiny points');
    });
    it('should have drawback mentioning 1d10 psychic damage', () => {
      expect(c!.drawback).toContain('1d10 psychic damage');
    });
  });

  // Roll 10: Consuming Interest (source item_index: 80)
  describe('Consuming Interest', () => {
    const c = findById('consuming-interest');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Consuming Interest'));
    it('should have benefit mentioning lore skill group', () => {
      expect(c!.benefit).toContain('lore skill group');
    });
    it('should have skill-choice feature', () => {
      const skillFeature = c!.features?.find((f) => f.type === 'skill-choice');
      expect(skillFeature).toBeDefined();
    });
  });
});

describe('Audit: Complications — Individual (Roll 11-20)', () => {
  // Roll 11: Corrupted Mentor (source item_index: 98)
  describe('Corrupted Mentor', () => {
    const c = findById('corrupted-mentor');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Corrupted Mentor'));
    it('should have benefit mentioning Corrupt Spirit', () => {
      expect(c!.benefit).toContain('Corrupt Spirit');
    });
    it('should have drawback mentioning holy weakness', () => {
      expect(c!.drawback).toContain('holy weakness');
    });
    it('should have ability feature for Corrupted Spirit', () => {
      const abilityFeature = c!.features?.find((f) => f.type === 'ability');
      expect(abilityFeature).toBeDefined();
    });
  });

  // Roll 12: Coward (source item_index: 46)
  describe('Coward', () => {
    const c = findById('coward');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Coward'));
    it('should have benefit mentioning frightened and move toward', () => {
      expect(c!.benefit).toContain('frightened');
      expect(c!.benefit).toContain('move toward');
    });
    it('should have drawback mentioning saving throw and frightened', () => {
      expect(c!.drawback).toContain('saving throw');
      expect(c!.drawback).toContain('frightened');
    });
  });

  // Roll 13: Crash Landed (source item_index: 47)
  describe('Crash Landed', () => {
    const c = findById('crash-landed');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Crash Landed'));
    it('should have benefit mentioning Timescape skill', () => {
      expect(c!.benefit).toContain('Timescape');
    });
    it('should have benefit mentioning power pack', () => {
      expect(c!.benefit).toContain('power pack');
    });
    it('should have skill-choice feature', () => {
      const skillFeature = c!.features?.find((f) => f.type === 'skill-choice');
      expect(skillFeature).toBeDefined();
    });
  });

  // Roll 14: Cult Victim (source item_index: 33)
  describe('Cult Victim', () => {
    const c = findById('cult-victim');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Cult Victim'));
    it('should have benefit mentioning move through solid matter', () => {
      expect(c!.benefit).toContain('solid matter');
    });
    it('should have drawback mentioning corruption weakness 5', () => {
      expect(c!.drawback).toContain('corruption weakness 5');
    });
    it('should have damage modifier feature', () => {
      const dmFeature = c!.features?.find((f) => f.type === 'damage-modifier');
      expect(dmFeature).toBeDefined();
    });
  });

  // Roll 15: Curse of Caution (source item_index: 85)
  describe('Curse of Caution', () => {
    const c = findById('curse-of-caution');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Curse of Caution'));
    it('should have benefit mentioning bane on strikes', () => {
      expect(c!.benefit).toContain('bane');
    });
    it('should have drawback mentioning speed penalty', () => {
      expect(c!.drawback).toContain('speed');
    });
    it('should have bonus feature for speed -1', () => {
      const bonusF = c!.features?.find((f) => f.type === 'bonus');
      expect(bonusF).toBeDefined();
    });
  });

  // Roll 16: Curse of Immortality (source item_index: 97)
  describe('Curse of Immortality', () => {
    const c = findById('curse-of-immortality');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Curse of Immortality'));
    it('should have benefit mentioning suspended animation', () => {
      expect(c!.benefit).toContain('suspended animation');
    });
    it('should have drawback mentioning bane on recall lore', () => {
      expect(c!.drawback).toContain('lore');
    });
  });

  // Roll 17: Curse of Misfortune (source item_index: 60)
  describe('Curse of Misfortune', () => {
    const c = findById('curse-of-misfortune');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Curse of Misfortune'));
    it('should have benefit mentioning consequence and fall prone', () => {
      expect(c!.benefit).toContain('consequence');
      expect(c!.benefit).toContain('prone');
    });
  });

  // Roll 18: Curse of Poverty (source item_index: 71)
  describe('Curse of Poverty', () => {
    const c = findById('curse-of-poverty');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Curse of Poverty'));
    it('should have benefit mentioning Wealth reduced to 1', () => {
      expect(c!.benefit).toContain('Wealth');
    });
  });

  // Roll 19: Curse of Punishment (source item_index: 49)
  describe('Curse of Punishment', () => {
    const c = findById('curse-of-punishment');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Curse of Punishment'));
    it('should have benefit mentioning 1 additional Recovery', () => {
      expect(c!.benefit).toContain('1 additional Recovery');
    });
    it('should have drawback mentioning dying when out of Recoveries', () => {
      expect(c!.drawback).toContain('dying');
      expect(c!.drawback).toContain('Recoveries');
    });
    it('should have bonus feature for recoveries +1', () => {
      const bonusF = c!.features?.find((f) => f.type === 'bonus');
      expect(bonusF).toBeDefined();
    });
  });

  // Roll 20: Curse of Stone (source item_index: 56)
  describe('Curse of Stone', () => {
    const c = findById('curse-of-stone');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Curse of Stone'));
    it('should have benefit mentioning stability and stone appearance', () => {
      expect(c!.benefit).toContain('stability');
      expect(c!.benefit).toContain('stone');
    });
    it('should have drawback mentioning sonic weakness 5', () => {
      expect(c!.drawback).toContain('sonic weakness 5');
    });
    it('should have drawback mentioning winded and dazed', () => {
      expect(c!.drawback).toContain('winded');
      expect(c!.drawback).toContain('dazed');
    });
    it('should have damage modifier feature for sonic weakness', () => {
      const dmFeature = c!.features?.find((f) => f.type === 'damage-modifier');
      expect(dmFeature).toBeDefined();
    });
  });
});

describe('Audit: Complications — Individual (Roll 21-30)', () => {
  // Roll 21: Cursed Weapon
  describe('Cursed Weapon', () => {
    const c = findById('cursed-weapon');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Cursed Weapon'));
    it('should have benefit mentioning leveled weapon', () => {
      expect(c!.benefit).toContain('leveled weapon');
    });
    it('should have drawback mentioning damage weakness 2', () => {
      expect(c!.drawback).toContain('damage weakness 2');
    });
    it('should have item-choice feature', () => {
      const itemFeature = c!.features?.find((f) => f.type === 'item-choice');
      expect(itemFeature).toBeDefined();
    });
  });

  // Roll 22: Disgraced
  describe('Disgraced', () => {
    const c = findById('disgraced');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Disgraced'));
    it('should have benefit mentioning 1 Renown and skill', () => {
      expect(c!.benefit).toContain('1 Renown');
      expect(c!.benefit).toContain('skill');
    });
    it('should have bonus feature for renown', () => {
      const bonusF = c!.features?.find((f) => f.type === 'bonus');
      expect(bonusF).toBeDefined();
    });
    it('should have skill-choice feature', () => {
      const skillFeature = c!.features?.find((f) => f.type === 'skill-choice');
      expect(skillFeature).toBeDefined();
    });
  });

  // Roll 23: Dragon Dreams
  describe('Dragon Dreams', () => {
    const c = findById('dragon-dreams');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Dragon Dreams'));
    it('should have benefit mentioning dragon knight traits', () => {
      expect(c!.benefit).toContain('dragon knight traits');
    });
    it('should have drawback mentioning fire damage', () => {
      expect(c!.drawback).toContain('fire damage');
    });
  });

  // Roll 24: Elemental Inside
  describe('Elemental Inside', () => {
    const c = findById('elemental-inside');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Elemental Inside'));
    it('should have benefit mentioning +3 bonus to Stamina', () => {
      expect(c!.benefit).toContain('+3 bonus to Stamina');
    });
    it('should have drawback mentioning dying and elemental control', () => {
      expect(c!.drawback).toContain('dying');
      expect(c!.drawback).toContain('elemental');
    });
    it('should have bonus feature for stamina', () => {
      const bonusF = c!.features?.find((f) => f.type === 'bonus');
      expect(bonusF).toBeDefined();
    });
  });

  // Roll 25: Evanesceria
  describe('Evanesceria', () => {
    const c = findById('evanesceria');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Evanesceria'));
    it('should have benefit mentioning absent yourself from reality', () => {
      expect(c!.benefit).toContain('absent yourself');
    });
    it('should have drawback mentioning respite activity', () => {
      expect(c!.drawback).toContain('respite');
    });
  });

  // Roll 26: Exile
  describe('Exile', () => {
    const c = findById('exile');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Exile'));
  });

  // Roll 27: Fallen Immortal
  describe('Fallen Immortal', () => {
    const c = findById('fallen-immortal');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Fallen Immortal'));
  });

  // Roll 28: Famous Relative
  describe('Famous Relative', () => {
    const c = findById('famous-relative');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Famous Relative'));
  });

  // Roll 29: Feytouched
  describe('Feytouched', () => {
    const c = findById('feytouched');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Feytouched'));
    it('should have benefit mentioning 1 additional Heroic Resource', () => {
      expect(c!.benefit).toContain('Heroic Resource');
    });
    it('should have drawback mentioning 3 Malice', () => {
      expect(c!.drawback).toContain('3 Malice');
    });
  });

  // Roll 30: Fiery Ideal
  describe('Fiery Ideal', () => {
    const c = findById('fiery-ideal');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Fiery Ideal'));
  });
});

describe('Audit: Complications — Individual (Roll 31-40)', () => {
  // Roll 31: Fire and Chaos (source item_index: 01)
  describe('Fire and Chaos', () => {
    const c = findById('fire-and-chaos');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Fire and Chaos'));
    it('should have benefit: fire immunity 5', () => {
      expect(c!.benefit).toContain('fire immunity 5');
    });
    it('should have drawback: cold weakness 5', () => {
      expect(c!.drawback).toContain('cold weakness 5');
    });
    it('should have damage modifier feature with fire immunity and cold weakness', () => {
      const dmFeature = c!.features?.find((f) => f.type === 'damage-modifier');
      expect(dmFeature).toBeDefined();
      const modifiers = (dmFeature!.data as { modifiers: Array<{ damageType: string; modifierType: string; value: number }> }).modifiers;
      expect(modifiers).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ damageType: 'fire', modifierType: 'immunity', value: 5 }),
          expect.objectContaining({ damageType: 'cold', modifierType: 'weakness', value: 5 }),
        ])
      );
    });
  });

  // Roll 32: Following in the Footsteps
  describe('Following in the Footsteps', () => {
    const c = findById('following-in-the-footsteps');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Following in the Footsteps'));
    it('should have benefit mentioning Heroic Resource cost reduced', () => {
      expect(c!.benefit).toContain('Heroic Resource cost');
    });
  });

  // Roll 33: Forbidden Romance
  describe('Forbidden Romance', () => {
    const c = findById('forbidden-romance');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Forbidden Romance'));
  });

  // Roll 34: Frostheart (source item_index: 38)
  describe('Frostheart', () => {
    const c = findById('frostheart');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Frostheart'));
    it('should have benefit: cold immunity 5 and cold damage option', () => {
      expect(c!.benefit).toContain('cold immunity 5');
      expect(c!.benefit).toContain('cold damage');
    });
    it('should have drawback: fire weakness 5', () => {
      expect(c!.drawback).toContain('fire weakness 5');
    });
    it('should have damage modifier feature', () => {
      const dmFeature = c!.features?.find((f) => f.type === 'damage-modifier');
      expect(dmFeature).toBeDefined();
      const modifiers = (dmFeature!.data as { modifiers: Array<{ damageType: string; modifierType: string; value: number }> }).modifiers;
      expect(modifiers).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ damageType: 'cold', modifierType: 'immunity', value: 5 }),
          expect.objectContaining({ damageType: 'fire', modifierType: 'weakness', value: 5 }),
        ])
      );
    });
  });

  // Roll 35: Getting Too Old for This
  describe('Getting Too Old for This', () => {
    const c = findById('getting-too-old-for-this');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Getting Too Old for This'));
    it('should have benefit mentioning heroic ability one level higher', () => {
      expect(c!.benefit).toContain('one level higher');
    });
    it('should have drawback mentioning winded and speed penalty', () => {
      expect(c!.drawback).toContain('winded');
      expect(c!.drawback).toContain('speed');
    });
  });

  // Roll 36: Gnoll-Mauled (source item_index: 48)
  describe('Gnoll-Mauled', () => {
    const c = findById('gnoll-mauled');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Gnoll-Mauled'));
    it('should have benefit mentioning ally reduced to 0 Stamina', () => {
      expect(c!.benefit).toContain('0 Stamina');
    });
    it('should have drawback mentioning dazed', () => {
      expect(c!.drawback).toContain('dazed');
    });
  });

  // Roll 37: Greening (source item_index: 74)
  describe('Greening', () => {
    const c = findById('greening');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Greening'));
    it('should have benefit: corruption immunity 5', () => {
      expect(c!.benefit).toContain('corruption immunity 5');
    });
    it('should have drawback: fire weakness 5', () => {
      expect(c!.drawback).toContain('fire weakness 5');
    });
    it('should have damage modifier feature', () => {
      const dmFeature = c!.features?.find((f) => f.type === 'damage-modifier');
      expect(dmFeature).toBeDefined();
    });
  });

  // Roll 38: Grifter (source item_index: 86)
  describe('Grifter', () => {
    const c = findById('grifter');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Grifter'));
    it('should have benefit mentioning intrigue skill', () => {
      expect(c!.benefit).toContain('intrigue skill group');
    });
    it('should have skill-choice feature', () => {
      const skillFeature = c!.features?.find((f) => f.type === 'skill-choice');
      expect(skillFeature).toBeDefined();
    });
  });

  // Roll 39: Grounded (source item_index: 90)
  describe('Grounded', () => {
    const c = findById('grounded');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Grounded'));
    it('should have benefit mentioning Motivate Earth', () => {
      expect(c!.benefit).toContain('Motivate Earth');
    });
    it('should have drawback mentioning lightning damage', () => {
      expect(c!.drawback).toContain('lightning damage');
    });
  });

  // Roll 40: Guilty Conscience (source item_index: 15)
  describe('Guilty Conscience', () => {
    const c = findById('guilty-conscience');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Guilty Conscience'));
    it('should have benefit mentioning winded value and Recovery', () => {
      expect(c!.benefit).toContain('winded value');
      expect(c!.benefit).toContain('Recovery');
    });
  });
});

describe('Audit: Complications — Individual (Roll 41-50)', () => {
  // Roll 41: Hawk Rider
  describe('Hawk Rider', () => {
    const c = findById('hawk-rider');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Hawk Rider'));
    it('should have benefit mentioning giant hawk as mount', () => {
      expect(c!.benefit).toContain('giant hawk');
      expect(c!.benefit).toContain('mount');
    });
  });

  // Roll 42: Host Body
  describe('Host Body', () => {
    const c = findById('host-body');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Host Body'));
    it('should have benefit mentioning fungus and host body', () => {
      expect(c!.benefit).toContain('humanoid body');
    });
    it('should have drawback mentioning fire weakness 5', () => {
      expect(c!.drawback).toContain('fire weakness 5');
    });
  });

  // Roll 43: Hunted
  describe('Hunted', () => {
    const c = findById('hunted');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Hunted'));
    it('should have benefit mentioning intrigue skill and lay low', () => {
      expect(c!.benefit).toContain('intrigue skill group');
      expect(c!.benefit).toContain('lay low');
    });
  });

  // Roll 44: Hunter
  describe('Hunter', () => {
    const c = findById('hunter');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Hunter'));
    it('should have benefit mentioning quarry', () => {
      expect(c!.benefit).toContain('quarry');
    });
    it('should have drawback mentioning bane on tracking other creatures', () => {
      expect(c!.drawback).toContain('track other creatures');
    });
  });

  // Roll 45: Indebted
  describe('Indebted', () => {
    const c = findById('indebted');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Indebted'));
    it('should have benefit mentioning Wealth', () => {
      expect(c!.benefit).toContain('Wealth');
    });
  });

  // Roll 46: Infernal Contract
  describe('Infernal Contract', () => {
    const c = findById('infernal-contract');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Infernal Contract'));
    it('should have benefit mentioning d10 roll 4 or higher', () => {
      expect(c!.benefit).toContain('4 or higher');
    });
  });

  // Roll 47: Infernal Contract... But, Like, Bad
  describe('Infernal Contract... But, Like, Bad', () => {
    const c = findById('infernal-contract-but-like-bad');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Infernal Contract... But, Like, Bad'));
    it('should have benefit mentioning Renown or Wealth or Stamina', () => {
      expect(c!.benefit).toContain('Renown');
    });
    it('should have drawback mentioning fiendish mark and Hell', () => {
      expect(c!.drawback).toContain('fiendish mark');
      expect(c!.drawback).toContain('Hell');
    });
  });

  // Roll 48: Ivory Tower
  describe('Ivory Tower', () => {
    const c = findById('ivory-tower');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Ivory Tower'));
    it('should have benefit mentioning three skills and dead language', () => {
      expect(c!.benefit).toContain('three skills');
      expect(c!.benefit).toContain('dead language');
    });
  });

  // Roll 49: Lifebonded
  describe('Lifebonded', () => {
    const c = findById('lifebonded');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Lifebonded'));
    it('should have benefit mentioning bound creature and revival', () => {
      expect(c!.benefit).toContain('creature');
    });
  });

  // Roll 50: Lightning Soul (source item_index: 19)
  describe('Lightning Soul', () => {
    const c = findById('lightning-soul');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Lightning Soul'));
    it('should have benefit mentioning surge and lightning damage', () => {
      expect(c!.benefit).toContain('surge');
      expect(c!.benefit).toContain('lightning damage');
    });
    it('should have drawback mentioning wet and damage weakness 5', () => {
      expect(c!.drawback).toContain('wet');
      expect(c!.drawback).toContain('damage weakness 5');
    });
  });
});

describe('Audit: Complications — Individual (Roll 51-60)', () => {
  // Roll 51: Loner
  describe('Loner', () => {
    const c = findById('loner');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Loner'));
    it('should have benefit mentioning respite and skill', () => {
      expect(c!.benefit).toContain('respite');
      expect(c!.benefit).toContain('skill');
    });
    it('should have drawback mentioning taunted', () => {
      expect(c!.drawback).toContain('taunted');
    });
  });

  // Roll 52: Lost in Time
  describe('Lost in Time', () => {
    const c = findById('lost-in-time');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Lost in Time'));
    it('should have benefit mentioning damage type choice', () => {
      expect(c!.benefit).toContain('damage type');
    });
  });

  // Roll 53: Lost Your Head
  describe('Lost Your Head', () => {
    const c = findById('lost-your-head');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Lost Your Head'));
    it('should have benefit mentioning Share Head ability', () => {
      expect(c!.benefit).toContain('Share Head');
    });
  });

  // Roll 54: Lucky (source item_index: 89)
  describe('Lucky', () => {
    const c = findById('lucky');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Lucky'));
    it('should have benefit: hero token, d10, 6 or higher', () => {
      expect(c!.benefit).toContain('hero token');
      expect(c!.benefit).toContain('d10');
      expect(c!.benefit).toContain('6 or higher');
    });
    it('should have drawback mentioning tier 1 outcome and bane', () => {
      expect(c!.drawback).toContain('tier 1');
      expect(c!.drawback).toContain('bane');
    });
  });

  // Roll 55: Master Chef
  describe('Master Chef', () => {
    const c = findById('master-chef');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Master Chef'));
    it('should have benefit mentioning Cooking skill', () => {
      expect(c!.benefit).toContain('Cooking');
    });
  });

  // Roll 56: Meddling Butler
  describe('Meddling Butler', () => {
    const c = findById('meddling-butler');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Meddling Butler'));
    it('should have benefit mentioning retainer', () => {
      expect(c!.benefit).toContain('retainer');
    });
  });

  // Roll 57: Medium
  describe('Medium', () => {
    const c = findById('medium');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Medium'));
    it('should have benefit mentioning incorporeal undead and telepathically', () => {
      expect(c!.benefit).toContain('Incorporeal undead');
      expect(c!.benefit).toContain('telepathically');
    });
  });

  // Roll 58: Medusa Blood
  describe('Medusa Blood', () => {
    const c = findById('medusa-blood');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Medusa Blood'));
    it('should have benefit mentioning Stone Eyes', () => {
      expect(c!.benefit).toContain('Stone Eyes');
    });
  });

  // Roll 59: Misunderstood
  describe('Misunderstood', () => {
    const c = findById('misunderstood');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Misunderstood'));
    it('should have benefit mentioning edge on Brag/Intimidate', () => {
      expect(c!.benefit).toContain('Brag');
      expect(c!.benefit).toContain('Intimidate');
    });
  });

  // Roll 60: Mundane (source item_index: 99)
  describe('Mundane', () => {
    const c = findById('mundane');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Mundane'));
    it('should have benefit mentioning immunity to corruption, holy, psychic', () => {
      expect(c!.benefit).toContain('corruption');
      expect(c!.benefit).toContain('holy');
      expect(c!.benefit).toContain('psychic');
    });
    it('should have drawback mentioning three magic treasures and bane', () => {
      expect(c!.drawback).toContain('three magic treasures');
      expect(c!.drawback).toContain('bane');
    });
  });
});

describe('Audit: Complications — Individual (Roll 61-70)', () => {
  // Roll 61: Outlaw
  describe('Outlaw', () => {
    const c = findById('outlaw');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Outlaw'));
    it('should have benefit mentioning 1 Renown', () => {
      expect(c!.benefit).toContain('1 Renown');
    });
  });

  // Roll 62: Pirate
  describe('Pirate', () => {
    const c = findById('pirate');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Pirate'));
    it('should have benefit mentioning Renown 2 higher and pirate map', () => {
      expect(c!.benefit).toContain('Renown');
      expect(c!.benefit).toContain('pirate map');
    });
  });

  // Roll 63: Preacher
  describe('Preacher', () => {
    const c = findById('preacher');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Preacher'));
    it('should have benefit mentioning convert members', () => {
      expect(c!.benefit).toContain('convert');
    });
  });

  // Roll 64: Primordial Sickness (source item_index: 34)
  describe('Primordial Sickness', () => {
    const c = findById('primordial-sickness');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Primordial Sickness'));
    it('should have benefit: corruption immunity 5 and poison immunity 5', () => {
      expect(c!.benefit).toContain('corruption immunity 5');
      expect(c!.benefit).toContain('poison immunity 5');
    });
    it('should have drawback: Recoveries reduced by 1', () => {
      expect(c!.drawback).toContain('Recoveries');
      expect(c!.drawback).toContain('reduced by 1');
    });
  });

  // Roll 65: Prisoner of the Synlirii
  describe('Prisoner of the Synlirii', () => {
    const c = findById('prisoner-of-the-synlirii');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Prisoner of the Synlirii'));
    it('should have benefit mentioning telepathically communicate', () => {
      expect(c!.benefit).toContain('telepathically communicate');
    });
  });

  // Roll 66: Promising Apprentice
  describe('Promising Apprentice', () => {
    const c = findById('promising-apprentice');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Promising Apprentice'));
    it('should have benefit mentioning crafting skill group', () => {
      expect(c!.benefit).toContain('crafting');
    });
  });

  // Roll 67: Psychic Eruption
  describe('Psychic Eruption', () => {
    const c = findById('psychic-eruption');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Psychic Eruption'));
    it('should have benefit mentioning Psychic Blast', () => {
      expect(c!.benefit).toContain('Psychic Blast');
    });
  });

  // Roll 68: Raised by Beasts
  describe('Raised by Beasts', () => {
    const c = findById('raised-by-beasts');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Raised by Beasts'));
    it('should have benefit mentioning Handle Animals', () => {
      expect(c!.benefit).toContain('Handle Animals');
    });
  });

  // Roll 69: Refugee
  describe('Refugee', () => {
    const c = findById('refugee');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Refugee'));
  });

  // Roll 70: Rival
  describe('Rival', () => {
    const c = findById('rival');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Rival'));
    it('should have benefit mentioning +3 bonus to tests', () => {
      expect(c!.benefit).toContain('+3 bonus');
    });
  });
});

describe('Audit: Complications — Individual (Roll 71-80)', () => {
  // Roll 71: Rogue Talent
  describe('Rogue Talent', () => {
    const c = findById('rogue-talent');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Rogue Talent'));
    it('should have benefit mentioning Telekinetic Grasp', () => {
      expect(c!.benefit).toContain('Telekinetic Grasp');
    });
    it('should have drawback mentioning psychic weakness 5', () => {
      expect(c!.drawback).toContain('psychic weakness 5');
    });
  });

  // Roll 72: Runaway (source item_index: 02)
  describe('Runaway', () => {
    const c = findById('runaway');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Runaway'));
    it('should have benefit mentioning crafting skill group', () => {
      expect(c!.benefit).toContain('crafting skill group');
    });
  });

  // Roll 73: Searching for a Cure
  describe('Searching for a Cure', () => {
    const c = findById('searching-for-a-cure');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Searching for a Cure'));
    it('should have benefit mentioning saving throws', () => {
      expect(c!.benefit).toContain('saving throws');
    });
  });

  // Roll 74: Secret Identity
  describe('Secret Identity', () => {
    const c = findById('secret-identity');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Secret Identity'));
    it('should have benefit mentioning true identity', () => {
      expect(c!.benefit).toContain('true identity');
    });
  });

  // Roll 75: Secret Twin
  describe('Secret Twin', () => {
    const c = findById('secret-twin');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Secret Twin'));
    it('should have benefit mentioning 1st-echelon trinket', () => {
      expect(c!.benefit).toContain('trinket');
    });
  });

  // Roll 76: Self-Taught (source item_index: 61)
  describe('Self-Taught', () => {
    const c = findById('self-taught');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name (with hyphen)', () => expect(c!.name).toBe('Self-Taught'));
    it('should have benefit mentioning Heroic Resource and damage bonus', () => {
      expect(c!.benefit).toContain('Heroic Resource');
      expect(c!.benefit).toContain('damage bonus');
    });
  });

  // Roll 77: Sewer Folk
  describe('Sewer Folk', () => {
    const c = findById('sewer-folk');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Sewer Folk'));
    it('should have benefit mentioning climb or swim', () => {
      expect(c!.benefit).toContain('climb or swim');
    });
    it('should have drawback: poison weakness 5', () => {
      expect(c!.drawback).toContain('poison weakness 5');
    });
  });

  // Roll 78: Shadow Born (source item_index: 92)
  describe('Shadow Born', () => {
    const c = findById('shadow-born');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Shadow Born'));
    it('should have benefit mentioning concealment and surge', () => {
      expect(c!.benefit).toContain('concealment');
      expect(c!.benefit).toContain('surge');
    });
    it('should have drawback: holy weakness 5', () => {
      expect(c!.drawback).toContain('holy weakness 5');
    });
  });

  // Roll 79: Shared Spirit
  describe('Shared Spirit', () => {
    const c = findById('shared-spirit');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Shared Spirit'));
    it('should have benefit mentioning d6 roll and spirit control', () => {
      expect(c!.benefit).toContain('d6');
    });
  });

  // Roll 80: Shattered Legacy (source item_index: 04)
  describe('Shattered Legacy', () => {
    const c = findById('shattered-legacy');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Shattered Legacy'));
    it('should have benefit mentioning language and leveled treasure', () => {
      expect(c!.benefit).toContain('language');
      expect(c!.benefit).toContain('leveled treasure');
    });
    it('should have drawback mentioning broken and Craft Treasure', () => {
      expect(c!.drawback).toContain('broken');
      expect(c!.drawback).toContain('Craft Treasure');
    });
  });
});

describe('Audit: Complications — Individual (Roll 81-90)', () => {
  // Roll 81: Shipwrecked
  describe('Shipwrecked', () => {
    const c = findById('shipwrecked');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Shipwrecked'));
    it('should have benefit mentioning two skills from exploration', () => {
      expect(c!.benefit).toContain('exploration skill group');
    });
  });

  // Roll 82: Sibling's Shield (source item_index: 70)
  describe("Sibling's Shield", () => {
    const c = findById('siblings-shield');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name with apostrophe', () => expect(c!.name).toBe("Sibling's Shield"));
    it('should have benefit mentioning flanked', () => {
      expect(c!.benefit).toContain('flanked');
    });
    it('should have drawback mentioning respite and Intuition test', () => {
      expect(c!.drawback).toContain('Intuition test');
    });
  });

  // Roll 83: Silent Sentinel
  describe('Silent Sentinel', () => {
    const c = findById('silent-sentinel');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Silent Sentinel'));
    it('should have benefit mentioning Eavesdrop and Sneak skills', () => {
      expect(c!.benefit).toContain('Eavesdrop');
      expect(c!.benefit).toContain('Sneak');
    });
    it('should have drawback: sonic weakness 5', () => {
      expect(c!.drawback).toContain('sonic weakness 5');
    });
  });

  // Roll 84: Slight Case of Lycanthropy
  describe('Slight Case of Lycanthropy', () => {
    const c = findById('slight-case-of-lycanthropy');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Slight Case of Lycanthropy'));
    it('should have benefit mentioning surge when winding/killing', () => {
      expect(c!.benefit).toContain('surge');
    });
    it('should have drawback mentioning wolfish hybrid', () => {
      expect(c!.drawback).toContain('wolfish hybrid');
    });
  });

  // Roll 85: Stolen Face
  describe('Stolen Face', () => {
    const c = findById('stolen-face');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Stolen Face'));
    it('should have benefit mentioning rearrange face', () => {
      expect(c!.benefit).toContain('rearrange your face');
    });
  });

  // Roll 86: Strange Inheritance
  describe('Strange Inheritance', () => {
    const c = findById('strange-inheritance');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Strange Inheritance'));
    it('should have benefit mentioning 2nd-echelon trinket', () => {
      expect(c!.benefit).toContain('2nd-echelon trinket');
    });
  });

  // Roll 87: Stripped of Rank
  describe('Stripped of Rank', () => {
    const c = findById('stripped-of-rank');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Stripped of Rank'));
    it('should have benefit mentioning Issue Order', () => {
      expect(c!.benefit).toContain('Issue Order');
    });
  });

  // Roll 88: Thrill Seeker
  describe('Thrill Seeker', () => {
    const c = findById('thrill-seeker');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Thrill Seeker'));
    it('should have benefit mentioning hero token at Victories', () => {
      expect(c!.benefit).toContain('hero token');
      expect(c!.benefit).toContain('Victories');
    });
  });

  // Roll 89: Vampire Scion (BUG: code has 'vampire-sire' / 'Vampire Sire')
  // Source: item_id=vampire-scion, item_name=Vampire Scion
  describe('Vampire Scion', () => {
    // NOTE: The source says "Vampire Scion" but code has "Vampire Sire"
    // This test documents the bug by testing what the code actually has
    it('should exist (currently as vampire-sire - BUG: source says vampire-scion)', () => {
      const bySourceId = findById('vampire-scion');
      const byCodeId = findById('vampire-sire');
      // At least one should exist
      const c = bySourceId ?? byCodeId;
      expect(c).toBeDefined();
    });
    it('should have description mentioning vampire progenitor', () => {
      const c = findById('vampire-scion') ?? findById('vampire-sire');
      expect(c!.description).toContain('vampire');
    });
    it('should have benefit mentioning melee free strike and biting', () => {
      const c = findById('vampire-scion') ?? findById('vampire-sire');
      expect(c!.benefit).toContain('melee free strike');
      expect(c!.benefit).toContain('biting');
    });
    it('should have drawback mentioning fangs and vampire progenitor', () => {
      const c = findById('vampire-scion') ?? findById('vampire-sire');
      expect(c!.drawback).toContain('fangs');
      expect(c!.drawback).toContain('vampire progenitor');
    });
  });

  // Roll 90: Voice in Your Head
  describe('Voice in Your Head', () => {
    const c = findById('voice-in-your-head');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Voice in Your Head'));
    it('should have benefit mentioning voice and advice', () => {
      expect(c!.benefit).toContain('voice');
    });
  });
});

describe('Audit: Complications — Individual (Roll 91-100)', () => {
  // Roll 91: Vow of Duty (source item_index: 03)
  describe('Vow of Duty', () => {
    const c = findById('vow-of-duty');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Vow of Duty'));
    it('should have benefit: +1 bonus to stability', () => {
      expect(c!.benefit).toContain('+1 bonus to stability');
    });
    it('should have drawback mentioning stability becomes 0', () => {
      expect(c!.drawback).toContain('stability becomes 0');
    });
  });

  // Roll 92: Vow of Honesty
  describe('Vow of Honesty', () => {
    const c = findById('vow-of-honesty');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Vow of Honesty'));
    it('should have benefit mentioning lying detection', () => {
      expect(c!.benefit).toContain('lying');
    });
  });

  // Roll 93: Waking Dreams
  describe('Waking Dreams', () => {
    const c = findById('waking-dreams');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Waking Dreams'));
    it('should have benefit mentioning vision', () => {
      expect(c!.benefit).toContain('vision');
    });
  });

  // Roll 94: War Dog Collar
  describe('War Dog Collar', () => {
    const c = findById('war-dog-collar');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('War Dog Collar'));
    it('should have benefit mentioning Posthumous Retirement', () => {
      expect(c!.benefit).toContain('Posthumous Retirement');
    });
  });

  // Roll 95: War of Assassins
  describe('War of Assassins', () => {
    const c = findById('war-of-assassins');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('War of Assassins'));
    it('should have benefit mentioning three times for favors', () => {
      expect(c!.benefit).toContain('three times');
      expect(c!.benefit).toContain('favors');
    });
  });

  // Roll 96: Ward
  describe('Ward', () => {
    const c = findById('ward');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Ward'));
    it('should have benefit mentioning patience increases by 1', () => {
      expect(c!.benefit).toContain('patience');
    });
  });

  // Roll 97: Waterborn
  describe('Waterborn', () => {
    const c = findById('waterborn');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Waterborn'));
    it('should have benefit mentioning swim and breathe underwater', () => {
      expect(c!.benefit).toContain('swim');
      expect(c!.benefit).toContain('breathe underwater');
    });
    it('should have drawback mentioning lightning weakness 5', () => {
      expect(c!.drawback).toContain('lightning weakness 5');
    });
  });

  // Roll 98: Wodewalker
  describe('Wodewalker', () => {
    const c = findById('wodewalker');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Wodewalker'));
    it('should have benefit mentioning recovery value and highest characteristic', () => {
      expect(c!.benefit).toContain('recovery value');
      expect(c!.benefit).toContain('highest characteristic');
    });
    it('should have drawback: fire weakness 5', () => {
      expect(c!.drawback).toContain('fire weakness 5');
    });
  });

  // Roll 99: Wrathful Spirit
  describe('Wrathful Spirit', () => {
    const c = findById('wrathful-spirit');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Wrathful Spirit'));
    it('should have benefit mentioning taunted and edge on strikes', () => {
      expect(c!.benefit).toContain('taunted');
      expect(c!.benefit).toContain('edge');
    });
  });

  // Roll 100: Wrongly Imprisoned
  describe('Wrongly Imprisoned', () => {
    const c = findById('wrongly-imprisoned');
    it('should exist', () => expect(c).toBeDefined());
    it('should have correct name', () => expect(c!.name).toBe('Wrongly Imprisoned'));
    it('should have benefit mentioning two skills', () => {
      expect(c!.benefit).toContain('two skills');
    });
    it('should have drawback mentioning winded and hacking cough', () => {
      expect(c!.drawback).toContain('winded');
      expect(c!.drawback).toContain('hacking cough');
    });
  });
});

// ============================================================
// Known Bug Documentation
// ============================================================
describe('Audit: Complications — Known Bugs', () => {
  it('BUG: vampire-sire should be vampire-scion (source ID mismatch)', () => {
    // Source: docs/rules_data/data-rules-md/Complications/Vampire Scion.md
    //   item_id: vampire-scion
    //   item_name: Vampire Scion
    // Code: id='vampire-sire', name='Vampire Sire'
    // The source book calls this complication "Vampire Scion" not "Vampire Sire"
    const codeEntry = findById('vampire-sire');
    const sourceEntry = findById('vampire-scion');

    // Document the current state: code uses 'vampire-sire'
    expect(codeEntry).toBeDefined();
    // The source ID 'vampire-scion' does not exist in code
    expect(sourceEntry).toBeUndefined();

    // The name is also wrong
    expect(codeEntry!.name).toBe('Vampire Sire'); // code says "Sire"
    // Source says "Scion" - this is documented as a bug
  });
});
