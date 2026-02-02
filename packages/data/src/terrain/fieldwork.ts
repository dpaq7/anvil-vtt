/**
 * Fieldwork Terrains for Draw Steel
 *
 * Ported from Forgesteel (https://github.com/andyaiken/forgesteel)
 * Original work Copyright (c) Andy Aiken, Licensed under GPL-3.0
 *
 * Man-made traps and fortifications set up on the battlefield.
 */

import type { CompendiumTerrain } from '@anvil/types';

/**
 * Archer's Stakes (Level 1, Defender Fortification)
 */
export const ARCHERS_STAKES: CompendiumTerrain = {
  id: 'terrain-archers-stakes',
  name: "Archer's Stakes",
  description: 'A series of sharp stakes have been placed point-out to protect defenders against charges and other direct attacks.',
  category: 'fieldwork',
  level: 1,
  role: { type: 'defender', terrainType: 'fortification' },
  encounterValue: 1,
  area: '4 x 1-square area',
  direction: 'One side of the stakes is defined as the front.',
  size: 'One or more squares of difficult terrain',
  stamina: { base: 0, perSquare: 3 },
  deactivate: 'Each square of stakes must be individually destroyed.',
  activate: 'A creature enters an area of stakes from the front.',
  effect: 'The triggering creature takes 2 damage per square of stakes they enter. If they are force moved into an area of stakes, they take an additional 3 damage.',
  alliedAwareness: "Allies of this object ignore the difficult terrain created by the stakes, take no damage from moving through the stakes unless they are force moved, and have cover while in an area of archer's stakes.",
  upgrades: [
    {
      id: 'poison',
      name: 'Poison',
      cost: 2,
      description: 'The tips of the stakes have poison applied to them. Any creature who takes damage from the stakes also takes 1d6 poison damage at the start of each of their turns (save ends).',
    },
    {
      id: 'sticky',
      name: 'Sticky',
      cost: 3,
      description: "A sticky slime or webbing has been applied to the stakes and the ground between them. Any creature who enters an area of stakes triggers the Sticky Stakes ability in addition to suffering the stake's other effects.",
    },
  ],
};

/**
 * Bear Trap (Level 1, Ambusher Trap)
 */
export const BEAR_TRAP: CompendiumTerrain = {
  id: 'terrain-bear-trap',
  name: 'Bear Trap',
  description: 'A set of spring-loaded steel jaws stands ready to snap shut when stepped on.',
  category: 'fieldwork',
  level: 1,
  role: { type: 'ambusher', terrainType: 'trap' },
  encounterValue: 2,
  size: '1S',
  stamina: { base: 6, perSquare: 0 },
  hidden: true,
  deactivate: "As a maneuver, a creature adjacent to a bear trap can make an Agility test.\n\n• 11 or lower: The creature triggers the trap and is affected as if in its space.\n• 12-16: The trap is deactivated but the creature is slowed (EoT).\n• 17+: The trap is deactivated and doesn't trigger.",
  activate: 'The bear trap is calibrated to be triggered by creatures or objects of a particular size or larger. The trap triggers when a creature or object of the appropriate size enters its space.',
  effect: 'A triggering creature or object ends their movement and is targeted by the Bear Trap ability.',
  abilities: [
    {
      id: 'bear-trap-ability',
      name: 'Bear Trap',
      usage: 'Triggered action',
      trigger: "A creature or object of the appropriate size enters the trap's space.",
      keywords: ['Melee', 'Weapon', 'Strike'],
      distance: 'Melee 0',
      target: 'The triggering creature or object',
      effect: {
        roll: 'Power Roll + 2',
        tier1: 'The target shifts 1 square away from the trap.',
        tier2: '3 damage; A < 1 slowed (save ends)',
        tier3: '5 damage; A < 2 slowed (save ends)',
      },
      effectText: 'The bear trap must be manually reset.',
    },
  ],
  upgrades: [
    {
      id: 'chain',
      name: 'Chain',
      cost: 1,
      description: 'The bear trap is attached to the ground by a steel chain. A target who would be made slowed by the trap is restrained instead.',
    },
  ],
};

/**
 * Flammable Oil (Level 1, Ambusher Trap)
 */
