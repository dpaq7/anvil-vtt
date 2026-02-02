import type { MinionTemplate, FixtureTemplate, Portfolio } from '@anvil/types';

// =============================================================================
// UNDEAD PORTFOLIO - SRD Section 5.4
// Circle of Graves (Necromancer)
// =============================================================================

// -----------------------------------------------------------------------------
// SIGNATURE MINIONS (1 Essence each)
// -----------------------------------------------------------------------------

const husk: MinionTemplate = {
  id: 'undead_husk',
  name: 'Husk',
  essenceCost: 1,
  minionsPerSummon: 1, // Signature: 1 minion per essence spent
  size: '1M',
  speed: 5,
  stamina: 3,
  stability: 1,
  freeStrike: 1,
  characteristics: {
    might: 2,
    agility: 0,
    reason: -1,
    intuition: -1,
    presence: -1,
  },
  role: 'defender',
  keywords: ['Undead', 'Necropolitan'],
  immunities: [
    { type: 'damage', value: 2 },
    { type: 'corruption', value: undefined },
    { type: 'poison', value: undefined },
  ],
  weaknesses: [],
  movementModes: [],
  freeStrikeDamageType: 'corruption',
  traits: [
    {
      name: 'Rotting Strike',
      description:
        'When a husk makes a melee free strike, the target is slowed (EoT). Potency increases by +1 for each additional husk attacking the same target.',
    },
  ],
};

const skeleton: MinionTemplate = {
  id: 'undead_skeleton',
  name: 'Skeleton',
  essenceCost: 1,
  minionsPerSummon: 1, // Signature: 1 minion per essence spent
  size: '1M',
  speed: 6,
  stamina: 2,
  stability: 0,
  freeStrike: 1,
  characteristics: {
    might: 2,
    agility: 0,
    reason: -1,
    intuition: -1,
    presence: -1,
  },
  role: 'harrier',
  keywords: ['Undead', 'Necropolitan'],
  immunities: [
    { type: 'corruption', value: undefined },
    { type: 'poison', value: undefined },
  ],
  weaknesses: [],
  movementModes: [],
  freeStrikeDamageType: 'untyped',
  traits: [
    {
      name: 'Bonetrops',
      description:
        'When a skeleton is reduced to 0 Stamina, each square they occupied becomes difficult terrain. Creatures who enter the area take 2 damage.',
    },
  ],
};

const shrieker: MinionTemplate = {
  id: 'undead_shrieker',
  name: 'Shrieker',
  essenceCost: 1,
  minionsPerSummon: 1, // Signature: 1 minion per essence spent
  size: '1M',
  speed: 4,
  stamina: 1,
  stability: 0,
  freeStrike: 2,
  characteristics: {
    might: -2,
    agility: -2,
    reason: 0,
    intuition: 0,
    presence: 2,
  },
  role: 'artillery',
  keywords: ['Undead', 'Necropolitan'],
  immunities: [
    { type: 'corruption', value: undefined },
    { type: 'poison', value: undefined },
  ],
  weaknesses: [],
  movementModes: [],
  freeStrikeDamageType: 'sonic',
  traits: [
    {
      name: 'Ranged Free Strikes',
      description: 'A shrieker can make free strikes at range 12.',
    },
    {
      name: 'Shrill Alarm',
      description: 'Enemies within 2 squares of a shrieker cannot Hide.',
    },
  ],
};

// -----------------------------------------------------------------------------
// 3-ESSENCE MINIONS (Summon 2)
// -----------------------------------------------------------------------------

const graveKnight: MinionTemplate = {
  id: 'undead_grave_knight',
  name: 'Grave Knight',
  essenceCost: 3,
  minionsPerSummon: 2,
  size: '1M',
  speed: 6,
  stamina: 6,
  stability: 1,
  freeStrike: 5,
  characteristics: {
    might: 2,
    agility: 1,
    reason: 0,
    intuition: 0,
    presence: 1,
  },
  role: 'brute',
  keywords: ['Undead', 'Necropolitan'],
  immunities: [
    { type: 'corruption', value: undefined },
    { type: 'poison', value: undefined },
  ],
  weaknesses: [],
  movementModes: [],
  freeStrikeDamageType: 'untyped',
  traits: [
    {
      name: 'To the Grave',
      description: 'When a grave knight is reduced to 0 Stamina, it makes a free strike against an adjacent enemy.',
    },
  ],
  signatureAbility: {
    id: 'grave_knight_strike',
    name: 'Knight Strike',
    actionType: 'action',
    keywords: ['Melee', 'Strike'],
    distance: 'Reach 1',
    target: 'One creature',
    powerRoll: {
      characteristic: 'might',
      tier1: '2 + R corruption damage',
      tier2: '4 + R corruption damage; bleeding (EoT)',
      tier3: '6 + R corruption damage; bleeding (save ends)',
    },
    effect: '',
  },
};

