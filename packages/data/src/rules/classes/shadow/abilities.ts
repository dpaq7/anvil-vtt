/**
 * Shadow Class Abilities - Synced with Draw Steel Heroes v1
 * Resource: Insight
 */
import type { Ability } from '@anvil/types';

// ============================================================
// SIGNATURE ABILITIES (No cost, at-will)
// ============================================================

export const shadowSignatureAbilities: Ability[] = [
  {
    id: 'gasping-in-pain',
    name: 'Gasping in Pain',
    flavorText: 'Your precise strikes let your allies take advantage of a target\'s agony.',
    actionType: 'action',
    keywords: ['Melee', 'Strike', 'Weapon'],
    distance: 'Melee 1',
    target: 'One creature',
    powerRoll: {
      characteristic: 'agility',
      tier1: '3 + A damage',
      tier2: '5 + A damage',
      tier3: '8 + A damage; I < STRONG, prone',
    },
    effect: 'One ally within 5 squares of the target gains 1 surge.',
  },
  {
    id: 'i-work-better-alone',
    name: 'I Work Better Alone',
    flavorText: '"It\'s better, just you and me. Isn\'t it?"',
    actionType: 'action',
    keywords: ['Melee', 'Ranged', 'Strike', 'Weapon'],
    distance: 'Melee 1 or ranged 5',
    target: 'One creature',
    powerRoll: {
      characteristic: 'agility',
      tier1: '3 + A damage',
      tier2: '6 + A damage',
      tier3: '9 + A damage',
    },
    effect: 'If the target has none of your allies adjacent to them, you gain 1 surge before making the power roll.',
  },
  {
    id: 'teamwork-has-its-place',
    name: 'Teamwork Has Its Place',
    flavorText: 'You attack an enemy as an ally exposes their weakness.',
    actionType: 'action',
    keywords: ['Melee', 'Ranged', 'Strike', 'Weapon'],
    distance: 'Melee 1 or ranged 5',
    target: 'One creature or object',
    powerRoll: {
      characteristic: 'agility',
      tier1: '3 + A damage',
      tier2: '6 + A damage',
      tier3: '9 + A damage',
    },
    effect: 'If any ally is adjacent to the target, you gain 1 surge before making the power roll.',
  },
  {
    id: 'you-were-watching-the-wrong-one',
    name: 'You Were Watching the Wrong One',
    flavorText: 'They can\'t watch both of you at once.',
    actionType: 'action',
    keywords: ['Melee', 'Strike', 'Weapon'],
    distance: 'Melee 1',
    target: 'One creature',
    powerRoll: {
      characteristic: 'agility',
      tier1: '3 + A damage',
      tier2: '5 + A damage',
      tier3: '8 + A damage',
    },
    effect: 'As long as you have one or more allies within 5 squares of the target, you gain 1 surge. If you are flanking the target when you use this ability, choose one ally who is flanking with you. That ally also gains 1 surge.',
  },
];

// ============================================================
// 3-INSIGHT ABILITIES
// ============================================================

