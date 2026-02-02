/**
 * Fury Class Abilities - Synced with Draw Steel Heroes v1
 * Resource: Ferocity
 */
import type { Ability } from '@anvil/types';

// ============================================================
// SIGNATURE ABILITIES (No cost, at-will)
// ============================================================

export const furySignatureAbilities: Ability[] = [
  {
    id: 'brutal-slam',
    name: 'Brutal Slam',
    flavorText: 'The heavy impact of your weapon attacks drives your foes ever back.',
    actionType: 'action',
    keywords: ['Melee', 'Strike', 'Weapon'],
    distance: 'Melee 1',
    target: 'One creature or object',
    powerRoll: {
      characteristic: 'might',
      tier1: '3 + M damage; push 1',
      tier2: '6 + M damage; push 2',
      tier3: '9 + M damage; push 4',
    },
    effect: '',
  },
  {
    id: 'hit-and-run',
    name: 'Hit and Run',
    flavorText: 'Staying in constant motion helps you slip out of reach after a brutal assault.',
    actionType: 'action',
    keywords: ['Melee', 'Strike', 'Weapon'],
    distance: 'Melee 1',
    target: 'One creature or object',
    powerRoll: {
      characteristic: 'might',
      tier1: '2 + M damage',
      tier2: '5 + M damage',
      tier3: '7 + M damage; A < STRONG, slowed (save ends)',
    },
    effect: 'You can shift 1 square.',
  },
  {
    id: 'impaled',
    name: 'Impaled!',
    flavorText: 'You skewer your enemy like a boar upon a spit.',
    actionType: 'action',
    keywords: ['Melee', 'Strike', 'Weapon'],
    distance: 'Melee 1',
    target: 'One creature of your size or smaller',
    powerRoll: {
      characteristic: 'might',
      tier1: '2 + M damage; M < WEAK, grabbed',
      tier2: '5 + M damage; M < AVERAGE, grabbed',
      tier3: '7 + M damage; M < STRONG, grabbed',
    },
    effect: '',
  },
  {
    id: 'to-the-death',
    name: 'To the Death!',
    flavorText: 'Your reckless assault leaves you tactically vulnerable.',
    actionType: 'action',
    keywords: ['Melee', 'Strike', 'Weapon'],
    distance: 'Melee 1',
    target: 'One creature or object',
    powerRoll: {
      characteristic: 'might',
      tier1: '3 + M damage',
      tier2: '6 + M damage',
      tier3: '9 + M damage',
    },
    effect: 'You gain 2 surges, and the target can make an opportunity attack against you as a free triggered action.',
  },
];

// ============================================================
// 3-FEROCITY ABILITIES
// ============================================================

export const furyThreeFerocityAbilities: Ability[] = [
  {
    id: 'back',
    name: 'Back!',
    flavorText: 'You hew about you with your mighty weapon, hurling enemies backward.',
    actionType: 'action',
    essenceCost: 3,
    keywords: ['Area', 'Melee', 'Weapon'],
    distance: '1 burst',
    target: 'Each enemy in the area',
    powerRoll: {
      characteristic: 'might',
      tier1: '5 damage',
      tier2: '8 damage; push 1',
      tier3: '11 damage; push 3',
    },
    effect: '',
  },
  {
    id: 'out-of-the-way',
    name: 'Out of the Way!',
    flavorText: 'Your enemies will clear your path—whether they want to or not.',
    actionType: 'action',
    essenceCost: 3,
    keywords: ['Melee', 'Strike', 'Weapon'],
    distance: 'Melee 1',
    target: 'One creature',
    powerRoll: {
      characteristic: 'might',
      tier1: '3 + M damage; slide 2',
      tier2: '5 + M damage; slide 3',
      tier3: '8 + M damage; slide 5',
    },
    effect: 'When you slide the target, you can move into any square they leave. If you take damage from an opportunity attack by moving this way, the target takes the same damage.',
  },
  {
    id: 'tide-of-death',
    name: 'Tide of Death',
    flavorText: 'Teach them the folly of lining up for you.',
    actionType: 'action',
    essenceCost: 3,
    keywords: ['Melee', 'Weapon'],
    distance: 'Self; see below',
    target: 'Self',
    powerRoll: {
      characteristic: 'might',
      tier1: '2 damage',
      tier2: '3 damage',
      tier3: '5 damage',
    },
    effect: 'You move up to your speed in a straight line, and enemy squares are not difficult terrain for this movement. You can end this movement in a creature\'s space and move them to an adjacent unoccupied space. You make one power roll that targets each enemy whose space you move through. The last target you damage takes extra damage equal to your Might score for each opportunity attack you trigger during your move.',
  },
  {
    id: 'your-entrails-are-your-extrails',
    name: 'Your Entrails Are Your Extrails!',
    flavorText: 'Hard for them to fight when they\'re busy holding in their giblets.',
    actionType: 'action',
    essenceCost: 3,
    keywords: ['Melee', 'Strike', 'Weapon'],
    distance: 'Melee 1',
    target: 'One creature or object',
    powerRoll: {
      characteristic: 'might',
      tier1: '3 + M damage; M < WEAK, bleeding (save ends)',
      tier2: '5 + M damage; M < AVERAGE, bleeding (save ends)',
      tier3: '8 + M damage; M < STRONG, bleeding (save ends)',
    },
    effect: 'While bleeding this way, the target takes damage equal to your Might score at the end of each of your turns.',
  },
];

