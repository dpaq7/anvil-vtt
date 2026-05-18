import { describe, expect, it } from 'vitest';
import * as WizardLogic from './wizard-logic.js';

describe('WizardLogic', () => {
  describe('class-specific characteristic assignment', () => {
    it('validates fixed class stats and a three-value remaining array', () => {
      const character = WizardLogic.createEmptyCharacter();
      character.heroClass = 'censor';
      character.characteristics = {
        might: 2,
        agility: 2,
        reason: -1,
        intuition: -1,
        presence: 2,
      };

      expect(WizardLogic.isValidStartingCharacteristics(character.characteristics, character.heroClass)).toBe(true);
      expect(WizardLogic.getStepStatus(character, WizardLogic.WIZARD_STEP_IDS.CHARACTERISTICS)).toBe('complete');

      character.characteristics = {
        might: 2,
        agility: 2,
        reason: 1,
        intuition: 0,
        presence: 2,
      };

      expect(WizardLogic.isValidStartingCharacteristics(character.characteristics, character.heroClass)).toBe(false);
      expect(WizardLogic.validateStep(character, WizardLogic.WIZARD_STEPS.CHARACTERISTICS).valid).toBe(false);
    });

    it('validates one-fixed-stat classes against four-value arrays', () => {
      const character = WizardLogic.createEmptyCharacter();
      character.heroClass = 'conduit';
      character.characteristics = {
        might: 2,
        agility: 2,
        reason: -1,
        intuition: 2,
        presence: -1,
      };

      expect(WizardLogic.isValidStartingCharacteristics(character.characteristics, character.heroClass)).toBe(true);

      character.characteristics = {
        might: 2,
        agility: 2,
        reason: -1,
        intuition: 1,
        presence: -1,
      };

      expect(WizardLogic.isValidStartingCharacteristics(character.characteristics, character.heroClass)).toBe(false);
    });
  });

  describe('beastheart companions', () => {
    it('uses the Forge Steel Beastheart companion list instead of every monster', () => {
      expect(WizardLogic.getCompanionOptions().map((option) => option.name)).toEqual([
        'Basilisk',
        'Bear',
        'Boar',
        'Condor',
        'Deinonychus',
        'Drake',
        'Elemental Spark',
        'Gummy Ball',
        'Hellhound',
        'Lightbender',
        'Panther',
        'Spider',
        'Sporeling',
        'Wolf',
      ]);
    });

    it('requires a Beastheart companion during subclass validation', () => {
      const character = WizardLogic.createEmptyCharacter();
      character.heroClass = 'beastheart';
      character.subclass = 'guardian';

      expect(WizardLogic.validateStep(character, WizardLogic.WIZARD_STEPS.SUBCLASS).valid).toBe(false);

      character.companion = 'wolf';

      expect(WizardLogic.validateStep(character, WizardLogic.WIZARD_STEPS.SUBCLASS).valid).toBe(true);
    });
  });

  describe('class-specific ability choices', () => {
    it('requires two signature choices for Conduits', () => {
      const character = WizardLogic.createEmptyCharacter();
      character.heroClass = 'conduit';

      const slots = WizardLogic.getAbilityChoiceSlots(character);

      expect(slots.map((slot) => slot.label)).toEqual([
        'Signature Ability 1',
        'Signature Ability 2',
        '3pt Ability',
        '5pt Ability',
      ]);
    });

    it('omits class signature choices for Tacticians', () => {
      const character = WizardLogic.createEmptyCharacter();
      character.heroClass = 'tactician';

      const slots = WizardLogic.getAbilityChoiceSlots(character);

      expect(slots.map((slot) => slot.label)).toEqual([
        '3pt Ability',
        '5pt Ability',
      ]);
      expect(slots.some((slot) => slot.abilityType === 'Signature')).toBe(false);
    });

    it('uses portfolio minion choices and automatic core abilities for Summoners', () => {
      const character = WizardLogic.createEmptyCharacter();
      character.heroClass = 'summoner';
      character.subclass = 'storms';

      const slots = WizardLogic.getAbilityChoiceSlots(character);

      expect(slots.map((slot) => slot.label)).toEqual([
        'Signature Minion 1',
        'Signature Minion 2',
        '3-Essence Minion',
        '5-Essence Ability',
      ]);
      expect(WizardLogic.getSummonerMinionOptionsForSlot(character, slots[0]!).map((minion) => minion.name)).toEqual([
        'Fire Plume',
        'Walking Boulder',
      ]);
      expect(WizardLogic.getAutomaticAbilityIds(character)).toEqual([
        'summoner-strike',
        'strike-for-me',
      ]);
    });

    it('does not count duplicate choices as complete', () => {
      const character = WizardLogic.createEmptyCharacter();
      character.heroClass = 'conduit';

      const slots = WizardLogic.getAbilityChoiceSlots(character);
      const signature = WizardLogic.getAbilityOptionsForSlot(character, slots[0]!)[0]!;
      const threeCost = WizardLogic.getAbilityOptionsForSlot(character, slots[2]!)[0]!;
      const fiveCost = WizardLogic.getAbilityOptionsForSlot(character, slots[3]!)[0]!;

      character.abilityChoices = {
        [slots[0]!.id]: WizardLogic.getAbilityFeatureId(signature),
        [slots[1]!.id]: WizardLogic.getAbilityFeatureId(signature),
        [slots[2]!.id]: WizardLogic.getAbilityFeatureId(threeCost),
        [slots[3]!.id]: WizardLogic.getAbilityFeatureId(fiveCost),
      };

      expect(WizardLogic.hasCompleteAbilitySelections(character)).toBe(false);
    });
  });

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

      expect(WizardLogic.getSkillSelectionsNeeded(character)).toBe(7);
      expect(WizardLogic.getSkillSelectionsMade(character)).toBe(0);
      expect(WizardLogic.validateStep(character, WizardLogic.WIZARD_STEPS.SKILLS).valid).toBe(false);

      character.cultureSkills = {
        environment: 'Search',
        organization: 'Read Person',
        upbringing: 'Endurance',
      };
      character.careerSkillChoices = ['Blacksmithing', 'Navigate'];

      expect(WizardLogic.getSkillSelectionsMade(character)).toBe(5);
      expect(WizardLogic.validateStep(character, WizardLogic.WIZARD_STEPS.SKILLS).valid).toBe(false);

      character.classSkillChoices = ['Track', 'Hide'];

      expect(WizardLogic.getSkillSelectionsMade(character)).toBe(7);
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
      character.classSkillChoices = ['Track', 'Hide'];

      expect(WizardLogic.getSelectedSkillNames(character)).toEqual([
        'Endurance',
        'Handle Animals',
        'Search',
        'Read Person',
        'Blacksmithing',
        'Navigate',
        'Track',
        'Hide',
      ]);
    });
  });
});
