// Censor Level Features from Draw Steel rules

export interface CensorLevelFeature {
  level: number;
  name: string;
  description: string;
  category: 'passive' | 'active' | 'resource' | 'epic';
}

export const CENSOR_LEVEL_FEATURES: CensorLevelFeature[] = [
  {
    level: 1,
    name: 'Judgment',
    description:
      'As a free triggered action, you can judge a creature you can see within 10 squares. The judgment lasts until the creature dies or you use this ability on a different creature.',
    category: 'active',
  },
  {
    level: 1,
    name: 'Divine Retribution',
    description:
      'When your judged target uses a main action, they take holy damage equal to your Presence score (minimum 1).',
    category: 'passive',
  },
  {
    level: 1,
    name: 'Wrath Gain',
    description:
      'Gain Wrath when: (1) Start of your turn, (2) First time per round you deal damage to your judged target, (3) First time per round your judged target deals damage to you.',
    category: 'resource',
  },
  {
    level: 3,
    name: 'Righteous Fury',
    description:
      'When you reduce your judged target to 0 Stamina, you can immediately judge a new creature within range as a free triggered action.',
    category: 'passive',
  },
  {
    level: 3,
    name: 'Sanctified Movement',
    description:
      'You ignore difficult terrain created by supernatural effects. You have an edge on tests to resist forced movement.',
    category: 'passive',
  },
  {
    level: 4,
    name: 'Improved Wrath Triggers',
    description:
      'When you trigger Wrath gain from dealing damage or taking damage from your judged target, you gain 2 Wrath instead of 1.',
    category: 'resource',
  },
  {
    level: 4,
    name: 'Zealous Pursuit',
    description:
      'When your judged target moves, you can use a free triggered action to shift up to 2 squares toward them.',
    category: 'active',
  },
  {
    level: 6,
    name: 'Aura of Judgment',
    description:
      'Enemies within 2 squares of you have a bane on attacks against your allies (other than you).',
    category: 'passive',
  },
  {
    level: 7,
    name: 'Improved Wrath Generation',
    description:
      'At the start of your turn, you gain 3 Wrath (instead of 2).',
    category: 'resource',
  },
  {
    level: 7,
    name: 'Condemning Gaze',
    description:
      'As a maneuver, you can spend 3 Wrath to give your judged target a bane on their next power roll.',
    category: 'active',
  },
  {
    level: 9,
    name: 'Avatar of Wrath',
    description:
      '+21 Stamina. You have immunity to the frightened condition. You cannot be charmed or dominated.',
    category: 'passive',
  },
  {
    level: 10,
    name: 'Anathema',
    description:
      'Gain the Anathema epic resource. Upon respite, gain Anathema equal to XP gained. Can spend Anathema to automatically deal maximum damage on any attack against your judged target.',
    category: 'epic',
  },
  {
    level: 10,
    name: 'Mastered Wrath',
    description:
      'At the start of your turn, you gain 4 Wrath (instead of 3).',
    category: 'resource',
  },
  {
    level: 10,
    name: 'Final Judgment',
    description:
      'When your judged target drops to 0 Stamina, you can choose to immediately execute them (no death saves). This ability can only be used once per encounter.',
    category: 'epic',
  },
];

// Get features available at a given level
export function getFeaturesForLevel(level: number): CensorLevelFeature[] {
  return CENSOR_LEVEL_FEATURES.filter((f) => f.level <= level);
}

// Get features that unlock at a specific level
export function getFeaturesUnlockedAtLevel(level: number): CensorLevelFeature[] {
  return CENSOR_LEVEL_FEATURES.filter((f) => f.level === level);
}

// Calculate Wrath gain at start of turn based on level
export function getWrathGain(level: number): number {
  if (level >= 10) return 4; // Mastered Wrath
  if (level >= 7) return 3; // Improved Wrath Generation
  return 2; // Base
}

// Calculate judgment trigger gain based on level
export function getJudgmentTriggerGain(level: number): number {
  if (level >= 4) return 2; // Improved Wrath Triggers
  return 1; // Base
}
