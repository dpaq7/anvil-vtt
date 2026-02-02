/**
 * Null Class Abilities - Synced with Draw Steel Heroes v1
 * Resource: Discipline
 */
import type { Ability } from '@anvil/types';

// ============================================================
// SIGNATURE ABILITIES (No cost, at-will)
// ============================================================

export const nullSignatureAbilities: Ability[] = [
  {
    id: 'dance-of-blows',
    name: 'Dance of Blows',
    flavorText: 'You strike everywhere at once, tricking an enemy into moving out of position.',
    actionType: 'action',
    keywords: ['Area', 'Psionic', 'Weapon'],
    distance: '1 burst',
    target: 'Each enemy in the area',
    powerRoll: {
      characteristic: 'agility',
      tier1: '3 damage',
      tier2: '4 damage',
      tier3: '5 damage',
    },
    effect: 'You can slide one adjacent enemy up to a number of squares equal to your Intuition score.',
  },
  {
    id: 'faster-than-the-eye',
    name: 'Faster Than the Eye',
    flavorText: 'You strike so quickly that your hands become a blur.',
    actionType: 'action',
    keywords: ['Melee', 'Psionic', 'Strike', 'Weapon'],
    distance: 'Melee 1',
    target: 'Two creatures or objects',
    powerRoll: {
      characteristic: 'agility',
      tier1: '4 damage',
      tier2: '5 damage',
      tier3: '7 damage',
    },
    effect: 'You can deal damage equal to your Agility score to one creature or object adjacent to you.',
  },
  {
    id: 'inertial-step',
    name: 'Inertial Step',
    flavorText: 'You flit about the battlefield and take an opportunistic strike.',
    actionType: 'action',
    keywords: ['Melee', 'Psionic', 'Strike', 'Weapon'],
    distance: 'Melee 1',
    target: 'One creature or object',
    powerRoll: {
      characteristic: 'agility',
      tier1: '5 + A damage',
      tier2: '7 + A damage',
      tier3: '10 + A damage',
    },
    effect: 'You can shift up to half your speed before or after you make this strike.',
  },
  {
    id: 'joint-lock',
    name: 'Joint Lock',
    flavorText: 'You contort your enemy\'s body into a stance they struggle to escape from.',
    actionType: 'action',
    keywords: ['Melee', 'Psionic', 'Strike', 'Weapon'],
    distance: 'Melee 1',
    target: 'One creature or object',
    powerRoll: {
      characteristic: 'agility',
      tier1: '4 + A damage; A < WEAK, grabbed',
      tier2: '7 + A damage; A < AVERAGE, grabbed',
      tier3: '9 + A damage; A < STRONG, grabbed',
    },
    effect: '',
  },
  {
    id: 'kinetic-strike',
    name: 'Kinetic Strike',
    flavorText: 'Your opponent staggers. They cannot ignore you.',
    actionType: 'action',
    keywords: ['Melee', 'Psionic', 'Strike', 'Weapon'],
    distance: 'Melee 1',
    target: 'One creature or object',
    powerRoll: {
      characteristic: 'agility',
      tier1: '4 + A damage; taunted (EoT)',
      tier2: '5 + A damage; taunted (EoT), slide 1',
      tier3: '6 + A damage; taunted (EoT), slide 2',
    },
    effect: '',
  },
  {
    id: 'magnetic-strike',
    name: 'Magnetic Strike',
    flavorText: 'The force of your blow extends past the limits of your body, pulling your enemy closer.',
    actionType: 'action',
    keywords: ['Melee', 'Psionic', 'Strike', 'Weapon'],
    distance: 'Melee 2',
    target: 'One creature',
    powerRoll: {
      characteristic: 'agility',
      tier1: '5 + A psychic damage; vertical pull 1',
      tier2: '8 + A psychic damage; vertical pull 2',
      tier3: '11 + A psychic damage; vertical pull 3',
    },
    effect: '',
  },
  {
    id: 'phase-inversion-strike',
    name: 'Phase Inversion Strike',
    flavorText: 'You step momentarily out of phase as you pull an enemy through you.',
    actionType: 'action',
    keywords: ['Melee', 'Psionic', 'Strike', 'Weapon'],
    distance: 'Melee 1',
    target: 'One creature or object',
    powerRoll: {
      characteristic: 'agility',
      tier1: '4 + A damage; push 2',
      tier2: '6 + A damage; push 4',
      tier3: '8 + A damage; push 6',
    },
    effect: 'Before the push is resolved, you teleport the target to a square adjacent to you and opposite the one they started in. If the target can\'t be teleported this way, you can\'t push them.',
  },
  {
    id: 'pressure-points',
    name: 'Pressure Points',
    flavorText: 'You strike at key nerve clusters to leave your foe staggered.',
    actionType: 'action',
    keywords: ['Melee', 'Psionic', 'Strike', 'Weapon'],
    distance: 'Melee 1',
    target: 'One creature or object',
    powerRoll: {
      characteristic: 'agility',
      tier1: '4 + A damage; A < WEAK, weakened (save ends)',
      tier2: '7 + A damage; A < AVERAGE, weakened (save ends)',
      tier3: '9 + A damage; A < STRONG, weakened (save ends)',
    },
    effect: '',
  },
];

