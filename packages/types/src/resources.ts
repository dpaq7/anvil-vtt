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
  /** Temporary Stamina (lost first) */
  temporary: number;
}

/**
 * Recovery pool - limited healing uses
 */
export interface RecoveryPool {
  current: number;
  max: number;
}

/**
 * Class-specific heroic resource types
 */
export type HeroicResourceType =
  | 'ferocity'   // Fury - gained from combat, taking damage
  | 'piety'      // Conduit - gained from prayer, domain triggers
  | 'focus'      // Tactician - gained from directing allies
  | 'clarity'    // Talent - gained from psionic actions
  | 'essence'    // Elementalist - gained from elemental effects
  | 'judgment'   // Censor - gained from enforcing order
  | 'insight'    // Shadow - gained from cunning actions
  | 'valor'      // Troubadour - gained from inspiration
  | 'nature'     // Null - gained from nullifying magic
  | 'rage';      // Summoner - gained from minion actions

export interface ResourceTrigger {
  event: string;
  gain: number;
  condition?: string;
}

export interface HeroicResource {
  type: HeroicResourceType;
  current: number;

  /** e.g., "Equal to Victories" */
  startOfCombat: string;
  /** e.g., "1d3" */
  perTurn: string;
  triggers: ResourceTrigger[];
}

/**
 * Surge pool - bonus damage in combat
 */
export interface SurgePool {
  current: number;
  /** Usually kit-based (e.g., +2 damage per surge) */
  damagePerSurge: number;
}

/**
 * Map of hero class to their heroic resource type
 */
export const CLASS_RESOURCE_MAP: Record<string, HeroicResourceType> = {
  fury: 'ferocity',
  conduit: 'piety',
  tactician: 'focus',
  talent: 'clarity',
  elementalist: 'essence',
  censor: 'judgment',
  shadow: 'insight',
  troubadour: 'valor',
  null: 'nature',
  summoner: 'rage',
} as const;
