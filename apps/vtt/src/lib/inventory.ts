import { ALL_IMBUEMENTS, ALL_MAGIC_ITEMS } from '@anvil/data';
import type { MagicItem } from '@anvil/data';
import type { Imbuement } from '@anvil/types';

export type CharacterInventorySource = 'mcdm-treasure' | 'mcdm-imbuement' | 'custom';

export type CharacterInventoryCategory =
  | 'consumable'
  | 'trinket'
  | 'leveled'
  | 'artifact'
  | 'imbuement'
  | 'material'
  | 'mundane'
  | 'misc';

export interface CharacterInventoryEnhancement {
  level: number;
  name?: string;
  description: string;
}

export interface CharacterInventoryItem {
  id: string;
  catalogId?: string;
  source: CharacterInventorySource;
  name: string;
  category: CharacterInventoryCategory;
  quantity: number;
  description: string;
  effect?: string;
  flavorText?: string;
  echelon?: number;
  level?: number;
  slot?: string;
  keywords?: string[];
  projectGoal?: number;
  equipped?: boolean;
  enhancements?: CharacterInventoryEnhancement[];
  notes?: string;
}

export interface InventoryCatalogItem {
  id: string;
  itemId: string;
  source: CharacterInventorySource;
  name: string;
  category: CharacterInventoryCategory;
  description: string;
  effect?: string;
  flavorText?: string;
  echelon?: number;
  level?: number;
  slot?: string;
  keywords: string[];
  projectGoal?: number;
  enhancements?: CharacterInventoryEnhancement[];
  searchText: string;
}

export const INVENTORY_CATEGORY_LABELS: Record<CharacterInventoryCategory, string> = {
  consumable: 'Consumable',
  trinket: 'Trinket',
  leveled: 'Leveled',
  artifact: 'Artifact',
  imbuement: 'Imbuement',
  material: 'Material',
  mundane: 'Mundane',
  misc: 'Misc',
};

export const INVENTORY_SOURCE_LABELS: Record<CharacterInventorySource, string> = {
  'mcdm-treasure': 'MCDM Treasure',
  'mcdm-imbuement': 'MCDM Imbuement',
  custom: 'Custom',
};

export const INVENTORY_CATEGORIES = Object.keys(INVENTORY_CATEGORY_LABELS) as CharacterInventoryCategory[];

function catalogSearchText(parts: Array<string | number | null | undefined>): string {
  return parts
    .filter((part): part is string | number => part !== null && part !== undefined && String(part).trim().length > 0)
    .join(' ')
    .toLowerCase();
}

function magicItemToCatalogItem(item: MagicItem): InventoryCatalogItem {
  const keywords = item.keywords ?? [];
  const enhancements = item.enhancements?.map((enhancement) => ({
    level: enhancement.level,
    name: `Level ${enhancement.level}`,
    description: enhancement.effect,
  }));

  return {
    id: `mcdm-treasure:${item.id}`,
    itemId: item.id,
    source: 'mcdm-treasure',
    name: item.name,
    category: item.category,
    description: item.flavorText ?? item.effect,
    effect: item.effect,
    flavorText: item.flavorText,
    echelon: item.echelon,
    slot: item.slot,
    keywords,
    projectGoal: item.projectGoal,
    enhancements,
    searchText: catalogSearchText([
      item.name,
      item.category,
      item.echelon,
      item.slot,
      item.effect,
      item.flavorText,
      ...keywords,
    ]),
  };
}

function imbuementToCatalogItem(imbuement: Imbuement): InventoryCatalogItem {
  const effect = imbuement.feature.description;
  const keywords = ['Imbuement', titleCase(imbuement.type)];

  return {
    id: `mcdm-imbuement:${imbuement.id}`,
    itemId: imbuement.id,
    source: 'mcdm-imbuement',
    name: imbuement.name,
    category: 'imbuement',
    description: imbuement.description,
    effect,
    level: imbuement.level,
    slot: imbuement.type,
    keywords,
    searchText: catalogSearchText([
      imbuement.name,
      'imbuement',
      imbuement.type,
      imbuement.level,
      imbuement.description,
      effect,
    ]),
  };
}

export const MCDM_INVENTORY_CATALOG: InventoryCatalogItem[] = [
  ...ALL_MAGIC_ITEMS.map(magicItemToCatalogItem),
  ...ALL_IMBUEMENTS.map(imbuementToCatalogItem),
].sort((a, b) => {
  const sourceSort = sourceSortValue(a.source) - sourceSortValue(b.source);
  if (sourceSort !== 0) return sourceSort;
  const categorySort = categorySortValue(a.category) - categorySortValue(b.category);
  if (categorySort !== 0) return categorySort;
  const echelonSort = (a.echelon ?? a.level ?? 0) - (b.echelon ?? b.level ?? 0);
  if (echelonSort !== 0) return echelonSort;
  return a.name.localeCompare(b.name);
});

