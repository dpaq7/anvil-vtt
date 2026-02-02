/**
 * Talent Class Abilities - Synced with Draw Steel Heroes v1
 * Resource: Clarity
 */
import type { Ability } from '@anvil/types';

// ============================================================
// SIGNATURE ABILITIES (No cost, at-will)
// ============================================================

export const talentSignatureAbilities: Ability[] = [
  {
    id: 'mind-spike',
    name: 'Mind Spike',
    flavorText: 'A telepathic bolt instantly zaps a creature\'s brain.',
    actionType: 'action',
    keywords: ['Psionic', 'Ranged', 'Strike', 'Telepathy'],
    distance: 'Ranged 10',
    target: 'One creature',
    powerRoll: {
      characteristic: 'reason',
      tier1: '2 + R psychic damage',
      tier2: '4 + R psychic damage',
      tier3: '6 + R psychic damage',
    },
    effect: 'Strained: The target takes an extra 2 psychic damage. You also take 2 psychic damage that can\'t be reduced in any way.',
  },
  {
    id: 'entropic-bolt',
    name: 'Entropic Bolt',
    flavorText: 'You advance an enemy\'s age for a moment.',
    actionType: 'action',
    keywords: ['Chronopathy', 'Psionic', 'Ranged', 'Strike'],
    distance: 'Ranged 10',
    target: 'One creature or object',
    powerRoll: {
      characteristic: 'presence',
      tier1: '2 + P corruption damage; P < WEAK, slowed (save ends)',
      tier2: '3 + P corruption damage; P < AVERAGE, slowed (save ends)',
      tier3: '5 + P corruption damage; P < STRONG, slowed (save ends)',
    },
    effect: 'The target takes an extra 1 corruption damage for each additional time they are targeted by this ability during the encounter.\n\nStrained: You gain 1 clarity when you obtain a tier 2 or tier 3 outcome on the power roll.',
  },
  {
    id: 'hoarfrost',
    name: 'Hoarfrost',
    flavorText: 'You blast a foe with a pulse of cold energy.',
    actionType: 'action',
    keywords: ['Cryokinesis', 'Psionic', 'Ranged', 'Strike'],
    distance: 'Ranged 10',
    target: 'One creature',
    powerRoll: {
      characteristic: 'reason',
      tier1: '2 + R cold damage; M < WEAK, slowed (EoT)',
      tier2: '4 + R cold damage; M < AVERAGE, slowed (EoT)',
      tier3: '6 + R cold damage; M < STRONG, slowed (EoT)',
    },
    effect: 'Strained: You are slowed until the end of your next turn. Additionally, a target slowed by this ability is restrained instead.',
  },
  {
    id: 'incinerate',
    name: 'Incinerate',
    flavorText: 'The air erupts into a column of smokeless flame.',
    actionType: 'action',
    keywords: ['Area', 'Fire', 'Psionic', 'Pyrokinesis', 'Ranged'],
    distance: '3 cube within 10',
    target: 'Each enemy in the area',
    powerRoll: {
      characteristic: 'reason',
      tier1: '2 fire damage',
      tier2: '4 fire damage',
      tier3: '6 fire damage',
    },
    effect: 'A column of fire remains in the area until the start of your next turn. Each enemy who enters the area for the first time in a combat round or starts their turn there takes 2 fire damage.\n\nStrained: The size of the cube increases by 2, but the fire disappears at the end of your turn.',
  },
  {
    id: 'kinetic-grip',
    name: 'Kinetic Grip',
    flavorText: 'You lift and hurl your foe away from you.',
    actionType: 'action',
    keywords: ['Psionic', 'Ranged', 'Telekinesis'],
    distance: 'Ranged 10',
    target: 'One creature or object',
    powerRoll: {
      characteristic: 'reason',
      tier1: 'Slide 2 + R',
      tier2: 'Slide 4 + R',
      tier3: 'Slide 6 + R; prone',
    },
    effect: 'Strained: You must vertical push the target instead of sliding them.',
  },
  {
    id: 'kinetic-pulse',
    name: 'Kinetic Pulse',
    flavorText: 'The force of your mind hurls enemies backward.',
    actionType: 'action',
    keywords: ['Area', 'Psionic', 'Telepathy'],
    distance: '1 burst',
    target: 'Each enemy in the area',
    powerRoll: {
      characteristic: 'reason',
      tier1: '2 psychic damage',
      tier2: '5 psychic damage; push 1',
      tier3: '7 psychic damage; push 2',
    },
    effect: 'Strained: The size of the burst increases by 2, and you are bleeding until the start of your next turn.',
  },
  {
    id: 'materialize',
    name: 'Materialize',
    flavorText: 'You picture an object in your mind and give it form—directly above your opponent\'s head.',
    actionType: 'action',
    keywords: ['Psionic', 'Ranged', 'Resopathy', 'Strike'],
    distance: 'Ranged 10',
    target: 'One creature or object',
    powerRoll: {
      characteristic: 'reason',
      tier1: '3 + R damage',
      tier2: '5 + R damage',
      tier3: '8 + R damage',
    },
    effect: 'A worthless size 1M object drops onto the target to deal the damage, then rolls into an adjacent unoccupied space of your choice. The object is made of wood, stone, or metal (your choice).\n\nStrained: The object explodes after the damage is dealt, and each creature adjacent to the target takes damage equal to your Reason score. You also take damage equal to your Reason score that can\'t be reduced in any way.',
  },
  {
    id: 'optic-blast',
    name: 'Optic Blast',
    flavorText: 'Your eyes emit rays of powerful enervating force.',
    actionType: 'action',
    keywords: ['Metamorphosis', 'Psionic', 'Ranged', 'Strike'],
    distance: 'Ranged 10',
    target: 'One creature or object',
    powerRoll: {
      characteristic: 'reason',
      tier1: '2 + R damage; M < WEAK, prone',
      tier2: '4 + R damage; M < AVERAGE, prone',
      tier3: '6 + R damage; M < STRONG, prone',
    },
    effect: 'When targeting an object with a solid reflective surface or a creature carrying or wearing such an object (such as a mirror, an unpainted metal shield, or shiny metal plate armor), you can target one additional creature or object within 3 squares of the first target.\n\nStrained: You gain 1 surge that you can use immediately, and you take damage equal to your Reason score that can\'t be reduced in any way.',
  },
  {
    id: 'spirit-sword',
    name: 'Spirit Sword',
    flavorText: 'You form a blade of mind energy and stab your target, invigorating yourself.',
    actionType: 'action',
    keywords: ['Animapathy', 'Melee', 'Psionic', 'Strike'],
    distance: 'Melee 2',
    target: 'One creature or object',
    powerRoll: {
      characteristic: 'presence',
      tier1: '3 + P damage',
      tier2: '6 + P damage',
      tier3: '9 + P damage',
    },
    effect: 'You gain 1 surge.\n\nStrained: The target takes an extra 3 damage. You also take 3 damage that can\'t be reduced in any way.',
  },
];

