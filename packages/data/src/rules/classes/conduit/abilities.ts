/**
 * Conduit Class Abilities - Synced with Draw Steel Heroes v1
 * Resource: Piety
 */
import type { Ability } from '@anvil/types';

// ============================================================
// SIGNATURE ABILITIES (No cost, at-will)
// ============================================================

export const conduitSignatureAbilities: Ability[] = [
  {
    id: 'blessed-light',
    name: 'Blessed Light',
    flavorText: 'Burning radiance falls upon your foe, transferring some of their energy to a nearby ally.',
    actionType: 'action',
    keywords: ['Magic', 'Ranged', 'Strike'],
    distance: 'Ranged 10',
    target: 'One creature or object',
    powerRoll: {
      characteristic: 'intuition',
      tier1: '3 + I holy damage',
      tier2: '5 + I holy damage',
      tier3: '8 + I holy damage',
    },
    effect: 'One ally within distance gains a number of surges equal to the tier outcome of your power roll.',
  },
  {
    id: 'drain',
    name: 'Drain',
    flavorText: 'You drain the energy from your target to revitalize yourself or an ally.',
    actionType: 'action',
    keywords: ['Magic', 'Melee', 'Strike'],
    distance: 'Melee 1',
    target: 'One creature',
    powerRoll: {
      characteristic: 'intuition',
      tier1: '2 + I corruption damage',
      tier2: '5 + I corruption damage',
      tier3: '7 + I corruption damage',
    },
    effect: 'You or one ally within distance can spend a Recovery.',
  },
  {
    id: 'holy-lash',
    name: 'Holy Lash',
    flavorText: 'A tendril of divine energy shoots forth to draw in your foe.',
    actionType: 'action',
    keywords: ['Magic', 'Ranged', 'Strike'],
    distance: 'Ranged 10',
    target: 'One creature or object',
    powerRoll: {
      characteristic: 'intuition',
      tier1: '3 + I holy damage; vertical pull 2',
      tier2: '5 + I holy damage; vertical pull 3',
      tier3: '8 + I holy damage; vertical pull 4',
    },
    effect: '',
  },
  {
    id: 'lightfall',
    name: 'Lightfall',
    flavorText: 'A rain of holy light scours your enemies and repositions your allies.',
    actionType: 'action',
    keywords: ['Area', 'Magic'],
    distance: '2 burst',
    target: 'Each enemy in the area',
    powerRoll: {
      characteristic: 'intuition',
      tier1: '2 holy damage',
      tier2: '3 holy damage',
      tier3: '5 holy damage',
    },
    effect: 'You can teleport yourself and each ally in the area to unoccupied spaces in the area.',
  },
  {
    id: 'sacrificial-offer',
    name: 'Sacrificial Offer',
    flavorText: 'Divine magic tears at your foe and defends a nearby friend.',
    actionType: 'action',
    keywords: ['Magic', 'Ranged', 'Strike'],
    distance: 'Ranged 10',
    target: 'One creature',
    powerRoll: {
      characteristic: 'intuition',
      tier1: '2 + I corruption damage',
      tier2: '4 + I corruption damage',
      tier3: '6 + I corruption damage',
    },
    effect: 'Choose yourself or one ally within distance. That character can impose a bane on one power roll made against them before the end of their next turn.',
  },
  {
    id: 'staggering-curse',
    name: 'Staggering Curse',
    flavorText: 'A blast of judgment disorients your foe.',
    actionType: 'action',
    keywords: ['Magic', 'Melee', 'Strike'],
    distance: 'Melee 1',
    target: 'One creature or object',
    powerRoll: {
      characteristic: 'intuition',
      tier1: '3 + I holy damage; slide 1',
      tier2: '5 + I holy damage; slide 2',
      tier3: '8 + I holy damage; slide 3',
    },
    effect: '',
  },
  {
    id: 'warriors-prayer',
    name: "Warrior's Prayer",
    flavorText: 'Your quickly uttered prayer lends aggressive divine energy to a friend engaged in melee.',
    actionType: 'action',
    keywords: ['Magic', 'Ranged', 'Strike'],
    distance: 'Ranged 10',
    target: 'One creature',
    powerRoll: {
      characteristic: 'intuition',
      tier1: '3 + I holy damage',
      tier2: '6 + I holy damage',
      tier3: '9 + I holy damage',
    },
    effect: 'You or one ally within distance gains temporary Stamina equal to your Intuition score.',
  },
  {
    id: 'wither',
    name: 'Wither',
    flavorText: 'A bolt of holy energy saps the life from a foe.',
    actionType: 'action',
    keywords: ['Magic', 'Ranged', 'Strike'],
    distance: 'Ranged 10',
    target: 'One creature or object',
    powerRoll: {
      characteristic: 'intuition',
      tier1: '3 + I corruption damage; P < WEAK, the target takes a bane on their next power roll',
      tier2: '5 + I corruption damage; P < AVERAGE, the target takes a bane on their next power roll',
      tier3: '8 + I corruption damage; P < STRONG, the target takes a bane on their next power roll',
    },
    effect: '',
  },
];

