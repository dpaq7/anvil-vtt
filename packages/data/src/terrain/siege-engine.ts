/**
 * Siege Engine Terrains for Draw Steel
 *
 * Ported from Forgesteel (https://github.com/andyaiken/forgesteel)
 * Original work Copyright (c) Andy Aiken, Licensed under GPL-3.0
 *
 * Large war machines and defensive structures used in battlefield encounters.
 */

import type { CompendiumTerrain } from '@anvil/types';

/**
 * Arrow Launcher (Level 2, Artillery Siege Engine)
 */
export const ARROW_LAUNCHER: CompendiumTerrain = {
  id: 'terrain-arrow-launcher',
  name: 'Arrow Launcher',
  description: 'A small wooden cart uses alchemical rockets to launch up to a hundred arrows at a time across a wide area.',
  category: 'siege-engine',
  level: 2,
  role: { type: 'artillery', terrainType: 'siege-engine' },
  encounterValue: 8,
  size: '1L',
  stamina: { base: 30, perSquare: 0 },
  deactivate: "As a maneuver, a creature adjacent to an arrow launcher can make an Agility test.\n\n• 11 or lower: The creature accidentally activates the Arrow Storm ability.\n• 12-16: The arrow launcher is deactivated but the creature is slowed (EoT).\n• 17+: The arrow launcher is deactivated and can't be used.",
  abilities: [
    {
      id: 'arrow-storm',
      name: 'Arrow Storm',
      usage: 'Main action (adjacent creature)',
      keywords: ['Area', 'Ranged', 'Weapon'],
      distance: '5 cube within 20',
      target: 'Each creature and object in the area',
      effect: {
        roll: 'Power Roll + 0',
        tier1: '5 damage',
        tier2: '8 damage',
        tier3: '11 damage',
      },
      effectText: "This ability can't be used again until the arrow launcher is reloaded.",
    },
    {
      id: 'reload',
      name: 'Reload',
      usage: 'Main action (adjacent creature)',
      effectText: 'The arrow launcher is reloaded, allowing Arrow Storm to be used again. This action can be used only once per round.',
    },
    {
      id: 'spot',
      name: 'Spot',
      usage: 'Main action (adjacent creature)',
      effectText: 'The next use of Arrow Storm gains an edge and has a +10 bonus to ranged distance. This action can be used only once per round.',
    },
    {
      id: 'move',
      name: 'Move',
      usage: 'Main action (adjacent creature)',
      effectText: 'The arrow launcher and the creature using this action move together up to 3 squares.',
    },
  ],
  upgrades: [
    {
      id: 'flaming-arrows',
      name: 'Flaming Arrows',
      cost: 1,
      description: 'Arrow Storm deals fire damage, and can ignite flammable objects in its area.',
    },
    {
      id: 'screamers',
      name: 'Screamers',
      cost: 3,
      description: 'The arrows make a high-pitched screaming noise as they are fired and descend onto their targets. The Screamers ability replaces Arrow Storm.',
    },
  ],
};

/**
 * Boiling Oil Cauldron (Level 3, Defender Fortification)
 */
export const BOILING_OIL_CAULDRON: CompendiumTerrain = {
  id: 'terrain-boiling-oil-cauldron',
  name: 'Boiling Oil Cauldron',
  description: 'A large cauldron of boiling oil stands ready to be poured onto enemies.',
  category: 'siege-engine',
  level: 3,
  role: { type: 'defender', terrainType: 'fortification' },
  encounterValue: 10,
  size: '1L',
  stamina: { base: 50, perSquare: 0 },
  deactivate: "As a maneuver, a creature adjacent to a boiling oil cauldron can make an Agility test.\n\n• 11 or lower: The creature accidentally activates the Boiling Oil ability.\n• 12-16: The boiling oil cauldron is deactivated but the creature is slowed (EoT).\n• 17+: The boiling oil cauldron is deactivated and can't be used.",
  abilities: [
    {
      id: 'boiling-oil',
      name: 'Boiling Oil',
      usage: 'Main action (adjacent creature)',
      keywords: ['Area', 'Weapon'],
      distance: '3 cube within 1',
      target: 'Each creature and object in the area',
      effect: {
        roll: 'Power Roll + 2',
        tier1: '5 fire damage; M < 1 burning (save ends)',
        tier2: '9 fire damage; M < 2 burning (save ends)',
        tier3: '12 fire damage; M < 3 burning (save ends)',
      },
      effectText: "If the boiling oil is poured down on targets from above, it has high ground and gains an edge on the power roll. A burning creature takes 1d6 fire damage at the start of each of their turns. A burning object takes 1d6 fire damage at the end of each round. This ability can't be used again until the boiling oil cauldron is reloaded.",
    },
    {
      id: 'reload',
      name: 'Reload',
      usage: 'Main action (adjacent creature)',
      effectText: 'The boiling oil cauldron is reloaded, allowing Boiling Oil to be used again. This action can be used only once per round.',
    },
  ],
};

