/**
 * Supernatural Object Terrains for Draw Steel
 *
 * Ported from Forgesteel (https://github.com/andyaiken/forgesteel)
 * Original work Copyright (c) Andy Aiken, Licensed under GPL-3.0
 *
 * Powerful magical artifacts and relics that dominate the battlefield.
 */

import type { CompendiumTerrain } from '@anvil/types';

/**
 * The Black Obelisk (Level 3, Controller Relic)
 */
export const THE_BLACK_OBELISK: CompendiumTerrain = {
  id: 'terrain-the-black-obelisk',
  name: 'The Black Obelisk',
  description: 'A foreboding obelisk shaped of dark stone harrows the minds and spirits of those around it.',
  category: 'supernatural',
  level: 3,
  role: { type: 'controller', terrainType: 'relic' },
  encounterValue: 20,
  size: 2,
  stamina: { base: 100, perSquare: 0 },
  deactivate: "As a maneuver, a creature adjacent to the black obelisk can make a Reason test.\n\n• 11 or lower: The creature accidentally activates the Your Fears Become Manifest ability, which gains an edge.\n• 12-16: The creature must make another test to deactivate the obelisk. If they obtain this outcome a second time, they accidentally activate Your Fears Become Manifest.\n• 17+: The obelisk is deactivated until the end of the encounter.",
  activate: 'A new round starts.',
  effect: 'The Your Fears Become Manifest ability.',
  abilities: [
    {
      id: 'your-fears-become-manifest',
      name: 'Your Fears Become Manifest',
      usage: 'Triggered action',
      trigger: 'A new round starts.',
      keywords: ['Area', 'Magic'],
      distance: 'Burst 10',
      target: 'Each enemy in the area',
      effect: {
        roll: 'Power Roll + 2',
        tier1: 'P < 1 slowed (EoT)',
        tier2: 'P < 2 slowed and weakened (EoT)',
        tier3: 'P < 3 frightened, slowed, and weakened (EoT)',
      },
      effectText: 'The target is pushed 2.',
    },
  ],
};

/**
 * The Chronal Hypercube (Level 3, Controller Relic)
 */
export const THE_CHRONAL_HYPERCUBE: CompendiumTerrain = {
  id: 'terrain-the-chronal-hypercube',
  name: 'The Chronal Hypercube',
  description: 'This unnatural object twists space around it in a reflection of its own unnatural form.',
  category: 'supernatural',
  level: 3,
  role: { type: 'controller', terrainType: 'relic' },
  encounterValue: 20,
  size: '1M',
  stamina: { base: 80, perSquare: 0 },
  deactivate: "A creature who has the Psionics skill can deactivate and take control of the chronal hypercube by making a Reason test while within 10 squares of the hypercube.\n\n• 11 or lower: The creature takes 1d6 psychic damage.\n• 12-16: The creature fails to deactivate the hypercube.\n• 17+: The hypercube teleports adjacent to the creature at the start of the next round and becomes an ally to the creature and their allies.",
  features: [
    {
      id: 'dimensional-flicker',
      name: 'Dimensional Flicker',
      description: "At the start of each round while the hypercube is present, roll a d10. On a 7 or higher, the hypercube teleports to a square of one ally's choice within 10 squares and is hidden. While the hypercube is hidden, Psionics is the only skill that can be applied to a test made to find it.",
    },
    {
      id: 'chronal-superhighway',
      name: 'Chronal Superhighway',
      description: 'Any ally within 10 squares of the hypercube can teleport when they move. An ally who teleports gains an edge on the next power roll they make.',
    },
  ],
};

/**
 * The Throne of A'An (Level 4, Controller Relic)
 */
