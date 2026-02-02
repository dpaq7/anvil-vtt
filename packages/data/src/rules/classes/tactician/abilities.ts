/**
 * Tactician Class Abilities - Synced with Draw Steel Heroes v1
 * Resource: Focus
 */
import type { Ability } from '@anvil/types';

// ============================================================
// SIGNATURE ABILITIES (No cost, at-will)
// ============================================================

export const tacticianSignatureAbilities: Ability[] = [
  {
    id: 'mark',
    name: 'Mark',
    flavorText: 'You draw your allies\' attention to a specific foe—with devastating effect.',
    actionType: 'maneuver',
    keywords: ['Ranged'],
    distance: 'Ranged 10',
    target: 'One creature',
    effect: 'The target is marked by you until the end of the encounter, until you are dying, or until you use this ability again. You can willingly end your mark on a creature (no action required), and if another tactician marks a creature, your mark on that creature ends. When a creature marked by you is reduced to 0 Stamina, you can use a free triggered action to mark a new target within distance.\n\nYou can initially mark only one creature using this ability, though other tactician abilities allow you to mark additional creatures at the same time. The mastermind tactical doctrine\'s Anticipation feature allows you to target additional creatures with this ability starting at 5th level.\n\nWhile a creature marked by you is within your line of effect, you and allies within your line of effect gain an edge on power rolls made against that creature. Additionally, whenever you or any ally uses an ability to deal rolled damage to a creature marked by you, you can spend 1 focus to gain one of the following benefits as a free triggered action:\n\n- The ability deals extra damage equal to twice your Reason score.\n- The creature dealing the damage can spend a Recovery.\n- The creature dealing the damage can shift up to a number of squares equal to your Reason score.\n- If you damage a creature marked by you with a melee ability, the creature is taunted by you until the end of their next turn.\n\nYou can\'t gain more than one benefit from the same trigger.',
  },
  {
    id: 'strike-now',
    name: 'Strike Now!',
    flavorText: 'Your foe left an opening. You point this out to an ally!',
    actionType: 'action',
    keywords: ['Ranged'],
    distance: 'Ranged 10',
    target: 'One ally',
    effect: 'The target can use a signature ability as a free triggered action.\n\nSpend 5 Focus: You target two allies instead of one.',
  },
];

// ============================================================
// 3-FOCUS ABILITIES
// ============================================================

export const tacticianThreeFocusAbilities: Ability[] = [
  {
    id: 'battle-cry',
    name: 'Battle Cry',
    flavorText: 'You shout a phrase that galvanizes your team.',
    actionType: 'maneuver',
    essenceCost: 3,
    keywords: ['Ranged'],
    distance: 'Ranged 10',
    target: 'Three allies',
    powerRoll: {
      characteristic: 'reason',
      tier1: 'Each target gains 1 surge.',
      tier2: 'Each target gains 2 surges.',
      tier3: 'Each target gains 3 surges.',
    },
    effect: '',
  },
  {
    id: 'concussive-strike',
    name: 'Concussive Strike',
    flavorText: 'Your precise strike leaves your foe struggling to respond.',
    actionType: 'action',
    essenceCost: 3,
    keywords: ['Melee', 'Ranged', 'Strike', 'Weapon'],
    distance: 'Melee 1 or ranged 5',
    target: 'One creature or object',
    powerRoll: {
      characteristic: 'might',
      tier1: '3 + M damage; M < WEAK, dazed (save ends)',
      tier2: '5 + M damage; M < AVERAGE, dazed (save ends)',
      tier3: '8 + M damage; M < STRONG, dazed (save ends)',
    },
    effect: '',
  },
  {
    id: 'inspiring-strike',
    name: 'Inspiring Strike',
    flavorText: 'Your attack gives an ally hope.',
    actionType: 'action',
    essenceCost: 3,
    keywords: ['Melee', 'Ranged', 'Strike', 'Weapon'],
    distance: 'Melee 1 or ranged 5',
    target: 'One creature or object',
    powerRoll: {
      characteristic: 'might',
      tier1: '3 + M damage; you or one ally within 10 squares of you can spend a Recovery',
      tier2: '5 + M damage; you or one ally within 10 squares of you can spend a Recovery',
      tier3: '8 + M damage; you and one ally within 10 squares of you can spend a Recovery, and each of you gains an edge on the next ability roll you make during the encounter',
    },
    effect: '',
  },
  {
    id: 'squad-forward',
    name: 'Squad! Forward!',
    flavorText: 'On your command, you and your allies force back the enemy line.',
    actionType: 'maneuver',
    essenceCost: 3,
    keywords: ['Ranged'],
    distance: 'Ranged 10',
    target: 'Self and two allies',
    effect: 'Each target can move up to their speed.',
  },
];

