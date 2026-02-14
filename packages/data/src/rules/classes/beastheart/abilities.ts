/**
 * Beastheart Class Abilities - Synced with Draw Steel Heroes v1
 * Resource: Ferocity
 */
import type { Ability } from '@anvil/types';

// ============================================================
// SIGNATURE ABILITIES (No cost, at-will)
// ============================================================

export const beastheartSignatureAbilities: Ability[] = [
  {
    id: 'burning-rage',
    name: 'Burning Rage',
    flavorText: 'Lances of primordial energy leap from you and your companion to sear, crush, or freeze your foe.',
    actionType: 'action',
    keywords: ['Beastheart', 'Magic', 'Melee', 'Ranged', 'Strike', 'Weapon'],
    distance: 'Melee 1; Ranged 5',
    target: 'One creature or object',
    powerRoll: {
      characteristic: 'might',
      tier1: '2 + M cold, fire, lightning, or sonic damage',
      tier2: '4 + M cold, fire, lightning, or sonic damage',
      tier3: '6 + M cold, fire, lightning, or sonic damage',
    },
    effect: 'You can spend a surge to allow your partner to use this ability as a free triggered action, targeting a different target with the same power roll and not using this effect.',
  },
  {
    id: 'covering-fire',
    name: 'Covering Fire',
    flavorText: 'Keep your head down or I\'ll shoot it off!',
    actionType: 'action',
    keywords: ['Beastheart', 'Ranged', 'Strike', 'Weapon'],
    distance: 'Ranged 5',
    target: 'One creature',
    powerRoll: {
      characteristic: 'intuition',
      tier1: '2 + I damage',
      tier2: '4 + I damage',
      tier3: '6 + I damage',
    },
    effect: 'If the target is not prone, they must use a free triggered action to fall prone or take extra damage equal to twice your Intuition score. Your companion can shift up to a number of spaces equal to their Intuition score.',
  },
  {
    id: 'scatter',
    name: 'Scatter!',
    flavorText: 'You launch a flurry of attacks and then retreat.',
    actionType: 'action',
    keywords: ['Beastheart', 'Melee', 'Ranged', 'Strike', 'Weapon'],
    distance: 'Melee 1; Ranged 5',
    target: 'One creature or object',
    powerRoll: {
      characteristic: 'might',
      tier1: '2 + M damage',
      tier2: '3 + M damage',
      tier3: '4 + M damage',
    },
    effect: 'Your companion makes a free strike. You both shift up to a number of squares equal to your Intuition score.',
  },
  {
    id: 'tag-me-in',
    name: 'Tag Me In',
    flavorText: 'Drawing on your primordial magic, you magically switch places with an ally, giving them a breather while you deliver a surprise attack.',
    actionType: 'action',
    keywords: ['Beastheart', 'Magic', 'Melee', 'Strike', 'Weapon'],
    distance: 'Melee 1',
    target: 'One creature or object',
    powerRoll: {
      characteristic: 'intuition',
      tier1: '3 + I damage',
      tier2: '5 + I damage',
      tier3: '7 + I damage',
    },
    effect: 'If you and a willing ally are standing on the ground within 10 squares of each other, you can teleport, swapping places. If you do so, you gain an edge on this ability\'s power roll.',
  },
];

// ============================================================
// 3-FEROCITY ABILITIES
// ============================================================

export const beastheartThreeFerocityAbilities: Ability[] = [
  {
    id: 'herd-the-sheep',
    name: 'Herd the Sheep',
    flavorText: 'Your companion circles your foe, luring them out of position with fake openings and unpredictable attacks.',
    actionType: 'action',
    essenceCost: 3,
    keywords: ['Companion', 'Melee', 'Strike', 'Weapon'],
    distance: 'Melee 1',
    target: 'One creature',
    powerRoll: {
      characteristic: 'might',
      tier1: '5 + M damage; slide 1; I < WEAK, weakened (save ends)',
      tier2: '8 + M damage; slide 2; I < AVERAGE, weakened (save ends)',
      tier3: '11 + M damage; slide 4; I < STRONG, weakened (save ends)',
    },
    effect: 'You and your companion can shift up to a number of squares equal to the number of squares the target was moved.',
  },
  {
    id: 'high-and-low',
    name: 'High and Low',
    flavorText: 'You and your companion surround your foe in order to bring them down.',
    actionType: 'action',
    essenceCost: 3,
    keywords: ['Companion', 'Melee', 'Strike', 'Weapon'],
    distance: 'Melee 1',
    target: 'One creature or object',
    powerRoll: {
      characteristic: 'might',
      tier1: '5 + M damage; push 2',
      tier2: '8 + M damage; push 4',
      tier3: '11 + M damage; push 6',
    },
    effect: 'This ability\'s push can pass through your space but not end there. If it passes through your space, the target falls prone and takes extra damage equal to your Intuition score.',
  },
  {
    id: 'hungry-like-the-wolf',
    name: 'Hungry like the Wolf',
    flavorText: 'The enemy\'s blood flows like wine, invigorating your companion.',
    actionType: 'action',
    essenceCost: 3,
    keywords: ['Companion', 'Magic', 'Melee', 'Strike', 'Weapon'],
    distance: 'Melee 1',
    target: 'One creature',
    powerRoll: {
      characteristic: 'might',
      tier1: '4 + M damage; your companion can spend a Recovery',
      tier2: '7 + M damage; each of you can spend a Recovery',
      tier3: '11 + M damage; A < STRONG, bleeding (EoT); each of you can spend a Recovery and shift up to 2 squares',
    },
    effect: '',
  },
  {
    id: 'mighty-roar',
    name: 'Mighty Roar',
    flavorText: 'Your companion unleashes a shattering roar, screech, or howl that terrifies your foes.',
    actionType: 'action',
    essenceCost: 3,
    keywords: ['Area', 'Companion', 'Magic'],
    distance: '2 burst',
    target: 'Each enemy in the area',
    powerRoll: {
      characteristic: 'intuition',
      tier1: '3 sonic damage; push 1; P < WEAK, taunted (save ends)',
      tier2: '5 sonic damage; push 2; P < AVERAGE, taunted (save ends)',
      tier3: '7 sonic damage; push 3; P < STRONG, taunted (save ends)',
    },
    effect: 'Spend 1 Ferocity: This ability also affects a 2 burst around you. An enemy in both areas is only affected once.',
  },
];