// ============================================================
// 3-CLARITY ABILITIES
// ============================================================

export const talentThreeClarityAbilities: Ability[] = [
  {
    id: 'awe',
    name: 'Awe',
    flavorText: 'You project psionic energy out to a creature and take on a new visage in their mind.',
    actionType: 'action',
    essenceCost: 3,
    keywords: ['Psionic', 'Ranged', 'Strike', 'Telepathy'],
    distance: 'Ranged 10',
    target: 'One creature',
    effect: 'If you target an ally, they gain temporary Stamina equal to three times your Presence score, and they can end one effect on them that is ended by a saving throw or that ends at the end of their turn. If you target an enemy, you make a power roll.',
    powerRoll: {
      characteristic: 'presence',
      tier1: '3 + P psychic damage; I < WEAK, frightened (save ends)',
      tier2: '6 + P psychic damage; I < AVERAGE, frightened (save ends)',
      tier3: '9 + P psychic damage; I < STRONG, frightened (save ends)',
    },
  },
  {
    id: 'choke',
    name: 'Choke',
    flavorText: 'You crush a foe in a telekinetic grip.',
    actionType: 'action',
    essenceCost: 3,
    keywords: ['Psionic', 'Ranged', 'Strike', 'Telekinesis'],
    distance: 'Ranged 10',
    target: 'One creature',
    powerRoll: {
      characteristic: 'reason',
      tier1: '3 + R damage; M < WEAK, slowed (save ends)',
      tier2: '5 + R damage; M < AVERAGE, slowed (save ends)',
      tier3: '8 + R damage; M < STRONG, restrained (save ends)',
    },
    effect: 'You can vertical pull the target up to 2 squares. If the target is made restrained by this ability, this forced movement ignores their stability.',
  },
  {
    id: 'precognition',
    name: 'Precognition',
    flavorText: 'You give a target a glimpse into the future so that they\'re ready for what comes next.',
    actionType: 'action',
    essenceCost: 3,
    keywords: ['Chronopathy', 'Melee', 'Psionic'],
    distance: 'Melee 2',
    target: 'Self or one ally',
    effect: 'Ability rolls made against the target take a bane until the start of your next turn. Whenever the target takes damage while under this effect, they can use a triggered action to make a free strike against the source of the damage.',
  },
  {
    id: 'smolder',
    name: 'Smolder',
    flavorText: 'Smoke flows from your enemy like tears as their skin begins to blacken and flake.',
    actionType: 'action',
    essenceCost: 3,
    keywords: ['Psionic', 'Pyrokinesis', 'Ranged', 'Strike'],
    distance: 'Ranged 10',
    target: 'One creature',
    effect: 'Choose the damage type and the weakness for this ability from one of the following: acid, corruption, or fire. The target takes damage before this ability imposes any weakness.',
    powerRoll: {
      characteristic: 'reason',
      tier1: '3 + R damage; R < WEAK, the target has weakness 5 (save ends)',
      tier2: '6 + R damage; R < AVERAGE, the target has weakness 5 (save ends)',
      tier3: '9 + R damage; R < STRONG, the target has weakness equal to 5 + your Reason score (save ends)',
    },
  },
];