// Ray of Wrath (special - can be used as ranged free strike)
export const rayOfWrath: Ability = {
  id: 'ray-of-wrath',
  name: 'Ray of Wrath',
  flavorText: 'You unleash a blast of holy light upon your foe.',
  actionType: 'action',
  keywords: ['Magic', 'Ranged', 'Strike'],
  distance: 'Ranged 10',
  target: 'One creature or object',
  powerRoll: {
    characteristic: 'intuition',
    tier1: '2 + I damage',
    tier2: '4 + I damage',
    tier3: '6 + I damage',
  },
  effect: 'You can have this ability deal holy damage.',
};

// Healing Grace (special - once per turn maneuver)
export const healingGrace: Ability = {
  id: 'healing-grace',
  name: 'Healing Grace',
  flavorText: 'Your divine energy restores the righteous.',
  actionType: 'maneuver',
  keywords: ['Magic', 'Ranged'],
  distance: 'Ranged 10',
  target: 'Self or one ally',
  effect: 'The target can spend a Recovery. Spend 1+ Piety: For each piety spent, choose one enhancement: target one additional ally, end one effect on a target that is ended by a saving throw, a prone target can stand up, or a target can spend 1 additional Recovery.',
};

// ============================================================
// 3-PIETY ABILITIES
// ============================================================

export const conduitThreePietyAbilities: Ability[] = [
  {
    id: 'call-the-thunder-down',
    name: 'Call the Thunder Down',
    flavorText: 'You ask your saint for thunder and your prayer is answered.',
    actionType: 'action',
    essenceCost: 3,
    keywords: ['Area', 'Magic', 'Ranged'],
    distance: '3 cube within 10',
    target: 'Each enemy in the area',
    powerRoll: {
      characteristic: 'intuition',
      tier1: '2 sonic damage; push 1',
      tier2: '3 sonic damage; push 2',
      tier3: '5 sonic damage; push 3',
    },
    effect: 'You can push each willing ally in the area the same distance, ignoring stability.',
  },
  {
    id: 'font-of-wrath',
    name: 'Font of Wrath',
    flavorText: 'A brilliant column of holy light appears on the battlefield, striking out at nearby enemies.',
    actionType: 'action',
    essenceCost: 3,
    keywords: ['Magic', 'Ranged'],
    distance: 'Ranged 10',
    target: 'Special',
    effect: 'You summon a spirit of size 2 who can\'t be harmed, and who appears in an unoccupied space within distance. The spirit lasts until the end of your next turn. You and your allies can move through the spirit\'s space, but enemies can\'t. Any enemy who moves within 2 squares of the spirit for the first time in a combat round or starts their turn there takes holy damage equal to your Intuition score.',
  },
  {
    id: 'judgments-hammer',
    name: "Judgment's Hammer",
    flavorText: 'Your divine fury is a hammer that crashes down upon the unrighteous.',
    actionType: 'action',
    essenceCost: 3,
    keywords: ['Magic', 'Ranged', 'Strike'],
    distance: 'Ranged 10',
    target: 'One creature or object',
    powerRoll: {
      characteristic: 'intuition',
      tier1: '3 + I holy damage; A < WEAK, prone',
      tier2: '6 + I holy damage; A < AVERAGE, prone',
      tier3: '9 + I holy damage; A < STRONG, prone and can\'t stand (save ends)',
    },
    effect: '',
  },
  {
    id: 'violence-will-not-aid-thee',
    name: 'Violence Will Not Aid Thee',
    flavorText: "After some holy lightning, your enemy will think twice about their next attack.",
    actionType: 'action',
    essenceCost: 3,
    keywords: ['Magic', 'Ranged', 'Strike'],
    distance: 'Ranged 10',
    target: 'One creature',
    powerRoll: {
      characteristic: 'intuition',
      tier1: '3 + I lightning damage',
      tier2: '6 + I lightning damage',
      tier3: '9 + I lightning damage',
    },
    effect: 'The first time on a turn that the target deals damage to another creature, the target of this ability takes 1d10 lightning damage (save ends).',
  },
];

