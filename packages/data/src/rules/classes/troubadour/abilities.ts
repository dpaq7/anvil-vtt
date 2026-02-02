/**
 * Troubadour Class Abilities - Synced with Draw Steel Heroes v1
 * Resource: Drama
 */
import type { Ability } from '@anvil/types';

// ============================================================
// SIGNATURE ABILITIES (No cost, at-will)
// ============================================================

export const troubadourSignatureAbilities: Ability[] = [
  {
    id: 'artful-flourish',
    name: 'Artful Flourish',
    flavorText: 'And they said practicing fencing was a waste!',
    actionType: 'action',
    keywords: ['Melee', 'Strike', 'Weapon'],
    distance: 'Melee 1',
    target: 'Two creatures or objects',
    powerRoll: {
      characteristic: 'agility',
      tier1: '2 damage',
      tier2: '5 damage',
      tier3: '7 damage',
    },
    effect: 'You can shift up to 3 squares.\n\nSpend 2+ Drama: You can target one additional creature or object for every 2 drama spent.',
  },
  {
    id: 'cutting-sarcasm',
    name: 'Cutting Sarcasm',
    flavorText: 'There you are, radiating your usual charisma.',
    actionType: 'action',
    keywords: ['Magic', 'Ranged', 'Strike', 'Weapon'],
    distance: 'Ranged 10',
    target: 'One creature',
    powerRoll: {
      characteristic: 'presence',
      tier1: '2 + P psychic damage; P < WEAK, bleeding (save ends)',
      tier2: '5 + P psychic damage; P < AVERAGE, bleeding (save ends)',
      tier3: '7 + P psychic damage; P < STRONG, bleeding (save ends)',
    },
    effect: '',
  },
  {
    id: 'instigator',
    name: 'Instigator',
    flavorText: 'I didn\'t do it! What?',
    actionType: 'action',
    keywords: ['Melee', 'Strike', 'Weapon'],
    distance: 'Melee 1',
    target: 'One creature',
    powerRoll: {
      characteristic: 'presence',
      tier1: '3 + P damage',
      tier2: '6 + P damage',
      tier3: '9 + P damage',
    },
    effect: 'The target is taunted by you or a willing ally adjacent to you until the end of the target\'s next turn.',
  },
  {
    id: 'witty-banter',
    name: 'Witty Banter',
    flavorText: 'A lyrical (and physical) jab insults an enemy and inspires an ally.',
    actionType: 'action',
    keywords: ['Magic', 'Melee', 'Ranged', 'Strike'],
    distance: 'Melee 1 or ranged 5',
    target: 'One creature',
    powerRoll: {
      characteristic: 'presence',
      tier1: '4 + P psychic damage',
      tier2: '5 + P psychic damage',
      tier3: '7 + P psychic damage',
    },
    effect: 'One ally within 10 squares of you can end one effect on them that is ended by a saving throw or that ends at the end of their turn.\n\nSpend 1 Drama: The chosen ally can spend a Recovery.',
  },
];

// ============================================================
// 3-DRAMA ABILITIES
// ============================================================

export const troubadourThreeDramaAbilities: Ability[] = [
  {
    id: 'harsh-critic',
    name: 'Harsh Critic',
    flavorText: 'Just one bad review will ruin their day.',
    actionType: 'action',
    essenceCost: 3,
    keywords: ['Magic', 'Melee', 'Ranged', 'Strike'],
    distance: 'Melee 1 or ranged 10',
    target: 'One creature or object',
    powerRoll: {
      characteristic: 'presence',
      tier1: '7 + P sonic damage',
      tier2: '10 + P sonic damage',
      tier3: '13 + P sonic damage',
    },
    effect: 'The first time the target uses an ability before the start of your next turn, any effects from the ability\'s tier outcomes other than damage are negated for all targets. Ability effects that always happen regardless of the power roll work as usual.',
  },
  {
    id: 'hypnotic-overtones',
    name: 'Hypnotic Overtones',
    flavorText: 'You produce an entrancing note that twists the senses in a spectacular fashion.',
    actionType: 'action',
    essenceCost: 3,
    keywords: ['Area', 'Magic'],
    distance: '2 burst',
    target: 'Each enemy in the area',
    powerRoll: {
      characteristic: 'presence',
      tier1: 'Slide 1; I < WEAK, dazed (save ends)',
      tier2: 'Slide 1; I < AVERAGE, dazed (save ends)',
      tier3: 'Slide 2; I < STRONG, dazed (save ends)',
    },
    effect: 'Spend 2+ Drama: The size of the burst increases by 1 for every 2 drama spent.',
  },
  {
    id: 'quick-rewrite',
    name: 'Quick Rewrite',
    flavorText: 'You write something unexpected into the scene that hinders your enemy.',
    actionType: 'action',
    essenceCost: 3,
    keywords: ['Area', 'Magic', 'Ranged'],
    distance: '3 cube within 10',
    target: 'Each enemy in the area',
    powerRoll: {
      characteristic: 'presence',
      tier1: '4 damage; P < WEAK, slowed (save ends)',
      tier2: '5 damage; P < AVERAGE, slowed (save ends)',
      tier3: '6 damage; P < STRONG, restrained (save ends)',
    },
    effect: 'The area is difficult terrain for enemies.',
  },
  {
    id: 'upstage',
    name: 'Upstage',
    flavorText: 'As you bob and weave through the crowd, you can\'t help but leave the audience wanting more.',
    actionType: 'maneuver',
    essenceCost: 3,
    keywords: ['Melee', 'Strike', 'Weapon'],
    distance: 'Self; see below',
    target: 'Self',
    effect: 'You shift up to your speed. You make one power roll that targets each enemy you move adjacent to during this shift.',
    powerRoll: {
      characteristic: 'agility',
      alternativeCharacteristics: ['presence'],
      tier1: 'Taunted (EoT); A < WEAK, prone',
      tier2: 'Taunted (EoT); A < AVERAGE, prone',
      tier3: 'Taunted (EoT); A < STRONG, prone and can\'t stand (EoT)',
    },
  },
];

