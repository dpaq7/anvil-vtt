/**
 * Censor Class Abilities - Synced with Draw Steel Heroes v1
 * Resource: Wrath
 */
import type { Ability } from '@anvil/types';

// ============================================================
// SIGNATURE ABILITIES (No cost, at-will)
// ============================================================

export const censorSignatureAbilities: Ability[] = [
  {
    id: 'back-blasphemer',
    name: 'Back Blasphemer!',
    flavorText: 'You channel power through your weapon to repel foes.',
    actionType: 'action',
    keywords: ['Area', 'Magic', 'Melee', 'Weapon'],
    distance: '2 cube within 1',
    target: 'Each enemy in the area',
    powerRoll: {
      characteristic: 'presence',
      tier1: '2 holy damage; push 1',
      tier2: '4 holy damage; push 2',
      tier3: '6 holy damage; push 3',
    },
    effect: '',
  },
  {
    id: 'every-step-death',
    name: 'Every Step... Death!',
    flavorText: 'You show your foe a glimpse of their fate after death.',
    actionType: 'action',
    keywords: ['Magic', 'Ranged', 'Strike'],
    distance: 'Ranged 10',
    target: 'One creature',
    powerRoll: {
      characteristic: 'presence',
      tier1: '5 + P psychic damage',
      tier2: '7 + P psychic damage',
      tier3: '10 + P psychic damage',
    },
    effect: 'Each time the target willingly moves before the end of your next turn, they take 1 psychic damage for each square they move.',
  },
  {
    id: 'halt-miscreant',
    name: 'Halt Miscreant!',
    flavorText: 'You infuse your weapon with holy magic that makes it difficult for your foe to get away.',
    actionType: 'action',
    keywords: ['Melee', 'Strike', 'Weapon'],
    distance: 'Melee 1',
    target: 'One creature or object',
    powerRoll: {
      characteristic: 'might',
      tier1: '2 + M holy damage; P < WEAK, slowed (save ends)',
      tier2: '5 + M holy damage; P < AVERAGE, slowed (save ends)',
      tier3: '7 + M holy damage; P < STRONG, slowed (save ends)',
    },
    effect: '',
  },
  {
    id: 'your-allies-cannot-save-you',
    name: 'Your Allies Cannot Save You!',
    flavorText: 'Your magic strike turns your foe\'s guilt into a burst of holy power.',
    actionType: 'action',
    keywords: ['Melee', 'Strike', 'Weapon'],
    distance: 'Melee 1',
    target: 'One creature or object',
    powerRoll: {
      characteristic: 'might',
      tier1: '3 + M holy damage',
      tier2: '5 + M holy damage',
      tier3: '8 + M holy damage',
    },
    effect: 'Each enemy adjacent to the target is pushed away from the target up to a number of squares equal to your Presence score.',
  },
];

// ============================================================
// 3-WRATH ABILITIES
// ============================================================

export const censorThreeWrathAbilities: Ability[] = [
  {
    id: 'behold-a-shield-of-faith',
    name: 'Behold a Shield of Faith!',
    flavorText: 'A mighty blow turns your foe\'s vitality into a holy light that envelops you and an ally, discouraging enemies who might attack you.',
    actionType: 'action',
    essenceCost: 3,
    keywords: ['Melee', 'Strike', 'Weapon'],
    distance: 'Melee 1',
    target: 'One creature or object',
    powerRoll: {
      characteristic: 'might',
      tier1: '3 + M holy damage',
      tier2: '6 + M holy damage',
      tier3: '9 + M holy damage',
    },
    effect: 'Until the start of your next turn, enemies take a bane on ability rolls made against you or any ally adjacent to you.',
  },
  {
    id: 'driving-assault',
    name: 'Driving Assault',
    flavorText: 'As you force your enemy back with your weapon, you use your faith to stay close.',
    actionType: 'action',
    essenceCost: 3,
    keywords: ['Melee', 'Strike', 'Weapon'],
    distance: 'Melee 1',
    target: 'One creature or object',
    powerRoll: {
      characteristic: 'might',
      tier1: '3 + M damage; push 1',
      tier2: '6 + M damage; push 3',
      tier3: '9 + M damage; push 5',
    },
    effect: 'You can shift up to your speed in a straight line toward the target after pushing them.',
  },
  {
    id: 'the-gods-punish-and-defend',
    name: 'The Gods Punish and Defend',
    flavorText: 'You channel holy energy to smite a foe and heal an ally.',
    actionType: 'action',
    essenceCost: 3,
    keywords: ['Magic', 'Melee', 'Strike', 'Weapon'],
    distance: 'Melee 1',
    target: 'One creature or object',
    powerRoll: {
      characteristic: 'might',
      tier1: '5 + M holy damage',
      tier2: '8 + M holy damage',
      tier3: '11 + M holy damage',
    },
    effect: 'You can spend a Recovery to allow yourself or one ally within 10 squares to regain Stamina equal to your recovery value.',
  },
  {
    id: 'repent',
    name: 'Repent!',
    flavorText: 'You conjure memories of their sins to harry your foes.',
    actionType: 'action',
    essenceCost: 3,
    keywords: ['Magic', 'Ranged', 'Strike'],
    distance: 'Ranged 10',
    target: 'One creature',
    powerRoll: {
      characteristic: 'presence',
      tier1: '5 + P holy damage; I < WEAK, dazed (save ends)',
      tier2: '8 + P holy damage; I < AVERAGE, dazed (save ends)',
      tier3: '11 + P holy damage; I < STRONG, dazed (save ends)',
    },
    effect: '',
  },
];