// ============================================================
// 5-FEROCITY ABILITIES
// ============================================================

export const furyFiveFerocityAbilities: Ability[] = [
  {
    id: 'blood-for-blood',
    name: 'Blood for Blood!',
    flavorText: 'See how well they fight after you\'ve bled them dry.',
    actionType: 'action',
    essenceCost: 5,
    keywords: ['Melee', 'Strike', 'Weapon'],
    distance: 'Melee 1',
    target: 'One creature or object',
    powerRoll: {
      characteristic: 'might',
      tier1: '4 + M damage; M < WEAK, bleeding and weakened (save ends)',
      tier2: '6 + M damage; M < AVERAGE, bleeding and weakened (save ends)',
      tier3: '10 + M damage; M < STRONG, bleeding and weakened (save ends)',
    },
    effect: 'You can deal 1d6 damage to yourself to deal an extra 1d6 damage to the target.',
  },
  {
    id: 'make-peace-with-your-god',
    name: 'Make Peace With Your God!',
    flavorText: 'Anger is your energy.',
    actionType: 'freeManeuver',
    essenceCost: 5,
    keywords: [],
    distance: 'Self',
    target: 'Self',
    effect: 'You gain 1 surge, and the next ability roll you make this turn automatically obtains a tier 3 outcome.',
  },
  {
    id: 'thunder-roar',
    name: 'Thunder Roar',
    flavorText: 'You unleash a howl that hurls your enemies back.',
    actionType: 'action',
    essenceCost: 5,
    keywords: ['Area', 'Melee', 'Weapon'],
    distance: '5 x 1 line within 1',
    target: 'Each enemy in the area',
    powerRoll: {
      characteristic: 'might',
      tier1: '6 damage; push 2',
      tier2: '9 damage; push 4',
      tier3: '13 damage; push 6',
    },
    effect: 'The targets are force moved one at a time, starting with the target nearest to you, and can be pushed into other targets in the same line.',
  },
  {
    id: 'to-the-uttermost-end',
    name: 'To the Uttermost End',
    flavorText: 'You gut your life force to ensure a foe\'s demise.',
    actionType: 'action',
    essenceCost: 5,
    keywords: ['Melee', 'Strike', 'Weapon'],
    distance: 'Melee 1',
    target: 'One creature',
    powerRoll: {
      characteristic: 'might',
      tier1: '7 + M damage',
      tier2: '11 + M damage',
      tier3: '16 + M damage',
    },
    effect: 'Spend 1+ Ferocity: While you are winded, this ability deals an extra 1d6 damage for each ferocity spent. While you are dying, it deals an extra 1d10 damage for each ferocity spent. In either case, you lose 1d6 Stamina after making this strike.',
  },
];

// ============================================================
// 7-FEROCITY ABILITIES
// ============================================================

