/**
 * Lightbender Monsters for Draw Steel
 *
 * Ported from Forgesteel (https://github.com/andyaiken/forgesteel)
 * Original work Copyright (c) Andy Aiken, Licensed under GPL-3.0
 *
 * Lightbenders are predatory lion-like creatures with light-bending abilities.
 */

import type { CompendiumMonster, MonsterFeature } from '../types/monster.js';

/**
 * Lightbender group lore
 */
export const LIGHTBENDER_LORE = {
  name: 'Lightbender',
  description: 'Lightbenders prowl deserts, plains, forests—any sunbathed wilderness where they can take advantage of the adaptations that make them skilled daylight predators. This monstrous creature\'s fur bends and refracts light from the surrounding environment, producing mirages that distract and confuse their prey.',
  information: [
    {
      name: 'Hidden Hunters',
      description: 'At a distance, a lightbender looks akin to a regular lion, but closer inspection reveals their glowing eyes, iridescent mane, and a pair of lashing tails spiked with refractive crystals. The lightbender\'s pelt magically warps light around them to disguise their movement, letting them teleport while leaving behind a past visual imprint. Unsuspecting prey rarely realize they\'re staring at an afterimage of the lightbender until the predator pounces.',
    },
    {
      name: 'Ghostly Echoes',
      description: 'Lightbenders can also bend the sounds they make, enabling them to almost completely disappear during a hunt. Many can delay their footsteps to slip into a silent prowl, while others might throw a guttural trill across a field to lure prey out of hiding. The lightbenders\' illusory mastery was said to inspire several techniques taught to shadows within the College of the Harlequin Mask.',
    },
    {
      name: 'Protective Companions',
      description: 'Though lightbenders are typically solitary creatures, they sometimes cross into another lightbender\'s territory to help protect a newborn litter of kittens. A few people have succeeded in taming lightbenders as guards or hunting beasts, and if treated well, they can make loyal protectors, often viewing their smaller humanoid companions as surrogate kittens.',
    },
  ],
  malice: [
    {
      name: 'Silent Prowl',
      cost: 3,
      description: 'Each lightbender acting this turn can teleport up to their speed as a move action and attempt to hide as a free maneuver, all until the start of their next turn.',
    },
    {
      name: 'Duplicate',
      cost: 5,
      description: 'Each lightbender acting this turn can create a duplicate lightbender in an unoccupied space adjacent to them. The duplicate is indistinguishable from the lightbender except by supernatural means, has 1 Stamina, and has the lightbender\'s speed. A duplicate acts on the lightbender\'s turn but can take only move actions. Once per round before or after using an ability, a lightbender can trade places with any lightbender duplicate.',
    },
    {
      name: 'Everything the Light Touches',
      cost: 7,
      description: 'Each lightbender in the encounter shines radiantly, distorting the senses of any enemy within 5 squares of them. Each affected enemy makes a Reason test. T1: The target doesn\'t have line of effect to any lightbender (save ends). T2: The target doesn\'t have line of effect to any lightbender (EoT). T3: No effect.',
    },
  ],
};

/**
 * Lightbender (Elite Ambusher, Level 3)
 */
export const LIGHTBENDER: CompendiumMonster = {
  _id: 'forgesteel/monsters/lightbender',
  _category: 'monsters',
  _filename: 'lightbender',
  type: 'statblock',
  name: 'Lightbender',
  level: 3,
  roles: ['Ambusher'],
  ancestry: ['Beast', 'Lightbender'],
  ev: '20',
  stamina: '100',
  speed: 10,
  size: '2',
  stability: 1,
  free_strike: 6,
  might: 2,
  agility: 1,
  reason: -3,
  intuition: 1,
  presence: -1,
  flavor: LIGHTBENDER_LORE.description,
  features: [
    {
      type: 'feature',
      feature_type: 'ability',
      name: 'Flash Swipe',
      icon: '🗡',
      ability_type: 'Signature Ability',
      keywords: ['Melee', 'Strike', 'Weapon'],
      usage: 'Main Action',
      distance: 'Melee 2',
      target: 'One creature or object',
      effects: [
        {
          roll: 'Power Roll + 2',
          tier1: '9 damage',
          tier2: '14 damage',
          tier3: '18 damage',
        },
        {
          name: 'Effect',
          effect: 'If this ability gains an edge or has a double edge, it deals an extra 4 damage.',
        },
      ],
    },
    {
      type: 'feature',
      feature_type: 'ability',
      name: 'Piercing Tails',
      icon: '🗡',
      keywords: ['Melee', 'Strike', 'Weapon'],
      usage: 'Main Action',
      distance: 'Melee 2',
      target: 'One creature or object',
      effects: [
        {
          roll: 'Power Roll + 2',
          tier1: '8 damage',
          tier2: '12 damage; M < 1 bleeding (save ends)',
          tier3: '15 damage; M < 2 bleeding (save ends)',
        },
        {
          name: 'Effect',
          effect: 'While bleeding this way, the target takes a bane on tests to search for the lightbender while they are hidden.',
        },
      ],
    },
    {
      type: 'feature',
      feature_type: 'ability',
      name: 'Hypnotic Mane',
      icon: '🔳',
      keywords: ['Area', 'Magic'],
      usage: 'Maneuver',
      distance: 'Burst 3',
      target: 'Each enemy in the area',
      effects: [
        {
          cost: '5 Malice',
        },
        {
          roll: 'Power Roll + 2',
          tier1: 'I < 0 dazed (save ends)',
          tier2: 'I < 1 dazed (save ends)',
          tier3: 'I < 2 dazed (save ends)',
        },
        {
          name: 'Effect',
          effect: 'While dazed this way, a target has speed 0. If a target takes damage, or if someone else uses a main action to shake the target out of their stupor, the dazed condition ends.',
        },
      ],
    },
    {
      type: 'feature',
      feature_type: 'ability',
      name: 'Stalker\'s Afterimage',
      icon: '❗',
      keywords: ['Magic'],
      usage: 'Triggered action',
      distance: 'Self',
      target: 'Self',
      trigger: 'The lightbender takes damage from a strike.',
      effects: [
        {
          name: 'Effect',
          effect: 'The lightbender halves the damage, ignores any nondamaging effects associated with it, and can teleport up to 5 squares. If they teleport into concealment or cover, the lightbender can immediately attempt to hide as a free maneuver.',
        },
      ],
    },
    {
      type: 'feature',
      feature_type: 'trait',
      name: 'Avoidance',
      icon: '⭐',
      effects: [
        {
          effect: 'Any effect on the lightbender that would be ended by a saving throw instead ends automatically at the end of their next turn.',
        },
      ],
    },
  ],
};

