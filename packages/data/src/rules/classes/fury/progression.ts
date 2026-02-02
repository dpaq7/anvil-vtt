// Fury Level Progression Data - Draw Steel Rules
import type { LevelProgression, LevelFeature, FeatureCategory } from '../../types/progression';
import type { FuryAspect } from '@anvil/types';
import type { berserkerFeatures, reaverFeatures, stormwightFeatures } from './features';

// ============================================================
// 7-FEROCITY ABILITY CHOICES (Level 3)
// ============================================================

export const sevenFerocityChoices = [
  {
    id: 'demon-unleashed',
    name: 'Demon Unleashed',
    description: 'Self (3 aura). Until encounter end, adjacent enemies with P < Strong are frightened (EoT).',
  },
  {
    id: 'face-the-storm',
    name: 'Face the Storm!',
    description: 'Self. Melee strikes taunt foes (P < V, EoT). Strikes against taunted foes deal +2xM damage and +1 potency.',
  },
  {
    id: 'you-are-already-dead',
    name: 'You Are Already Dead',
    description: 'Melee 1. Non-leader/solo reduced to 0 Stamina at end of next turn. Leader/solo grants 3 surges and free strike.',
  },
  {
    id: 'steelbreaker',
    name: 'Steelbreaker',
    description: "Melee 1. Deals damage and destroys target's weapon or armor (your choice).",
  },
];

// ============================================================
// 9-FEROCITY ABILITY CHOICES (Level 5)
// ============================================================

export const nineFerocityChoices = [
  {
    id: 'debilitating-strike',
    name: 'Debilitating Strike',
    description: 'Melee 1. Deals damage; slowed (save ends). Slowed targets take 1 damage per square moved.',
  },
  {
    id: 'to-stone',
    name: 'To Stone!',
    description: 'Melee 1. Deals damage; slowed (save ends) or restrained (M < S, save ends). Restrained turn to stone on failed save.',
  },
];

// ============================================================
// 11-FEROCITY ABILITY CHOICES (Level 8)
// ============================================================

export const elevenFerocityChoices = [
  {
    id: 'overkill',
    name: 'Overkill',
    description: 'Melee 1. Non-leader/solo/minion/winded reduced to 0 before damage. Excess transfers to adjacent foe.',
  },
  {
    id: 'relentless-death',
    name: 'Relentless Death',
    description: 'Shift up to speed. Deal 2xM damage to enemies moved adjacent to. Kill weak non-leader/solo creatures.',
  },
  {
    id: 'primordial-rage',
    name: 'Primordial Rage',
    description: 'Self. Until encounter end, all strikes deal additional elemental damage equal to your level.',
  },
];

// ============================================================
// ASPECT-SPECIFIC 5-FEROCITY CHOICES (Level 2)
// ============================================================

export const berserkerFiveFerocityChoices = [
  {
    id: 'crushing-blow',
    name: 'Crushing Blow',
    description: 'Melee 1. Deals heavy damage. Target pushed back 2 squares and knocked prone (M > S).',
  },
  {
    id: 'rampage',
    name: 'Rampage',
    description: 'Move up to your speed. Free strike against each enemy you move adjacent to.',
  },
];

export const reaverFiveFerocityChoices = [
  {
    id: 'shadow-strike',
    name: 'Shadow Strike',
    description: 'Melee 1. Deals damage. You become hidden until the end of your turn.',
  },
  {
    id: 'whirlwind',
    name: 'Whirlwind',
    description: '1 burst. Deals damage to all enemies and you can slide each 1 square.',
  },
];

export const stormwightFiveFerocityChoices = [
  {
    id: 'storm-charge',
    name: 'Storm Charge',
    description: 'Shift up to speed in animal or hybrid form. Free strike with Primordial Storm damage against first enemy reached.',
  },
  {
    id: 'primal-howl',
    name: 'Primal Howl',
    description: '3 burst. All enemies are frightened (save ends, P < M). Deal Primordial Storm damage equal to Might.',
  },
];

// ============================================================
// ASPECT-SPECIFIC 9-FEROCITY CHOICES (Level 6)
// ============================================================

export const berserkerNineFerocityChoices = [
  {
    id: 'meteor-smash',
    name: 'Meteor Smash',
    description: 'Jump up to your speed and land in an unoccupied square. All adjacent enemies take 3xM damage and are pushed 3 squares.',
  },
  {
    id: 'unstoppable-onslaught',
    name: 'Unstoppable Onslaught',
    description: 'Until end of turn, you cannot be slowed, immobilized, or restrained. Your forced movement distance doubles.',
  },
];

