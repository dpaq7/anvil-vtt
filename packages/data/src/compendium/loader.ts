/**
 * Compendium Data Loaders
 *
 * Lazy-loading functions for compendium data.
 * Use dynamic imports to avoid bundling large JSON files when not needed.
 */

import type { CompendiumData, CompendiumItemBase } from '../types/compendium-item.js';

/**
 * Loader function type
 */
export type CompendiumLoader<T extends CompendiumItemBase = CompendiumItemBase> =
  () => Promise<CompendiumData<T>>;

// Cache for loaded data
const cache = new Map<string, CompendiumData>();

/**
 * Load the consolidated compendium (all data)
 *
 * @returns Promise resolving to all compendium data (1639 items, ~5.5MB)
 */
export async function loadCompendium(): Promise<CompendiumData> {
  if (cache.has('consolidated')) {
    return cache.get('consolidated')!;
  }

  // Dynamic import to avoid bundling if unused
  const module = await import('../../compendium/draw-steel-consolidated.json');
  const data = module.default as CompendiumData;
  cache.set('consolidated', data);
  return data;
}

/**
 * Load hero data only (abilities, features, kits)
 *
 * @returns Promise resolving to hero compendium data (1128 items, ~3.9MB)
 */
export async function loadHeroes(): Promise<CompendiumData> {
  if (cache.has('heroes')) {
    return cache.get('heroes')!;
  }

  const module = await import('../../compendium/draw-steel-heroes.json');
  const data = module.default as CompendiumData;
  cache.set('heroes', data);
  return data;
}

/**
 * Load monster data only (statblocks, features, terrain)
 *
 * @returns Promise resolving to monster compendium data (511 items, ~1.6MB)
 */
export async function loadMonsters(): Promise<CompendiumData> {
  if (cache.has('monsters')) {
    return cache.get('monsters')!;
  }

  const module = await import('../../compendium/draw-steel-monsters.json');
  const data = module.default as CompendiumData;
  cache.set('monsters', data);
  return data;
}

/**
 * Clear the compendium cache
 */
export function clearCache(): void {
  cache.clear();
}

/**
 * Check if data is cached
 */
export function isCached(key: 'consolidated' | 'heroes' | 'monsters'): boolean {
  return cache.has(key);
}
