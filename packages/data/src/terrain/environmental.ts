/**
 * Environmental Hazards for Draw Steel
 *
 * Ported from Forgesteel (https://github.com/andyaiken/forgesteel)
 * Original work Copyright (c) Andy Aiken, Licensed under GPL-3.0
 *
 * Natural terrain hazards found in wilderness and dungeon environments.
 */

import type { CompendiumTerrain } from '@anvil/types';

/**
 * Angry Beehive (Level 2, Harrier Hazard)
 */
export const ANGRY_BEEHIVE: CompendiumTerrain = {
  id: 'terrain-angry-beehive',
  name: 'Angry Beehive',
  description: 'This beehive is full of angry bees who swarm and attack with little provocation.',
  category: 'environmental',
  level: 2,
  role: { type: 'harrier', terrainType: 'hazard' },
  encounterValue: 2,
  size: '1S',
  stamina: { base: 3, perSquare: 0 },
  deactivate: "The beehive can't be deactivated. If it takes damage or is destroyed, the hive unleashes a swarm of bees.",
  activate: "A creature enters the hive's space or an adjacent space without shifting.",
  effect: "The hive is removed from the encounter map and a swarm of bees is placed in one square of the space of the triggering creature. Any creature who starts their turn in the swarm's space takes 3 poison damage. At the start of each round, the swarm moves 1 square and its size increases by 1 square (to 2 squares by 2 squares, 3 squares by 3 squares, and so forth), preferring squares in a creature's space. After 3 rounds, the swarm dissipates.",
  upgrades: [
    {
      id: 'concealed-beehive',
      name: 'Concealed Beehive',
      cost: 1,
      description: 'The hive is hidden until the swarm is unleashed.',
    },
    {
      id: 'killer-bees',
      name: 'Killer Bees',
      cost: 2,
      description: 'The bees are a particularly aggressive and dangerous species. The hive triggers even if a creature shifts into or while adjacent to it, and the swarm deals 1d6 + 3 poison damage.',
    },
  ],
};

/**
 * Brambles (Level 1, Defender Fortification)
 */
export const BRAMBLES: CompendiumTerrain = {
  id: 'terrain-brambles',
  name: 'Brambles',
  description: 'This thicket features close-growing vines tipped with sharp thorns.',
  category: 'environmental',
  level: 1,
  role: { type: 'defender', terrainType: 'fortification' },
  encounterValue: 1,
  area: '10 x 10 thicket',
  size: '1 or more squares of difficult terrain',
  stamina: { base: 0, perSquare: 3 },
  deactivate: 'Each square of brambles must be individually destroyed.',
  activate: 'A creature enters a square of brambles without shifting.',
  effect: 'A creature takes 1 damage per square of brambles they enter.',
  upgrades: [
    {
      id: 'poisonous-thorns',
      name: 'Poisonous Thorns',
      cost: 1,
      description: 'The brambles are poisonous. Any creature who takes damage from brambles is also bleeding (save ends).',
    },
  ],
};

/**
 * Corrosive Pool (Level 2, Hexer Hazard)
 */
export const CORROSIVE_POOL: CompendiumTerrain = {
  id: 'terrain-corrosive-pool',
  name: 'Corrosive Pool',
  description: 'This shallow pool bubbles with acid or some other corrosive liquid.',
  category: 'environmental',
  level: 2,
  role: { type: 'hexer', terrainType: 'hazard' },
  encounterValue: 3,
  area: '10 x 10 pool',
  size: 'One or more squares of difficult terrain',
  stamina: { base: 0, perSquare: 12 },
  immunities: '20 to all damage except cold or fire damage',
  deactivate: 'The pool must be completely destroyed.',
  activate: 'A creature or object enters the corrosive pool or starts their turn there. The liquid in the pool is also highly volatile (see Explosive Reaction below).',
  effect: 'A creature or object takes 3 acid damage if they start their turn in the pool, and takes 3 acid damage for each square of the pool they enter.',
  alliedAwareness: "Allies who have weapons are equipped with torches. Any ally can use a maneuver to throw a torch up to 5 squares and deal 1 fire damage to the pool, triggering Explosive Reaction.",
  abilities: [
    {
      id: 'explosive-reaction',
      name: 'Explosive Reaction',
      usage: 'Triggered action',
      trigger: 'The pool takes fire damage.',
      keywords: ['Area'],
      distance: 'Burst 3',
      target: 'Each creature and object in the area',
      effect: {
        roll: 'Power Roll + 2',
        tier1: '3 fire damage; M < 1 burning (save ends)',
        tier2: '6 fire damage; M < 2 burning (save ends)',
        tier3: '9 fire damage; M < 3 burning (save ends)',
      },
      effectText: "The liquid in the pool is consumed. This ability has a double edge against any target in the pool. A burning creature takes 1d6 fire damage at the start of each of their turns. A burning object takes 1d6 fire damage at the end of each round. Any target with acid weakness takes extra damage from this ability and while burning as if the fire damage were acid damage.",
    },
  ],
};