export const reaverNineFerocityChoices = [
  {
    id: 'assassinate',
    name: 'Assassinate',
    description: 'Melee 1 against surprised or unaware target. Deal 4xM damage. Target is bleeding (save ends).',
  },
  {
    id: 'blur-of-blades',
    name: 'Blur of Blades',
    description: 'Make 3 free strikes against different enemies within reach. You can shift 1 square between each.',
  },
];

export const stormwightNineFerocityChoices = [
  {
    id: 'unleash-the-storm',
    name: 'Unleash the Storm',
    description: '5 burst centered on you. All enemies take Primordial Storm damage equal to 2xM and are pushed 3 squares.',
  },
  {
    id: 'apex-hunter',
    name: 'Apex Hunter',
    description: 'Until encounter end, you have blindsense 5 and your animal/hybrid form strikes deal extra Primordial Storm damage equal to M.',
  },
];

// ============================================================
// ASPECT-SPECIFIC 11-FEROCITY CHOICES (Level 9)
// ============================================================

export const berserkerElevenFerocityChoices = [
  {
    id: 'world-breaker',
    name: 'World Breaker',
    description: 'Melee 1. Deals 5xM damage. The ground in a 3 burst becomes difficult terrain. Structures take triple damage.',
  },
  {
    id: 'incarnation-of-might',
    name: 'Incarnation of Might',
    description: 'Until encounter end, your size increases by 1, you gain +5 stability, and forced movement you impose doubles.',
  },
];

export const reaverElevenFerocityChoices = [
  {
    id: 'death-from-shadows',
    name: 'Death From Shadows',
    description: 'If hidden, teleport up to your speed to an enemy. Deal 5xA damage. Target is bleeding and slowed (save ends both).',
  },
  {
    id: 'phantom-dance',
    name: 'Phantom Dance',
    description: 'Until encounter end, after taking damage you can shift 2 squares and become hidden. Attacks against you have bane.',
  },
];

export const stormwightElevenFerocityChoices = [
  {
    id: 'avatar-of-the-storm',
    name: 'Avatar of the Storm',
    description: 'Until encounter end, you deal Primordial Storm immunity 10 to allies within 3 squares. Enemies within 3 take M Primordial Storm damage at your turn end.',
  },
  {
    id: 'primordial-annihilation',
    name: 'Primordial Annihilation',
    description: '10 line. All creatures take 4xM Primordial Storm damage. You can shift into your animal form as part of this action.',
  },
];

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Get aspect-specific 5-Ferocity ability choices
 */
export function getAspectFiveFerocityChoices(aspect: FuryAspect) {
  switch (aspect) {
    case 'berserker':
      return berserkerFiveFerocityChoices;
    case 'reaver':
      return reaverFiveFerocityChoices;
    case 'stormwight':
      return stormwightFiveFerocityChoices;
  }
}

/**
 * Get aspect-specific 9-Ferocity ability choices
 */
export function getAspectNineFerocityChoices(aspect: FuryAspect) {
  switch (aspect) {
    case 'berserker':
      return berserkerNineFerocityChoices;
    case 'reaver':
      return reaverNineFerocityChoices;
    case 'stormwight':
      return stormwightNineFerocityChoices;
  }
}

/**
 * Get aspect-specific 11-Ferocity ability choices
 */
export function getAspectElevenFerocityChoices(aspect: FuryAspect) {
  switch (aspect) {
    case 'berserker':
      return berserkerElevenFerocityChoices;
    case 'reaver':
      return reaverElevenFerocityChoices;
    case 'stormwight':
      return stormwightElevenFerocityChoices;
  }
}

/**
 * Get aspect feature for a specific level
 */
export function getAspectFeatureForLevel(aspect: FuryAspect, level: number) {
  let features;
  switch (aspect) {
    case 'berserker':
      features = berserkerFeatures;
      break;
    case 'reaver':
      features = reaverFeatures;
      break;
    case 'stormwight':
      features = stormwightFeatures;
      break;
  }
  return features.find(f => f.levelRequired === level);
}

// ============================================================
// FURY LEVEL PROGRESSION DATA
// ============================================================

