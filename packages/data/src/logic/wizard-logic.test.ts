import { describe, expect, it } from 'vitest';
import { GameData } from '../game-data/index.js';
import * as HeroLogic from './hero-logic.js';
import { ALL_PERK_CATEGORIES, getAvailablePerkCategories, getClassPerkLevels } from '../rules/perks/index.js';
import * as WizardLogic from './wizard-logic.js';

const HERO_CLASSES: HeroLogic.HeroClass[] = [
  'beastheart',
  'censor',
  'conduit',
  'elementalist',
  'fury',
  'null',
  'shadow',
  'summoner',
  'tactician',
  'talent',
  'troubadour',
];

function firstSubclassSelection(heroClass: HeroLogic.HeroClass): string | string[] | null {
  const subclasses = GameData.getSubclasses(heroClass).map((subclass) => subclass.id);
  const count = GameData.getSubclassSelectCount(heroClass);
  if (count <= 0) return null;
  return count === 1 ? subclasses[0] ?? null : subclasses.slice(0, count);
}

describe('WizardLogic', () => {
  describe('wizard step status', () => {
    it('does not mark future choice steps complete before their prerequisites exist', () => {
      const character = WizardLogic.createEmptyCharacter();
      character.level = 5;

      expect(WizardLogic.getStepStatus(character, WizardLogic.WIZARD_STEP_IDS.SKILLS)).toBe('not-begun');
      expect(WizardLogic.getStepStatus(character, WizardLogic.WIZARD_STEP_IDS.LANGUAGES)).toBe('not-begun');
      expect(WizardLogic.getStepStatus(character, WizardLogic.WIZARD_STEP_IDS.PERKS)).toBe('not-begun');
    });
  });

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

  describe('level advancement mechanics', () => {
    it('grants five class perk slots through level 10 with class-specific restrictions', () => {
      const expected: Record<HeroLogic.HeroClass, Record<number, string[]>> = {
        beastheart: {
          2: ['exploration', 'interpersonal', 'intrigue'],
          4: ALL_PERK_CATEGORIES,
          6: ['exploration', 'interpersonal', 'intrigue'],
          8: ALL_PERK_CATEGORIES,
          10: ['exploration', 'interpersonal', 'intrigue'],
        },
        censor: {
          2: ['interpersonal', 'lore', 'supernatural'],
          4: ALL_PERK_CATEGORIES,
          6: ['interpersonal', 'lore', 'supernatural'],
          8: ALL_PERK_CATEGORIES,
          10: ['crafting', 'lore', 'supernatural'],
        },
        conduit: {
          2: ['crafting', 'lore', 'supernatural'],
          4: ALL_PERK_CATEGORIES,
          6: ['crafting', 'lore', 'supernatural'],
          8: ALL_PERK_CATEGORIES,
          10: ['crafting', 'lore', 'supernatural'],
        },
        elementalist: {
          2: ['crafting', 'lore', 'supernatural'],
          4: ALL_PERK_CATEGORIES,
          6: ['crafting', 'lore', 'supernatural'],
          8: ALL_PERK_CATEGORIES,
          10: ['crafting', 'lore', 'supernatural'],
        },
        fury: {
          2: ['crafting', 'exploration', 'intrigue'],
          4: ALL_PERK_CATEGORIES,
          6: ['crafting', 'exploration', 'intrigue'],
          8: ALL_PERK_CATEGORIES,
          10: ['crafting', 'exploration', 'intrigue'],
        },
        null: {
          2: ['exploration', 'interpersonal', 'intrigue'],
          4: ALL_PERK_CATEGORIES,
          6: ['exploration', 'interpersonal', 'intrigue'],
          8: ALL_PERK_CATEGORIES,
          10: ['exploration', 'interpersonal', 'intrigue'],
        },
        shadow: {
          2: ['exploration', 'interpersonal', 'intrigue'],
          4: ALL_PERK_CATEGORIES,
          6: ALL_PERK_CATEGORIES,
          8: ALL_PERK_CATEGORIES,
          10: ALL_PERK_CATEGORIES,
        },
        summoner: {
          2: ['intrigue', 'lore', 'supernatural'],
          4: ALL_PERK_CATEGORIES,
          6: ['intrigue', 'lore', 'supernatural'],
          8: ALL_PERK_CATEGORIES,
          10: ['intrigue', 'interpersonal', 'supernatural'],
        },
        tactician: {
          2: ['exploration', 'interpersonal', 'intrigue'],
          4: ALL_PERK_CATEGORIES,
          6: ['exploration', 'interpersonal', 'intrigue'],
          8: ALL_PERK_CATEGORIES,
          10: ['exploration', 'interpersonal', 'intrigue'],
        },
        talent: {
          2: ['interpersonal', 'lore', 'supernatural'],
          4: ALL_PERK_CATEGORIES,
          6: ['interpersonal', 'lore', 'supernatural'],
          8: ALL_PERK_CATEGORIES,
          10: ['interpersonal', 'lore', 'supernatural'],
        },
        troubadour: {
          2: ['interpersonal', 'lore', 'supernatural'],
          4: ALL_PERK_CATEGORIES,
          6: ['interpersonal', 'lore', 'supernatural'],
          8: ALL_PERK_CATEGORIES,
          10: ['interpersonal', 'lore', 'supernatural'],
        },
      };

      for (const heroClass of HERO_CLASSES) {
        expect(getClassPerkLevels(heroClass)).toEqual([2, 4, 6, 8, 10]);
        for (const level of [2, 4, 6, 8, 10]) {
          expect(getAvailablePerkCategories(heroClass, level)).toEqual(expected[heroClass][level]);
        }
      }
    });

    it('surfaces and validates every required level-up choice for level 10 heroes', () => {
      for (const heroClass of HERO_CLASSES) {
        const character = WizardLogic.createEmptyCharacter();
        character.heroClass = heroClass;
        character.subclass = firstSubclassSelection(heroClass);
        character.level = 10;

        for (let level = 2; level <= 10; level += 1) {
          const features = WizardLogic.getLevelUpFeatures(character, level);
          const choiceFeatures = features.filter((feature) => feature.type === 'choice');

          for (const feature of choiceFeatures) {
            expect(feature.choices?.length, `${heroClass} L${level} ${feature.name}`).toBeGreaterThan(0);
          }

          if (choiceFeatures.length > 0) {
            expect(WizardLogic.isLevelUpStepComplete(character, level)).toBe(false);
          }

          character.levelUpChoices[level] = choiceFeatures.map((feature) => ({
            featureId: feature.id,
            choiceId: feature.choices![0]!.id,
            category: feature.category,
          }));

          expect(WizardLogic.isLevelUpStepComplete(character, level), `${heroClass} L${level}`).toBe(true);
        }

        expect(WizardLogic.getSelectedAbilityIds(character).length).toBeGreaterThanOrEqual(
          heroClass === 'summoner' ? 2 : 0
        );
        expect(WizardLogic.getSelectedSkillNames(character).length).toBeGreaterThan(0);
      }
    });

    it('calculates level 10 stamina, recoveries, and recovery values for every class', () => {
      const expectedStats: Record<HeroLogic.HeroClass, { level1: number; perLevel: number; recoveries: number }> = {
        beastheart: { level1: 21, perLevel: 12, recoveries: 12 },
        censor: { level1: 21, perLevel: 9, recoveries: 12 },
        conduit: { level1: 18, perLevel: 6, recoveries: 8 },
        elementalist: { level1: 18, perLevel: 6, recoveries: 8 },
        fury: { level1: 21, perLevel: 9, recoveries: 10 },
        null: { level1: 21, perLevel: 9, recoveries: 8 },
        shadow: { level1: 18, perLevel: 6, recoveries: 8 },
        summoner: { level1: 15, perLevel: 6, recoveries: 8 },
        tactician: { level1: 21, perLevel: 9, recoveries: 10 },
        talent: { level1: 18, perLevel: 6, recoveries: 8 },
        troubadour: { level1: 18, perLevel: 6, recoveries: 8 },
      };

      for (const heroClass of HERO_CLASSES) {
        const expectedStamina = expectedStats[heroClass].level1 + expectedStats[heroClass].perLevel * 9;
        expect(HeroLogic.getMaxStaminaForClass(heroClass, 10)).toBe(expectedStamina);
        expect(HeroLogic.getMaxRecoveries(heroClass)).toBe(expectedStats[heroClass].recoveries);
        expect(HeroLogic.getRecoveryValue(expectedStamina)).toBe(Math.floor(expectedStamina / 3));
      }

      expect(HeroLogic.getLevelAdvancementStaminaBonus('summoner', 10, {
        3: [{ featureId: 'summoner-3-ward', choiceId: 'conjured-ward', category: 'ward' }],
      })).toBe(12);
    });

    it('applies fixed and chosen characteristic increases through level 10', () => {
      const base: HeroLogic.Characteristics = {
        might: 2,
        agility: 2,
        reason: 2,
        intuition: 2,
        presence: 2,
      };

      for (const heroClass of HERO_CLASSES) {
        const fixed = HeroLogic.getAdvancementFixedCharacteristics(heroClass);
        const chosen = WizardLogic.CHARACTERISTIC_ORDER.find((name) => !fixed.includes(name))!;
        const choices = fixed.length === 1
          ? {
              4: [{ featureId: 'l4-characteristic', choiceId: chosen, category: 'characteristic' }],
              10: [{ featureId: 'l10-characteristic', choiceId: chosen, category: 'characteristic' }],
            }
          : {};
        const advanced = HeroLogic.applyLevelAdvancementCharacteristics(heroClass, 10, base, choices);

        for (const name of fixed) {
          expect(advanced[name], `${heroClass} fixed ${name}`).toBe(5);
        }

        if (fixed.length === 1) {
          expect(advanced[chosen], `${heroClass} chosen ${chosen}`).toBe(5);
        }

        for (const value of Object.values(advanced)) {
          expect(value).toBeGreaterThanOrEqual(3);
          expect(value).toBeLessThanOrEqual(5);
        }
      }
    });

    it('uses 16 XP advancement thresholds', () => {
      expect(HeroLogic.getMinXPForLevel(1)).toBe(0);
      expect(HeroLogic.getMinXPForLevel(10)).toBe(144);
      expect(HeroLogic.getMinXPForNextLevel(9)).toBe(144);
      expect(HeroLogic.getMinXPForNextLevel(10)).toBeNull();
      expect(HeroLogic.getLevelForXP(143)).toBe(9);
      expect(HeroLogic.getLevelForXP(144)).toBe(10);
      expect(HeroLogic.canAdvanceLevel(4, 79)).toBe(true);
      expect(HeroLogic.canAdvanceLevel(4, 63)).toBe(false);
    });
  });
});
