/**
 * Mechanism Terrains for Draw Steel
 *
 * Ported from Forgesteel (https://github.com/andyaiken/forgesteel)
 * Original work Copyright (c) Andy Aiken, Licensed under GPL-3.0
 *
 * Mechanical devices, traps, and triggers found in dungeons and fortifications.
 */

import type { CompendiumTerrain } from '@anvil/types';

/**
 * Column of Blades (Level 3, Defender Fortification)
 */
export const COLUMN_OF_BLADES: CompendiumTerrain = {
  id: 'terrain-column-of-blades',
  name: 'Column of Blades',
  description: 'A spinning wooden column is affixed with sharp blades to slash the unwary.',
  category: 'mechanism',
  level: 3,
  role: { type: 'defender', terrainType: 'fortification' },
  encounterValue: 3,
  size: '1L',
  stamina: { base: 5, perSquare: 0 },
  deactivate: 'The column of blades must be completely destroyed.',
  activate: 'A creature or object moves adjacent to the column of blades.',
  effect: 'The Spinning Blades ability.',
  alliedAwareness: "Allies who shift don't trigger the column. A creature observing an ally shift this way can make an Intuition test to shift in imitation of their movements.\n\n• 11 or lower: The creature triggers the column and the column's ability gains an edge.\n• 12-16: The creature triggers the column.\n• 17+: The creature doesn't trigger the column.",
  abilities: [
    {
      id: 'spinning-blades',
      name: 'Spinning Blades',
      usage: 'Triggered action',
      trigger: 'A creature or object moves within distance of the column.',
      keywords: ['Melee', 'Weapon', 'Strike'],
      distance: 'Melee 0',
      target: 'The triggering creature or object',
      effect: {
        roll: 'Power Roll + 2',
        tier1: '4 damage',
        tier2: '6 damage; M < 2 bleeding (save ends)',
        tier3: '9 damage; M < 3 bleeding (save ends)',
      },
    },
  ],
  upgrades: [
    {
      id: 'stone-column',
      name: 'Stone Column',
      cost: 1,
      description: 'The column is made of stone and has 8 Stamina.',
    },
    {
      id: 'metal-column',
      name: 'Metal Column',
      cost: 1,
      description: 'The column is made of metal and has 11 Stamina.',
    },
    {
      id: 'concealed',
      name: 'Concealed',
      cost: 1,
      description: 'The blades are concealed inside the column, which remains motionless until triggered.',
    },
    {
      id: 'spiked-flails',
      name: 'Spiked Flails',
      cost: 4,
      description: 'Instead of blades, the column is affixed with heavy spiked balls attached by long chains. The Whirling Flails ability replaces Spinning Blades.',
    },
  ],
};

/**
 * Dart Trap (Level 1, Ambusher Trap)
 */
export const DART_TRAP: CompendiumTerrain = {
  id: 'terrain-dart-trap',
  name: 'Dart Trap',
  description: 'A concealed dart thrower hurls missiles at short range.',
  category: 'mechanism',
  level: 1,
  role: { type: 'ambusher', terrainType: 'trap' },
  encounterValue: 1,
  direction: 'The dart trap fires in a fixed direction.',
  size: '1S',
  stamina: { base: 3, perSquare: 0 },
  hidden: true,
  deactivate: "As a maneuver, a creature adjacent to a dart trap can make an Agility test.\n\n• 11 or lower: The creature triggers the trap and is targeted by it.\n• 12-16: The trap is deactivated but the creature is slowed (EoT).\n• 17+: The trap is deactivated and doesn't trigger.",
  activate: 'A pressure plate, switch, or other linked trigger is activated.',
  effect: 'The Dart ability.',
  abilities: [
    {
      id: 'dart',
      name: 'Dart',
      usage: 'Triggered action',
      trigger: 'A pressure plate, switch, or other linked trigger is activated.',
      keywords: ['Ranged', 'Weapon', 'Strike'],
      distance: 'Ranged 5',
      target: 'One creature or object',
      effect: {
        roll: 'Power Roll + 2',
        tier1: '2 damage',
        tier2: '4 damage',
        tier3: '5 damage',
      },
    },
  ],
  upgrades: [
    {
      id: 'poison-darts',
      name: 'Poison Darts',
      cost: 2,
      description: 'The darts are tipped with poison. Any creature who takes damage from a dart also takes 1d6 poison damage at the start of each of their turns (save ends).',
    },
    {
      id: 'large-darts',
      name: 'Large Darts',
      cost: 1,
      description: "Larger, heavier darts impart kinetic force to the trap's attack. A target of the Dart ability is pushed 1 square on a tier 1 outcome, 2 squares on a tier 2 outcome, or 3 squares on a tier 3 outcome.",
    },
    {
      id: 'gatling-darts',
      name: 'Gatling Darts',
      cost: 4,
      description: 'The dart trap is equipped with multiple barrels to launch darts at a high rate of fire. The Dart ability loses the Ranged and Strike and takes the Area keyword, its area becomes a 5 × 1 line within 1, and it deals an extra 1d6 damage.',
    },
  ],
};