// ============================================================
// 5-DRAMA ABILITIES
// ============================================================

export const troubadourFiveDramaAbilities: Ability[] = [
  {
    id: 'dramatic-reversal',
    name: 'Dramatic Reversal',
    flavorText: 'Give the audience a surprise.',
    actionType: 'action',
    essenceCost: 5,
    keywords: ['Area', 'Magic'],
    distance: '3 burst',
    target: 'Self and each ally in the area',
    powerRoll: {
      characteristic: 'presence',
      tier1: 'The target can shift 1 square and make a free strike.',
      tier2: 'The target can shift up to 2 squares and make a free strike that gains an edge.',
      tier3: 'The target can shift up to 3 squares and make a free strike that gains an edge, then can spend a Recovery.',
    },
    effect: '',
  },
  {
    id: 'fake-your-death',
    name: 'Fake Your Death',
    flavorText: 'O happy dagger, this is thy sheath!',
    actionType: 'maneuver',
    essenceCost: 5,
    keywords: ['Magic'],
    distance: 'Self',
    target: 'Self',
    effect: 'You turn invisible and create a magical illusion of your corpse falling in your space. While you are invisible, you gain a +3 bonus to speed and you ignore difficult terrain. The illusion and your invisibility last until the end of your next turn, or until the illusion is interacted with, you take damage, or you use a main action or a maneuver.',
  },
  {
    id: 'flip-the-script',
    name: 'Flip the Script',
    flavorText: 'You try a different take on events, justifying the new locations everyone ended up in.',
    actionType: 'action',
    essenceCost: 5,
    keywords: ['Area', 'Magic'],
    distance: '3 burst',
    target: 'Self and each ally in the area',
    effect: 'Each target can teleport up to 5 squares. Any teleported target who was slowed is no longer slowed.',
  },
  {
    id: 'method-acting',
    name: 'Method Acting',
    flavorText: 'They\'re so hurt by your performance, you start to believe it yourself.',
    actionType: 'action',
    essenceCost: 5,
    keywords: ['Melee', 'Strike', 'Weapon'],
    distance: 'Melee 1',
    target: 'One creature',
    powerRoll: {
      characteristic: 'agility',
      tier1: '6 + A damage; P < WEAK, weakened (save ends)',
      tier2: '10 + A damage; P < AVERAGE, weakened (save ends)',
      tier3: '14 + A damage; P < STRONG, weakened (save ends)',
    },
    effect: 'You can become bleeding (save ends) to deal an extra 5 corruption damage to the target.',
  },
];

// ============================================================
// 7-DRAMA ABILITIES
// ============================================================

