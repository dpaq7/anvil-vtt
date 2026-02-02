// Growing Ferocity tier definitions
// Benefits differ by Aspect AND level
import type { FuryAspect } from '@anvil/types';

export interface GrowingFerocityTier {
  id: string;
  ferocityRequired: number;
  levelRequired: number; // 1, 4, 7, or 10
  name: string;
  benefit: string;
  mechanicalEffect?: string; // For programmatic use
}

// Berserker Growing Ferocity Tiers
export const berserkerTiers: GrowingFerocityTier[] = [
  {
    id: 'berserker-2',
    ferocityRequired: 2,
    levelRequired: 1,
    name: 'Knockback Enhancement',
    benefit: 'Forced movement distance gains a bonus equal to your Might score.',
    mechanicalEffect: '+Might to forced movement',
  },
  {
    id: 'berserker-4',
    ferocityRequired: 4,
    levelRequired: 1,
    name: 'Surge Generation',
    benefit: 'Gain 1 surge the first time you push a creature on your turn.',
    mechanicalEffect: '+1 surge on push',
  },
  {
    id: 'berserker-6',
    ferocityRequired: 6,
    levelRequired: 1,
    name: 'Might Mastery',
    benefit: 'You have an edge on Might tests and the Knockback maneuver.',
    mechanicalEffect: 'edge on Might tests and Knockback',
  },
  {
    id: 'berserker-8',
    ferocityRequired: 8,
    levelRequired: 4,
    name: 'Improved Surge Generation',
    benefit: 'Gain 2 surges (instead of 1) the first time you push a creature on your turn.',
    mechanicalEffect: '+2 surges on push',
  },
  {
    id: 'berserker-10',
    ferocityRequired: 10,
    levelRequired: 7,
    name: 'Greater Might Mastery',
    benefit: 'You have a double edge on Might tests and the Knockback maneuver.',
    mechanicalEffect: 'double edge on Might tests and Knockback',
  },
  {
    id: 'berserker-12',
    ferocityRequired: 12,
    levelRequired: 10,
    name: 'Heroic Vigor & Force',
    benefit: 'Gain 10 temporary Stamina after using a heroic ability. Forced movement distance gains an additional bonus equal to your Might score.',
    mechanicalEffect: '+10 temp Stamina on heroic; +Might x2 to forced movement',
  },
];

// Reaver Growing Ferocity Tiers
export const reaverTiers: GrowingFerocityTier[] = [
  {
    id: 'reaver-2',
    ferocityRequired: 2,
    levelRequired: 1,
    name: 'Knockback Enhancement',
    benefit: 'Forced movement distance gains a bonus equal to your Agility score.',
    mechanicalEffect: '+Agility to forced movement',
  },
  {
    id: 'reaver-4',
    ferocityRequired: 4,
    levelRequired: 1,
    name: 'Surge Generation',
    benefit: 'Gain 1 surge the first time you slide a creature on your turn.',
    mechanicalEffect: '+1 surge on slide',
  },
  {
    id: 'reaver-6',
    ferocityRequired: 6,
    levelRequired: 1,
    name: 'Agility Mastery',
    benefit: 'You have an edge on Agility tests and the Knockback maneuver.',
    mechanicalEffect: 'edge on Agility tests and Knockback',
  },
  {
    id: 'reaver-8',
    ferocityRequired: 8,
    levelRequired: 4,
    name: 'Improved Surge Generation',
    benefit: 'Gain 2 surges (instead of 1) the first time you slide a creature on your turn.',
    mechanicalEffect: '+2 surges on slide',
  },
  {
    id: 'reaver-10',
    ferocityRequired: 10,
    levelRequired: 7,
    name: 'Greater Agility Mastery',
    benefit: 'You have a double edge on Agility tests and the Knockback maneuver.',
    mechanicalEffect: 'double edge on Agility tests and Knockback',
  },
  {
    id: 'reaver-12',
    ferocityRequired: 12,
    levelRequired: 10,
    name: 'Heroic Vigor & Force',
    benefit: 'Gain 10 temporary Stamina after using a heroic ability. Forced movement distance gains an additional bonus equal to your Agility score.',
    mechanicalEffect: '+10 temp Stamina on heroic; +Agility x2 to forced movement',
  },
];