// ============================================================
// 5-FEROCITY ABILITIES
// ============================================================

export const beastheartFiveFerocityAbilities: Ability[] = [
  {
    id: 'bloodlust-strike',
    name: 'Bloodlust Strike',
    flavorText: 'Invigorated by the smell of blood, you strike a savage blow.',
    actionType: 'action',
    essenceCost: 5,
    keywords: ['Beastheart', 'Melee', 'Ranged', 'Strike', 'Weapon'],
    distance: 'Melee 1; Ranged 5',
    target: 'One creature',
    powerRoll: {
      characteristic: 'might',
      tier1: '8 + M damage',
      tier2: '12 + M damage',
      tier3: '16 + M damage; M < STRONG, bleeding (save ends)',
    },
    effect: 'If the target is winded or bleeding after the attack, you gain two surges.',
  },
  {
    id: 'bring-it-on',
    name: 'Bring it On!',
    flavorText: 'Let all of them come forward and shatter themselves against your might!',
    actionType: 'maneuver',
    essenceCost: 5,
    keywords: ['Area', 'Beastheart'],
    distance: '3 burst',
    target: 'Each enemy in the area',
    effect: 'You can spend a Recovery. Each enemy in the area is taunted (EoT). You gain 3 temporary Stamina for each enemy in the area. Spend 1 Ferocity: This ability also affects a 3 burst around your companion. Creatures in this second burst are taunted by your companion. An enemy in both areas is taunted only by you.',
  },
  {
    id: 'friendly-fire',
    name: 'Friendly Fire',
    flavorText: 'As your arrows rain down on your foes, flames spiral around your companion, setting the arrows ablaze.',
    actionType: 'action',
    essenceCost: 5,
    keywords: ['Area', 'Beastheart', 'Weapon'],
    distance: '3 cube within 5',
    target: 'Each enemy in the area',
    powerRoll: {
      characteristic: 'might',
      tier1: '3 damage',
      tier2: '5 damage',
      tier3: '8 damage',
    },
    effect: 'If your companion is in the area, your companion deals fire damage equal to their Intuition score to each enemy in the area.',
  },
  {
    id: 'unfair-advantage',
    name: 'Unfair Advantage',
    flavorText: 'The wilderness has no concept of fair play.',
    actionType: 'action',
    essenceCost: 5,
    keywords: ['Beastheart', 'Charge', 'Melee', 'Strike', 'Weapon'],
    distance: 'Melee 1',
    target: 'One creature',
    powerRoll: {
      characteristic: 'might',
      tier1: '8 + M damage; M < WEAK, grabbed',
      tier2: '12 + M damage; M < AVERAGE, grabbed',
      tier3: '16 + M damage; M < STRONG, grabbed',
    },
    effect: 'If you grab the target while your companion is adjacent to the target, your companion can make a melee free strike against the target.',
  },
];

// ============================================================
// 7-FEROCITY ABILITIES
// ============================================================

export const beastheartSevenFerocityAbilities: Ability[] = [
  {
    id: 'heart-eater',
    name: 'Heart Eater',
    flavorText: 'Bones crack as a bloody figure leaps from your foe\'s corpse.',
    actionType: 'triggered',
    essenceCost: 7,
    keywords: ['Beastheart', 'Magic', 'Ranged'],
    distance: 'Ranged 10',
    target: 'One creature',
    trigger: 'You use an ability that reduces the creature to 0 Stamina.',
    powerRoll: {
      characteristic: 'might',
      tier1: 'P < WEAK, frightened (save ends)',
      tier2: '4 psychic damage; P < AVERAGE, frightened (save ends)',
      tier3: '8 psychic damage; P < STRONG, frightened (save ends)',
    },
    effect: 'The creature dies and your companion rips their way out of the creature\'s body. Your companion teleports into the creature\'s space, shifts up to a number of squares equal to their Might, and can then make a melee free strike. Your companion makes one power roll targeting each enemy within 5 squares of the target.',
  },
  {
    id: 'heedless-headbutt',
    name: 'Heedless Headbutt',
    flavorText: 'Your bloody forehead smash drives your companion into a frenzy.',
    actionType: 'action',
    essenceCost: 7,
    keywords: ['Beastheart', 'Melee', 'Strike', 'Weapon'],
    distance: 'Melee 1',
    target: 'One creature',
    powerRoll: {
      characteristic: 'intuition',
      tier1: '13 + M damage; P < WEAK, dazed (save ends)',
      tier2: '19 + M damage; P < AVERAGE, dazed (save ends)',
      tier3: '25 + M damage; P < STRONG, dazed (save ends)',
    },
    effect: 'You are bleeding (save ends). Until you are no longer bleeding, your companion has an edge on power rolls.',
  },
  {
    id: 'primordial-jaws',
    name: 'Primordial Jaws',
    flavorText: 'The spectral jaws of a trap clamp on a foe, chaining them to you and draining their life essence.',
    actionType: 'action',
    essenceCost: 7,
    keywords: ['Beastheart', 'Magic', 'Melee', 'Ranged'],
    distance: 'Melee 1; Ranged 5',
    target: 'One creature',
    powerRoll: {
      characteristic: 'might',
      tier1: '7 + I damage; P < WEAK, weakened (save ends)',
      tier2: '10 + I damage; P < AVERAGE, weakened (save ends)',
      tier3: '14 + I damage; P < STRONG, weakened (save ends)',
    },
    effect: 'When a target weakened by this ability fails their saving throw against this ability while more than 3 squares from you, as a free triggered action you can pull the target up to a number of squares equal to your Intuition score.',
  },
  {
    id: 'setup-strike',
    name: 'Setup Strike',
    flavorText: 'Your attack sets up a vicious combo.',
    actionType: 'action',
    essenceCost: 7,
    keywords: ['Beastheart', 'Melee', 'Ranged', 'Strike', 'Weapon'],
    distance: 'Melee 1; Ranged 5',
    target: 'One creature',
    powerRoll: {
      characteristic: 'might',
      tier1: '9 + M damage',
      tier2: '14 + M damage',
      tier3: '19 + M damage',
    },
    effect: 'The next creature to damage the target before the start of your next turn gains three surges.',
  },
];

