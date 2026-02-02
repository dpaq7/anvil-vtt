/**
 * Compendium Search Utilities
 *
 * Helper functions for filtering and searching compendium data.
 */

import type { CompendiumData, CompendiumItemBase } from '../types/compendium-item.js';
import type { CompendiumAbility } from '../types/ability.js';
import type { CompendiumMonster, MonsterRole } from '../types/monster.js';

/**
 * Filter items with a predicate function
 *
 * @example
 * const dragons = filterItems(data, item =>
 *   item._id.includes('dragons') && item.type === 'statblock'
 * );
 */
export function filterItems<T extends CompendiumItemBase>(
  data: CompendiumData<T>,
  predicate: (item: T) => boolean
): T[] {
  return data.items.filter(predicate);
}

/**
 * Find a single item by its ID
 *
 * @example
 * const thornDragon = findById(data, 'monsters/monsters/dragons/statblocks/thorn_dragon');
 */
export function findById<T extends CompendiumItemBase>(
  data: CompendiumData<T>,
  id: string
): T | undefined {
  return data.items.find((item) => item._id === id);
}

/**
 * Get all items in a category
 *
 * @example
 * const heroItems = getByCategory(data, 'heroes');
 */
export function getByCategory<T extends CompendiumItemBase>(
  data: CompendiumData<T>,
  category: 'heroes' | 'monsters'
): T[] {
  return data.items.filter((item) => item._category === category);
}

/**
 * Get items by type (e.g., 'statblock', 'feature', 'ability')
 *
 * @example
 * const statblocks = getByType(data, 'statblock');
 */
export function getByType<T extends CompendiumItemBase>(
  data: CompendiumData<T>,
  type: string
): T[] {
  return data.items.filter((item) => item.type === type);
}

/**
 * Search items by name (case-insensitive)
 *
 * @example
 * const matches = searchByName(data, 'dragon');
 */
export function searchByName<T extends CompendiumItemBase>(
  data: CompendiumData<T>,
  query: string
): T[] {
  const lowerQuery = query.toLowerCase();
  return data.items.filter((item) => item.name?.toLowerCase().includes(lowerQuery));
}

/**
 * Get abilities for a specific hero class
 *
 * @example
 * const furyAbilities = getAbilitiesByClass(data, 'fury');
 */
export function getAbilitiesByClass(
  data: CompendiumData,
  heroClass: string
): CompendiumAbility[] {
  const lowerClass = heroClass.toLowerCase();
  return data.items.filter((item): item is CompendiumAbility => {
    if (item._category !== 'heroes' || item.type !== 'feature') return false;
    // Check subcategory path
    if (item._subcategory?.toLowerCase().includes(lowerClass)) return true;
    // Check metadata
    const ability = item as CompendiumAbility;
    if (ability.metadata?.class?.toLowerCase() === lowerClass) return true;
    return false;
  });
}

/**
 * Get monsters by role
 *
 * @example
 * const minions = getMonstersByRole(data, 'Minion');
 * const solos = getMonstersByRole(data, 'Solo');
 */
export function getMonstersByRole(
  data: CompendiumData,
  role: MonsterRole | string
): CompendiumMonster[] {
  const lowerRole = role.toLowerCase();
  return data.items.filter((item): item is CompendiumMonster => {
    if (item._category !== 'monsters' || item.type !== 'statblock') return false;
    const monster = item as CompendiumMonster;
    return monster.roles?.some((r) => r.toLowerCase().includes(lowerRole)) ?? false;
  });
}

/**
 * Get monsters by level (exact match or range)
 *
 * @example
 * const level3Monsters = getMonstersByLevel(data, 3);
 * const midLevelMonsters = getMonstersByLevel(data, 3, 6);
 */
export function getMonstersByLevel(
  data: CompendiumData,
  minLevel: number,
  maxLevel?: number
): CompendiumMonster[] {
  const max = maxLevel ?? minLevel;
  return data.items.filter((item): item is CompendiumMonster => {
    if (item._category !== 'monsters' || item.type !== 'statblock') return false;
    const level = item.level ?? 0;
    return level >= minLevel && level <= max;
  });
}

/**
 * Get all unique keywords from abilities
 */
export function getAllKeywords(data: CompendiumData): string[] {
  const keywords = new Set<string>();
  for (const item of data.items) {
    if (item._category === 'heroes' && item.type === 'feature') {
      const ability = item as CompendiumAbility;
      ability.keywords?.forEach((k) => keywords.add(k));
    }
  }
  return Array.from(keywords).sort();
}

/**
 * Get all unique monster roles
 */
export function getAllMonsterRoles(data: CompendiumData): string[] {
  const roles = new Set<string>();
  for (const item of data.items) {
    if (item._category === 'monsters' && item.type === 'statblock') {
      const monster = item as CompendiumMonster;
      monster.roles?.forEach((r) => roles.add(r));
    }
  }
  return Array.from(roles).sort();
}

/**
 * Get abilities by keyword
 *
 * @example
 * const meleeAbilities = getAbilitiesByKeyword(data, 'Melee');
 */
export function getAbilitiesByKeyword(
  data: CompendiumData,
  keyword: string
): CompendiumAbility[] {
  const lowerKeyword = keyword.toLowerCase();
  return data.items.filter((item): item is CompendiumAbility => {
    if (item._category !== 'heroes' || item.type !== 'feature') return false;
    const ability = item as CompendiumAbility;
    return ability.keywords?.some((k) => k.toLowerCase() === lowerKeyword) ?? false;
  });
}