export const furySevenFerocityAbilities: Ability[] = [
  {
    id: 'demon-unleashed',
    name: 'Demon Unleashed',
    flavorText: 'Foes tremble at the sight of you.',
    actionType: 'maneuver',
    essenceCost: 7,
    keywords: ['Magic'],
    distance: 'Self',
    target: 'Self',
    effect: 'Until the end of the encounter or until you are dying, each enemy who starts their turn adjacent to you and has P < STRONG is frightened until the end of their turn.',
  },
  {
    id: 'face-the-storm',
    name: 'Face the Storm!',
    flavorText: 'Shocked in the face of your naked brutality, your enemy\'s instincts take over.',
    actionType: 'maneuver',
    essenceCost: 7,
    keywords: ['Magic'],
    distance: 'Self',
    target: 'Self',
    effect: 'Until the end of the encounter or until you are dying, each creature you make a melee strike against who has P < AVERAGE is taunted until the end of their next turn. Additionally, when you use an ability that deals rolled damage against any enemy taunted by you, the ability deals extra damage equal to twice your Might score and increases its potency by 1.',
  },
  {
    id: 'steelbreaker',
    name: 'Steelbreaker',
    flavorText: 'See how useless their weapons are!',
    actionType: 'maneuver',
    essenceCost: 7,
    keywords: ['Magic'],
    distance: 'Self',
    target: 'Self',
    effect: 'You gain 20 temporary Stamina.',
  },
  {
    id: 'you-are-already-dead',
    name: 'You Are Already Dead',
    flavorText: 'Slash. Walk away.',
    actionType: 'action',
    essenceCost: 7,
    keywords: ['Melee', 'Strike', 'Weapon'],
    distance: 'Melee 1',
    target: 'One creature',
    effect: 'If the target is not a leader or solo creature, they are reduced to 0 Stamina at the end of their next turn. If the target is a leader or solo creature, you gain 3 surges and can make a melee free strike against them.',
  },
];

// ============================================================
// 9-FEROCITY ABILITIES
// ============================================================

export const furyNineFerocityAbilities: Ability[] = [
  {
    id: 'debilitating-strike',
    name: 'Debilitating Strike',
    flavorText: 'You need just one blow to sabotage your target.',
    actionType: 'action',
    essenceCost: 9,
    keywords: ['Melee', 'Strike', 'Weapon'],
    distance: 'Melee 1',
    target: 'One creature',
    powerRoll: {
      characteristic: 'might',
      tier1: '10 + M damage; M < WEAK, slowed (save ends)',
      tier2: '14 + M damage; M < AVERAGE, slowed (save ends)',
      tier3: '20 + M damage; M < STRONG, slowed (save ends)',
    },
    effect: 'While slowed this way, the target takes 1 damage for every square they move, including from forced movement.',
  },
  {
    id: 'my-turn',
    name: 'My Turn!',
    flavorText: 'You quickly strike back at a foe.',
    actionType: 'freeTriggered',
    essenceCost: 9,
    keywords: ['Melee', 'Strike', 'Weapon'],
    distance: 'Melee 1',
    target: 'The triggering creature',
    trigger: 'A creature causes you to be winded or dying, or damages you while you are winded or dying.',
    powerRoll: {
      characteristic: 'might',
      tier1: '6 + M damage',
      tier2: '9 + M damage',
      tier3: '13 + M damage',
    },
    effect: 'You can spend a Recovery.',
  },
  {
    id: 'rebounding-storm',
    name: 'Rebounding Storm',
    flavorText: 'You knock around enemies like playthings.',
    actionType: 'action',
    essenceCost: 9,
    keywords: ['Melee', 'Strike', 'Weapon'],
    distance: 'Melee 1',
    target: 'Two creatures or objects',
    powerRoll: {
      characteristic: 'might',
      tier1: '9 damage; push 3',
      tier2: '14 damage; push 5',
      tier3: '19 damage; push 7',
    },
    effect: 'When a target would end this forced movement by colliding with a creature or object, they take damage as usual, then are pushed the remaining distance away from the creature or object in the direction they came from. As long as forced movement remains, this effect continues if the target collides with another creature or object.',
  },
  {
    id: 'to-stone',
    name: 'To Stone!',
    flavorText: 'You channel the Primordial Chaos into blows that petrify your foe... literally.',
    actionType: 'action',
    essenceCost: 9,
    keywords: ['Magic', 'Melee', 'Strike', 'Weapon'],
    distance: 'Melee 1',
    target: 'One creature',
    powerRoll: {
      characteristic: 'might',
      tier1: '9 + M damage; M < WEAK, slowed (save ends)',
      tier2: '13 + M damage; M < AVERAGE, slowed (save ends)',
      tier3: '18 + M damage; M < STRONG, restrained (save ends)',
    },
    effect: 'While the target is slowed this way, any other effect that would make the target slowed instead makes them restrained by this ability. Additionally, a creature who fails the saving throw while restrained this way is petrified until they are given a supernatural cure or you choose to reverse the effect (no action required).',
  },
];

