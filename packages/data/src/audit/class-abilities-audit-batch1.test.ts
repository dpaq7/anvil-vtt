/**
 * Class Abilities Audit — Batch 1
 *
 * Validates ability data for 6 classes: Fury, Censor, Conduit, Elementalist, Null, Shadow
 * against the Draw Steel source books.
 *
 * Sources:
 *   docs/rules_data/data-rules-md/Classes/Fury.md
 *   docs/rules_data/data-rules-md/Classes/Censor.md
 *   docs/rules_data/data-rules-md/Classes/Conduit.md
 *   docs/rules_data/data-rules-md/Classes/Elementalist.md
 *   docs/rules_data/data-rules-md/Classes/Null.md
 *   docs/rules_data/data-rules-md/Classes/Shadow.md
 *
 * Code files:
 *   packages/data/src/rules/classes/{fury,censor,conduit,elementalist,null,shadow}/abilities.ts
 */
import { describe, it, expect } from 'vitest';
import {
  getFuryAbilities,
  getCensorAbilities,
  getConduitAbilities,
  getElementalistAbilities,
  getNullAbilities,
  getShadowAbilities,
  type AbilitiesByTier,
} from '../rules/classes/class-abilities.js';

// =============================================================================
// Helpers
// =============================================================================

/** Collect ALL ability IDs from an AbilitiesByTier to check for duplicates */
function allIds(tiers: AbilitiesByTier): string[] {
  return [
    ...tiers.signature,
    ...tiers.threeCost,
    ...tiers.fiveCost,
    ...tiers.sevenCost,
    ...tiers.nineCost,
    ...tiers.elevenCost,
    ...tiers.triggeredActions,
    ...tiers.other,
  ].map(a => a.id);
}

/** Collect ALL ability names from an AbilitiesByTier */
function allNames(tiers: AbilitiesByTier): string[] {
  return [
    ...tiers.signature,
    ...tiers.threeCost,
    ...tiers.fiveCost,
    ...tiers.sevenCost,
    ...tiers.nineCost,
    ...tiers.elevenCost,
    ...tiers.triggeredActions,
    ...tiers.other,
  ].map(a => a.name);
}

/** Assert no duplicate IDs */
function expectNoDuplicateIds(tiers: AbilitiesByTier) {
  const ids = allIds(tiers);
  const seen = new Set<string>();
  const dupes: string[] = [];
  for (const id of ids) {
    if (seen.has(id)) dupes.push(id);
    seen.add(id);
  }
  expect(dupes, `Duplicate ability IDs found: ${dupes.join(', ')}`).toEqual([]);
}

// =============================================================================
// FURY
// =============================================================================