export const FLAMMABLE_OIL: CompendiumTerrain = {
  id: 'terrain-flammable-oil',
  name: 'Flammable Oil',
  description: 'A patch of flammable oil or pitch on the ground is ready to be ignited.',
  category: 'fieldwork',
  level: 1,
  role: { type: 'ambusher', terrainType: 'trap' },
  encounterValue: 2,
  area: '10x10',
  size: 'One or more squares',
  stamina: { base: 0, perSquare: 0 },
  deactivate: "As a maneuver, a creature adjacent to a patch of flammable oil can make an Agility test.\n\n• 11 or lower: The creature ignites the oil and is affected as if in its area.\n• 12-16: The oil temporarily ignites before safely burning out, and the creature takes 3 fire damage and is burning (save ends).\n• 17+: The oil is rendered safe and can't be ignited.",
  activate: 'A creature or object in a square of oil takes fire damage, or a creature or object enters a square of burning oil or starts their turn there.',
  effect: 'The triggering creature or object takes 3 fire damage and is burning (save ends). A burning creature takes 1d6 fire damage at the start of each of their turns. A burning object takes 1d6 fire damage at the end of each round.',
  alliedAwareness: 'Allies who have weapons are equipped with torches. Any ally can use a maneuver to throw a torch up to 5 squares and ignite the flammable oil.',
  upgrades: [
    {
      id: 'concealed',
      name: 'Concealed Oil',
      cost: 1,
      description: 'The oil is hidden until it ignites.',
    },
  ],
};

/**
 * Hidey Hole (Level 1, Ambusher Fortification)
 */
export const HIDEY_HOLE: CompendiumTerrain = {
  id: 'terrain-hidey-hole',
  name: 'Hidey Hole',
  description: 'A cavity in a floor, wall, or ceiling might hold hidden threats.',
  category: 'fieldwork',
  level: 1,
  role: { type: 'ambusher', terrainType: 'fortification' },
  encounterValue: 1,
  size: 'One or more squares',
  stamina: { base: 0, perSquare: 0 },
  deactivate: "As a maneuver, a creature adjacent to a hidey-hole can make a Might test.\n\n• 11 or lower: The creature is restrained (save ends).\n• 12-16: The hidey-hole collapses but the creature is slowed (save ends).\n• 17+: The hidey-hole collapses and can no longer be used until repaired.",
  activate: 'A creature starts the encounter in the hidey-hole or ends their turn there.',
  effect: 'The triggering creature can attempt to hide as a free triggered action.',
  upgrades: [
    {
      id: 'network',
      name: 'Network',
      cost: 1,
      description: "The hidey-hole is connected to a tunnel network. A creature familiar with the network can move from one hidey-hole to any space adjacent to a connected hidey-hole if they have movement available equal to the straight-line distance to that space. A creature unfamiliar with the network can use a maneuver to make a hard Intuition test to discover a connected hidey-hole.",
    },
  ],
};

/**
 * Pavise Shield (Level 1, Defender Fortification)
 */
export const PAVISE_SHIELD: CompendiumTerrain = {
  id: 'terrain-pavise-shield',
  name: 'Pavise Shield',
  description: 'A reinforced metal shield embedded in the ground that acts as cover for the creature controlling it.',
  category: 'fieldwork',
  level: 1,
  role: { type: 'defender', terrainType: 'fortification' },
  encounterValue: 1,
  size: '1M',
  stamina: { base: 9, perSquare: 0 },
  deactivate: "As a maneuver, a creature adjacent to a pavise shield controlled by another creature can make a Might test.\n\n• 11 or lower: The creature controlling the shield retains control of it and can make an opportunity attack against the creature making the test.\n• 12-16: The creature controlling the shield retains control of it.\n• 17+: The creature making the test grabs the shield and takes control of it.",
  effect: 'While a creature has the pavise grabbed they have cover and take half damage from abilities whose line of effect extends through the shield. The pavise takes the other half of the damage.',
  features: [
    {
      id: 'movement',
      name: 'Movement',
      description: 'While a creature has a pavise shield grabbed, their speed is halved and they move the shield like a grabbed creature.',
    },
  ],
};

/**
 * Snare Trap (Level 1, Ambusher Trap)
 */