/**
 * Pillar (Level 2, Hexer Hazard)
 */
export const PILLAR: CompendiumTerrain = {
  id: 'terrain-pillar',
  name: 'Pillar',
  description: 'This stone pillar can be toppled onto unsuspecting foes with the right amount of damage or a well-engineered trigger mechanism.',
  category: 'mechanism',
  level: 2,
  role: { type: 'hexer', terrainType: 'hazard' },
  encounterValue: 3,
  direction: 'The pillar topples in a preset direction.',
  size: "One square that can't be moved through",
  stamina: { base: 6, perSquare: 0 },
  deactivate: "The pillar's linked trigger must be deactivated.",
  activate: 'The pillar is destroyed, or a pressure plate, switch, or other linked trigger is activated.',
  effect: 'The Toppling Pillar ability.',
  abilities: [
    {
      id: 'toppling-pillar',
      name: 'Toppling Pillar',
      usage: 'Triggered action',
      trigger: 'The pillar is destroyed, or a pressure plate, switch, or other linked trigger is activated.',
      keywords: ['Area'],
      distance: 'Line 4 × 1 within 1',
      target: 'Each creature and object in the area',
      effect: {
        roll: 'Power Roll + 2',
        tier1: '4 damage',
        tier2: '6 damage; M < 1 restrained (save ends)',
        tier3: '9 damage; M < 2 restrained (save ends)',
      },
      effectText: 'The area is difficult terrain.',
    },
  ],
  upgrades: [
    {
      id: 'metal-pillar',
      name: 'Metal Pillar',
      cost: 1,
      description: 'The pillar is made of metal, has 9 Stamina, and deals 1d6 extra damage.',
    },
    {
      id: 'multiple-pillars',
      name: 'Multiple Pillars',
      cost: 3,
      description: 'Multiple pillars can be used to represent a larger toppling object such as a wall. If triggered by destruction, all individual pillars need to be destroyed before the object falls.',
    },
  ],
};

/**
 * Portcullis (Level 3, Ambusher Trap)
 */
export const PORTCULLIS: CompendiumTerrain = {
  id: 'terrain-portcullis',
  name: 'Portcullis',
  description: 'A portcullis is hidden in the ceiling of a passage or choke point waiting to drop when activated.',
  category: 'mechanism',
  level: 3,
  role: { type: 'ambusher', terrainType: 'trap' },
  encounterValue: 4,
  area: '2 × 1-square area, up to a 4 × 2-square area',
  size: 'The area of the corridor to be blocked',
  stamina: { base: 0, perSquare: 9 },
  hidden: true,
  deactivate: "As a maneuver, a creature adjacent to a portcullis can make an Agility test.\n\n• 11 or lower: The creature triggers the portcullis and is affected as if in its area.\n• 12-16: The portcullis is deactivated but the creature is slowed (EoT).\n• 17+: The portcullis is deactivated and doesn't trigger.",
  activate: 'A pressure plate, switch, or other linked trigger is activated.',
  effect: 'The Heavy Gate ability.',
  abilities: [
    {
      id: 'heavy-gate',
      name: 'Heavy Gate',
      usage: 'Triggered action',
      trigger: 'A pressure plate, switch, or other linked trigger is activated.',
      keywords: ['Weapon', 'Area'],
      distance: 'Special (the area directly beneath the portcullis when it falls)',
      target: 'All creatures and objects',
      effect: {
        roll: 'Power Roll + 2',
        tier1: '3 damage; slide 1, ignoring stability',
        tier2: '7 damage; A < 2 restrained (save ends)',
        tier3: '10 damage; A < 3 restrained (save ends)',
      },
      effectText: 'The portcullis blocks movement from one side of it to the other. A target slid by the portcullis ends up on one side of it or the other (choose randomly). The portcullis must be manually reset.',
    },
  ],
};