describe('Fury abilities audit', () => {
  const base = getFuryAbilities();
  const berserker = getFuryAbilities('berserker');
  const reaver = getFuryAbilities('reaver');
  const stormwight = getFuryAbilities('stormwight');

  describe('base (no aspect)', () => {
    it('has 4 signature abilities', () => {
      // Brutal Slam, Hit and Run, Impaled!, To the Death!
      expect(base.signature).toHaveLength(4);
    });

    it('has 4 three-cost abilities', () => {
      // Back!, Out of the Way!, Tide of Death, Your Entrails Are Your Extrails!
      expect(base.threeCost).toHaveLength(4);
    });

    it('has 4 five-cost abilities (core only)', () => {
      // Blood for Blood!, Make Peace With Your God!, Thunder Roar, To the Uttermost End
      expect(base.fiveCost).toHaveLength(4);
    });

    it('has 4 seven-cost abilities', () => {
      // Demon Unleashed, Face the Storm!, Steelbreaker, You Are Already Dead
      expect(base.sevenCost).toHaveLength(4);
    });

    it('has 4 nine-cost abilities (core only)', () => {
      // Debilitating Strike, My Turn!, Rebounding Storm, To Stone!
      expect(base.nineCost).toHaveLength(4);
    });

    it('has 4 eleven-cost abilities (core only)', () => {
      // Elemental Ferocity, Overkill, Primordial Rage, Relentless Death
      expect(base.elevenCost).toHaveLength(4);
    });

    it('has no triggered actions without an aspect', () => {
      expect(base.triggeredActions).toHaveLength(0);
    });

    it('has correct signature ability names', () => {
      const names = base.signature.map(a => a.name);
      expect(names).toContain('Brutal Slam');
      expect(names).toContain('Hit and Run');
      expect(names).toContain('Impaled!');
      expect(names).toContain('To the Death!');
    });

    it('has correct 3-cost ability names', () => {
      const names = base.threeCost.map(a => a.name);
      expect(names).toContain('Back!');
      expect(names).toContain('Out of the Way!');
      expect(names).toContain('Tide of Death');
      expect(names).toContain('Your Entrails Are Your Extrails!');
    });

    it('has correct 5-cost ability names', () => {
      const names = base.fiveCost.map(a => a.name);
      expect(names).toContain('Blood for Blood!');
      expect(names).toContain('Make Peace With Your God!');
      expect(names).toContain('Thunder Roar');
      expect(names).toContain('To the Uttermost End');
    });

    it('has correct 7-cost ability names', () => {
      const names = base.sevenCost.map(a => a.name);
      expect(names).toContain('Demon Unleashed');
      expect(names).toContain('Face the Storm!');
      expect(names).toContain('Steelbreaker');
      expect(names).toContain('You Are Already Dead');
    });

    it('has correct 9-cost ability names', () => {
      const names = base.nineCost.map(a => a.name);
      expect(names).toContain('Debilitating Strike');
      expect(names).toContain('My Turn!');
      expect(names).toContain('Rebounding Storm');
      expect(names).toContain('To Stone!');
    });

    it('has correct 11-cost ability names', () => {
      const names = base.elevenCost.map(a => a.name);
      expect(names).toContain('Elemental Ferocity');
      expect(names).toContain('Overkill');
      expect(names).toContain('Primordial Rage');
      expect(names).toContain('Relentless Death');
    });

    it('has no duplicate IDs', () => {
      expectNoDuplicateIds(base);
    });
  });

  describe('signature ability details', () => {
    it('Brutal Slam has correct keywords and powerRoll', () => {
      const a = base.signature.find(a => a.name === 'Brutal Slam')!;
      expect(a.keywords).toEqual(['Melee', 'Strike', 'Weapon']);
      expect(a.actionType).toBe('action');
      expect(a.powerRoll?.characteristic).toBe('might');
      expect(a.distance).toBe('Melee 1');
      expect(a.target).toBe('One creature or object');
    });

    it('Hit and Run has correct keywords and effect', () => {
      const a = base.signature.find(a => a.name === 'Hit and Run')!;
      expect(a.keywords).toEqual(['Melee', 'Strike', 'Weapon']);
      expect(a.actionType).toBe('action');
      expect(a.powerRoll?.characteristic).toBe('might');
      expect(a.effect).toContain('shift 1 square');
    });

    it('Make Peace With Your God! is a free maneuver', () => {
      const a = base.fiveCost.find(a => a.name === 'Make Peace With Your God!')!;
      expect(a.actionType).toBe('freeManeuver');
      expect(a.keywords).toEqual([]);
    });

    it('My Turn! is a free triggered action', () => {
      const a = base.nineCost.find(a => a.name === 'My Turn!')!;
      expect(a.actionType).toBe('freeTriggered');
      expect(a.trigger).toBeTruthy();
      expect(a.powerRoll?.characteristic).toBe('might');
    });

    it('You Are Already Dead has no powerRoll', () => {
      const a = base.sevenCost.find(a => a.name === 'You Are Already Dead')!;
      expect(a.powerRoll).toBeUndefined();
      expect(a.keywords).toContain('Melee');
      expect(a.keywords).toContain('Strike');
    });
  });

  describe('all abilities use Might for power rolls', () => {
    it('every power roll references might', () => {
      const all = [
        ...base.signature, ...base.threeCost, ...base.fiveCost,
        ...base.sevenCost, ...base.nineCost, ...base.elevenCost,
      ];
      for (const a of all) {
        if (a.powerRoll) {
          expect(a.powerRoll.characteristic, `${a.name} should use might`).toBe('might');
        }
      }
    });
  });

  describe('berserker aspect', () => {
    it('adds 2 five-cost aspect abilities', () => {
      // 4 core + 2 berserker (Special Delivery, Wrecking Ball)
      expect(berserker.fiveCost).toHaveLength(6);
    });

    it('includes Special Delivery and Wrecking Ball in 5-cost', () => {
      const names = berserker.fiveCost.map(a => a.name);
      expect(names).toContain('Special Delivery');
      expect(names).toContain('Wrecking Ball');
    });

    it('adds 2 nine-cost aspect abilities', () => {
      // 4 core + 2 berserker (Avalanche Impact, Force of Storms)
      expect(berserker.nineCost).toHaveLength(6);
    });

    it('includes Avalanche Impact and Force of Storms in 9-cost', () => {
      const names = berserker.nineCost.map(a => a.name);
      expect(names).toContain('Avalanche Impact');
      expect(names).toContain('Force of Storms');
    });

    it('adds 2 eleven-cost aspect abilities', () => {
      // 4 core + 2 berserker (Death Comes for You All!, Primordial Vortex)
      expect(berserker.elevenCost).toHaveLength(6);
    });

    it('includes berserker 11-cost abilities', () => {
      const names = berserker.elevenCost.map(a => a.name);
      expect(names).toContain('Death Comes for You All!');
      expect(names).toContain('Primordial Vortex');
    });

    it('has Lines of Force as triggered action', () => {
      expect(berserker.triggeredActions).toHaveLength(1);
      expect(berserker.triggeredActions[0].name).toBe('Lines of Force');
      expect(berserker.triggeredActions[0].actionType).toBe('triggered');
      expect(berserker.triggeredActions[0].keywords).toContain('Magic');
      expect(berserker.triggeredActions[0].keywords).toContain('Melee');
    });

    it('has no duplicate IDs', () => {
      expectNoDuplicateIds(berserker);
    });
  });

  describe('reaver aspect', () => {
    it('adds 2 five-cost aspect abilities', () => {
      expect(reaver.fiveCost).toHaveLength(6);
    });

    it('includes Death... Death! and Phalanx-Breaker in 5-cost', () => {
      const names = reaver.fiveCost.map(a => a.name);
      expect(names).toContain('Death... Death!');
      expect(names).toContain('Phalanx-Breaker');
    });

    it('adds 2 nine-cost aspect abilities', () => {
      expect(reaver.nineCost).toHaveLength(6);
    });

    it('includes Death Strike and Seek and Destroy in 9-cost', () => {
      const names = reaver.nineCost.map(a => a.name);
      expect(names).toContain('Death Strike');
      expect(names).toContain('Seek and Destroy');
    });

    it('adds 2 eleven-cost aspect abilities', () => {
      expect(reaver.elevenCost).toHaveLength(6);
    });

    it('includes Primordial Bane and Shower of Blood in 11-cost', () => {
      const names = reaver.elevenCost.map(a => a.name);
      expect(names).toContain('Primordial Bane');
      expect(names).toContain('Shower of Blood');
    });

    it('has Unearthly Reflexes as triggered action', () => {
      expect(reaver.triggeredActions).toHaveLength(1);
      expect(reaver.triggeredActions[0].name).toBe('Unearthly Reflexes');
    });

    it('has no duplicate IDs', () => {
      expectNoDuplicateIds(reaver);
    });
  });

  describe('stormwight aspect', () => {
    it('adds 2 five-cost aspect abilities', () => {
      expect(stormwight.fiveCost).toHaveLength(6);
    });

    it('includes Apex Predator and Visceral Roar in 5-cost', () => {
      const names = stormwight.fiveCost.map(a => a.name);
      expect(names).toContain('Apex Predator');
      expect(names).toContain('Visceral Roar');
    });

    it('adds 2 nine-cost aspect abilities', () => {
      expect(stormwight.nineCost).toHaveLength(6);
    });

    it('includes Pounce and Riders on the Storm in 9-cost', () => {
      const names = stormwight.nineCost.map(a => a.name);
      expect(names).toContain('Pounce');
      expect(names).toContain('Riders on the Storm');
    });

    it('adds 2 eleven-cost aspect abilities', () => {
      expect(stormwight.elevenCost).toHaveLength(6);
    });

    it('includes Death Rattle and Deluge in 11-cost', () => {
      const names = stormwight.elevenCost.map(a => a.name);
      expect(names).toContain('Death Rattle');
      expect(names).toContain('Deluge');
    });

    it('has Furious Change as triggered action', () => {
      expect(stormwight.triggeredActions).toHaveLength(1);
      expect(stormwight.triggeredActions[0].name).toBe('Furious Change');
    });

    it('has no duplicate IDs', () => {
      expectNoDuplicateIds(stormwight);
    });
  });

  describe('aspect ability details', () => {
    it('Visceral Roar has Area, Magic keywords', () => {
      const a = stormwight.fiveCost.find(a => a.name === 'Visceral Roar')!;
      expect(a.keywords).toContain('Area');
      expect(a.keywords).toContain('Magic');
      expect(a.distance).toBe('2 burst');
    });

    it('Death Strike is a free triggered action', () => {
      const a = reaver.nineCost.find(a => a.name === 'Death Strike')!;
      expect(a.actionType).toBe('freeTriggered');
      expect(a.trigger).toBeTruthy();
    });

    it('Riders on the Storm is a maneuver with Area, Magic', () => {
      const a = stormwight.nineCost.find(a => a.name === 'Riders on the Storm')!;
      expect(a.actionType).toBe('maneuver');
      expect(a.keywords).toContain('Area');
      expect(a.keywords).toContain('Magic');
    });

    it('Deluge has Area, Magic, Ranged keywords', () => {
      const a = stormwight.elevenCost.find(a => a.name === 'Deluge')!;
      expect(a.keywords).toContain('Area');
      expect(a.keywords).toContain('Magic');
      expect(a.keywords).toContain('Ranged');
    });
  });
});

