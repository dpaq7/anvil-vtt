/**
 * Base compendium item types
 *
 * All items in the compendium share these base fields.
 */

/**
 * Base interface for all compendium items
 */
export interface CompendiumItemBase {
  /** Unique path-based identifier (e.g., "monsters/monsters/dragons/statblocks/thorn_dragon") */
  _id: string;
  /** Top-level category: "heroes" or "monsters" */
  _category: 'heroes' | 'monsters';
  /** Original filename without extension */
  _filename: string;
  /** Sub-folder path if nested (e.g., "abilities/censor/1stlevel_features") */
  _subcategory?: string;
  /** Whether this item was originally an array */
  _isArray?: boolean;
  /** Display name */
  name?: string;
  /** Item type (e.g., "statblock", "feature", "ability") */
  type?: string;
  /** Level of the item */
  level?: number;
}

/**
 * Metadata about the compendium data
 */
export interface CompendiumMeta {
  description: string;
  usage: string;
  generatedAt: string;
  sourceDirectory: string;
  totalItems: number;
  categories: Record<string, number>;
  errors: string[];
}

/**
 * Category-specific metadata
 */
export interface CompendiumCategoryMeta {
  description: string;
  category: string;
  totalItems: number;
  generatedAt: string;
}

/**
 * Full compendium data structure
 */
export interface CompendiumData<T extends CompendiumItemBase = CompendiumItemBase> {
  _meta: CompendiumMeta | CompendiumCategoryMeta;
  items: T[];
}
