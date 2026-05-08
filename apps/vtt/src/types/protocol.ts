/**
 * WebSocket message protocol — client-side mirror of server protocol.
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
  | { type: 'scene_fog_remove'; fogId: string }
  | { type: 'scene_terrain_add'; terrain: TerrainSync }
  | { type: 'scene_terrain_remove'; terrainId: string }
  // Negotiation
  | { type: 'negotiation_argument'; skillId: string; approachText: string }
  | { type: 'negotiation_adjust_patience'; delta: number }
  | { type: 'negotiation_adjust_interest'; delta: number }
  | { type: 'negotiation_reveal_motivation'; id: string }
  | { type: 'negotiation_reveal_pitfall'; id: string }
  | { type: 'negotiation_end'; phase: 'success' | 'failure' }
  // Montage
  | { type: 'montage_roll'; skillId: string; characteristicId: string }
  | { type: 'montage_adjust_successes'; delta: number }
  | { type: 'montage_adjust_failures'; delta: number }
  | { type: 'montage_reset' }
  // Respite
  | { type: 'respite_choose_activity'; activityId: string }
  | { type: 'respite_complete_activity'; activityId: string }
  // Audio
  | { type: 'audio_play'; audioAssetId: string; loop: boolean }
  | { type: 'audio_pause' }
  | { type: 'audio_stop' }
  // Story
  | { type: 'story_update'; readAloudText: string };

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
  | { type: 'scene_fog_removed'; fogId: string }
  | { type: 'scene_terrain_added'; terrain: TerrainSync }
  | { type: 'scene_terrain_removed'; terrainId: string }
  // Negotiation
  | {
      type: 'negotiation_updated';
      interest: number;
      patience: number;
      maxPatience: number;
      phase: 'active' | 'success' | 'failure';
      motivations: NegotiationSecretState[];
      pitfalls: NegotiationSecretState[];
      argumentLog: ArgumentLogEntry[];
    }
  // Montage
  | {
      type: 'montage_updated';
      successes: number;
      failures: number;
      successLimit: number;
      failureLimit: number;
      testLog: TestLogEntry[];
      outcome: string | null;
    }
  // Respite
  | { type: 'respite_updated'; activities: RespiteActivityState[]; completedBy: Record<string, string[]> }
  // Audio
  | { type: 'audio_command'; action: 'play' | 'pause' | 'stop'; audioUrl?: string; assetName?: string; loop?: boolean }
  // Story
  | { type: 'story_updated'; readAloudText: string };

// ── Entity ──

export interface EntityData {
  id: string;
  name: string;
  type: string;
  x: number;
  y: number;
  [key: string]: unknown;
}

// ── Draw Steel Side-Based Combat ──

export interface TurnActionState {
  mainActionUsed: boolean;
  maneuverUsed: boolean;
  moveRemaining: number;
  triggeredUsedThisRound: boolean;
  mainConvertedTo: 'move' | 'maneuver' | null;
}

export interface CombatState {
  round: number;
  activeSide: 'heroes' | 'villains';
  firstSide: 'heroes' | 'villains';
  initiativeRoll: number;
  heroEntities: string[];
  villainEntities: string[];
  actedThisRound: string[];
  activeEntityId: string | null;
  malice: number;
  turnActions: Record<string, TurnActionState>;
}

export type CombatAction =
  | { type: 'START_COMBAT'; heroEntityIds: string[]; villainEntityIds: string[] }
  | { type: 'END_COMBAT' }
  | { type: 'CLAIM_TURN'; entityId: string }
  | { type: 'SELECT_TURN'; entityId: string }
  | { type: 'END_TURN' }
  | { type: 'ADJUST_MALICE'; delta: number }
  | { type: 'APPLY_DAMAGE'; entityId: string; amount: number }
  | { type: 'APPLY_HEALING'; entityId: string; amount: number }
  | { type: 'APPLY_CONDITION'; entityId: string; condition: string }
  | { type: 'REMOVE_CONDITION'; entityId: string; conditionId: string }
  | { type: 'CATCH_BREATH'; entityId: string }
  | { type: 'DEFEND'; entityId: string };

// ── Ability Resolution ──

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

// ── Participants ──

export interface ParticipantInfo {
  userId: string;
  username: string;
  avatarUrl: string | null;
  role: 'director' | 'player';
  heroId: string | null;
  ready: boolean;
  connected: boolean;
}

// ── Session State ──

export interface SessionState {
  sessionId: string;
  campaignId: string;
  scenes: SceneRef[];
  activeSceneId: string | null;
  entities: EntityData[];
  combat: CombatState | null;
  participants: ParticipantInfo[];
  // Scene-specific live state
  negotiation: NegotiationLiveState | null;
  montage: MontageLiveState | null;
  respite: RespiteLiveState | null;
  audio: AudioLiveState | null;
}

export interface SceneRef {
  id: string;
  name: string;
  type: string;
  order_index: number;
  data?: Record<string, unknown>;
}

// ── Drawing & Fog Sync ──

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

export interface TerrainSync {
  id: string;
  terrainId: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color?: number;
}

// ── Negotiation ──

export interface ArgumentLogEntry {
  id: string;
  playerId: string;
  playerName: string;
  skillId: string;
  approachText: string;
  roll: number;
  tier: 1 | 2 | 3;
  interestDelta: number;
  timestamp: number;
}

export interface NegotiationSecretState {
  id: string;
  type: string;
  description: string;
  revealed: boolean;
}

export interface NegotiationLiveState {
  interest: number;
  patience: number;
  maxPatience: number;
  phase: 'active' | 'success' | 'failure';
  motivations: NegotiationSecretState[];
  pitfalls: NegotiationSecretState[];
  argumentLog: ArgumentLogEntry[];
}

// ── Montage ──

export interface TestLogEntry {
  id: string;
  playerId: string;
  playerName: string;
  skillId: string;
  characteristicId: string;
  roll: number;
  tier: 1 | 2 | 3;
  outcome: 'success' | 'failure';
  timestamp: number;
}

export interface MontageLiveState {
  successes: number;
  failures: number;
  successLimit: number;
  failureLimit: number;
  testLog: TestLogEntry[];
  outcome: string | null;
}

// ── Respite ──

export interface RespiteActivityState {
  activityId: string;
  name: string;
  description: string;
  claimedBy: string | null;
  claimedByName: string | null;
  completed: boolean;
}

export interface RespiteLiveState {
  activities: RespiteActivityState[];
  completedBy: Record<string, string[]>;
}

// ── Audio ──

export interface AudioLiveState {
  playing: boolean;
  audioUrl: string | null;
  assetName: string | null;
  loop: boolean;
}