/**
 * Catapult (Level 3, Artillery Siege Engine)
 */
export const CATAPULT: CompendiumTerrain = {
  id: 'terrain-catapult',
  name: 'Catapult',
  description: 'This massive counterweighted engine hurls a heavy projectile for a devastating assault.',
  category: 'siege-engine',
  level: 3,
  role: { type: 'artillery', terrainType: 'siege-engine' },
  encounterValue: 10,
  size: 2,
  stamina: { base: 50, perSquare: 0 },
  deactivate: "As a maneuver, a creature adjacent to a catapult can make an Agility test.\n\n• 11 or lower: The creature accidentally activates the Arcing Shot ability.\n• 12-16: The catapult is deactivated but the creature is slowed (EoT).\n• 17+: The catapult is deactivated and can't be used.",
  abilities: [
    {
      id: 'arcing-shot',
      name: 'Arcing Shot',
      usage: 'Main action (adjacent creature)',
      keywords: ['Area', 'Ranged', 'Weapon'],
      distance: '3 cube within 20',
      target: 'Each creature and object in the area',
      effect: {
        roll: 'Power Roll + 2',
        tier1: '5 damage',
        tier2: '9 damage; A < 0 push 1',
        tier3: '12 damage; A < 1 push 2',
      },
      effectText: "Line of effect for this ability is an arc that can be traced over obstacles between the catapult and the target area. This ability can't be used again until the catapult is reloaded.",
    },
    {
      id: 'reload',
      name: 'Reload',
      usage: 'Main action (adjacent creature)',
      effectText: 'The catapult is reloaded, allowing Arcing Shot to be used again. This action can be used only once per round.',
    },
    {
      id: 'spot',
      name: 'Spot',
      usage: 'Main action (adjacent creature)',
      effectText: 'The next use of Arcing Shot gains an edge and has a +10 bonus to ranged distance. This action can be used only once per round.',
    },
    {
      id: 'move',
      name: 'Move',
      usage: 'Main action (adjacent creature)',
      effectText: 'The catapult and the creature using this action move together up to 2 squares.',
    },
  ],
  upgrades: [
    {
      id: 'air-assault',
      name: 'Air Assault',
      cost: 2,
      description: 'The side fielding the catapult has trained their forces to safely use the siege engine to launch them across the battlefield. As an adjacent creature main action, the catapult can be used to vertical push 10 any ally of size 1L or less. If the ally lands in an unoccupied space, they take no damage.',
    },
    {
      id: 'flammable',
      name: 'Flammable',
      cost: 2,
      description: 'Arcing Shot deals fire damage, and the area of that ability is on fire until the end of the encounter. Any creature who enters the area for the first time in a round or starts their turn there takes 2 fire damage.',
    },
  ],
};

/**
 * Exploding Mill Wheel (Level 3, Artillery Siege Engine)
 */
