/**
 * Items Module for Draw Steel
 *
 * Ported from Forgesteel (https://github.com/andyaiken/forgesteel)
 * Original work Copyright (c) Andy Aiken, Licensed under GPL-3.0
 */

export { ARMOR_IMBUEMENTS, getArmorImbuementsByLevel } from './imbued-armor.js';
export { WEAPON_IMBUEMENTS, getWeaponImbuementsByLevel } from './imbued-weapons.js';
export { IMPLEMENT_IMBUEMENTS, getImplementImbuementsByLevel } from './imbued-implements.js';

import { ARMOR_IMBUEMENTS } from './imbued-armor.js';
import { WEAPON_IMBUEMENTS } from './imbued-weapons.js';
import { IMPLEMENT_IMBUEMENTS } from './imbued-implements.js';
import type { Imbuement, ImbuementItemType } from '@anvil/types';

/**
 * All imbuements combined
 */
export const ALL_IMBUEMENTS: Imbuement[] = [
  ...ARMOR_IMBUEMENTS,
  ...WEAPON_IMBUEMENTS,
  ...IMPLEMENT_IMBUEMENTS,
];

/**
 * Get imbuements by type
 */
export function getImbuementsByType(type: ImbuementItemType): Imbuement[] {
  return ALL_IMBUEMENTS.filter(i => i.type === type);
}

/**
 * Get imbuements by level
 */
export function getImbuementsByLevel(level: number): Imbuement[] {
  return ALL_IMBUEMENTS.filter(i => i.level === level);
}

/**
 * Get imbuement by ID
 */
export function getImbuementById(id: string): Imbuement | undefined {
  return ALL_IMBUEMENTS.find(i => i.id === id);
}