// ============================================================
// 5-PIETY ABILITIES
// ============================================================

export const conduitFivePietyAbilities: Ability[] = [
  {
    id: 'corruptions-curse',
    name: "Corruption's Curse",
    flavorText: 'Cursed by you, your enemy takes more damage from your allies.',
    actionType: 'action',
    essenceCost: 5,
    keywords: ['Magic', 'Ranged', 'Strike'],
    distance: 'Ranged 10',
    target: 'One creature or object',
    powerRoll: {
      characteristic: 'intuition',
      tier1: '3 + I corruption damage; M < WEAK, damage weakness 5 (save ends)',
      tier2: '6 + I corruption damage; M < AVERAGE, damage weakness 5 (save ends)',
      tier3: '9 + I corruption damage; M < STRONG, damage weakness 5 (save ends)',
    },
    effect: '',
  },
  {
    id: 'curse-of-terror',
    name: 'Curse of Terror',
    flavorText: 'Fear of divine judgment overwhelms your foe.',
    actionType: 'action',
    essenceCost: 5,
    keywords: ['Magic', 'Ranged', 'Strike'],
    distance: 'Ranged 10',
    target: 'One creature',
    powerRoll: {
      characteristic: 'intuition',
      tier1: '6 + I holy damage; I < WEAK, frightened (save ends)',
      tier2: '9 + I holy damage; I < AVERAGE, frightened (save ends)',
      tier3: '13 + I holy damage; I < STRONG, frightened (save ends)',
    },
    effect: '',
  },
  {
    id: 'faith-is-our-armor',
    name: 'Faith Is Our Armor',
    flavorText: "The heroes' armor glows with golden light, granting divine protection.",
    actionType: 'maneuver',
    essenceCost: 5,
    keywords: ['Magic', 'Ranged'],
    distance: 'Ranged 10',
    target: 'Four allies',
    powerRoll: {
      characteristic: 'intuition',
      tier1: 'The target gains 5 temporary Stamina.',
      tier2: 'The target gains 10 temporary Stamina.',
      tier3: 'The target gains 15 temporary Stamina.',
    },
    effect: 'You can target yourself instead of one ally with this ability.',
  },
  {
    id: 'sermon-of-grace',
    name: 'Sermon of Grace',
    flavorText: "You inspire your allies with tales of your saint's great deeds.",
    actionType: 'action',
    essenceCost: 5,
    keywords: ['Area', 'Magic'],
    distance: '4 burst',
    target: 'Each ally in the area',
    effect: 'Each target can spend a Recovery. Additionally, each target can use a free triggered action to end one effect on them that is ended by a saving throw or that ends at the end of their turn, or to stand up if prone.',
  },
];

// ============================================================
// 7-PIETY ABILITIES
// ============================================================