export const EXPLODING_MILL_WHEEL: CompendiumTerrain = {
  id: 'terrain-exploding-mill-wheel',
  name: 'Exploding Mill Wheel',
  description: 'A massive wooden wheel is loaded with explosives and rolled toward enemy forces or fortifications, ready to explode.',
  category: 'siege-engine',
  level: 3,
  role: { type: 'artillery', terrainType: 'siege-engine' },
  encounterValue: 10,
  size: 2,
  stamina: { base: 25, perSquare: 0 },
  deactivate: "As a maneuver, a creature adjacent to an exploding mill wheel that isn't rolling can make an Agility test.\n\n• 11 or lower: The creature accidentally activates the Roll the Wheel ability.\n• 12-16: The exploding mill wheel is deactivated but the creature is slowed (EoT).\n• 17+: The exploding mill wheel is deactivated and can't be used.\n\nOnce the wheel is rolling, it can't be deactivated. However, it can be exploded early by destroying it or blocking its movement with a suitably large creature or object.",
  abilities: [
    {
      id: 'roll-the-wheel',
      name: 'Roll the Wheel',
      usage: 'Main action (adjacent creature)',
      keywords: ['Area'],
      distance: 'Special',
      target: 'Each creature and object in the area',
      effectText: "When this ability is used and at the start of every turn thereafter, the exploding mill wheel rolls, moving 2 squares in a straight line. Each creature and object of size 2 or smaller in the area defined by the wheel's movement is targeted by a power roll.\n\n• 11 or lower: 5 damage; push 1\n• 12-16: 9 damage; push 2\n• 17+: 12 damage; push 3\n\nIf the wheel enters the space of any creature or object of size 3 or larger, or if it is reduced to 0 Stamina, its movement stops and it explodes. Each creature and object in a 5 burst centered on the wheel is targeted:\n\n• 11 or lower: 5 damage; push 1; M < 0 burning (save ends)\n• 12-16: 9 damage; push 2; M < 1 burning (save ends)\n• 17+: 12 damage; push 3; M < 2 burning (save ends)\n\nA burning creature takes 1d6 fire damage at the start of each of their turns.",
    },
  ],
  upgrades: [
    {
      id: 'piloted',
      name: 'Piloted',
      cost: 4,
      description: "The wheel has been fitted with a control mechanism and a pilot's seat for a creature of size 1M or smaller. As a move action, the pilot can turn the wheel in any direction while it is moving. As a main action, the pilot can leap out of the pilot's seat, landing in an adjacent space while the wheel continues moving in a straight line.",
    },
  ],
};

/**
 * Field Ballista (Level 2, Artillery Siege Engine)
 */
export const FIELD_BALLISTA: CompendiumTerrain = {
  id: 'terrain-field-ballista',
  name: 'Field Ballista',
  description: 'A massive crossbow fires thick metal bolts with devastating effect.',
  category: 'siege-engine',
  level: 2,
  role: { type: 'artillery', terrainType: 'siege-engine' },
  encounterValue: 8,
  size: 2,
  stamina: { base: 40, perSquare: 0 },
  deactivate: "As a maneuver, a creature adjacent to a field ballista can make an Agility test.\n\n• 11 or lower: The creature accidentally activates the Release Bolt ability.\n• 12-16: The field ballista is deactivated but the creature is slowed (EoT).\n• 17+: The field ballista is deactivated and can't be used.",
  abilities: [
    {
      id: 'release-bolt',
      name: 'Release Bolt',
      usage: 'Main action (adjacent creature)',
      keywords: ['Ranged', 'Strike', 'Weapon'],
      distance: 'Ranged 20',
      target: 'One creature or object',
      effect: {
        roll: 'Power Roll + 2',
        tier1: '5 damage',
        tier2: '8 damage; M < 1 push 1',
        tier3: '11 damage; M < 2 push 2',
      },
      effectText: "This ability can't be used again until the field ballista is reloaded.",
    },
    {
      id: 'reload',
      name: 'Reload',
      usage: 'Main action (adjacent creature)',
      effectText: 'The field ballista is reloaded, allowing Release Bolt to be used again. This action can be used only once per round.',
    },
    {
      id: 'spot',
      name: 'Spot',
      usage: 'Main action (adjacent creature)',
      effectText: 'The next use of Release Bolt gains an edge and has a +10 bonus to ranged distance. This action can be used only once per round.',
    },
    {
      id: 'move',
      name: 'Move',
      usage: 'Main action (adjacent creature)',
      effectText: 'The field ballista and the creature using this action move together up to 3 squares.',
    },
  ],
  upgrades: [
    {
      id: 'penetrating-bolt',
      name: 'Penetrating Bolt',
      cost: 2,
      description: 'The field ballista targets the nearest two additional creatures or objects in a straight line beyond the initial target.',
    },
    {
      id: 'chain-bolt',
      name: 'Chain Bolt',
      cost: 2,
      description: "The field ballista's bolts are set with heavy chains that wrap around targets. The Chain Bolt ability replaces Release Bolt, and the field ballista gains the Crank the Chain ability.",
    },
  ],
};

/**
 * Iron Dragon (Level 4, Artillery Siege Engine)
 */
