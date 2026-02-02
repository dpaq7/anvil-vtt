/**
 * Imbued Weapon Data for Draw Steel
 *
 * Ported from Forgesteel (https://github.com/andyaiken/forgesteel)
 * Original work Copyright (c) Andy Aiken, Licensed under GPL-3.0
 *
 * Weapon imbuements provide offensive magical enhancements.
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

// =============================================================================
// LEVEL 1 WEAPON IMBUEMENTS
// =============================================================================

export const WEAPON_IMBUEMENTS: Imbuement[] = [
  {
    id: 'imbuement-blood-bargain',
    name: 'Blood Bargain',
    description: 'You can sacrifice your own health to heal allies.',
    type: 'weapon',
    level: 1,
    feature: textFeature(
      'imbuement-blood-bargain-feature',
      'Blood Bargain',
      "As a maneuver, you harm yourself with the weapon, taking 1d6 damage that can't be reduced in any way. An ally within 5 squares can then spend a Recovery."
    ),
    craftingProjectId: 'project-blood-bargain',
  },
  {
    id: 'imbuement-chilling-i',
    name: 'Chilling I',
    description: 'Your weapon deals bonus cold damage.',
    type: 'weapon',
    level: 1,
    feature: textFeature(
      'imbuement-chilling-i-feature',
      'Chilling I',
      'Whenever you damage a creature with an ability using this weapon and obtain a tier 3 outcome, that creature takes 3 cold damage.'
    ),
    craftingProjectId: 'project-chilling-i',
  },
  {
    id: 'imbuement-disrupting-i',
    name: 'Disrupting I',
    description: 'Your weapon is especially deadly to undead.',
    type: 'weapon',
    level: 1,
    feature: textFeature(
      'imbuement-disrupting-i-feature',
      'Disrupting I',
      'Whenever you damage an undead using this weapon and leave that undead with 15 Stamina or less, they drop to 0 Stamina.'
    ),
    craftingProjectId: 'project-disrupting-i',
  },
  {
    id: 'imbuement-hurling',
    name: 'Hurling',
    description: 'You can throw your melee weapon and have it return.',
    type: 'weapon',
    level: 1,
    feature: textFeature(
      'imbuement-hurling-feature',
      'Hurling',
      "Whenever you use a melee ability using this weapon, you can throw the weapon by treating the ability's distance as ranged 3 instead. When the ability is resolved, the weapon returns to your hand. Any ability used when you throw this weapon can't impose the grabbed or restrained conditions."
    ),
    craftingProjectId: 'project-hurling',
  },
  {
    id: 'imbuement-merciful',
    name: 'Merciful',
    description: 'Your weapon can knock targets unconscious instead of killing them.',
    type: 'weapon',
    level: 1,
    feature: textFeature(
      'imbuement-merciful-feature',
      'Merciful',
      'Whenever you reduce a non-undead creature to 0 Stamina using this weapon, the creature falls unconscious and wakes up 1d6 hours later. A creature with the Heal skill can wake the unconscious creature early with 1 uninterrupted minute of medical treatment. Whenever the creature wakes, they regain 1 Stamina.'
    ),
    craftingProjectId: 'project-merciful',
  },
  {
    id: 'imbuement-terrifying-i',
    name: 'Terrifying I',
    description: 'Your weapon deals bonus psychic damage.',
    type: 'weapon',
    level: 1,
    feature: textFeature(
      'imbuement-terrifying-i-feature',
      'Terrifying I',
      'Whenever you damage a creature with an ability using this weapon and obtain a tier 3 outcome, that creature takes 2 psychic damage.'
    ),
    craftingProjectId: 'project-terrifying-i',
  },
  {
    id: 'imbuement-thundering-i',
    name: 'Thundering I',
    description: 'Your weapon pushes creatures you strike.',
    type: 'weapon',
    level: 1,
    feature: textFeature(
      'imbuement-thundering-i-feature',
      'Thundering I',
      'Whenever you deal rolled damage to a creature using this weapon, you can push that creature 1 square after the other effects of the ability resolve.'
    ),
    craftingProjectId: 'project-thundering-i',
  },
  {
    id: 'imbuement-vengeance-i',
    name: 'Vengeance I',
    description: 'Your weapon deals bonus damage to creatures that have harmed you.',
    type: 'weapon',
    level: 1,
    feature: textFeature(
      'imbuement-vengeance-i-feature',
      'Vengeance I',
      'Whenever you use a damage-dealing ability using this weapon against a creature who has dealt damage to you since the end of your last turn, the ability deals an extra 2 damage.'
    ),
    craftingProjectId: 'project-vengeance-i',
  },
  {
    id: 'imbuement-wingbane',
    name: 'Wingbane',
    description: 'Your weapon is especially effective against flying creatures.',
    type: 'weapon',
    level: 1,
    feature: textFeature(
      'imbuement-wingbane-feature',
      'Wingbane',
      'Whenever you damage a flying creature using this weapon, that creature is also bleeding (save ends). While bleeding in this way, the creature takes 1 damage per square they fly. If the creature starts and ends their turn on the same solid surface, the bleeding condition ends.'
    ),
    craftingProjectId: 'project-wingbane',
  },

  // =============================================================================
  // LEVEL 5 WEAPON IMBUEMENTS
  // =============================================================================
  {
    id: 'imbuement-chargebreaker',
    name: 'Chargebreaker',
    description: 'You can damage enemies who move adjacent to you.',
    type: 'weapon',
    level: 5,
    feature: textFeature(
      'imbuement-chargebreaker-feature',
      'Chargebreaker',
      'When an enemy willingly moves adjacent to you, you can use a free triggered action to deal 5 damage to them. Keywords: Melee, Strike, Weapon.'
    ),
    craftingProjectId: 'project-chargebreaker',
  },
  {
    id: 'imbuement-chilling-ii',
    name: 'Chilling II',
    description: 'Your weapon deals enhanced cold damage and slows targets.',
    type: 'weapon',
    level: 5,
    feature: textFeature(
      'imbuement-chilling-ii-feature',
      'Chilling II',
      'Whenever you damage a creature with an ability using this weapon and obtain a tier 3 outcome, that creature takes 6 cold damage and is slowed (save ends). This replaces the benefit of Chilling I.'
    ),
    craftingProjectId: 'project-chilling-ii',
  },
  {
    id: 'imbuement-devastating',
    name: 'Devastating',
    description: 'Your weapon deals extra damage on critical hits.',
    type: 'weapon',
    level: 5,
    feature: textFeature(
      'imbuement-devastating-feature',
      'Devastating',
      'Whenever you roll a natural 19 or 20 on a power roll using this weapon, the ability deals an extra 10 damage.'
    ),
    craftingProjectId: 'project-devastating',
  },
  {
    id: 'imbuement-disrupting-ii',
    name: 'Disrupting II',
    description: 'Your weapon is even more deadly to undead.',
    type: 'weapon',
    level: 5,
    feature: textFeature(
      'imbuement-disrupting-ii-feature',
      'Disrupting II',
      'Whenever you damage an undead using this weapon and leave that undead with 30 Stamina or less, they drop to 0 Stamina. This replaces the benefit of Disrupting I.'
    ),
    craftingProjectId: 'project-disrupting-ii',
  },
  {
    id: 'imbuement-terrifying-ii',
    name: 'Terrifying II',
    description: 'Your weapon deals enhanced psychic damage and frightens targets.',
    type: 'weapon',
    level: 5,
    feature: textFeature(
      'imbuement-terrifying-ii-feature',
      'Terrifying II',
      'Whenever you damage a creature with an ability using this weapon and obtain a tier 3 outcome, that creature takes 5 psychic damage and is frightened of you (save ends). This replaces the benefit of Terrifying I.'
    ),
    craftingProjectId: 'project-terrifying-ii',
  },
  {
    id: 'imbuement-thundering-ii',
    name: 'Thundering II',
    description: 'Your weapon pushes creatures further.',
    type: 'weapon',
    level: 5,
    feature: textFeature(
      'imbuement-thundering-ii-feature',
      'Thundering II',
      'Whenever you deal rolled damage to a creature using this weapon, you can push that creature up to 3 squares after the other effects of the ability resolve. This replaces the benefit of Thundering I.'
    ),
    craftingProjectId: 'project-thundering-ii',
  },
  {
    id: 'imbuement-vengeance-ii',
    name: 'Vengeance II',
    description: 'Your weapon deals enhanced bonus damage to creatures that have harmed you.',
    type: 'weapon',
    level: 5,
    feature: textFeature(
      'imbuement-vengeance-ii-feature',
      'Vengeance II',
      'Whenever you use a damage-dealing ability using this weapon against a creature who has dealt damage to you since the end of your last turn, the ability deals an extra 5 damage. This replaces the benefit of Vengeance I.'
    ),
    craftingProjectId: 'project-vengeance-ii',
  },

  // =============================================================================
  // LEVEL 9 WEAPON IMBUEMENTS
  // =============================================================================
  {
    id: 'imbuement-chilling-iii',
    name: 'Chilling III',
    description: 'Your weapon deals devastating cold damage.',
    type: 'weapon',
    level: 9,
    feature: textFeature(
      'imbuement-chilling-iii-feature',
      'Chilling III',
      'Whenever you damage a creature with an ability using this weapon and obtain a tier 3 outcome, that creature takes 9 cold damage and is slowed (save ends). Additionally, whenever you deal cold damage to a creature that is already slowed, that creature is restrained instead until the end of their next turn. This replaces the benefit of Chilling II.'
    ),
    craftingProjectId: 'project-chilling-iii',
  },
  {
    id: 'imbuement-disrupting-iii',
    name: 'Disrupting III',
    description: 'Your weapon is supremely deadly to undead.',
    type: 'weapon',
    level: 9,
    feature: textFeature(
      'imbuement-disrupting-iii-feature',
      'Disrupting III',
      'Whenever you damage an undead using this weapon and leave that undead with 45 Stamina or less, they drop to 0 Stamina. This replaces the benefit of Disrupting II.'
    ),
    craftingProjectId: 'project-disrupting-iii',
  },
  {
    id: 'imbuement-terrifying-iii',
    name: 'Terrifying III',
    description: 'Your weapon deals devastating psychic damage.',
    type: 'weapon',
    level: 9,
    feature: textFeature(
      'imbuement-terrifying-iii-feature',
      'Terrifying III',
      'Whenever you damage a creature with an ability using this weapon and obtain a tier 3 outcome, that creature takes 8 psychic damage and is frightened of you (save ends). Additionally, whenever you deal psychic damage to a creature that is already frightened, that creature is also dazed until the end of their next turn. This replaces the benefit of Terrifying II.'
    ),
    craftingProjectId: 'project-terrifying-iii',
  },
  {
    id: 'imbuement-thundering-iii',
    name: 'Thundering III',
    description: 'Your weapon can push creatures great distances.',
    type: 'weapon',
    level: 9,
    feature: textFeature(
      'imbuement-thundering-iii-feature',
      'Thundering III',
      'Whenever you deal rolled damage to a creature using this weapon, you can push that creature up to 5 squares after the other effects of the ability resolve. This replaces the benefit of Thundering II.'
    ),
    craftingProjectId: 'project-thundering-iii',
  },
  {
    id: 'imbuement-vengeance-iii',
    name: 'Vengeance III',
    description: 'Your weapon deals devastating bonus damage to creatures that have harmed you.',
    type: 'weapon',
    level: 9,
    feature: textFeature(
      'imbuement-vengeance-iii-feature',
      'Vengeance III',
      'Whenever you use a damage-dealing ability using this weapon against a creature who has dealt damage to you since the end of your last turn, the ability deals an extra 8 damage. This replaces the benefit of Vengeance II.'
    ),
    craftingProjectId: 'project-vengeance-iii',
  },
];

/**
 * Get weapon imbuements by level
 */
export function getWeaponImbuementsByLevel(level: number): Imbuement[] {
  return WEAPON_IMBUEMENTS.filter(i => i.level === level);
}