const stalkerShade: MinionTemplate = {
  id: 'undead_stalker_shade',
  name: 'Stalker Shade',
  essenceCost: 3,
  minionsPerSummon: 2,
  size: '1M',
  speed: 5,
  stamina: 6,
  stability: 1,
  freeStrike: 5,
  characteristics: {
    might: -2,
    agility: 1,
    reason: 0,
    intuition: 0,
    presence: 2,
  },
  role: 'ambusher',
  keywords: ['Undead', 'Necropolitan'],
  immunities: [
    { type: 'corruption', value: undefined },
    { type: 'poison', value: undefined },
  ],
  weaknesses: [],
  movementModes: ['Fly'],
  freeStrikeDamageType: 'corruption',
  traits: [
    {
      name: 'Invisible',
      description: 'A stalker shade is invisible until it attacks or takes damage.',
    },
    {
      name: 'Shadow Phasing',
      description: 'A stalker shade can move through solid objects and other creatures. It cannot end its movement in a solid object.',
    },
  ],
};

const zombieLumberer: MinionTemplate = {
  id: 'undead_zombie_lumberer',
  name: 'Zombie Lumberer',
  essenceCost: 3,
  minionsPerSummon: 2,
  size: '2',
  speed: 5,
  stamina: 8,
  stability: 0,
  freeStrike: 1,
  characteristics: {
    might: 2,
    agility: -2,
    reason: 0,
    intuition: 0,
    presence: 1,
  },
  role: 'defender',
  keywords: ['Undead', 'Necropolitan'],
  immunities: [
    { type: 'corruption', value: undefined },
    { type: 'poison', value: undefined },
  ],
  weaknesses: [],
  movementModes: [],
  freeStrikeDamageType: 'untyped',
  traits: [
    {
      name: 'Death Grasp',
      description: 'When a zombie lumberer is reduced to 0 Stamina, creatures it has grabbed are restrained (save ends).',
    },
  ],
  signatureAbility: {
    id: 'zombie_lumberer_clutch',
    name: 'Zombie Clutch',
    actionType: 'action',
    keywords: ['Melee', 'Strike'],
    distance: 'Reach 1',
    target: 'One creature',
    powerRoll: {
      characteristic: 'might',
      tier1: '3 + R damage; grabbed',
      tier2: '5 + R damage; grabbed',
      tier3: '7 + R damage; grabbed and the target takes 3 damage at the start of each of their turns while grabbed',
    },
    effect: '',
  },
};

// -----------------------------------------------------------------------------
// 5-ESSENCE MINIONS (Summon 3)
// -----------------------------------------------------------------------------

const accursedMummy: MinionTemplate = {
  id: 'undead_accursed_mummy',
  name: 'Accursed Mummy',
  essenceCost: 5,
  minionsPerSummon: 3,
  size: '1M',
  speed: 5,
  stamina: [4, 4, 4],
  stability: 2,
  freeStrike: 3,
  characteristics: {
    might: 2,
    agility: -1,
    reason: 1,
    intuition: 3,
    presence: -1,
  },
  role: 'hexer',
  keywords: ['Undead', 'Necropolitan'],
  immunities: [
    { type: 'corruption', value: undefined },
    { type: 'poison', value: undefined },
  ],
  weaknesses: [{ type: 'fire', value: 1 }],
  movementModes: [],
  freeStrikeDamageType: 'poison',
  traits: [
    {
      name: 'Mummy Dust',
      description: 'When an accursed mummy takes damage from an adjacent creature, that creature takes 2 poison damage.',
    },
  ],
  signatureAbility: {
    id: 'accursed_mummy_bindings',
    name: 'Fetid Bindings',
    actionType: 'action',
    keywords: ['Melee', 'Strike'],
    distance: 'Reach 2',
    target: 'One creature',
    powerRoll: {
      characteristic: 'presence',
      tier1: '2d10 + R poison damage',
      tier2: '2d10 + R poison damage; pull 2',
      tier3: '2d10 + R poison damage; pull 3 and weakened (EoT)',
    },
    effect: '',
  },
};