// ============================================================
// 11-FEROCITY ABILITIES
// ============================================================

export const furyElevenFerocityAbilities: Ability[] = [
  {
    id: 'elemental-ferocity',
    name: 'Elemental Ferocity',
    flavorText: 'Your primordial energy makes for instant retribution.',
    actionType: 'maneuver',
    essenceCost: 11,
    keywords: ['Magic'],
    distance: 'Self',
    target: 'Self',
    effect: 'You gain 10 temporary Stamina. Additionally, choose acid, cold, corruption, fire, lightning, poison, or sonic damage. Until the end of the encounter or until you are dying, whenever an enemy damages you, they take 10 damage of the chosen type. If this damage reduces the enemy to 0 Stamina, you gain 10 temporary Stamina.',
  },
  {
    id: 'overkill',
    name: 'Overkill',
    flavorText: 'You strike so no damage is wasted.',
    actionType: 'action',
    essenceCost: 11,
    keywords: ['Magic', 'Melee', 'Strike', 'Weapon'],
    distance: 'Melee 1',
    target: 'One creature',
    powerRoll: {
      characteristic: 'might',
      tier1: '6 + M damage',
      tier2: '10 + M damage',
      tier3: '14 + M damage',
    },
    effect: 'If the target is a minion or is winded but isn\'t a leader or solo creature, they are reduced to 0 Stamina before this ability\'s damage is dealt. If the target is killed by this damage, you can deal any damage over what was required to kill them to another creature within 5 squares of the target.',
  },
  {
    id: 'primordial-rage',
    name: 'Primordial Rage',
    flavorText: 'Your ferocity manifests into primordial power.',
    actionType: 'maneuver',
    essenceCost: 11,
    keywords: ['Magic'],
    distance: 'Self',
    target: 'Self',
    effect: 'Choose acid, cold, corruption, fire, lightning, poison, or sonic damage. Until the end of the encounter or until you are dying, you can choose one target of any ability you use, with that target taking an extra 15 damage of the chosen type. Additionally, whenever you gain ferocity from taking damage, the source of the damage takes 5 damage of the chosen type.',
  },
  {
    id: 'relentless-death',
    name: 'Relentless Death',
    flavorText: 'You won\'t escape your fate.',
    actionType: 'action',
    essenceCost: 11,
    keywords: ['Magic', 'Melee', 'Strike', 'Weapon'],
    distance: 'Self; see below',
    target: 'Self',
    powerRoll: {
      characteristic: 'might',
      tier1: 'Any target whose Stamina is equal to or less than 8 dies.',
      tier2: 'Any target whose Stamina is equal to or less than 11 dies.',
      tier3: 'Any target whose Stamina is equal to or less than 17 dies.',
    },
    effect: 'You shift up to your speed. Each enemy you move adjacent to during this movement takes damage equal to twice your Might score. Then make one power roll that targets each enemy you move adjacent to during this shift. You gain 1 ferocity for each target who dies as a result of this ability (maximum 11 ferocity).',
  },
];

// ============================================================
// ASPECT-SPECIFIC 5-FEROCITY ABILITIES (Gained at Level 2)
// ============================================================