// Stormwight Growing Ferocity Tiers (uses Might like Berserker, but different benefits)
export const stormwightTiers: GrowingFerocityTier[] = [
  {
    id: 'stormwight-2',
    ferocityRequired: 2,
    levelRequired: 1,
    name: 'Storm Surge',
    benefit: 'Your Primordial Storm damage increases by your Might score.',
    mechanicalEffect: '+Might to Primordial Storm damage',
  },
  {
    id: 'stormwight-4',
    ferocityRequired: 4,
    levelRequired: 1,
    name: 'Furious Change',
    benefit: 'When you take damage while in animal or hybrid form, you can make a free strike as a free triggered action.',
    mechanicalEffect: 'free strike when damaged in form',
  },
  {
    id: 'stormwight-6',
    ferocityRequired: 6,
    levelRequired: 1,
    name: 'Primal Speed',
    benefit: 'Your speed increases by 2 while in animal or hybrid form.',
    mechanicalEffect: '+2 speed in form',
  },
  {
    id: 'stormwight-8',
    ferocityRequired: 8,
    levelRequired: 4,
    name: 'Storm Aura',
    benefit: 'While in animal or hybrid form, enemies that start their turn adjacent to you take Primordial Storm damage equal to your Might score.',
    mechanicalEffect: 'adjacent enemies take Might Primordial Storm damage',
  },
  {
    id: 'stormwight-10',
    ferocityRequired: 10,
    levelRequired: 7,
    name: 'Apex Predator',
    benefit: 'Your strikes while in animal or hybrid form deal additional Primordial Storm damage equal to your Might score.',
    mechanicalEffect: '+Might Primordial Storm damage on strikes',
  },
  {
    id: 'stormwight-12',
    ferocityRequired: 12,
    levelRequired: 10,
    name: 'Embodiment of the Storm',
    benefit: 'You gain immunity to your Primordial Storm damage type. When you shift forms, each enemy within 3 squares takes Primordial Storm damage equal to twice your Might score.',
    mechanicalEffect: 'Primordial Storm immunity; 2xMight damage on form shift',
  },
];

// Get tiers for a specific aspect
export const getTiersForAspect = (aspect: FuryAspect): GrowingFerocityTier[] => {
  switch (aspect) {
    case 'berserker':
      return berserkerTiers;
    case 'reaver':
      return reaverTiers;
    case 'stormwight':
      return stormwightTiers;
  }
};

// Get active tiers based on current ferocity and level
export const getActiveTiers = (
  aspect: FuryAspect,
  currentFerocity: number,
  heroLevel: number
): GrowingFerocityTier[] => {
  const allTiers = getTiersForAspect(aspect);
  return allTiers.filter(
    tier => tier.ferocityRequired <= currentFerocity && tier.levelRequired <= heroLevel
  );
};

// Get the next tier to unlock
export const getNextTier = (
  aspect: FuryAspect,
  currentFerocity: number,
  heroLevel: number
): GrowingFerocityTier | null => {
  const allTiers = getTiersForAspect(aspect);
  const nextTier = allTiers.find(
    tier => tier.ferocityRequired > currentFerocity && tier.levelRequired <= heroLevel
  );
  return nextTier || null;
};

// Get locked tiers (available at higher levels)
export const getLockedTiers = (
  aspect: FuryAspect,
  heroLevel: number
): GrowingFerocityTier[] => {
  const allTiers = getTiersForAspect(aspect);
  return allTiers.filter(tier => tier.levelRequired > heroLevel);
};
