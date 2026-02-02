/**
 * Imbuement Types for Draw Steel
 *
 * Ported from Forgesteel (https://github.com/andyaiken/forgesteel)
 * Original work Copyright (c) Andy Aiken
 * Licensed under GPL-3.0
 *
 * Imbuements are magical enhancements that can be added to armor,
 * weapons, and implements, giving them special properties.
 */

import type { Feature } from './feature.js';

/**
 * The type of item an imbuement can be applied to
 */
export type ImbuementItemType = 'armor' | 'weapon' | 'implement';

/**
 * Echelon levels for imbuements (determines power level)
 */
export type ImbuementEchelon = 1 | 2 | 3 | 4;

/**
 * Base imbuement definition
 */
export interface Imbuement {
  /** Unique identifier (kebab-case) */
  id: string;

  /** Display name */
  name: string;

  /** Flavor description of the imbuement */
  description: string;

  /** Which item type this imbuement applies to */
  type: ImbuementItemType;

  /** Power level (1-4) */
  level: number;

  /** The feature/effect granted by this imbuement */
  feature: Feature;

  /**
   * Optional crafting project to create this imbuement
   * @see Project in projects.ts
   */
  craftingProjectId?: string;
}

/**
 * Armor imbuement - magical enchantments for armor
 */
export interface ArmorImbuement extends Imbuement {
  type: 'armor';
}

/**
 * Weapon imbuement - magical enchantments for weapons
 */
export interface WeaponImbuement extends Imbuement {
  type: 'weapon';
}

/**
 * Implement imbuement - magical enchantments for implements
 */
export interface ImplementImbuement extends Imbuement {
  type: 'implement';
}

/**
 * An imbuement applied to a specific item
 */
export interface AppliedImbuement {
  /** Reference to the imbuement definition */
  imbuementId: string;

  /** Optional: ID of the item this is applied to */
  itemId?: string;

  /** Whether this imbuement is currently active (for items with toggle effects) */
  isActive?: boolean;

  /** Optional notes about this specific application */
  notes?: string;
}

/**
 * Imbuements grouped by item type for easy access
 */
export interface ImbuementsByType {
  armor: ArmorImbuement[];
  weapon: WeaponImbuement[];
  implement: ImplementImbuement[];
}

/**
 * Imbuements grouped by echelon level
 */
export type ImbuementsByEchelon = Record<ImbuementEchelon, Imbuement[]>;

// ---------------------------------------------------------------------------
// Type Guards
// ---------------------------------------------------------------------------

export function isArmorImbuement(imbuement: Imbuement): imbuement is ArmorImbuement {
  return imbuement.type === 'armor';
}

export function isWeaponImbuement(imbuement: Imbuement): imbuement is WeaponImbuement {
  return imbuement.type === 'weapon';
}

export function isImplementImbuement(imbuement: Imbuement): imbuement is ImplementImbuement {
  return imbuement.type === 'implement';
}
