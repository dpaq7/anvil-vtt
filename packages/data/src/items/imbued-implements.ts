/**
 * Imbued Implement Data for Draw Steel
 *
 * Ported from Forgesteel (https://github.com/andyaiken/forgesteel)
 * Original work Copyright (c) Andy Aiken, Licensed under GPL-3.0
 *
 * Implement imbuements provide magical enhancements for spellcasters.
 * Each imbuement has a level (1, 5, or 9) that determines the echelon.
 */

import type { Imbuement } from '@anvil/types';
import type { Feature } from '@anvil/types';

/**
 * Helper to create a text feature
 */
function textFeature(id: string, name: string, description: string): Feature {
  return { id, name, description, type: 'text', data: null };
}

/**
 * Helper to create a bonus feature
 */
function bonusFeature(id: string, name: string, field: string, value: number): Feature {
  return {
    id,
    name,
    description: `${value >= 0 ? '+' : ''}${value} ${field}`,
    type: 'bonus',
    data: { field, value },
  };
}

// =============================================================================
// LEVEL 1 IMPLEMENT IMBUEMENTS
// =============================================================================

export const IMPLEMENT_IMBUEMENTS: Imbuement[] = [
  {
    id: 'imbuement-berserking',
    name: 'Berserking',
    description: 'Your implement can force enemies to attack their allies.',
    type: 'implement',
    level: 1,
    feature: textFeature(
      'imbuement-berserking-feature',
      'Berserking',
      "Whenever you damage a creature using a magic or psionic ability and obtain a tier 3 outcome, that creature must make an opportunity attack against their nearest ally if possible after the ability's effects resolve. This strike deals extra damage equal to the highest of your Reason, Intuition, or Presence scores."
    ),
    craftingProjectId: 'project-berserking',
  },
  {
    id: 'imbuement-displacing-i',
    name: 'Displacing I',
    description: 'Your implement can teleport enemies.',
    type: 'implement',
    level: 1,
    feature: textFeature(
      'imbuement-displacing-i-feature',
      'Displacing I',
      "Whenever you damage a creature using a magic or psionic ability and obtain a tier 3 outcome, you can teleport that creature up to 2 squares after the ability's effects resolve. If the creature started on a horizontal surface, they must end on a horizontal surface."
    ),
    craftingProjectId: 'project-displacing-i',
  },
  {
    id: 'imbuement-elemental',
    name: 'Elemental',
    description: 'Your implement can attune to elemental energies.',
    type: 'implement',
    level: 1,
    feature: textFeature(
      'imbuement-elemental-feature',
      'Elemental',
      'Whenever you use an ability with the Air, Earth, Fire, Green, Rot, Void, or Water keyword, you can attune this implement to that element until the end of the encounter. While the implement is attuned, you gain an edge on power rolls with that elemental keyword. The implement can be attuned to only one element at a time.'
    ),
    craftingProjectId: 'project-elemental',
  },
  {
    id: 'imbuement-forceful-i',
    name: 'Forceful I',
    description: 'Your implement enhances forced movement.',
    type: 'implement',
    level: 1,
    feature: textFeature(
      'imbuement-forceful-i-feature',
      'Forceful I',
      'Whenever you use a magic or psionic ability to push or pull a creature, you can move that creature an additional 2 squares.'
    ),
    craftingProjectId: 'project-forceful-i',
  },
  {
    id: 'imbuement-rat-form',
    name: 'Rat Form',
    description: 'Your implement allows you to transform into a rat.',
    type: 'implement',
    level: 1,
    feature: textFeature(
      'imbuement-rat-form-feature',
      'Rat Form',
      "As a maneuver, you transform into a rat. Your equipment transforms with you. As a rat, you have speed 5 and can automatically climb at full speed while moving, your size is 1T, and you can see in the dark. You can speak and keep your skills while in rat form, but your Might is −5 and you lose all your regular abilities, features, and benefits. You can revert to your natural form as a maneuver, and do so automatically if you take any damage."
    ),
    craftingProjectId: 'project-rat-form',
  },
  {
    id: 'imbuement-rejuvenating-i',
    name: 'Rejuvenating I',
    description: 'Your implement can restore Heroic Resources.',
    type: 'implement',
    level: 1,
    feature: textFeature(
      'imbuement-rejuvenating-i-feature',
      'Rejuvenating I',
      'Whenever you use an ability that costs 1 or more of your Heroic Resource, roll a d10. On a 9 or higher, you gain 1 Heroic Resource.'
    ),
    craftingProjectId: 'project-rejuvenating-i',
  },
  {
    id: 'imbuement-seeking',
    name: 'Seeking',
    description: 'Your implement extends your range and helps you locate targets.',
    type: 'implement',
    level: 1,
    feature: textFeature(
      'imbuement-seeking-feature',
      'Seeking',
      'Your ranged magic or psionic abilities gain a +2 distance bonus. Additionally, if you think the name of a specific creature, place, or object to the implement, the implement points toward that target, provided you are on the same world.'
    ),
    craftingProjectId: 'project-seeking',
  },
  {
    id: 'imbuement-thought-sending',
    name: 'Thought Sending',
    description: 'Your implement allows telepathic communication.',
    type: 'implement',
    level: 1,
    feature: textFeature(
      'imbuement-thought-sending-feature',
      'Thought Sending',
      'Your ranged magic and psionic abilities gain a +2 distance bonus. Additionally, you can telepathically communicate with any willing creature who knows a language and whose name you know, provided they are on the same world as you. You must initiate the conversation, but once you do, the creature can respond until you end the conversation.'
    ),
    craftingProjectId: 'project-thought-sending',
  },
  {
    id: 'imbuement-warding-i',
    name: 'Warding I',
    description: 'Your implement enhances your Stamina.',
    type: 'implement',
    level: 1,
    feature: bonusFeature('imbuement-warding-i-feature', 'Warding I', 'stamina', 6),
    craftingProjectId: 'project-warding-i',
  },

  // =============================================================================
  // LEVEL 5 IMPLEMENT IMBUEMENTS
  // =============================================================================
  {
    id: 'imbuement-celerity',
    name: 'Celerity',
    description: 'Your implement allows you to shift after using abilities.',
    type: 'implement',
    level: 5,
    feature: textFeature(
      'imbuement-celerity-feature',
      'Celerity',
      'Immediately after using a magic or psionic ability that requires a main action, you can shift up to 3 squares, or you can use the Escape Grab maneuver as a free maneuver.'
    ),
    craftingProjectId: 'project-celerity',
  },
  {
    id: 'imbuement-celestine',
    name: 'Celestine',
    description: 'Your implement can create explosive stars.',
    type: 'implement',
    level: 5,
    feature: textFeature(
      'imbuement-celestine-feature',
      'Celestine',
      'As a main action, you conjure up to three stars, which hover in unoccupied squares of your choice within 5 squares of you. The stars remain in place, and disappear if you create more stars. When an enemy enters any star\'s space, the star detonates and is destroyed, and the enemy takes 10 fire damage. If you have line of effect to the enemy, you can also slide them 1 square. Otherwise, the enemy slides 1 square in a random direction.'
    ),
    craftingProjectId: 'project-celestine',
  },
  {
    id: 'imbuement-displacing-ii',
    name: 'Displacing II',
    description: 'Your implement can teleport enemies further.',
    type: 'implement',
    level: 5,
    feature: textFeature(
      'imbuement-displacing-ii-feature',
      'Displacing II',
      "Whenever you damage a creature using a magic or psionic ability and obtain a tier 3 outcome, you can teleport that creature up to 4 squares after the ability's effects resolve. If the creature started on a horizontal surface, they must end on a horizontal surface. This replaces the benefit of Displacing I."
    ),
    craftingProjectId: 'project-displacing-ii',
  },
  {
    id: 'imbuement-forceful-ii',
    name: 'Forceful II',
    description: 'Your implement greatly enhances forced movement.',
    type: 'implement',
    level: 5,
    feature: textFeature(
      'imbuement-forceful-ii-feature',
      'Forceful II',
      'Whenever you use a magic or psionic ability to push or pull a creature, you can move that creature an additional 4 squares. This replaces the benefit of Forceful I.'
    ),
    craftingProjectId: 'project-forceful-ii',
  },
  {
    id: 'imbuement-rejuvenating-ii',
    name: 'Rejuvenating II',
    description: 'Your implement more reliably restores Heroic Resources.',
    type: 'implement',
    level: 5,
    feature: textFeature(
      'imbuement-rejuvenating-ii-feature',
      'Rejuvenating II',
      'Whenever you use an ability that costs 1 or more of your Heroic Resource, roll a d10. On a 7 or higher, you gain 1 Heroic Resource. This replaces the benefit of Rejuvenating I.'
    ),
    craftingProjectId: 'project-rejuvenating-ii',
  },
  {
    id: 'imbuement-warding-ii',
    name: 'Warding II',
    description: 'Your implement significantly enhances your Stamina.',
    type: 'implement',
    level: 5,
    feature: bonusFeature('imbuement-warding-ii-feature', 'Warding II', 'stamina', 12),
    craftingProjectId: 'project-warding-ii',
  },

  // =============================================================================
  // LEVEL 9 IMPLEMENT IMBUEMENTS
  // =============================================================================
  {
    id: 'imbuement-displacing-iii',
    name: 'Displacing III',
    description: 'Your implement can teleport enemies great distances.',
    type: 'implement',
    level: 9,
    feature: textFeature(
      'imbuement-displacing-iii-feature',
      'Displacing III',
      "Whenever you damage a creature using a magic or psionic ability and obtain a tier 3 outcome, you can teleport that creature up to 6 squares after the ability's effects resolve. If the creature started on a horizontal surface, they must end on a horizontal surface. This replaces the benefit of Displacing II."
    ),
    craftingProjectId: 'project-displacing-iii',
  },
  {
    id: 'imbuement-forceful-iii',
    name: 'Forceful III',
    description: 'Your implement supremely enhances forced movement.',
    type: 'implement',
    level: 9,
    feature: textFeature(
      'imbuement-forceful-iii-feature',
      'Forceful III',
      'Whenever you use a magic or psionic ability to push or pull a creature, you can move that creature an additional 6 squares. This replaces the benefit of Forceful II.'
    ),
    craftingProjectId: 'project-forceful-iii',
  },
  {
    id: 'imbuement-rejuvenating-iii',
    name: 'Rejuvenating III',
    description: 'Your implement reliably restores Heroic Resources.',
    type: 'implement',
    level: 9,
    feature: textFeature(
      'imbuement-rejuvenating-iii-feature',
      'Rejuvenating III',
      'Whenever you use an ability that costs 1 or more of your Heroic Resource, roll a d10. On a 5 or higher, you gain 1 Heroic Resource. This replaces the benefit of Rejuvenating II.'
    ),
    craftingProjectId: 'project-rejuvenating-iii',
  },
  {
    id: 'imbuement-warding-iii',
    name: 'Warding III',
    description: 'Your implement greatly enhances your Stamina.',
    type: 'implement',
    level: 9,
    feature: bonusFeature('imbuement-warding-iii-feature', 'Warding III', 'stamina', 18),
    craftingProjectId: 'project-warding-iii',
  },
];

/**
 * Get implement imbuements by level
 */
export function getImplementImbuementsByLevel(level: number): Imbuement[] {
  return IMPLEMENT_IMBUEMENTS.filter(i => i.level === level);
}