// ============================================================
// 9-FEROCITY ABILITIES
// ============================================================

export const beastheartNineFerocityAbilities: Ability[] = [
  {
    id: 'dogpile',
    name: 'Dogpile',
    flavorText: 'You and your allies surround your enemy like a pack of wolves, mobbing them and pulling them down.',
    actionType: 'action',
    essenceCost: 9,
    keywords: ['Beastheart', 'Melee', 'Strike', 'Weapon'],
    distance: 'Melee 1',
    target: 'One creature',
    powerRoll: {
      characteristic: 'might',
      tier1: '10 + M damage; M < WEAK, grabbed and prone',
      tier2: '15 + M damage; M < AVERAGE, grabbed and prone',
      tier3: '20 + M damage; M < STRONG, grabbed and prone',
    },
    effect: 'Each ally adjacent to the target can use a triggered free action to deal damage to the target equal to the ally\'s highest characteristic.',
  },
  {
    id: 'hunters-mercy',
    name: 'Hunter\'s Mercy',
    flavorText: 'You take a single shot that ends your quarry\'s life.',
    actionType: 'action',
    essenceCost: 9,
    keywords: ['Beastheart', 'Ranged', 'Strike', 'Weapon'],
    distance: 'Ranged 15',
    target: 'One creature or object',
    powerRoll: {
      characteristic: 'intuition',
      tier1: '12 + I damage',
      tier2: '18 + I damage',
      tier3: '30 + I damage',
    },
    effect: 'If you are hidden, you remain hidden after the attack.',
  },
  {
    id: 'massive-throw',
    name: 'Massive Throw',
    flavorText: 'You can bear impossible burdens with the aid of your companion.',
    actionType: 'action',
    essenceCost: 9,
    keywords: ['Beastheart', 'Melee', 'Strike', 'Weapon'],
    distance: 'Melee 1',
    target: 'One creature',
    powerRoll: {
      characteristic: 'might',
      tier1: '10 + M damage; vertical push 4; prone',
      tier2: '15 + M damage; vertical push 6; prone',
      tier3: '20 + M damage; vertical push 8; prone',
    },
    effect: 'If your companion is adjacent to the target, you can ignore the target\'s Stability.',
  },
  {
    id: 'rend-in-two',
    name: 'Rend in Two',
    flavorText: 'In a gruesome display, you and your companion rip off a pinioned enemy\'s limb or other body part and toss it away.',
    actionType: 'action',
    essenceCost: 9,
    keywords: ['Melee', 'Strike', 'Weapon'],
    distance: 'Melee 1',
    target: 'One creature',
    powerRoll: {
      characteristic: 'might',
      tier1: '11 + M damage; M < WEAK, bleeding (save ends)',
      tier2: '17 + M damage; M < AVERAGE, bleeding (save ends)',
      tier3: '22 + M damage; M < STRONG, bleeding (save ends)',
    },
    effect: 'If the target is grabbed by your partner, the target takes extra damage equal to your Might score plus your companion\'s Might score. If this ability reduces a target to 0 Stamina, each enemy within 2 squares who has P < AVERAGE is frightened (save ends).',
  },
];

// ============================================================
// 11-FEROCITY ABILITIES
// ============================================================