// ============================================================
// 5-FOCUS ABILITIES
// ============================================================

export const tacticianFiveFocusAbilities: Ability[] = [
  {
    id: 'hammer-and-anvil',
    name: 'Hammer and Anvil',
    flavorText: '"Let\'s not argue about who\'s the hammer and who\'s the anvil!"',
    actionType: 'action',
    essenceCost: 5,
    keywords: ['Melee', 'Ranged', 'Strike', 'Weapon'],
    distance: 'Melee 1 or ranged 5',
    target: 'One creature or object',
    powerRoll: {
      characteristic: 'might',
      tier1: '5 + M damage; one ally within 10 squares of you can use a strike signature ability against the target as a free triggered action',
      tier2: '9 + M damage; one ally within 10 squares of you can use a strike signature ability that gains an edge against the target as a free triggered action',
      tier3: '12 + M damage; two allies within 10 squares of you can each use a strike signature ability that gains an edge against the target as a free triggered action',
    },
    effect: 'If the target is reduced to 0 Stamina before one or both chosen allies has made their strike, the ally or allies can pick a different target.',
  },
  {
    id: 'mind-game',
    name: 'Mind Game',
    flavorText: 'Your attack demoralizes your foe. Your allies begin to think you can win.',
    actionType: 'action',
    essenceCost: 5,
    keywords: ['Melee', 'Ranged', 'Strike', 'Weapon'],
    distance: 'Melee 1 or ranged 5',
    target: 'One creature or object',
    powerRoll: {
      characteristic: 'might',
      tier1: '4 + M damage; R < WEAK, weakened (save ends)',
      tier2: '6 + M damage; R < AVERAGE, weakened (save ends)',
      tier3: '10 + M damage; R < STRONG, weakened (save ends)',
    },
    effect: 'You mark the target. Before the start of your next turn, the first time any ally deals damage to any target marked by you, that ally can spend a Recovery.',
  },
  {
    id: 'now',
    name: 'Now!',
    flavorText: 'Your allies wait for your command—then unleash death!',
    actionType: 'maneuver',
    essenceCost: 5,
    keywords: ['Ranged'],
    distance: 'Ranged 10',
    target: 'Three allies',
    effect: 'Each target can make a free strike.',
  },
  {
    id: 'this-is-what-we-planned-for',
    name: 'This Is What We Planned For',
    flavorText: 'All those coordination drills you made them do finally pay off.',
    actionType: 'maneuver',
    essenceCost: 5,
    keywords: ['Ranged'],
    distance: 'Ranged 10',
    target: 'Two allies',
    effect: 'Each target who hasn\'t acted yet this combat round can take their turn in any order immediately after yours.',
  },
];

// ============================================================
// 7-FOCUS ABILITIES
// ============================================================

export const tacticianSevenFocusAbilities: Ability[] = [
  {
    id: 'frontal-assault',
    name: 'Frontal Assault',
    flavorText: 'The purpose of a charge is to break their morale and force a retreat.',
    actionType: 'maneuver',
    essenceCost: 7,
    keywords: [],
    distance: 'Self',
    target: 'Self',
    effect: 'Until the end of the encounter or until you are dying, the first time on a turn that you or any ally deals damage to a target marked by you, the creature who dealt the damage can push the target up to 2 squares and then shift up to 2 squares. Additionally, any ally using the Charge main action to target a creature marked by you can use a melee strike signature ability or a melee strike heroic ability instead of a melee free strike.',
  },
  {
    id: 'hit-em-hard',
    name: 'Hit \'Em Hard!',
    flavorText: 'Your allies see the advantages in attacking the targets you select.',
    actionType: 'maneuver',
    essenceCost: 7,
    keywords: [],
    distance: 'Self',
    target: 'Self',
    effect: 'Until the end of the encounter or until you are dying, whenever you or any ally deals damage to a target marked by you, that creature gains 2 surges, which they can use immediately.',
  },
  {
    id: 'rout',
    name: 'Rout',
    flavorText: 'The tide begins to turn.',
    actionType: 'maneuver',
    essenceCost: 7,
    keywords: [],
    distance: 'Self',
    target: 'Self',
    effect: 'Until the end of the encounter or until you are dying, whenever you or any ally deals damage to a target marked by you who has R < AVERAGE, the target is frightened of the creature who dealt the damage (save ends).',
  },
  {
    id: 'stay-strong-and-focus',
    name: 'Stay Strong and Focus!',
    flavorText: '"We can do this! Keep faith and hold fast!"',
    actionType: 'maneuver',
    essenceCost: 7,
    keywords: [],
    distance: 'Self',
    target: 'Self',
    effect: 'Until the end of the encounter or until you are dying, whenever you or any ally deals damage to a target marked by you, the creature who dealt the damage can spend a Recovery.',
  },
];

