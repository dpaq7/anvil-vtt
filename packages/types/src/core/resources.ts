/**
 * Draw Steel Resources
 * Stamina, recoveries, heroic resources, and surges
 */

/**
 * Stamina pool - health and healing
 */
export interface StaminaPool {
  current: number;
  max: number;
  /** Winded threshold (typically max/2) */
  winded: number;
  /** Temporary Stamina (lost first) */
  temporary?: number;
}

/**
 * Recovery pool - limited healing uses
 */
export interface RecoveryPool {
  current: number;
  max: number;
  /** Recovery value (amount healed per recovery) */
  value: number;
}

/**
 * Class-specific heroic resource types
 * Using Mettle's canonical naming (lowercase for type, capitalized for display)
 */
export type HeroicResourceType =
  | 'wrath'      // Censor
  | 'piety'      // Conduit
  | 'essence'    // Elementalist, Summoner
  | 'ferocity'   // Fury
  | 'discipline' // Null
  | 'insight'    // Shadow
  | 'focus'      // Tactician
  | 'clarity'    // Talent
  | 'drama';     // Troubadour

/**
 * Base heroic resource interface
 */
export interface HeroicResource<T extends HeroicResourceType = HeroicResourceType> {
  type: T;
  current: number;
}

/**
 * Elementalist-specific resource (has persistent reduction)
 */
export interface ElementalistResource extends HeroicResource<'essence'> {
  /** Essence locked by persistent abilities */
  persistent: number;
}

/**
 * Summoner-specific resource (has max per turn)
 */
export interface SummonerResource extends HeroicResource<'essence'> {
  maxPerTurn: number;
}

/**
 * Talent-specific resource (can go negative)
 */
export interface TalentResource extends HeroicResource<'clarity'> {
  /** Minimum value, can go to -(1+Reason) */
  minimum: number;
}

/**
 * Surge pool - bonus damage in combat
 */
export interface SurgePool {
  current: number;
  /** Usually kit-based (e.g., +2 damage per surge) */
  damagePerSurge?: number;
}

/**
 * Map of hero class to their heroic resource type
 */
export const CLASS_RESOURCE_MAP = {
  censor: 'wrath',
  conduit: 'piety',
  elementalist: 'essence',
  fury: 'ferocity',
  null: 'discipline',
  shadow: 'insight',
  summoner: 'essence',
  tactician: 'focus',
  talent: 'clarity',
  troubadour: 'drama',
} as const satisfies Record<string, HeroicResourceType>;