// ============================================================
// 3-DISCIPLINE ABILITIES
// ============================================================

export const nullThreeDisciplineAbilities: Ability[] = [
  {
    id: 'chronal-spike',
    name: 'Chronal Spike',
    flavorText: 'You foresee the best moment to strike, then exploit it.',
    actionType: 'action',
    essenceCost: 3,
    keywords: ['Melee', 'Psionic', 'Strike', 'Weapon'],
    distance: 'Melee 1',
    target: 'One creature or object',
    powerRoll: {
      characteristic: 'agility',
      tier1: '7 + A damage',
      tier2: '10 + A damage',
      tier3: '13 + A damage',
    },
    effect: 'You can shift up to half your speed before or after you make this strike. Additionally, whenever an effect lets you make a free strike or use a signature ability, you can use this ability instead, paying its discipline cost as usual.',
  },
  {
    id: 'psychic-pulse',
    name: 'Psychic Pulse',
    flavorText: 'A burst of psionic energy interferes with your enemy\'s synapses.',
    actionType: 'maneuver',
    essenceCost: 3,
    keywords: ['Area', 'Psionic'],
    distance: '2 burst',
    target: 'Each enemy in the area',
    effect: 'Each target takes psychic damage equal to twice your Intuition score. Until the start of your next turn, the size of your Null Field ability increases by 1. At the end of your current turn, each enemy in the area of your Null Field ability takes psychic damage equal to your Intuition score.',
  },
  {
    id: 'relentless-nemesis',
    name: 'Relentless Nemesis',
    flavorText: 'You strike, and for the next few moments, your enemy can\'t escape you.',
    actionType: 'action',
    essenceCost: 3,
    keywords: ['Melee', 'Psionic', 'Strike', 'Weapon'],
    distance: 'Melee 1',
    target: 'One creature or object',
    powerRoll: {
      characteristic: 'agility',
      tier1: '6 + A damage',
      tier2: '8 + A damage',
      tier3: '12 + A damage',
    },
    effect: 'Until the start of your next turn, whenever the target finishes moving or being force moved, you can use a free triggered action to shift up to your speed. You must end this shift adjacent to the target.',
  },
  {
    id: 'stunning-blow',
    name: 'Stunning Blow',
    flavorText: 'You focus your psionic technique into a concussive punch.',
    actionType: 'action',
    essenceCost: 3,
    keywords: ['Melee', 'Psionic', 'Strike', 'Weapon'],
    distance: 'Melee 1',
    target: 'One creature or object',
    powerRoll: {
      characteristic: 'agility',
      tier1: '4 + A damage; I < WEAK, dazed and slowed (save ends)',
      tier2: '5 + A damage; I < AVERAGE, dazed and slowed (save ends)',
      tier3: '7 + A damage; I < STRONG, dazed and slowed (save ends)',
    },
    effect: '',
  },
];

// ============================================================
// 5-DISCIPLINE ABILITIES
// ============================================================

