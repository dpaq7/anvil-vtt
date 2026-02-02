/**
 * Save the Hostage - Battle Scene
 *
 * Pre-generated battle encounter from Draw Steel Encounters.
 * Rescue Finn from a cult ritual at Lautan Keep before time runs out.
 *
 * Attribution:
 * DRAW STEEL Encounters is an independent product published under the
 * DRAW STEEL Creator License and is not affiliated with MCDM Productions, LLC.
 */

import type { PregenBattleScene } from '../types.js';

export const SAVE_THE_HOSTAGE: PregenBattleScene = {
  id: 'pregen-save-the-hostage',
  type: 'battle',
  name: 'Save the Hostage',
  description: 'Rescue Finn from a cult ritual at Lautan Keep before the ritual completes. Race against time while fighting through goblin forces.',
  source: 'Draw Steel Encounters',
  category: 'official',
  partySize: 5,
  partyLevel: 3,
  difficulty: 'hard',
  tags: ['rescue', 'goblins', 'time-limit', 'fortress'],

  template: {
    title: 'Save the Hostage',
    mapUrl: undefined,

    partyConfig: {
      expectedHeroes: 5,
      averageLevel: 3,
      heroesVictories: 0,
    },

    difficulty: 'hard',
    expectedEV: { min: 61, max: 80 },

    maliceFeatures: [
      {
        id: 'mf-reinforcements',
        name: 'Reinforcements',
        cost: 3,
        description: 'A new wave of goblin runners (4) enters from a random edge of the map.',
        isStandard: false,
      },
      {
        id: 'mf-black-powder',
        name: 'Detonate Barrel',
        cost: 2,
        description: 'An enemy ignites a black powder barrel. All creatures within 2 squares take 3d6 fire damage (half on successful Agility test).',
        isStandard: false,
      },
      {
        id: 'mf-ritual-advance',
        name: 'Ritual Advance',
        cost: 5,
        description: 'The ritual progresses. Reduce the remaining round timer by 1.',
        isStandard: false,
      },
      {
        id: 'mf-gate-collapse',
        name: 'Collapse Gate',
        cost: 4,
        description: 'A portcullis or gate crashes down, blocking a path. Requires STR test (difficulty 15) or 30 damage to clear.',
        isStandard: false,
      },
    ],

    creatureGroups: [
      {
        id: 'group-runners',
        turnOrder: 1,
        creatures: [
          {
            id: 'goblin-runner',
            name: 'Goblin Runner',
            count: 8,
            ev: 4,
            stamina: 8,
            stats: {
              stability: 0,
              speed: 7,
              freeStrike: 3,
              distance: 1,
            },
            notes: 'Fast, weak melee skirmishers. Use Pack Tactics when adjacent to allies.',
          },
        ],
        notes: 'Screening force - try to tie up heroes while others harass.',
      },
      {
        id: 'group-snipers',
        turnOrder: 2,
        creatures: [
          {
            id: 'goblin-sniper',
            name: 'Goblin Sniper',
            count: 4,
            ev: 6,
            stamina: 12,
            stats: {
              stability: 0,
              speed: 5,
              freeStrike: 2,
              distance: 10,
            },
            notes: 'Stay at range. Target healers and low-stamina heroes.',
          },
        ],
        notes: 'Positioned on elevated terrain for cover advantage.',
      },
      {
        id: 'group-underboss',
        turnOrder: 3,
        creatures: [
          {
            id: 'goblin-underboss',
            name: 'Goblin Underboss',
            count: 2,
            ev: 12,
            stamina: 24,
            stats: {
              stability: 1,
              speed: 5,
              freeStrike: 5,
              distance: 1,
            },
            notes: 'Leader ability: Adjacent goblins gain +2 to damage.',
          },
        ],
        notes: 'Coordinate the goblins. Kill these to disrupt enemy tactics.',
      },
      {
        id: 'group-spinecleavers',
        turnOrder: 4,
        creatures: [
          {
            id: 'goblin-spinecleaver',
            name: 'Goblin Spinecleaver',
            count: 2,
            ev: 10,
            stamina: 18,
            stats: {
              stability: 1,
              speed: 5,
              freeStrike: 6,
              distance: 2,
            },
            notes: 'Heavy hitters with reach weapons. High damage, moderate stamina.',
          },
        ],
        notes: 'Guard the ritual chamber entrance.',
      },
      {
        id: 'group-bugbears',
        turnOrder: 5,
        creatures: [
          {
            id: 'bugbear',
            name: 'Bugbear',
            count: 4,
            ev: 15,
            stamina: 32,
            stats: {
              stability: 2,
              speed: 6,
              freeStrike: 7,
              distance: 1,
            },
            notes: 'Elite brutes. Powerful attack ability once per round.',
          },
        ],
        notes: 'Final defense around the hostage.',
      },
    ],

    dynamicTerrain: [
      {
        id: 'terrain-barrel',
        name: 'Black Powder Barrel',
        ev: 0,
        stamina: 5,
        notes: 'Explodes when destroyed or ignited: 3d6 fire damage in 2-square radius.',
      },
      {
        id: 'terrain-pillar',
        name: 'Crumbling Pillar',
        ev: 0,
        stamina: 15,
        notes: 'Can be toppled. Falls in a line, dealing 2d6 bludgeoning to creatures in path.',
      },
      {
        id: 'terrain-gate',
        name: 'Portcullis',
        ev: 0,
        stamina: 30,
        notes: 'Blocks movement when closed. Can be lifted (STR 15) or destroyed.',
      },
    ],

    successCondition: 'Rescue Finn (reduce hostage to safety) before round 6 ends.',
    failureCondition: 'Finn dies (reduced to 0 stamina) or the ritual completes (round 6 ends).',
  },
};