// ============================================================
// 5-WRATH ABILITIES
// ============================================================

export const censorFiveWrathAbilities: Ability[] = [
  {
    id: 'arrest',
    name: 'Arrest',
    flavorText: '"I got you, you son of a bitch."',
    actionType: 'action',
    essenceCost: 5,
    keywords: ['Magic', 'Melee', 'Strike', 'Weapon'],
    distance: 'Melee 1',
    target: 'One creature',
    powerRoll: {
      characteristic: 'might',
      tier1: '6 + M holy damage; grabbed',
      tier2: '9 + M holy damage; grabbed',
      tier3: '13 + M holy damage; grabbed',
    },
    effect: 'If the target makes a strike against a creature while grabbed this way, you can spend 3 wrath to deal holy damage to them equal to your Presence score, then change the target of the strike to another target within the strike\'s distance.',
  },
  {
    id: 'behold-the-face-of-justice',
    name: 'Behold the Face of Justice!',
    flavorText: 'You attack a foe and your enemies behold a vision of the true nature of your resolve.',
    actionType: 'action',
    essenceCost: 5,
    keywords: ['Magic', 'Melee', 'Ranged', 'Strike', 'Weapon'],
    distance: 'Melee 1 or ranged 5',
    target: 'One creature',
    powerRoll: {
      characteristic: 'might',
      tier1: '3 + M holy damage; if the target has P < WEAK, each enemy within 2 squares of them is frightened of you (save ends)',
      tier2: '5 + M holy damage; if the target has P < AVERAGE, each enemy within 2 squares of them is frightened of you (save ends)',
      tier3: '8 + M holy damage; if the target has P < STRONG, each enemy within 2 squares of them is frightened of you (save ends)',
    },
    effect: 'Each enemy frightened this way is pushed up to 2 squares away from the target and takes psychic damage equal to your Presence score.',
  },
  {
    id: 'censored',
    name: 'Censored',
    flavorText: 'Judged and sentenced.',
    actionType: 'action',
    essenceCost: 5,
    keywords: ['Melee', 'Strike', 'Weapon'],
    distance: 'Melee 1',
    target: 'One creature',
    powerRoll: {
      characteristic: 'might',
      tier1: '2 + M holy damage',
      tier2: '3 + M holy damage',
      tier3: '5 + M holy damage',
    },
    effect: 'When a target who is not a leader or solo creature is made winded by this ability, they are reduced to 0 Stamina.',
  },
  {
    id: 'purifying-fire',
    name: 'Purifying Fire',
    flavorText: 'The gods judge, fire cleanses.',
    actionType: 'action',
    essenceCost: 5,
    keywords: ['Magic', 'Melee', 'Ranged', 'Strike', 'Weapon'],
    distance: 'Melee 1 or ranged 5',
    target: 'One creature',
    powerRoll: {
      characteristic: 'might',
      tier1: '5 + M holy damage; M < WEAK, the target has fire weakness 3 (save ends)',
      tier2: '9 + M holy damage; M < AVERAGE, the target has fire weakness 5 (save ends)',
      tier3: '12 + M holy damage; M < STRONG, the target has fire weakness 7 (save ends)',
    },
    effect: 'While the target has fire weakness from this ability, you can choose to have your abilities deal fire damage to the target instead of holy damage.',
  },
];

// ============================================================
// 7-WRATH ABILITIES
// ============================================================

