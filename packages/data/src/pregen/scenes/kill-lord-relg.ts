/**
 * Kill Lord Relg! - Boss Battle Scene
 *
 * Pre-generated boss battle encounter from Draw Steel Encounters.
 * Face the Level 10 Solo Abyssal Demon Lord Relg on the ramparts of Blackbottom.
 *
 * Attribution:
 * DRAW STEEL Encounters is an independent product published under the
 * DRAW STEEL Creator License and is not affiliated with MCDM Productions, LLC.
 */

import type { PregenBattleScene } from '../types.js';

export const KILL_LORD_RELG: PregenBattleScene = {
  id: 'pregen-kill-lord-relg',
  type: 'battle',
  name: 'Kill Lord Relg!',
  description: 'A climactic boss battle against Lord Relg, a Level 10 Solo Abyssal Demon. Face his devastating attacks, writhing intestines, and the Aura of Lethe on the ramparts of Blackbottom.',
  source: 'Draw Steel Encounters',
  category: 'official',
  partySize: 5,
  partyLevel: 10,
  difficulty: 'hard',
  tags: ['boss', 'demon', 'solo', 'climactic', 'high-level'],

  template: {
    title: 'Kill Lord Relg!',
    mapUrl: undefined,

    partyConfig: {
      expectedHeroes: 5,
      averageLevel: 10,
      heroesVictories: 0,
    },

    difficulty: 'hard',
    expectedEV: { min: 120, max: 120 },

    maliceFeatures: [
      {
        id: 'mf-birth',
        name: 'Birth',
        cost: 3,
        description: 'Lord Relg summons 4 level 10 demon minions from his flesh. They appear within 3 squares of him and act immediately.',
        isStandard: false,
      },
      {
        id: 'mf-soul-rend',
        name: 'Soul Rend',
        cost: 5,
        description: 'Until the end of the round, all of Lord Relg\'s attacks deal an additional 5 corruption damage.',
        isStandard: false,
      },
      {
        id: 'mf-solo-action',
        name: 'Solo Action',
        cost: 5,
        description: 'Lord Relg immediately takes an additional main action. This can be used even while dazed.',
        isStandard: false,
      },
      {
        id: 'mf-lake-of-oblivion',
        name: 'Lake of Oblivion',
        cost: 10,
        description: 'The battlefield floods with lethe. All non-flying creatures must make an Intuition test (difficulty 18) or be dazed until the end of their next turn. Additionally, any creature adjacent to an ally must make a free strike against that ally.',
        isStandard: false,
      },
      {
        id: 'mf-siphon-memory',
        name: 'Siphon Memory',
        cost: 3,
        description: 'Triggered action: When an enemy uses an ability within 5 squares, Lord Relg can attempt to steal it. That enemy makes a Presence test (difficulty 16). On failure, they cannot use that ability again this encounter, and Relg can use it once.',
        isStandard: false,
      },
    ],

    creatureGroups: [
      {
        id: 'group-relg',
        turnOrder: 1,
        creatures: [
          {
            id: 'lord-relg',
            name: 'Lord Relg',
            count: 1,
            ev: 120,
            stamina: 650,
            stats: {
              stability: 5,
              speed: 6,
              freeStrike: 12,
              distance: 2,
            },
            notes: `SOLO BOSS - Takes up to 2 turns per round (not consecutive).

AURA OF LETHE: All enemies within 3 squares subtract d3 from their power rolls. This effect is cumulative with itself.

WRITHING INTESTINES: Lord Relg has 6 lamprey-like intestines that can each grab one creature. A grabbed creature takes 2d6 damage at the start of each of Relg's turns.

SIGNATURE - World Splitting Axe: Melee attack, 2d10+5 damage. On Tier 3, target is also pushed 3 squares and knocked prone.

FEAST: When a creature is grabbed by 3+ intestines, Relg can spend a main action to swallow them. Swallowed creatures are blinded, restrained, and take 3d6 acid damage at the start of each of Relg's turns.

CROWN OF THE CORPULENT LORD: Relg has resistance to all damage while he has 3+ creatures grabbed or swallowed.

WAILS OF THE DAMNED: Triggered action when Relg takes 100+ damage in a single attack - all enemies within 10 squares must make a Presence test (difficulty 15) or be frightened until the end of their next turn.`,
          },
        ],
        notes: 'The solo boss. Prioritize freeing grabbed allies and avoiding the Aura of Lethe.',
      },
    ],

    dynamicTerrain: [
      {
        id: 'terrain-rampart',
        name: 'Rampart Edge',
        ev: 0,
        notes: 'Falling off the rampart deals 6d6 fall damage. Creatures can climb back up with a successful Might test (difficulty 12).',
      },
      {
        id: 'terrain-siege-weapon',
        name: 'Broken Siege Weapon',
        ev: 0,
        stamina: 40,
        notes: 'Provides cover. Can be destroyed to create difficult terrain.',
      },
      {
        id: 'terrain-corpse-pile',
        name: 'Pile of Corpses',
        ev: 0,
        notes: 'Difficult terrain. Creatures ending their turn here must make an Intuition test (difficulty 12) or be frightened until end of next turn.',
      },
    ],

    successCondition: 'Reduce Lord Relg to 0 Stamina.',
    failureCondition: 'All heroes are incapacitated or the party retreats.',
  },
};