// =============================================================================
// CENSOR
// =============================================================================

describe('Censor abilities audit', () => {
  const censor = getCensorAbilities();

  describe('tier counts', () => {
    it('has 4 signature abilities', () => {
      // Back Blasphemer!, Every Step... Death!, Halt Miscreant!, Your Allies Cannot Save You!
      expect(censor.signature).toHaveLength(4);
    });

    it('has 4 three-cost abilities', () => {
      // Behold a Shield of Faith!, Driving Assault, The Gods Punish and Defend, Repent!
      expect(censor.threeCost).toHaveLength(4);
    });

    it('has 4 five-cost abilities', () => {
      // Arrest, Behold the Face of Justice!, Censored, Purifying Fire
      expect(censor.fiveCost).toHaveLength(4);
    });

    it('has 4 seven-cost abilities', () => {
      // Edict of Disruptive Isolation, Edict of Perfect Order,
      // Edict of Purifying Pacifism, Edict of Stillness
      expect(censor.sevenCost).toHaveLength(4);
    });

    it('has 4 nine-cost abilities', () => {
      // Gods Grant Thee Strength, Orison of Victory,
      // Righteous Judgment, Shield of the Righteous
      expect(censor.nineCost).toHaveLength(4);
    });

    it('has 4 eleven-cost abilities', () => {
      // Excommunication, Hand of the Gods, Pillar of Holy Fire, Your Allies Turn on You!
      expect(censor.elevenCost).toHaveLength(4);
    });

    it('has no triggered actions', () => {
      expect(censor.triggeredActions).toHaveLength(0);
    });
  });

  describe('ability names', () => {
    it('has correct signature ability names', () => {
      const names = censor.signature.map(a => a.name);
      expect(names).toContain('Back Blasphemer!');
      expect(names).toContain('Every Step... Death!');
      expect(names).toContain('Halt Miscreant!');
      expect(names).toContain('Your Allies Cannot Save You!');
    });

    it('has correct 3-cost ability names', () => {
      const names = censor.threeCost.map(a => a.name);
      expect(names).toContain('Behold a Shield of Faith!');
      expect(names).toContain('Driving Assault');
      expect(names).toContain('The Gods Punish and Defend');
      expect(names).toContain('Repent!');
    });

    it('has correct 5-cost ability names', () => {
      const names = censor.fiveCost.map(a => a.name);
      expect(names).toContain('Arrest');
      expect(names).toContain('Behold the Face of Justice!');
      expect(names).toContain('Censored');
      expect(names).toContain('Purifying Fire');
    });

    it('has correct 7-cost ability names', () => {
      const names = censor.sevenCost.map(a => a.name);
      expect(names).toContain('Edict of Disruptive Isolation');
      expect(names).toContain('Edict of Perfect Order');
      expect(names).toContain('Edict of Purifying Pacifism');
      expect(names).toContain('Edict of Stillness');
    });

    it('has correct 9-cost ability names', () => {
      const names = censor.nineCost.map(a => a.name);
      expect(names).toContain('Gods Grant Thee Strength');
      expect(names).toContain('Orison of Victory');
      expect(names).toContain('Righteous Judgment');
      expect(names).toContain('Shield of the Righteous');
    });

    it('has correct 11-cost ability names', () => {
      const names = censor.elevenCost.map(a => a.name);
      expect(names).toContain('Excommunication');
      expect(names).toContain('Hand of the Gods');
      expect(names).toContain('Pillar of Holy Fire');
      expect(names).toContain('Your Allies Turn on You!');
    });
  });

  describe('ability details', () => {
    it('Back Blasphemer! has Area, Magic, Melee, Weapon keywords and uses Presence', () => {
      const a = censor.signature.find(a => a.name === 'Back Blasphemer!')!;
      expect(a.keywords).toEqual(['Area', 'Magic', 'Melee', 'Weapon']);
      expect(a.powerRoll?.characteristic).toBe('presence');
      expect(a.actionType).toBe('action');
    });

    it('Every Step... Death! has Magic, Ranged, Strike and uses Presence', () => {
      const a = censor.signature.find(a => a.name === 'Every Step... Death!')!;
      expect(a.keywords).toEqual(['Magic', 'Ranged', 'Strike']);
      expect(a.powerRoll?.characteristic).toBe('presence');
    });

    it('Halt Miscreant! uses Might', () => {
      const a = censor.signature.find(a => a.name === 'Halt Miscreant!')!;
      expect(a.keywords).toEqual(['Melee', 'Strike', 'Weapon']);
      expect(a.powerRoll?.characteristic).toBe('might');
    });

    it('Repent! has Magic, Ranged, Strike and uses Presence', () => {
      const a = censor.threeCost.find(a => a.name === 'Repent!')!;
      expect(a.keywords).toEqual(['Magic', 'Ranged', 'Strike']);
      expect(a.powerRoll?.characteristic).toBe('presence');
    });

    it('all seven-cost abilities are maneuvers with Area, Magic keywords', () => {
      for (const a of censor.sevenCost) {
        expect(a.actionType, `${a.name} should be maneuver`).toBe('maneuver');
        expect(a.keywords, `${a.name} should have Area, Magic`).toContain('Area');
        expect(a.keywords, `${a.name} should have Area, Magic`).toContain('Magic');
      }
    });

    it('Your Allies Turn on You! uses Presence', () => {
      const a = censor.elevenCost.find(a => a.name === 'Your Allies Turn on You!')!;
      expect(a.powerRoll?.characteristic).toBe('presence');
      expect(a.keywords).toContain('Ranged');
    });

    it('Hand of the Gods uses Might and is Ranged', () => {
      const a = censor.elevenCost.find(a => a.name === 'Hand of the Gods')!;
      expect(a.powerRoll?.characteristic).toBe('might');
      expect(a.keywords).toContain('Ranged');
      expect(a.keywords).toContain('Strike');
      expect(a.keywords).toContain('Weapon');
    });

    it('Gods Grant Thee Strength has no powerRoll', () => {
      const a = censor.nineCost.find(a => a.name === 'Gods Grant Thee Strength')!;
      expect(a.powerRoll).toBeUndefined();
      expect(a.keywords).toContain('Ranged');
    });

    it('Orison of Victory is a maneuver with Area', () => {
      const a = censor.nineCost.find(a => a.name === 'Orison of Victory')!;
      expect(a.actionType).toBe('maneuver');
      expect(a.keywords).toContain('Area');
      expect(a.powerRoll?.characteristic).toBe('presence');
    });
  });

  it('has no duplicate IDs', () => {
    expectNoDuplicateIds(censor);
  });
});