export const shadowThreeInsightAbilities: Ability[] = [
  {
    id: 'disorienting-strike',
    name: 'Disorienting Strike',
    flavorText: 'Your attack leaves them reeling, allowing you to follow up.',
    actionType: 'action',
    essenceCost: 3,
    keywords: ['Melee', 'Strike', 'Weapon'],
    distance: 'Melee 1',
    target: 'One creature',
    powerRoll: {
      characteristic: 'agility',
      tier1: '4 + A damage; slide 2',
      tier2: '6 + A damage; slide 3',
      tier3: '10 + A damage; slide 5',
    },
    effect: 'You can shift into any square the target leaves when you slide them.',
  },
  {
    id: 'eviscerate',
    name: 'Eviscerate',
    flavorText: 'You leave your foe bleeding out after a devastating attack.',
    actionType: 'action',
    essenceCost: 3,
    keywords: ['Melee', 'Ranged', 'Strike', 'Weapon'],
    distance: 'Melee 1 or ranged 5',
    target: 'One creature',
    powerRoll: {
      characteristic: 'agility',
      tier1: '4 + A damage; R < WEAK, bleeding (save ends)',
      tier2: '6 + A damage; R < AVERAGE, bleeding (save ends)',
      tier3: '10 + A damage; R < STRONG, bleeding (save ends)',
    },
    effect: '',
  },
  {
    id: 'get-in-get-out',
    name: 'Get In Get Out',
    flavorText: 'Move unexpectedly, strike fast, and be gone!',
    actionType: 'action',
    essenceCost: 3,
    keywords: ['Melee', 'Strike', 'Weapon'],
    distance: 'Melee 1',
    target: 'One creature',
    powerRoll: {
      characteristic: 'agility',
      tier1: '5 + A damage',
      tier2: '8 + A damage',
      tier3: '11 + A damage',
    },
    effect: '',
  },
  {
    id: 'two-throats-at-once',
    name: 'Two Throats at Once',
    flavorText: 'A bargain.',
    actionType: 'action',
    essenceCost: 3,
    keywords: ['Melee', 'Ranged', 'Strike', 'Weapon'],
    distance: 'Melee 1 or ranged 5',
    target: 'Two creatures or objects',
    powerRoll: {
      characteristic: 'agility',
      tier1: '4 damage',
      tier2: '6 damage',
      tier3: '10 damage',
    },
    effect: '',
  },
];

// ============================================================
// 5-INSIGHT ABILITIES
// ============================================================

export const shadowFiveInsightAbilities: Ability[] = [
  {
    id: 'coup-de-grace',
    name: 'Coup de Grace',
    flavorText: 'Your blade might be the last thing they see.',
    actionType: 'action',
    essenceCost: 5,
    keywords: ['Melee', 'Ranged', 'Strike', 'Weapon'],
    distance: 'Melee 1 or ranged 5',
    target: 'One creature',
    powerRoll: {
      characteristic: 'agility',
      tier1: '2d6 + 7 + A damage',
      tier2: '2d6 + 11 + A damage',
      tier3: '2d6 + 16 + A damage',
    },
    effect: '',
  },
  {
    id: 'one-hundred-throats',
    name: 'One Hundred Throats',
    flavorText: 'As you move across the battlefield, every foe within reach feels your wrath.',
    actionType: 'action',
    essenceCost: 5,
    keywords: ['Melee', 'Weapon'],
    distance: 'Self; see below',
    target: 'Self',
    powerRoll: {
      characteristic: 'agility',
      tier1: '3 damage',
      tier2: '6 damage',
      tier3: '9 damage',
    },
    effect: 'You shift up to your speed and make one power roll that targets up to three enemies who came adjacent to you during the move.',
  },
  {
    id: 'setup',
    name: 'Setup',
    flavorText: 'Your friends will thank you.',
    actionType: 'action',
    essenceCost: 5,
    keywords: ['Ranged', 'Strike', 'Weapon'],
    distance: 'Ranged 5',
    target: 'One creature',
    powerRoll: {
      characteristic: 'agility',
      tier1: '6 + A damage; R < WEAK, the target has damage weakness 5 (save ends)',
      tier2: '9 + A damage; R < AVERAGE, the target has damage weakness 5 (save ends)',
      tier3: '13 + A damage; R < STRONG, the target has damage weakness 5 (save ends)',
    },
    effect: '',
  },
  {
    id: 'shadowstrike',
    name: 'Shadowstrike',
    flavorText: 'They have no idea what the college taught you.',
    actionType: 'action',
    essenceCost: 5,
    keywords: ['Magic', 'Melee', 'Ranged'],
    distance: 'Self; see below',
    target: 'Self',
    effect: 'You use a strike signature ability twice.',
  },
];

// ============================================================
// 7-INSIGHT ABILITIES
// ============================================================