/**
 * Lightbender Pouncer (Elite Harrier, Level 3)
 */
export const LIGHTBENDER_POUNCER: CompendiumMonster = {
  _id: 'forgesteel/monsters/lightbender-pouncer',
  _category: 'monsters',
  _filename: 'lightbender',
  type: 'statblock',
  name: 'Lightbender Pouncer',
  level: 3,
  roles: ['Harrier'],
  ancestry: ['Beast', 'Lightbender'],
  ev: '20',
  stamina: '100',
  speed: 10,
  size: '2',
  stability: 1,
  free_strike: 5,
  might: 2,
  agility: 2,
  reason: -3,
  intuition: 1,
  presence: -1,
  flavor: 'A more agile variant of the lightbender, specialized in pouncing attacks.',
  features: [
    {
      type: 'feature',
      feature_type: 'ability',
      name: 'Pounce',
      icon: '🗡',
      ability_type: 'Signature Ability',
      keywords: ['Charge', 'Melee', 'Strike', 'Weapon'],
      usage: 'Main Action',
      distance: 'Melee 2',
      target: 'Two creatures or objects',
      effects: [
        {
          roll: 'Power Roll + 2',
          tier1: '7 damage',
          tier2: '11 damage; A < 1 prone',
          tier3: '14 damage; A < 2 prone',
        },
        {
          name: 'Effect',
          effect: 'The pouncer can make a free strike against each target they knock prone.',
        },
      ],
    },
    {
      type: 'feature',
      feature_type: 'ability',
      name: 'Sparkling Tail Whip',
      icon: '🔳',
      keywords: ['Area', 'Magic'],
      usage: 'Main Action',
      distance: 'Burst 2',
      target: 'Each enemy and object in the area',
      effects: [
        {
          roll: 'Power Roll + 2',
          tier1: '4 damage',
          tier2: '7 damage; A < 1 the target is dazzled (save ends)',
          tier3: '10 damage; A < 2 the target is dazzled (save ends)',
        },
        {
          name: 'Effect',
          effect: 'A dazzled target takes a bane on strikes and has line of effect only within 1 square.',
        },
      ],
    },
    {
      type: 'feature',
      feature_type: 'ability',
      name: 'Illusory Feint',
      icon: '🔳',
      keywords: ['Area', 'Magic', 'Ranged'],
      usage: 'Maneuver',
      distance: '3 cube within 10',
      target: 'Each enemy in the area',
      effects: [
        {
          cost: '5 Malice',
        },
        {
          roll: 'Power Roll + 2',
          tier1: 'I < 0 dazed (save ends)',
          tier2: 'I < 1 dazed (save ends)',
          tier3: 'I < 2 dazed (save ends)',
        },
        {
          name: 'Effect',
          effect: 'While dazed this way, a target has speed 0. If a target takes damage, or if someone else uses a main action to shake the target out of their stupor, the dazed condition ends.',
        },
      ],
    },
    {
      type: 'feature',
      feature_type: 'ability',
      name: 'Striking Afterimage',
      icon: '❗',
      keywords: ['Magic'],
      usage: 'Triggered action',
      distance: 'Self',
      target: 'Self',
      trigger: 'The pouncer takes damage from a strike.',
      effects: [
        {
          name: 'Effect',
          effect: 'The pouncer halves the damage, ignores any nondamaging effects associated with it, and can teleport up to 5 squares. If they teleport into concealment or cover, the pouncer can immediately attempt to hide as a free maneuver.',
        },
      ],
    },
    {
      type: 'feature',
      feature_type: 'trait',
      name: 'Avoidance',
      icon: '⭐',
      effects: [
        {
          effect: 'Any effect on the pouncer that would be ended by a saving throw instead ends automatically at the end of their next turn.',
        },
      ],
    },
  ],
};

/**
 * All Lightbender monsters
 */
export const LIGHTBENDER_MONSTERS: CompendiumMonster[] = [
  LIGHTBENDER,
  LIGHTBENDER_POUNCER,
];
