/**
 * Steel Compendium - Draw Steel TTRPG Data
 *
 * LLM-optimized JSON data for Mettle/Anvil development.
 *
 * @see https://github.com/SteelCompendium
 * @license DRAW STEEL Creator License
 */

// Type for all items in the consolidated data
export interface SteelCompendiumItem {
  _id: string;
  _category: string;
  _subcategory?: string;
  _filename: string;
  _isArray?: boolean;
  name?: string;
  type?: string;
  level?: number;
  [key: string]: unknown;
}

export interface SteelCompendiumMeta {
  description: string;
  usage: string;
  generatedAt: string;
  sourceDirectory: string;
  totalItems: number;
  categories: Record<string, number>;
  errors: string[];
}

export interface SteelCompendiumData {
  _meta: SteelCompendiumMeta;
  items: SteelCompendiumItem[];
}

// Lazy loaders (use dynamic import in components to avoid bundling if unused)
export const loadConsolidated = () =>
  import('./draw-steel-consolidated.json') as Promise<{ default: SteelCompendiumData }>;

export const loadCategory = (category: string) =>
  import(`./draw-steel-${category}.json`) as Promise<{ default: SteelCompendiumData }>;

// Helper to filter items
export function filterItems(
  data: SteelCompendiumData,
  predicate: (item: SteelCompendiumItem) => boolean
): SteelCompendiumItem[] {
  return data.items.filter(predicate);
}

// Helper to find by ID
export function findById(
  data: SteelCompendiumData,
  id: string
): SteelCompendiumItem | undefined {
  return data.items.find(item => item._id === id);
}

// Helper to get all in category
export function getByCategory(
  data: SteelCompendiumData,
  category: string
): SteelCompendiumItem[] {
  return data.items.filter(item => item._category === category);
}

// Helper to get items by type (e.g., 'statblock', 'feature', 'ability')
export function getByType(
  data: SteelCompendiumData,
  type: string
): SteelCompendiumItem[] {
  return data.items.filter(item => item.type === type);
}

// Helper to search items by name
export function searchByName(
  data: SteelCompendiumData,
  query: string
): SteelCompendiumItem[] {
  const lowerQuery = query.toLowerCase();
  return data.items.filter(item =>
    item.name?.toLowerCase().includes(lowerQuery)
  );
}