// ============================================================
// 5-CLARITY ABILITIES
// ============================================================

export const talentFiveClarityAbilities: Ability[] = [
  {
    id: 'flashback',
    name: 'Flashback',
    flavorText: 'The target is thrown several seconds back through time and gets to do it all again.',
    actionType: 'maneuver',
    essenceCost: 5,
    keywords: ['Chronopathy', 'Psionic', 'Ranged'],
    distance: 'Ranged 10',
    target: 'Self or one ally',
    effect: 'The target uses an ability with a base Heroic Resource cost of 7 or lower that they\'ve previously used this round, without needing to spend the base cost. Augmentations to the ability can be paid for as usual.\n\nStrained: You take 1d6 damage and are slowed (save ends).',
  },
  {
    id: 'inertia-soak',
    name: 'Inertia Soak',
    flavorText: 'Your psionic energy surrounds the target and pushes everything else away from them.',
    actionType: 'maneuver',
    essenceCost: 5,
    keywords: ['Psionic', 'Ranged', 'Telekinesis'],
    distance: 'Ranged 10',
    target: 'Self or one ally',
    effect: 'The target ignores difficult terrain and takes no damage from forced movement until the start of your next turn. Whenever the target enters a square while under this effect, they can push one adjacent creature up to a number of squares equal to your Reason score. When pushing an ally, the target can ignore that ally\'s stability. A creature can only be force moved this way once a turn.\n\nStrained: You are weakened (save ends). While you are weakened this way, whenever you are force moved, the forced movement distance gains a +5 bonus.',
  },
  {
    id: 'iron',
    name: 'Iron',
    flavorText: 'The target\'s skin turns to hard, dark metal, impenetrable and dense.',
    actionType: 'maneuver',
    essenceCost: 5,
    keywords: ['Metamorphosis', 'Psionic', 'Ranged'],
    distance: 'Ranged 10',
    target: 'Self or one ally',
    effect: 'The target\'s stability increases by an amount equal to your Reason score, and they gain 10 temporary Stamina and 2 surges. This stability increase lasts until the target no longer has temporary Stamina from this ability.\n\nStrained: You can\'t use maneuvers (save ends).',
  },
  {
    id: 'perfect-clarity',
    name: 'Perfect Clarity',
    flavorText: 'You clear the mind of nothing but the goal.',
    actionType: 'maneuver',
    essenceCost: 5,
    keywords: ['Psionic', 'Ranged', 'Telepathy'],
    distance: 'Ranged 10',
    target: 'Self or one ally',
    effect: 'Until the start of your next turn, the target gains a +3 bonus to speed, and they have a double edge on the next power roll they make. If the target obtains a tier 3 outcome on that roll, you gain 1 clarity.\n\nStrained: You take 1d6 damage, and you can\'t use triggered actions (save ends).',
  },
];

