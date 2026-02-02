// Talent Level Features from Draw Steel rules

export interface TalentLevelFeature {
  level: number;
  name: string;
  description: string;
  category: 'passive' | 'active' | 'resource' | 'epic';
}

export const TALENT_LEVEL_FEATURES: TalentLevelFeature[] = [
  {
    level: 1,
    name: 'Clarity Generation',
    description:
      'At the start of each of your turns during combat, you gain 1d3 clarity. The first time each combat round that you force move a creature, you gain 1 clarity. At the start of combat, you gain clarity equal to your Victories.',
    category: 'resource',
  },
  {
    level: 1,
    name: 'Strain',
    description:
      'Your clarity can go negative (minimum -(1 + Reason)). While your clarity is negative, you are strained. While strained, you take psychic damage equal to your negative clarity at the start of each of your turns.',
    category: 'resource',
  },
  {
    level: 1,
    name: 'Feedback Loop',
    description:
      'Triggered action (Ranged 10): When an enemy deals damage to an ally, that enemy takes psychic damage equal to half the triggering damage.',
    category: 'active',
  },
  {
    level: 1,
    name: 'Mind Spike',
    description:
      'You have a psionic attack that allows you to assault the mind of a creature within range. Mind Spike is a signature ability that scales with your level.',
    category: 'active',
  },
  {
    level: 3,
    name: 'Scan',
    description:
      'Once on each of your turns, you can search for hidden creatures as a free maneuver. Once you establish line of effect to a thinking creature within Mind Spike distance, you always have line of effect to them until they move beyond that distance.',
    category: 'passive',
  },
  {
    level: 4,
    name: 'Improved Clarity Trigger',
    description:
      'When you force move a creature, you gain 2 clarity (instead of 1).',
    category: 'resource',
  },
  {
    level: 4,
    name: 'Mind Recovery',
    description:
      'When you spend a recovery, you can also end one condition affecting you that can be ended with a saving throw.',
    category: 'passive',
  },
  {
    level: 6,
    name: 'Psi Boost',
    description:
      'When using a Psionic ability, you can spend additional clarity to enhance it: Dynamic Power (1 clarity: +Reason to forced movement), Extended Power (1 clarity: +Reason to range), Heightened Power (1 clarity: +Reason damage), Sharpened Power (1 clarity: edge on power roll), Expanded Power (3 clarity: +1 area size), Magnified Power (5 clarity: +Reason to potency), Shared Power (5 clarity: +1 target).',
    category: 'active',
  },
  {
    level: 7,
    name: 'Lucid Mind',
    description:
      'At the start of each of your turns during combat, you gain 1d3 + 1 clarity (instead of 1d3).',
    category: 'resource',
  },
  {
    level: 7,
    name: 'Ancestral Memory',
    description:
      'You can access fragments of memory from past lives. You have an edge on tests to recall lore or recognize creatures, objects, or locations.',
    category: 'passive',
  },
  {
    level: 9,
    name: 'Fortress of Perfect Thought',
    description:
      '+21 Stamina. You have psychic immunity 10. Creatures cannot read your thoughts. Your Reason and Intuition are treated as 2 higher for resisting potency. You cannot be made taunted or frightened.',
    category: 'passive',
  },
  {
    level: 10,
    name: 'Vision',
    description:
      'Gain the Vision epic resource. Upon respite, gain Vision equal to XP gained. Spend Vision to automatically succeed on any test, see through any illusion, or know the exact location of any creature you have met.',
    category: 'epic',
  },
  {
    level: 10,
    name: 'Psion (Clear Mind)',
    description:
      'At the start of each of your turns during combat, you gain 1d3 + 2 clarity (instead of 1d3 + 1). You can choose to not take damage from negative clarity. You can also choose to take any ability\'s strained effect even if you\'re not strained.',
    category: 'resource',
  },
  {
    level: 10,
    name: 'Omniscient Force Move',
    description:
      'When you force move a creature, you gain 3 clarity (instead of 2).',
    category: 'resource',
  },
];

// Get features available at a given level
export function getFeaturesForLevel(level: number): TalentLevelFeature[] {
  return TALENT_LEVEL_FEATURES.filter((f) => f.level <= level);
}

// Get features that unlock at a specific level
export function getFeaturesUnlockedAtLevel(level: number): TalentLevelFeature[] {
  return TALENT_LEVEL_FEATURES.filter((f) => f.level === level);
}

// Calculate Clarity gain at start of turn based on level
// Returns the dice notation
export function getClarityGainDice(level: number): string {
  if (level >= 10) return '1d3 + 2';
  if (level >= 7) return '1d3 + 1';
  return '1d3';
}

// Calculate force move trigger gain based on level
export function getForceMoveGain(level: number): number {
  if (level >= 10) return 3;
  if (level >= 4) return 2;
  return 1;
}

// Calculate minimum clarity (strain threshold) based on Reason
export function getMinimumClarity(reason: number): number {
  return -(1 + reason);
}

// Calculate strain damage based on current clarity (only if negative)
export function getStrainDamage(currentClarity: number): number {
  if (currentClarity >= 0) return 0;
  return Math.abs(currentClarity);
}

// Check if character is strained
export function isStrained(currentClarity: number): boolean {
  return currentClarity < 0;
}