export const IRON_DRAGON: CompendiumTerrain = {
  id: 'terrain-iron-dragon',
  name: 'Iron Dragon',
  description: 'A massive metal device uses a bellows system and liquid fuel to shoot out gouts of flame.',
  category: 'siege-engine',
  level: 4,
  role: { type: 'artillery', terrainType: 'siege-engine' },
  encounterValue: 12,
  size: 2,
  stamina: { base: 60, perSquare: 0 },
  deactivate: "As a maneuver, a creature adjacent to an iron dragon can make an Agility test.\n\n• 11 or lower: The creature accidentally activates the Gout of Flame ability.\n• 12-16: The iron dragon is deactivated but the creature is slowed (EoT).\n• 17+: The iron dragon is deactivated and can't be used.",
  abilities: [
    {
      id: 'gout-of-flame',
      name: 'Gout of Flame',
      usage: 'Main action (adjacent creature)',
      keywords: ['Area', 'Ranged'],
      distance: 'Line 8 × 2 within 1',
      target: 'Each creature and object in the area',
      effect: {
        roll: 'Power Roll + 2',
        tier1: '6 fire damage; A < 0 burning (save ends)',
        tier2: '10 fire damage; A < 1 burning (save ends)',
        tier3: '13 fire damage; A < 2 burning (save ends)',
      },
      effectText: "A burning creature takes 1d6 fire damage at the start of each of their turns. A burning object takes 1d6 fire damage at the end of each round. This ability can't be used again until the iron dragon is reloaded.",
    },
    {
      id: 'reload',
      name: 'Reload',
      usage: 'Main action (adjacent creature)',
      effectText: 'The iron dragon is reloaded, allowing Gout of Flame to be used again. This action can be used only once per round.',
    },
    {
      id: 'spot',
      name: 'Spot',
      usage: 'Main action (adjacent creature)',
      effectText: 'The next use of Gout of Flame gains an edge and has a +10 bonus to ranged distance. This action can be used only once per round.',
    },
    {
      id: 'move',
      name: 'Move',
      usage: 'Main action (adjacent creature)',
      effectText: 'The iron dragon and the creature using this action move together up to 2 squares.',
    },
  ],
};

/**
 * Watchtower (Level 2, Defender Fortification)
 */
export const WATCHTOWER: CompendiumTerrain = {
  id: 'terrain-watchtower',
  name: 'Watchtower',
  description: 'A sturdy wooden tower accessed by interior ladders or stairs provides cover and high ground for attackers.',
  category: 'siege-engine',
  level: 2,
  role: { type: 'defender', terrainType: 'fortification' },
  encounterValue: 8,
  size: 3,
  stamina: { base: 50, perSquare: 0 },
  deactivate: 'The watchtower must be completely destroyed.',
  features: [
    {
      id: 'high-ground',
      name: 'High Ground and Cover',
      description: "Creatures who have access to the watchtower's interior ladders or stairs have high ground and cover against creatures outside the watchtower.",
    },
    {
      id: 'getting-inside',
      name: 'Getting Inside',
      description: "A creature outside and adjacent to the watchtower can gain access to the interior by climbing it as an Agility test or breaking into it with a Might test.\n\n• 11 or lower: 1d6 damage; the creature remains outside the watchtower\n• 12-16: The creature remains outside the watchtower.\n• 17+: The creature gains access to the watchtower.",
    },
  ],
  upgrades: [
    {
      id: 'ballista-empowerment',
      name: 'Ballista Empowerment',
      cost: 12,
      description: "The watchtower is equipped with a field ballista that can be used by creatures in the watchtower. The ballista can't be moved.",
    },
    {
      id: 'boiling-oil-cauldron',
      name: 'Boiling Oil Cauldron',
      cost: 17,
      description: 'The watchtower is equipped with a boiling oil cauldron that can be used by creatures in the watchtower.',
    },
    {
      id: 'spyglass',
      name: 'Spyglass',
      cost: 2,
      description: 'Any creature in the watchtower can use the spyglass to search for hidden creatures around the tower, gaining an edge on the Intuition test and increasing the distance at which creatures can be spotted to 15 squares.',
    },
    {
      id: 'stone-tower',
      name: 'Stone Tower',
      cost: 2,
      description: 'The watchtower is reinforced with stone and has 75 Stamina.',
    },
    {
      id: 'iron-tower',
      name: 'Iron Tower',
      cost: 4,
      description: 'The watchtower is reinforced with stone and iron and has 100 Stamina.',
    },
  ],
};

/**
 * All Siege Engine terrains
 */
export const SIEGE_ENGINE_TERRAINS: CompendiumTerrain[] = [
  ARROW_LAUNCHER,
  BOILING_OIL_CAULDRON,
  CATAPULT,
  EXPLODING_MILL_WHEEL,
  FIELD_BALLISTA,
  IRON_DRAGON,
  WATCHTOWER,
];
