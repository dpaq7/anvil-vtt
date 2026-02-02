import type { MinionTemplate, FixtureTemplate, Portfolio } from '@anvil/types';

// ============================================================
// FEY PORTFOLIO - SRD Section 5.3
// Circle of Spring (Feybright)
// ============================================================

// Signature Minions (1 Essence, Summon 3)

const nixieSoakreed: MinionTemplate = {
  id: 'fey_nixie_soakreed',
  name: 'Nixie Soakreed',
  essenceCost: 1,
  minionsPerSummon: 1, // Signature: 1 minion per essence spent
  size: '1T',
  speed: 5,
  stamina: 1,
  stability: 0,
  freeStrike: 1,
  characteristics: {
    might: -2,
    agility: -1,
    reason: 0,
    intuition: 2,
    presence: 1,
  },
  role: 'controller',
  keywords: ['Fey', 'Aquatic'],
  immunities: [],
  weaknesses: [],
  movementModes: ['Swim'],
  freeStrikeDamageType: 'cold',
  traits: [
    {
      name: 'Water Weird',
      description: 'As a maneuver, a Nixie Soakreed can teleport to any square of water within 10 squares.',
    },
    {
      name: 'Soaking Bog',
      description:
        'Enemies within 2 squares of a Nixie Soakreed are slowed. This aura stacks with other Soakreeds.',
    },
  ],
};

const pixieBellringer: MinionTemplate = {
  id: 'fey_pixie_bellringer',
  name: 'Pixie Bellringer',
  essenceCost: 1,
  minionsPerSummon: 1, // Signature: 1 minion per essence spent
  size: '1T',
  speed: 5,
  stamina: 2,
  stability: 0,
  freeStrike: 1,
  characteristics: {
    might: -3,
    agility: 1,
    reason: 0,
    intuition: 0,
    presence: 2,
  },
  role: 'support',
  keywords: ['Fey'],
  immunities: [],
  weaknesses: [],
  movementModes: ['Fly, hover'],
  freeStrikeDamageType: 'psychic',
  traits: [
    {
      name: 'Ringing Strike',
      description:
        'When a Pixie Bellringer deals damage with a free strike, the next ally to attack that target before the end of the round gains an edge on the attack.',
    },
    {
      name: 'Fairy Chime',
      description:
        'Allies within 2 squares of a Pixie Bellringer gain +1 to saving throws. Enemies within 2 squares take -1 to saving throws.',
    },
  ],
};

const spriteDandeknight: MinionTemplate = {
  id: 'fey_sprite_dandeknight',
  name: 'Sprite Dandeknight',
  essenceCost: 1,
  minionsPerSummon: 1, // Signature: 1 minion per essence spent
  size: '1T',
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
  keywords: ['Fey'],
  immunities: [],
  weaknesses: [],
  movementModes: ['Fly'],
  freeStrikeDamageType: 'varies',
  traits: [
    {
      name: 'Magic Strike',
      description:
        'When a Sprite Dandeknight makes a free strike, choose a damage type: fire, cold, lightning, or acid. The strike deals that damage type.',
    },
    {
      name: 'Staccato',
      description: 'A Sprite Dandeknight can make 2 free strikes instead of 1 when taking the Free Strike action.',
    },
  ],
};

// 3-Essence Minions (Summon 2)