export function createInventoryItemFromCatalog(item: InventoryCatalogItem): CharacterInventoryItem {
  return {
    id: makeInventoryId(item.itemId),
    catalogId: item.id,
    source: item.source,
    name: item.name,
    category: item.category,
    quantity: 1,
    description: item.description,
    effect: item.effect,
    flavorText: item.flavorText,
    echelon: item.echelon,
    level: item.level,
    slot: item.slot,
    keywords: item.keywords,
    projectGoal: item.projectGoal,
    enhancements: item.enhancements,
    equipped: false,
  };
}

export function normalizeInventory(value: unknown): CharacterInventoryItem[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item, index): CharacterInventoryItem[] => {
    if (!isRecord(item)) return [];

    const name = stringValue(item['name']);
    if (!name) return [];

    const category = normalizeCategory(item['category']);
    const source = normalizeSource(item['source']);
    const quantity = positiveInteger(item['quantity']) ?? 1;
    const description = stringValue(item['description']) ?? stringValue(item['effect']) ?? '';
    const effect = stringValue(item['effect']) ?? undefined;
    const flavorText = stringValue(item['flavorText']) ?? undefined;
    const echelon = positiveInteger(item['echelon']) ?? undefined;
    const level = positiveInteger(item['level']) ?? undefined;
    const slot = stringValue(item['slot']) ?? undefined;
    const projectGoal = positiveInteger(item['projectGoal']) ?? undefined;
    const keywords = stringArray(item['keywords']);
    const notes = stringValue(item['notes']) ?? undefined;
    const enhancements = normalizeEnhancements(item['enhancements']);
    const catalogId = stringValue(item['catalogId']) ?? undefined;
    const id = stringValue(item['id']) ?? makeInventoryId(`${slugify(name)}-${index}`);

    return [{
      id,
      catalogId,
      source,
      name,
      category,
      quantity,
      description,
      effect,
      flavorText,
      echelon,
      level,
      slot,
      keywords,
      projectGoal,
      equipped: item['equipped'] === true,
      enhancements,
      notes,
    }];
  });
}

export function addCatalogItemToInventory(
  inventory: CharacterInventoryItem[],
  catalogItem: InventoryCatalogItem,
): CharacterInventoryItem[] {
  const nextItem = createInventoryItemFromCatalog(catalogItem);
  const existingIndex = inventory.findIndex((item) => item.catalogId === nextItem.catalogId && !item.equipped);
  if (existingIndex === -1) return [...inventory, nextItem];

  return inventory.map((item, index) => (
    index === existingIndex
      ? { ...item, quantity: item.quantity + 1 }
      : item
  ));
}

export function canEquipInventoryItem(item: CharacterInventoryItem): boolean {
  if (item.category === 'consumable' || item.category === 'material' || item.category === 'mundane' || item.category === 'misc') {
    return false;
  }
  return Boolean(item.slot) || item.category === 'trinket' || item.category === 'leveled' || item.category === 'artifact' || item.category === 'imbuement';
}

export function inventoryMetaLine(item: CharacterInventoryItem): string {
  return [
    INVENTORY_SOURCE_LABELS[item.source],
    INVENTORY_CATEGORY_LABELS[item.category],
    item.echelon ? `Echelon ${item.echelon}` : null,
    item.level ? `Level ${item.level}` : null,
    item.slot ? titleCase(item.slot) : null,
  ]
    .filter(Boolean)
    .join(' / ');
}

function normalizeCategory(value: unknown): CharacterInventoryCategory {
  if (typeof value !== 'string') return 'misc';
  if (INVENTORY_CATEGORIES.includes(value as CharacterInventoryCategory)) {
    return value as CharacterInventoryCategory;
  }
  if (value === 'treasure') return 'misc';
  return 'misc';
}

function normalizeSource(value: unknown): CharacterInventorySource {
  if (value === 'mcdm-treasure' || value === 'mcdm-imbuement' || value === 'custom') return value;
  return 'custom';
}

function normalizeEnhancements(value: unknown): CharacterInventoryEnhancement[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const enhancements = value.flatMap((item): CharacterInventoryEnhancement[] => {
    if (!isRecord(item)) return [];
    const level = positiveInteger(item['level']);
    const description = stringValue(item['description']) ?? stringValue(item['effect']);
    if (!level || !description) return [];
    return [{
      level,
      name: stringValue(item['name']) ?? undefined,
      description,
    }];
  });
  return enhancements.length > 0 ? enhancements : undefined;
}

function sourceSortValue(value: CharacterInventorySource): number {
  if (value === 'mcdm-treasure') return 0;
  if (value === 'mcdm-imbuement') return 1;
  return 2;
}

function categorySortValue(value: CharacterInventoryCategory): number {
  const index = INVENTORY_CATEGORIES.indexOf(value);
  return index === -1 ? INVENTORY_CATEGORIES.length : index;
}

function positiveInteger(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.max(1, Math.floor(value));
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return Math.max(1, Math.floor(parsed));
  }
  return null;
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function makeInventoryId(seed: string): string {
  const random = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `inv-${slugify(seed)}-${random}`;
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function titleCase(value: string): string {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase());
}