export const beastheartElevenFerocityAbilities: Ability[] = [
  {
    id: 'bloodied-blade-and-claw',
    name: 'Bloodied Blade and Claw',
    flavorText: 'Driven by the pain and desperation of battle, you and your companion spend your last strength in a flurry of wild attacks.',
    actionType: 'action',
    essenceCost: 11,
    keywords: ['Beastheart', 'Melee', 'Ranged', 'Strike', 'Weapon'],
    distance: 'Melee 1; Ranged 5',
    target: 'One creature or object',
    powerRoll: {
      characteristic: 'intuition',
      tier1: '5 + M damage',
      tier2: '15 + M damage',
      tier3: '25 + M damage',
    },
    effect: 'Your companion can repeat the attack as a melee attack, making their own power roll. Both power rolls have an edge if either of you is bleeding, dying, or winded, and your power roll has a double edge if your companion is dead or otherwise unable to act.',
  },
  {
    id: 'burn-the-world-to-ash',
    name: 'Burn the World to Ash',
    flavorText: 'Wrenching power from your primordial bond, you unleash elemental power in a devastating conflagration that you can\'t control.',
    actionType: 'action',
    essenceCost: 11,
    keywords: ['Area', 'Beastheart', 'Magic'],
    distance: '2 burst',
    target: 'Each enemy in the area',
    powerRoll: {
      characteristic: 'intuition',
      tier1: '10 cold, fire, lightning, or sonic damage',
      tier2: '18 cold, fire, lightning, or sonic damage',
      tier3: '26 cold, fire, lightning, or sonic damage',
    },
    effect: 'Spend 2+ Ferocity: You can spend up to 6 extra ferocity. For each 2 extra ferocity you spend, the size of the burst is increased by 1, 2 is added to the power roll, and you take 5 damage that can\'t be reduced in any way. You can decide how much ferocity you spend after you make the power roll.',
  },
  {
    id: 'double-trouble',
    name: 'Double Trouble',
    flavorText: 'Your enemies might be stronger than you, but that\'s why you\'re not here alone.',
    actionType: 'action',
    essenceCost: 11,
    keywords: ['Beastheart'],
    distance: 'Self',
    target: 'Self',
    effect: 'You each use a different ability that costs 9 or less ferocity and that uses a maneuver or an action. These abilities cost no ferocity. If an ability lets you spend extra ferocity for an enhanced effect, you can\'t do so.',
  },
  {
    id: 'life-drinking-wound',
    name: 'Life-Drinking Wound',
    flavorText: 'As your attack strikes home, your enemy\'s escaping life force drifts to your allies in crimson threads.',
    actionType: 'action',
    essenceCost: 11,
    keywords: ['Beastheart', 'Magic', 'Melee', 'Ranged', 'Strike', 'Weapon'],
    distance: 'Melee 1; Ranged 5',
    target: 'One creature',
    powerRoll: {
      characteristic: 'might',
      tier1: '12 + M damage',
      tier2: '18 + M damage',
      tier3: '24 + M damage',
    },
    effect: 'Up to three creatures within 2 squares of the target gain temporary Stamina equal to half the damage you dealt.',
  },
];

// ============================================================
// WILD NATURE-SPECIFIC 5-FEROCITY ABILITIES (Gained at Level 2)
// ============================================================

// Guardian 5-Ferocity Abilities
export const guardianFiveFerocityAbilities: Ability[] = [
  {
    id: 'belly-of-the-beast',
    name: 'Belly of the Beast',
    flavorText: 'What do you have in your mouth? No! Bad boy!',
    actionType: 'action',
    essenceCost: 5,
    keywords: ['Companion', 'Melee', 'Strike', 'Weapon'],
    distance: 'Melee 1',
    target: 'One grabbed creature your companion\'s size or smaller',
    powerRoll: {
      characteristic: 'might',
      tier1: '6 + M damage; M < WEAK, swallowed',
      tier2: '10 + M damage; M < AVERAGE, swallowed',
      tier3: '14 + M damage; M < STRONG, swallowed',
    },
    effect: 'A swallowed creature shares your companion\'s space, is grabbed and restrained, and has line of effect only to your companion. Nothing has line of effect to the swallowed creature. At the start of each of your turns, the swallowed creature takes acid damage equal to 1 + your companion\'s Might. If the creature escapes the grab, the companion immediately regurgitates the creature, who lands prone in an unoccupied square adjacent to your companion and is no longer grabbed or restrained. Your companion can also regurgitate the creature as a free maneuver. Your companion can have one creature swallowed at a time.',
  },
  {
    id: 'fetch',
    name: 'Fetch!',
    flavorText: 'Your companion blinks out of existence, returning with a visitor you were particularly hoping to meet.',
    actionType: 'action',
    essenceCost: 5,
    keywords: ['Companion', 'Magic', 'Melee', 'Strike', 'Weapon'],
    distance: 'Melee 1',
    target: 'One creature or object',
    powerRoll: {
      characteristic: 'might',
      tier1: '6 + M damage; M < WEAK, grabbed',
      tier2: '8 + M damage; M < AVERAGE, grabbed',
      tier3: '12 + M damage; M < STRONG, grabbed',
    },
    effect: 'Your companion teleports up to 5 squares before and after making the attack. Instead of grabbing a targeted creature, your companion can hold a targeted object that is smaller than they are. You can forgo dealing damage when using this ability. While teleporting after making the attack, your companion can teleport with a grabbed creature or held object if there is sufficient room at the destination.',
  },
];

// Prowler 5-Ferocity Abilities
export const prowlerFiveFerocityAbilities: Ability[] = [
  {
    id: 'jump-scare',
    name: 'Jump Scare',
    flavorText: 'Surprised to see me?',
    actionType: 'action',
    essenceCost: 5,
    keywords: ['Companion', 'Area', 'Magic'],
    distance: '2 burst',
    target: 'Each enemy in the area with line of effect',
    powerRoll: {
      characteristic: 'intuition',
      tier1: '4 damage; P < WEAK, frightened (save ends)',
      tier2: '6 damage; P < AVERAGE, frightened (save ends)',
      tier3: '10 damage; P < STRONG, frightened (save ends)',
    },
    effect: 'Your companion shifts up to a number of squares equal to their Intuition score. During this movement, they are invisible. They then make a power roll.',
  },
  {
    id: 'close-combat',
    name: 'Close Combat',
    flavorText: 'Your companion darts around their target, staying out of reach and using them as a shield.',
    actionType: 'action',
    essenceCost: 5,
    keywords: ['Charge', 'Companion', 'Melee', 'Strike', 'Weapon'],
    distance: 'Melee 1',
    target: 'One creature or object',
    powerRoll: {
      characteristic: 'might',
      tier1: '5 + M damage',
      tier2: '8 + M damage',
      tier3: '12 + M damage',
    },
    effect: 'Your companion enters the target\'s space. Until your companion is no longer in the target\'s space, your companion can end their turn in the target\'s space, strikes against your companion also affect the target, and your strikes against the target gain an edge.',
  },
];