export const troubadourSevenDramaAbilities: Ability[] = [
  {
    id: 'extensive-rewrites',
    name: 'Extensive Rewrites',
    flavorText: 'No, this isn\'t right. That foe was over there!',
    actionType: 'maneuver',
    essenceCost: 7,
    keywords: ['Area', 'Magic'],
    distance: '4 burst',
    target: 'Each enemy in the area',
    powerRoll: {
      characteristic: 'presence',
      tier1: 'Slide 3; P < WEAK, this slide ignores the target\'s stability',
      tier2: 'Slide 5; P < AVERAGE, this slide ignores the target\'s stability',
      tier3: 'Slide 7; P < STRONG, this slide ignores the target\'s stability',
    },
    effect: 'Instead of sliding a target, you can swap their location with another target as long as each can fit into the other\'s space. You can\'t slide targets into other creatures or objects using this ability.',
  },
  {
    id: 'infernal-gavotte',
    name: 'Infernal Gavotte',
    flavorText: 'A spicy performance lights a fire under your allies\' feet.',
    actionType: 'action',
    essenceCost: 7,
    keywords: ['Area', 'Magic', 'Melee', 'Weapon'],
    distance: '3 burst',
    target: 'Each enemy in the area',
    powerRoll: {
      characteristic: 'presence',
      tier1: '5 fire damage; A < WEAK, weakened (save ends)',
      tier2: '7 fire damage; A < AVERAGE, weakened (save ends)',
      tier3: '10 fire damage; A < STRONG, weakened (save ends)',
    },
    effect: 'Each ally in the area can shift up to 2 squares.',
  },
  {
    id: 'star-solo',
    name: 'Star Solo',
    flavorText: 'Your performance travels and doesn\'t stop moving until your audience is completely rocked.',
    actionType: 'action',
    essenceCost: 7,
    keywords: ['Magic', 'Melee', 'Ranged', 'Strike', 'Weapon'],
    distance: 'Melee 1 or ranged 10',
    target: 'One creature or object',
    powerRoll: {
      characteristic: 'presence',
      tier1: '5 + P damage',
      tier2: '8 + P damage; push 3',
      tier3: '11 + P damage; push 5',
    },
    effect: 'You can choose to have this ability deal sonic damage. Additionally, you can use this ability against the same target for the next 2 combat rounds without spending drama.',
  },
  {
    id: 'we-meet-at-last',
    name: 'We Meet at Last',
    flavorText: 'You magically intertwine your fate with another creature—for better or worse.',
    actionType: 'maneuver',
    essenceCost: 7,
    keywords: ['Magic', 'Ranged'],
    distance: 'Ranged 10',
    target: 'One creature',
    effect: 'Until the end of the encounter, both you and the target can target each other with abilities even if you are beyond distance, with the distance of this ability replacing those abilities\' distances. The target can\'t be force moved by an ability used beyond distance this way.\n\nAdditionally, once on each of your turns, you can use a free maneuver to communicate a motivating or dispiriting message to the target, either granting them 2 surges or forcing them to take a bane on the next ability roll they make before the start of your next turn.',
  },
];

// ============================================================
// 9-DRAMA ABILITIES
// ============================================================

export const troubadourNineDramaAbilities: Ability[] = [
  {
    id: 'action-hero',
    name: 'Action Hero',
    flavorText: 'You wield your weapon at blistering speed, leaving everyone around you fighting for their lives.',
    actionType: 'action',
    essenceCost: 9,
    keywords: ['Area', 'Melee', 'Weapon'],
    distance: '3 burst',
    target: 'Each enemy in the area',
    powerRoll: {
      characteristic: 'agility',
      tier1: '10 damage',
      tier2: '14 damage',
      tier3: '20 damage',
    },
    effect: 'Unless you score a critical hit, this ability can\'t reduce a non-minion target below 1 Stamina.',
  },
  {
    id: 'continuity-error',
    name: 'Continuity Error',
    flavorText: 'Your subject is written into two places at once.',
    actionType: 'maneuver',
    essenceCost: 9,
    keywords: ['Magic', 'Ranged'],
    distance: 'Ranged 10',
    target: 'One enemy or object',
    effect: 'The target is split into two separate entities, one of which remains in the target\'s space while the other appears in an unoccupied space of your choice within distance. If the target is a creature, this creates a new creature under the Director\'s control. Each entity has half the original target\'s Stamina, is weakened, and takes 1d6 corruption damage at the start of each of their turns. If either entity is reduced to 0 Stamina, the other entity persists as the original entity and this effect ends. The effect also ends if both entities occupy the same space, causing them to automatically merge and combine their current Stamina.',
  },
  {
    id: 'love-song',
    name: 'Love Song',
    flavorText: 'You play a small ditty that plants you inside your target\'s heart.',
    actionType: 'maneuver',
    essenceCost: 9,
    keywords: ['Magic', 'Ranged'],
    distance: 'Ranged 10',
    target: 'One creature or object',
    effect: 'The target gains 20 temporary Stamina. Until the end of the encounter, whenever the target takes damage while you\'re within distance, you can choose to take the damage instead of the target.',
  },
  {
    id: 'patter-song',
    name: 'Patter Song',
    flavorText: 'Dazzle them with your fancy patter and they forget where they were.',
    actionType: 'maneuver',
    essenceCost: 9,
    keywords: ['Magic', 'Ranged'],
    distance: 'Ranged 10',
    target: 'Special',
    powerRoll: {
      characteristic: 'presence',
      tier1: 'One ally within distance can take their turn immediately after yours.',
      tier2: 'Two allies within distance can take their turns immediately after yours in any order.',
      tier3: 'Three allies within distance can take their turns immediately after yours in any order. One of those allies can have already taken a turn this combat round.',
    },
    effect: '',
  },
];

