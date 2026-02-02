/**
 * Monster and Hazard types from Draw Steel compendium
 */

import type { CompendiumItemBase } from './compendium-item.js';
import type { TokenSize } from '@anvil/types';

/**
 * Monster role types
 */
export type MonsterRole =
  | 'Minion'
  | 'Minion Ambusher'
  | 'Minion Artillery'
  | 'Minion Brute'
  | 'Minion Controller'
  | 'Minion Defender'
  | 'Minion Harrier'
  | 'Minion Hexer'
  | 'Minion Support'
  | 'Standard'
  | 'Ambusher'
  | 'Artillery'
  | 'Brute'
  | 'Controller'
  | 'Defender'
  | 'Harrier'
  | 'Hexer'
  | 'Support'
  | 'Leader'
  | 'Solo';

/**
 * Monster feature/ability effect
 */
export interface MonsterEffect {
  /** Power roll formula */
  roll?: string;
  tier1?: string;
  tier2?: string;
  tier3?: string;
  name?: string;
  effect?: string;
  cost?: string;
}

/**
 * Monster feature (trait, ability, action)
 */
export interface MonsterFeature {
  type: 'feature';
  /** Feature type: trait, ability */
  feature_type: 'trait' | 'ability';
  name: string;
  /** Display icon */
  icon?: string;
  /** Ability type (e.g., "Signature Ability") */
  ability_type?: string;
  /** Keywords */
  keywords?: string[];
  /** Usage (e.g., "Main Action", "Free triggered action") */
  usage?: string;
  /** Distance/range */
  distance?: string;
  /** Target */
  target?: string;
  /** Trigger for triggered actions */
  trigger?: string;
  /** Effects */
  effects?: MonsterEffect[];
}

/**
 * Monster stat entry
 */
export interface MonsterStat {
  name: string;
  value: string;
}

/**
 * Monster statblock from compendium
 */
export interface CompendiumMonster extends CompendiumItemBase {
  _category: 'monsters';
  type: 'statblock';
  name: string;
  level: number;
  /** Monster roles */
  roles?: MonsterRole[];
  /** Ancestry/creature type (e.g., ["Human", "Humanoid"]) */
  ancestry?: string[];
  /** Encounter Value */
  ev?: string;
  /** Stamina points */
  stamina?: string;
  /** Movement speed */
  speed?: number;
  /** Movement types (e.g., "Fly, hover") */
  movement?: string;
  /** Token size */
  size?: string;
  /** Stability value */
  stability?: number;
  /** Free strike damage */
  free_strike?: number;
  /** Characteristics */
  might?: number;
  agility?: number;
  reason?: number;
  intuition?: number;
  presence?: number;
  /** Immunities */
  immunities?: string[];
  /** Weaknesses */
  weaknesses?: string[];
  /** Additional stats */
  stats?: MonsterStat[];
  /** Features and abilities */
  features?: MonsterFeature[];
  /** Flavor text */
  flavor?: string;
}

/**
 * Hazard/Terrain from compendium
 */
export interface CompendiumHazard extends CompendiumItemBase {
  _category: 'monsters';
  type: 'featureblock';
  /** Hazard type (e.g., "Hazard Hexer", "Hazard Defender") */
  featureblock_type?: string;
  name: string;
  level: number;
  /** Encounter Value */
  ev?: string;
  /** Stamina */
  stamina?: string;
  /** Size */
  size?: string;
  /** Flavor text */
  flavor?: string;
  /** Stats like immunities */
  stats?: MonsterStat[];
  /** Features */
  features?: MonsterFeature[];
}

/**
 * Check if an item is a monster statblock
 */
export function isMonsterStatblock(item: CompendiumItemBase): item is CompendiumMonster {
  return item._category === 'monsters' && item.type === 'statblock';
}

/**
 * Check if an item is a hazard/terrain
 */
export function isHazard(item: CompendiumItemBase): item is CompendiumHazard {
  return item._category === 'monsters' && item.type === 'featureblock';
}

/**
 * Check if a monster is a minion
 */
export function isMinion(monster: CompendiumMonster): boolean {
  return monster.roles?.some(role => role.toLowerCase().includes('minion')) ?? false;
}

/**
 * Parse monster size to TokenSize
 */
export function parseMonsterSize(size: string): TokenSize {
  const sizeMap: Record<string, TokenSize> = {
    '1T': '1T',
    '1S': '1S',
    '1M': '1M',
    '1L': '1L',
    '2': 2,
    '3': 3,
    '4': 4,
  };
  return sizeMap[size] ?? '1M';
}
