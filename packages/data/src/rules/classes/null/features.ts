// Null Level Features from Draw Steel rules

export interface NullLevelFeature {
  level: number;
  name: string;
  description: string;
  category: 'passive' | 'active' | 'resource' | 'epic';
}

export const NULL_LEVEL_FEATURES: NullLevelFeature[] = [
  {
    level: 1,
    name: 'Null Field',
    description:
      'Project a psionic aura (size 1) as a maneuver. Enemies in the field reduce their potencies by 1. Lasts until you are dying or willingly end it.',
    category: 'active',
  },
  {
    level: 1,
    name: 'Inertial Shield',
    description:
      'Triggered action when taking damage: halve the damage. Spend 1 Discipline to also reduce the potency of associated effects by 1. Gain a free triggered action based on your tradition.',
    category: 'active',
  },
  {
    level: 1,
    name: 'Discipline Mastery',
    description:
      'Gain passive benefits at Discipline thresholds (4, 6, 8, 10). Benefits vary by tradition.',
    category: 'passive',
  },
  {
    level: 3,
    name: 'Psionic Leap',
    description:
      'Your long and high jump distances automatically equal 2 × your Agility score without needing a test.',
    category: 'passive',
  },
  {
    level: 3,
    name: 'Reorder',
    description:
      'Free triggered action: End one effect on yourself or an ally within the Null Field that a save can end.',
    category: 'active',
  },
  {
    level: 4,
    name: 'Enhanced Null Field',
    description:
      'Your Null Field suppresses supernatural terrain effects of your level or lower within its area.',
    category: 'passive',
  },
  {
    level: 4,
    name: 'Regenerative Field',
    description:
      'When an enemy in your Null Field uses a main action, you gain 2 Discipline (instead of 1).',
    category: 'resource',
  },
  {
    level: 6,
    name: 'Elemental Absorption',
    description:
      'After using Inertial Shield, gain immunity to elemental damage equal to your Intuition score until the start of your next turn.',
    category: 'passive',
  },
  {
    level: 7,
    name: 'Improved Body',
    description: 'At the start of your turn, you gain 3 Discipline (instead of 2).',
    category: 'resource',
  },
  {
    level: 7,
    name: 'Psi Boost',
    description:
      'Spend Discipline to enhance psionic abilities: Magnified Power (5 Disc, +Reason potency), Extended Range (3 Disc, +2 range), Amplified Effect (4 Disc, +1 surge damage).',
    category: 'active',
  },
  {
    level: 9,
    name: 'I Am the Weapon',
    description:
      '+21 Stamina. You no longer age and do not need food, water, or sleep. +2 on tests to resist or end potency effects.',
    category: 'passive',
  },
  {
    level: 10,
    name: 'Order',
    description:
      'Gain the Order epic resource. Upon respite, gain Order equal to XP gained. Can spend Order as Discipline, or spend 1 Order at combat start to increase Null Field size by 1.',
    category: 'epic',
  },
  {
    level: 10,
    name: 'Manifold Body',
    description: 'At the start of your turn, you gain 4 Discipline (instead of 3).',
    category: 'resource',
  },
  {
    level: 10,
    name: 'Manifold Resonance',
    description:
      'Teleport yourself and willing allies to known locations. Abilities used in the Null Field ignore banes and treat double banes as single banes.',
    category: 'epic',
  },
];

// Get features available at a given level
export function getFeaturesForLevel(level: number): NullLevelFeature[] {
  return NULL_LEVEL_FEATURES.filter((f) => f.level <= level);
}

// Get features that unlock at a specific level
export function getFeaturesUnlockedAtLevel(level: number): NullLevelFeature[] {
  return NULL_LEVEL_FEATURES.filter((f) => f.level === level);
}

// Calculate Discipline gain at start of turn based on level
export function calculateDisciplineGain(level: number): number {
  if (level >= 10) return 4; // Manifold Body
  if (level >= 7) return 3; // Improved Body
  return 2; // Base
}

// Calculate trigger gain based on level
export function calculateTriggerGain(level: number): number {
  if (level >= 4) return 2; // Regenerative Field
  return 1; // Base
}
