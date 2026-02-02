// Tactician Level Features from Draw Steel rules

export interface TacticianLevelFeature {
  level: number;
  name: string;
  description: string;
  category: 'passive' | 'active' | 'resource' | 'epic';
}

export const TACTICIAN_LEVEL_FEATURES: TacticianLevelFeature[] = [
  {
    level: 1,
    name: 'Mark',
    description:
      'As a free triggered action, you can mark a creature you can see within 10 squares. Allies gain an edge on power rolls against marked targets. The mark lasts until the creature dies or you mark a different creature.',
    category: 'active',
  },
  {
    level: 1,
    name: 'Field Arsenal',
    description:
      'You benefit from two kits simultaneously. Choose a second kit at character creation. You gain the bonuses from both kits.',
    category: 'passive',
  },
  {
    level: 1,
    name: 'Tactical Direction',
    description:
      'At the start of combat, you can choose one ally. That ally can take their turn immediately after yours for the entire encounter.',
    category: 'active',
  },
  {
    level: 3,
    name: 'Prepared Action',
    description:
      'You can spend 1 Focus to let an ally within 10 squares use a free triggered action to take their Maneuver immediately.',
    category: 'active',
  },
  {
    level: 3,
    name: 'Battle Assessment',
    description:
      'You have an edge on Reason tests to recall information about creatures, and you can assess a creature as a free maneuver instead of a maneuver.',
    category: 'passive',
  },
  {
    level: 4,
    name: 'Improved Mark Triggers',
    description:
      'When an ally deals damage to your marked target, you gain 2 Focus instead of 1.',
    category: 'resource',
  },
  {
    level: 4,
    name: 'Coordinated Strike',
    description:
      'When an ally attacks your marked target and gets a tier 2 or 3 result, you can use a free triggered action to shift up to 2 squares.',
    category: 'active',
  },
  {
    level: 6,
    name: 'Focus Fire',
    description:
      'Allies who attack your marked target deal additional damage equal to half your Reason score (minimum 1).',
    category: 'passive',
  },
  {
    level: 7,
    name: 'Improved Focus Generation',
    description:
      'At the start of your turn, you gain 3 Focus (instead of 2).',
    category: 'resource',
  },
  {
    level: 7,
    name: 'Seize the Initiative',
    description:
      'Once per encounter at the start of combat, you can spend 5 Focus to let all allies take their first turn before any enemies.',
    category: 'active',
  },
  {
    level: 9,
    name: 'Master Tactician',
    description:
      '+21 Stamina. You and allies within 10 squares cannot be surprised. You have an edge on initiative tests.',
    category: 'passive',
  },
  {
    level: 10,
    name: 'Triumph',
    description:
      'Gain the Triumph epic resource. Upon respite, gain Triumph equal to XP gained. Can spend Triumph to automatically grant an ally a tier 3 result on any power roll.',
    category: 'epic',
  },
  {
    level: 10,
    name: 'Mastered Focus',
    description:
      'At the start of your turn, you gain 4 Focus (instead of 3).',
    category: 'resource',
  },
  {
    level: 10,
    name: 'Supreme Commander',
    description:
      'As a maneuver, you can spend 10 Focus to grant all allies within 10 squares an immediate free action to use their main action ability.',
    category: 'epic',
  },
];

// Get features available at a given level
export function getFeaturesForLevel(level: number): TacticianLevelFeature[] {
  return TACTICIAN_LEVEL_FEATURES.filter((f) => f.level <= level);
}

// Get features that unlock at a specific level
export function getFeaturesUnlockedAtLevel(level: number): TacticianLevelFeature[] {
  return TACTICIAN_LEVEL_FEATURES.filter((f) => f.level === level);
}

// Calculate Focus gain at start of turn based on level
export function getFocusGain(level: number): number {
  if (level >= 10) return 4; // Mastered Focus
  if (level >= 7) return 3; // Improved Focus Generation
  return 2; // Base
}

// Calculate mark trigger gain based on level
export function getMarkTriggerGain(level: number): number {
  if (level >= 4) return 2; // Improved Mark Triggers
  return 1; // Base
}