// =============================================================================
// CONDUIT
// =============================================================================

describe('Conduit abilities audit', () => {
  const conduit = getConduitAbilities();

  describe('tier counts', () => {
    it('has 10 signature abilities (8 standard + Ray of Wrath + Healing Grace)', () => {
      // Blessed Light, Drain, Holy Lash, Lightfall, Sacrificial Offer,
      // Staggering Curse, Warrior's Prayer, Wither + Ray of Wrath, Healing Grace
      expect(conduit.signature).toHaveLength(10);
    });

    it('has 4 three-cost abilities', () => {
      // Call the Thunder Down, Font of Wrath, Judgment's Hammer, Violence Will Not Aid Thee
      expect(conduit.threeCost).toHaveLength(4);
    });

    it('has 4 five-cost abilities', () => {
      // Corruption's Curse, Curse of Terror, Faith Is Our Armor, Sermon of Grace
      expect(conduit.fiveCost).toHaveLength(4);
    });

    it('has 4 seven-cost abilities', () => {
      // Fear of the Gods, Saint's Raiment, Soul Siphon, Words of Wrath and Grace
      expect(conduit.sevenCost).toHaveLength(4);
    });

    it('has 4 nine-cost abilities', () => {
      // Beacon of Grace, Penance, Sanctuary, Vessel of Retribution
      expect(conduit.nineCost).toHaveLength(4);
    });

    it('has 4 eleven-cost abilities', () => {
      // Arise!, Blessing of Steel, Blessing of the Blade, Drag the Unworthy
      expect(conduit.elevenCost).toHaveLength(4);
    });

    it('has 2 triggered actions', () => {
      // Word of Guidance, Word of Judgment
      expect(conduit.triggeredActions).toHaveLength(2);
    });
  });

  describe('ability names', () => {
    it('has correct signature ability names', () => {
      const names = conduit.signature.map(a => a.name);
      expect(names).toContain('Blessed Light');
      expect(names).toContain('Drain');
      expect(names).toContain('Holy Lash');
      expect(names).toContain('Lightfall');
      expect(names).toContain('Sacrificial Offer');
      expect(names).toContain('Staggering Curse');
      expect(names).toContain("Warrior's Prayer");
      expect(names).toContain('Wither');
      expect(names).toContain('Ray of Wrath');
      expect(names).toContain('Healing Grace');
    });

    it('has correct 3-cost ability names', () => {
      const names = conduit.threeCost.map(a => a.name);
      expect(names).toContain('Call the Thunder Down');
      expect(names).toContain('Font of Wrath');
      expect(names).toContain("Judgment's Hammer");
      expect(names).toContain('Violence Will Not Aid Thee');
    });

    it('has correct 5-cost ability names', () => {
      const names = conduit.fiveCost.map(a => a.name);
      expect(names).toContain("Corruption's Curse");
      expect(names).toContain('Curse of Terror');
      expect(names).toContain('Faith Is Our Armor');
      expect(names).toContain('Sermon of Grace');
    });

    it('has correct 7-cost ability names', () => {
      const names = conduit.sevenCost.map(a => a.name);
      expect(names).toContain('Fear of the Gods');
      expect(names).toContain("Saint's Raiment");
      expect(names).toContain('Soul Siphon');
      expect(names).toContain('Words of Wrath and Grace');
    });

    it('has correct 9-cost ability names', () => {
      const names = conduit.nineCost.map(a => a.name);
      expect(names).toContain('Beacon of Grace');
      expect(names).toContain('Penance');
      expect(names).toContain('Sanctuary');
      expect(names).toContain('Vessel of Retribution');
    });

    it('has correct 11-cost ability names', () => {
      const names = conduit.elevenCost.map(a => a.name);
      expect(names).toContain('Arise!');
      expect(names).toContain('Blessing of Steel');
      expect(names).toContain('Blessing of the Blade');
      expect(names).toContain('Drag the Unworthy');
    });

    it('has correct triggered action names', () => {
      const names = conduit.triggeredActions.map(a => a.name);
      expect(names).toContain('Word of Guidance');
      expect(names).toContain('Word of Judgment');
    });
  });

  describe('ability details', () => {
    it('all standard signature abilities use Intuition for power rolls', () => {
      // Ray of Wrath and Healing Grace also use intuition or have no power roll
      const withPowerRoll = conduit.signature.filter(a => a.powerRoll);
      for (const a of withPowerRoll) {
        expect(a.powerRoll?.characteristic, `${a.name} should use intuition`).toBe('intuition');
      }
    });

    it('Healing Grace is a maneuver', () => {
      const hg = conduit.signature.find(a => a.name === 'Healing Grace')!;
      expect(hg.actionType).toBe('maneuver');
      expect(hg.keywords).toContain('Magic');
      expect(hg.keywords).toContain('Ranged');
    });

    it('Ray of Wrath is a ranged strike', () => {
      const row = conduit.signature.find(a => a.name === 'Ray of Wrath')!;
      expect(row.keywords).toContain('Magic');
      expect(row.keywords).toContain('Ranged');
      expect(row.keywords).toContain('Strike');
      expect(row.powerRoll?.characteristic).toBe('intuition');
    });

    it('Faith Is Our Armor is a maneuver', () => {
      const a = conduit.fiveCost.find(a => a.name === 'Faith Is Our Armor')!;
      expect(a.actionType).toBe('maneuver');
      expect(a.powerRoll?.characteristic).toBe('intuition');
    });

    it("Saint's Raiment is a maneuver", () => {
      const a = conduit.sevenCost.find(a => a.name === "Saint's Raiment")!;
      expect(a.actionType).toBe('maneuver');
    });

    it('Sanctuary is a maneuver', () => {
      const a = conduit.nineCost.find(a => a.name === 'Sanctuary')!;
      expect(a.actionType).toBe('maneuver');
    });

    it('Arise! has Magic, Ranged keywords', () => {
      const a = conduit.elevenCost.find(a => a.name === 'Arise!')!;
      expect(a.keywords).toContain('Magic');
      expect(a.keywords).toContain('Ranged');
    });

    it('triggered actions use Magic, Ranged keywords', () => {
      for (const a of conduit.triggeredActions) {
        expect(a.keywords, `${a.name}`).toContain('Magic');
        expect(a.keywords, `${a.name}`).toContain('Ranged');
        expect(a.actionType).toBe('triggered');
      }
    });
  });

  it('has no duplicate IDs', () => {
    expectNoDuplicateIds(conduit);
  });
});