export const censorSevenWrathAbilities: Ability[] = [
  {
    id: 'edict-of-disruptive-isolation',
    name: 'Edict of Disruptive Isolation',
    flavorText: 'The evil within your foes detonates with holy fire that burns only the guilty.',
    actionType: 'maneuver',
    essenceCost: 7,
    keywords: ['Area', 'Magic'],
    distance: '2 aura',
    target: 'Each enemy in the area',
    effect: 'Until the end of the encounter or until you are dying, each target takes holy damage equal to your Presence score at the end of each of your turns. A target takes an extra 2d6 holy damage if they are judged by you or if they are adjacent to any enemy.',
  },
  {
    id: 'edict-of-perfect-order',
    name: 'Edict of Perfect Order',
    flavorText: 'Within the area of your divine presence, your enemies will regret using their fell abilities.',
    actionType: 'maneuver',
    essenceCost: 7,
    keywords: ['Area', 'Magic'],
    distance: '2 aura',
    target: 'Each enemy in the area',
    effect: 'Until the end of the encounter or until you are dying, whenever a target uses an ability that costs Malice, they take holy damage equal to three times your Presence score. A target judged by you takes an extra 2d6 holy damage.',
  },
  {
    id: 'edict-of-purifying-pacifism',
    name: 'Edict of Purifying Pacifism',
    flavorText: 'You shed a righteous energy that punishes enemies who would harm you or your allies.',
    actionType: 'maneuver',
    essenceCost: 7,
    keywords: ['Area', 'Magic'],
    distance: '2 aura',
    target: 'Each enemy in the area',
    effect: 'Until the end of the encounter or until you are dying, whenever a target makes a strike, they take holy damage equal to twice your Presence score. A target judged by you takes an extra 2d6 holy damage.',
  },
  {
    id: 'edict-of-stillness',
    name: 'Edict of Stillness',
    flavorText: 'The holy aura you project makes it painful for evil-doers to leave your reach.',
    actionType: 'maneuver',
    essenceCost: 7,
    keywords: ['Area', 'Magic'],
    distance: '2 aura',
    target: 'Each enemy in the area',
    effect: 'Until the end of the encounter or until you are dying, whenever a target moves or is force moved out of the area, they take holy damage equal to twice your Presence score. A target judged by you who moves willingly takes an extra 2d6 holy damage.',
  },
];

// ============================================================
// 9-WRATH ABILITIES
// ============================================================

export const censorNineWrathAbilities: Ability[] = [
  {
    id: 'gods-grant-thee-strength',
    name: 'Gods Grant Thee Strength',
    flavorText: 'You channel divine force for movement that cannot be stopped.',
    actionType: 'action',
    essenceCost: 9,
    keywords: ['Ranged'],
    distance: 'Ranged 10',
    target: 'Self or one ally',
    effect: 'The target ends any condition or effect on them that is ended by a saving throw or that ends at the end of their turn, or a prone target can stand up. The target then gains 2 surges, can shift up to their speed while ignoring difficult terrain, and can use a strike signature ability as a free triggered action.',
  },
  {
    id: 'orison-of-victory',
    name: 'Orison of Victory',
    flavorText: 'You channel your god\'s will to overcome hardship and inflict pain.',
    actionType: 'maneuver',
    essenceCost: 9,
    keywords: ['Area'],
    distance: '1 burst',
    target: 'Self and each ally in the area',
    powerRoll: {
      characteristic: 'presence',
      tier1: 'Each target gains 1 surge.',
      tier2: 'Each target gains 2 surges.',
      tier3: 'Each target gains 3 surges.',
    },
    effect: 'A target can end one effect on them that is ended by a saving throw or that ends at the end of their turn, or a prone target can stand up.',
  },
  {
    id: 'righteous-judgment',
    name: 'Righteous Judgment',
    flavorText: 'You amplify the power of your judgment.',
    actionType: 'action',
    essenceCost: 9,
    keywords: ['Melee', 'Strike', 'Weapon'],
    distance: 'Melee 1',
    target: 'One creature',
    powerRoll: {
      characteristic: 'might',
      tier1: '10 + M damage',
      tier2: '14 + M damage',
      tier3: '20 + M damage',
    },
    effect: 'Until the end of the encounter, whenever any ally deals damage to a target judged by you, that ally gains 1 surge.',
  },
  {
    id: 'shield-of-the-righteous',
    name: 'Shield of the Righteous',
    flavorText: 'You strike a foe and create a fleet of divine shields that protect your allies.',
    actionType: 'action',
    essenceCost: 9,
    keywords: ['Melee', 'Strike', 'Weapon'],
    distance: 'Melee 1',
    target: 'One creature',
    powerRoll: {
      characteristic: 'might',
      tier1: '10 + M damage; you and each ally adjacent to you gain 10 temporary Stamina',
      tier2: '14 + M damage; you and each ally adjacent to you gain 15 temporary Stamina',
      tier3: '20 + M damage; you and each ally adjacent to you gain 20 temporary Stamina',
    },
    effect: '',
  },
];