// ============================================================
// 9-FOCUS ABILITIES
// ============================================================

export const tacticianNineFocusAbilities: Ability[] = [
  {
    id: 'squad-gear-check',
    name: 'Squad! Gear Check!',
    flavorText: 'You distract a foe while your allies secure their defensive gear.',
    actionType: 'action',
    essenceCost: 9,
    keywords: ['Melee', 'Strike', 'Weapon'],
    distance: 'Melee 1',
    target: 'One creature',
    powerRoll: {
      characteristic: 'might',
      tier1: '9 + M damage',
      tier2: '13 + M damage',
      tier3: '18 + M damage',
    },
    effect: 'You and each ally adjacent to the target gain 10 temporary Stamina.',
  },
  {
    id: 'squad-remember-your-training',
    name: 'Squad! Remember Your Training!',
    flavorText: 'You remind your allies how to best use their gear.',
    actionType: 'action',
    essenceCost: 9,
    keywords: ['Ranged'],
    distance: 'Ranged 10',
    target: 'Self and two allies',
    effect: 'Each target gains 1 surge and can use a signature ability that has a double edge.',
  },
  {
    id: 'win-this-day',
    name: 'Win This Day!',
    flavorText: 'You inspire your allies to recover and gather their strength.',
    actionType: 'action',
    essenceCost: 9,
    keywords: ['Area'],
    distance: '3 burst',
    target: 'Self and each ally in the area',
    effect: 'Each target gains 2 surges. Additionally, they can spend a Recovery, remove any conditions or effects on them, and stand up if they are prone.',
  },
  {
    id: 'youve-still-got-something-left',
    name: 'You\'ve Still Got Something Left',
    flavorText: 'You push an ally to use a heroic ability sooner than they otherwise would.',
    actionType: 'action',
    essenceCost: 9,
    keywords: ['Ranged'],
    distance: 'Ranged 10',
    target: 'One ally',
    effect: 'The target uses a heroic ability with the Strike keyword as a free triggered action, and deals extra damage with that ability equal to your Reason score. The ability has its Heroic Resource cost reduced by 1 + your Reason score (minimum cost 0).',
  },
];

// ============================================================
// 11-FOCUS ABILITIES
// ============================================================

export const tacticianElevenFocusAbilities: Ability[] = [
  {
    id: 'go-now-and-speed-well',
    name: 'Go Now and Speed Well',
    flavorText: 'You direct an attack to strike true.',
    actionType: 'action',
    essenceCost: 11,
    keywords: ['Ranged'],
    distance: 'Ranged 10',
    target: 'Self or one ally',
    effect: 'The target gains 2 surges and can use a signature or heroic ability as a free triggered action. The ability has a double edge on the power roll, ignores damage immunity, and increases the potency of any potency effects by 1.',
  },
  {
    id: 'finish-them',
    name: 'Finish Them!',
    flavorText: 'You point out an opening to your ally so they can land a killing blow.',
    actionType: 'freeTriggered',
    essenceCost: 11,
    keywords: ['Ranged'],
    distance: 'Ranged 10',
    target: 'One creature',
    trigger: 'The target is not a leader or solo creature, and becomes winded.',
    effect: 'The target is killed. Additionally, the creature who caused the target to be winded can spend a Recovery.',
  },
  {
    id: 'floodgates-open',
    name: 'Floodgates Open',
    flavorText: 'You direct your squad to strike in unison and with devastating effect.',
    actionType: 'action',
    essenceCost: 11,
    keywords: ['Ranged'],
    distance: 'Ranged 10',
    target: 'Three allies',
    effect: 'Each target gains 1 surge and can use a signature ability as a free triggered action. That ability gains an edge on the power roll and increases the potency of any potency effects by 1.',
  },
  {
    id: 'ill-open-and-youll-close',
    name: 'I\'ll Open and You\'ll Close',
    flavorText: 'You create an opening for an ally.',
    actionType: 'action',
    essenceCost: 11,
    keywords: ['Melee', 'Ranged', 'Strike', 'Weapon'],
    distance: 'Melee 1 or ranged 5',
    target: 'One creature',
    powerRoll: {
      characteristic: 'might',
      tier1: '6 + M damage',
      tier2: '10 + M damage',
      tier3: '14 + M damage',
    },
    effect: 'One ally within 10 squares of you can use a heroic ability against the target as a free triggered action without spending any of their Heroic Resource, as long as they have enough Heroic Resource to pay for the ability. If the target is reduced to 0 Stamina before the chosen ally has used their ability, the ally can pick a different target.',
  },
];