// Punisher 5-Ferocity Abilities
export const punisherFiveFerocityAbilities: Ability[] = [
  {
    id: 'foe-bowling',
    name: 'Foe Bowling',
    flavorText: 'Your companion sends one enemy tumbling into another, taking them both out.',
    actionType: 'action',
    essenceCost: 5,
    keywords: ['Charge', 'Companion', 'Melee', 'Strike', 'Weapon'],
    distance: 'Melee 1',
    target: 'One creature',
    powerRoll: {
      characteristic: 'might',
      tier1: '3 + M damage; push 2; M < WEAK, prone',
      tier2: '5 + M damage; push 3; M < AVERAGE, prone',
      tier3: '8 + M damage; push 4; M < STRONG, prone',
    },
    effect: 'If the target is force moved at least 1 square, at the end of this movement an enemy adjacent to the target is also targeted by this ability\'s power roll but not this additional effect.',
  },
  {
    id: 'psych-up',
    name: 'Psych Up',
    flavorText: 'Your companion builds up courage with a roar, growl, or aggressive display.',
    actionType: 'maneuver',
    essenceCost: 5,
    keywords: ['Companion'],
    distance: 'Ranged 5',
    target: 'One creature',
    effect: 'Your companion and an ally within range can gain two surges, spend up to two Recoveries, and end one (EoT) or (Save Ends) condition or effect on themselves.',
  },
];

// Spark 5-Ferocity Abilities
export const sparkFiveFerocityAbilities: Ability[] = [
  {
    id: 'burning-lash',
    name: 'Burning Lash',
    flavorText: 'A blazing whip of energy lashes out to curl around a foe\'s legs and burn them to a crisp.',
    actionType: 'action',
    essenceCost: 5,
    keywords: ['Companion', 'Magic', 'Melee', 'Strike', 'Weapon'],
    distance: 'Melee 2',
    target: 'One creature',
    powerRoll: {
      characteristic: 'might',
      tier1: '6 + I fire or lightning damage; M < WEAK, prone',
      tier2: '9 + I fire or lightning damage; M < AVERAGE, prone',
      tier3: '14 + I fire or lightning damage; M < STRONG, prone and can\'t stand (EoT)',
    },
    effect: 'Spend 1 Ferocity: If you are within 2 squares of the enemy, you can use a free maneuver to wield a second whip, dealing extra fire or lightning damage to the target equal to your Intuition score.',
  },
  {
    id: 'howling-gale',
    name: 'Howling Gale',
    flavorText: 'A blizzard or thunderstorm sends foes flying and lifts you like a feather.',
    actionType: 'action',
    essenceCost: 5,
    keywords: ['Area', 'Companion', 'Magic'],
    distance: '3 cube within 5',
    target: 'Each enemy in the area',
    powerRoll: {
      characteristic: 'might',
      tier1: '6 cold or sonic damage; slide 1',
      tier2: '9 cold or sonic damage; slide 2',
      tier3: '13 cold or sonic damage; slide 4',
    },
    effect: 'Until the end of your next turn, you and your companion can fly and both of your speed increases by 3.',
  },
];

// ============================================================
// WILD NATURE-SPECIFIC 9-FEROCITY ABILITIES (Gained at Level 6)
// ============================================================

export const guardianNineFerocityAbilities: Ability[] = [
  {
    id: 'sic-em',
    name: 'Sic \'Em!',
    flavorText: 'Your companion rushes forward to protect you from a dangerous foe.',
    actionType: 'action',
    essenceCost: 9,
    keywords: ['Charge', 'Companion', 'Melee', 'Strike', 'Weapon'],
    distance: 'Melee 1',
    target: 'One creature',
    powerRoll: {
      characteristic: 'might',
      tier1: '11 + M damage; taunted (save ends); M < WEAK, prone',
      tier2: '16 + M damage; taunted (save ends); M < AVERAGE, prone',
      tier3: '21 + M damage; taunted (save ends); M < STRONG, prone and can\'t stand (EoT)',
    },
    effect: 'Spend 2 Ferocity: Your companion can use this ability as a triggered action against an enemy who damages you.',
  },
  {
    id: 'staredown',
    name: 'Staredown',
    flavorText: 'Your companion locks eyes with an enemy, imposing their will upon the enemy and daring them to move a muscle.',
    actionType: 'maneuver',
    essenceCost: 9,
    keywords: ['Companion', 'Magic', 'Ranged'],
    distance: 'Ranged 5',
    target: 'One creature',
    powerRoll: {
      characteristic: 'intuition',
      tier1: '9 + I psychic damage; I < WEAK, weakened (save ends)',
      tier2: '13 + I psychic damage; I < AVERAGE, weakened (save ends)',
      tier3: '18 + I psychic damage; I < STRONG, weakened (save ends)',
    },
    effect: 'The first time the target uses a move, action, maneuver, or triggered action before the start of your next turn, the target triggers the power roll before they act. At the start of the next turn, if the target hasn\'t triggered this power roll, they become frightened (save ends).',
  },
];

