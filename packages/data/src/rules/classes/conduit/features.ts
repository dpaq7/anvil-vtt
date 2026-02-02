// Conduit Level Features from Draw Steel rules

export interface ConduitLevelFeature {
  level: number;
  name: string;
  description: string;
  category: 'passive' | 'active' | 'resource' | 'epic';
}

export const CONDUIT_LEVEL_FEATURES: ConduitLevelFeature[] = [
  {
    level: 1,
    name: 'Healing Grace',
    description:
      'As a maneuver, restore Stamina equal to twice your Intuition score to one creature within 10 squares. You can spend Piety to affect additional targets or end conditions.',
    category: 'active',
  },
  {
    level: 1,
    name: 'Pray',
    description:
      'As a maneuver, take psychic damage equal to your level to pray. Roll 1d6: on 1-2 you take the damage and gain nothing; on 3-4 you gain your domain effect; on 5-6 you gain 1d3 Piety.',
    category: 'active',
  },
  {
    level: 1,
    name: 'Divine Domains',
    description:
      'Choose two domains that define your divine connection. Each domain grants unique bonuses to your abilities.',
    category: 'passive',
  },
  {
    level: 2,
    name: 'Lists of Heaven',
    description:
      'When an ally within 10 squares spends a Recovery, you can spend a Recovery to allow them to regain additional Stamina equal to your Intuition score.',
    category: 'active',
  },
  {
    level: 3,
    name: 'Blessing of the Faithful',
    description:
      'At the start of each encounter, you and up to 2 allies gain temporary Stamina equal to your Intuition score.',
    category: 'passive',
  },
  {
    level: 3,
    name: 'Divine Guidance',
    description:
      'You have an edge on Intuition tests to sense supernatural presence or divine influence.',
    category: 'passive',
  },
  {
    level: 4,
    name: 'Improved Piety Generation',
    description:
      'Your Prayer ability now gains 1d3 + 1 Piety on a successful roll (5-6), and domain effects trigger on 3-6.',
    category: 'resource',
  },
  {
    level: 4,
    name: 'Consecrated Ground',
    description:
      'As a maneuver, you can spend 3 Piety to consecrate a 3-square burst. Allies in the area have an edge on power rolls. Lasts until end of encounter.',
    category: 'active',
  },
  {
    level: 6,
    name: 'Divine Resilience',
    description:
      'You gain resistance to holy damage equal to your Intuition score. You have an edge on saves against divine abilities.',
    category: 'passive',
  },
  {
    level: 7,
    name: 'Improved Piety Gain',
    description:
      'At the start of your turn, you gain 1d3 + 1 Piety (instead of 1d3).',
    category: 'resource',
  },
  {
    level: 7,
    name: 'Mass Healing',
    description:
      'When you use Healing Grace, you can spend 5 Piety to affect all allies within the area instead of a single target.',
    category: 'active',
  },
  {
    level: 9,
    name: 'Avatar of Faith',
    description:
      '+21 Stamina. You have immunity to the charmed and frightened conditions. Your Healing Grace range increases to 15 squares.',
    category: 'passive',
  },
  {
    level: 10,
    name: 'Miracle',
    description:
      'Gain the Miracle epic resource. Upon respite, gain Miracle equal to XP gained. Can spend Miracle to automatically maximize any healing or to resurrect a fallen ally.',
    category: 'epic',
  },
  {
    level: 10,
    name: 'Mastered Piety',
    description:
      'At the start of your turn, you gain 1d3 + 2 Piety (instead of 1d3 + 1).',
    category: 'resource',
  },
  {
    level: 10,
    name: 'Divine Intervention',
    description:
      'Once per encounter, you can spend 10 Piety as a free action to prevent all damage to allies within 10 squares until the start of your next turn.',
    category: 'epic',
  },
];

// Get features available at a given level
export function getFeaturesForLevel(level: number): ConduitLevelFeature[] {
  return CONDUIT_LEVEL_FEATURES.filter((f) => f.level <= level);
}

// Get features that unlock at a specific level
export function getFeaturesUnlockedAtLevel(level: number): ConduitLevelFeature[] {
  return CONDUIT_LEVEL_FEATURES.filter((f) => f.level === level);
}

// Get Piety gain dice notation based on level
export function getPietyGainDice(level: number): string {
  if (level >= 10) return '1d3 + 2';
  if (level >= 7) return '1d3 + 1';
  return '1d3';
}

// Get prayer success threshold based on level
export function getPrayerSuccessThreshold(level: number): { pietyMin: number; domainMin: number } {
  if (level >= 4) {
    // Improved: domain on 3-6, piety on 5-6
    return { pietyMin: 5, domainMin: 3 };
  }
  // Base: domain on 3-4, piety on 5-6
  return { pietyMin: 5, domainMin: 3 };
}