// ============================================================
// DOCTRINE TRIGGERED ACTIONS
// ============================================================

export const tacticianTriggeredActions: Ability[] = [
  {
    id: 'advanced-tactics',
    name: 'Advanced Tactics',
    flavorText: 'Your leadership aids an ally.',
    actionType: 'triggered',
    keywords: ['Ranged'],
    distance: 'Ranged 10',
    target: 'One ally',
    trigger: 'The target deals damage to another creature.',
    effect: 'The target gains 2 surges, which they can use on the triggering damage.\n\nSpend 1 Focus: If the damage has any potency effect associated with it, the potency is increased by 1.',
  },
  {
    id: 'overwatch',
    name: 'Overwatch',
    flavorText: 'Under your direction, an ally waits for just the right moment to strike.',
    actionType: 'triggered',
    keywords: ['Ranged'],
    distance: 'Ranged 10',
    target: 'One creature',
    trigger: 'The target moves.',
    effect: 'At any time during the target\'s movement, one ally can make a free strike against them.\n\nSpend 1 Focus: If the target has R < AVERAGE, they are slowed (EoT).',
  },
  {
    id: 'parry',
    name: 'Parry',
    flavorText: 'Your quick reflexes cost an enemy the precision they seek.',
    actionType: 'triggered',
    keywords: ['Melee', 'Weapon'],
    distance: 'Melee 2',
    target: 'Self or one ally',
    trigger: 'A creature deals damage to the target.',
    effect: 'You can shift 1 square. If the target is you, or if you end this shift adjacent to the target, the target takes half the damage. If the damage has any potency effect associated with it, the potency is decreased by 1.\n\nSpend 1 Focus: This ability\'s distance becomes Melee 1 + your Reason score, and you can shift up to a number of squares equal to your Reason score instead of 1 square.',
  },
];

// ============================================================
// COMBINED EXPORTS
// ============================================================

// All core Tactician abilities
export const tacticianAbilities: Ability[] = [
  ...tacticianSignatureAbilities,
  ...tacticianThreeFocusAbilities,
  ...tacticianFiveFocusAbilities,
  ...tacticianSevenFocusAbilities,
  ...tacticianNineFocusAbilities,
  ...tacticianElevenFocusAbilities,
];

// Helper functions
export const getAbilityById = (id: string): Ability | undefined => {
  return tacticianAbilities.find(a => a.id === id);
};

export const getAbilitiesByCost = (maxCost: number): Ability[] => {
  return tacticianAbilities.filter(a => (a.essenceCost || 0) <= maxCost);
};

export const getSignatureAbilities = (): Ability[] => {
  return tacticianSignatureAbilities;
};

export const getHeroicAbilities = (): Ability[] => {
  return tacticianAbilities.filter(a => a.essenceCost && a.essenceCost > 0);
};

// Get doctrine triggered action
export const getDoctrineTriggeredAction = (doctrine: string): Ability | undefined => {
  switch (doctrine) {
    case 'insurgent':
      return tacticianTriggeredActions.find(a => a.id === 'advanced-tactics');
    case 'mastermind':
      return tacticianTriggeredActions.find(a => a.id === 'overwatch');
    case 'vanguard':
      return tacticianTriggeredActions.find(a => a.id === 'parry');
  }
  return undefined;
};