// ============================================================
// 7-CLARITY ABILITIES
// ============================================================

export const talentSevenClarityAbilities: Ability[] = [
  {
    id: 'fling-through-time',
    name: 'Fling Through Time',
    flavorText: 'You hurl the target through the annals of time, forcing them to witness every moment of their existence all at once.',
    actionType: 'action',
    essenceCost: 7,
    keywords: ['Chronopathy', 'Psionic', 'Ranged', 'Strike'],
    distance: 'Ranged 10',
    target: 'One creature or object',
    powerRoll: {
      characteristic: 'presence',
      tier1: '3 + P corruption damage; P < WEAK, weakened (save ends)',
      tier2: '5 + P corruption damage; the target is flung through time, and if P < AVERAGE, they are weakened (save ends)',
      tier3: '8 + P corruption damage; the target is flung through time, and if P < STRONG, they are weakened (save ends)',
    },
    effect: 'A target who is flung through time is removed from the encounter map until the end of their next turn, reappearing in their original space or the nearest unoccupied space.\n\nStrained: You take 2d6 damage and permanently grow visibly older (the equivalent of 10 years for a human). If you obtain a tier 3 outcome on the power roll, you gain 2 clarity.',
  },
  {
    id: 'force-orbs',
    name: 'Force Orbs',
    flavorText: 'Spheres of solid psionic energy float around you.',
    actionType: 'action',
    essenceCost: 7,
    keywords: ['Psionic', 'Ranged', 'Strike', 'Telekinesis'],
    distance: 'Self; see below',
    target: 'Self',
    powerRoll: {
      characteristic: 'reason',
      tier1: '2 damage',
      tier2: '3 damage',
      tier3: '5 damage',
    },
    effect: 'You create three size 1T orbs that orbit your body. Each orb gives you a cumulative damage immunity 1. Each time you take damage, you lose 1 orb.\n\nOnce on each of your turns, you can use a free maneuver to fire an orb at a creature or object within 5 squares as a ranged strike, losing the orb after the strike.\n\nStrained: You create five orbs, and you are weakened while you have any orbs active.',
  },
  {
    id: 'reflector-field',
    name: 'Reflector Field',
    flavorText: 'A protective field reverses the momentum of incoming attacks.',
    actionType: 'action',
    essenceCost: 7,
    keywords: ['Area', 'Psionic', 'Telepathy'],
    distance: '3 aura',
    target: 'Special',
    effect: 'The aura lasts until the start of your next turn. Whenever an enemy targets an ally in the area with a ranged ability, the ability is negated on the ally and reflected back at the enemy. The ability deals half the damage to the enemy that it would have dealt to the ally and loses any additional effects.\n\nStrained: The size of the aura increases by 1. Whenever your aura reflects an ability, you take 2d6 damage and forget a memory, as determined by you and the Director.',
  },
  {
    id: 'soul-burn',
    name: 'Soul Burn',
    flavorText: 'You blast their soul out of their body, leaving it to helplessly float back to a weakened husk.',
    actionType: 'action',
    essenceCost: 7,
    keywords: ['Animapathy', 'Psionic', 'Ranged', 'Strike'],
    distance: 'Ranged 10',
    target: 'One creature',
    powerRoll: {
      characteristic: 'presence',
      tier1: '6 + P damage; P < WEAK, dazed (save ends)',
      tier2: '10 + P damage; P < AVERAGE, dazed (save ends)',
      tier3: '14 + P damage; P < STRONG, dazed (save ends)',
    },
    effect: 'The target takes a bane on Presence tests until the end of the encounter.\n\nStrained: The potency of this ability increases by 1. You take 2d6 damage and gain 3 surges that you can use immediately.',
  },
];

