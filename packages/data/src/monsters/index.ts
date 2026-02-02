/**
 * Supplementary Monsters for Draw Steel
 *
 * Ported from Forgesteel (https://github.com/andyaiken/forgesteel)
 * Original work Copyright (c) Andy Aiken, Licensed under GPL-3.0
 *
 * These monsters supplement the main compendium data with creatures
 * not present in the core monsters.json file.
 */

// Lightbender monsters
export {
  LIGHTBENDER,
  LIGHTBENDER_POUNCER,
  LIGHTBENDER_MONSTERS,
  LIGHTBENDER_LORE,
} from './lightbender.js';

// Civilian NPCs
export {
  CIVILIAN,
  CIVILIAN_NPCS,
} from './civilian.js';

// Retainer companions
export {
  ANGULOTL_HOPPER,
  GOBLIN_GUIDE,
  HUMAN_HEALER,
  WODE_ELF_ARCHER,
  OGRE_BRUISER,
  RETAINER_MONSTERS,
  RETAINER_RULES,
  getRetainerByName,
  getAllRetainers,
} from './retainers.js';

// Re-export all monsters combined
import { LIGHTBENDER_MONSTERS } from './lightbender.js';
import { CIVILIAN_NPCS } from './civilian.js';
import { RETAINER_MONSTERS } from './retainers.js';
import type { CompendiumMonster } from '../types/monster.js';

/**
 * All supplementary monsters from Forgesteel
 */
export const FORGESTEEL_MONSTERS: CompendiumMonster[] = [
  ...LIGHTBENDER_MONSTERS,
  ...CIVILIAN_NPCS,
  ...RETAINER_MONSTERS,
];

/**
 * Get supplementary monster by name
 */
export function getForgesteelMonsterByName(name: string): CompendiumMonster | undefined {
  return FORGESTEEL_MONSTERS.find(m => m.name.toLowerCase() === name.toLowerCase());
}

/**
 * Get all supplementary monsters
 */
export function getAllForgesteelMonsters(): CompendiumMonster[] {
  return FORGESTEEL_MONSTERS;
}