export const nullFiveDisciplineAbilities: Ability[] = [
  {
    id: 'arcane-disruptor',
    name: 'Arcane Disruptor',
    flavorText: 'Your blow reorders a foe\'s body, causing pain if they attempt to channel sorcery.',
    actionType: 'action',
    essenceCost: 5,
    keywords: ['Melee', 'Psionic', 'Strike', 'Weapon'],
    distance: 'Melee 1',
    target: 'One creature',
    powerRoll: {
      characteristic: 'agility',
      tier1: '8 + A psychic damage; M < WEAK, weakened (save ends)',
      tier2: '12 + A psychic damage; M < AVERAGE, weakened (save ends)',
      tier3: '16 + A psychic damage; M < STRONG, weakened (save ends)',
    },
    effect: 'While weakened this way, the target takes damage equal to your Intuition score whenever they use a supernatural ability that costs Malice.',
  },
  {
    id: 'impart-force',
    name: 'Impart Force',
    flavorText: 'A single touch from you, and your enemy flies backward.',
    actionType: 'maneuver',
    essenceCost: 5,
    keywords: ['Melee', 'Psionic', 'Strike', 'Weapon'],
    distance: 'Melee 1',
    target: 'One creature or object',
    powerRoll: {
      characteristic: 'intuition',
      tier1: 'Push 3',
      tier2: 'Push 5',
      tier3: 'Push 7',
    },
    effect: 'An object you target must be your size or smaller. You gain an edge on this ability. Additionally, for each square you push the target, they take 1 psychic damage.',
  },
  {
    id: 'phase-strike',
    name: 'Phase Strike',
    flavorText: 'For a moment, your foe slips out of phase with this manifold.',
    actionType: 'action',
    essenceCost: 5,
    keywords: ['Melee', 'Psionic', 'Strike', 'Weapon'],
    distance: 'Melee 1',
    target: 'One creature',
    powerRoll: {
      characteristic: 'agility',
      tier1: '3 + A psychic damage; I < WEAK, the target goes out of phase (save ends)',
      tier2: '4 + A psychic damage; I < AVERAGE, the target goes out of phase (save ends)',
      tier3: '6 + A psychic damage; I < STRONG, the target goes out of phase (save ends)',
    },
    effect: 'A target who goes out of phase is slowed, has their stability reduced by 2, and can\'t obtain a tier 3 outcome on ability rolls.',
  },
  {
    id: 'a-squad-unto-myself',
    name: 'A Squad Unto Myself',
    flavorText: 'You move so quickly, it seems as though an army assaulted your foes.',
    actionType: 'action',
    essenceCost: 5,
    keywords: ['Area', 'Psionic', 'Weapon'],
    distance: '2 burst',
    target: 'Each enemy in the area',
    powerRoll: {
      characteristic: 'agility',
      tier1: '6 damage',
      tier2: '9 damage',
      tier3: '13 damage',
    },
    effect: 'You can take the Disengage move action as a free maneuver before or after you use this ability.',
  },
];

// ============================================================
// 7-DISCIPLINE ABILITIES
// ============================================================