// ============================================================
// 9-CLARITY ABILITIES
// ============================================================

export const talentNineClarityAbilities: Ability[] = [
  {
    id: 'exothermic-shield',
    name: 'Exothermic Shield',
    flavorText: 'You encase the target in psionic flame and allow them to flicker without fear of burning out.',
    actionType: 'maneuver',
    essenceCost: 9,
    keywords: ['Pyrokinesis', 'Psionic', 'Ranged'],
    distance: 'Ranged 10',
    target: 'Self or one ally',
    effect: 'Until the start of your next turn, the target has cold immunity 10 and fire immunity 10, and their strikes deal extra fire damage equal to twice your Reason score. Additionally, whenever an enemy uses a melee ability against the target while they are under this effect, the enemy takes 5 fire damage.\n\nStrained: The target gains 2 surges. You are weakened and slowed (save ends).',
  },
  {
    id: 'hypersonic',
    name: 'Hypersonic',
    flavorText: 'You move fast enough to turn around and watch your foes feel the aftermath.',
    actionType: 'action',
    essenceCost: 9,
    keywords: ['Area', 'Charge', 'Psionic', 'Telekinesis'],
    distance: '5 x 2 line within 1',
    target: 'Each enemy in the area',
    powerRoll: {
      characteristic: 'reason',
      tier1: '12 sonic damage',
      tier2: '18 sonic damage',
      tier3: '24 sonic damage',
    },
    effect: 'You teleport to a square on the opposite side of the area before making the power roll.\n\nStrained: If you obtain a tier 2 outcome or better, you are slowed until the end of your turn and each target is slowed until the end of their turn.',
  },
  {
    id: 'mind-snare',
    name: 'Mind Snare',
    flavorText: 'You latch onto your prey\'s brain and don\'t let go, like a song they can\'t get out of their head.',
    actionType: 'action',
    essenceCost: 9,
    keywords: ['Psionic', 'Ranged', 'Strike', 'Telepathy'],
    distance: 'Ranged 10',
    target: 'One creature',
    powerRoll: {
      characteristic: 'reason',
      tier1: '10 + R psychic damage; R < WEAK, slowed (save ends)',
      tier2: '14 + R psychic damage; R < AVERAGE, slowed (save ends)',
      tier3: '20 + R psychic damage; R < STRONG, slowed (save ends)',
    },
    effect: 'While slowed this way, the target takes 3 psychic damage for each square they willingly leave.\n\nStrained: While slowed this way, the target instead takes 5 psychic damage for each square they willingly leave. You have a double bane on ability rolls made against the target while they are slowed this way.',
  },
  {
    id: 'soulbound',
    name: 'Soulbound',
    flavorText: 'You fire a piercing bolt of psychic energy that lances through two foes and leaves a faint intangible thread between them.',
    actionType: 'action',
    essenceCost: 9,
    keywords: ['Animapathy', 'Psionic', 'Ranged', 'Strike'],
    distance: 'Ranged 10',
    target: 'Two enemies',
    powerRoll: {
      characteristic: 'presence',
      tier1: '8 damage; A < WEAK, the target is stitched to the other target (save ends)',
      tier2: '13 damage; A < AVERAGE, the target is stitched to the other target (save ends)',
      tier3: '17 damage; A < STRONG, the target is stitched to the other target (save ends)',
    },
    effect: 'If any target becomes stitched to the other, both targets are stitched together. While stitched together, a target takes a bane on power rolls while not adjacent to a creature they\'re stitched to. Whenever a stitched target takes damage that wasn\'t dealt by or also taken by another stitched target, each other stitched target takes half the damage the initial target took.\n\nStrained: You target yourself and three enemies instead.',
  },
];