// ============================================================
// 11-WRATH ABILITIES
// ============================================================

export const censorElevenWrathAbilities: Ability[] = [
  {
    id: 'excommunication',
    name: 'Excommunication',
    flavorText: 'You curse your foe to become a bane to their allies.',
    actionType: 'action',
    essenceCost: 11,
    keywords: ['Melee', 'Strike', 'Weapon'],
    distance: 'Melee 1',
    target: 'One creature',
    powerRoll: {
      characteristic: 'might',
      tier1: '9 + M damage; I < WEAK, weakened (save ends)',
      tier2: '13 + M damage; I < AVERAGE, weakened (save ends)',
      tier3: '18 + M damage; I < STRONG, weakened (save ends)',
    },
    effect: 'At the end of each of your turns, a target weakened this way deals holy damage equal to twice your Presence score to each enemy within 2 squares of them. Additionally, a target weakened this way can\'t be targeted by their allies\' abilities.',
  },
  {
    id: 'hand-of-the-gods',
    name: 'Hand of the Gods',
    flavorText: 'You use your foe as a tool against your enemies.',
    actionType: 'action',
    essenceCost: 11,
    keywords: ['Ranged', 'Strike', 'Weapon'],
    distance: 'Ranged 10',
    target: 'One creature',
    powerRoll: {
      characteristic: 'might',
      tier1: '10 + M damage',
      tier2: '15 + M damage',
      tier3: '21 + M damage',
    },
    effect: 'Until the end of the encounter, while the target is judged by you, you can choose to make them the source of any of your abilities. Additionally, the target counts as an ally for the purpose of flanking.',
  },
  {
    id: 'pillar-of-holy-fire',
    name: 'Pillar of Holy Fire',
    flavorText: 'Your enemy\'s guilt fuels a holy flame that burns your foes.',
    actionType: 'action',
    essenceCost: 11,
    keywords: ['Melee', 'Strike', 'Weapon'],
    distance: 'Melee 1',
    target: 'One creature',
    powerRoll: {
      characteristic: 'might',
      tier1: '9 + M damage; I < WEAK, dazed (save ends)',
      tier2: '13 + M damage; I < AVERAGE, dazed (save ends)',
      tier3: '18 + M damage; I < STRONG, dazed (save ends)',
    },
    effect: 'At the end of each of your turns, a target dazed this way deals holy damage equal to twice your Presence score to each enemy within 2 squares of them.',
  },
  {
    id: 'your-allies-turn-on-you',
    name: 'Your Allies Turn on You!',
    flavorText: 'You turn your enemies\' ire to the target.',
    actionType: 'action',
    essenceCost: 11,
    keywords: ['Ranged', 'Strike', 'Weapon'],
    distance: 'Ranged 10',
    target: 'One creature',
    powerRoll: {
      characteristic: 'presence',
      tier1: '5 + P damage; I < WEAK, slowed (save ends)',
      tier2: '9 + P damage; I < AVERAGE, slowed (save ends)',
      tier3: '12 + P damage; I < STRONG, slowed (save ends)',
    },
    effect: 'While the target is slowed this way, each of their allies who starts their turn within 5 squares of them must use a free maneuver to make a free strike against the target. Additionally, while the target is slowed this way, each of their allies within 5 squares of them who can make a triggered free strike against a different creature must make the free strike against the target instead.',
  },
];

// ============================================================
// COMBINED EXPORTS
// ============================================================

// All core Censor abilities
export const censorAbilities: Ability[] = [
  ...censorSignatureAbilities,
  ...censorThreeWrathAbilities,
  ...censorFiveWrathAbilities,
  ...censorSevenWrathAbilities,
  ...censorNineWrathAbilities,
  ...censorElevenWrathAbilities,
];

// Helper functions
export const getAbilityById = (id: string): Ability | undefined => {
  return censorAbilities.find(a => a.id === id);
};

export const getAbilitiesByCost = (maxCost: number): Ability[] => {
  return censorAbilities.filter(a => (a.essenceCost || 0) <= maxCost);
};

export const getSignatureAbilities = (): Ability[] => {
  return censorSignatureAbilities;
};

export const getHeroicAbilities = (): Ability[] => {
  return censorAbilities.filter(a => a.essenceCost && a.essenceCost > 0);
};