// =============================================================================
// ELEMENTALIST
// =============================================================================

describe('Elementalist abilities audit', () => {
  const base = getElementalistAbilities();
  const earth = getElementalistAbilities('earth');
  const fire = getElementalistAbilities('fire');
  const green = getElementalistAbilities('green');
  const voidSpec = getElementalistAbilities('void');

  describe('tier counts', () => {
    it('has 8 signature abilities', () => {
      // Afflict a Bountiful Decay, Bifurcated Incineration, Grasp of Beyond,
      // The Green Within the Green Without, Meteoric Introduction,
      // Ray of Agonizing Self-Reflection, Unquiet Ground, Viscous Fire
      expect(base.signature).toHaveLength(8);
    });

    it('has 4 three-cost abilities', () => {
      // Behold the Mystery, The Flesh a Crucible, Invigorating Growth, Ripples in the Earth
      expect(base.threeCost).toHaveLength(4);
    });

    it('has 4 five-cost abilities', () => {
      // Conflagration, Instantaneous Excavation, No More Than a Breeze, Test of Rain
      expect(base.fiveCost).toHaveLength(4);
    });

    it('has 4 seven-cost abilities', () => {
      // Erase, Maw of Earth, Swarm of Spirits, Wall of Fire
      expect(base.sevenCost).toHaveLength(4);
    });

    it('has 4 nine-cost abilities', () => {
      // Combustion Deferred, Storm of Sands, Subverted Perception of Space,
      // Web of All That's Come Before
      expect(base.nineCost).toHaveLength(4);
    });

    it('has 4 eleven-cost abilities', () => {
      // Heart of the Wode, Muse of Fire, Return to Oblivion, World Torn Asunder
      expect(base.elevenCost).toHaveLength(4);
    });

    it('has no triggered actions without specialization', () => {
      expect(base.triggeredActions).toHaveLength(0);
    });
  });

  describe('ability names', () => {
    it('has correct signature ability names', () => {
      const names = base.signature.map(a => a.name);
      expect(names).toContain('Afflict a Bountiful Decay');
      expect(names).toContain('Bifurcated Incineration');
      expect(names).toContain('Grasp of Beyond');
      expect(names).toContain('The Green Within, the Green Without');
      expect(names).toContain('Meteoric Introduction');
      expect(names).toContain('Ray of Agonizing Self-Reflection');
      expect(names).toContain('Unquiet Ground');
      expect(names).toContain('Viscous Fire');
    });

    it('has correct 3-cost ability names', () => {
      const names = base.threeCost.map(a => a.name);
      expect(names).toContain('Behold the Mystery');
      expect(names).toContain('The Flesh, a Crucible');
      expect(names).toContain('Invigorating Growth');
      expect(names).toContain('Ripples in the Earth');
    });

    it('has correct 5-cost ability names', () => {
      const names = base.fiveCost.map(a => a.name);
      expect(names).toContain('Conflagration');
      expect(names).toContain('Instantaneous Excavation');
      expect(names).toContain('No More Than a Breeze');
      expect(names).toContain('Test of Rain');
    });

    it('has correct 7-cost ability names', () => {
      const names = base.sevenCost.map(a => a.name);
      expect(names).toContain('Erase');
      expect(names).toContain('Maw of Earth');
      expect(names).toContain('Swarm of Spirits');
      expect(names).toContain('Wall of Fire');
    });

    it('has correct 9-cost ability names', () => {
      const names = base.nineCost.map(a => a.name);
      expect(names).toContain('Combustion Deferred');
      expect(names).toContain('Storm of Sands');
      expect(names).toContain('Subverted Perception of Space');
      expect(names).toContain("Web of All That's Come Before");
    });

    it('has correct 11-cost ability names', () => {
      const names = base.elevenCost.map(a => a.name);
      expect(names).toContain('Heart of the Wode');
      expect(names).toContain('Muse of Fire');
      expect(names).toContain('Return to Oblivion');
      expect(names).toContain('World Torn Asunder');
    });
  });

  describe('ability details', () => {
    it('all power rolls use Reason', () => {
      const all = [
        ...base.signature, ...base.threeCost, ...base.fiveCost,
        ...base.sevenCost, ...base.nineCost, ...base.elevenCost,
      ];
      for (const a of all) {
        if (a.powerRoll) {
          expect(a.powerRoll.characteristic, `${a.name} should use reason`).toBe('reason');
        }
      }
    });

    it('each signature has correct elemental keyword', () => {
      const aff = base.signature.find(a => a.name === 'Afflict a Bountiful Decay')!;
      expect(aff.keywords).toContain('Green');
      expect(aff.keywords).toContain('Rot');

      const bif = base.signature.find(a => a.name === 'Bifurcated Incineration')!;
      expect(bif.keywords).toContain('Fire');

      const grasp = base.signature.find(a => a.name === 'Grasp of Beyond')!;
      expect(grasp.keywords).toContain('Void');

      const meteor = base.signature.find(a => a.name === 'Meteoric Introduction')!;
      expect(meteor.keywords).toContain('Earth');

      const ray = base.signature.find(a => a.name === 'Ray of Agonizing Self-Reflection')!;
      expect(ray.keywords).toContain('Void');

      const unquiet = base.signature.find(a => a.name === 'Unquiet Ground')!;
      expect(unquiet.keywords).toContain('Earth');

      const viscous = base.signature.find(a => a.name === 'Viscous Fire')!;
      expect(viscous.keywords).toContain('Fire');
    });

    it('Instantaneous Excavation is a maneuver', () => {
      const a = base.fiveCost.find(a => a.name === 'Instantaneous Excavation')!;
      expect(a.actionType).toBe('maneuver');
    });

    it('No More Than a Breeze is a maneuver with Void keyword', () => {
      const a = base.fiveCost.find(a => a.name === 'No More Than a Breeze')!;
      expect(a.actionType).toBe('maneuver');
      expect(a.keywords).toContain('Void');
    });

    it('Wall of Fire is a maneuver', () => {
      const a = base.sevenCost.find(a => a.name === 'Wall of Fire')!;
      expect(a.actionType).toBe('maneuver');
      expect(a.keywords).toContain('Fire');
    });
  });

  describe('specialization triggered actions', () => {
    it('earth gives Skin Like Castle Walls', () => {
      expect(earth.triggeredActions).toHaveLength(1);
      expect(earth.triggeredActions[0].name).toBe('Skin Like Castle Walls');
      expect(earth.triggeredActions[0].keywords).toContain('Earth');
    });

    it('fire gives Explosive Assistance', () => {
      expect(fire.triggeredActions).toHaveLength(1);
      expect(fire.triggeredActions[0].name).toBe('Explosive Assistance');
      expect(fire.triggeredActions[0].keywords).toContain('Fire');
    });

    it('green gives Breath of Dawn Remembered', () => {
      expect(green.triggeredActions).toHaveLength(1);
      expect(green.triggeredActions[0].name).toBe('Breath of Dawn Remembered');
      expect(green.triggeredActions[0].keywords).toContain('Green');
    });

    it('void gives Subtle Relocation', () => {
      expect(voidSpec.triggeredActions).toHaveLength(1);
      expect(voidSpec.triggeredActions[0].name).toBe('Subtle Relocation');
      expect(voidSpec.triggeredActions[0].keywords).toContain('Void');
    });

    it('all specialization triggered actions are triggered type', () => {
      for (const spec of [earth, fire, green, voidSpec]) {
        for (const a of spec.triggeredActions) {
          expect(a.actionType).toBe('triggered');
        }
      }
    });
  });

  it('has no duplicate IDs (base)', () => {
    expectNoDuplicateIds(base);
  });

  it('has no duplicate IDs (with specialization)', () => {
    expectNoDuplicateIds(earth);
    expectNoDuplicateIds(fire);
    expectNoDuplicateIds(green);
    expectNoDuplicateIds(voidSpec);
  });
});