const phaseGhoul: MinionTemplate = {
  id: 'undead_phase_ghoul',
  name: 'Phase Ghoul',
  essenceCost: 5,
  minionsPerSummon: 3,
  size: '1M',
  speed: 5,
  stamina: [5, 5, 5],
  stability: 0,
  freeStrike: 3,
  characteristics: {
    might: 2,
    agility: 3,
    reason: -2,
    intuition: 0,
    presence: 1,
  },
  role: 'harrier',
  keywords: ['Undead', 'Necropolitan'],
  immunities: [
    { type: 'corruption', value: undefined },
    { type: 'poison', value: undefined },
  ],
  weaknesses: [],
  movementModes: ['Teleport'],
  freeStrikeDamageType: 'untyped',
  traits: [],
  signatureAbility: {
    id: 'phase_ghoul_leap',
    name: 'Leaping Strike',
    actionType: 'action',
    keywords: ['Melee', 'Strike'],
    distance: 'Reach 1',
    target: 'One creature',
    powerRoll: {
      characteristic: 'agility',
      tier1: '2d10 + R corruption damage',
      tier2: '2d10 + R corruption damage; prone',
      tier3: '2d10 + R corruption damage; prone. Teleport 5 squares before the attack.',
    },
    effect: 'The phase ghoul can teleport up to 5 squares before making this attack.',
  },
};

const ceaselessMournling: MinionTemplate = {
  id: 'undead_ceaseless_mournling',
  name: 'Ceaseless Mournling',
  essenceCost: 5,
  minionsPerSummon: 3,
  size: '2',
  speed: 4,
  stamina: [4, 4, 4],
  stability: 0,
  freeStrike: 3,
  characteristics: {
    might: 3,
    agility: 2,
    reason: -1,
    intuition: 1,
    presence: -2,
  },
  role: 'controller',
  keywords: ['Undead', 'Necropolitan'],
  immunities: [
    { type: 'corruption', value: undefined },
    { type: 'poison', value: undefined },
  ],
  weaknesses: [],
  movementModes: ['Burrow'],
  freeStrikeDamageType: 'sonic',
  traits: [
    {
      name: 'Always Crying',
      description: 'Enemies within 3 squares of a ceaseless mournling take 2 sonic damage at the start of their turn and cannot shift.',
    },
  ],
};

// -----------------------------------------------------------------------------
// 7-ESSENCE MINIONS (Summon 1 or 2)
// -----------------------------------------------------------------------------

const falseVampire: MinionTemplate = {
  id: 'undead_false_vampire',
  name: 'False Vampire',
  essenceCost: 7,
  minionsPerSummon: 2,
  size: '1L',
  speed: 6,
  stamina: [17, 17],
  stability: 2,
  freeStrike: 8,
  characteristics: {
    might: 4,
    agility: 1,
    reason: 3,
    intuition: 0,
    presence: 0,
  },
  role: 'brute',
  keywords: ['Undead', 'Necropolitan'],
  immunities: [
    { type: 'corruption', value: undefined },
    { type: 'poison', value: undefined },
  ],
  weaknesses: [],
  movementModes: ['Climb'],
  freeStrikeDamageType: 'acid',
  traits: [
    {
      name: 'Bloodthirsty',
      description: 'A false vampire has speed 10 while within 10 squares of a bleeding creature.',
    },
  ],
  signatureAbility: {
    id: 'false_vampire_proboscis',
    name: 'Proboscis Strike',
    actionType: 'action',
    keywords: ['Melee', 'Strike'],
    distance: 'Reach 1',
    target: 'One creature',
    powerRoll: {
      characteristic: 'might',
      tier1: '2d10 + R damage',
      tier2: '2d10 + R damage; restrained (EoT)',
      tier3: '2d10 + R damage; restrained (EoT) and takes 5 damage at the start of their turn while restrained',
    },
    effect: '',
  },
};

const zombieTitan: MinionTemplate = {
  id: 'undead_zombie_titan',
  name: 'Zombie Titan',
  essenceCost: 7,
  minionsPerSummon: 1,
  size: '4',
  speed: 4,
  stamina: 40,
  stability: 0,
  freeStrike: 7,
  characteristics: {
    might: 4,
    agility: -3,
    reason: 0,
    intuition: 2,
    presence: 3,
  },
  role: 'defender',
  keywords: ['Undead', 'Necropolitan'],
  immunities: [
    { type: 'corruption', value: undefined },
    { type: 'poison', value: undefined },
  ],
  weaknesses: [],
  movementModes: [],
  freeStrikeDamageType: 'untyped',
  traits: [
    {
      name: 'Overwhelming Size',
      description: 'The zombie titan can move through spaces occupied by prone enemies, dealing 5 damage to each.',
    },
    {
      name: 'Flesh to Mountains',
      description: 'When a zombie titan is reduced to 0 Stamina, its corpse remains. Enemies in its space are restrained and take 5 crushing damage at the start of each of their turns until they escape.',
    },
  ],
  signatureAbility: {
    id: 'zombie_titan_stomp',
    name: 'Big Stomp',
    actionType: 'action',
    keywords: ['Melee', 'Strike'],
    distance: 'Reach 2',
    target: 'All enemies in a 2-cube',
    powerRoll: {
      characteristic: 'might',
      tier1: '2d10 + R damage',
      tier2: '2d10 + R damage; prone',
      tier3: '2d10 + R damage; prone and cannot stand up (EoT)',
    },
    effect: '',
  },
};

