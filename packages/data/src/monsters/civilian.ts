/**
 * Civilian NPC Statblock for Draw Steel
 *
 * Ported from Forgesteel (https://github.com/andyaiken/forgesteel)
 * Original work Copyright (c) Andy Aiken, Licensed under GPL-3.0
 *
 * A simple level 0 NPC for non-combat civilians.
 */

import type { CompendiumMonster } from '../types/monster.js';

/**
 * Civilian (Level 0, No Role)
 *
 * Use for:
 * - Bystanders in combat scenes
 * - Hostages to rescue
 * - Fleeing townsfolk
 * - Non-combat NPCs
 */
export const CIVILIAN: CompendiumMonster = {
  _id: 'forgesteel/monsters/civilian',
  _category: 'monsters',
  _filename: 'civilian',
  type: 'statblock',
  name: 'Civilian',
  level: 0,
  roles: ['Standard'],
  ancestry: ['Humanoid'],
  ev: '0',
  stamina: '8',
  speed: 5,
  size: '1M',
  stability: 0,
  free_strike: 1,
  might: 0,
  agility: 0,
  reason: 0,
  intuition: 0,
  presence: 0,
  flavor: 'A non-combatant civilian with no special abilities. Use for bystanders, hostages, or fleeing townsfolk.',
  features: [],
};

/**
 * All Civilian NPCs
 */
export const CIVILIAN_NPCS: CompendiumMonster[] = [
  CIVILIAN,
];
