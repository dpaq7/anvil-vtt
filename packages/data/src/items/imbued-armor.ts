/**
 * Imbued Armor Data for Draw Steel
 *
 * Ported from Forgesteel (https://github.com/andyaiken/forgesteel)
 * Original work Copyright (c) Andy Aiken, Licensed under GPL-3.0
 *
 * Armor imbuements provide defensive magical enhancements.
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

/**
 * Helper to create a damage modifier feature
 */
function damageModifier(
  id: string,
  name: string,
  modifiers: Array<{
    damageType: string;
    modifierType: 'immunity' | 'resistance' | 'weakness';
    value: number;
  }>
): Feature {
  return {
    id,
    name,
    description: modifiers.map(m => `${m.damageType} ${m.modifierType} ${m.value}`).join(', '),
    type: 'damage-modifier',
    data: { modifiers },
  };
}

// =============================================================================
// LEVEL 1 ARMOR IMBUEMENTS
// =============================================================================

export const ARMOR_IMBUEMENTS: Imbuement[] = [
  {
    id: 'imbuement-awe-charming',
    name: 'Awe: Charming',
    description: 'Your armor enhances your presence.',
    type: 'armor',
    level: 1,
    feature: textFeature(
      'imbuement-awe-charming-feature',
      'Awe: Charming',
      'You gain an edge on Presence tests made to win other creatures over or make a good impression.'
    ),
    craftingProjectId: 'project-awe-charming',
  },
  {
    id: 'imbuement-awe-threatening',
    name: 'Awe: Threatening',
    description: 'Your armor enhances your intimidating presence.',
    type: 'armor',
    level: 1,
    feature: textFeature(
      'imbuement-awe-threatening-feature',
      'Awe: Threatening',
      'You gain an edge on Presence tests made to intimidate, coerce, or bully.'
    ),
    craftingProjectId: 'project-awe-threatening',
  },
  {
    id: 'imbuement-damage-immunity-i',
    name: 'Damage Immunity I',
    description: 'Your armor grants protection against certain damage types.',
    type: 'armor',
    level: 1,
    feature: {
      id: 'imbuement-damage-immunity-i-feature',
      name: 'Damage Immunity I',
      description: 'Select three damage types. You have immunity 5 to those damage types.',
      type: 'choice',
      data: {
        options: [
          { feature: damageModifier('imbuement-damage-immunity-i-acid', 'Acid Immunity', [{ damageType: 'acid', modifierType: 'immunity', value: 5 }]), value: 1 },
          { feature: damageModifier('imbuement-damage-immunity-i-cold', 'Cold Immunity', [{ damageType: 'cold', modifierType: 'immunity', value: 5 }]), value: 1 },
          { feature: damageModifier('imbuement-damage-immunity-i-corruption', 'Corruption Immunity', [{ damageType: 'corruption', modifierType: 'immunity', value: 5 }]), value: 1 },
          { feature: damageModifier('imbuement-damage-immunity-i-fire', 'Fire Immunity', [{ damageType: 'fire', modifierType: 'immunity', value: 5 }]), value: 1 },
          { feature: damageModifier('imbuement-damage-immunity-i-holy', 'Holy Immunity', [{ damageType: 'holy', modifierType: 'immunity', value: 5 }]), value: 1 },
          { feature: damageModifier('imbuement-damage-immunity-i-lightning', 'Lightning Immunity', [{ damageType: 'lightning', modifierType: 'immunity', value: 5 }]), value: 1 },
          { feature: damageModifier('imbuement-damage-immunity-i-poison', 'Poison Immunity', [{ damageType: 'poison', modifierType: 'immunity', value: 5 }]), value: 1 },
          { feature: damageModifier('imbuement-damage-immunity-i-psychic', 'Psychic Immunity', [{ damageType: 'psychic', modifierType: 'immunity', value: 5 }]), value: 1 },
          { feature: damageModifier('imbuement-damage-immunity-i-sonic', 'Sonic Immunity', [{ damageType: 'sonic', modifierType: 'immunity', value: 5 }]), value: 1 },
        ],
        count: 3,
        selected: [],
      },
    },
    craftingProjectId: 'project-damage-immunity-i',
  },
  {
    id: 'imbuement-disguise',
    name: 'Disguise',
    description: 'Your armor can change its appearance.',
    type: 'armor',
    level: 1,
    feature: textFeature(
      'imbuement-disguise-feature',
      'Disguise',
      "As a maneuver, you cause this armor to take the form of any type of clothing that you have been in the presence of—a noble's dress, a guard's uniform, a cultist's robes, and so forth. The armor loses none of its protective qualities while transformed into other clothing."
    ),
    craftingProjectId: 'project-disguise',
  },
  {
    id: 'imbuement-iridescent',
    name: 'Iridescent',
    description: 'Your armor creates illusory afterimages.',
    type: 'armor',
    level: 1,
    feature: textFeature(
      'imbuement-iridescent-feature',
      'Iridescent',
      "When you are the sole target of an ability, you can use a free triggered action to reveal that the ability was targeting an afterimage of you in the same space as you. The power roll for the ability is treated as an 11. You can't use this enhancement again until you earn 1 or more Victories."
    ),
    craftingProjectId: 'project-iridescent',
  },
  {
    id: 'imbuement-magic-resistance-i',
    name: 'Magic Resistance I',
    description: 'Your armor helps you resist magical effects.',
    type: 'armor',
    level: 1,
    feature: textFeature(
      'imbuement-magic-resistance-i-feature',
      'Magic Resistance I',
      'Your characteristic scores are treated as 1 higher (to a maximum of 2) for the purpose of resisting the potencies of magic abilities.'
    ),
    craftingProjectId: 'project-magic-resistance-i',
  },
  {
    id: 'imbuement-nettlebloom',
    name: 'Nettlebloom',
    description: 'Your armor sprouts toxic nettles when you are grabbed.',
    type: 'armor',
    level: 1,
    feature: textFeature(
      'imbuement-nettlebloom-feature',
      'Nettlebloom',
      'Whenever you are grabbed by an adjacent creature, your armor sprouts toxic nettles. While that creature has you grabbed, they are weakened.'
    ),
    craftingProjectId: 'project-nettlebloom',
  },
  {
    id: 'imbuement-phasing-i',
    name: 'Phasing I',
    description: 'Your armor allows you to move through solid matter.',
    type: 'armor',
    level: 1,
    feature: textFeature(
      'imbuement-phasing-i-feature',
      'Phasing I',
      "Once per turn, you can move through 1 square of solid matter. If you end your turn inside solid matter, you are forced out into the space from which you entered it and you take 5 damage that can't be reduced in any way."
    ),
    craftingProjectId: 'project-phasing-i',
  },
  {
    id: 'imbuement-psionic-resistance-i',
    name: 'Psionic Resistance I',
    description: 'Your armor helps you resist psionic effects.',
    type: 'armor',
    level: 1,
    feature: textFeature(
      'imbuement-psionic-resistance-i-feature',
      'Psionic Resistance I',
      'Your characteristic scores are treated as 1 higher (to a maximum of 2) for the purpose of resisting the potencies of psionic abilities.'
    ),
    craftingProjectId: 'project-psionic-resistance-i',
  },
  {
    id: 'imbuement-swift',
    name: 'Swift',
    description: 'Your armor enhances your speed.',
    type: 'armor',
    level: 1,
    feature: bonusFeature('imbuement-swift-feature', 'Swift', 'speed', 1),
    craftingProjectId: 'project-swift',
  },
  {
    id: 'imbuement-tempest-i',
    name: 'Tempest I',
    description: 'Your armor channels electrical energy.',
    type: 'armor',
    level: 1,
    feature: textFeature(
      'imbuement-tempest-i-feature',
      'Tempest I',
      'Whenever a creature makes a melee ability targeting you from an adjacent square and you are not grabbed, you can use a free triggered action to deal 3 lightning damage to that creature.'
    ),
    craftingProjectId: 'project-tempest-i',
  },

  // =============================================================================
  // LEVEL 5 ARMOR IMBUEMENTS
  // =============================================================================
  {
    id: 'imbuement-avenger',
    name: 'Avenger',
    description: 'Your armor enhances your counterattacks.',
    type: 'armor',
    level: 5,
    feature: textFeature(
      'imbuement-avenger-feature',
      'Avenger',
      'You gain an edge on free strikes triggered by opportunity attacks. Additionally, whenever a creature damages you while adjacent to you and you are not grabbed, you can use a free triggered action to make a free strike against the creature.'
    ),
    craftingProjectId: 'project-avenger',
  },
  {
    id: 'imbuement-damage-immunity-ii',
    name: 'Damage Immunity II',
    description: 'Your armor grants enhanced protection against damage types.',
    type: 'armor',
    level: 5,
    feature: {
      id: 'imbuement-damage-immunity-ii-feature',
      name: 'Damage Immunity II',
      description: 'Select three damage types. You have immunity 10 to those damage types. This replaces the benefit of Damage Immunity I.',
      type: 'choice',
      data: {
        options: [
          { feature: damageModifier('imbuement-damage-immunity-ii-acid', 'Acid Immunity II', [{ damageType: 'acid', modifierType: 'immunity', value: 10 }]), value: 1 },
          { feature: damageModifier('imbuement-damage-immunity-ii-cold', 'Cold Immunity II', [{ damageType: 'cold', modifierType: 'immunity', value: 10 }]), value: 1 },
          { feature: damageModifier('imbuement-damage-immunity-ii-corruption', 'Corruption Immunity II', [{ damageType: 'corruption', modifierType: 'immunity', value: 10 }]), value: 1 },
          { feature: damageModifier('imbuement-damage-immunity-ii-fire', 'Fire Immunity II', [{ damageType: 'fire', modifierType: 'immunity', value: 10 }]), value: 1 },
          { feature: damageModifier('imbuement-damage-immunity-ii-holy', 'Holy Immunity II', [{ damageType: 'holy', modifierType: 'immunity', value: 10 }]), value: 1 },
          { feature: damageModifier('imbuement-damage-immunity-ii-lightning', 'Lightning Immunity II', [{ damageType: 'lightning', modifierType: 'immunity', value: 10 }]), value: 1 },
          { feature: damageModifier('imbuement-damage-immunity-ii-poison', 'Poison Immunity II', [{ damageType: 'poison', modifierType: 'immunity', value: 10 }]), value: 1 },
          { feature: damageModifier('imbuement-damage-immunity-ii-psychic', 'Psychic Immunity II', [{ damageType: 'psychic', modifierType: 'immunity', value: 10 }]), value: 1 },
          { feature: damageModifier('imbuement-damage-immunity-ii-sonic', 'Sonic Immunity II', [{ damageType: 'sonic', modifierType: 'immunity', value: 10 }]), value: 1 },
        ],
        count: 3,
        selected: [],
      },
    },
    craftingProjectId: 'project-damage-immunity-ii',
  },
  {
    id: 'imbuement-magic-resistance-ii',
    name: 'Magic Resistance II',
    description: 'Your armor provides enhanced resistance to magic.',
    type: 'armor',
    level: 5,
    feature: textFeature(
      'imbuement-magic-resistance-ii-feature',
      'Magic Resistance II',
      'Your characteristic scores are treated as 2 higher (to a maximum of 4) for the purpose of resisting the potencies of magic abilities. This replaces the benefit of Magic Resistance I.'
    ),
    craftingProjectId: 'project-magic-resistance-ii',
  },
  {
    id: 'imbuement-menacing',
    name: 'Menacing',
    description: 'Your armor is supernaturally threatening.',
    type: 'armor',
    level: 5,
    feature: textFeature(
      'imbuement-menacing-feature',
      'Menacing',
      "At the start of combat, you taunt each enemy who can see you and has Presence WEAK."
    ),
    craftingProjectId: 'project-menacing',
  },
  {
    id: 'imbuement-phasing-ii',
    name: 'Phasing II',
    description: 'Your armor allows you to move through thicker solid matter.',
    type: 'armor',
    level: 5,
    feature: textFeature(
      'imbuement-phasing-ii-feature',
      'Phasing II',
      "Once per turn, you can move through up to 3 squares of solid matter. If you end your turn inside solid matter, you are forced out into the space from which you entered it and you take 5 damage that can't be reduced in any way. This replaces the benefit of Phasing I."
    ),
    craftingProjectId: 'project-phasing-ii',
  },
  {
    id: 'imbuement-psionic-resistance-ii',
    name: 'Psionic Resistance II',
    description: 'Your armor provides enhanced resistance to psionics.',
    type: 'armor',
    level: 5,
    feature: textFeature(
      'imbuement-psionic-resistance-ii-feature',
      'Psionic Resistance II',
      'Your characteristic scores are treated as 2 higher (to a maximum of 4) for the purpose of resisting the potencies of psionic abilities. This replaces the benefit of Psionic Resistance I.'
    ),
    craftingProjectId: 'project-psionic-resistance-ii',
  },
  {
    id: 'imbuement-quick',
    name: 'Quick',
    description: 'Your armor significantly enhances your speed.',
    type: 'armor',
    level: 5,
    feature: bonusFeature('imbuement-quick-feature', 'Quick', 'speed', 2),
    craftingProjectId: 'project-quick',
  },
  {
    id: 'imbuement-tempest-ii',
    name: 'Tempest II',
    description: 'Your armor channels enhanced electrical energy.',
    type: 'armor',
    level: 5,
    feature: textFeature(
      'imbuement-tempest-ii-feature',
      'Tempest II',
      'Whenever a creature makes a melee ability targeting you from an adjacent square and you are not grabbed, you can use a free triggered action to deal 6 lightning damage to that creature. This replaces the benefit of Tempest I.'
    ),
    craftingProjectId: 'project-tempest-ii',
  },
  {
    id: 'imbuement-absorption',
    name: 'Absorption',
    description: 'Your armor can absorb and reuse magical abilities.',
    type: 'armor',
    level: 5,
    feature: textFeature(
      'imbuement-absorption-feature',
      'Absorption',
      `When you are targeted by a magic or psionic ability that targets only one creature, you can use a free triggered action to cause this armor to absorb the ability after the ability's effects resolve. While the armor has an ability absorbed, you can't absorb another.

You can use an absorbed ability as if you knew it, making power rolls for the ability using your choice of Reason, Intuition, or Presence. You don't need to spend any Heroic Resource to activate the ability. Once you use the ability, the armor loses it, and you can absorb another.`
    ),
    craftingProjectId: 'project-absorption',
  },
  {
    id: 'imbuement-dragon-soul-i',
    name: 'Dragon Soul I',
    description: 'Your armor unleashes a dragon soul when you are badly hurt.',
    type: 'armor',
    level: 5,
    feature: textFeature(
      'imbuement-dragon-soul-i-feature',
      'Dragon Soul I',
      'When another creature causes you to be winded or dying, you can use a free triggered action to cause the soul of a dragon to emerge from the armor and hurtle toward the creature. Make a power roll using Might, Agility, Reason, Intuition, or Presence. Tier 1: 2 damage; push 3. Tier 2: 12 damage; push 4. Tier 3: 15 damage; push 5.'
    ),
    craftingProjectId: 'project-dragon-soul-i',
  },
  {
    id: 'imbuement-levitating',
    name: 'Levitating',
    description: 'Your armor allows limited flight.',
    type: 'armor',
    level: 5,
    feature: textFeature(
      'imbuement-levitating-feature',
      'Levitating',
      'On your turn, you can treat up to 5 consecutive squares of movement as flying movement. If you are still in midair at the end of your turn, you fall prone.'
    ),
    craftingProjectId: 'project-levitating',
  },
  {
    id: 'imbuement-reactive',
    name: 'Reactive',
    description: 'Your armor grants temporary damage immunity when hit.',
    type: 'armor',
    level: 5,
    feature: textFeature(
      'imbuement-reactive-feature',
      'Reactive',
      'Whenever you take damage, you have damage immunity 2 until the end of your next turn after the triggering damage is resolved.'
    ),
    craftingProjectId: 'project-reactive',
  },
  {
    id: 'imbuement-second-wind',
    name: 'Second Wind',
    description: 'Your armor helps you recover when winded.',
    type: 'armor',
    level: 5,
    feature: textFeature(
      'imbuement-second-wind-feature',
      'Second Wind',
      'When you become winded, you can use a free triggered action to spend a recovery.'
    ),
    craftingProjectId: 'project-second-wind',
  },
  {
    id: 'imbuement-shattering',
    name: 'Shattering',
    description: 'Your armor retaliates against critical hits.',
    type: 'armor',
    level: 5,
    feature: textFeature(
      'imbuement-shattering-feature',
      'Shattering',
      'Whenever an enemy scores a critical hit against you, they take 10 sonic damage.'
    ),
    craftingProjectId: 'project-shattering',
  },

  // =============================================================================
  // LEVEL 9 ARMOR IMBUEMENTS
  // =============================================================================
  {
    id: 'imbuement-damage-immunity-iii',
    name: 'Damage Immunity III',
    description: 'Your armor grants superior protection against damage types.',
    type: 'armor',
    level: 9,
    feature: {
      id: 'imbuement-damage-immunity-iii-feature',
      name: 'Damage Immunity III',
      description: 'Select three damage types. You have immunity 15 to those damage types. This replaces the benefit of Damage Immunity II.',
      type: 'choice',
      data: {
        options: [
          { feature: damageModifier('imbuement-damage-immunity-iii-acid', 'Acid Immunity III', [{ damageType: 'acid', modifierType: 'immunity', value: 15 }]), value: 1 },
          { feature: damageModifier('imbuement-damage-immunity-iii-cold', 'Cold Immunity III', [{ damageType: 'cold', modifierType: 'immunity', value: 15 }]), value: 1 },
          { feature: damageModifier('imbuement-damage-immunity-iii-corruption', 'Corruption Immunity III', [{ damageType: 'corruption', modifierType: 'immunity', value: 15 }]), value: 1 },
          { feature: damageModifier('imbuement-damage-immunity-iii-fire', 'Fire Immunity III', [{ damageType: 'fire', modifierType: 'immunity', value: 15 }]), value: 1 },
          { feature: damageModifier('imbuement-damage-immunity-iii-holy', 'Holy Immunity III', [{ damageType: 'holy', modifierType: 'immunity', value: 15 }]), value: 1 },
          { feature: damageModifier('imbuement-damage-immunity-iii-lightning', 'Lightning Immunity III', [{ damageType: 'lightning', modifierType: 'immunity', value: 15 }]), value: 1 },
          { feature: damageModifier('imbuement-damage-immunity-iii-poison', 'Poison Immunity III', [{ damageType: 'poison', modifierType: 'immunity', value: 15 }]), value: 1 },
          { feature: damageModifier('imbuement-damage-immunity-iii-psychic', 'Psychic Immunity III', [{ damageType: 'psychic', modifierType: 'immunity', value: 15 }]), value: 1 },
          { feature: damageModifier('imbuement-damage-immunity-iii-sonic', 'Sonic Immunity III', [{ damageType: 'sonic', modifierType: 'immunity', value: 15 }]), value: 1 },
        ],
        count: 3,
        selected: [],
      },
    },
    craftingProjectId: 'project-damage-immunity-iii',
  },
  {
    id: 'imbuement-magic-resistance-iii',
    name: 'Magic Resistance III',
    description: 'Your armor provides superior resistance to magic.',
    type: 'armor',
    level: 9,
    feature: textFeature(
      'imbuement-magic-resistance-iii-feature',
      'Magic Resistance III',
      'Your characteristic scores are treated as 3 higher (to a maximum of 6) for the purpose of resisting the potencies of magic abilities. This replaces the benefit of Magic Resistance II.'
    ),
    craftingProjectId: 'project-magic-resistance-iii',
  },
  {
    id: 'imbuement-phasing-iii',
    name: 'Phasing III',
    description: 'Your armor allows you to move freely through solid matter.',
    type: 'armor',
    level: 9,
    feature: textFeature(
      'imbuement-phasing-iii-feature',
      'Phasing III',
      "You can move freely through solid matter. If you end your turn inside solid matter, you are forced out into the space from which you entered it and you take 5 damage that can't be reduced in any way. This replaces the benefit of Phasing II."
    ),
    craftingProjectId: 'project-phasing-iii',
  },
  {
    id: 'imbuement-psionic-resistance-iii',
    name: 'Psionic Resistance III',
    description: 'Your armor provides superior resistance to psionics.',
    type: 'armor',
    level: 9,
    feature: textFeature(
      'imbuement-psionic-resistance-iii-feature',
      'Psionic Resistance III',
      'Your characteristic scores are treated as 3 higher (to a maximum of 6) for the purpose of resisting the potencies of psionic abilities. This replaces the benefit of Psionic Resistance II.'
    ),
    craftingProjectId: 'project-psionic-resistance-iii',
  },
  {
    id: 'imbuement-tempest-iii',
    name: 'Tempest III',
    description: 'Your armor channels devastating electrical energy.',
    type: 'armor',
    level: 9,
    feature: textFeature(
      'imbuement-tempest-iii-feature',
      'Tempest III',
      'Whenever a creature makes a melee ability targeting you from an adjacent square and you are not grabbed, you can use a free triggered action to deal 9 lightning damage to that creature. This replaces the benefit of Tempest II.'
    ),
    craftingProjectId: 'project-tempest-iii',
  },
  {
    id: 'imbuement-devils-bargain',
    name: "Devil's Bargain",
    description: 'Your armor grants flight.',
    type: 'armor',
    level: 9,
    feature: textFeature(
      'imbuement-devils-bargain-feature',
      "Devil's Bargain",
      'You can fly. Additionally, if an effect would make you prone while flying, you can choose to not go prone by losing Stamina equal to the distance you would have fallen from becoming prone.'
    ),
    craftingProjectId: 'project-devils-bargain',
  },
  {
    id: 'imbuement-dragon-soul-ii',
    name: 'Dragon Soul II',
    description: 'Your armor can unleash a devastating breath attack.',
    type: 'armor',
    level: 9,
    feature: textFeature(
      'imbuement-dragon-soul-ii-feature',
      'Dragon Soul II',
      'When you are winded, you can use a main action to open your maw and unleash hell. Make a power roll using Might, Agility, Reason, Intuition, or Presence against each enemy in a line 5 by 1 within 1 square. Keywords: Area, Magic. Tier 1: 5 fire damage. Tier 2: 8 fire damage. Tier 3: 11 fire damage.'
    ),
    craftingProjectId: 'project-dragon-soul-ii',
  },
  {
    id: 'imbuement-invulnerable',
    name: 'Invulnerable',
    description: 'Your armor protects you from weak attacks.',
    type: 'armor',
    level: 9,
    feature: textFeature(
      'imbuement-invulnerable-feature',
      'Invulnerable',
      'When an ability roll made against you obtains a tier 1 outcome, you can ignore its damage and effects.'
    ),
    craftingProjectId: 'project-invulnerable',
  },
  {
    id: 'imbuement-leyline-walker',
    name: 'Leyline Walker',
    description: 'Your armor allows you to teleport.',
    type: 'armor',
    level: 9,
    feature: textFeature(
      'imbuement-leyline-walker-feature',
      'Leyline Walker',
      'Once per turn, as a move action, you can spend any amount of your movement to instead teleport that distance.'
    ),
    craftingProjectId: 'project-leyline-walker',
  },
  {
    id: 'imbuement-life',
    name: 'Life',
    description: 'Your armor can save you from death.',
    type: 'armor',
    level: 9,
    feature: textFeature(
      'imbuement-life-feature',
      'Life',
      'Whenever you would die, you can spend a Recovery to regain Stamina instead. If you have no Recoveries to spend, you die.'
    ),
    craftingProjectId: 'project-life',
  },
  {
    id: 'imbuement-temporal-flux',
    name: 'Temporal Flux',
    description: 'Your armor creates temporal imprints you can teleport to.',
    type: 'armor',
    level: 9,
    feature: textFeature(
      'imbuement-temporal-flux-feature',
      'Temporal Flux',
      `Whenever you move out of a square, you can choose to leave an imprint behind that lasts until the end of the encounter, until your imprint takes 20 or more damage, or until you create a new imprint. The square is occupied by your imprint, and you can share that space with it.

As a free maneuver, you can teleport to the imprint's space.

When you are targeted by an ability, you can use a free triggered action to teleport to your imprint, and the power roll for the ability is an automatic tier 1 result.`
    ),
    craftingProjectId: 'project-temporal-flux',
  },
  {
    id: 'imbuement-unbending',
    name: 'Unbending',
    description: 'Your armor prevents forced movement.',
    type: 'armor',
    level: 9,
    feature: textFeature(
      'imbuement-unbending-feature',
      'Unbending',
      "You can't be subjected to forced movement unless you choose to be. Effects that ignore Stability also ignore this enhancement."
    ),
    craftingProjectId: 'project-unbending',
  },
];

/**
 * Get armor imbuements by level
 */
export function getArmorImbuementsByLevel(level: number): Imbuement[] {
  return ARMOR_IMBUEMENTS.filter(i => i.level === level);
}
