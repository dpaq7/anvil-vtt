import type { ClassPerkProgression, PerkCategory, HeroClass } from '@anvil/types';
import { ALL_PERK_CATEGORIES } from './perk-categories.js';

/**
 * Per-class perk progression configuration
 * Based on Draw Steel class features
 */
export const CLASS_PERK_PROGRESSIONS: Record<HeroClass, ClassPerkProgression> = {
  censor: {
    perkLevels: [2, 4, 6, 8, 10],
    restrictions: {
      2: ['exploration', 'interpersonal', 'intrigue'],
      4: 'any',
      6: ['exploration', 'interpersonal', 'intrigue'],
      8: 'any',
      10: ['exploration', 'interpersonal', 'intrigue'],
    },
  },
  conduit: {
    perkLevels: [2, 4, 6, 8, 10],
    restrictions: {
      2: ['crafting', 'lore', 'supernatural'],
      4: 'any',
      6: ['crafting', 'lore', 'supernatural'],
      8: 'any',
      10: ['crafting', 'lore', 'supernatural'],
    },
  },
  elementalist: {
    perkLevels: [2, 4, 6, 8, 10],
    restrictions: {
      2: ['crafting', 'lore', 'supernatural'],
      4: 'any',
      6: ['crafting', 'lore', 'supernatural'],
      8: 'any',
      10: ['crafting', 'lore', 'supernatural'],
    },
  },
  fury: {
    perkLevels: [2, 4, 6, 8, 10],
    restrictions: {
      2: ['crafting', 'exploration', 'intrigue'],
      4: 'any',
      6: ['crafting', 'exploration', 'intrigue'],
      8: 'any',
      10: ['crafting', 'exploration', 'intrigue'],
    },
  },
  null: {
    perkLevels: [2, 4, 6, 8, 10],
    restrictions: {
      2: ['exploration', 'interpersonal', 'intrigue'],
      4: 'any',
      6: ['exploration', 'interpersonal', 'intrigue'],
      8: 'any',
      10: ['exploration', 'interpersonal', 'intrigue'],
    },
  },
  shadow: {
    perkLevels: [2, 4, 6, 8, 10],
    restrictions: {
      2: 'any',
      4: 'any',
      6: 'any',
      8: 'any',
      10: 'any',
    },
  },
  summoner: {
    perkLevels: [2, 4, 6, 8, 10],
    restrictions: {
      2: ['crafting', 'lore', 'supernatural'],
      4: 'any',
      6: ['crafting', 'lore', 'supernatural'],
      8: 'any',
      10: ['crafting', 'lore', 'supernatural'],
    },
  },
  tactician: {
    perkLevels: [2, 4, 6, 8, 10],
    restrictions: {
      2: ['exploration', 'interpersonal', 'intrigue'],
      4: 'any',
      6: ['exploration', 'interpersonal', 'intrigue'],
      8: 'any',
      10: ['exploration', 'interpersonal', 'intrigue'],
    },
  },
  talent: {
    perkLevels: [2, 4, 6, 8, 10],
    restrictions: {
      2: ['interpersonal', 'lore', 'supernatural'],
      4: 'any',
      6: ['interpersonal', 'lore', 'supernatural'],
      8: 'any',
      10: ['interpersonal', 'lore', 'supernatural'],
    },
  },
  troubadour: {
    perkLevels: [2, 4, 6, 8, 10],
    restrictions: {
      2: ['interpersonal', 'lore', 'supernatural'],
      4: 'any',
      6: ['interpersonal', 'lore', 'supernatural'],
      8: 'any',
      10: ['interpersonal', 'lore', 'supernatural'],
    },
  },
};

/**
 * Get available perk categories for a class at a specific level
 */
export function getAvailablePerkCategories(
  heroClass: HeroClass,
  level: number
): PerkCategory[] {
  const progression = CLASS_PERK_PROGRESSIONS[heroClass];
  const restriction = progression.restrictions[level];

  if (!restriction || restriction === 'any') {
    return ALL_PERK_CATEGORIES;
  }

  return restriction;
}

/**
 * Check if a class gains a perk at a specific level
 */
export function classPerkAtLevel(heroClass: HeroClass, level: number): boolean {
  return CLASS_PERK_PROGRESSIONS[heroClass].perkLevels.includes(level);
}

/**
 * Get all levels at which a class gains perks
 */
export function getClassPerkLevels(heroClass: HeroClass): number[] {
  return CLASS_PERK_PROGRESSIONS[heroClass].perkLevels;
}