// =============================================================================
// NULL
// =============================================================================

describe('Null abilities audit', () => {
  const nullClass = getNullAbilities();

  describe('tier counts', () => {
    it('has 8 signature abilities', () => {
      // Dance of Blows, Faster Than the Eye, Inertial Step, Joint Lock,
      // Kinetic Strike, Magnetic Strike, Phase Inversion Strike, Pressure Points
      expect(nullClass.signature).toHaveLength(8);
    });

    it('has 4 three-cost abilities', () => {
      // Chronal Spike, Psychic Pulse, Relentless Nemesis, Stunning Blow
      expect(nullClass.threeCost).toHaveLength(4);
    });

    it('has 4 five-cost abilities', () => {
      // Arcane Disruptor, Impart Force, Phase Strike, A Squad Unto Myself
      expect(nullClass.fiveCost).toHaveLength(4);
    });

    it('has 4 seven-cost abilities', () => {
      // Absorption Field, Molecular Rearrangement Field, Stabilizing Field, Synapse Field
      expect(nullClass.sevenCost).toHaveLength(4);
    });

    it('has 4 nine-cost abilities', () => {
      // Anticipating Strike, Iron Grip, Phase Leap, Synaptic Reset
      expect(nullClass.nineCost).toHaveLength(4);
    });

    it('has 4 eleven-cost abilities', () => {
      // Arcane Purge, Phase Hurl, Scalar Assault, Synaptic Anchor
      expect(nullClass.elevenCost).toHaveLength(4);
    });

    it('has no triggered actions', () => {
      expect(nullClass.triggeredActions).toHaveLength(0);
    });
  });

  describe('ability names', () => {
    it('has correct signature ability names', () => {
      const names = nullClass.signature.map(a => a.name);
      expect(names).toContain('Dance of Blows');
      expect(names).toContain('Faster Than the Eye');
      expect(names).toContain('Inertial Step');
      expect(names).toContain('Joint Lock');
      expect(names).toContain('Kinetic Strike');
      expect(names).toContain('Magnetic Strike');
      expect(names).toContain('Phase Inversion Strike');
      expect(names).toContain('Pressure Points');
    });

    it('has correct 3-cost ability names', () => {
      const names = nullClass.threeCost.map(a => a.name);
      expect(names).toContain('Chronal Spike');
      expect(names).toContain('Psychic Pulse');
      expect(names).toContain('Relentless Nemesis');
      expect(names).toContain('Stunning Blow');
    });

    it('has correct 5-cost ability names', () => {
      const names = nullClass.fiveCost.map(a => a.name);
      expect(names).toContain('Arcane Disruptor');
      expect(names).toContain('Impart Force');
      expect(names).toContain('Phase Strike');
      expect(names).toContain('A Squad Unto Myself');
    });

    it('has correct 7-cost ability names', () => {
      const names = nullClass.sevenCost.map(a => a.name);
      expect(names).toContain('Absorption Field');
      expect(names).toContain('Molecular Rearrangement Field');
      expect(names).toContain('Stabilizing Field');
      expect(names).toContain('Synapse Field');
    });

    it('has correct 9-cost ability names', () => {
      const names = nullClass.nineCost.map(a => a.name);
      expect(names).toContain('Anticipating Strike');
      expect(names).toContain('Iron Grip');
      expect(names).toContain('Phase Leap');
      expect(names).toContain('Synaptic Reset');
    });

    it('has correct 11-cost ability names', () => {
      const names = nullClass.elevenCost.map(a => a.name);
      expect(names).toContain('Arcane Purge');
      expect(names).toContain('Phase Hurl');
      expect(names).toContain('Scalar Assault');
      expect(names).toContain('Synaptic Anchor');
    });
  });

  describe('ability details', () => {
    it('most abilities use Psionic keyword', () => {
      const all = [
        ...nullClass.signature, ...nullClass.threeCost, ...nullClass.fiveCost,
        ...nullClass.sevenCost, ...nullClass.nineCost, ...nullClass.elevenCost,
      ];
      for (const a of all) {
        expect(a.keywords, `${a.name} should have Psionic`).toContain('Psionic');
      }
    });

    it('signature abilities mostly use Agility for power rolls', () => {
      for (const a of nullClass.signature) {
        if (a.powerRoll) {
          expect(a.powerRoll.characteristic, `${a.name} should use agility`).toBe('agility');
        }
      }
    });

    it('Dance of Blows has Area keyword', () => {
      const a = nullClass.signature.find(a => a.name === 'Dance of Blows')!;
      expect(a.keywords).toContain('Area');
      expect(a.keywords).toContain('Psionic');
      expect(a.keywords).toContain('Weapon');
    });

    it('Psychic Pulse is a maneuver', () => {
      const a = nullClass.threeCost.find(a => a.name === 'Psychic Pulse')!;
      expect(a.actionType).toBe('maneuver');
      expect(a.powerRoll).toBeUndefined();
    });

    it('Impart Force uses Intuition for power roll', () => {
      const a = nullClass.fiveCost.find(a => a.name === 'Impart Force')!;
      expect(a.powerRoll?.characteristic).toBe('intuition');
      expect(a.actionType).toBe('maneuver');
    });

    it('all seven-cost abilities are maneuvers', () => {
      for (const a of nullClass.sevenCost) {
        expect(a.actionType, `${a.name} should be maneuver`).toBe('maneuver');
      }
    });

    it('Anticipating Strike is a free triggered action', () => {
      const a = nullClass.nineCost.find(a => a.name === 'Anticipating Strike')!;
      expect(a.actionType).toBe('freeTriggered');
      expect(a.trigger).toBeTruthy();
    });

    it('Phase Leap is a move action', () => {
      const a = nullClass.nineCost.find(a => a.name === 'Phase Leap')!;
      expect(a.actionType).toBe('move');
    });

    it('Synaptic Anchor is a free triggered action', () => {
      const a = nullClass.elevenCost.find(a => a.name === 'Synaptic Anchor')!;
      expect(a.actionType).toBe('freeTriggered');
      expect(a.trigger).toBeTruthy();
    });
  });

  it('has no duplicate IDs', () => {
    expectNoDuplicateIds(nullClass);
  });
});

