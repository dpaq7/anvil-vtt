/**
 * Beastheart Forge Steel audit
 *
 * Source checked against https://forgesteel.net and the matching Forge Steel
 * class data file at src/data/classes/beastheart/beastheart.ts.
 */
import { describe, expect, it } from 'vitest';
import { GameData } from '../game-data/lib/game-rules.js';
import * as BattleLogic from '../logic/battle-logic.js';
import * as HeroLogic from '../logic/hero-logic.js';
import * as WizardLogic from '../logic/wizard-logic.js';
import { getBeastheartAbilities } from '../rules/classes/class-abilities.js';
import {
  BEASTHEART_COMPANION_COMBAT_RULES,
  BEASTHEART_RAMPAGE_THRESHOLDS,
} from '../rules/classes/beastheart/companions.js';

describe('Beastheart Forge Steel mechanics', () => {
  it('matches foundation stats and Ferocity resource mechanics', () => {
    const classDef = GameData.getClass('beastheart');

    expect(classDef?.heroicResource).toBe('ferocity');
    expect(classDef?.masterClass).toBe(true);
    expect(HeroLogic.getHeroicResourceType('beastheart')).toBe('ferocity');
    expect(HeroLogic.getHeroicResourceName('ferocity')).toBe('Ferocity');
    expect(HeroLogic.getMaxStaminaForClass('beastheart', 1)).toBe(21);
    expect(HeroLogic.getStaminaPerLevel('beastheart')).toBe(12);
    expect(HeroLogic.getMaxRecoveries('beastheart')).toBe(12);
    expect(HeroLogic.getPotencyCharacteristics('beastheart')).toEqual(['might', 'intuition']);
  });

  it('exposes exactly the legal Beastheart companions in hero creation', () => {
    expect(WizardLogic.getCompanionOptions()).toMatchObject([
      { id: 'basilisk', name: 'Basilisk', level: 0, roles: ['Companion'], ancestry: ['Beast'] },
      { id: 'bear', name: 'Bear', level: 0, roles: ['Companion'], ancestry: ['Animal'] },
      { id: 'boar', name: 'Boar', level: 0, roles: ['Companion'], ancestry: ['Animal'] },
      { id: 'condor', name: 'Condor', level: 0, roles: ['Companion'], ancestry: ['Animal'] },
      { id: 'deinonychus', name: 'Deinonychus', level: 0, roles: ['Companion'], ancestry: ['Animal'] },
      { id: 'drake', name: 'Drake', level: 0, roles: ['Companion'], ancestry: ['Dragon'] },
      { id: 'elemental-spark', name: 'Elemental Spark', level: 0, roles: ['Companion'], ancestry: ['Elemental'] },
      { id: 'gummy-ball', name: 'Gummy Ball', level: 0, roles: ['Companion'], ancestry: ['Ooze'] },
      { id: 'hellhound', name: 'Hellhound', level: 0, roles: ['Companion'], ancestry: ['Infernal'] },
      { id: 'lightbender', name: 'Lightbender', level: 0, roles: ['Companion'], ancestry: ['Beast'] },
      { id: 'panther', name: 'Panther', level: 0, roles: ['Companion'], ancestry: ['Animal'] },
      { id: 'spider', name: 'Spider', level: 0, roles: ['Companion'], ancestry: ['Animal'] },
      { id: 'sporeling', name: 'Sporeling', level: 0, roles: ['Companion'], ancestry: ['Beast'] },
      { id: 'wolf', name: 'Wolf', level: 0, roles: ['Companion'], ancestry: ['Animal'] },
    ]);
  });

  it('matches core Beastheart ability names by tier', () => {
    const abilities = getBeastheartAbilities();

    expect(abilities.signature.map((ability) => ability.name)).toEqual([
      'Bodyswap',
      'Come On!',
      'Covering Fire',
      'Stormrage',
    ]);
    expect(abilities.threeCost.map((ability) => ability.name)).toEqual([
      'Bring the Thunder',
      'Herd the Sheep',
      'Hungry like the Wolf',
      'Pushover',
    ]);
    expect(abilities.fiveCost.map((ability) => ability.name)).toEqual([
      'All of You Versus All of Me',
      'I Feed on your Pain!',
      'Rain of Fire',
      'You Let Me Get Too Close',
    ]);
    expect(abilities.sevenCost.map((ability) => ability.name)).toEqual([
      'Death and Violence',
      'Head to Head',
      'Jaws of Death',
      'Shieldbreaker',
    ]);
    expect(abilities.nineCost.map((ability) => ability.name)).toEqual([
      'Deadshot',
      'Dogpile',
      'One, Two, Three, Heave',
      'Rip Them Apart!',
    ]);
    expect(abilities.elevenCost.map((ability) => ability.name)).toEqual([
      'Life-Drinking Wound',
      'On the Razor\'s Edge',
      'Ride or Die',
      'Turn the World to Ash',
    ]);
  });

  it('generates Beastheart ability costs as Ferocity', () => {
    const costed = GameData.getAbilitiesByClass('beastheart').filter((ability) => ability.metadata.cost_amount);

    expect(costed.length).toBeGreaterThan(0);
    expect(new Set(costed.map((ability) => ability.metadata.cost_resource))).toEqual(new Set(['Ferocity']));
    expect(costed.find((ability) => ability.name === 'Bring the Thunder')?.cost).toBe('3 Ferocity');
  });

  it('models battle-scene resource triggers and companion/rampage rules', () => {
    const config = BattleLogic.getHeroicResourceConfig('beastheart');

    expect(config.name).toBe('Ferocity');
    expect(config.gainTriggers).toEqual(['turn-start', 'companion-adjacent-damage']);
    expect(BEASTHEART_COMPANION_COMBAT_RULES).toContain('Companion maximum Stamina equals the beastheart maximum Stamina.');
    expect(BEASTHEART_RAMPAGE_THRESHOLDS.map((threshold) => threshold.rampage)).toEqual([8, 12, 16, 20, 24]);
  });
});