export const conduitSevenPietyAbilities: Ability[] = [
  {
    id: 'fear-of-the-gods',
    name: 'Fear of the Gods',
    flavorText: 'Your divine magic makes a creature appear as what your enemies fear most.',
    actionType: 'action',
    essenceCost: 7,
    keywords: ['Area', 'Magic', 'Ranged'],
    distance: '5 cube within 10',
    target: 'Each enemy in the area',
    powerRoll: {
      characteristic: 'intuition',
      tier1: '6 psychic damage; I < WEAK, frightened (save ends)',
      tier2: '9 psychic damage; I < AVERAGE, frightened (save ends)',
      tier3: '13 psychic damage; I < STRONG, frightened (save ends)',
    },
    effect: 'Each target is frightened of you or a creature you choose within distance.',
  },
  {
    id: 'saints-raiment',
    name: "Saint's Raiment",
    flavorText: 'An ally becomes the wearer of an empowered golden cloak.',
    actionType: 'maneuver',
    essenceCost: 7,
    keywords: ['Magic', 'Ranged'],
    distance: 'Ranged 10',
    target: 'One ally',
    effect: 'The target gains 20 temporary Stamina and 3 surges.',
  },
  {
    id: 'soul-siphon',
    name: 'Soul Siphon',
    flavorText: 'A beam of energy connects a foe to a friend, draining life from one to heal the other.',
    actionType: 'action',
    essenceCost: 7,
    keywords: ['Magic', 'Ranged', 'Strike'],
    distance: 'Ranged 10',
    target: 'One enemy',
    powerRoll: {
      characteristic: 'intuition',
      tier1: '7 + I corruption damage',
      tier2: '10 + I corruption damage',
      tier3: '15 + I corruption damage',
    },
    effect: 'One ally within distance can spend any number of Recoveries.',
  },
  {
    id: 'words-of-wrath-and-grace',
    name: 'Words of Wrath and Grace',
    flavorText: 'Your saint grants your enemies a vision of pain and fills your allies with healing energy.',
    actionType: 'action',
    essenceCost: 7,
    keywords: ['Area', 'Magic'],
    distance: '5 burst',
    target: 'Each enemy in the area',
    powerRoll: {
      characteristic: 'intuition',
      tier1: '2 holy damage',
      tier2: '5 holy damage',
      tier3: '7 holy damage',
    },
    effect: 'Each ally in the area can spend a Recovery.',
  },
];

// ============================================================
// 9-PIETY ABILITIES
// ============================================================

export const conduitNinePietyAbilities: Ability[] = [
  {
    id: 'beacon-of-grace',
    name: 'Beacon of Grace',
    flavorText: 'You ignite a foe with holy radiance, rewarding allies who attack them.',
    actionType: 'action',
    essenceCost: 9,
    keywords: ['Magic', 'Ranged', 'Strike'],
    distance: 'Ranged 10',
    target: 'One creature',
    powerRoll: {
      characteristic: 'intuition',
      tier1: '8 + I holy damage',
      tier2: '13 + I holy damage',
      tier3: '17 + I holy damage',
    },
    effect: 'Until the end of the encounter, whenever you or any ally damages the target using an ability, that creature can spend a Recovery. If the target is reduced to 0 Stamina before the end of the encounter, you can use a free triggered action to move this effect to another creature within distance.',
  },
  {
    id: 'penance',
    name: 'Penance',
    flavorText: '"If you won\'t kneel, the gods will make you."',
    actionType: 'action',
    essenceCost: 9,
    keywords: ['Area', 'Magic', 'Ranged'],
    distance: '4 cube within 10',
    target: 'Each enemy in the area',
    powerRoll: {
      characteristic: 'intuition',
      tier1: '4 corruption damage; I < WEAK, prone and can\'t stand (save ends)',
      tier2: '7 corruption damage; I < AVERAGE, prone and can\'t stand (save ends)',
      tier3: '11 corruption damage; I < STRONG, prone and can\'t stand (save ends)',
    },
    effect: '',
  },
  {
    id: 'sanctuary',
    name: 'Sanctuary',
    flavorText: 'You send yourself or an ally to a divine manifold to instantaneously regain health.',
    actionType: 'maneuver',
    essenceCost: 9,
    keywords: ['Magic', 'Ranged'],
    distance: 'Ranged 10',
    target: 'Self or one ally',
    effect: 'The target is removed from the encounter map until the start of their next turn and can spend any number of Recoveries. At the start of their turn, the target reappears in the space they left or the nearest unoccupied space of their choice.',
  },
  {
    id: 'vessel-of-retribution',
    name: 'Vessel of Retribution',
    flavorText: 'You infuse yourself or an ally with the retributive energy of the gods, waiting to be unleashed.',
    actionType: 'maneuver',
    essenceCost: 9,
    keywords: ['Magic', 'Ranged'],
    distance: 'Ranged 10',
    target: 'Self or one ally',
    effect: 'The first time the target is dying or winded before the end of the encounter, each enemy within 5 squares of them takes 15 holy damage.',
  },
];

// ============================================================
// 11-PIETY ABILITIES
// ============================================================