export const prowlerNineFerocityAbilities: Ability[] = [
  {
    id: 'phantom-form',
    name: 'Phantom Form',
    flavorText: 'Your companion becomes a soul-freezing wraith.',
    actionType: 'move',
    essenceCost: 9,
    keywords: ['Magic'],
    distance: 'Self',
    target: 'Self',
    effect: 'You and your companion shift up to your speeds. During this movement, you are both invisible and can move through enemies, objects, and difficult terrain without spending additional squares of movement. You deal corruption damage equal to your Intuition score to each enemy you pass through during this movement. Each of you can damage each enemy once in this way.',
  },
  {
    id: 'raking-lunge',
    name: 'Raking Lunge',
    flavorText: 'Your companion ducks under your enemy\'s guard and rakes open their soft vitals.',
    actionType: 'action',
    essenceCost: 9,
    keywords: ['Companion', 'Melee', 'Strike', 'Weapon'],
    distance: 'Melee 2',
    target: 'One creature',
    powerRoll: {
      characteristic: 'might',
      tier1: '10 + M damage; A < WEAK, bleeding (save ends)',
      tier2: '15 + M damage; A < AVERAGE, bleeding (save ends)',
      tier3: '20 + M damage; A < STRONG, bleeding (save ends)',
    },
    effect: 'While the target is bleeding, they have damage weakness 5.',
  },
];

export const punisherNineFerocityAbilities: Ability[] = [
  {
    id: 'howling-advance',
    name: 'Howling Advance',
    flavorText: 'Roaring like a pack of wild beasts, your companion and your allies rush toward the foe.',
    actionType: 'maneuver',
    essenceCost: 9,
    keywords: ['Companion'],
    distance: 'Self',
    target: 'Self',
    effect: 'Your companion shifts up to their speed and can make a free strike. If within 10 squares of the square from which this movement started, you and up to 10 allies can also shift up to their speed and make free strikes.',
  },
  {
    id: 'thundering-strike',
    name: 'Thundering Strike',
    flavorText: 'The rumble of your companion\'s dash is a rolling thunderclap, their impact an earthquake.',
    actionType: 'action',
    essenceCost: 9,
    keywords: ['Companion', 'Magic', 'Melee', 'Strike'],
    distance: 'Self',
    target: 'Self',
    powerRoll: {
      characteristic: 'might',
      tier1: '9 sonic damage; M < WEAK, prone',
      tier2: '13 sonic damage; M < AVERAGE, prone',
      tier3: '18 sonic damage; M < STRONG, prone',
    },
    effect: 'Your companion shifts up to their speed. Your companion makes one power roll that targets each enemy your companion comes adjacent to during the shift. If your companion only targets one enemy with this ability, the power roll has an edge. Spend 2 Ferocity: You can move up to your speed. The power roll also affects any enemy you come adjacent to during the move.',
  },
];

export const sparkNineFerocityAbilities: Ability[] = [
  {
    id: 'elemental-form',
    name: 'Elemental Form',
    flavorText: 'Your companion\'s body becomes a bank of glowing coals, a web of arcing lightning, a cloud of rumbling thunder, or a flurry of dancing ice crystals.',
    actionType: 'maneuver',
    essenceCost: 9,
    keywords: ['Companion', 'Magic'],
    distance: 'Self',
    target: 'Self',
    effect: 'Your companion transforms into a creature made of elemental energy. Choose cold, fire, lightning, or sonic damage. While transformed, your companion has: speed with Fly tag (or +2 speed if already flying); when entering a creature\'s space or damaging a creature with an attack, deals 5 damage of chosen type; immunity to the chosen damage type and immunity 5 to all other damage. Lasts until the start of your next turn. Spend 3 Ferocity to extend 1 turn (can change damage type). Spend 2 Ferocity: You are transformed as well.',
  },
  {
    id: 'killing-frost',
    name: 'Killing Frost',
    flavorText: 'Black frost freezes boots to the floor and creeps up trapped victims until they are completely encased in ice.',
    actionType: 'action',
    essenceCost: 9,
    keywords: ['Area', 'Companion', 'Magic'],
    distance: '5 cube within 1',
    target: 'Each enemy in the area',
    powerRoll: {
      characteristic: 'might',
      tier1: '5 cold damage; I < WEAK, restrained (save ends)',
      tier2: '7 cold damage; I < AVERAGE, restrained (save ends)',
      tier3: '12 cold damage; I < STRONG, restrained (save ends)',
    },
    effect: 'While restrained by this ability, a creature takes 5 cold damage at the start of each of your turns. A creature killed by this ability becomes an ice statue; their space is difficult terrain.',
  },
];

// ============================================================
// WILD NATURE-SPECIFIC 11-FEROCITY ABILITIES (Gained at Level 9)
// ============================================================

export const guardianElevenFerocityAbilities: Ability[] = [
  {
    id: 'banshee-howl',
    name: 'Banshee Howl',
    flavorText: 'Your companion\'s howl, screech, roar, or psychic emanation presages death to those who hear it.',
    actionType: 'action',
    essenceCost: 11,
    keywords: ['Area', 'Companion', 'Magic'],
    distance: '3 burst',
    target: 'Each enemy in the area',
    powerRoll: {
      characteristic: 'intuition',
      tier1: '5 sonic damage; I < WEAK, frightened (save ends)',
      tier2: '10 sonic damage; I < AVERAGE, frightened (save ends)',
      tier3: '15 sonic damage; I < STRONG, frightened (save ends)',
    },
    effect: 'While frightened by this ability, a creature takes 10 psychic damage at the start of each of your turns. Spend 1 Ferocity: This ability also affects a 3 burst around you. An enemy in both areas is only affected once.',
  },
  {
    id: 'enemies-till-death',
    name: 'Enemies Till Death',
    flavorText: 'Your companion launches themself at your foe, shielding allies with their body.',
    actionType: 'action',
    essenceCost: 11,
    keywords: ['Companion', 'Charge', 'Melee', 'Strike', 'Weapon'],
    distance: 'Melee 1',
    target: 'One enemy',
    powerRoll: {
      characteristic: 'intuition',
      tier1: '11 + M damage; P < WEAK, taunted (save ends)',
      tier2: '17 + M damage; P < AVERAGE, taunted (save ends)',
      tier3: '22 + M damage; P < STRONG, taunted (save ends)',
    },
    effect: 'While the target is taunted by this ability, all creatures except your companion have immunity 10 to damage dealt by the target.',
  },
];