// =============================================================================
// SHADOW
// =============================================================================

describe('Shadow abilities audit', () => {
  const shadow = getShadowAbilities();

  describe('tier counts', () => {
    it('has 4 signature abilities', () => {
      // Gasping in Pain, I Work Better Alone, Teamwork Has Its Place,
      // You Were Watching the Wrong One
      expect(shadow.signature).toHaveLength(4);
    });

    it('has 4 three-cost abilities', () => {
      // Disorienting Strike, Eviscerate, Get In Get Out, Two Throats at Once
      expect(shadow.threeCost).toHaveLength(4);
    });

    it('has 4 five-cost abilities', () => {
      // Coup de Grace, One Hundred Throats, Setup, Shadowstrike
      expect(shadow.fiveCost).toHaveLength(4);
    });

    it('has 4 seven-cost abilities', () => {
      // Dancer, Misdirecting Strike, Pinning Shot, Staggering Blow
      expect(shadow.sevenCost).toHaveLength(4);
    });

    it('has 4 nine-cost abilities', () => {
      // Blackout, Into the Shadows, Shadowfall, You Talk Too Much
      expect(shadow.nineCost).toHaveLength(4);
    });

    it('has 4 eleven-cost abilities', () => {
      // Assassinate, Shadowgrasp, Speed of Shadows, They Always Line Up
      expect(shadow.elevenCost).toHaveLength(4);
    });

    it('has no triggered actions', () => {
      expect(shadow.triggeredActions).toHaveLength(0);
    });
  });

  describe('ability names', () => {
    it('has correct signature ability names', () => {
      const names = shadow.signature.map(a => a.name);
      expect(names).toContain('Gasping in Pain');
      expect(names).toContain('I Work Better Alone');
      expect(names).toContain('Teamwork Has Its Place');
      expect(names).toContain('You Were Watching the Wrong One');
    });

    it('has correct 3-cost ability names', () => {
      const names = shadow.threeCost.map(a => a.name);
      expect(names).toContain('Disorienting Strike');
      expect(names).toContain('Eviscerate');
      expect(names).toContain('Get In Get Out');
      expect(names).toContain('Two Throats at Once');
    });

    it('has correct 5-cost ability names', () => {
      const names = shadow.fiveCost.map(a => a.name);
      expect(names).toContain('Coup de Grace');
      expect(names).toContain('One Hundred Throats');
      expect(names).toContain('Setup');
      expect(names).toContain('Shadowstrike');
    });

    it('has correct 7-cost ability names', () => {
      const names = shadow.sevenCost.map(a => a.name);
      expect(names).toContain('Dancer');
      expect(names).toContain('Misdirecting Strike');
      expect(names).toContain('Pinning Shot');
      expect(names).toContain('Staggering Blow');
    });

    it('has correct 9-cost ability names', () => {
      const names = shadow.nineCost.map(a => a.name);
      expect(names).toContain('Blackout');
      expect(names).toContain('Into the Shadows');
      expect(names).toContain('Shadowfall');
      expect(names).toContain('You Talk Too Much');
    });

    it('has correct 11-cost ability names', () => {
      const names = shadow.elevenCost.map(a => a.name);
      expect(names).toContain('Assassinate');
      expect(names).toContain('Shadowgrasp');
      expect(names).toContain('Speed of Shadows');
      expect(names).toContain('They Always Line Up');
    });
  });

  describe('ability details', () => {
    it('signature abilities use Agility for power rolls', () => {
      for (const a of shadow.signature) {
        if (a.powerRoll) {
          expect(a.powerRoll.characteristic, `${a.name} should use agility`).toBe('agility');
        }
      }
    });

    it('I Work Better Alone has Melee, Ranged, Strike, Weapon keywords', () => {
      const a = shadow.signature.find(a => a.name === 'I Work Better Alone')!;
      expect(a.keywords).toContain('Melee');
      expect(a.keywords).toContain('Ranged');
      expect(a.keywords).toContain('Strike');
      expect(a.keywords).toContain('Weapon');
    });

    it('Eviscerate has Melee, Ranged, Strike, Weapon', () => {
      const a = shadow.threeCost.find(a => a.name === 'Eviscerate')!;
      expect(a.keywords).toContain('Melee');
      expect(a.keywords).toContain('Ranged');
      expect(a.keywords).toContain('Strike');
      expect(a.keywords).toContain('Weapon');
    });

    it('Dancer is a maneuver with no keywords', () => {
      const a = shadow.sevenCost.find(a => a.name === 'Dancer')!;
      expect(a.actionType).toBe('maneuver');
      expect(a.keywords).toEqual([]);
    });

    it('Shadowstrike has Magic, Melee, Ranged keywords', () => {
      const a = shadow.fiveCost.find(a => a.name === 'Shadowstrike')!;
      expect(a.keywords).toContain('Magic');
      expect(a.keywords).toContain('Melee');
      expect(a.keywords).toContain('Ranged');
    });

    it('Blackout is a maneuver with Area, Magic', () => {
      const a = shadow.nineCost.find(a => a.name === 'Blackout')!;
      expect(a.actionType).toBe('maneuver');
      expect(a.keywords).toContain('Area');
      expect(a.keywords).toContain('Magic');
    });

    it('Into the Shadows has Magic, Melee, Strike, Weapon', () => {
      const a = shadow.nineCost.find(a => a.name === 'Into the Shadows')!;
      expect(a.keywords).toContain('Magic');
      expect(a.keywords).toContain('Melee');
      expect(a.keywords).toContain('Strike');
      expect(a.keywords).toContain('Weapon');
    });

    it('Setup has Ranged, Strike, Weapon keywords', () => {
      const a = shadow.fiveCost.find(a => a.name === 'Setup')!;
      expect(a.keywords).toContain('Ranged');
      expect(a.keywords).toContain('Strike');
      expect(a.keywords).toContain('Weapon');
    });

    it('Speed of Shadows has Magic keyword', () => {
      const a = shadow.elevenCost.find(a => a.name === 'Speed of Shadows')!;
      expect(a.keywords).toContain('Magic');
      expect(a.powerRoll).toBeUndefined();
    });

    it('They Always Line Up has Area, Ranged, Weapon keywords', () => {
      const a = shadow.elevenCost.find(a => a.name === 'They Always Line Up')!;
      expect(a.keywords).toContain('Area');
      expect(a.keywords).toContain('Ranged');
      expect(a.keywords).toContain('Weapon');
    });

    it('Pinning Shot has Ranged, Strike, Weapon keywords', () => {
      const a = shadow.sevenCost.find(a => a.name === 'Pinning Shot')!;
      expect(a.keywords).toContain('Ranged');
      expect(a.keywords).toContain('Strike');
      expect(a.keywords).toContain('Weapon');
    });
  });

  it('has no duplicate IDs', () => {
    expectNoDuplicateIds(shadow);
  });
});