export const shadowSevenInsightAbilities: Ability[] = [
  {
    id: 'dancer',
    name: 'Dancer',
    flavorText: 'You enter a flow state that makes you nearly impossible to pin down.',
    actionType: 'maneuver',
    essenceCost: 7,
    keywords: [],
    distance: 'Self',
    target: 'Self',
    effect: 'Until the end of the encounter, whenever an enemy moves or is force moved adjacent to you or damages you, you can take the Disengage move action as a free triggered action.',
  },
  {
    id: 'misdirecting-strike',
    name: 'Misdirecting Strike',
    flavorText: '"Why are you looking at ME?!"',
    actionType: 'action',
    essenceCost: 7,
    keywords: ['Melee', 'Ranged', 'Strike', 'Weapon'],
    distance: 'Melee 1 or ranged 5',
    target: 'One creature',
    powerRoll: {
      characteristic: 'agility',
      tier1: '9 + A damage',
      tier2: '13 + A damage',
      tier3: '18 + A damage',
    },
    effect: 'The target is taunted by a willing ally within 5 squares of you until the end of the target\'s next turn.',
  },
  {
    id: 'pinning-shot',
    name: 'Pinning Shot',
    flavorText: 'One missile—placed well and placed hard.',
    actionType: 'action',
    essenceCost: 7,
    keywords: ['Ranged', 'Strike', 'Weapon'],
    distance: 'Ranged 5',
    target: 'One creature',
    powerRoll: {
      characteristic: 'agility',
      tier1: '8 + A damage; A < WEAK, restrained (save ends)',
      tier2: '12 + A damage; A < AVERAGE, restrained (save ends)',
      tier3: '16 + A damage; A < STRONG, restrained (save ends)',
    },
    effect: '',
  },
  {
    id: 'staggering-blow',
    name: 'Staggering Blow',
    flavorText: 'There\'s no recovering from this.',
    actionType: 'action',
    essenceCost: 7,
    keywords: ['Melee', 'Ranged', 'Strike', 'Weapon'],
    distance: 'Melee 1 or ranged 5',
    target: 'One creature',
    powerRoll: {
      characteristic: 'agility',
      tier1: '7 + A damage; M < WEAK, slowed (save ends)',
      tier2: '11 + A damage; M < AVERAGE, prone and can\'t stand (save ends)',
      tier3: '16 + A damage; M < STRONG, prone and can\'t stand (save ends)',
    },
    effect: '',
  },
];

// ============================================================
// 9-INSIGHT ABILITIES
// ============================================================

export const shadowNineInsightAbilities: Ability[] = [
  {
    id: 'blackout',
    name: 'Blackout',
    flavorText: 'You cause a plume of shadow to erupt from your eyes and create a cloud of darkness.',
    actionType: 'maneuver',
    essenceCost: 9,
    keywords: ['Area', 'Magic'],
    distance: '3 burst',
    target: 'Special',
    effect: 'A black cloud fills the area until the end of your next turn, granting you and your allies concealment against enemies. While you are in the area, whenever an enemy ends their turn in the area, you can use a free triggered action to shift to a new location within the area and make a free strike against them.',
  },
  {
    id: 'into-the-shadows',
    name: 'Into the Shadows',
    flavorText: 'You sweep your foe off their feet and plunge them into absolute darkness.',
    actionType: 'action',
    essenceCost: 9,
    keywords: ['Magic', 'Melee', 'Strike', 'Weapon'],
    distance: 'Melee 1',
    target: 'One creature or object',
    powerRoll: {
      characteristic: 'agility',
      tier1: '8 + A corruption damage',
      tier2: '13 + A corruption damage',
      tier3: '17 + A corruption damage',
    },
    effect: 'You and the target are removed from the encounter map until the start of your next turn. You reappear in the spaces you left or the nearest unoccupied spaces. Make a power roll upon your return.',
  },
  {
    id: 'shadowfall',
    name: 'Shadowfall',
    flavorText: 'You vanish. They fall. You reappear.',
    actionType: 'action',
    essenceCost: 9,
    keywords: ['Area', 'Melee', 'Weapon'],
    distance: '10 x 1 line within 1',
    target: 'Each enemy in the area',
    powerRoll: {
      characteristic: 'agility',
      tier1: '10 damage',
      tier2: '14 damage',
      tier3: '20 damage',
    },
    effect: 'You disappear before making the power roll. After the power roll is resolved, you appear in the first unoccupied space at the far end of the line.',
  },
  {
    id: 'you-talk-too-much',
    name: 'You Talk Too Much',
    flavorText: 'Silence is a virtue. A knife pinning their mouth shut is the next best thing.',
    actionType: 'action',
    essenceCost: 9,
    keywords: ['Melee', 'Ranged', 'Strike', 'Weapon'],
    distance: 'Melee 1 or ranged 5',
    target: 'One creature',
    powerRoll: {
      characteristic: 'agility',
      tier1: '10 + A damage; P < WEAK, dazed (save ends)',
      tier2: '15 + A damage; P < AVERAGE, dazed (save ends)',
      tier3: '21 + A damage; P < STRONG, dazed (save ends)',
    },
    effect: 'The target can\'t communicate with anyone until the end of the encounter.',
  },
];