const phantomOfTheRipper: MinionTemplate = {
  id: 'undead_phantom_ripper',
  name: 'Phantom of the Ripper',
  essenceCost: 7,
  minionsPerSummon: 2,
  size: '1M',
  speed: 6,
  stamina: [17, 17],
  stability: 1,
  freeStrike: 8,
  characteristics: {
    might: 0,
    agility: 4,
    reason: 0,
    intuition: 0,
    presence: 3,
  },
  role: 'ambusher',
  keywords: ['Undead', 'Necropolitan'],
  immunities: [
    { type: 'corruption', value: undefined },
    { type: 'poison', value: undefined },
  ],
  weaknesses: [],
  movementModes: ['Fly'],
  freeStrikeDamageType: 'untyped',
  traits: [
    {
      name: 'Ripping Phase',
      description: 'When a phantom of the ripper moves through another creature\'s space, that creature takes 3 damage and has a bane on their next attack roll.',
    },
  ],
  signatureAbility: {
    id: 'phantom_ripper_plunge',
    name: 'Plunge',
    actionType: 'action',
    keywords: ['Melee', 'Strike'],
    distance: 'Reach 1',
    target: 'One creature',
    powerRoll: {
      characteristic: 'agility',
      tier1: '2d10 + R cold damage',
      tier2: '2d10 + R cold damage; slowed (EoT)',
      tier3: '2d10 + R cold damage; slowed (save ends)',
    },
    effect: '',
  },
};

// -----------------------------------------------------------------------------
// FIXTURE: Barrow Gates
// -----------------------------------------------------------------------------

const barrowGates: FixtureTemplate = {
  id: 'fixture_barrow_gates',
  name: 'Barrow Gates',
  portfolioType: 'undead',
  role: 'Fortification Defender',
  flavorText: 'Tall iron gates from the Necropolitan Ruins arise from the earth as wailing spirits swirl around its bars. The undead refuse to stop moving while near the threshold of oblivion.',
  baseStamina: 20, // actual stamina = 20 + level
  size: 2, // becomes 3 at level 9
  traits: [
    {
      name: 'The Bell Tolls',
      description:
        'Each enemy that starts their turn within 3 squares of the gates is I<AVERAGE frightened (EoT) by the gates. The potency increases by 1 for winded enemies.',
    },
    {
      name: 'Undead Dominion',
      description:
        'Each of your undead minions has damage immunity 2 while occupying a space within 3 squares of the gates.',
    },
  ],
  level5Feature: {
    id: 'barrow_gates_level5',
    name: 'Memento Mori',
    description:
      'You gain a surge the first time in a round one of your undead minions unwillingly dies while you have line of effect to the gates. You can choose to give the surge to an ally who also has line of effect to the gates.',
    levelRequired: 5,
  },
  level9Features: [
    {
      id: 'barrow_gates_level9_size',
      name: 'Size Increase',
      description: 'The gates are now size 3.',
      levelRequired: 9,
    },
    {
      id: 'barrow_gates_level9_open',
      name: 'Open the Gates',
      description:
        'You can use Rise! as a free triggered action each time an enemy dies within 3 squares of the gates while you have line of effect to the gates.',
      levelRequired: 9,
    },
  ],
};

// -----------------------------------------------------------------------------
// COMPLETE PORTFOLIO
// -----------------------------------------------------------------------------

export const undeadPortfolio: Portfolio = {
  type: 'undead',
  signatureMinions: [husk, skeleton, shrieker],
  unlockedMinions: [
    // 3-Essence
    graveKnight,
    stalkerShade,
    zombieLumberer,
    // 5-Essence
    accursedMummy,
    phaseGhoul,
    ceaselessMournling,
    // 7-Essence
    falseVampire,
    zombieTitan,
    phantomOfTheRipper,
  ],
  fixture: barrowGates,
  champion: null, // Avatar of Death - Level 8+
};