// Berserker 5-Ferocity Abilities
export const berserkerFiveFerocityAbilities: Ability[] = [
  {
    id: 'special-delivery',
    name: 'Special Delivery',
    flavorText: 'You ready?',
    actionType: 'maneuver',
    essenceCost: 5,
    keywords: ['Melee', 'Weapon'],
    distance: 'Melee 1',
    target: 'One willing ally',
    effect: 'You vertically push the target up to 4 squares. This forced movement ignores the target\'s stability, and the target takes no damage from colliding with creatures or objects. At the end of this movement, the target can make a free strike that deals extra damage equal to your Might score.',
  },
  {
    id: 'wrecking-ball',
    name: 'Wrecking Ball',
    flavorText: 'It\'s easier to destroy than to create. Much easier, in fact!',
    actionType: 'maneuver',
    essenceCost: 5,
    keywords: ['Melee', 'Weapon'],
    distance: 'Self; see below',
    target: 'Self',
    powerRoll: {
      characteristic: 'might',
      tier1: 'Push 1',
      tier2: 'Push 2',
      tier3: 'Push 3',
    },
    effect: 'You move up to your speed in a straight line. During this movement, you can move through mundane structures, including walls, which are difficult terrain for you. You automatically destroy each square of structure you move through and leave behind a square of difficult terrain. Additionally, you make one power roll that targets each enemy you move adjacent to during this movement.',
  },
];

// Reaver 5-Ferocity Abilities
export const reaverFiveFerocityAbilities: Ability[] = [
  {
    id: 'death-death',
    name: 'Death... Death!',
    flavorText: 'Your unbridled rage strikes terror in their hearts.',
    actionType: 'action',
    essenceCost: 5,
    keywords: ['Melee', 'Strike', 'Weapon'],
    distance: 'Melee 1',
    target: 'One creature',
    powerRoll: {
      characteristic: 'might',
      tier1: '3 + M damage; P < WEAK, dazed and frightened (save ends)',
      tier2: '5 + M damage; P < AVERAGE, dazed and frightened (save ends)',
      tier3: '8 + M damage; P < STRONG, dazed and frightened (save ends)',
    },
    effect: '',
  },
  {
    id: 'phalanx-breaker',
    name: 'Phalanx-Breaker',
    flavorText: 'Organizing your forces like feckless creatures of Law. Pitiful.',
    actionType: 'action',
    essenceCost: 5,
    keywords: ['Melee', 'Weapon'],
    distance: 'Self; see below',
    target: 'Self',
    powerRoll: {
      characteristic: 'might',
      tier1: '2 damage; A < WEAK, dazed (save ends)',
      tier2: '4 damage; A < AVERAGE, dazed (save ends)',
      tier3: '6 damage; A < STRONG, dazed (save ends)',
    },
    effect: 'You shift up to your speed and make one power roll that targets up to three enemies you move adjacent to during this shift.',
  },
];

// Stormwight 5-Ferocity Abilities
export const stormwightFiveFerocityAbilities: Ability[] = [
  {
    id: 'apex-predator',
    name: 'Apex Predator',
    flavorText: 'I will hunt you down.',
    actionType: 'action',
    essenceCost: 5,
    keywords: ['Melee', 'Strike', 'Weapon'],
    distance: 'Melee 1',
    target: 'One creature',
    powerRoll: {
      characteristic: 'might',
      tier1: '4 damage; I < WEAK, slowed (save ends)',
      tier2: '6 damage; I < AVERAGE, slowed (save ends)',
      tier3: '10 damage; I < STRONG, slowed (save ends)',
    },
    effect: 'The target can\'t be hidden from you for 24 hours. Until the end of the encounter, whenever the target willingly moves, you can use a free triggered action to move.',
  },
  {
    id: 'visceral-roar',
    name: 'Visceral Roar',
    flavorText: 'The sound of the storm within you staggers your opponents.',
    actionType: 'action',
    essenceCost: 5,
    keywords: ['Area', 'Magic'],
    distance: '2 burst',
    target: 'Each enemy in the area',
    powerRoll: {
      characteristic: 'might',
      tier1: '2 damage; push 1; M < WEAK, dazed (save ends)',
      tier2: '5 damage; push 2; M < AVERAGE, dazed (save ends)',
      tier3: '7 damage; push 3; M < STRONG, dazed (save ends)',
    },
    effect: 'This ability deals your primordial damage type (see Stormwight Kits).',
  },
];

// ============================================================
// ASPECT-SPECIFIC 9-FEROCITY ABILITIES (Gained at Level 6)
// ============================================================