export const conduitElevenPietyAbilities: Ability[] = [
  {
    id: 'arise',
    name: 'Arise!',
    flavorText: 'Your deity rewards you or an ally on the verge of defeat with a miracle burst of strength and resolve.',
    actionType: 'action',
    essenceCost: 11,
    keywords: ['Magic', 'Ranged'],
    distance: 'Ranged 10',
    target: 'Self or one ally',
    effect: 'The target can spend any number of Recoveries, can end any effects on them that are ended by a saving throw or that end at the end of their turn, and can stand up if they are prone. Additionally, at the start of each of their turns until the end of the encounter or until they are dying, the target gains 3 surges.',
  },
  {
    id: 'blessing-of-steel',
    name: 'Blessing of Steel',
    flavorText: 'A protective aura defends your allies from harm.',
    actionType: 'maneuver',
    essenceCost: 11,
    keywords: ['Area', 'Magic'],
    distance: '5 aura',
    target: 'Self and each ally in the area',
    effect: 'Until the end of the encounter, any ability roll made against a target takes a bane and each target has damage immunity 5.',
  },
  {
    id: 'blessing-of-the-blade',
    name: 'Blessing of the Blade',
    flavorText: '"The power of the gods is within you, friends. Allow me to unleash it."',
    actionType: 'maneuver',
    essenceCost: 11,
    keywords: ['Area', 'Magic'],
    distance: '5 aura',
    target: 'Self and each ally in the area',
    effect: 'At the end of each of your turns until the end of the encounter or until you are dying, each target gains 3 surges.',
  },
  {
    id: 'drag-the-unworthy',
    name: 'Drag the Unworthy',
    flavorText: 'You conjure an angel who moves a foe and heals your allies.',
    actionType: 'action',
    essenceCost: 11,
    keywords: ['Magic', 'Ranged', 'Strike'],
    distance: 'Ranged 10',
    target: 'One creature or object',
    powerRoll: {
      characteristic: 'intuition',
      tier1: '9 + I holy damage; slide 3',
      tier2: '13 + I holy damage; slide 4',
      tier3: '18 + I holy damage; slide 6',
    },
    effect: 'Each ally the target comes adjacent to during the forced movement can spend a Recovery.',
  },
];

// ============================================================
// TRIGGERED ACTIONS
// ============================================================

export const conduitTriggeredActions: Ability[] = [
  {
    id: 'word-of-guidance',
    name: 'Word of Guidance',
    flavorText: 'You invigorate an attacking ally with divine energy.',
    actionType: 'triggered',
    keywords: ['Magic', 'Ranged'],
    distance: 'Ranged 10',
    target: 'One ally',
    trigger: 'The target makes an ability roll for a damage-dealing ability.',
    effect: 'The power roll gains an edge. Spend 1 Piety: The power roll has a double edge.',
  },
  {
    id: 'word-of-judgment',
    name: 'Word of Judgment',
    flavorText: 'Your holy word saps an attacking enemy\'s strength.',
    actionType: 'triggered',
    keywords: ['Magic', 'Ranged'],
    distance: 'Ranged 10',
    target: 'One ally',
    trigger: 'The target would take damage from an ability that uses a power roll.',
    effect: 'The power roll takes a bane against the target. Spend 1 Piety: The power roll has a double bane against the target.',
  },
];

// ============================================================
// COMBINED EXPORTS
// ============================================================

export const conduitAbilities: Ability[] = [
  ...conduitSignatureAbilities,
  rayOfWrath,
  healingGrace,
  ...conduitThreePietyAbilities,
  ...conduitFivePietyAbilities,
  ...conduitSevenPietyAbilities,
  ...conduitNinePietyAbilities,
  ...conduitElevenPietyAbilities,
];

// Helper functions
export const getConduitAbilityById = (id: string): Ability | undefined => {
  return conduitAbilities.find(a => a.id === id);
};

export const getConduitAbilitiesByCost = (maxCost: number): Ability[] => {
  return conduitAbilities.filter(a => (a.essenceCost || 0) <= maxCost);
};

export const getConduitSignatureAbilities = (): Ability[] => {
  return conduitSignatureAbilities;
};

export const getConduitHeroicAbilities = (): Ability[] => {
  return conduitAbilities.filter(a => a.essenceCost && a.essenceCost > 0);
};