const pixieHydrain: MinionTemplate = {
  id: 'fey_pixie_hydrain',
  name: 'Pixie Hydrain',
  essenceCost: 3,
  minionsPerSummon: 2,
  size: '1T',
  speed: 5,
  stamina: 5,
  stability: 0,
  freeStrike: 5,
  characteristics: {
    might: -3,
    agility: 0,
    reason: 1,
    intuition: 0,
    presence: 2,
  },
  role: 'artillery',
  keywords: ['Fey'],
  immunities: [{ type: 'acid', value: undefined }],
  weaknesses: [],
  movementModes: ['Fly, hover'],
  freeStrikeDamageType: 'acid',
  traits: [
    {
      name: 'Rain Aura',
      description:
        'When an ally within 3 squares of a Pixie Hydrain takes damage, that ally can spend a recovery or cleanse one condition as a free triggered action.',
    },
  ],
  signatureAbility: {
    id: 'pixie_hydrain_rain',
    name: 'Rain',
    actionType: 'action',
    keywords: ['Magic', 'Ranged'],
    distance: 'Ranged 10',
    target: 'One creature',
    powerRoll: {
      characteristic: 'reason',
      tier1: '3 acid damage; weakened (EoT)',
      tier2: '6 acid damage; weakened (save ends)',
      tier3: '10 acid damage; weakened (save ends) and slowed (save ends)',
    },
    effect: '',
  },
};

const spriteOrchiguard: MinionTemplate = {
  id: 'fey_sprite_orchiguard',
  name: 'Sprite Orchiguard',
  essenceCost: 3,
  minionsPerSummon: 2,
  size: '1S',
  speed: 6,
  stamina: 8,
  stability: 2,
  freeStrike: 4,
  characteristics: {
    might: 2,
    agility: 0,
    reason: -1,
    intuition: -1,
    presence: -1,
  },
  role: 'defender',
  keywords: ['Fey'],
  immunities: [],
  weaknesses: [],
  movementModes: ['Fly'],
  freeStrikeDamageType: 'untyped',
  traits: [
    {
      name: 'Fairy Guard',
      description:
        'When an adjacent ally would take damage, a Sprite Orchiguard can use a triggered action to take half of that damage instead.',
    },
    {
      name: 'Protective Bloom',
      description: 'Allies adjacent to a Sprite Orchiguard have concealment.',
    },
  ],
};

const pixieLoftlilly: MinionTemplate = {
  id: 'fey_pixie_loftlilly',
  name: 'Pixie Loftlilly',
  essenceCost: 3,
  minionsPerSummon: 2,
  size: '1T',
  speed: 5,
  stamina: 5,
  stability: 0,
  freeStrike: 4,
  characteristics: {
    might: -2,
    agility: 1,
    reason: 0,
    intuition: 0,
    presence: 2,
  },
  role: 'controller',
  keywords: ['Fey'],
  immunities: [{ type: 'poison', value: undefined }],
  weaknesses: [],
  movementModes: ['Fly, hover'],
  freeStrikeDamageType: 'poison',
  traits: [
    {
      name: 'Floating Toxins',
      description:
        'Enemies within 3 squares of a Pixie Loftlilly are lifted slightly off the ground (floating). Floating enemies cannot shift, are pushed or pulled an additional 2 squares by forced movement, and have a bane on attacks.',
    },
  ],
};

// 5-Essence Minions (Summon 3)

const nixieHemloche: MinionTemplate = {
  id: 'fey_nixie_hemloche',
  name: 'Nixie Hemloche',
  essenceCost: 5,
  minionsPerSummon: 3,
  size: '1T',
  speed: 6,
  stamina: [4, 4, 4],
  stability: 0,
  freeStrike: 3,
  characteristics: {
    might: -2,
    agility: 0,
    reason: 1,
    intuition: 3,
    presence: 2,
  },
  role: 'hexer',
  keywords: ['Fey', 'Aquatic'],
  immunities: [],
  weaknesses: [],
  movementModes: ['Swim'],
  freeStrikeDamageType: 'lightning',
  traits: [
    {
      name: 'Whirling Waves',
      description:
        'Squares within 3 squares of a Nixie Hemloche are difficult terrain for enemies. When an enemy starts their turn in this aura, they are slid 3 squares in a direction of the summoner\'s choice.',
    },
  ],
};