export const prowlerElevenFerocityAbilities: Ability[] = [
  {
    id: 'chaos-duel',
    name: 'Chaos Duel',
    flavorText: 'You or your companion drag your chosen foe into storms of the Primordial Plane.',
    actionType: 'action',
    essenceCost: 11,
    keywords: ['Companion', 'Magic'],
    distance: 'Melee 1',
    target: 'One creature',
    effect: 'You, your companion, and the target enter a tiny pocket of Quintessence. The three of you can\'t affect or be affected by any creatures except each other. Creatures in this pocket can\'t move or teleport away from each other and are always adjacent to each other, but can otherwise act normally. While on Quintessence, the target takes 5 cold damage, 5 fire damage, 5 lightning damage, and 5 sonic damage at the start of each of your turns. You can end the effect as a free maneuver, and the target can make a save at the end of each of their turns to end the effect. The effect also ends when one of you dies. When the effect ends, you each return to the closest unoccupied space from the space you departed. If the target dies in the Quintessence, their remains do not return.',
  },
  {
    id: 'nightmare-apparition',
    name: 'Nightmare Apparition',
    flavorText: 'Your companion appears next to their victim in the guise of a heart-stopping nightmare.',
    actionType: 'action',
    essenceCost: 11,
    keywords: ['Companion', 'Magic', 'Melee', 'Strike', 'Weapon'],
    distance: 'Melee 1',
    target: 'One creature',
    powerRoll: {
      characteristic: 'intuition',
      tier1: '13 + I psychic damage; P < WEAK, frightened (save ends)',
      tier2: '20 + I psychic damage; P < AVERAGE, frightened (save ends)',
      tier3: '27 + I psychic damage; P < STRONG, frightened (save ends)',
    },
    effect: 'Your companion teleports up to their speed.',
  },
];

export const punisherElevenFerocityAbilities: Ability[] = [
  {
    id: 'battle-frenzy',
    name: 'Battle Frenzy',
    flavorText: 'Your companion shatters the floodgates that keep their rampage dammed up, and it cascades into the unprepared minds of nearby creatures.',
    actionType: 'action',
    essenceCost: 11,
    keywords: ['Area', 'Companion', 'Magic'],
    distance: '5 burst',
    target: 'Creatures of your choice',
    powerRoll: {
      characteristic: 'might',
      tier1: 'P < WEAK, battle frenzied',
      tier2: 'P < AVERAGE, battle frenzied',
      tier3: 'battle frenzied',
    },
    effect: 'A battle frenzied creature uses a free triggered action to make a melee free strike against themself or a creature adjacent to them and then they are no longer battle frenzied. You choose each creature\'s target. A creature that would normally be unaffected by this ability can choose to be affected.',
  },
  {
    id: 'send-em-flying',
    name: 'Send \'Em Flying',
    flavorText: 'Your companion plows through the front lines, tossing enemies—and allies—this way and that.',
    actionType: 'action',
    essenceCost: 11,
    keywords: ['Area', 'Charge', 'Companion'],
    distance: '2 burst',
    target: 'Each creature',
    powerRoll: {
      characteristic: 'intuition',
      tier1: '9 damage; vertical slide 2; M < WEAK, prone',
      tier2: '13 damage; vertical slide 4; M < AVERAGE, prone',
      tier3: '18 damage; vertical slide 6; M < STRONG, prone',
    },
    effect: 'Your companion can forgo dealing damage to targets of your choice.',
  },
];

export const sparkElevenFerocityAbilities: Ability[] = [
  {
    id: 'phoenix-ascendant',
    name: 'Phoenix Ascendant',
    flavorText: 'They\'d tell stories in hushed tones of your companion\'s last stand--if any of them were left to tell the tale.',
    actionType: 'freeTriggered',
    essenceCost: 11,
    keywords: ['Area', 'Companion', 'Magic'],
    distance: 'Special',
    target: 'Special',
    trigger: 'After taking damage, your companion is dead or dying.',
    powerRoll: {
      characteristic: 'might',
      tier1: '20 cold, fire, lightning, or sonic damage',
      tier2: '25 cold, fire, lightning, or sonic damage',
      tier3: '30 cold, fire, lightning, or sonic damage',
    },
    effect: 'Your companion makes a power roll, which affects each enemy in a 5 burst. Your companion dies. If you are dead and in the area, you are restored to life with 1 Stamina. You and each ally in the area can spend 1 or 2 Recoveries.',
  },
  {
    id: 'wild-hunt',
    name: 'Wild Hunt',
    flavorText: 'Your companion summons a ravening pack of spectral ancestors to devour your foes.',
    actionType: 'action',
    essenceCost: 11,
    keywords: ['Area', 'Companion', 'Magic'],
    distance: '5 cube within 20',
    target: 'Each enemy in the area',
    powerRoll: {
      characteristic: 'might',
      tier1: '9 damage',
      tier2: '13 damage',
      tier3: '18 damage',
    },
    effect: 'Your companion summons an area of ghostly creatures that resemble your companion. The area can appear in and move through creatures, objects, and terrain. Once summoned, it moves in a straight line toward your companion until its center is in the center of your companion\'s space, and it then continues moving in a straight line until it is up to 20 squares away. Any enemy inside the area at any point during its movement is targeted once by the power roll. The body of any creature killed by this ability is dragged off to the Primordial Chaos.',
  },
];