export const berserkerNineFerocityAbilities: Ability[] = [
  {
    id: 'avalanche-impact',
    name: 'Avalanche Impact',
    flavorText: 'You leap and crash down, causing a shockwave that devastates foes.',
    actionType: 'maneuver',
    essenceCost: 9,
    keywords: ['Magic'],
    distance: 'Self',
    target: 'Self',
    powerRoll: {
      characteristic: 'might',
      tier1: '4 damage; push 1',
      tier2: '7 damage; push 2',
      tier3: '11 damage; push 3',
    },
    effect: 'You jump up to your maximum jump distance and make one power roll that targets each creature adjacent to the space where you land.',
  },
  {
    id: 'force-of-storms',
    name: 'Force of Storms',
    flavorText: 'You strike an enemy hard enough to be a projectile that knocks a crowd of creatures around.',
    actionType: 'action',
    essenceCost: 9,
    keywords: ['Melee', 'Strike', 'Weapon'],
    distance: 'Melee 1',
    target: 'One creature',
    powerRoll: {
      characteristic: 'might',
      tier1: '7 + M damage; push 3',
      tier2: '11 + M damage; push 5',
      tier3: '16 + M damage; push 7',
    },
    effect: 'When the target ends this forced movement, each creature within 2 squares of the target is pushed 3 squares.',
  },
];

export const reaverNineFerocityAbilities: Ability[] = [
  {
    id: 'death-strike',
    name: 'Death Strike',
    flavorText: 'Once you taste your foe\'s blood, you become more efficient and turn every killing blow into an opportunity.',
    actionType: 'freeTriggered',
    essenceCost: 9,
    keywords: ['Melee', 'Strike', 'Weapon'],
    distance: 'Melee 1',
    target: 'Self',
    trigger: 'You reduce a creature to 0 Stamina with a strike.',
    effect: 'You target a creature adjacent to you with the same strike, using the same power roll as the triggering strike.',
  },
  {
    id: 'seek-and-destroy',
    name: 'Seek and Destroy',
    flavorText: 'You break through the enemy lines to make an example.',
    actionType: 'action',
    essenceCost: 9,
    keywords: ['Melee', 'Strike', 'Weapon'],
    distance: 'Melee 1',
    target: 'One creature',
    powerRoll: {
      characteristic: 'might',
      tier1: '4 + M damage; P < WEAK, frightened (save ends)',
      tier2: '6 + M damage; P < AVERAGE, frightened (save ends)',
      tier3: '10 + M damage; P < STRONG, frightened (save ends)',
    },
    effect: 'You shift up to your speed. If a target who is not a leader or solo creature is winded by this strike, they are reduced to 0 Stamina and you choose an enemy within 5 squares of you. If that enemy has P < AVERAGE, they are frightened of you (save ends).',
  },
];

export const stormwightNineFerocityAbilities: Ability[] = [
  {
    id: 'pounce',
    name: 'Pounce',
    flavorText: 'You strike at the target like the ultimate predator you are.',
    actionType: 'action',
    essenceCost: 9,
    keywords: ['Magic', 'Melee', 'Strike', 'Weapon'],
    distance: 'Melee 1',
    target: 'One creature',
    powerRoll: {
      characteristic: 'might',
      tier1: '8 damage; M < WEAK, grabbed',
      tier2: '13 damage; M < AVERAGE, grabbed',
      tier3: '17 damage; M < STRONG, grabbed',
    },
    effect: 'You can shift up to 4 squares, bringing the target with you. While grabbed this way, the target takes damage equal to twice your Might score at the start of each of your turns.',
  },
  {
    id: 'riders-on-the-storm',
    name: 'Riders on the Storm',
    flavorText: 'You focus your connection to the Primordial Chaos into a seething storm.',
    actionType: 'maneuver',
    essenceCost: 9,
    keywords: ['Area', 'Magic'],
    distance: '3 aura',
    target: 'Each creature in the area',
    effect: 'Until the end of the encounter or until you are dying, each enemy target takes damage of your primordial damage type equal to twice your Might score at the end of each of your turns. Additionally, you can fly while the aura is active. Each ally target who starts or ends their turn in the area can also fly until the start of their next turn or until the effect ends.',
  },
];

// ============================================================
// ASPECT-SPECIFIC 11-FEROCITY ABILITIES (Gained at Level 9)
// ============================================================