/**
 * Frozen Pond (Level 1, Hexer Hazard)
 */
export const FROZEN_POND: CompendiumTerrain = {
  id: 'terrain-frozen-pond',
  name: 'Frozen Pond',
  description: "A shallow, frozen patch of water features ice thick enough that it won't break, but its surface is slick and treacherous to navigate.",
  category: 'environmental',
  level: 1,
  role: { type: 'hexer', terrainType: 'hazard' },
  encounterValue: 1,
  area: '10 x 10 pond',
  size: 'One or more squares of difficult terrain',
  stamina: { base: 0, perSquare: 3 },
  immunities: '5 to all damage except fire damage',
  deactivate: 'Destroying a square of the frozen pond turns the square into shallow icy water.',
  activate: "A creature moves into a pond's square without shifting.",
  effect: 'The Slippery Surface ability.',
  abilities: [
    {
      id: 'slippery-surface',
      name: 'Slippery Surface',
      usage: 'Triggered action',
      trigger: 'A creature or object enters a square of the frozen pond without shifting.',
      keywords: ['Melee', 'Strike'],
      distance: 'Melee 0',
      target: 'The triggering creature or object',
      effect: {
        roll: 'Power Roll + 2',
        tier1: 'Push 1 in the direction the target was moving',
        tier2: 'Push 2 in the direction the target was moving; A < 1 slowed (save ends)',
        tier3: "Push 3 in the direction the target was moving; A < 2 prone and can't stand (save ends)",
      },
      effectText: "The triggering creature's movement ends, then they are force moved. If the target triggered this ability by being force moved, this ability gains an edge and any remaining forced movement distance is added to the ability's forced movement. The ability's forced movement doesn't trigger the ability again.",
    },
    {
      id: 'icy-water',
      name: 'Icy Water',
      usage: 'Triggered action',
      trigger: 'A creature or object enters or falls prone in a square of the frozen pond.',
      keywords: ['Melee', 'Strike'],
      distance: 'Melee 0',
      target: 'The triggering creature or object',
      effect: {
        roll: 'Power Roll + 2',
        tier1: 'Slide 1',
        tier2: '1 cold damage; M < 1 slowed (save ends)',
        tier3: '3 cold damage; M < 2 restrained (save ends)',
      },
      effectText: "The triggering creature's movement ends, then they are force moved if applicable.",
    },
  ],
  upgrades: [
    {
      id: 'thin-ice',
      name: 'Thin Ice',
      cost: 1,
      description: "The ice covering the pond is thin and the water is deeper. Whenever a creature or object enters or falls prone in a square of the frozen pond, that square is destroyed and replaced with icy water. The Icy Water ability replaces Slippery Surface. Any creature who starts their turn in the icy water takes 1 cold damage. If the water is deep enough, a creature can swim beneath the surface of the frozen pond, but takes this cold damage while doing so.",
    },
  ],
};

/**
 * Lava (Level 3, Hexer Hazard)
 */
export const LAVA: CompendiumTerrain = {
  id: 'terrain-lava',
  name: 'Lava',
  description: 'A patch of blisteringly hot molten rock wells up from the ground, threatening anyone who gets close to it.',
  category: 'environmental',
  level: 3,
  role: { type: 'hexer', terrainType: 'hazard' },
  encounterValue: 4,
  area: '10 x 10 patch',
  size: 'One or more squares of difficult terrain',
  stamina: { base: 0, perSquare: 12 },
  immunities: '20 to all damage except cold damage',
  deactivate: 'Each square of lava must be individually destroyed.',
  activate: 'A creature or object enters the lava or starts their turn there, or starts their turn adjacent to the lava.',
  effect: 'The Liquid Hot Magma ability.',
  abilities: [
    {
      id: 'liquid-hot-magma',
      name: 'Liquid Hot Magma',
      usage: 'Triggered action',
      trigger: 'A creature or object enters the lava or starts their turn there, or starts their turn adjacent to the lava.',
      keywords: ['Magic', 'Strike'],
      distance: 'Melee 1',
      target: 'The triggering creature or object',
      effect: {
        roll: 'Power Roll + 2',
        tier1: '5 fire damage; M < 1 burning (save ends)',
        tier2: '9 fire damage; M < 2 burning (save ends)',
        tier3: '12 fire damage; M < 3 burning (save ends)',
      },
      effectText: 'If the target is adjacent to lava but not in it, this ability takes a bane. A burning creature takes 1d6 fire damage at the start of each of their turns. A burning object takes 1d6 fire damage at the end of each round.',
    },
  ],
  upgrades: [
    {
      id: 'magma-flow',
      name: 'Magma Flow',
      cost: 4,
      description: 'The lava is flowing! At the start of each round, add one square of lava adjacent to an existing square of lava.',
    },
  ],
};