// ============================================================
// TRIGGERED ACTIONS (Wild Nature-specific)
// ============================================================

export const beastheartTriggeredActions: Ability[] = [
  {
    id: 'dont-worry-im-here',
    name: 'Don\'t Worry, I\'m Here',
    flavorText: 'You siphon away the pain and endure it yourself.',
    actionType: 'triggered',
    keywords: ['Magic'],
    distance: 'Melee 1',
    target: 'One ally',
    trigger: 'An adjacent ally takes damage.',
    effect: 'The triggering damage is halved for the ally. Spend 1 Ferocity: You spend one of your Recoveries; the ally regains the Stamina instead of you.',
  },
  {
    id: 'while-no-ones-looking',
    name: 'While No One\'s Looking',
    flavorText: 'While everyone\'s eyes are drawn to your foe, you take the opportunity to blend into the scenery.',
    actionType: 'triggered',
    keywords: ['Magic'],
    distance: 'Self',
    target: 'Self',
    trigger: 'An enemy deals damage to a creature other than you.',
    effect: 'You become invisible, use the Hide maneuver, and move up to a number of squares equal to your Intuition score, in any order. You remain invisible until the end of your next turn or you deal damage. Spend 1 Ferocity: The distance of your move is doubled, and it ignores difficult terrain.',
  },
  {
    id: 'swat-away',
    name: 'Swat Away',
    flavorText: 'You bat away an attacker.',
    actionType: 'triggered',
    keywords: ['Melee', 'Weapon'],
    distance: 'Melee 1',
    target: 'One enemy',
    trigger: 'An enemy adjacent to you deals damage to a creature.',
    effect: 'You deal damage equal to your Might score to the target and push them up to a number of squares equal to your Might score + 1. If this movement causes the enemy to move farther from the creature they damaged, the triggering damage is halved. Spend 1 Ferocity: You can push the enemy twice the distance.',
  },
  {
    id: 'self-immolate',
    name: 'Self-Immolate',
    flavorText: 'You vanish in a sizzling burst of elemental energy.',
    actionType: 'triggered',
    keywords: ['Magic'],
    distance: 'Self',
    target: 'Self',
    trigger: 'You take damage.',
    effect: 'You teleport up to 5 spaces and halve the triggering damage. Spend 1 Ferocity: When you teleport in this way, each enemy adjacent to your original position takes cold, fire, lightning, or sonic damage equal to your Intuition score.',
  },
];

// ============================================================
// COMBINED EXPORTS
// ============================================================

// All core Beastheart abilities (non-wild nature-specific)
export const beastheartAbilities: Ability[] = [
  ...beastheartSignatureAbilities,
  ...beastheartThreeFerocityAbilities,
  ...beastheartFiveFerocityAbilities,
  ...beastheartSevenFerocityAbilities,
  ...beastheartNineFerocityAbilities,
  ...beastheartElevenFerocityAbilities,
];

// Helper functions
export const getBeastheartAbilityById = (id: string): Ability | undefined => {
  return beastheartAbilities.find(a => a.id === id);
};

export const getBeastheartAbilitiesByCost = (maxCost: number): Ability[] => {
  return beastheartAbilities.filter(a => (a.essenceCost || 0) <= maxCost);
};

export const getBeastheartSignatureAbilities = (): Ability[] => {
  return beastheartSignatureAbilities;
};

export const getBeastheartHeroicAbilities = (): Ability[] => {
  return beastheartAbilities.filter(a => a.essenceCost && a.essenceCost > 0);
};

// Get wild nature-specific abilities by cost
export const getWildNatureAbilitiesByCost = (wildNature: string, cost: 5 | 9 | 11): Ability[] => {
  switch (wildNature) {
    case 'guardian':
      if (cost === 5) return guardianFiveFerocityAbilities;
      if (cost === 9) return guardianNineFerocityAbilities;
      if (cost === 11) return guardianElevenFerocityAbilities;
      break;
    case 'prowler':
      if (cost === 5) return prowlerFiveFerocityAbilities;
      if (cost === 9) return prowlerNineFerocityAbilities;
      if (cost === 11) return prowlerElevenFerocityAbilities;
      break;
    case 'punisher':
      if (cost === 5) return punisherFiveFerocityAbilities;
      if (cost === 9) return punisherNineFerocityAbilities;
      if (cost === 11) return punisherElevenFerocityAbilities;
      break;
    case 'spark':
      if (cost === 5) return sparkFiveFerocityAbilities;
      if (cost === 9) return sparkNineFerocityAbilities;
      if (cost === 11) return sparkElevenFerocityAbilities;
      break;
  }
  return [];
};

// Get triggered action for wild nature
export const getWildNatureTriggeredAction = (wildNature: string): Ability | undefined => {
  switch (wildNature) {
    case 'guardian':
      return beastheartTriggeredActions.find(a => a.id === 'dont-worry-im-here');
    case 'prowler':
      return beastheartTriggeredActions.find(a => a.id === 'while-no-ones-looking');
    case 'punisher':
      return beastheartTriggeredActions.find(a => a.id === 'swat-away');
    case 'spark':
      return beastheartTriggeredActions.find(a => a.id === 'self-immolate');
  }
  return undefined;
};
