/**
 * Ability and Feature types from Draw Steel compendium
 */

import type { CompendiumItemBase } from './compendium-item.js';
import type { HeroClass } from '@anvil/types';

/**
 * Effect entry for abilities
 */
export interface AbilityEffect {
  /** Power roll formula (e.g., "Power Roll + Might") */
  roll?: string;
  /** Tier 1 result (≤11) */
  tier1?: string;
  /** Tier 2 result (12-16) */
  tier2?: string;
  /** Tier 3 result (17+) */
  tier3?: string;
  /** Effect name */
  name?: string;
  /** Effect description */
  effect?: string;
  /** Cost to use this effect */
  cost?: string;
}

/**
 * Metadata for hero abilities
 */
export interface AbilityMetadata {
  /** Action type (e.g., "Main action", "Maneuver") */
  action_type?: string;
  /** Hero class this belongs to */
  class?: string;
  /** Resource cost (e.g., "5 Wrath") */
  cost?: string;
  /** Numeric cost amount */
  cost_amount?: number;
  /** Resource type (e.g., "Wrath", "Piety") */
  cost_resource?: string;
  /** Distance/range */
  distance?: string;
  /** Feature type */
  feature_type?: string;
  /** Original filename */
  file_basename?: string;
  /** Original directory path */
  file_dpath?: string;
  /** Flavor text */
  flavor?: string;
  /** Unique item ID */
  item_id?: string;
  /** Item index */
  item_index?: string | number;
  /** Full item name with cost */
  item_name?: string;
  /** Ability keywords */
  keywords?: string[];
  /** Ability level */
  level?: number;
  /** Steel Compendium Code */
  scc?: string[];
  /** Steel Compendium Document Code */
  scdc?: string[];
  /** Source book */
  source?: string;
  /** Target specification */
  target?: string;
  /** Full type path */
  type?: string;
  /** Ability type (e.g., "Signature") */
  ability_type?: string;
}

/**
 * Hero ability from the compendium
 */
export interface CompendiumAbility extends CompendiumItemBase {
  _category: 'heroes';
  type: 'feature';
  /** Feature type (e.g., "ability", "trait") */
  feature_type?: string;
  /** Resource cost (e.g., "5 Wrath") */
  cost?: string;
  /** Flavor text */
  flavor?: string;
  /** Ability keywords */
  keywords?: string[];
  /** Usage type (e.g., "Main action") */
  usage?: string;
  /** Distance/range (e.g., "Melee 1", "Ranged 10") */
  distance?: string;
  /** Target specification */
  target?: string;
  /** Detailed metadata */
  metadata?: AbilityMetadata;
  /** Effects of the ability */
  effects?: AbilityEffect[];
}

/**
 * Hero class resource names (lowercase)
 */
export const CLASS_RESOURCES: Record<string, string> = {
  censor: 'wrath',
  conduit: 'piety',
  elementalist: 'essence',
  fury: 'ferocity',
  null: 'nature',
  shadow: 'insight',
  summoner: 'rage',
  tactician: 'focus',
  talent: 'clarity',
  troubadour: 'valor',
} as const;

/**
 * Parse cost string into resource type and amount
 */
export function parseCost(cost: string): { resource: string; amount: number } | null {
  const match = cost.match(/^(\d+)\s+(.+)$/);
  if (!match) return null;
  return {
    amount: parseInt(match[1]!, 10),
    resource: match[2]!.toLowerCase(),
  };
}