/**
 * Pressure Plate (Level 1, Support Trigger)
 */
export const PRESSURE_PLATE: CompendiumTerrain = {
  id: 'terrain-pressure-plate',
  name: 'Pressure Plate',
  description: 'This mechanism acts as a trigger for another linked mechanism, and is skillfully hidden from view in the floor.',
  category: 'mechanism',
  level: 1,
  role: { type: 'support', terrainType: 'trigger' },
  encounterValue: 2,
  area: 'One square, up to a 4 × 4-square area',
  size: 'Any area',
  stamina: { base: 0, perSquare: 0 },
  link: 'A pressure plate is linked to another mechanism that it activates when triggered.',
  hidden: true,
  deactivate: "As a maneuver, a creature adjacent to a pressure plate can make an Agility test.\n\n• 11 or lower: The creature triggers the pressure plate.\n• 12-16: The pressure plate is deactivated but the creature is slowed (EoT).\n• 17+: The pressure plate is deactivated and doesn't trigger.",
  activate: 'The pressure plate is calibrated to be triggered by creatures or objects of a particular size. The pressure plate triggers when a creature or object of the appropriate size enters its area.',
  effect: 'The linked mechanism is activated. A pressure plate automatically resets and can be triggered repeatedly.',
  upgrades: [
    {
      id: 'tripwire',
      name: 'Tripwire',
      cost: -1,
      description: 'The pressure plate is a tripwire, which can trigger once and must be manually reset. A concealed tripwire can be discovered with an easy Intuition test.',
    },
  ],
};

/**
 * Pulley (Level 1, Support Trigger)
 */
export const PULLEY: CompendiumTerrain = {
  id: 'terrain-pulley',
  name: 'Pulley',
  description: 'A counterweighted pulley system can be used to quickly ascend to the top of a wall, scaffold, tower, or other structure.',
  category: 'mechanism',
  level: 1,
  role: { type: 'support', terrainType: 'trigger' },
  encounterValue: 1,
  size: '1S',
  stamina: { base: 1, perSquare: 0 },
  deactivate: "As a maneuver, a creature adjacent to a pulley can make an Agility test.\n\n• 11 or lower: The creature triggers the pulley.\n• 12-16: The pulley is deactivated but the creature is slowed (EoT).\n• 17+: The pulley is deactivated and doesn't trigger.",
  activate: 'A creature adjacent to the pulley uses a maneuver to release the pulley.',
  effect: "The triggering creature is lifted to the top of the structure the pulley is attached to. The pulley must be manually reset.",
  features: [
    {
      id: 'climbable',
      name: 'Climbable',
      description: "A creature adjacent to the pulley can climb its ropes with an easy Agility test to ascend to the top of the structure it's attached to.",
    },
  ],
  upgrades: [
    {
      id: 'looped-chain',
      name: 'Looped Chain',
      cost: 1,
      description: 'Instead of a rope and pulley, the system uses a counterweighted looped chain. A looped chain automatically resets and can be triggered repeatedly.',
    },
  ],
};

/**
 * Ram (Level 2, Ambusher Trap)
 */
