import type { MinionTemplate, FixtureTemplate, Portfolio } from '@anvil/types';

// =============================================================================
// DEMON PORTFOLIO - MCDM Summoner v1.0
// Circle of Blight
// =============================================================================

// -----------------------------------------------------------------------------
// SIGNATURE MINIONS (1 Essence each)
// -----------------------------------------------------------------------------

const ensnarer: MinionTemplate = {
  id: 'demon_ensnarer',
  name: 'Ensnarer',
  essenceCost: 1,
  minionsPerSummon: 1,
  size: '1M',
  speed: 5,
  stamina: 2,
  stability: 0,
  freeStrike: 2,
  characteristics: {
    might: 2,
    agility: 0,
    reason: -1,
    intuition: -1,
    presence: -1,
  },
  role: 'brute',
  keywords: ['Abyssal', 'Demon'],
  immunities: [],
  weaknesses: [{ type: 'holy', value: 1 }],
  movementModes: [],
  freeStrikeDamageType: 'untyped',
  traits: [
    {
      name: 'Extended Barbed Strike',
      description:
        "The ensnarer's melee free strikes have a distance of 3 and inflict pull 1. The pull distance increases by 1 for each additional ensnarer striking the same target. Choose the ensnarer that the target is being pulled to before applying forced movement.",
    },
    {
      name: 'Soulsight',
      description: "Each creature adjacent to the ensnarer can't be hidden from them.",
    },
  ],
};

const rasquine: MinionTemplate = {
  id: 'demon_rasquine',
  name: 'Rasquine',
  essenceCost: 1,
  minionsPerSummon: 1,
  size: '1S',
  speed: 4,
  stamina: 2,
  stability: 0,
  freeStrike: 2,
  characteristics: {
    might: -1,
    agility: 0,
    reason: -1,
    intuition: -1,
    presence: 2,
  },
  role: 'ambusher',
  keywords: ['Abyssal', 'Demon'],
  immunities: [],
  weaknesses: [{ type: 'holy', value: 1 }],
  movementModes: ['Teleport'],
  freeStrikeDamageType: 'untyped',
  traits: [
    {
      name: 'Skulker',
      description: 'Once per turn, the rasquine can hide as a free maneuver after teleporting.',
    },
    {
      name: 'Soulsight',
      description: "Each creature adjacent to the rasquine can't be hidden from them.",
    },
  ],
};

const razor: MinionTemplate = {
  id: 'demon_razor',
  name: 'Razor',
  essenceCost: 1,
  minionsPerSummon: 1,
  size: '1M',
  speed: 6,
  stamina: 2,
  stability: 0,
  freeStrike: 1,
  characteristics: {
    might: 0,
    agility: 2,
    reason: -1,
    intuition: -1,
    presence: -1,
  },
  role: 'harrier',
  keywords: ['Abyssal', 'Demon'],
  immunities: [],
  weaknesses: [{ type: 'holy', value: 1 }],
  movementModes: [],
  freeStrikeDamageType: 'untyped',
  traits: [
    {
      name: 'Soulsight',
      description: "Each creature adjacent to the razor can't be hidden from them.",
    },
  ],
};

// -----------------------------------------------------------------------------
// 3-ESSENCE MINIONS (Summon 2)
// -----------------------------------------------------------------------------

const archerSpittlich: MinionTemplate = {
  id: 'demon_archer_spittlich',
  name: 'Archer Spittlich',
  essenceCost: 3,
  minionsPerSummon: 2,
  size: '1S',
  speed: 5,
  stamina: 5,
  stability: 2,
  freeStrike: 5,
  characteristics: {
    might: 0,
    agility: 2,
    reason: -1,
    intuition: -1,
    presence: 0,
  },
  role: 'artillery',
  keywords: ['Abyssal', 'Demon'],
  immunities: [],
  weaknesses: [{ type: 'holy', value: 1 }],
  movementModes: [],
  freeStrikeDamageType: 'poison',
  traits: [
    {
      name: 'Splash Strike',
      description:
        "The spittlich's ranged free strikes have a distance of 10 and deal 2 poison damage to an enemy adjacent to the target. Creatures that take poison damage from this spittlich can't shift until the start of the spittlich's next turn.",
    },
    {
      name: 'Soulsight',
      description: "Each creature adjacent to the spittlich can't be hidden from them.",
    },
  ],
};

const fangedMusilex: MinionTemplate = {
  id: 'demon_fanged_musilex',
  name: 'Fanged Musilex',
  essenceCost: 3,
  minionsPerSummon: 2,
  size: '1L',
  speed: 6,
  stamina: 6,
  stability: 1,
  freeStrike: 5,
  characteristics: {
    might: 2,
    agility: 1,
    reason: -1,
    intuition: -1,
    presence: 0,
  },
  role: 'brute',
  keywords: ['Abyssal', 'Demon'],
  immunities: [],
  weaknesses: [{ type: 'holy', value: 1 }],
  movementModes: [],
  freeStrikeDamageType: 'untyped',
  traits: [
    {
      name: 'Mawful Strike',
      description:
        "The musilex's melee free strikes have a distance of 2 + R and inflict pull 2. The pull distance increases by 2 for each additional musilex striking the same target. Choose the musilex that the target is being pulled to before applying forced movement. If the target is pulled adjacent to the musilex, the musilex either deals an additional 2 damage or grabs them.",
    },
    {
      name: 'Soulsight',
      description: "Each creature adjacent to the musilex can't be hidden from them.",
    },
  ],
};

