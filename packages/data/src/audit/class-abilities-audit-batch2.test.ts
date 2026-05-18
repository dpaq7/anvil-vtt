/**
 * Class Abilities Audit — Batch 2
 *
 * Validates ability data for: Tactician, Talent, Troubadour, Beastheart, Summoner
 * against their source TypeScript data files.
 *
 * Sources:
 *   packages/data/src/rules/classes/tactician/abilities.ts
 *   packages/data/src/rules/classes/talent/abilities.ts
 *   packages/data/src/rules/classes/troubadour/abilities.ts
 *   packages/data/src/rules/classes/beastheart/abilities.ts
 *   packages/data/src/rules/classes/summoner/abilities.ts
 */
import { describe, it, expect } from 'vitest';
import {
  getTacticianAbilities,
  getTalentAbilities,
  getTroubadourAbilities,
  getBeastheartAbilities,
  getSummonerAbilities,
  type AbilitiesByTier,
} from '../rules/classes/class-abilities.js';

// ============================================================================
// Helper: collect all IDs from an AbilitiesByTier for duplicate checking
// ============================================================================
function collectAllIds(tiers: AbilitiesByTier): string[] {
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

// ============================================================================
// TACTICIAN
// ============================================================================
describe('Tactician Abilities Audit', () => {
  const base = getTacticianAbilities();

  describe('Ability counts per tier (no doctrine)', () => {
    it('has 2 signature abilities', () => {
      expect(base.signature).toHaveLength(2);
    });
    it('has 4 three-cost abilities', () => {
      expect(base.threeCost).toHaveLength(4);
    });
    it('has 4 five-cost abilities', () => {
      expect(base.fiveCost).toHaveLength(4);
    });
    it('has 4 seven-cost abilities', () => {
      expect(base.sevenCost).toHaveLength(4);
    });
    it('has 4 nine-cost abilities', () => {
      expect(base.nineCost).toHaveLength(4);
    });
    it('has 4 eleven-cost abilities', () => {
      expect(base.elevenCost).toHaveLength(4);
    });
    it('has 0 triggered actions without doctrine', () => {
      expect(base.triggeredActions).toHaveLength(0);
    });
    it('has empty other array', () => {
      expect(base.other).toHaveLength(0);
    });
  });

  describe('Signature ability names', () => {
    const names = base.signature.map(a => a.name);
    it('includes Mark', () => expect(names).toContain('Mark'));
    it('includes Strike Now!', () => expect(names).toContain('Strike Now!'));
  });

  describe('3-Focus ability names', () => {
    const names = base.threeCost.map(a => a.name);
    it.each([
      'Battle Cry',
      'Concussive Strike',
      'Inspiring Strike',
      'Squad! Forward!',
    ])('includes %s', (name) => {
      expect(names).toContain(name);
    });
  });

  describe('5-Focus ability names', () => {
    const names = base.fiveCost.map(a => a.name);
    it.each([
      'Hammer and Anvil',
      'Mind Game',
      'Now!',
      'This Is What We Planned For',
    ])('includes %s', (name) => {
      expect(names).toContain(name);
    });
  });

  describe('7-Focus ability names', () => {
    const names = base.sevenCost.map(a => a.name);
    it.each([
      'Frontal Assault',
      "Hit 'Em Hard!",
      'Rout',
      'Stay Strong and Focus!',
    ])('includes %s', (name) => {
      expect(names).toContain(name);
    });
  });

  describe('9-Focus ability names', () => {
    const names = base.nineCost.map(a => a.name);
    it.each([
      'Squad! Gear Check!',
      'Squad! Remember Your Training!',
      'Win This Day!',
      "You've Still Got Something Left",
    ])('includes %s', (name) => {
      expect(names).toContain(name);
    });
  });

  describe('11-Focus ability names', () => {
    const names = base.elevenCost.map(a => a.name);
    it.each([
      'Go Now and Speed Well',
      'Finish Them!',
      'Floodgates Open',
      "I'll Open and You'll Close",
    ])('includes %s', (name) => {
      expect(names).toContain(name);
    });
  });

  describe('Cost tier correctness', () => {
    it('signature abilities have no essenceCost', () => {
      base.signature.forEach(a => {
        expect(a.essenceCost).toBeUndefined();
      });
    });
    it('3-cost abilities have essenceCost 3', () => {
      base.threeCost.forEach(a => {
        expect(a.essenceCost).toBe(3);
      });
    });
    it('5-cost abilities have essenceCost 5', () => {
      base.fiveCost.forEach(a => {
        expect(a.essenceCost).toBe(5);
      });
    });
    it('7-cost abilities have essenceCost 7', () => {
      base.sevenCost.forEach(a => {
        expect(a.essenceCost).toBe(7);
      });
    });
    it('9-cost abilities have essenceCost 9', () => {
      base.nineCost.forEach(a => {
        expect(a.essenceCost).toBe(9);
      });
    });
    it('11-cost abilities have essenceCost 11', () => {
      base.elevenCost.forEach(a => {
        expect(a.essenceCost).toBe(11);
      });
    });
  });

  describe('Action types', () => {
    it('Mark is a maneuver', () => {
      const mark = base.signature.find(a => a.id === 'mark');
      expect(mark?.actionType).toBe('maneuver');
    });
    it('Strike Now! is an action', () => {
      const strikeNow = base.signature.find(a => a.id === 'strike-now');
      expect(strikeNow?.actionType).toBe('action');
    });
    it('Finish Them! is a freeTriggered action', () => {
      const finishThem = base.elevenCost.find(a => a.id === 'finish-them');
      expect(finishThem?.actionType).toBe('freeTriggered');
    });
    it('7-Focus abilities are all maneuvers', () => {
      base.sevenCost.forEach(a => {
        expect(a.actionType).toBe('maneuver');
      });
    });
  });

  describe('Power roll characteristics', () => {
    it('Battle Cry uses reason', () => {
      const bc = base.threeCost.find(a => a.id === 'battle-cry');
      expect(bc?.powerRoll?.characteristic).toBe('reason');
    });
    it('Concussive Strike uses might', () => {
      const cs = base.threeCost.find(a => a.id === 'concussive-strike');
      expect(cs?.powerRoll?.characteristic).toBe('might');
    });
    it('Hammer and Anvil uses might', () => {
      const ha = base.fiveCost.find(a => a.id === 'hammer-and-anvil');
      expect(ha?.powerRoll?.characteristic).toBe('might');
    });
  });

  describe('Keywords', () => {
    it('Mark has Ranged keyword', () => {
      const mark = base.signature.find(a => a.id === 'mark');
      expect(mark?.keywords).toContain('Ranged');
    });
    it('Concussive Strike has Strike and Weapon keywords', () => {
      const cs = base.threeCost.find(a => a.id === 'concussive-strike');
      expect(cs?.keywords).toContain('Strike');
      expect(cs?.keywords).toContain('Weapon');
    });
    it('7-Focus abilities have empty keywords array', () => {
      base.sevenCost.forEach(a => {
        expect(a.keywords).toEqual([]);
      });
    });
  });

  describe('No duplicate IDs', () => {
    it('all ability IDs are unique', () => {
      const ids = collectAllIds(base);
      const unique = new Set(ids);
      expect(ids.length).toBe(unique.size);
    });
  });

  describe('Doctrine triggered actions', () => {
    it.each([
      ['insurgent', 'Advanced Tactics'],
      ['mastermind', 'Overwatch'],
      ['vanguard', 'Parry'],
    ] as const)('%s doctrine yields %s', (doctrine, expectedName) => {
      const withDoctrine = getTacticianAbilities(doctrine);
      expect(withDoctrine.triggeredActions).toHaveLength(1);
      expect(withDoctrine.triggeredActions[0].name).toBe(expectedName);
    });

    it('all doctrine triggered actions have actionType triggered', () => {
      for (const doctrine of ['insurgent', 'mastermind', 'vanguard']) {
        const withDoctrine = getTacticianAbilities(doctrine);
        withDoctrine.triggeredActions.forEach(a => {
          expect(a.actionType).toBe('triggered');
        });
      }
    });

    it('Parry has Melee and Weapon keywords', () => {
      const vanguard = getTacticianAbilities('vanguard');
      const parry = vanguard.triggeredActions[0];
      expect(parry.keywords).toContain('Melee');
      expect(parry.keywords).toContain('Weapon');
    });
  });
});

// ============================================================================
// TALENT
// ============================================================================
describe('Talent Abilities Audit', () => {
  const base = getTalentAbilities();

  describe('Ability counts per tier', () => {
    it('has 9 signature abilities', () => {
      expect(base.signature).toHaveLength(9);
    });
    it('has 4 three-cost abilities', () => {
      expect(base.threeCost).toHaveLength(4);
    });
    it('has 4 five-cost abilities', () => {
      expect(base.fiveCost).toHaveLength(4);
    });
    it('has 4 seven-cost abilities', () => {
      expect(base.sevenCost).toHaveLength(4);
    });
    it('has 4 nine-cost abilities', () => {
      expect(base.nineCost).toHaveLength(4);
    });
    it('has 4 eleven-cost abilities', () => {
      expect(base.elevenCost).toHaveLength(4);
    });
    it('has 0 triggered actions', () => {
      expect(base.triggeredActions).toHaveLength(0);
    });
    it('has 6 tradition features in other', () => {
      expect(base.other).toHaveLength(6);
    });
  });

  describe('Signature ability names', () => {
    const names = base.signature.map(a => a.name);
    it.each([
      'Mind Spike',
      'Entropic Bolt',
      'Hoarfrost',
      'Incinerate',
      'Kinetic Grip',
      'Kinetic Pulse',
      'Materialize',
      'Optic Blast',
      'Spirit Sword',
    ])('includes %s', (name) => {
      expect(names).toContain(name);
    });
  });

  describe('3-Clarity ability names', () => {
    const names = base.threeCost.map(a => a.name);
    it.each([
      'Awe',
      'Choke',
      'Precognition',
      'Smolder',
    ])('includes %s', (name) => {
      expect(names).toContain(name);
    });
  });

  describe('5-Clarity ability names', () => {
    const names = base.fiveCost.map(a => a.name);
    it.each([
      'Flashback',
      'Inertia Soak',
      'Iron',
      'Perfect Clarity',
    ])('includes %s', (name) => {
      expect(names).toContain(name);
    });
  });

  describe('7-Clarity ability names', () => {
    const names = base.sevenCost.map(a => a.name);
    it.each([
      'Fling Through Time',
      'Force Orbs',
      'Reflector Field',
      'Soul Burn',
    ])('includes %s', (name) => {
      expect(names).toContain(name);
    });
  });

  describe('9-Clarity ability names', () => {
    const names = base.nineCost.map(a => a.name);
    it.each([
      'Exothermic Shield',
      'Hypersonic',
      'Mind Snare',
      'Soulbound',
    ])('includes %s', (name) => {
      expect(names).toContain(name);
    });
  });

  describe('11-Clarity ability names', () => {
    const names = base.elevenCost.map(a => a.name);
    it.each([
      'Doubt',
      'Mindwipe',
      'Rejuvenate',
      'Steel',
    ])('includes %s', (name) => {
      expect(names).toContain(name);
    });
  });

  describe('Tradition features (other)', () => {
    const names = base.other.map(a => a.name);
    it.each([
      'Accelerate',
      'Again',
      'Feedback Loop',
      'Minor Telekinesis',
      'Remote Assistance',
      'Repel',
    ])('includes %s', (name) => {
      expect(names).toContain(name);
    });
  });

  describe('Cost tier correctness', () => {
    it('signature abilities have no essenceCost', () => {
      base.signature.forEach(a => {
        expect(a.essenceCost).toBeUndefined();
      });
    });
    it('tradition features have no essenceCost', () => {
      base.other.forEach(a => {
        expect(a.essenceCost).toBeUndefined();
      });
    });
    it('3-cost abilities have essenceCost 3', () => {
      base.threeCost.forEach(a => {
        expect(a.essenceCost).toBe(3);
      });
    });
    it('5-cost abilities have essenceCost 5', () => {
      base.fiveCost.forEach(a => {
        expect(a.essenceCost).toBe(5);
      });
    });
    it('7-cost abilities have essenceCost 7', () => {
      base.sevenCost.forEach(a => {
        expect(a.essenceCost).toBe(7);
      });
    });
    it('9-cost abilities have essenceCost 9', () => {
      base.nineCost.forEach(a => {
        expect(a.essenceCost).toBe(9);
      });
    });
    it('11-cost abilities have essenceCost 11', () => {
      base.elevenCost.forEach(a => {
        expect(a.essenceCost).toBe(11);
      });
    });
  });

  describe('All abilities are actions', () => {
    it('all signature abilities are action type', () => {
      base.signature.forEach(a => {
        expect(a.actionType).toBe('action');
      });
    });
  });

  describe('Power roll characteristics', () => {
    it('Mind Spike uses reason', () => {
      const ms = base.signature.find(a => a.id === 'mind-spike');
      expect(ms?.powerRoll?.characteristic).toBe('reason');
    });
    it('Entropic Bolt uses presence', () => {
      const eb = base.signature.find(a => a.id === 'entropic-bolt');
      expect(eb?.powerRoll?.characteristic).toBe('presence');
    });
    it('Spirit Sword uses presence', () => {
      const ss = base.signature.find(a => a.id === 'spirit-sword');
      expect(ss?.powerRoll?.characteristic).toBe('presence');
    });
    it('Hoarfrost uses reason', () => {
      const hf = base.signature.find(a => a.id === 'hoarfrost');
      expect(hf?.powerRoll?.characteristic).toBe('reason');
    });
    it('Awe uses presence', () => {
      const awe = base.threeCost.find(a => a.id === 'awe');
      expect(awe?.powerRoll?.characteristic).toBe('presence');
    });
    it('Choke uses reason', () => {
      const choke = base.threeCost.find(a => a.id === 'choke');
      expect(choke?.powerRoll?.characteristic).toBe('reason');
    });
    it('Fling Through Time uses presence', () => {
      const ftt = base.sevenCost.find(a => a.id === 'fling-through-time');
      expect(ftt?.powerRoll?.characteristic).toBe('presence');
    });
    it('Soul Burn uses presence', () => {
      const sb = base.sevenCost.find(a => a.id === 'soul-burn');
      expect(sb?.powerRoll?.characteristic).toBe('presence');
    });
    it('Soulbound uses presence', () => {
      const sb = base.nineCost.find(a => a.id === 'soulbound');
      expect(sb?.powerRoll?.characteristic).toBe('presence');
    });
    it('Doubt uses presence', () => {
      const doubt = base.elevenCost.find(a => a.id === 'doubt');
      expect(doubt?.powerRoll?.characteristic).toBe('presence');
    });
    it('Mindwipe uses reason', () => {
      const mw = base.elevenCost.find(a => a.id === 'mindwipe');
      expect(mw?.powerRoll?.characteristic).toBe('reason');
    });
  });

  describe('Keywords', () => {
    it('all signature abilities have Psionic keyword', () => {
      base.signature.forEach(a => {
        expect(a.keywords).toContain('Psionic');
      });
    });
    it('all tradition features have Psionic keyword', () => {
      base.other.forEach(a => {
        expect(a.keywords).toContain('Psionic');
      });
    });
    it('Incinerate has Fire keyword', () => {
      const inc = base.signature.find(a => a.id === 'incinerate');
      expect(inc?.keywords).toContain('Fire');
    });
    it('Spirit Sword has Animapathy keyword', () => {
      const ss = base.signature.find(a => a.id === 'spirit-sword');
      expect(ss?.keywords).toContain('Animapathy');
    });
    it('Entropic Bolt has Chronopathy keyword', () => {
      const eb = base.signature.find(a => a.id === 'entropic-bolt');
      expect(eb?.keywords).toContain('Chronopathy');
    });
  });

  describe('No duplicate IDs', () => {
    it('all ability IDs are unique', () => {
      const ids = collectAllIds(base);
      const unique = new Set(ids);
      expect(ids.length).toBe(unique.size);
    });
  });
});

// ============================================================================
// TROUBADOUR
// ============================================================================
describe('Troubadour Abilities Audit', () => {
  const base = getTroubadourAbilities();

  describe('Ability counts per tier (no class act)', () => {
    it('has 4 signature abilities', () => {
      expect(base.signature).toHaveLength(4);
    });
    it('has 4 three-cost abilities', () => {
      expect(base.threeCost).toHaveLength(4);
    });
    it('has 4 five-cost abilities', () => {
      expect(base.fiveCost).toHaveLength(4);
    });
    it('has 4 seven-cost abilities', () => {
      expect(base.sevenCost).toHaveLength(4);
    });
    it('has 4 nine-cost abilities', () => {
      expect(base.nineCost).toHaveLength(4);
    });
    it('has 4 eleven-cost abilities', () => {
      expect(base.elevenCost).toHaveLength(4);
    });
    it('has 0 triggered actions without class act', () => {
      expect(base.triggeredActions).toHaveLength(0);
    });
    it('has empty other array', () => {
      expect(base.other).toHaveLength(0);
    });
  });

  describe('Signature ability names', () => {
    const names = base.signature.map(a => a.name);
    it.each([
      'Artful Flourish',
      'Cutting Sarcasm',
      'Instigator',
      'Witty Banter',
    ])('includes %s', (name) => {
      expect(names).toContain(name);
    });
  });

  describe('3-Drama ability names', () => {
    const names = base.threeCost.map(a => a.name);
    it.each([
      'Harsh Critic',
      'Hypnotic Overtones',
      'Quick Rewrite',
      'Upstage',
    ])('includes %s', (name) => {
      expect(names).toContain(name);
    });
  });

  describe('5-Drama ability names', () => {
    const names = base.fiveCost.map(a => a.name);
    it.each([
      'Dramatic Reversal',
      'Fake Your Death',
      'Flip the Script',
      'Method Acting',
    ])('includes %s', (name) => {
      expect(names).toContain(name);
    });
  });

  describe('7-Drama ability names', () => {
    const names = base.sevenCost.map(a => a.name);
    it.each([
      'Extensive Rewrites',
      'Infernal Gavotte',
      'Star Solo',
      'We Meet at Last',
    ])('includes %s', (name) => {
      expect(names).toContain(name);
    });
  });

  describe('9-Drama ability names', () => {
    const names = base.nineCost.map(a => a.name);
    it.each([
      'Action Hero',
      'Continuity Error',
      'Love Song',
      'Patter Song',
    ])('includes %s', (name) => {
      expect(names).toContain(name);
    });
  });

  describe('11-Drama ability names', () => {
    const names = base.elevenCost.map(a => a.name);
    it.each([
      'Dramatic Reveal',
      'Power Ballad',
      'Saved in the Edit',
      'The Show Must Go On',
    ])('includes %s', (name) => {
      expect(names).toContain(name);
    });
  });

  describe('Cost tier correctness', () => {
    it('signature abilities have no essenceCost', () => {
      base.signature.forEach(a => {
        expect(a.essenceCost).toBeUndefined();
      });
    });
    it('3-cost abilities have essenceCost 3', () => {
      base.threeCost.forEach(a => {
        expect(a.essenceCost).toBe(3);
      });
    });
    it('5-cost abilities have essenceCost 5', () => {
      base.fiveCost.forEach(a => {
        expect(a.essenceCost).toBe(5);
      });
    });
    it('7-cost abilities have essenceCost 7', () => {
      base.sevenCost.forEach(a => {
        expect(a.essenceCost).toBe(7);
      });
    });
    it('9-cost abilities have essenceCost 9', () => {
      base.nineCost.forEach(a => {
        expect(a.essenceCost).toBe(9);
      });
    });
    it('11-cost abilities have essenceCost 11', () => {
      base.elevenCost.forEach(a => {
        expect(a.essenceCost).toBe(11);
      });
    });
  });

  describe('Action types', () => {
    it('Artful Flourish is an action', () => {
      const af = base.signature.find(a => a.id === 'artful-flourish');
      expect(af?.actionType).toBe('action');
    });
    it('Upstage is a maneuver', () => {
      const up = base.threeCost.find(a => a.id === 'upstage');
      expect(up?.actionType).toBe('maneuver');
    });
    it('Fake Your Death is a maneuver', () => {
      const fyd = base.fiveCost.find(a => a.id === 'fake-your-death');
      expect(fyd?.actionType).toBe('maneuver');
    });
  });

  describe('Power roll characteristics', () => {
    it('Artful Flourish uses agility', () => {
      const af = base.signature.find(a => a.id === 'artful-flourish');
      expect(af?.powerRoll?.characteristic).toBe('agility');
    });
    it('Cutting Sarcasm uses presence', () => {
      const cs = base.signature.find(a => a.id === 'cutting-sarcasm');
      expect(cs?.powerRoll?.characteristic).toBe('presence');
    });
    it('Instigator uses presence', () => {
      const ins = base.signature.find(a => a.id === 'instigator');
      expect(ins?.powerRoll?.characteristic).toBe('presence');
    });
    it('Upstage uses agility with presence alternative', () => {
      const up = base.threeCost.find(a => a.id === 'upstage');
      expect(up?.powerRoll?.characteristic).toBe('agility');
      expect(up?.powerRoll?.alternativeCharacteristics).toContain('presence');
    });
    it('Action Hero uses agility', () => {
      const ah = base.nineCost.find(a => a.id === 'action-hero');
      expect(ah?.powerRoll?.characteristic).toBe('agility');
    });
    it('Method Acting uses agility', () => {
      const ma = base.fiveCost.find(a => a.id === 'method-acting');
      expect(ma?.powerRoll?.characteristic).toBe('agility');
    });
  });

  describe('Keywords', () => {
    it('Artful Flourish has Melee, Strike, Weapon', () => {
      const af = base.signature.find(a => a.id === 'artful-flourish');
      expect(af?.keywords).toContain('Melee');
      expect(af?.keywords).toContain('Strike');
      expect(af?.keywords).toContain('Weapon');
    });
    it('Cutting Sarcasm has Magic keyword', () => {
      const cs = base.signature.find(a => a.id === 'cutting-sarcasm');
      expect(cs?.keywords).toContain('Magic');
    });
    it('Witty Banter has Magic, Melee, Ranged, Strike', () => {
      const wb = base.signature.find(a => a.id === 'witty-banter');
      expect(wb?.keywords).toEqual(expect.arrayContaining(['Magic', 'Melee', 'Ranged', 'Strike']));
    });
  });

  describe('No duplicate IDs', () => {
    it('all ability IDs are unique', () => {
      const ids = collectAllIds(base);
      const unique = new Set(ids);
      expect(ids.length).toBe(unique.size);
    });
  });

  describe('Class act triggered actions', () => {
    it.each([
      ['auteur', 'Turnabout Is Fair Play'],
      ['duelist', 'Riposte'],
      ['virtuoso', 'Harmonize'],
    ] as const)('%s class act yields %s', (classAct, expectedName) => {
      const withAct = getTroubadourAbilities(classAct);
      expect(withAct.triggeredActions).toHaveLength(1);
      expect(withAct.triggeredActions[0].name).toBe(expectedName);
    });

    it('all class act triggered actions have actionType triggered', () => {
      for (const classAct of ['auteur', 'duelist', 'virtuoso']) {
        const withAct = getTroubadourAbilities(classAct);
        withAct.triggeredActions.forEach(a => {
          expect(a.actionType).toBe('triggered');
        });
      }
    });

    it('Harmonize has essenceCost 3', () => {
      const virtuoso = getTroubadourAbilities('virtuoso');
      const harmonize = virtuoso.triggeredActions[0];
      expect(harmonize.essenceCost).toBe(3);
    });

    it('Riposte has no essenceCost', () => {
      const duelist = getTroubadourAbilities('duelist');
      const riposte = duelist.triggeredActions[0];
      expect(riposte.essenceCost).toBeUndefined();
    });
  });
});

// ============================================================================
// BEASTHEART
// ============================================================================
describe('Beastheart Abilities Audit', () => {
  const base = getBeastheartAbilities();

  describe('Ability counts per tier (no wild nature)', () => {
    it('has 4 signature abilities', () => {
      expect(base.signature).toHaveLength(4);
    });
    it('has 4 three-cost abilities', () => {
      expect(base.threeCost).toHaveLength(4);
    });
    it('has 4 five-cost abilities (core only)', () => {
      expect(base.fiveCost).toHaveLength(4);
    });
    it('has 4 seven-cost abilities', () => {
      expect(base.sevenCost).toHaveLength(4);
    });
    it('has 4 nine-cost abilities (core only)', () => {
      expect(base.nineCost).toHaveLength(4);
    });
    it('has 4 eleven-cost abilities (core only)', () => {
      expect(base.elevenCost).toHaveLength(4);
    });
    it('has 0 triggered actions without wild nature', () => {
      expect(base.triggeredActions).toHaveLength(0);
    });
    it('has empty other array', () => {
      expect(base.other).toHaveLength(0);
    });
  });

  describe('Signature ability names', () => {
    const names = base.signature.map(a => a.name);
    it.each([
      'Bodyswap',
      'Come On!',
      'Covering Fire',
      'Stormrage',
    ])('includes %s', (name) => {
      expect(names).toContain(name);
    });
  });

  describe('3-Ferocity ability names', () => {
    const names = base.threeCost.map(a => a.name);
    it.each([
      'Bring the Thunder',
      'Herd the Sheep',
      'Hungry like the Wolf',
      'Pushover',
    ])('includes %s', (name) => {
      expect(names).toContain(name);
    });
  });

  describe('5-Ferocity core ability names', () => {
    const names = base.fiveCost.map(a => a.name);
    it.each([
      'All of You Versus All of Me',
      'I Feed on your Pain!',
      'Rain of Fire',
      'You Let Me Get Too Close',
    ])('includes %s', (name) => {
      expect(names).toContain(name);
    });
  });

  describe('7-Ferocity ability names', () => {
    const names = base.sevenCost.map(a => a.name);
    it.each([
      'Death and Violence',
      'Head to Head',
      'Jaws of Death',
      'Shieldbreaker',
    ])('includes %s', (name) => {
      expect(names).toContain(name);
    });
  });

  describe('9-Ferocity core ability names', () => {
    const names = base.nineCost.map(a => a.name);
    it.each([
      'Deadshot',
      'Dogpile',
      'One, Two, Three, Heave',
      'Rip Them Apart!',
    ])('includes %s', (name) => {
      expect(names).toContain(name);
    });
  });

  describe('11-Ferocity core ability names', () => {
    const names = base.elevenCost.map(a => a.name);
    it.each([
      'Life-Drinking Wound',
      'On the Razor\'s Edge',
      'Ride or Die',
      'Turn the World to Ash',
    ])('includes %s', (name) => {
      expect(names).toContain(name);
    });
  });

  describe('Cost tier correctness', () => {
    it('signature abilities have no essenceCost', () => {
      base.signature.forEach(a => {
        expect(a.essenceCost).toBeUndefined();
      });
    });
    it('3-cost abilities have essenceCost 3', () => {
      base.threeCost.forEach(a => {
        expect(a.essenceCost).toBe(3);
      });
    });
    it('5-cost abilities have essenceCost 5', () => {
      base.fiveCost.forEach(a => {
        expect(a.essenceCost).toBe(5);
      });
    });
    it('7-cost abilities have essenceCost 7', () => {
      base.sevenCost.forEach(a => {
        expect(a.essenceCost).toBe(7);
      });
    });
    it('9-cost abilities have essenceCost 9', () => {
      base.nineCost.forEach(a => {
        expect(a.essenceCost).toBe(9);
      });
    });
    it('11-cost abilities have essenceCost 11', () => {
      base.elevenCost.forEach(a => {
        expect(a.essenceCost).toBe(11);
      });
    });
  });

  describe('Power roll characteristics', () => {
    it('Stormrage uses might', () => {
      const br = base.signature.find(a => a.id === 'stormrage');
      expect(br?.powerRoll?.characteristic).toBe('might');
    });
    it('Covering Fire uses intuition', () => {
      const cf = base.signature.find(a => a.id === 'covering-fire');
      expect(cf?.powerRoll?.characteristic).toBe('intuition');
    });
    it('Bodyswap uses intuition', () => {
      const tmi = base.signature.find(a => a.id === 'bodyswap');
      expect(tmi?.powerRoll?.characteristic).toBe('intuition');
    });
    it('Come On! uses might', () => {
      const sc = base.signature.find(a => a.id === 'come-on');
      expect(sc?.powerRoll?.characteristic).toBe('might');
    });
    it('Head to Head uses intuition', () => {
      const hh = base.sevenCost.find(a => a.id === 'head-to-head');
      expect(hh?.powerRoll?.characteristic).toBe('intuition');
    });
  });

  describe('Keywords', () => {
    it('all signature abilities have Beastheart keyword', () => {
      base.signature.forEach(a => {
        expect(a.keywords).toContain('Beastheart');
      });
    });
    it('3-Ferocity abilities have Companion keyword', () => {
      // All 3-Ferocity have Companion except none — they all have Companion
      base.threeCost.forEach(a => {
        expect(a.keywords).toContain('Companion');
      });
    });
  });

  describe('No duplicate IDs (core)', () => {
    it('all ability IDs are unique', () => {
      const ids = collectAllIds(base);
      const unique = new Set(ids);
      expect(ids.length).toBe(unique.size);
    });
  });

  describe('Wild nature subclass abilities', () => {
    describe.each([
      'guardian',
      'prowler',
      'punisher',
      'spark',
    ])('%s wild nature', (wildNature) => {
      const withNature = getBeastheartAbilities(wildNature);

      it('adds 2 wild nature abilities at 5-cost', () => {
        expect(withNature.fiveCost).toHaveLength(6);
      });
      it('adds 2 wild nature abilities at 9-cost', () => {
        expect(withNature.nineCost).toHaveLength(6);
      });
      it('adds 2 wild nature abilities at 11-cost', () => {
        expect(withNature.elevenCost).toHaveLength(6);
      });
      it('adds 1 triggered action', () => {
        expect(withNature.triggeredActions).toHaveLength(1);
      });
      it('all IDs are unique', () => {
        const ids = collectAllIds(withNature);
        const unique = new Set(ids);
        expect(ids.length).toBe(unique.size);
      });
    });

    it.each([
      ['guardian', "Don't Worry, I'm Here"],
      ['prowler', "While No One's Looking"],
      ['punisher', 'Swat Away'],
      ['spark', 'Self-Immolate'],
    ] as const)('%s yields triggered action %s', (wildNature, expectedName) => {
      const withNature = getBeastheartAbilities(wildNature);
      expect(withNature.triggeredActions[0].name).toBe(expectedName);
    });

    it('all wild nature triggered actions have actionType triggered', () => {
      for (const wn of ['guardian', 'prowler', 'punisher', 'spark']) {
        const withNature = getBeastheartAbilities(wn);
        withNature.triggeredActions.forEach(a => {
          expect(a.actionType).toBe('triggered');
        });
      }
    });
  });

  describe('Guardian 5-cost ability names', () => {
    const guardian = getBeastheartAbilities('guardian');
    const wildNatureNames = guardian.fiveCost
      .filter(a => !['all-of-you-versus-all-of-me', 'i-feed-on-your-pain', 'rain-of-fire', 'you-let-me-get-too-close'].includes(a.id))
      .map(a => a.name);

    it.each([
      'Belly of the Beast',
      'Fetch!',
    ])('includes %s', (name) => {
      expect(wildNatureNames).toContain(name);
    });
  });

  describe('Prowler 5-cost ability names', () => {
    const prowler = getBeastheartAbilities('prowler');
    const wildNatureNames = prowler.fiveCost
      .filter(a => !['all-of-you-versus-all-of-me', 'i-feed-on-your-pain', 'rain-of-fire', 'you-let-me-get-too-close'].includes(a.id))
      .map(a => a.name);

    it.each([
      'Jump Scare',
      'Close Combat',
    ])('includes %s', (name) => {
      expect(wildNatureNames).toContain(name);
    });
  });

  describe('Punisher 5-cost ability names', () => {
    const punisher = getBeastheartAbilities('punisher');
    const wildNatureNames = punisher.fiveCost
      .filter(a => !['all-of-you-versus-all-of-me', 'i-feed-on-your-pain', 'rain-of-fire', 'you-let-me-get-too-close'].includes(a.id))
      .map(a => a.name);

    it.each([
      'Foe Bowling',
      'Psych Up',
    ])('includes %s', (name) => {
      expect(wildNatureNames).toContain(name);
    });
  });

  describe('Spark 5-cost ability names', () => {
    const spark = getBeastheartAbilities('spark');
    const wildNatureNames = spark.fiveCost
      .filter(a => !['all-of-you-versus-all-of-me', 'i-feed-on-your-pain', 'rain-of-fire', 'you-let-me-get-too-close'].includes(a.id))
      .map(a => a.name);

    it.each([
      'Burning Lash',
      'Howling Gale',
    ])('includes %s', (name) => {
      expect(wildNatureNames).toContain(name);
    });
  });
});

// ============================================================================
// SUMMONER
// ============================================================================
describe('Summoner Abilities Audit', () => {
  const base = getSummonerAbilities();

  describe('Ability counts per tier', () => {
    it('has 4 signature abilities', () => {
      expect(base.signature).toHaveLength(4);
    });
    it('has 12 three-cost abilities', () => {
      expect(base.threeCost).toHaveLength(12);
    });
    it('has 12 five-cost abilities', () => {
      expect(base.fiveCost).toHaveLength(12);
    });
    it('has 16 seven-cost abilities', () => {
      expect(base.sevenCost).toHaveLength(16);
    });
    it('has 4 nine-cost abilities', () => {
      expect(base.nineCost).toHaveLength(4);
    });
    it('has 4 eleven-cost abilities', () => {
      expect(base.elevenCost).toHaveLength(4);
    });
    it('has 4 triggered actions', () => {
      expect(base.triggeredActions).toHaveLength(4);
    });
    it('has empty other array', () => {
      expect(base.other).toHaveLength(0);
    });
  });

  describe('Signature ability names', () => {
    const names = base.signature.map(a => a.name);
    it.each([
      'Summoner Strike',
      'Strike For Me',
      'Call Forth',
      'Minion Bridge',
    ])('includes %s', (name) => {
      expect(names).toContain(name);
    });
  });

  describe('3-Essence ability names (12 summons across Demon/Elemental/Fey/Undead)', () => {
    const names = base.threeCost.map(a => a.name);
    it.each([
      // Demon
      'Summon Archer Spittlich',
      'Summon Twisted Bengrul',
      'Summon Fanged Musilex',
      // Elemental
      'Summon Crux of Ash',
      'Summon Flow of Magma',
      'Summon Desolation of Sand',
      // Fey
      'Summon Pixie Hydrain',
      'Summon Sprite Orchiguard',
      'Summon Pixie Loftlilly',
      // Undead
      'Summon Grave Knight',
      'Summon Stalker Shade',
      'Summon Zombie Lumberer',
    ])('includes %s', (name) => {
      expect(names).toContain(name);
    });
  });

  describe('5-Essence ability names (12 summons)', () => {
    const names = base.fiveCost.map(a => a.name);
    it.each([
      // Demon
      'Summon Gushing Spewler',
      'Summon Hulking Chimor',
      'Summon Violent',
      // Elemental
      'Summon Dancing Silk',
      'Summon Quiet of Snow',
      'Summon Principle of the Swamp',
      // Fey
      'Summon Nixie Hemloche',
      'Summon Pixie Rosenthall',
      'Summon Sprite Foxglow',
      // Undead
      'Summon Accursed Mummy',
      'Summon Phase Ghoul',
      'Summon Ceaseless Mournling',
    ])('includes %s', (name) => {
      expect(names).toContain(name);
    });
  });

  describe('7-Essence ability names (4 non-summon + 12 summon)', () => {
    const names = base.sevenCost.map(a => a.name);
    // Non-summon 7-cost
    it.each([
      'Blitz Tactics',
      'Cavalry Call',
      'Essence Funnel',
      'Lead By Example',
    ])('includes non-summon %s', (name) => {
      expect(names).toContain(name);
    });
    // Summon 7-cost
    it.each([
      // Demon
      'Summon Faded Blightling',
      'Summon Gorrre',
      'Summon Vicisittante',
      // Elemental
      'Summon Iron Reaver',
      'Summon Light of the Sun',
      'Summon Knight of Blood',
      // Fey
      'Summon Nixie Corallia',
      'Summon Pixie Belladonix',
      'Summon Sprite Olyender',
      // Undead
      'Summon False Vampire',
      'Summon Zombie Titan',
      'Summon Phantom of the Ripper',
    ])('includes summon %s', (name) => {
      expect(names).toContain(name);
    });
  });

  describe('9-Essence ability names', () => {
    const names = base.nineCost.map(a => a.name);
    it.each([
      "A Champion's Cry",
      "Army's Idol",
      'The Champion Slams the Earth',
      'Their Pall Shrouds All',
    ])('includes %s', (name) => {
      expect(names).toContain(name);
    });
  });

  describe('11-Essence ability names', () => {
    const names = base.elevenCost.map(a => a.name);
    it.each([
      '10,000 Minions',
      'Bodyguard Tactics',
      'I Abjure Thee',
      "The Champion's Wrath",
    ])('includes %s', (name) => {
      expect(names).toContain(name);
    });
  });

  describe('Triggered action names', () => {
    const names = base.triggeredActions.map(a => a.name);
    it.each([
      'Focus Fire!',
      'Halt!',
      'Not Yet!',
      'Shield!',
    ])('includes %s', (name) => {
      expect(names).toContain(name);
    });
  });

  describe('Cost tier correctness', () => {
    it('Summoner Strike has no essenceCost', () => {
      const ss = base.signature.find(a => a.id === 'summoner-strike');
      expect(ss?.essenceCost).toBeUndefined();
    });
    it('Strike For Me has no essenceCost', () => {
      const sfm = base.signature.find(a => a.id === 'strike-for-me');
      expect(sfm?.essenceCost).toBeUndefined();
    });
    it('Call Forth has essenceCost 1', () => {
      const cf = base.signature.find(a => a.id === 'call-forth');
      expect(cf?.essenceCost).toBe(1);
    });
    it('Minion Bridge has no essenceCost', () => {
      const mb = base.signature.find(a => a.id === 'minion-bridge');
      expect(mb?.essenceCost).toBeUndefined();
    });
    it('3-cost abilities have essenceCost 3', () => {
      base.threeCost.forEach(a => {
        expect(a.essenceCost).toBe(3);
      });
    });
    it('5-cost abilities have essenceCost 5', () => {
      base.fiveCost.forEach(a => {
        expect(a.essenceCost).toBe(5);
      });
    });
    it('7-cost abilities have essenceCost 7', () => {
      base.sevenCost.forEach(a => {
        expect(a.essenceCost).toBe(7);
      });
    });
    it('9-cost abilities have essenceCost 9', () => {
      base.nineCost.forEach(a => {
        expect(a.essenceCost).toBe(9);
      });
    });
    it('11-cost abilities have essenceCost 11', () => {
      base.elevenCost.forEach(a => {
        expect(a.essenceCost).toBe(11);
      });
    });
  });

  describe('Action types', () => {
    it('Strike For Me is a freeTriggered action', () => {
      const sfm = base.signature.find(a => a.id === 'strike-for-me');
      expect(sfm?.actionType).toBe('freeTriggered');
    });
    it('Minion Bridge is a maneuver', () => {
      const mb = base.signature.find(a => a.id === 'minion-bridge');
      expect(mb?.actionType).toBe('maneuver');
    });
    it('all triggered actions have actionType triggered', () => {
      base.triggeredActions.forEach(a => {
        expect(a.actionType).toBe('triggered');
      });
    });
    it('Not Yet! has essenceCost 3', () => {
      const notYet = base.triggeredActions.find(a => a.id === 'not-yet');
      expect(notYet?.essenceCost).toBe(3);
    });
  });

  describe('Keywords', () => {
    it('all signature abilities have Magic keyword', () => {
      base.signature.forEach(a => {
        expect(a.keywords).toContain('Magic');
      });
    });
    it('3-Essence summon abilities have Summon keyword', () => {
      base.threeCost.forEach(a => {
        expect(a.keywords).toContain('Summon');
      });
    });
    it('Demon summons have Demon keyword', () => {
      const demonAbilities = base.threeCost.filter(a => a.keywords.includes('Demon'));
      expect(demonAbilities).toHaveLength(3);
    });
    it('Elemental summons have Elemental keyword at 3-cost', () => {
      const elementalAbilities = base.threeCost.filter(a => a.keywords.includes('Elemental'));
      expect(elementalAbilities).toHaveLength(3);
    });
    it('Fey summons have Fey keyword at 3-cost', () => {
      const feyAbilities = base.threeCost.filter(a => a.keywords.includes('Fey'));
      expect(feyAbilities).toHaveLength(3);
    });
    it('Undead summons have Undead keyword at 3-cost', () => {
      const undeadAbilities = base.threeCost.filter(a => a.keywords.includes('Undead'));
      expect(undeadAbilities).toHaveLength(3);
    });
  });

  describe('Power roll characteristics', () => {
    it('Strike For Me uses reason', () => {
      const sfm = base.signature.find(a => a.id === 'strike-for-me');
      expect(sfm?.powerRoll?.characteristic).toBe('reason');
    });
    it('Essence Funnel uses reason', () => {
      const ef = base.sevenCost.find(a => a.id === 'essence-funnel');
      expect(ef?.powerRoll?.characteristic).toBe('reason');
    });
    it('Lead By Example uses reason', () => {
      const lbe = base.sevenCost.find(a => a.id === 'lead-by-example');
      expect(lbe?.powerRoll?.characteristic).toBe('reason');
    });
    it("The Champion's Wrath uses reason", () => {
      const tcw = base.elevenCost.find(a => a.id === 'the-champions-wrath');
      expect(tcw?.powerRoll?.characteristic).toBe('reason');
    });
  });

  describe('No duplicate IDs', () => {
    it('all ability IDs are unique', () => {
      const ids = collectAllIds(base);
      const unique = new Set(ids);
      expect(ids.length).toBe(unique.size);
    });
  });
});
