/**
 * WebSocket message protocol — client-side mirror of server protocol.
 */

// Client → Server
export type ClientMessage =
  | { type: 'request_state' }
  | { type: 'ping' }
  | { type: 'switch_scene'; sceneId: string }
  | { type: 'revert_scene'; sceneId?: string }
  | { type: 'create_entity'; entity: EntityData }
  | { type: 'update_entity'; entityId: string; changes: Record<string, unknown> }
  | { type: 'delete_entity'; entityId: string }
  | { type: 'move_token'; entityId: string; x: number; y: number }
  | { type: 'combat_action'; action: CombatAction }
  | { type: 'token_action'; action: TokenActionRequest }
  | { type: 'draw_steel_roll'; roll: DrawSteelRollRequest }
  | { type: 'hero_tracker_update'; heroId: string; op: HeroTrackerOperation }
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
  | { type: 'phone_anchor_status'; anchored: boolean }
  | { type: 'scene_changed'; sceneId: string }
  | { type: 'scene_reverted'; sceneId: string }
  | { type: 'entity_created'; entity: EntityData }
  | { type: 'entity_updated'; entityId: string; changes: Record<string, unknown> }
  | { type: 'entity_deleted'; entityId: string }
  | { type: 'entity_moved'; entityId: string; x: number; y: number }
  | { type: 'combat_updated'; combat: CombatState | null }
  | { type: 'ability_resolved'; result: AbilityResult }
  | { type: 'token_action_resolved'; result: TokenActionResult }
  | { type: 'draw_steel_roll_resolved'; result: DrawSteelRollResult }
  | { type: 'action_logged'; entry: ActionLogEntry }
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
  activeSide: 'heroes' | 'villains' | null;
  firstSide: 'heroes' | 'villains' | null;
  initiativeRoll: number | null;
  initiativeRollerId?: string | null;
  initiativeRollerName?: string | null;
  heroEntities: string[];
  villainEntities: string[];
  actedThisRound: string[];
  activeEntityId: string | null;
  malice: number;
  turnActions: Record<string, TurnActionState>;
}

export type CombatAction =
  | { type: 'START_COMBAT'; heroEntityIds: string[]; villainEntityIds: string[] }
  | { type: 'ROLL_INITIATIVE' }
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

// ── Token Action Resolution ──

export type CharacteristicId = 'might' | 'agility' | 'reason' | 'intuition' | 'presence';

export type TokenActionKind =
  | 'ability'
  | 'free-strike'
  | 'grab'
  | 'knockback'
  | 'catch-breath'
  | 'defend'
  | 'stand-up'
  | 'escape-grab'
  | 'manual-damage'
  | 'manual-heal'
  | 'apply-condition'
  | 'remove-condition';

export interface TokenActionRequest {
  kind: TokenActionKind;
  sourceId?: string;
  targetId?: string;
  abilityId?: string;
  amount?: number;
  condition?: string;
  edges?: number;
  banes?: number;
  characteristic?: CharacteristicId;
  notes?: string;
}

export interface TokenActionPowerRoll {
  sourceId: string;
  targetId?: string;
  dice: number[];
  characteristic: CharacteristicId;
  characteristicValue: number;
  modifier: number;
  bonuses: number;
  edges: number;
  banes: number;
  rollState: 'double-edge' | 'edge' | 'standard' | 'bane' | 'double-bane';
  total: number;
  tier: 1 | 2 | 3;
  tierShifted: boolean;
  isNatural19Or20: boolean;
}

export interface TokenActionEffect {
  kind:
    | 'damage'
    | 'healing'
    | 'condition-applied'
    | 'condition-removed'
    | 'resource'
    | 'action-slot'
    | 'movement'
    | 'note';
  entityId?: string;
  amount?: number;
  condition?: string;
  before?: number;
  after?: number;
  message?: string;
}

export interface TokenActionResult {
  id: string;
  kind: TokenActionKind;
  sourceId?: string;
  targetId?: string;
  abilityId?: string;
  abilityName?: string;
  powerRoll?: TokenActionPowerRoll;
  effects: TokenActionEffect[];
  summary: string;
  timestamp: number;
}

// ── Phone Companion Hero Tracker ──

export type HeroTrackerOperation =
  | { kind: 'adjust_stamina'; delta: number }
  | { kind: 'set_stamina'; value: number }
  | { kind: 'adjust_recoveries'; delta: number }
  | { kind: 'spend_recovery' }
  | { kind: 'adjust_heroic_resource'; delta: number }
  | { kind: 'adjust_victories'; delta: number }
  | { kind: 'inventory_add'; item: HeroInventoryItemInput }
  | { kind: 'inventory_update'; itemId: string; changes: Partial<HeroInventoryItemInput> }
  | { kind: 'inventory_remove'; itemId: string };

export interface HeroInventoryItemInput {
  id?: string;
  name: string;
  quantity?: number;
  category?: string;
  description?: string;
  notes?: string;
}

// ── Draw Steel Dice + Shared Action Log ──

export type SceneActionLogType = 'battle' | 'negotiation' | 'montage' | 'respite';

export type DrawSteelRollKind = 'power' | 'heroic-resource' | 'd6';

export type DrawSteelDieFaceSet = 'd10-twice' | 'd3-twice' | 'd6';

export interface DrawSteelRollRequest {
  kind: DrawSteelRollKind;
  label?: string;
  modifier?: number;
  edges?: number;
  banes?: number;
  sourceId?: string;
}

export interface DrawSteelDieResult {
  shape: 'd20' | 'd6';
  faceSet: DrawSteelDieFaceSet;
  value: number;
}

export interface DrawSteelRollResult {
  id: string;
  kind: DrawSteelRollKind;
  label: string;
  rollerId: string;
  rollerName: string;
  dice: DrawSteelDieResult[];
  modifier: number;
  edges?: number;
  banes?: number;
  rollState?: TokenActionPowerRoll['rollState'];
  total: number;
  tier?: 1 | 2 | 3;
  timestamp: number;
}

export interface ActionLogEntry {
  id: string;
  sceneId?: string;
  sceneType: SceneActionLogType;
  actorId?: string;
  actorName?: string;
  title: string;
  detail?: string;
  dice?: DrawSteelDieResult[];
  modifier?: number;
  edges?: number;
  banes?: number;
  rollState?: TokenActionPowerRoll['rollState'];
  total?: number;
  tier?: 1 | 2 | 3;
  timestamp: number;
}

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
  roomCode?: string | null;
  scenes: SceneRef[];
  activeSceneId: string | null;
  entities: EntityData[];
  combat: CombatState | null;
  participants: ParticipantInfo[];
  actionLog: ActionLogEntry[];
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
  characteristicId?: CharacteristicId;
  approachText: string;
  roll: number;
  modifier?: number;
  edges?: number;
  banes?: number;
  rollState?: TokenActionPowerRoll['rollState'];
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