const twistedBengrul: MinionTemplate = {
  id: 'demon_twisted_bengrul',
  name: 'Twisted Bengrul',
  essenceCost: 3,
  minionsPerSummon: 2,
  size: '1L',
  speed: 5,
  stamina: 5,
  stability: 1,
  freeStrike: 4,
  characteristics: {
    might: 2,
    agility: 1,
    reason: -1,
    intuition: -1,
    presence: 0,
  },
  role: 'hexer',
  keywords: ['Abyssal', 'Demon'],
  immunities: [],
  weaknesses: [{ type: 'holy', value: 1 }],
  movementModes: [],
  freeStrikeDamageType: 'psychic',
  traits: [
    {
      name: 'Soulsight',
      description: "Each creature adjacent to the bengrul can't be hidden from them.",
    },
  ],
};

// -----------------------------------------------------------------------------
// 5-ESSENCE MINIONS (Summon 3)
// -----------------------------------------------------------------------------

const gushingSpewler: MinionTemplate = {
  id: 'demon_gushing_spewler',
  name: 'Gushing Spewler',
  essenceCost: 5,
  minionsPerSummon: 3,
  size: '1M',
  speed: 5,
  stamina: [4, 4, 4],
  stability: 0,
  freeStrike: 3,
  characteristics: {
    might: -2,
    agility: 0,
    reason: -1,
    intuition: 3,
    presence: 3,
  },
  role: 'controller',
  keywords: ['Abyssal', 'Demon'],
  immunities: [],
  weaknesses: [{ type: 'holy', value: 1 }],
  movementModes: [],
  freeStrikeDamageType: 'acid',
  traits: [
    {
      name: 'Gushing Strike',
      description:
        "The spewler's ranged free strikes have a distance of 10 and slides the target R + 2 squares.",
    },
    {
      name: 'Soulsight',
      description: "Each creature adjacent to the spewler can't be hidden from them.",
    },
  ],
};

const hulkingChimor: MinionTemplate = {
  id: 'demon_hulking_chimor',
  name: 'Hulking Chimor',
  essenceCost: 5,
  minionsPerSummon: 3,
  size: '2',
  speed: 5,
  stamina: [7, 7, 7],
  stability: 3,
  freeStrike: 3,
  characteristics: {
    might: 3,
    agility: 0,
    reason: 2,
    intuition: 1,
    presence: 1,
  },
  role: 'defender',
  keywords: ['Abyssal', 'Demon'],
  immunities: [],
  weaknesses: [{ type: 'holy', value: 1 }],
  movementModes: [],
  freeStrikeDamageType: 'untyped',
  traits: [
    {
      name: 'Mercurial Strike',
      description:
        "The chimor's melee free strikes inflict M < WEAK weakened (EoT). The potency is increased by the current round number.",
    },
    {
      name: 'Soulsight',
      description: "Each creature adjacent to the chimor can't be hidden from them.",
    },
  ],
};

const violent: MinionTemplate = {
  id: 'demon_violent',
  name: 'Violent',
  essenceCost: 5,
  minionsPerSummon: 3,
  size: '1M',
  speed: 7,
  stamina: [5, 5, 5],
  stability: 1,
  freeStrike: 4,
  characteristics: {
    might: 2,
    agility: 3,
    reason: 0,
    intuition: -1,
    presence: -1,
  },
  role: 'ambusher',
  keywords: ['Abyssal', 'Demon'],
  immunities: [],
  weaknesses: [{ type: 'holy', value: 1 }],
  movementModes: ['Climb'],
  freeStrikeDamageType: 'corruption',
  traits: [
    {
      name: 'Transforming Strike',
      description:
        "The violent's melee free strikes deal an additional 2 damage to each adjacent enemy from whom they were hidden. The violent loses their disguise after striking.",
    },
    {
      name: 'Skulker',
      description: 'Once per turn, the violent can hide as a free maneuver after moving.',
    },
  ],
};

// -----------------------------------------------------------------------------
// 7-ESSENCE MINIONS (Summon 2)
// -----------------------------------------------------------------------------