const pixieRosenthall: MinionTemplate = {
  id: 'fey_pixie_rosenthall',
  name: 'Pixie Rosenthall',
  essenceCost: 5,
  minionsPerSummon: 3,
  size: '2',
  speed: 6,
  stamina: [5, 5, 5],
  stability: 1,
  freeStrike: 3,
  characteristics: {
    might: 0,
    agility: 2,
    reason: 4,
    intuition: 0,
    presence: 3,
  },
  role: 'harrier',
  keywords: ['Fey', 'Swarm'],
  immunities: [],
  weaknesses: [],
  movementModes: ['Fly, hover'],
  freeStrikeDamageType: 'untyped',
  traits: [
    {
      name: 'Swarm',
      description:
        'A Pixie Rosenthall can occupy the same space as an enemy. While doing so, that enemy takes 2 damage at the start of each of their turns.',
    },
  ],
  signatureAbility: {
    id: 'pixie_rosenthall_symphony',
    name: 'Symphony',
    actionType: 'action',
    keywords: ['Magic', 'Melee'],
    distance: 'Reach 1',
    target: 'One creature',
    powerRoll: {
      characteristic: 'reason',
      tier1: '4 damage; pull 1',
      tier2: '8 damage; pull 2 and bleeding (save ends)',
      tier3: '13 damage; pull 3, bleeding (save ends), and the target cannot shift (save ends)',
    },
    effect: '',
  },
};

const spriteFoxglow: MinionTemplate = {
  id: 'fey_sprite_foxglow',
  name: 'Sprite Foxglow',
  essenceCost: 5,
  minionsPerSummon: 3,
  size: '1T',
  speed: 8,
  stamina: [5, 5, 5],
  stability: 0,
  freeStrike: 4,
  characteristics: {
    might: -1,
    agility: 3,
    reason: 0,
    intuition: 1,
    presence: 2,
  },
  role: 'ambusher',
  keywords: ['Fey'],
  immunities: [{ type: 'fire', value: undefined }],
  weaknesses: [],
  movementModes: ['Fly'],
  freeStrikeDamageType: 'fire',
  traits: [
    {
      name: 'Flash Strike',
      description:
        'When a Sprite Foxglow makes a free strike while hidden, the target is dazed until the end of their next turn.',
    },
    {
      name: 'Quiet',
      description:
        'A Sprite Foxglow creates an aura of silence within 3 squares. Creatures searching for hidden creatures within this aura have a bane on their tests.',
    },
  ],
};

// 7-Essence Minions (Summon 2)

const nixieCorallia: MinionTemplate = {
  id: 'fey_nixie_corallia',
  name: 'Nixie Corallia',
  essenceCost: 7,
  minionsPerSummon: 2,
  size: '1T',
  speed: 6,
  stamina: [17, 17],
  stability: 0,
  freeStrike: 7,
  characteristics: {
    might: -2,
    agility: 3,
    reason: 3,
    intuition: 4,
    presence: 1,
  },
  role: 'support',
  keywords: ['Fey', 'Aquatic'],
  immunities: [{ type: 'lightning', value: undefined }],
  weaknesses: [],
  movementModes: ['Swim'],
  freeStrikeDamageType: 'lightning',
  traits: [
    {
      name: 'Seafoam Pool',
      description:
        'Squares within 5 squares of a Nixie Corallia are considered purified terrain (difficult terrain and hazards are negated). Allies within this aura can cleanse one condition affecting them at the start of each of their turns.',
    },
  ],
};

const pixieBelladonix: MinionTemplate = {
  id: 'fey_pixie_belladonix',
  name: 'Pixie Belladonix',
  essenceCost: 7,
  minionsPerSummon: 2,
  size: '1T',
  speed: 6,
  stamina: [16, 16],
  stability: 0,
  freeStrike: 8,
  characteristics: {
    might: -2,
    agility: 2,
    reason: 4,
    intuition: 0,
    presence: 4,
  },
  role: 'artillery',
  keywords: ['Fey'],
  immunities: [{ type: 'poison', value: undefined }],
  weaknesses: [],
  movementModes: ['Fly, hover'],
  freeStrikeDamageType: 'poison',
  traits: [
    {
      name: 'Toxic Presence',
      description:
        'When a restrained creature is within 5 squares of a Pixie Belladonix, that creature treats all other creatures as enemies (cannot distinguish friend from foe).',
    },
  ],
  signatureAbility: {
    id: 'pixie_belladonix_thorn',
    name: 'Thorn',
    actionType: 'action',
    keywords: ['Magic', 'Ranged'],
    distance: 'Ranged 10',
    target: 'One creature',
    powerRoll: {
      characteristic: 'reason',
      tier1: '6 poison damage; slowed (EoT)',
      tier2: '12 poison damage; restrained (EoT)',
      tier3: '18 poison damage; restrained (save ends)',
    },
    effect: '',
  },
};