// ============================================================
// 11-CLARITY ABILITIES
// ============================================================

export const talentElevenClarityAbilities: Ability[] = [
  {
    id: 'doubt',
    name: 'Doubt',
    flavorText: 'You tug at the strings of the foe\'s anima and unravel them, allowing someone else to take advantage of their drive.',
    actionType: 'action',
    essenceCost: 11,
    keywords: ['Animapathy', 'Psionic', 'Ranged', 'Strike'],
    distance: 'Ranged 10',
    target: 'One creature or object',
    powerRoll: {
      characteristic: 'presence',
      tier1: '10 + P damage; P < WEAK, weakened (save ends)',
      tier2: '14 + P damage; P < AVERAGE, weakened (save ends)',
      tier3: '20 + P damage; P < STRONG, weakened and slowed (save ends)',
    },
    effect: 'This ability gains an edge against a target with a soul. After you make the power roll, you or one ally within distance have a double edge on the next power roll you make before the end of the encounter.\n\nStrained: You feel dispirited until you finish a respite. If you obtain a tier 3 outcome on the power roll, you and the target each have damage weakness 5 (save ends).',
  },
  {
    id: 'mindwipe',
    name: 'Mindwipe',
    flavorText: 'You attempt to make them forget all their training.',
    actionType: 'action',
    essenceCost: 11,
    keywords: ['Melee', 'Psionic', 'Strike', 'Telepathy'],
    distance: 'Melee 2',
    target: 'One creature',
    powerRoll: {
      characteristic: 'reason',
      tier1: '12 + R damage; R < WEAK, the target takes a bane on their next power roll',
      tier2: '17 + R damage; R < AVERAGE, the target takes a bane on power rolls (save ends)',
      tier3: '23 + R damage; R < STRONG, the target has a double bane on power rolls (save ends)',
    },
    effect: 'The target can\'t communicate with anyone until the end of the encounter.\n\nStrained: You take 3d6 damage.',
  },
  {
    id: 'rejuvenate',
    name: 'Rejuvenate',
    flavorText: 'You reshape the flow of time in the target\'s body to return it to an earlier state.',
    actionType: 'maneuver',
    essenceCost: 11,
    keywords: ['Chronopathy', 'Psionic', 'Ranged'],
    distance: 'Ranged 10',
    target: 'Self or one ally',
    effect: 'Choose two of the following effects:\n\n- The target can spend any number of Recoveries.\n- The target gains 1 of their Heroic Resource, and can end any effects on them that are ended by a saving throw or that end at the end of their turn.\n- The target gains 2 surges, and gains a +3 bonus to speed until the end of the encounter.\n\nStrained: You and the target both permanently grow visibly younger (the equivalent of 20 human years, to the minimum of an 18-year-old). Additionally, you are weakened and slowed (save ends).',
  },
  {
    id: 'steel',
    name: 'Steel',
    flavorText: 'The target\'s skin becomes covered in tough metal.',
    actionType: 'maneuver',
    essenceCost: 11,
    keywords: ['Metamorphosis', 'Psionic', 'Ranged'],
    distance: 'Ranged 10',
    target: 'Self or one ally',
    effect: 'The target has damage immunity 5 and can\'t be made slowed or weakened until the start of your next turn. Whenever the target force moves a creature or object while under this effect, the forced movement distance gains a +5 bonus.\n\nStrained: You can\'t use maneuvers (save ends).',
  },
];

// ============================================================
// TRADITION FEATURES (1st Level)
// ============================================================