export const SNARE_TRAP: CompendiumTerrain = {
  id: 'terrain-snare-trap',
  name: 'Snare Trap',
  description: 'A rope snare is set to grab a target, leaving them hanging upside down.',
  category: 'fieldwork',
  level: 1,
  role: { type: 'ambusher', terrainType: 'trap' },
  encounterValue: 1,
  size: '1S',
  stamina: { base: 1, perSquare: 0 },
  hidden: true,
  deactivate: "As a maneuver, a creature adjacent to a snare trap can make an Agility test.\n\n• 11 or lower: The creature triggers the trap and is affected as if in its space.\n• 12-16: The trap is deactivated but the creature is slowed (EoT).\n• 17+: The trap is deactivated and doesn't trigger.",
  activate: 'The snare trap is calibrated to be triggered by creatures or objects of a particular size or larger. The trap triggers when a creature or object of the appropriate size enters its space.',
  effect: 'A triggering creature or object ends their movement and is targeted by the Snare ability.',
  abilities: [
    {
      id: 'snare',
      name: 'Snare',
      usage: 'Triggered action',
      trigger: "A creature or object of the appropriate size enters the trap's space.",
      keywords: ['Melee', 'Weapon', 'Strike'],
      distance: 'Melee 0',
      target: 'The triggering creature or object',
      effect: {
        roll: 'Power Roll + 2',
        tier1: 'The target shifts 1 square away from the snare.',
        tier2: '1 damage; A < 1 restrained (save ends)',
        tier3: '3 damage; A < 2 restrained (save ends)',
      },
      effectText: 'A creature restrained by this ability is vertically pulled 2 and suspended in the air by the snare line. On a successful save, the snare is cut or breaks and the creature falls to the ground. The snare must be manually reset.',
    },
  ],
  upgrades: [
    {
      id: 'net-trap',
      name: 'Net Trap',
      cost: 1,
      description: "The snare becomes a net that can wrap up multiple targets. The net has 3 Stamina and fills an area of 3 squares by 3 squares. The Snare ability loses its existing keywords, gains the Area keyword, and targets each creature or object in the area. The trap can be triggered by a target moving through one specific square, or by requiring multiple squares to be moved through. Any creature who makes their save to end the restrained effect ends that effect for all targets, who all fall to the ground.",
    },
  ],
};

/**
 * Spike Trap (Level 2, Ambusher Trap)
 */
export const SPIKE_TRAP: CompendiumTerrain = {
  id: 'terrain-spike-trap',
  name: 'Spike Trap',
  description: 'A pit dug into the ground is filled with spikes, and camouflaged to avoid detection.',
  category: 'fieldwork',
  level: 2,
  role: { type: 'ambusher', terrainType: 'trap' },
  encounterValue: 3,
  area: '2 x 2-square area',
  size: 'One or more squares',
  stamina: { base: 6, perSquare: 0 },
  hidden: true,
  deactivate: "As a maneuver, a creature adjacent to a spike trap can make an Agility test.\n\n• 11 or lower: The creature triggers the trap and is affected as if in its area.\n• 12-16: The trap is deactivated but the creature is slowed (EoT).\n• 17+: The trap is deactivated and doesn't trigger.",
  activate: "The spike trap is calibrated to be triggered by creatures or objects of a particular size or larger. The trap triggers when a creature or object of the appropriate size enters its area.",
  effect: 'The Spike Trap ability.',
  abilities: [
    {
      id: 'spike-trap-ability',
      name: 'Spike Trap',
      usage: 'Triggered action',
      trigger: "A creature or object of the appropriate size enters the trap's area.",
      keywords: ['Weapon', 'Area'],
      distance: 'Melee',
      target: 'The triggering creature or object',
      effect: {
        roll: 'Power Roll + 2',
        tier1: '3 damage; the target shifts 1 square away from the trap',
        tier2: '4 damage; the target falls into the pit; A < 0 prone',
        tier3: '6 damage; the target falls into the pit; A < 1 prone; restrained (save ends)',
      },
      effectText: "The target ends their movement when they enter the trap's area. The pit is typically 2 squares deep. The trap must be manually reset.",
    },
  ],
};

/**
 * All Fieldwork terrains
 */
export const FIELDWORK_TERRAINS: CompendiumTerrain[] = [
  ARCHERS_STAKES,
  BEAR_TRAP,
  FLAMMABLE_OIL,
  HIDEY_HOLE,
  PAVISE_SHIELD,
  SNARE_TRAP,
  SPIKE_TRAP,
];