const fadedBlightling: MinionTemplate = {
  id: 'demon_faded_blightling',
  name: 'Faded Blightling',
  essenceCost: 7,
  minionsPerSummon: 2,
  size: '1L',
  speed: 5,
  stamina: [17, 17],
  stability: 0,
  freeStrike: 7,
  characteristics: {
    might: 0,
    agility: 0,
    reason: -1,
    intuition: 4,
    presence: 3,
  },
  role: 'support',
  keywords: ['Abyssal', 'Demon'],
  immunities: [],
  weaknesses: [{ type: 'holy', value: 1 }],
  movementModes: ['Fly'],
  freeStrikeDamageType: 'corruption',
  traits: [
    {
      name: 'Wilted Wings',
      description: 'The blightling must land on the ground at the end of their turn or fall prone.',
    },
    {
      name: 'Soulsight',
      description: "Each creature adjacent to the blightling can't be hidden from them.",
    },
  ],
};

const gorrre: MinionTemplate = {
  id: 'demon_gorrre',
  name: 'Gorrre',
  essenceCost: 7,
  minionsPerSummon: 2,
  size: '2',
  speed: 5,
  stamina: [17, 17],
  stability: 2,
  freeStrike: 8,
  characteristics: {
    might: 4,
    agility: 3,
    reason: 0,
    intuition: -1,
    presence: 0,
  },
  role: 'brute',
  keywords: ['Abyssal', 'Demon'],
  immunities: [],
  weaknesses: [{ type: 'holy', value: 1 }],
  movementModes: [],
  freeStrikeDamageType: 'untyped',
  traits: [
    {
      name: 'Gorrring Strike',
      description:
        'The gorrre must charge before making a strike. The target is M < STRONG knocked prone if the gorrre moved through an enemy or object other than the target during the charge.',
    },
    {
      name: 'Soulsight',
      description: "Each creature adjacent to the gorrre can't be hidden from them.",
    },
  ],
};

const vicisittante: MinionTemplate = {
  id: 'demon_vicisittante',
  name: 'Vicisittante',
  essenceCost: 7,
  minionsPerSummon: 2,
  size: '2',
  speed: 10,
  stamina: [17, 17],
  stability: 0,
  freeStrike: 7,
  characteristics: {
    might: 3,
    agility: 4,
    reason: 0,
    intuition: 0,
    presence: -1,
  },
  role: 'harrier',
  keywords: ['Abyssal', 'Demon'],
  immunities: [],
  weaknesses: [{ type: 'holy', value: 1 }],
  movementModes: [],
  freeStrikeDamageType: 'psychic',
  traits: [
    {
      name: 'Soulsight',
      description: "Each creature adjacent to the vicisittante can't be hidden from them.",
    },
  ],
};

// -----------------------------------------------------------------------------
// FIXTURE: The Boil
// -----------------------------------------------------------------------------

const theBoil: FixtureTemplate = {
  id: 'fixture_the_boil',
  name: 'The Boil',
  portfolioType: 'demon',
  role: 'Hazard Support',
  flavorText:
    'The boil arises from the chaotic depths of the Abyssal Waste, concentrated into a heaving mass by the pressure of a coherent reality. As it slushes and threatens to burst, the noises drive nearby demons into a frenzy.',
  baseStamina: 20,
  size: 2,
  traits: [
    {
      name: 'Hunger Thrush',
      description:
        "Each enemy that starts their turn within 3 squares of the boil is I < AVERAGE taunted (EoT) by the boil, or I < WEAK taunted (EoT) by the boil and can't move further from it.",
    },
    {
      name: 'Oh, It Pops',
      description:
        'When the boil is destroyed, each enemy within 3 squares of the boil takes acid damage equal to your level and is A < STRONG weakened (save ends).',
    },
  ],
  level5Feature: {
    id: 'the_boil_level5',
    name: 'Soul Rancor',
    description:
      'You gain a surge the first time in a round that your demon minions deal 3 or more damage to a creature while you have line of effect to the boil. You can choose to give the surge to an ally who also has line of effect to the boil.',
    levelRequired: 5,
  },
  level9Features: [
    {
      id: 'the_boil_level9_size',
      name: 'Size Increase',
      description: 'The boil is now size 3.',
      levelRequired: 9,
    },
    {
      id: 'the_boil_level9_fester',
      name: 'Fester Field',
      description:
        'Each non-abyssal enemy that starts their turn within 3 squares of the boil takes 5 corruption damage.',
      levelRequired: 9,
    },
  ],
};

// -----------------------------------------------------------------------------
// CHAMPION: Aspect (9 Essence)
// -----------------------------------------------------------------------------

// Champion data available in compendium but not yet implemented

// -----------------------------------------------------------------------------
// COMPLETE PORTFOLIO
// -----------------------------------------------------------------------------

export const demonPortfolio: Portfolio = {
  type: 'demon',
  signatureMinions: [ensnarer, rasquine, razor],
  unlockedMinions: [
    // 3-Essence
    archerSpittlich,
    fangedMusilex,
    twistedBengrul,
    // 5-Essence
    gushingSpewler,
    hulkingChimor,
    violent,
    // 7-Essence
    fadedBlightling,
    gorrre,
    vicisittante,
  ],
  fixture: theBoil,
  champion: null, // Aspect - Level 8+
};