export const RAM: CompendiumTerrain = {
  id: 'terrain-ram',
  name: 'Ram',
  description: 'A heavy wooden ram drops down or swings into the fray, crushing all in its path.',
  category: 'mechanism',
  level: 2,
  role: { type: 'ambusher', terrainType: 'trap' },
  encounterValue: 3,
  area: '1 × 3-square area or a 2 × 2-square area',
  direction: 'One side of the ram is defined as the front.',
  size: "Any area; the area can't be moved through",
  stamina: { base: 0, perSquare: 3 },
  hidden: true,
  deactivate: "As a maneuver, a creature adjacent to a ram can make an Agility test.\n\n• 11 or lower: The creature triggers the ram and is affected as if in its space.\n• 12-16: The ram is deactivated but the creature is slowed (EoT).\n• 17+: The ram is deactivated and doesn't trigger.",
  activate: 'A pressure plate, switch, or other linked trigger is activated.',
  effect: 'The Ram ability.',
  abilities: [
    {
      id: 'ram-ability',
      name: 'Ram',
      usage: 'Triggered action',
      trigger: 'A pressure plate, switch, or other linked trigger is activated.',
      keywords: ['Weapon', 'Area'],
      distance: 'Special (the path the ram moves through from its starting position)',
      target: 'Each creature and object in the area',
      effect: {
        roll: 'Power Roll + 2',
        tier1: '3 damage; slide 1, ignoring stability',
        tier2: '6 damage; push 3',
        tier3: '9 damage; push 5',
      },
      effectText: 'A target slid by the ram ends up on one side of it or the other (choose randomly). The ram must be manually reset.',
    },
  ],
  upgrades: [
    {
      id: 'stone',
      name: 'Stone',
      cost: 1,
      description: 'The ram is made of stone, has 6 Stamina per square, and deals an extra 1d3 damage.',
    },
    {
      id: 'metal',
      name: 'Metal',
      cost: 2,
      description: 'The ram is made of metal, has 9 Stamina per square, and deals an extra 1d6 damage.',
    },
    {
      id: 'repeating',
      name: 'Repeating',
      cost: 1,
      description: 'The ram automatically resets at the start of each round.',
    },
    {
      id: 'rapid-repeating',
      name: 'Rapid Repeating',
      cost: 3,
      description: 'The ram automatically resets at the start of each turn.',
    },
    {
      id: 'multiple-rams',
      name: 'Multiple Rams',
      cost: 3,
      description: 'Multiple rams can be used to represent a larger mechanism, such as a stack of tumbling logs.',
    },
  ],
};

/**
 * Switch (Level 1, Support Trigger)
 */
export const SWITCH: CompendiumTerrain = {
  id: 'terrain-switch',
  name: 'Switch',
  description: 'Set into any surface, this mechanism acts as a trigger for another linked mechanism.',
  category: 'mechanism',
  level: 1,
  role: { type: 'support', terrainType: 'trigger' },
  encounterValue: 1,
  size: '1T',
  stamina: { base: 3, perSquare: 0 },
  link: 'A switch is linked to another mechanism that it activates when triggered.',
  deactivate: "As a maneuver, a creature adjacent to a switch can make an Agility test.\n\n• 11 or lower: The creature triggers the switch.\n• 12-16: The switch is deactivated but the creature is slowed (EoT).\n• 17+: The switch is deactivated and doesn't trigger.",
  activate: 'A creature adjacent to the switch uses a maneuver to trigger it.',
  effect: 'The linked mechanism is activated. A switch automatically resets and can be triggered repeatedly.',
  upgrades: [
    {
      id: 'concealed',
      name: 'Concealed',
      cost: 1,
      description: 'The switch is hidden until triggered or detected.',
    },
  ],
};

/**
 * All Mechanism terrains
 */
export const MECHANISM_TERRAINS: CompendiumTerrain[] = [
  COLUMN_OF_BLADES,
  DART_TRAP,
  PILLAR,
  PORTCULLIS,
  PRESSURE_PLATE,
  PULLEY,
  RAM,
  SWITCH,
];