export const nullSevenDisciplineAbilities: Ability[] = [
  {
    id: 'absorption-field',
    name: 'Absorption Field',
    flavorText: 'Your null field absorbs kinetic energy.',
    actionType: 'maneuver',
    essenceCost: 7,
    keywords: ['Psionic'],
    distance: 'Self',
    target: 'Self',
    effect: 'Until the end of the encounter, the size of your Null Field ability increases by 1. While the area of that ability is enlarged this way, each enemy in the area takes a bane on ability rolls.',
  },
  {
    id: 'molecular-rearrangement-field',
    name: 'Molecular Rearrangement Field',
    flavorText: 'Your enemies\' wounds open, your allies\' wounds close.',
    actionType: 'maneuver',
    essenceCost: 7,
    keywords: ['Psionic'],
    distance: 'Self',
    target: 'Self',
    effect: 'Until the end of the encounter, the size of your Null Field ability increases by 1. While the area of that ability is enlarged this way, each enemy who has I < AVERAGE and enters the area for the first time in a combat round or starts their turn there is bleeding (save ends). Each ally who enters the area for the first time in a combat round or starts their turn there gains temporary Stamina equal to your Intuition score.',
  },
  {
    id: 'stabilizing-field',
    name: 'Stabilizing Field',
    flavorText: 'You project order, making it harder for your enemies to interfere with you and your allies.',
    actionType: 'maneuver',
    essenceCost: 7,
    keywords: ['Psionic'],
    distance: 'Self',
    target: 'Self',
    effect: 'Until the end of the encounter, the size of your Null Field ability increases by 1. While the area of that ability is enlarged this way, you ignore difficult terrain and reduce the potency of enemy effects targeting you by 1 for you. You can also use a free triggered action at the start of each of your turns to end one effect on you that is ended by a saving throw or that ends at the end of your turn. Each ally in the area also gains these benefits.',
  },
  {
    id: 'synapse-field',
    name: 'Synapse Field',
    flavorText: 'Attacks made by allies in your null field disrupt your enemies\' thoughts, causing psychic pain.',
    actionType: 'maneuver',
    essenceCost: 7,
    keywords: ['Psionic'],
    distance: 'Self',
    target: 'Self',
    effect: 'Until the end of the encounter, the size of your Null Field ability increases by 1. While the area of that ability is enlarged this way, whenever an enemy in the area takes rolled damage, they take extra psychic damage equal to twice your Intuition score.',
  },
];

// ============================================================
// 9-DISCIPLINE ABILITIES
// ============================================================

export const nullNineDisciplineAbilities: Ability[] = [
  {
    id: 'anticipating-strike',
    name: 'Anticipating Strike',
    flavorText: 'You suddenly strike an enemy, then grab them in a psionically enhanced grip.',
    actionType: 'freeTriggered',
    essenceCost: 9,
    keywords: ['Melee', 'Psionic', 'Strike', 'Weapon'],
    distance: 'Melee 1',
    target: 'One creature',
    trigger: 'The target moves or uses a main action.',
    powerRoll: {
      characteristic: 'agility',
      tier1: '7 + A damage; I < WEAK, restrained (save ends)',
      tier2: '10 + A damage; I < AVERAGE, restrained (save ends)',
      tier3: '13 + A damage; I < STRONG, restrained (save ends)',
    },
    effect: 'This strike resolves before the triggering movement or main action.',
  },
  {
    id: 'iron-grip',
    name: 'Iron Grip',
    flavorText: 'You grab the target with supernatural force.',
    actionType: 'action',
    essenceCost: 9,
    keywords: ['Melee', 'Psionic', 'Strike', 'Weapon'],
    distance: 'Melee 1',
    target: 'One creature',
    powerRoll: {
      characteristic: 'agility',
      tier1: '10 + A damage; A < WEAK, grabbed',
      tier2: '14 + A damage; A < AVERAGE, grabbed',
      tier3: '18 + A damage; A < STRONG, grabbed',
    },
    effect: 'While grabbed this way, the target takes a bane on the Escape Grab maneuver. Each time they use that maneuver, they take damage equal to twice your Agility score.',
  },
  {
    id: 'phase-leap',
    name: 'Phase Leap',
    flavorText: 'You leap beyond reality, leaving an afterimage of yourself.',
    actionType: 'move',
    essenceCost: 9,
    keywords: ['Psionic'],
    distance: 'Self',
    target: 'Self',
    effect: 'You jump up to your speed without provoking opportunity attacks. Until the end of your next turn, a static afterimage of you remains in the space you left, and any enemy adjacent to your afterimage takes a bane on ability rolls. You can use your abilities from your own space or from the space of your afterimage as if you were still there. Additionally, if your Null Field ability is active, your afterimage also projects the aura from that ability, which you control as if you were in the afterimage\'s space.',
  },
  {
    id: 'synaptic-reset',
    name: 'Synaptic Reset',
    flavorText: 'You expand your nullifying power to mitigate harmful effects.',
    actionType: 'maneuver',
    essenceCost: 9,
    keywords: ['Area', 'Psionic'],
    distance: '3 burst',
    target: 'Self and each ally in the area',
    effect: 'Each target can end any conditions or effects on themself, and gains 5 temporary Stamina for each condition or effect removed.',
  },
];