export const furyProgressions: LevelProgression[] = [
  // Level 2
  {
    level: 2,
    features: [
      {
        id: 'perk_level2',
        name: 'Perk',
        description: 'Gain one crafting, exploration, or intrigue perk.',
        type: 'automatic',
      },
      {
        id: 'aspect_feature_l2',
        name: 'Aspect Feature',
        description: 'Gain your Primordial Aspect\'s level 2 feature.',
        type: 'automatic',
        category: 'aspect-feature',
      },
      {
        id: 'aspect_5_ferocity',
        name: 'Aspect 5-Ferocity Ability',
        description: 'Choose a 5-Ferocity heroic ability specific to your aspect.',
        type: 'choice',
        choices: [], // Populated dynamically based on aspect
        category: 'aspect-5-ferocity',
      },
    ],
  },

  // Level 3
  {
    level: 3,
    features: [
      {
        id: 'aspect_feature_l3',
        name: 'Aspect Feature',
        description: 'Gain your Primordial Aspect\'s level 3 feature.',
        type: 'automatic',
        category: 'aspect-feature',
      },
      {
        id: '7_ferocity_ability',
        name: '7-Ferocity Ability',
        description: 'Choose one 7-Ferocity heroic ability.',
        type: 'choice',
        choices: sevenFerocityChoices,
        category: '7-ferocity',
      },
    ],
  },

  // Level 4
  {
    level: 4,
    features: [
      {
        id: 'characteristic_increase_l4',
        name: 'Might & Agility Increase',
        description: 'Your Might and Agility scores are now 3.',
        type: 'automatic',
      },
      {
        id: 'damaging_ferocity',
        name: 'Damaging Ferocity',
        description: 'You now gain 2 Ferocity (instead of 1) the first time you take damage each round.',
        type: 'automatic',
      },
      {
        id: 'growing_ferocity_l4',
        name: 'Growing Ferocity Improvement',
        description: 'Growing Ferocity now provides benefits at 8+ Ferocity.',
        type: 'automatic',
      },
      {
        id: 'primordial_attunement',
        name: 'Primordial Attunement',
        description: 'You sense elemental damage immunity or weakness of creatures within 10 squares.',
        type: 'automatic',
      },
      {
        id: 'primordial_strike',
        name: 'Primordial Strike',
        description: 'On any strike, spend 1 Ferocity to gain 1 Surge. The surge damage can be elemental.',
        type: 'automatic',
      },
      {
        id: 'perk_skill_l4',
        name: 'Perk & Skill',
        description: 'Gain one perk and one additional skill choice.',
        type: 'automatic',
      },
    ],
    statChanges: {
      might: 3,
      agility: 3,
    },
  },

  // Level 5
  {
    level: 5,
    features: [
      {
        id: 'aspect_feature_l5',
        name: 'Aspect Feature',
        description: 'Gain your Primordial Aspect\'s level 5 feature.',
        type: 'automatic',
        category: 'aspect-feature',
      },
      {
        id: '9_ferocity_ability',
        name: '9-Ferocity Ability',
        description: 'Choose one 9-Ferocity heroic ability.',
        type: 'choice',
        choices: nineFerocityChoices,
        category: '9-ferocity',
      },
    ],
  },

  // Level 6
  {
    level: 6,
    features: [
      {
        id: 'marauder',
        name: 'Marauder of the Primordial Chaos',
        description: 'Sense elemental creatures/magic within 1 mile. Treat Renown as higher when negotiating with elementals.',
        type: 'automatic',
      },
      {
        id: 'primordial_portal',
        name: 'Primordial Portal',
        description: 'Use a Main Action to create a portal to Quintessence from an elemental magic source.',
        type: 'automatic',
      },
      {
        id: 'perk_l6',
        name: 'Perk',
        description: 'Gain one crafting, exploration, or intrigue perk.',
        type: 'automatic',
      },
      {
        id: 'aspect_9_ferocity',
        name: 'Aspect 9-Ferocity Ability',
        description: 'Choose a 9-Ferocity heroic ability specific to your aspect.',
        type: 'choice',
        choices: [], // Populated dynamically based on aspect
        category: 'aspect-9-ferocity',
      },
    ],
  },

  // Level 7
  {
    level: 7,
    features: [
      {
        id: 'characteristic_increase_l7',
        name: 'All Characteristics +1',
        description: 'All characteristic scores increase by 1 (maximum 4).',
        type: 'automatic',
      },
      {
        id: 'greater_ferocity',
        name: 'Greater Ferocity',
        description: 'You now gain 1d3+1 Ferocity at the start of each turn (instead of 1d3).',
        type: 'automatic',
      },
      {
        id: 'growing_ferocity_l7',
        name: 'Growing Ferocity Improvement',
        description: 'Growing Ferocity now provides benefits at 10+ Ferocity.',
        type: 'automatic',
      },
      {
        id: 'elemental_form',
        name: 'Elemental Form',
        description: 'Gain elemental damage immunity equal to Might. Stormwights gain 2xMight immunity to Primordial Storm.',
        type: 'automatic',
      },
      {
        id: 'skill_l7',
        name: 'Skill',
        description: 'Gain one additional skill choice.',
        type: 'automatic',
      },
    ],
    statChanges: {
      allStats: 1,
    },
  },

  // Level 8
  {
    level: 8,
    features: [
      {
        id: 'perk_l8',
        name: 'Perk',
        description: 'Gain one perk choice.',
        type: 'automatic',
      },
      {
        id: 'aspect_feature_l8',
        name: 'Aspect Feature',
        description: 'Gain your Primordial Aspect\'s capstone feature.',
        type: 'automatic',
        category: 'aspect-feature',
      },
      {
        id: '11_ferocity_ability',
        name: '11-Ferocity Ability',
        description: 'Choose one 11-Ferocity heroic ability.',
        type: 'choice',
        choices: elevenFerocityChoices,
        category: '11-ferocity',
      },
    ],
  },

  // Level 9
  {
    level: 9,
    features: [
      {
        id: 'harbinger',
        name: 'Harbinger of the Primordial Chaos',
        description: 'During a Respite, you can create a temporary elemental power source for Primordial Portal.',
        type: 'automatic',
      },
      {
        id: 'aspect_11_ferocity',
        name: 'Aspect 11-Ferocity Ability',
        description: 'Choose an 11-Ferocity heroic ability specific to your aspect.',
        type: 'choice',
        choices: [], // Populated dynamically based on aspect
        category: 'aspect-11-ferocity',
      },
    ],
  },

  // Level 10
  {
    level: 10,
    features: [
      {
        id: 'characteristic_increase_l10',
        name: 'Characteristic Mastery',
        description: 'Might and Agility scores increase to 5.',
        type: 'automatic',
      },
      {
        id: 'primordial_ferocity',
        name: 'Primordial Ferocity',
        description: 'You now gain 3 Ferocity (instead of 2) the first time you take damage each round.',
        type: 'automatic',
      },
      {
        id: 'growing_ferocity_l10',
        name: 'Growing Ferocity Ultimate',
        description: 'Growing Ferocity now provides ultimate benefits at 12+ Ferocity.',
        type: 'automatic',
      },
      {
        id: 'chaos_incarnate',
        name: 'Chaos Incarnate',
        description: 'Elemental immunity increases to 2xMight (3xMight for Stormwight Primordial Storm).',
        type: 'automatic',
      },
      {
        id: 'primordial_power',
        name: 'Primordial Power',
        description: 'Gain Primordial Power equal to XP during respite. Can be spent as Ferocity or to end effects.',
        type: 'automatic',
      },
      {
        id: 'perk_skill_l10',
        name: 'Perk & Skill',
        description: 'Gain one perk and one additional skill choice.',
        type: 'automatic',
      },
    ],
    statChanges: {
      might: 5,
      agility: 5,
    },
  },
];

