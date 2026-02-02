// Shadow Level Features from Draw Steel rules

export interface ShadowLevelFeature {
  level: number;
  name: string;
  description: string;
  category: 'passive' | 'active' | 'resource' | 'epic';
}

export const SHADOW_LEVEL_FEATURES: ShadowLevelFeature[] = [
  {
    level: 1,
    name: 'Hesitation Is Weakness',
    description:
      'Spend 1 Insight as a free triggered action to take your turn immediately after another hero finishes their turn. You can use this ability even if you have already taken a turn this round.',
    category: 'active',
  },
  {
    level: 1,
    name: 'Hide',
    description:
      'As a maneuver, you can attempt to become hidden if you have cover or concealment from all enemies. While hidden, enemies cannot target you with attacks or abilities.',
    category: 'active',
  },
  {
    level: 1,
    name: 'Insight Surge',
    description:
      'When you deal surge damage, gain Insight (amount based on level).',
    category: 'resource',
  },
  {
    level: 3,
    name: 'Careful Observation',
    description:
      'You gain an edge on tests to find hidden creatures, detect lies, and notice small details. Your Reason score counts as 2 higher for the purpose of detecting illusions.',
    category: 'passive',
  },
  {
    level: 3,
    name: 'Shadow Step',
    description:
      'You can move through enemies as if they were difficult terrain. When you do, they cannot use triggered actions against you until the end of your turn.',
    category: 'passive',
  },
  {
    level: 4,
    name: 'Improved Insight Surge',
    description:
      'When you deal surge damage, you gain 2 Insight (instead of 1).',
    category: 'resource',
  },
  {
    level: 4,
    name: 'Edge Discount',
    description:
      'When you have an edge on a power roll, reduce the Insight cost of the ability by 1 (minimum 0). When you have a double edge, reduce the cost by 2.',
    category: 'passive',
  },
  {
    level: 6,
    name: 'Vanish',
    description:
      'As a free triggered action when you take damage, you can spend 2 Insight to become hidden until the start of your next turn, even without cover or concealment.',
    category: 'active',
  },
  {
    level: 7,
    name: 'Focused Mind',
    description:
      'At the start of your turn, you gain 1d3 + 1 Insight (instead of 1d3).',
    category: 'resource',
  },
  {
    level: 7,
    name: 'Anticipation',
    description:
      'You can use Hesitation Is Weakness to act before an enemy instead of after an ally.',
    category: 'active',
  },
  {
    level: 9,
    name: 'Living Shadow',
    description:
      '+21 Stamina. You can squeeze through spaces as small as 1 inch. You have immunity to the grappled and restrained conditions.',
    category: 'passive',
  },
  {
    level: 10,
    name: 'Vision',
    description:
      'Gain the Vision epic resource. Upon respite, gain Vision equal to XP gained. Can spend Vision to automatically succeed on any test or to gain an extra turn.',
    category: 'epic',
  },
  {
    level: 10,
    name: 'Improved Insight Surge (Mastery)',
    description:
      'When you deal surge damage, you gain 3 Insight (instead of 2).',
    category: 'resource',
  },
  {
    level: 10,
    name: 'Omniscient Strike',
    description:
      'Once per round, when you make a power roll, you can treat the result as a critical success (tier 3 with double edge).',
    category: 'epic',
  },
];

// Get features available at a given level
export function getFeaturesForLevel(level: number): ShadowLevelFeature[] {
  return SHADOW_LEVEL_FEATURES.filter((f) => f.level <= level);
}

// Get features that unlock at a specific level
export function getFeaturesUnlockedAtLevel(level: number): ShadowLevelFeature[] {
  return SHADOW_LEVEL_FEATURES.filter((f) => f.level === level);
}

// Calculate Insight gain at start of turn based on level
// Returns the dice notation
export function getInsightGainDice(level: number): string {
  if (level >= 7) return '1d3 + 1';
  return '1d3';
}

// Calculate surge trigger gain based on level
export function getSurgeGain(level: number): number {
  if (level >= 10) return 3;
  if (level >= 4) return 2;
  return 1;
}

// Get edge discount based on edge state
export function getEdgeDiscount(hasEdge: boolean, hasDoubleEdge: boolean, level: number): number {
  if (level < 4) return 0;
  if (hasDoubleEdge) return 2;
  if (hasEdge) return 1;
  return 0;
}