// =============================================================================
// CROSS-CLASS VALIDATION
// =============================================================================

describe('Cross-class validation', () => {
  it('no duplicate IDs across classes', () => {
    const furyIds = allIds(getFuryAbilities('berserker'));
    const censorIds = allIds(getCensorAbilities());
    const conduitIds = allIds(getConduitAbilities());
    const elementalistIds = allIds(getElementalistAbilities('earth'));
    const nullIds = allIds(getNullAbilities());
    const shadowIds = allIds(getShadowAbilities());

    const allClassIds = [
      ...furyIds, ...censorIds, ...conduitIds,
      ...elementalistIds, ...nullIds, ...shadowIds,
    ];

    const seen = new Set<string>();
    const dupes: string[] = [];
    for (const id of allClassIds) {
      if (seen.has(id)) dupes.push(id);
      seen.add(id);
    }
    expect(dupes, `Cross-class duplicate IDs: ${dupes.join(', ')}`).toEqual([]);
  });

  it('every ability has a non-empty name', () => {
    const classes = [
      getFuryAbilities('berserker'),
      getCensorAbilities(),
      getConduitAbilities(),
      getElementalistAbilities(),
      getNullAbilities(),
      getShadowAbilities(),
    ];
    for (const tiers of classes) {
      const all = [
        ...tiers.signature, ...tiers.threeCost, ...tiers.fiveCost,
        ...tiers.sevenCost, ...tiers.nineCost, ...tiers.elevenCost,
        ...tiers.triggeredActions, ...tiers.other,
      ];
      for (const a of all) {
        expect(a.name.length, `ability ${a.id} has empty name`).toBeGreaterThan(0);
      }
    }
  });

  it('every ability has a non-empty id', () => {
    const classes = [
      getFuryAbilities('berserker'),
      getCensorAbilities(),
      getConduitAbilities(),
      getElementalistAbilities(),
      getNullAbilities(),
      getShadowAbilities(),
    ];
    for (const tiers of classes) {
      const all = [
        ...tiers.signature, ...tiers.threeCost, ...tiers.fiveCost,
        ...tiers.sevenCost, ...tiers.nineCost, ...tiers.elevenCost,
        ...tiers.triggeredActions, ...tiers.other,
      ];
      for (const a of all) {
        expect(a.id.length, `ability with name "${a.name}" has empty id`).toBeGreaterThan(0);
      }
    }
  });

  it('every heroic ability has the correct essenceCost', () => {
    const classes = [
      getFuryAbilities(),
      getCensorAbilities(),
      getConduitAbilities(),
      getElementalistAbilities(),
      getNullAbilities(),
      getShadowAbilities(),
    ];
    for (const tiers of classes) {
      for (const a of tiers.threeCost) {
        expect(a.essenceCost, `${a.name} should cost 3`).toBe(3);
      }
      for (const a of tiers.fiveCost) {
        expect(a.essenceCost, `${a.name} should cost 5`).toBe(5);
      }
      for (const a of tiers.sevenCost) {
        expect(a.essenceCost, `${a.name} should cost 7`).toBe(7);
      }
      for (const a of tiers.nineCost) {
        expect(a.essenceCost, `${a.name} should cost 9`).toBe(9);
      }
      for (const a of tiers.elevenCost) {
        expect(a.essenceCost, `${a.name} should cost 11`).toBe(11);
      }
    }
  });

  it('signature abilities have no essenceCost', () => {
    const classes = [
      getFuryAbilities(),
      getCensorAbilities(),
      getConduitAbilities(),
      getElementalistAbilities(),
      getNullAbilities(),
      getShadowAbilities(),
    ];
    for (const tiers of classes) {
      for (const a of tiers.signature) {
        expect(a.essenceCost, `Signature ability ${a.name} should have no cost`).toBeUndefined();
      }
    }
  });

  it('every ability has a keywords array', () => {
    const classes = [
      getFuryAbilities('berserker'),
      getCensorAbilities(),
      getConduitAbilities(),
      getElementalistAbilities('earth'),
      getNullAbilities(),
      getShadowAbilities(),
    ];
    for (const tiers of classes) {
      const all = [
        ...tiers.signature, ...tiers.threeCost, ...tiers.fiveCost,
        ...tiers.sevenCost, ...tiers.nineCost, ...tiers.elevenCost,
        ...tiers.triggeredActions, ...tiers.other,
      ];
      for (const a of all) {
        expect(Array.isArray(a.keywords), `${a.name} keywords should be array`).toBe(true);
      }
    }
  });
});
