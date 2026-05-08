import { describe, expect, it } from 'vitest';
import * as WizardLogic from './wizard-logic.js';

describe('WizardLogic', () => {
  describe('skill selection completion', () => {
    it('counts required choices separately from automatic career and class grants', () => {
      const character = WizardLogic.createEmptyCharacter();
      character.culture = {
        environment: 'urban',
        organization: 'communal',
        upbringing: 'labor',
      };
      character.career = 'laborer';
      character.heroClass = 'beastheart';

      expect(WizardLogic.getSkillSelectionsNeeded(character)).toBe(5);
      expect(WizardLogic.getSkillSelectionsMade(character)).toBe(0);
      expect(WizardLogic.validateStep(character, WizardLogic.WIZARD_STEPS.SKILLS).valid).toBe(false);

      character.cultureSkills = {
        environment: 'Search',
        organization: 'Read Person',
        upbringing: 'Endurance',
      };
      character.careerSkillChoices = ['Blacksmithing', 'Navigate'];

      expect(WizardLogic.getSkillSelectionsMade(character)).toBe(5);
      expect(WizardLogic.validateStep(character, WizardLogic.WIZARD_STEPS.SKILLS).valid).toBe(true);
    });

    it('treats career skill groups as choices instead of automatic grants', () => {
      const character = WizardLogic.createEmptyCharacter();
      character.culture = {
        environment: 'urban',
        organization: 'communal',
        upbringing: 'labor',
      };
      character.career = 'aristocrat';

      expect(WizardLogic.getSkillSelectionsNeeded(character)).toBe(5);
      expect(WizardLogic.getSkillSelectionsMade(character)).toBe(0);
      expect(WizardLogic.calculateGrantedItems(character).skills).toEqual([]);

      character.cultureSkills = {
        environment: 'Read Person',
        organization: 'Navigate',
        upbringing: 'Endurance',
      };
      character.careerSkillChoices = ['Persuade', 'Culture'];

      expect(WizardLogic.getSkillSelectionsMade(character)).toBe(5);
      expect(WizardLogic.getSelectedSkillNames(character)).toEqual([
        'Read Person',
        'Navigate',
        'Endurance',
        'Persuade',
        'Culture',
      ]);
    });

    it('persists a unique final skill list with automatic grants and selected choices', () => {
      const character = WizardLogic.createEmptyCharacter();
      character.culture = {
        environment: 'urban',
        organization: 'communal',
        upbringing: 'labor',
      };
      character.career = 'laborer';
      character.heroClass = 'beastheart';
      character.cultureSkills = {
        environment: 'Search',
        organization: 'Read Person',
        upbringing: 'Endurance',
      };
      character.careerSkillChoices = ['Blacksmithing', 'Navigate'];

      expect(WizardLogic.getSelectedSkillNames(character)).toEqual([
        'Endurance',
        'Handle Animals',
        'Search',
        'Read Person',
        'Blacksmithing',
        'Navigate',
      ]);
    });
  });
});