export const berserkerElevenFerocityAbilities: Ability[] = [
  {
    id: 'death-comes-for-you-all',
    name: 'Death Comes for You All!',
    flavorText: 'You use your weapon to create a destructive shockwave.',
    actionType: 'action',
    essenceCost: 11,
    keywords: ['Area', 'Magic', 'Melee', 'Weapon'],
    distance: '3 burst',
    target: 'Each enemy in the area',
    powerRoll: {
      characteristic: 'might',
      tier1: '7 damage; push 3',
      tier2: '10 damage; push 5',
      tier3: '15 damage; push 7',
    },
    effect: 'If this forced movement causes a target to be hurled through an object, that target takes an extra 10 damage.',
  },
  {
    id: 'primordial-vortex',
    name: 'Primordial Vortex',
    flavorText: 'You channel the power of the Primordial Chaos to pull foes to you.',
    actionType: 'action',
    essenceCost: 11,
    keywords: ['Area', 'Magic', 'Melee', 'Weapon'],
    distance: '3 burst',
    target: 'Each enemy in the area',
    powerRoll: {
      characteristic: 'might',
      tier1: '3 damage; vertical pull 3',
      tier2: '5 damage; vertical pull 5',
      tier3: '8 damage; vertical pull 7',
    },
    effect: 'If this forced movement causes a target to slam into you, you take no damage from the collision and the target takes the damage you would have taken.',
  },
];

export const reaverElevenFerocityAbilities: Ability[] = [
  {
    id: 'primordial-bane',
    name: 'Primordial Bane',
    flavorText: 'You attune the target to be weaker to a specific element.',
    actionType: 'action',
    essenceCost: 11,
    keywords: ['Magic', 'Melee', 'Strike', 'Weapon'],
    distance: 'Melee 1',
    target: 'One creature',
    powerRoll: {
      characteristic: 'might',
      tier1: '11 + M damage',
      tier2: '16 + M damage',
      tier3: '21 + M damage',
    },
    effect: 'Choose acid, cold, corruption, fire, lightning, poison, or sonic damage. The target loses any damage immunity to the chosen type and gains weakness 10 to the chosen type (save ends).',
  },
  {
    id: 'shower-of-blood',
    name: 'Shower of Blood',
    flavorText: 'You shock your foes with the brutality of your strike, resetting the balance of combat.',
    actionType: 'action',
    essenceCost: 11,
    keywords: ['Melee', 'Strike', 'Weapon'],
    distance: 'Melee 1',
    target: 'One creature',
    powerRoll: {
      characteristic: 'might',
      tier1: '12 + M damage',
      tier2: '18 + M damage',
      tier3: '24 + M damage',
    },
    effect: 'Each enemy within 5 squares of you is distracted until the end of the round. While a creature is distracted this way, they can\'t take triggered actions or free triggered actions, ability rolls made against them gain an edge, and their characteristic scores are considered 1 lower for the purpose of resisting potencies.',
  },
];

export const stormwightElevenFerocityAbilities: Ability[] = [
  {
    id: 'death-rattle',
    name: 'Death Rattle',
    flavorText: 'You unleash an otherworldly cry that rips through your enemies, killing the weakest of them.',
    actionType: 'action',
    essenceCost: 11,
    keywords: ['Area', 'Magic'],
    distance: '3 burst',
    target: 'Each enemy in the area',
    powerRoll: {
      characteristic: 'might',
      tier1: '4 psychic damage; any target who is a minion is reduced to 0 Stamina',
      tier2: '6 psychic damage; any target who is a minion is reduced to 0 Stamina, as does one winded target who is not a leader or solo creature',
      tier3: '10 psychic damage; each target who is not a leader or solo creature is winded; any target who is a minion is reduced to 0 Stamina, as does one winded target who is not a leader or solo creature',
    },
    effect: '',
  },
  {
    id: 'deluge',
    name: 'Deluge',
    flavorText: 'You summon your primordial storm.',
    actionType: 'action',
    essenceCost: 11,
    keywords: ['Area', 'Magic', 'Ranged'],
    distance: '5 cube within 10',
    target: 'Each enemy in the area',
    powerRoll: {
      characteristic: 'might',
      tier1: '7 damage',
      tier2: '10 damage',
      tier3: '15 damage',
    },
    effect: 'This ability deals your primordial damage type and ignores damage immunity.',
  },
];

