// Elementalist Level Features from Draw Steel rules

export interface ElementalistLevelFeature {
  level: number;
  name: string;
  description: string;
  category: 'passive' | 'active' | 'resource' | 'epic';
}

export const ELEMENTALIST_LEVEL_FEATURES: ElementalistLevelFeature[] = [
  {
    level: 1,
    name: 'Persistent Magic',
    description:
      'Some abilities have a "persistent" cost that locks Essence while the ability is active. Your turn-start Essence gain is reduced by your total locked Essence.',
    category: 'passive',
  },
  {
    level: 1,
    name: 'Elemental Attunement',
    description:
      'You gain immunity to damage from your chosen element. You can speak with elementals of your type.',
    category: 'passive',
  },
  {
    level: 1,
    name: 'Essence Surge',
    description:
      'The first time each round you or a creature within 10 squares takes damage that is not untyped or holy, you gain Essence (amount based on level).',
    category: 'resource',
  },
  {
    level: 3,
    name: 'Elemental Shield',
    description:
      'As a free triggered action when you take elemental damage matching your element, you can spend 1 Essence to gain resistance to that damage equal to twice your Reason score.',
    category: 'active',
  },
  {
    level: 3,
    name: 'Element Sense',
    description:
      'You can sense the presence of your element within 10 squares. You have an edge on tests to track or identify your element.',
    category: 'passive',
  },
  {
    level: 4,
    name: 'Mantle of Essence',
    description:
      'When you have 3 or more Essence at the start of your turn, your Mantle becomes active. Your Mantle grants bonuses based on your element.',
    category: 'passive',
  },
  {
    level: 4,
    name: 'Improved Essence Surge',
    description:
      'When you trigger Essence Surge from taking elemental damage, you gain 2 Essence instead of 1.',
    category: 'resource',
  },
  {
    level: 6,
    name: 'Elemental Mastery',
    description:
      'Your abilities that deal your element\'s damage type ignore resistance to that damage type.',
    category: 'passive',
  },
  {
    level: 7,
    name: 'Improved Essence Generation',
    description:
      'At the start of your turn, you gain 3 Essence (instead of 2), minus any locked Essence.',
    category: 'resource',
  },
  {
    level: 7,
    name: 'Dual Element',
    description:
      'Choose a second element. You gain its Elemental Attunement benefit but not its Mantle bonus.',
    category: 'passive',
  },
  {
    level: 9,
    name: 'Living Element',
    description:
      '+21 Stamina. You can transform into a being of pure elemental energy as a maneuver. While transformed, you can move through solid objects of your element and are immune to physical damage.',
    category: 'passive',
  },
  {
    level: 10,
    name: 'Primordium',
    description:
      'Gain the Primordium epic resource. Upon respite, gain Primordium equal to XP gained. Can spend Primordium to maximize all damage dice on any elemental ability.',
    category: 'epic',
  },
  {
    level: 10,
    name: 'Mastered Essence',
    description:
      'At the start of your turn, you gain 4 Essence (instead of 3), minus any locked Essence.',
    category: 'resource',
  },
  {
    level: 10,
    name: 'Elemental Cataclysm',
    description:
      'Once per encounter, you can spend 10 Essence to create a massive elemental effect in a 5-square burst. All creatures in the area take damage equal to 10 times your Reason score.',
    category: 'epic',
  },
];

// Get features available at a given level
export function getFeaturesForLevel(level: number): ElementalistLevelFeature[] {
  return ELEMENTALIST_LEVEL_FEATURES.filter((f) => f.level <= level);
}

// Get features that unlock at a specific level
export function getFeaturesUnlockedAtLevel(level: number): ElementalistLevelFeature[] {
  return ELEMENTALIST_LEVEL_FEATURES.filter((f) => f.level === level);
}

// Calculate Essence gain at start of turn based on level (before persistent reduction)
export function getEssenceGain(level: number): number {
  if (level >= 10) return 4; // Mastered Essence
  if (level >= 7) return 3; // Improved Essence Generation
  return 2; // Base
}

// Calculate essence surge gain based on level
export function getEssenceSurgeGain(level: number): number {
  if (level >= 4) return 2; // Improved Essence Surge
  return 1; // Base
}

// Check if mantle should be active
export function isMantleActive(currentEssence: number): boolean {
  return currentEssence >= 3;
}
