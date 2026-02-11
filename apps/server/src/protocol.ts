/**
 * WebSocket message protocol between client and SessionRoom DO.
 */

// Client → Server
export type ClientMessage =
  | { type: 'request_state' }
  | { type: 'ping' }
  | { type: 'switch_scene'; sceneId: string }
  | { type: 'create_entity'; entity: EntityData }
  | { type: 'update_entity'; entityId: string; changes: Record<string, unknown> }
  | { type: 'delete_entity'; entityId: string }
  | { type: 'move_token'; entityId: string; x: number; y: number }
  | { type: 'combat_action'; action: CombatAction }
  | { type: 'use_ability'; sourceId: string; targetId: string; abilityId: string }
  | { type: 'ready'; ready: boolean }
  | { type: 'select_hero'; heroId: string }
  | { type: 'end_session' }
  | { type: 'scene_drawing_add'; drawing: DrawingSync }
  | { type: 'scene_drawing_remove'; drawingId: string }
  | { type: 'scene_fog_add'; fog: FogSync }
  | { type: 'scene_fog_remove'; fogId: string };

// Server → Client
export type ServerMessage =
  | { type: 'state'; state: SessionState }
  | { type: 'scene_changed'; sceneId: string }
  | { type: 'entity_created'; entity: EntityData }
  | { type: 'entity_updated'; entityId: string; changes: Record<string, unknown> }
  | { type: 'entity_deleted'; entityId: string }
  | { type: 'entity_moved'; entityId: string; x: number; y: number }
  | { type: 'combat_updated'; combat: CombatState | null }
  | { type: 'ability_resolved'; result: AbilityResult }
  | { type: 'participant_update'; participants: ParticipantInfo[] }
  | { type: 'session_started' }
  | { type: 'session_ended' }
  | { type: 'error'; code: string; message: string }
  | { type: 'pong' }
  | { type: 'scene_drawing_added'; drawing: DrawingSync }
  | { type: 'scene_drawing_removed'; drawingId: string }
  | { type: 'scene_fog_added'; fog: FogSync }
  | { type: 'scene_fog_removed'; fogId: string };

// Lightweight types for the protocol (full types come from @anvil/types at integration time)

export interface EntityData {
  id: string;
  name: string;
  type: string;
  x: number;
  y: number;
  [key: string]: unknown;
}

export interface CombatState {
  round: number;
  turnOrder: string[];
  currentTurnIndex: number;
  malice: number;
}

export type CombatAction =
  | { type: 'START_COMBAT'; initiativeOrder: { entityId: string; initiative: number }[] }
  | { type: 'END_COMBAT' }
  | { type: 'NEXT_TURN' }
  | { type: 'ADJUST_MALICE'; delta: number }
  | { type: 'APPLY_DAMAGE'; entityId: string; amount: number }
  | { type: 'APPLY_HEALING'; entityId: string; amount: number }
  | { type: 'APPLY_CONDITION'; entityId: string; condition: string }
  | { type: 'REMOVE_CONDITION'; entityId: string; conditionId: string };

export interface AbilityResult {
  sourceId: string;
  targetId: string;
  abilityId: string;
  abilityName: string;
  dice: number[];
  modifier: number;
  total: number;
  tier: 1 | 2 | 3;
  damage: number;
  effects: string[];
  timestamp: number;
}

export interface ParticipantInfo {
  userId: string;
  username: string;
  avatarUrl: string | null;
  role: 'director' | 'player';
  heroId: string | null;
  ready: boolean;
  connected: boolean;
}

export interface SessionState {
  sessionId: string;
  campaignId: string;
  scenes: SceneRef[];
  activeSceneId: string | null;
  entities: EntityData[];
  combat: CombatState | null;
  participants: ParticipantInfo[];
}

export interface SceneRef {
  id: string;
  name: string;
  type: string;
  order_index: number;
  data?: Record<string, unknown>;
}

export interface DrawingSync {
  id: string;
  type: string;
  points: number[];
  color: string;
  width: number;
}

export interface FogSync {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}