// ============================================================
// TRIGGERED ACTIONS (Aspect-specific)
// ============================================================

export const furyTriggeredActions: Ability[] = [
  {
    id: 'lines-of-force',
    name: 'Lines of Force',
    flavorText: 'You redirect the energy of motion.',
    actionType: 'triggered',
    keywords: ['Magic', 'Melee'],
    distance: 'Melee 1',
    target: 'Self or one creature',
    trigger: 'The target would be force moved.',
    effect: 'You can select a new target of the same size or smaller within distance to be force moved instead. You become the source of the forced movement, determine the new target\'s destination, and can push the target instead of using the original forced movement type. Additionally, the forced movement distance gains a bonus equal to your Might score. Spend 1 Ferocity: The forced movement distance gains a bonus equal to twice your Might score instead.',
  },
  {
    id: 'unearthly-reflexes',
    name: 'Unearthly Reflexes',
    flavorText: 'You are as elusive as a hummingbird.',
    actionType: 'triggered',
    keywords: [],
    distance: 'Self',
    target: 'Self',
    trigger: 'You take damage.',
    effect: 'You take half the damage from the triggering effect and can shift up to a number of squares equal to your Agility score. Spend 1 Ferocity: If the damage has any potency effects associated with it, the potency is reduced by 1 for you.',
  },
  {
    id: 'furious-change',
    name: 'Furious Change',
    flavorText: 'In your anger, you revert to a more bestial form.',
    actionType: 'triggered',
    keywords: [],
    distance: 'Self',
    target: 'Self',
    trigger: 'You lose Stamina and are not dying.',
    effect: 'You gain temporary Stamina equal to your Might score and can enter your animal form or hybrid form. Spend 1 Ferocity: If you are not dying, you can spend a Recovery.',
  },
];

// ============================================================
// COMBINED EXPORTS
// ============================================================

// All core Fury abilities (non-aspect-specific)
export const furyAbilities: Ability[] = [
  ...furySignatureAbilities,
  ...furyThreeFerocityAbilities,
  ...furyFiveFerocityAbilities,
  ...furySevenFerocityAbilities,
  ...furyNineFerocityAbilities,
  ...furyElevenFerocityAbilities,
];

// Helper functions
export const getAbilityById = (id: string): Ability | undefined => {
  return furyAbilities.find(a => a.id === id);
};

export const getAbilitiesByCost = (maxCost: number): Ability[] => {
  return furyAbilities.filter(a => (a.essenceCost || 0) <= maxCost);
};

export const getSignatureAbilities = (): Ability[] => {
  return furySignatureAbilities;
};

export const getHeroicAbilities = (): Ability[] => {
  return furyAbilities.filter(a => a.essenceCost && a.essenceCost > 0);
};

// Get aspect-specific abilities by cost
export const getAspectAbilitiesByCost = (aspect: string, cost: 5 | 9 | 11): Ability[] => {
  switch (aspect) {
    case 'berserker':
      if (cost === 5) return berserkerFiveFerocityAbilities;
      if (cost === 9) return berserkerNineFerocityAbilities;
      if (cost === 11) return berserkerElevenFerocityAbilities;
      break;
    case 'reaver':
      if (cost === 5) return reaverFiveFerocityAbilities;
      if (cost === 9) return reaverNineFerocityAbilities;
      if (cost === 11) return reaverElevenFerocityAbilities;
      break;
    case 'stormwight':
      if (cost === 5) return stormwightFiveFerocityAbilities;
      if (cost === 9) return stormwightNineFerocityAbilities;
      if (cost === 11) return stormwightElevenFerocityAbilities;
      break;
  }
  return [];
};

// Get triggered action for aspect
export const getAspectTriggeredAction = (aspect: string): Ability | undefined => {
  switch (aspect) {
    case 'berserker':
      return furyTriggeredActions.find(a => a.id === 'lines-of-force');
    case 'reaver':
      return furyTriggeredActions.find(a => a.id === 'unearthly-reflexes');
    case 'stormwight':
      return furyTriggeredActions.find(a => a.id === 'furious-change');
  }
  return undefined;
};
