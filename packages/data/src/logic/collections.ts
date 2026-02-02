/**
 * Collections Utilities
 *
 * Minimal, dependency-free array utilities for the Logic Layer.
 * Prefer native Array methods where possible.
 */

/**
 * Sum values from an array using a selector function.
 *
 * @param arr - The array to sum
 * @param selector - Function to extract numeric value from each item
 * @returns The sum of all selected values
 *
 * @example
 * const total = sum(items, item => item.value);
 * const damage = sum(effects, e => e.damage ?? 0);
 */
export function sum<T>(arr: T[], selector: (item: T) => number): number {
  return arr.reduce((acc, item) => acc + selector(item), 0);
}

/**
 * Find the item with the maximum value according to a selector.
 *
 * @param arr - The array to search
 * @param selector - Function to extract numeric value for comparison
 * @returns The item with the highest value, or null if array is empty
 *
 * @example
 * const strongest = max(heroes, h => h.characteristics.might);
 * const fastest = max(combatants, c => c.initiative);
 */
export function max<T>(arr: T[], selector: (item: T) => number): T | null {
  if (arr.length === 0) return null;

  let maxItem = arr[0];
  let maxValue = selector(maxItem);

  for (let i = 1; i < arr.length; i++) {
    const value = selector(arr[i]);
    if (value > maxValue) {
      maxValue = value;
      maxItem = arr[i];
    }
  }

  return maxItem;
}

/**
 * Find the item with the minimum value according to a selector.
 *
 * @param arr - The array to search
 * @param selector - Function to extract numeric value for comparison
 * @returns The item with the lowest value, or null if array is empty
 *
 * @example
 * const weakest = min(enemies, e => e.stamina.current);
 * const closest = min(targets, t => t.distance);
 */
export function min<T>(arr: T[], selector: (item: T) => number): T | null {
  if (arr.length === 0) return null;

  let minItem = arr[0];
  let minValue = selector(minItem);

  for (let i = 1; i < arr.length; i++) {
    const value = selector(arr[i]);
    if (value < minValue) {
      minValue = value;
      minItem = arr[i];
    }
  }

  return minItem;
}

/**
 * Remove duplicates from an array based on a key function.
 *
 * @param arr - The array to deduplicate
 * @param key - Function to extract a unique key from each item
 * @returns Array with duplicates removed (keeps first occurrence)
 *
 * @example
 * const uniqueById = distinct(items, item => item.id);
 * const uniqueByName = distinct(features, f => f.name);
 */
export function distinct<T, K>(arr: T[], key: (item: T) => K): T[] {
  const seen = new Set<K>();
  const result: T[] = [];

  for (const item of arr) {
    const k = key(item);
    if (!seen.has(k)) {
      seen.add(k);
      result.push(item);
    }
  }

  return result;
}

/**
 * Group array items by a key function.
 *
 * @param arr - The array to group
 * @param key - Function to extract group key from each item
 * @returns Object mapping keys to arrays of items
 *
 * @example
 * const byType = groupBy(entities, e => e.type);
 * const byLevel = groupBy(abilities, a => a.level);
 */
export function groupBy<T, K extends string | number>(
  arr: T[],
  key: (item: T) => K
): Record<K, T[]> {
  const result = {} as Record<K, T[]>;

  for (const item of arr) {
    const k = key(item);
    if (!result[k]) {
      result[k] = [];
    }
    result[k].push(item);
  }

  return result;
}

/**
 * Count items matching a predicate.
 *
 * @param arr - The array to count in
 * @param predicate - Function that returns true for items to count
 * @returns Number of items matching the predicate
 *
 * @example
 * const woundedCount = count(heroes, h => h.stamina.current < h.stamina.max);
 * const minionCount = count(enemies, e => e.data.isMinion);
 */
export function count<T>(arr: T[], predicate: (item: T) => boolean): number {
  let n = 0;
  for (const item of arr) {
    if (predicate(item)) n++;
  }
  return n;
}

/**
 * Find first item matching a predicate, or return default.
 *
 * @param arr - The array to search
 * @param predicate - Function that returns true for the target item
 * @param defaultValue - Value to return if no match found
 * @returns The first matching item or default value
 *
 * @example
 * const hero = findOrDefault(entities, e => e.id === heroId, null);
 */
export function findOrDefault<T>(
  arr: T[],
  predicate: (item: T) => boolean,
  defaultValue: T | null
): T | null {
  for (const item of arr) {
    if (predicate(item)) return item;
  }
  return defaultValue;
}
