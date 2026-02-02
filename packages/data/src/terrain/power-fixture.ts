/**
 * Power Fixture Terrains for Draw Steel
 *
 * Ported from Forgesteel (https://github.com/andyaiken/forgesteel)
 * Original work Copyright (c) Andy Aiken, Licensed under GPL-3.0
 *
 * Magical objects that empower allies or hinder enemies on the battlefield.
 */

import type { CompendiumTerrain } from '@anvil/types';

/**
 * Holy Idol (Level 5, Support Relic)
 */
export const HOLY_IDOL: CompendiumTerrain = {
  id: 'terrain-holy-idol',
  name: 'Holy Idol',
  description: "An empowering monument to a higher power enables a villain's machinations.",
  category: 'power-fixture',
  level: 5,
  role: { type: 'support', terrainType: 'relic' },
  encounterValue: 7,
  size: 2,
  stamina: { base: 35, perSquare: 0 },
  deactivate: 'The holy idol must be completely destroyed.',
  features: [
    {
      id: 'empowered-will',
      name: 'Empowered Will',
      description: 'At the start of each round while the holy idol is intact, the Director gains a d6 that lasts until the end of the round. When a Director-controlled creature deals or takes damage, the Director can roll the d6 to increase the damage the creature deals or reduce the damage the creature takes by an amount equal to the roll (to a minimum of 2 damage). If multiple idols are in play, only one d6 can be applied to a single instance of damage.',
    },
  ],
};

/**
 * Psionic Shard (Level 5, Defender Fortification)
 */
export const PSIONIC_SHARD: CompendiumTerrain = {
  id: 'terrain-psionic-shard',
  name: 'Psionic Shard',
  description: 'A massive humming crystal makes the air around it feel thick.',
  category: 'power-fixture',
  level: 5,
  role: { type: 'defender', terrainType: 'fortification' },
  encounterValue: 7,
  size: 2,
  stamina: { base: 40, perSquare: 0 },
  deactivate: 'The psionic shard must be completely destroyed.',
  features: [
    {
      id: 'psionic-barrier',
      name: 'Psionic Barrier',
      description: 'A psionic shard is attuned to one side in an encounter. While a psionic shard is intact, any damage dealt to each ally of the shard in the encounter is halved.',
    },
  ],
  abilities: [
    {
      id: 'psionic-pulse',
      name: 'Psionic Pulse',
      usage: 'Triggered action',
      trigger: 'The shard is destroyed.',
      effectText: 'The shard releases a shockwave channeled through each creature affected by Psionic Barrier. Each ally in the encounter is dazed until the end of their next turn.',
    },
  ],
};

/**
 * Tree of Might (Level 5, Hexer Hazard)
 */
export const TREE_OF_MIGHT: CompendiumTerrain = {
  id: 'terrain-tree-of-might',
  name: 'Tree of Might',
  description: 'A gnarled tree with unearthed roots that writhe and curl.',
  category: 'power-fixture',
  level: 5,
  role: { type: 'hexer', terrainType: 'hazard' },
  encounterValue: 14,
  size: 3,
  stamina: { base: 60, perSquare: 0 },
  immunities: '5 to all damage except corruption or fire damage',
  deactivate: 'The tree of might must be completely destroyed.',
  features: [
    {
      id: 'trees-nourishment',
      name: "Tree's Nourishment",
      description: 'At the start of each round while the tree of might is intact, each enemy touching the ground in the encounter area who has M < 0 takes 10 corruption damage, and the tree of might grows a fruit. The potency increases by 1 each subsequent round.',
    },
    {
      id: 'mighty-fruit',
      name: 'Mighty Fruit',
      description: 'Once per round, any creature adjacent to the tree of might can take a fruit from the tree and eat it (no action required). The creature gains 10 temporary Stamina and has their Might score increased by 1 (to a maximum of 6) until the end of the encounter.',
    },
  ],
};

/**
 * All Power Fixture terrains
 */
export const POWER_FIXTURE_TERRAINS: CompendiumTerrain[] = [
  HOLY_IDOL,
  PSIONIC_SHARD,
  TREE_OF_MIGHT,
];
