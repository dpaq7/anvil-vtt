/**
 * Terrain types for Draw Steel tactical combat
 *
 * Terrains are interactive battlefield elements that can be used during encounters.
 * They include environmental hazards, traps, siege engines, and supernatural objects.
 */

import type { TokenSize } from './entity.js';

/**
 * Terrain categories (6 types)
 */
export type TerrainCategory =
  | 'environmental'
  | 'fieldwork'
  | 'mechanism'
  | 'siege-engine'
  | 'power-fixture'
  | 'supernatural';

/**
 * Terrain role types (what the terrain does tactically)
 */
export type TerrainRoleType =
  | 'fortification'
  | 'hazard'
  | 'relic'
  | 'siege-engine'
  | 'trap'
  | 'trigger';

/**
 * Monster role types used for terrain (how it behaves in combat)
 */
export type TerrainMonsterRole =
  | 'ambusher'
  | 'artillery'
  | 'brute'
  | 'controller'
  | 'defender'
  | 'harrier'
  | 'hexer'
  | 'support';

/**
 * Combined terrain role (monster role + terrain type)
 */
export interface TerrainRole {
  /** Monster-style combat role */
  type: TerrainMonsterRole;
  /** Terrain-specific role */
  terrainType: TerrainRoleType;
}

/**
 * Terrain stamina configuration
 */
export interface TerrainStamina {
  /** Base stamina value */
  base: number;
  /** Additional stamina per square occupied */
  perSquare: number;
}

/**
 * Terrain upgrade option
 */
export interface TerrainUpgrade {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** EV cost to add this upgrade */
  cost: number;
  /** Description of what the upgrade does */
  description: string;
}

/**
 * Terrain ability effect (power roll outcome)
 */
export interface TerrainAbilityEffect {
  /** Power roll formula */
  roll?: string;
  /** Tier 1 outcome (11 or lower) */
  tier1?: string;
  /** Tier 2 outcome (12-16) */
  tier2?: string;
  /** Tier 3 outcome (17+) */
  tier3?: string;
}

/**
 * Terrain ability (triggered action, main action, etc.)
 */
export interface TerrainAbility {
  /** Unique identifier */
  id: string;
  /** Ability name */
  name: string;
  /** Usage type (e.g., "Triggered action", "Main action") */
  usage?: string;
  /** Trigger condition */
  trigger?: string;
  /** Keywords (Area, Magic, Weapon, etc.) */
  keywords?: string[];
  /** Distance/range */
  distance?: string;
  /** Target specification */
  target?: string;
  /** Power roll effects */
  effect?: TerrainAbilityEffect;
  /** Additional effect text */
  effectText?: string;
}

/**
 * Terrain feature (trait, rule, or passive effect)
 */
export interface TerrainFeature {
  /** Unique identifier */
  id: string;
  /** Feature name */
  name: string;
  /** Feature description */
  description: string;
}

/**
 * Compendium terrain definition
 */
export interface CompendiumTerrain {
  /** Unique identifier (e.g., 'terrain-angry-beehive') */
  id: string;
  /** Display name */
  name: string;
  /** Flavor description */
  description: string;
  /** Terrain category */
  category: TerrainCategory;
  /** Encounter level (1-5+) */
  level: number;
  /** Combat and terrain roles */
  role: TerrainRole;
  /** Encounter value (EV) for encounter building */
  encounterValue: number;
  /** Area description (e.g., "10 x 10 thicket") */
  area?: string;
  /** Size specification */
  size: TokenSize | string;
  /** Stamina configuration */
  stamina: TerrainStamina;
  /** Directional orientation (e.g., "front" for stakes) */
  direction?: string;
  /** Link to another mechanism */
  link?: string;
  /** Damage immunities (e.g., "20 to all damage except cold or fire") */
  immunities?: string;
  /** How to deactivate the terrain */
  deactivate: string;
  /** What activates/triggers the terrain */
  activate?: string;
  /** Primary effect when activated */
  effect?: string;
  /** Whether the terrain is hidden until triggered */
  hidden?: boolean;
  /** Allied awareness rule */
  alliedAwareness?: string;
  /** Terrain abilities */
  abilities?: TerrainAbility[];
  /** Passive features and traits */
  features?: TerrainFeature[];
  /** Available upgrades */
  upgrades?: TerrainUpgrade[];
}

/**
 * Terrain instance state (for use in encounters)
 */
export interface TerrainState {
  /** Reference to terrain definition ID */
  terrainId: string;
  /** Number of squares occupied */
  squares: number;
  /** Current stamina damage taken */
  staminaDamage: number;
  /** Applied upgrade IDs */
  appliedUpgrades?: string[];
  /** Whether the terrain has been triggered/activated */
  triggered?: boolean;
  /** Whether the terrain has been deactivated */
  deactivated?: boolean;
}