export const talentTraditionFeatures: Ability[] = [
  {
    id: 'accelerate',
    name: 'Accelerate',
    flavorText: 'To your ally, it seems as though the world has slowed down.',
    actionType: 'maneuver',
    keywords: ['Psionic', 'Ranged'],
    distance: 'Ranged 10',
    target: 'Self or one creature',
    effect: 'The target shifts up to a number of squares equal to your Reason score.\n\nSpend 2 Clarity: The target can use a maneuver.',
  },
  {
    id: 'again',
    name: 'Again',
    flavorText: 'You step back a split second to see if things play out a little differently.',
    actionType: 'triggered',
    keywords: ['Psionic', 'Ranged'],
    distance: 'Ranged 10',
    target: 'Self or one creature',
    trigger: 'The target makes an ability roll.',
    effect: 'You can use this ability after seeing the result of the triggering roll. The target must reroll the power roll and use the new roll.',
  },
  {
    id: 'feedback-loop',
    name: 'Feedback Loop',
    flavorText: 'Creating a brief psychic link between an enemy and their target gives that foe a taste of their own medicine.',
    actionType: 'triggered',
    keywords: ['Psionic', 'Ranged'],
    distance: 'Ranged 10',
    target: 'One creature',
    trigger: 'The target deals damage to an ally.',
    effect: 'The target takes psychic damage equal to half the triggering damage.',
  },
  {
    id: 'minor-telekinesis',
    name: 'Minor Telekinesis',
    flavorText: 'Wisps of psychic energy ripple visibly from your brain as you force the target to move using only your mind.',
    actionType: 'maneuver',
    keywords: ['Psionic', 'Ranged'],
    distance: 'Ranged 10',
    target: 'Self or one size 1 creature or object',
    effect: 'You slide the target up to a number of squares equal to your Reason score.\n\nSpend 2+ Clarity: The size of the creature or object you can target increases by 1 for every 2 clarity spent.\n\nSpend 3 Clarity: You can vertical slide the target.',
  },
  {
    id: 'remote-assistance',
    name: 'Remote Assistance',
    flavorText: 'An ally gains the benefit of your intellect.',
    actionType: 'maneuver',
    keywords: ['Psionic', 'Ranged'],
    distance: 'Ranged 10',
    target: 'One creature or object',
    effect: 'The next ability roll an ally makes against the target before the start of your next turn gains an edge.\n\nSpend 1 Clarity: You target one additional creature or object.',
  },
  {
    id: 'repel',
    name: 'Repel',
    flavorText: 'They aren\'t going anywhere, but you might!',
    actionType: 'triggered',
    keywords: ['Psionic', 'Ranged'],
    distance: 'Ranged 10',
    target: 'Self or one ally',
    trigger: 'The target takes damage or is force moved.',
    effect: 'The target takes half the triggering damage, or the distance of the triggering forced movement is reduced by a number of squares equal to your Reason score. If the target took damage and was force moved, you choose the effect. If the forced movement is reduced to 0 squares, the target can push the source of the forced movement a number of squares equal to your Reason score.',
  },
];

// ============================================================
// COMBINED EXPORTS
// ============================================================

// All core Talent abilities
export const talentAbilities: Ability[] = [
  ...talentSignatureAbilities,
  ...talentThreeClarityAbilities,
  ...talentFiveClarityAbilities,
  ...talentSevenClarityAbilities,
  ...talentNineClarityAbilities,
  ...talentElevenClarityAbilities,
];

// Helper functions
export const getAbilityById = (id: string): Ability | undefined => {
  return talentAbilities.find(a => a.id === id);
};

export const getAbilitiesByCost = (maxCost: number): Ability[] => {
  return talentAbilities.filter(a => (a.essenceCost || 0) <= maxCost);
};

export const getSignatureAbilities = (): Ability[] => {
  return talentSignatureAbilities;
};

export const getHeroicAbilities = (): Ability[] => {
  return talentAbilities.filter(a => a.essenceCost && a.essenceCost > 0);
};

// Get tradition feature ability
export const getTraditionFeature = (tradition: string, featureName: string): Ability | undefined => {
  const featureId = featureName.toLowerCase().replace(/\s+/g, '-');
  return talentTraditionFeatures.find(a => a.id === featureId);
};