// ============================================================
// HELPER FUNCTIONS FOR PROGRESSION
// ============================================================

/**
 * Get Fury progression for a specific level
 */
export function getFuryProgressionForLevel(level: number): LevelProgression | undefined {
  return furyProgressions.find(p => p.level === level);
}

/**
 * Get all Fury features up to a level
 */
export function getFuryFeaturesUpToLevel(level: number): LevelProgression[] {
  return furyProgressions.filter(p => p.level <= level);
}

/**
 * Get Fury progression with aspect-specific choices populated
 */
export function getFuryProgressionWithAspect(
  level: number,
  aspect: FuryAspect
): LevelProgression | undefined {
  const progression = getFuryProgressionForLevel(level);
  if (!progression) return undefined;

  // Clone the progression to avoid mutating the original
  const withAspect: LevelProgression = {
    ...progression,
    features: progression.features.map(feature => {
      // Populate aspect-specific ability choices
      if (feature.category === 'aspect-5-ferocity') {
        return {
          ...feature,
          choices: getAspectFiveFerocityChoices(aspect),
        };
      }
      if (feature.category === 'aspect-9-ferocity') {
        return {
          ...feature,
          choices: getAspectNineFerocityChoices(aspect),
        };
      }
      if (feature.category === 'aspect-11-ferocity') {
        return {
          ...feature,
          choices: getAspectElevenFerocityChoices(aspect),
        };
      }
      // Update aspect feature descriptions
      if (feature.category === 'aspect-feature') {
        const aspectFeature = getAspectFeatureForLevel(aspect, progression.level);
        if (aspectFeature) {
          return {
            ...feature,
            name: aspectFeature.name,
            description: aspectFeature.description,
          };
        }
      }
      return feature;
    }),
  };

  return withAspect;
}

/**
 * Calculate Fury stamina for a given level
 * Fury: Base 21 + 9 per level after 1
 */
export function calculateFuryStamina(level: number, kitStaminaBonus: number = 0): number {
  const baseStamina = 21;
  const levelBonus = level >= 2 ? (level - 1) * 9 : 0;
  return baseStamina + kitStaminaBonus + levelBonus;
}