// ============================================================
// 11-DISCIPLINE ABILITIES
// ============================================================

export const nullElevenDisciplineAbilities: Ability[] = [
  {
    id: 'arcane-purge',
    name: 'Arcane Purge',
    flavorText: 'You focus your null field into a pressure point strike that prevents your foe from channeling sorcery.',
    actionType: 'action',
    essenceCost: 11,
    keywords: ['Melee', 'Psionic', 'Strike', 'Weapon'],
    distance: 'Melee 1',
    target: 'One creature',
    powerRoll: {
      characteristic: 'agility',
      tier1: '13 + A damage; M < WEAK, the target is suppressed (save ends)',
      tier2: '19 + A damage; M < AVERAGE, the target is suppressed (save ends)',
      tier3: '24 + A damage; M < STRONG, the target is suppressed (save ends)',
    },
    effect: 'While suppressed, a target takes psychic damage equal to twice your Intuition score at the start of their turns, whenever they use a supernatural ability, or whenever they use an ability that costs Malice.',
  },
  {
    id: 'phase-hurl',
    name: 'Phase Hurl',
    flavorText: 'You throw your foe out of phase with this manifold, causing them to harm other enemies as they return.',
    actionType: 'action',
    essenceCost: 11,
    keywords: ['Melee', 'Psionic', 'Strike', 'Weapon'],
    distance: 'Melee 1',
    target: 'One creature',
    powerRoll: {
      characteristic: 'agility',
      tier1: '9 + A damage; push 5; I < WEAK, dazed (save ends)',
      tier2: '13 + A damage; push 7; I < AVERAGE, dazed (save ends)',
      tier3: '18 + A damage; push 10; I < STRONG, dazed (save ends)',
    },
    effect: 'The target and each creature or object they collide with from this forced movement takes psychic damage equal to the total number of squares the target was force moved. While the target is dazed this way, they see glimpses of creatures from other parts of the timescape.',
  },
  {
    id: 'scalar-assault',
    name: 'Scalar Assault',
    flavorText: 'You warp reality to grow a limb for just a moment and make a single devastating attack.',
    actionType: 'action',
    essenceCost: 11,
    keywords: ['Area', 'Psionic'],
    distance: '3 cube within 1',
    target: 'Each enemy in the area',
    powerRoll: {
      characteristic: 'agility',
      tier1: '12 psychic damage; push 3',
      tier2: '17 psychic damage; push 5',
      tier3: '23 psychic damage; push 7',
    },
    effect: '',
  },
  {
    id: 'synaptic-anchor',
    name: 'Synaptic Anchor',
    flavorText: 'You disrupt an enemy\'s strike and create a feedback loop in their mind, preventing them from focusing on future attacks.',
    actionType: 'freeTriggered',
    essenceCost: 11,
    keywords: ['Psionic'],
    distance: 'Self; see below',
    target: 'Self or one creature',
    trigger: 'The target takes damage from another creature\'s ability while in the area of your Null Field ability.',
    effect: 'The target takes half the damage, and if the triggering creature has I < AVERAGE, they are dazed (save ends). While the triggering creature is dazed this way, they take psychic damage equal to your Intuition score whenever they use a main action.',
  },
];

// ============================================================
// COMBINED EXPORTS
// ============================================================

// All core Null abilities
export const nullAbilities: Ability[] = [
  ...nullSignatureAbilities,
  ...nullThreeDisciplineAbilities,
  ...nullFiveDisciplineAbilities,
  ...nullSevenDisciplineAbilities,
  ...nullNineDisciplineAbilities,
  ...nullElevenDisciplineAbilities,
];

// Helper functions
export const getAbilityById = (id: string): Ability | undefined => {
  return nullAbilities.find(a => a.id === id);
};

export const getAbilitiesByCost = (maxCost: number): Ability[] => {
  return nullAbilities.filter(a => (a.essenceCost || 0) <= maxCost);
};

export const getSignatureAbilities = (): Ability[] => {
  return nullSignatureAbilities;
};

export const getHeroicAbilities = (): Ability[] => {
  return nullAbilities.filter(a => a.essenceCost && a.essenceCost > 0);
};