// ============================================================
// 11-DRAMA ABILITIES
// ============================================================

export const troubadourElevenDramaAbilities: Ability[] = [
  {
    id: 'dramatic-reveal',
    name: 'Dramatic Reveal',
    flavorText: 'A little stage trickery, and where once stood a foe, now stands a friend!',
    actionType: 'maneuver',
    essenceCost: 11,
    keywords: ['Magic'],
    distance: 'Self',
    target: 'Self',
    effect: 'Until the end of the encounter, whenever you reduce a creature to 0 Stamina using an ability, you can use a free triggered action to teleport an ally within distance of that ability into the creature\'s space in a plume of rose petals. You or the teleported ally can then make a melee free strike.',
  },
  {
    id: 'power-ballad',
    name: 'Power Ballad',
    flavorText: 'A song for the brokenhearted wraps itself around the target and blossoms into a ward of thorns.',
    actionType: 'maneuver',
    essenceCost: 11,
    keywords: ['Magic', 'Ranged'],
    distance: 'Ranged 10',
    target: 'Self or one ally',
    effect: 'Until the end of the encounter, whenever the target takes damage while winded, they can use a free triggered action to deal half the damage they took to the source of the damage.',
  },
  {
    id: 'saved-in-the-edit',
    name: 'Saved in the Edit',
    flavorText: 'You shout a word of power that allows you to rewrite reality to your whims.',
    actionType: 'maneuver',
    essenceCost: 11,
    keywords: ['Magic'],
    distance: 'Self',
    target: 'Self',
    effect: 'Until the end of the encounter, whenever you deal rolled damage to a creature or object, or enable a creature to spend a Recovery, you can use a free triggered action to give that creature or object one of the following effects until the start of your next turn. If this ability is triggered by multiple targets taking damage or multiple creatures spending Recoveries simultaneously, each target receives the same effect:\n\n- The target has damage weakness equal to your Presence score against any magic, psionic, or weapon ability.\n- The target has damage immunity equal to your Presence score.\n- The target has a bonus to stability and a penalty to speed equal to your Presence score.\n- The target has a bonus to speed and a penalty to stability equal to your Presence score.',
  },
  {
    id: 'the-show-must-go-on',
    name: 'The Show Must Go On',
    flavorText: 'You shine a bright light on the players on the stage and compel them to finish the performance.',
    actionType: 'maneuver',
    essenceCost: 11,
    keywords: ['Area', 'Magic', 'Ranged'],
    distance: '5 cube within 10',
    target: 'Each enemy in the area',
    powerRoll: {
      characteristic: 'presence',
      tier1: '6 damage; P < WEAK, the target can\'t willingly leave the area (EoT)',
      tier2: '8 damage; P < AVERAGE, the target can\'t willingly leave the area (save ends)',
      tier3: '12 damage; the target can\'t willingly leave the area (EoT); if P < STRONG, they can\'t willingly leave the area (save ends)',
    },
    effect: 'Each ally within distance can\'t obtain lower than a tier 2 outcome on the next test they make before the start of your next turn.',
  },
];

// ============================================================
// CLASS ACT TRIGGERED ACTIONS
// ============================================================