/**
 * Quicksand (Level 3, Hexer Hazard)
 */
export const QUICKSAND: CompendiumTerrain = {
  id: 'terrain-quicksand',
  name: 'Quicksand',
  description: 'When this patch of sand is stepped on, it is revealed to be a slurry saturated by water—and ready to draw creatures down to their doom.',
  category: 'environmental',
  level: 3,
  role: { type: 'hexer', terrainType: 'hazard' },
  encounterValue: 3,
  area: '10 x 10 patch',
  size: 'One or more squares of terrain',
  stamina: { base: 0, perSquare: 0 },
  hidden: true,
  deactivate: '—',
  activate: 'A creature or object enters the quicksand or starts their turn there.',
  effect: 'The Grasping Depths ability.',
  abilities: [
    {
      id: 'grasping-depths',
      name: 'Grasping Depths',
      usage: 'Triggered action',
      trigger: 'A creature or object enters the quicksand or starts their turn there.',
      keywords: ['Melee', 'Strike'],
      distance: 'Melee 0',
      target: 'One creature or object',
      effect: {
        roll: 'Power Roll + 2',
        tier1: 'M < 0 slowed (save ends)',
        tier2: 'M < 1 restrained (save ends)',
        tier3: 'M < 2 restrained (save ends)',
      },
      effectText: 'This ability takes a bane if a triggering creature shifted into the quicksand. A character who starts their turn restrained this way is suffocating.',
    },
  ],
};

/**
 * Toxic Plants (Level 2, Hexer Hazard)
 */
export const TOXIC_PLANTS: CompendiumTerrain = {
  id: 'terrain-toxic-plants',
  name: 'Toxic Plants',
  description: 'Colorful mushrooms or lovely flowering plants release a cloud of spores or pollen when disturbed, causing creatures to fall into a magical slumber.',
  category: 'environmental',
  level: 2,
  role: { type: 'hexer', terrainType: 'hazard' },
  encounterValue: 2,
  area: '10 x 10 field',
  size: 'One or more squares of terrain',
  stamina: { base: 0, perSquare: 3 },
  deactivate: 'Each square of plants must be individually destroyed.',
  activate: 'A creature starts their turn in the area of the toxic plants, or enters a square of toxic plants without shifting.',
  effect: 'The Sleep Spores ability.',
  abilities: [
    {
      id: 'sleep-spores',
      name: 'Sleep Spores',
      usage: 'Triggered action',
      trigger: 'A creature starts their turn in the area of the toxic plants, or enters a square of toxic plants without shifting.',
      keywords: ['Magic', 'Melee', 'Strike'],
      distance: 'Melee',
      target: 'The triggering creature',
      effect: {
        roll: 'Power Roll + 2',
        tier1: 'M < 0 dazed (save ends)',
        tier2: 'M < 1 dazed (save ends)',
        tier3: 'M < 2 dazed (save ends)',
      },
      effectText: "While dazed this way, a target who starts their turn in the area of the toxic plants falls prone and can't stand.",
    },
  ],
  upgrades: [
    {
      id: 'poisonous-spores',
      name: 'Poisonous Spores',
      cost: 2,
      description: 'Any creature dazed by this hazard takes 1d6 poison damage at the start of each of their turns.',
    },
    {
      id: 'carnivorous-plants',
      name: 'Carnivorous Plants',
      cost: 2,
      description: 'The plants are carnivorous and attempt to slowly digest any creature who falls among them. Any creature who starts their turn prone in the area takes 4 acid damage.',
    },
  ],
};

/**
 * All Environmental Hazard terrains
 */
export const ENVIRONMENTAL_TERRAINS: CompendiumTerrain[] = [
  ANGRY_BEEHIVE,
  BRAMBLES,
  CORROSIVE_POOL,
  FROZEN_POND,
  LAVA,
  QUICKSAND,
  TOXIC_PLANTS,
];