export const THE_THRONE_OF_AAN: CompendiumTerrain = {
  id: 'terrain-the-throne-of-aan',
  name: "The Throne of A'An",
  description: "The throne of A'An, sun god of the Antical Protectorate in what is now Vanigar, retains some of her power from the age before she was slain to end the Age of Suns—and plunge the region into eternal winter.",
  category: 'supernatural',
  level: 4,
  role: { type: 'controller', terrainType: 'relic' },
  encounterValue: 24,
  size: 2,
  stamina: { base: 140, perSquare: 0 },
  deactivate: "The throne of A'An can be deactivated only by the current hierophant of A'An (see Sitting on the Throne), who must succeed on a Presence test that takes a bane to do so.\n\n• 11 or lower: The hierophant triggers the Nova ability.\n• 12-16: The hierophant fails to deactivate the throne.\n• 17+: The throne is deactivated until the end of the encounter.",
  features: [
    {
      id: 'light-of-the-northern-sun',
      name: 'Light of the Northern Sun',
      description: "In the Age of Suns, there was no darkness and no night. Even among the many suns of that time, the light of A'An was the brightest. The throne of A'An manifests the sun powers of that god, even when no one is seated in it. The following effects always occur within 10 squares of the throne:\n\n• The throne sheds bright light that negates all darkness and concealment, and which prevents creatures from being hidden.\n• Any creature with cold immunity has fire weakness 10.\n• Any creature who uses an ability that deals cold damage takes 11 fire damage.",
    },
    {
      id: 'sitting-on-the-throne',
      name: 'Sitting on the Throne',
      description: "Only a creature attuned to the throne can sit on it. A creature adjacent to the throne can use a main action to attune to it by succeeding on a Presence test.\n\n• 11 or lower: The creature takes 11 fire damage.\n• 12-16: The creature fails to attune to the throne.\n• 17+: The creature attunes to the throne and can sit on it.\n\nA creature seated on the throne becomes the hierophant of A'An and gains:\n• Fire immunity 10 (for hierophant and allies within 10 squares)\n• Allies within 10 squares can choose to deal fire damage instead of their usual damage\n• +5 bonus to stability, bane on strikes against hierophant (unless attacker is also attuned)\n• Access to Primordial Flare and Solar Accretion abilities",
    },
  ],
  abilities: [
    {
      id: 'primordial-flare',
      name: 'Primordial Flare',
      usage: 'Maneuver',
      keywords: ['Magic', 'Ranged', 'Strike'],
      distance: 'Ranged 20',
      target: 'One creature or object',
      effect: {
        roll: 'Power Roll + 2',
        tier1: '6 fire damage',
        tier2: '11 fire damage',
        tier3: '14 fire damage',
      },
      effectText: "The target has fire weakness 10 until the start of the hierophant's next turn.",
    },
    {
      id: 'solar-accretion',
      name: 'Solar Accretion',
      usage: 'Triggered action',
      trigger: 'A target within distance is made winded or is reduced to 0 Stamina by fire damage.',
      keywords: ['Magic', 'Ranged'],
      distance: 'Ranged 10',
      target: 'One creature',
      effectText: 'If the hierophant is a hero, they gain 3 of their Heroic Resource. If the hierophant is a Director-controlled creature, the Director gains 3 Malice.',
    },
    {
      id: 'nova',
      name: 'Nova',
      usage: 'Triggered action',
      trigger: 'The throne is destroyed or the hierophant obtains a tier 1 outcome on the test to deactivate it.',
      keywords: ['Area', 'Magic'],
      distance: 'Burst 10',
      target: 'Each creature and object in the area',
      effectText: "Each target takes 14 fire damage and the Hierophant gains the Incubator of A'An complication. If there is no hierophant, one creature within 10 squares of the throne chosen by the Director gains this complication.",
    },
  ],
};

/**
 * All Supernatural Object terrains
 */
export const SUPERNATURAL_TERRAINS: CompendiumTerrain[] = [
  THE_BLACK_OBELISK,
  THE_CHRONAL_HYPERCUBE,
  THE_THRONE_OF_AAN,
];