// ============================================================
// 11-INSIGHT ABILITIES
// ============================================================

export const shadowElevenInsightAbilities: Ability[] = [
  {
    id: 'assassinate',
    name: 'Assassinate',
    flavorText: 'A practiced attack will instantly kill an already weakened foe.',
    actionType: 'action',
    essenceCost: 11,
    keywords: ['Melee', 'Strike', 'Weapon'],
    distance: 'Melee 1',
    target: 'One creature or object',
    powerRoll: {
      characteristic: 'agility',
      tier1: '12 + A damage',
      tier2: '18 + A damage',
      tier3: '24 + A damage',
    },
    effect: 'A target who is not a minion, leader, or solo creature and who is winded after taking this damage is reduced to 0 Stamina.',
  },
  {
    id: 'shadowgrasp',
    name: 'Shadowgrasp',
    flavorText: 'The shadows around you give way, allowing the shadow creature within you to grasp at your foes.',
    actionType: 'action',
    essenceCost: 11,
    keywords: ['Area', 'Magic'],
    distance: '2 burst',
    target: 'Each enemy in the area',
    powerRoll: {
      characteristic: 'agility',
      tier1: '11 corruption damage; A < WEAK, restrained (save ends)',
      tier2: '16 corruption damage; A < AVERAGE, restrained (save ends)',
      tier3: '21 corruption damage; A < STRONG, restrained (save ends)',
    },
    effect: '',
  },
  {
    id: 'speed-of-shadows',
    name: 'Speed of Shadows',
    flavorText: 'You make multiple strikes against a foe before they even notice they\'re dead.',
    actionType: 'action',
    essenceCost: 11,
    keywords: ['Magic'],
    distance: 'Self',
    target: 'Self',
    effect: 'You can use a strike signature ability four times, use a strike signature ability that gains an edge three times, or use a strike signature ability that has a double edge twice. You can shift up to 2 squares between each use.',
  },
  {
    id: 'they-always-line-up',
    name: 'They Always Line Up',
    flavorText: 'You fire a projectile so fast that it passes through a line of foes, hamstringing them.',
    actionType: 'action',
    essenceCost: 11,
    keywords: ['Area', 'Ranged', 'Weapon'],
    distance: '5 x 1 line within 5',
    target: 'Each enemy in the area',
    powerRoll: {
      characteristic: 'agility',
      tier1: '12 damage; M < WEAK, slowed (save ends)',
      tier2: '18 damage; M < AVERAGE, slowed (save ends)',
      tier3: '24 damage; M < STRONG, slowed (save ends)',
    },
    effect: '',
  },
];

// ============================================================
// COMBINED EXPORTS
// ============================================================

// All core Shadow abilities
export const shadowAbilities: Ability[] = [
  ...shadowSignatureAbilities,
  ...shadowThreeInsightAbilities,
  ...shadowFiveInsightAbilities,
  ...shadowSevenInsightAbilities,
  ...shadowNineInsightAbilities,
  ...shadowElevenInsightAbilities,
];

// Helper functions
export const getAbilityById = (id: string): Ability | undefined => {
  return shadowAbilities.find(a => a.id === id);
};

export const getAbilitiesByCost = (maxCost: number): Ability[] => {
  return shadowAbilities.filter(a => (a.essenceCost || 0) <= maxCost);
};

export const getSignatureAbilities = (): Ability[] => {
  return shadowSignatureAbilities;
};

export const getHeroicAbilities = (): Ability[] => {
  return shadowAbilities.filter(a => a.essenceCost && a.essenceCost > 0);
};