const spriteOlyender: MinionTemplate = {
  id: 'fey_sprite_olyender',
  name: 'Sprite Olyender',
  essenceCost: 7,
  minionsPerSummon: 2,
  size: '1T',
  speed: 6,
  stamina: [17, 17],
  stability: 0,
  freeStrike: 8,
  characteristics: {
    might: 4,
    agility: 3,
    reason: 0,
    intuition: 1,
    presence: 2,
  },
  role: 'brute',
  keywords: ['Fey'],
  immunities: [],
  weaknesses: [],
  movementModes: ['Fly'],
  freeStrikeDamageType: 'untyped',
  traits: [
    {
      name: "Warrior's Toss",
      description:
        'When a Sprite Olyender makes a free strike, the target is pushed 4 squares and knocked prone.',
    },
    {
      name: 'Use Their Might',
      description:
        'For purposes of grabbing, pushing, and other physics-based interactions, a Sprite Olyender counts as size 2 instead of size 1T.',
    },
  ],
};

// Glade Pond Fixture
const gladePond: FixtureTemplate = {
  id: 'fixture_glade_pond',
  name: 'Glade Pond',
  portfolioType: 'fey',
  role: 'Hazard Ambusher',
  flavorText: 'The vibrant waters of Arcadia pour through a hole in reality and pool into a verdant cup of paradise. As the pond babbles, it causes the surrounding flora to grow and provides the fey places to hide.',
  baseStamina: 20,
  size: 2,
  traits: [
    {
      name: 'Bubbling Boost',
      description:
        'You and each non-minion ally that enters one or more squares within 3 squares of the pond or starts their turn there has their speed increased by 2 until the end of their turn.',
    },
    {
      name: 'Overgrowth',
      description:
        'Each of your fey minions that ends their turn within 3 squares of the pond is hidden until the start of their next turn.',
    },
  ],
  level5Feature: {
    id: 'glade_pond_level5',
    name: 'Garden of Jest',
    description:
      'You can spend a Recovery the first time in a round a creature gains or starts their turn with a condition while you have line of effect to the pond. Alternatively, you can choose to enable an ally who also has line of effect to the pond to spend a Recovery instead.',
    levelRequired: 5,
  },
  level9Features: [
    {
      id: 'glade_pond_level9_size',
      name: 'Size Increase',
      description: 'The pond is now size 3.',
      levelRequired: 9,
    },
    {
      id: 'glade_pond_level9_folly',
      name: 'Folly Field',
      description:
        'Each non-fey enemy that starts their turn within 3 squares of the pond has a -1 penalty to saving throws and resisting potencies until the start of their next turn.',
      levelRequired: 9,
    },
  ],
};

// Complete Fey Portfolio
export const feyPortfolio: Portfolio = {
  type: 'fey',
  signatureMinions: [nixieSoakreed, pixieBellringer, spriteDandeknight],
  unlockedMinions: [
    // 3-Essence
    pixieHydrain,
    spriteOrchiguard,
    pixieLoftlilly,
    // 5-Essence
    nixieHemloche,
    pixieRosenthall,
    spriteFoxglow,
    // 7-Essence
    nixieCorallia,
    pixieBelladonix,
    spriteOlyender,
  ],
  fixture: gladePond,
  champion: null,
};
