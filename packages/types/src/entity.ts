/**
 * Draw Steel Entity Types
 * Heroes, NPCs, enemies, objects, and hazards
 */

import type {
  Characteristics,
  Size,
  ActionType,
  HeroClass,
  StaminaPool,
  RecoveryPool,
  HeroicResource,
} from './hero/index.js';
import type { VttCondition } from './conditions.js';

// Re-export types from hero for VTT usage
export type { HeroClass, StaminaPool, RecoveryPool, HeroicResource };

// VTT uses VttCondition for entities
export type { VttCondition } from './conditions.js';

/**
 * Token sizes in Draw Steel (alias for Size)
 */
export type TokenSize = Size | 2 | 3 | 4;

// ---------------------------------------------------------------------------
// Entity Template Reference (for Session Hydration & Scene Reset)
// ---------------------------------------------------------------------------

/**
 * Links a runtime entity back to its source template
 * Used for: Scene reset, stat sync, debugging
 */
export interface EntityTemplateRef {
  /** Source type */
  type: 'creature' | 'npc' | 'object' | 'hero';

  /** ID of the source definition (monster ID, NPC UUID, SceneObject ID, hero ID) */
  sourceId: string;

  /** ID of the PlacedToken this was instantiated from (if any) */
  placedTokenId?: string;

  /** For legacy creatureGroups: which group and index */
  legacyRef?: {
    groupId: string;
    index: number;
  };
}

/**
 * Surge pool for VTT entities
 */
export interface SurgePool {
  current: number;
  damagePerSurge?: number;
}

/**
 * Entity types
 */
export type EntityType = 'hero' | 'npc' | 'enemy' | 'object' | 'hazard';

/**
 * Enemy roles
 */
export type EnemyRole =
  | 'minion'   // Weak, fight in groups
  | 'standard' // Regular enemies
  | 'leader'   // Buff allies, coordinate
  | 'solo';    // Boss-level threats

/**
 * Visibility tiers
 */
export type Visibility = 'all' | 'director' | 'owner';

/**
 * Hero ability
 */
export interface HeroAbility {
  id: string;
  name: string;
  type: 'signature' | 'heroic' | 'triggered' | 'feature';
  actionType: ActionType;
  /** Heroic resource cost */
  cost?: number;
  keywords: string[];
  /** e.g., "Melee 1", "Ranged 10", "5 burst" */
  distance?: string;
  /** e.g., "One creature", "Each enemy in area" */
  target?: string;
}

/**
 * Enemy action
 */
export interface EnemyAction {
  id: string;
  name: string;
  actionType: ActionType;
  maliceCost?: number;
  keywords: string[];
  effect: string;
}

/**
 * Hero-specific data
 */
export interface HeroData {
  type: 'hero';

  heroClass: HeroClass;
  subclass: string;
  level: number;

  ancestry: string;
  culture: string;
  career: string;

  /** Reference to full character in Mettle */
  mettleHeroId?: string;

  kit?: string;
  speed: number;
  stability: number;
  size: TokenSize;

  skills: string[];
  abilities: HeroAbility[];

  victories: number;
  xp: number;
  titles: string[];
  perks: string[];
}

/**
 * NPC-specific data
 */
export interface NPCData {
  type: 'npc';
  role: string;
  disposition: 'friendly' | 'neutral' | 'hostile' | 'unknown';
  renown: number;
  /** Director-only */
  notes: string;

  negotiation?: {
    defaultPatience: number;
    motivations: string[];
    pitfalls: string[];
  };
}

/**
 * Enemy-specific data
 */
export interface EnemyData {
  type: 'enemy';
  creatureType: string;
  level: number;
  role: EnemyRole;

  speed: number;
  stability: number;
  size: TokenSize;

  isMinion: boolean;
  minionSquad?: {
    current: number;
    max: number;
    staminaPerMinion: number;
  };

  actions: EnemyAction[];

  traits: string[];
  immunities: string[];
  weaknesses: string[];

  /** Director notes */
  tactics: string;
}

/**
 * Object-specific data
 */
export interface ObjectData {
  type: 'object';
  interactable: boolean;
  description: string;
  /** If destructible */
  stamina?: number;
  immunities?: string[];
}

/**
 * Hazard-specific data
 */
export interface HazardData {
  type: 'hazard';
  effect: string;
  damage?: number;
  damageType?: string;
  triggerCondition: string;
  savingThrow?: {
    characteristic: keyof Characteristics;
    difficulty: number;
  };
}

/**
 * Entity data discriminated union
 */
export type EntityData = HeroData | NPCData | EnemyData | ObjectData | HazardData;

/**
 * Unified entity model
 */
export interface Entity {
  id: string;
  type: EntityType;

  name: string;
  portraitUrl?: string;
  tokenUrl?: string;
  color?: string;

  panePosition: 'left' | 'right' | 'stage' | 'hidden';

  stamina?: StaminaPool;
  recoveries?: RecoveryPool;
  heroicResource?: HeroicResource;
  surges?: SurgePool;

  characteristics?: Characteristics;

  potency?: {
    weak: number;
    average: number;
    strong: number;
  };

  conditions: VttCondition[];

  data: EntityData;

  /**
   * Reference back to template for reset/sync functionality
   * Undefined for ad-hoc entities created during live session
   */
  templateRef?: EntityTemplateRef;

  ownerId?: string;
  visibility: Visibility;

  // Sync metadata for CRDT conflict resolution
  version: number;
  versionNonce: number;
  isDeleted: boolean;
}

// Type guards
export function isHero(entity: Entity): entity is Entity & { data: HeroData } {
  return entity.type === 'hero';
}

export function isNPC(entity: Entity): entity is Entity & { data: NPCData } {
  return entity.type === 'npc';
}

export function isEnemy(entity: Entity): entity is Entity & { data: EnemyData } {
  return entity.type === 'enemy';
}

export function isObject(entity: Entity): entity is Entity & { data: ObjectData } {
  return entity.type === 'object';
}

export function isHazard(entity: Entity): entity is Entity & { data: HazardData } {
  return entity.type === 'hazard';
}

export function isMinion(entity: Entity): boolean {
  return isEnemy(entity) && entity.data.isMinion;
}