export const troubadourTriggeredActions: Ability[] = [
  {
    id: 'harmonize',
    name: 'Harmonize',
    flavorText: 'Give the chorus a little punch.',
    actionType: 'triggered',
    essenceCost: 3,
    keywords: ['Ranged'],
    distance: 'Ranged 5',
    target: 'One ally',
    trigger: 'The target uses an ability that targets only one enemy and costs 3 or fewer of their Heroic Resource.',
    effect: 'The target can choose one additional target for the triggering ability. Any damage dealt to the additional target is sonic damage.\n\nSpend 1+ Drama: You can trigger this ability when a target uses an ability that has a Heroic Resource cost of 3 + each additional drama spent.',
  },
  {
    id: 'riposte',
    name: 'Riposte',
    flavorText: '"I\'d have brought treats had I known I\'d be fighting a dog."',
    actionType: 'triggered',
    keywords: ['Melee'],
    distance: 'Melee 1',
    target: 'Self or one ally',
    trigger: 'The target takes damage from a melee strike.',
    effect: 'The target makes a free strike against the creature who made the triggering strike.',
  },
  {
    id: 'turnabout-is-fair-play',
    name: 'Turnabout Is Fair Play',
    flavorText: 'All\'s fair in love and whatever.',
    actionType: 'triggered',
    keywords: ['Ranged'],
    distance: 'Ranged 10',
    target: 'One creature',
    trigger: 'The target makes an ability roll that has an edge, a double edge, a bane, or a double bane.',
    effect: 'An edge on the triggering roll becomes a bane, or a double edge becomes an edge. A bane becomes an edge, or a double bane becomes a bane.\n\nSpend 3 Drama: An edge on the triggering roll becomes a double bane, or a double edge is negated. A bane becomes a double edge, or a double bane is negated.',
  },
];

// ============================================================
// CLASS ACT FEATURES
// ============================================================

export const troubadourClassActFeatures: Ability[] = [
  {
    id: 'dramatic-monologue',
    name: 'Dramatic Monologue',
    flavorText: 'It doesn\'t need to make sense. Just say it with emotion.',
    actionType: 'maneuver',
    keywords: ['Magic', 'Ranged'],
    distance: 'Ranged 10',
    target: 'Special',
    effect: 'Choose one of the following effects:\n\n- You orate a rousing tale of victory. One ally within distance gains an edge on the next power roll they make before the start of your next turn.\n- You weave a tale of high-stakes heroics. One ally within distance gains 1 surge.\n- You insult a foe where they\'re most vulnerable. One enemy within distance takes a bane on the next power roll they make before the end of their next turn.\n\nSpend 1 Drama: You can choose two targets for the chosen effect.',
  },
  {
    id: 'power-chord',
    name: 'Power Chord',
    flavorText: 'Your instrument rings true and your music blows everyone away.',
    actionType: 'maneuver',
    keywords: ['Area', 'Magic'],
    distance: '2 burst',
    target: 'Each enemy in the area',
    powerRoll: {
      characteristic: 'presence',
      tier1: 'Push 1',
      tier2: 'Push 2',
      tier3: 'Push 3',
    },
    effect: '',
  },
  {
    id: 'star-power',
    name: 'Star Power',
    flavorText: 'Your years of practicing fencing and dancing pay off on the battlefield.',
    actionType: 'maneuver',
    essenceCost: 1,
    keywords: [],
    distance: 'Self',
    target: 'Self',
    effect: 'You gain a +2 bonus to speed until the end of your turn. Additionally, the next power roll you make this turn can\'t have an outcome lower than tier 2.\n\nSpend 1 Drama: You gain a +4 bonus to speed instead.',
  },
];

// ============================================================
// COMBINED EXPORTS
// ============================================================

// All core Troubadour abilities
export const troubadourAbilities: Ability[] = [
  ...troubadourSignatureAbilities,
  ...troubadourThreeDramaAbilities,
  ...troubadourFiveDramaAbilities,
  ...troubadourSevenDramaAbilities,
  ...troubadourNineDramaAbilities,
  ...troubadourElevenDramaAbilities,
];

// Helper functions
export const getAbilityById = (id: string): Ability | undefined => {
  return troubadourAbilities.find(a => a.id === id);
};

export const getAbilitiesByCost = (maxCost: number): Ability[] => {
  return troubadourAbilities.filter(a => (a.essenceCost || 0) <= maxCost);
};

export const getSignatureAbilities = (): Ability[] => {
  return troubadourSignatureAbilities;
};

export const getHeroicAbilities = (): Ability[] => {
  return troubadourAbilities.filter(a => a.essenceCost && a.essenceCost > 0);
};

// Get class act triggered action
export const getClassActTriggeredAction = (classAct: string): Ability | undefined => {
  switch (classAct) {
    case 'auteur':
      return troubadourTriggeredActions.find(a => a.id === 'turnabout-is-fair-play');
    case 'duelist':
      return troubadourTriggeredActions.find(a => a.id === 'riposte');
    case 'virtuoso':
      return troubadourTriggeredActions.find(a => a.id === 'harmonize');
  }
  return undefined;
};

// Get class act feature
export const getClassActFeature = (classAct: string, featureName: string): Ability | undefined => {
  const featureId = featureName.toLowerCase().replace(/\s+/g, '-');
  return troubadourClassActFeatures.find(a => a.id === featureId);
};
