/**
 * Hydration Types for Session Population
 *
 * These types define the pipeline for transforming Campaign Builder templates
 * into live session entities.
 *
 * Flow: Supabase Records → Hydration → SessionDocument
 */

import type { Entity } from './entity.js';
import type {
  Scene,
  BattleSceneTemplate,
  SceneObjectDefinition,
  PlacedToken,
  TokenState,
  GridPosition,
} from './scene.js';

// ---------------------------------------------------------------------------
// Hydration Context - Dependencies for transformation
// ---------------------------------------------------------------------------

/**
 * Source data types that can be referenced by PlacedTokens
 * These are generic to avoid circular dependencies with @anvil/data
 */
export interface MonsterDefinition {
  id: string;
  name: string;
  stamina?: number;
  characteristics?: {
    might: number;
    agility: number;
    reason: number;
    intuition: number;
    presence: number;
  };
  speed?: number;
  stability?: number;
  size?: string;
  freeStrikeBonus?: number;
  abilities?: unknown[];
  traits?: unknown[];
  [key: string]: unknown;
}

export interface NpcLibraryRecord {
  id: string;
  name: string;
  stamina?: number;
  characteristics?: {
    might: number;
    agility: number;
    reason: number;
    intuition: number;
    presence: number;
  };
  speed?: number;
  stability?: number;
  size?: string;
  [key: string]: unknown;
}

/**
 * Context required for hydrating scene templates into runtime entities
 */
export interface HydrationContext {
  /** NPC definitions keyed by UUID */
  npcs: Map<string, NpcLibraryRecord>;

  /** Monster definitions keyed by monster ID */
  monsters: Map<string, MonsterDefinition>;

  /** Scene object definitions keyed by ID */
  sceneObjects: Map<string, SceneObjectDefinition>;

  /** ID generator function for creating unique entity IDs */
  generateId: () => string;
}

// ---------------------------------------------------------------------------
// Hydrated Scene Data - Result of transformation
// ---------------------------------------------------------------------------

/**
 * Result of hydrating a single scene template
 */
export interface HydratedSceneData {
  /** Transformed scene with populated entityIds and state */
  scene: Scene;

  /** Spawned entities for this scene */
  entities: Entity[];

  /** Token positions for the battle grid */
  tokens: TokenState[];

  /** Original template (kept for reset functionality) */
  originalTemplate: BattleSceneTemplate;
}

// ---------------------------------------------------------------------------
// Session Load Result - What we get from Supabase
// ---------------------------------------------------------------------------

/**
 * Raw session record from Supabase
 */
export interface SessionRecord {
  id: string;
  name?: string;
  status?: string;
  yjs_room_id?: string;
  module?: {
    id: string;
    name: string;
    campaign_id: string;
    campaign?: {
      id: string;
      name: string;
      user_id: string;
    };
  };
  [key: string]: unknown;
}

/**
 * Raw scene record from Supabase
 */
export interface SceneRecord {
  id: string;
  session_id: string;
  type: 'story' | 'battle' | 'montage' | 'negotiation' | 'respite';
  title?: string;
  order_index?: number;
  data?: BattleSceneTemplate | unknown;
  [key: string]: unknown;
}

/**
 * Complete result from loading session data from Supabase
 */
export interface SessionLoadResult {
  session: SessionRecord;
  scenes: SceneRecord[];
  npcs: Map<string, NpcLibraryRecord>;
}

// ---------------------------------------------------------------------------
// Instantiation Helpers
// ---------------------------------------------------------------------------

/**
 * Result of instantiating a single PlacedToken
 */
export interface TokenInstantiationResult {
  entity: Entity;
  token: TokenState;
}

/**
 * Result of instantiating a legacy CreatureGroup
 */
export interface GroupInstantiationResult {
  entities: Entity[];
  tokens: TokenState[];
}

/**
 * Options for creating a new ad-hoc entity during live session
 */
export interface AdHocEntityOptions {
  /** Entity type */
  type: 'npc' | 'enemy' | 'object' | 'hazard';

  /** Display name */
  name: string;

  /** Initial visibility */
  visibility: 'all' | 'director';

  /** Grid position for placement */
  position: GridPosition;

  /** Optional source ID for referencing bestiary/NPC library */
  sourceId?: string;

  /** Optional stamina override */
  stamina?: number;
}
