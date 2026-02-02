/**
 * Draw Steel Scene Types
 * Story, Battle, Montage, Negotiation, and Respite modes
 *
 * EncounterObjective types ported from Forgesteel
 * (https://github.com/andyaiken/forgesteel)
 * Original work Copyright (c) Andy Aiken, Licensed under GPL-3.0
 */

import type { Characteristic as CharacteristicName, GridPosition } from './hero/common.js';
import type { ConditionName } from './conditions.js';
import type { InitiativeEntry } from './combat.js';

// Re-export GridPosition from hero/common for convenience
export type { GridPosition } from './hero/common.js';

// ---------------------------------------------------------------------------
// Grid Position & Token Placement Types (Campaign Builder)
// ---------------------------------------------------------------------------

/**
 * Size in grid cells for placed tokens
 * Different from entity.ts TokenSize which is creature size category
 */
export interface PlacedTokenSize {
  /** Width in grid cells (1 = 1x1, 2 = 2x2, etc.) */
  width: number;
  /** Height in grid cells */
  height: number;
}

/**
 * A token positioned on the canvas in Campaign Builder
 * Used in: Campaign Builder (saved), Session Hydration (read)
 */
export interface PlacedToken {
  /** Unique ID within the template (NOT the runtime entity ID) */
  id: string;

  /** What kind of token this is */
  type: 'creature' | 'npc' | 'object';

  /**
   * Reference to source definition:
   * - creature: Monster ID from GameData bestiary
   * - npc: UUID from npc_library table
   * - object: SceneObjectDefinition ID
   */
  sourceId: string;

  /** Cached name for display (avoids lookup during render) */
  sourceName: string;

  // === Position & Transform ===
  /** Grid coordinates (integer cell position) */
  position: GridPosition;

  /** Rotation in degrees (0, 90, 180, 270) */
  rotation: number;

  /** Size in grid cells */
  size: PlacedTokenSize;

  // === Configuration ===
  /** Override the source's default name */
  nameOverride?: string;

  /** Initial visibility when spawned */
  visibility: 'director' | 'all';

  /** Conditions applied when spawned */
  startingConditions?: ConditionName[];

  /** Director notes for this specific token */
  notes?: string;

  // === Type-Specific Overrides ===
  /** Override stamina (creatures/NPCs only) */
  staminaOverride?: number;

  /** Object interaction flags (objects only) */
  objectProperties?: {
    isInteractable: boolean;
    isDestructible: boolean;
    hitPoints?: number;
  };
}

// ---------------------------------------------------------------------------
// Scene Object Definitions (Furniture, Terrain, Markers)
// ---------------------------------------------------------------------------

/**
 * Category of scene objects
 */
export type SceneObjectCategory = 'furniture' | 'terrain' | 'hazard' | 'marker';

/**
 * Template for placeable objects (furniture, terrain, hazards, markers)
 */
export interface SceneObjectDefinition {
  id: string;
  name: string;
  category: SceneObjectCategory;

  /** Visual representation */
  iconUrl?: string;
  imageUrl?: string;

  /** Default size when placed */
  defaultSize: PlacedTokenSize;

  /** Default properties when placed */
  defaultProperties: {
    isInteractable: boolean;
    isDestructible: boolean;
    hitPoints?: number;
    blocksSight: boolean;
    blocksMovement: boolean;
  };
}

// ---------------------------------------------------------------------------
// Encounter Objective Types
// ---------------------------------------------------------------------------

/**
 * Types of encounter objectives
 */
export type EncounterObjectiveType =
  | 'diminish-numbers' // Standard defeat enemies
  | 'defeat-foe' // Defeat specific target(s)
  | 'get-thing' // Retrieve an object
  | 'destroy-thing' // Destroy an object
  | 'save-another' // Rescue allies/NPCs
  | 'escort' // Protect while traveling
  | 'hold-position' // Defend an area
  | 'survive' // Survive for duration
  | 'escape' // Flee the area
  | 'custom'; // Director-defined

/**
 * An encounter objective that defines victory/failure conditions
 */
export interface EncounterObjective {
  /** Unique identifier (kebab-case) */
  id: string;

  /** Display name */
  name: string;

  /** Full description of the objective */
  description: string;

  /** How this objective modifies encounter difficulty */
  difficultyModifier: string;

  /** What the heroes must do to succeed */
  successCondition: string;

  /** What causes the heroes to fail */
  failureCondition: string;

  /** How many victories are awarded for success */
  victories: string;
}

/**
 * An objective instance used in an encounter
 */
export interface EncounterObjectiveInstance {
  /** Reference to objective definition */
  objectiveId: string;

  /** Director notes about this specific instance */
  notes?: string;

  /** Custom modifications to the objective for this encounter */
  customSuccessCondition?: string;
  customFailureCondition?: string;
  customVictories?: number;

  /** Whether this objective has been completed */
  status: 'pending' | 'success' | 'failure';
}

/**
 * Scene types corresponding to Draw Steel's five activity modes
 */
export type SceneType = 'story' | 'battle' | 'montage' | 'negotiation' | 'respite';

/**
 * Vision type for special sight capabilities
 */
export type VisionType =
  | 'normal' // Standard vision, blocked by darkness
  | 'darkvision' // See in darkness as if dim light
  | 'blindsight' // See without light (echolocation, tremorsense)
  | 'truesight'; // See through illusions, invisibility, darkness

/**
 * Light animation configuration for dynamic effects
 */
export interface LightAnimation {
  type: 'none' | 'flicker' | 'pulse' | 'wave';
  speed: number;
  intensity: number;
}

/**
 * Minimal light config for token-attached lights
 */
export interface TokenLightConfig {
  radius: number;
  dimRadius?: number;
  color: string;
  intensity: number;
  type?: 'torch' | 'lantern' | 'magical' | 'sunlight' | 'darkness' | 'custom';
  enabled?: boolean;
  animation?: LightAnimation;
}

/**
 * Vision properties for tokens/entities
 */
export interface VisionProperties {
  /** Vision range in squares (how far this token can see) */
  visionRange: number;
  /** Vision type (normal, darkvision, blindsight, truesight) */
  visionType: VisionType;
  /** If true, this token has a light source attached */
  emitsLight: boolean;
  /** Attached light source configuration (if emitsLight) */
  lightConfig?: TokenLightConfig;
}

/**
 * Entity type for token rendering (determines ring color)
 */
export type TokenEntityType = 'hero' | 'enemy' | 'npc' | 'object' | 'hazard';

/**
 * Enemy role for badge rendering
 */
export type TokenEnemyRole = 'minion' | 'standard' | 'leader' | 'solo';

/**
 * Stamina state for HP arc rendering
 */
export interface TokenStamina {
  current: number;
  max: number;
}

/**
 * Token state on the battle grid
 */
export interface TokenState {
  entityId: string;
  /** Display name for the token (for initials fallback) */
  name?: string;
  /** URL to token portrait/image */
  tokenUrl?: string;
  x: number;
  y: number;
  rotation: number;
  size: number;
  visible: boolean;
  conditions: ConditionName[];
  elevation?: number;
  /** Vision properties for line-of-sight calculations */
  vision?: VisionProperties;

  // === Enhanced token rendering properties (Phase 1) ===
  /** Entity type determines ring color (hero=teal, enemy=red, etc.) */
  entityType?: TokenEntityType;
  /** Stamina for HP arc display */
  stamina?: TokenStamina;
  /** Enemy role for badge display (minion, leader, solo) */
  role?: TokenEnemyRole;
  /** Minion squad count (displayed in role badge for minions) */
  minionCount?: number;
}

/**
 * Door state for walls that can be opened/closed
 */
export type DoorState = 'open' | 'closed' | 'locked';

/**
 * Wall for line-of-sight/movement blocking
 */
export interface Wall {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  blocksMovement: boolean;
  blocksVision: boolean;
  /** If set, this wall is a door with the given state */
  doorState?: DoorState;
  /** Secret door - only visible to director */
  isSecret?: boolean;
}

/**
 * Light source type for different lighting behaviors
 */
export type LightType =
  | 'torch' // Flickers, warm color
  | 'lantern' // Steady, broader coverage
  | 'magical' // Can be any color, no flicker
  | 'sunlight' // Natural light, full spectrum
  | 'darkness' // Anti-light, creates darkness zone
  | 'custom'; // User-defined

/**
 * Light source with primary and secondary (dim) illumination zones
 */
export interface Light {
  id: string;
  /** Grid X position */
  x: number;
  /** Grid Y position */
  y: number;
  /** Primary illumination radius in squares (bright light) */
  radius: number;
  /** Secondary illumination radius in squares (dim light, typically 2x primary) */
  dimRadius?: number;
  /** Light color as hex string (e.g., '#FFAA33') */
  color: string;
  /** Light intensity 0-1 (affects alpha blending) */
  intensity: number;
  /** Type of light source */
  type?: LightType;
  /** Whether this light is currently active */
  enabled?: boolean;
  /** If attached to an entity, the entity ID */
  attachedToEntityId?: string;
  /** Animation settings for flickering lights */
  animation?: LightAnimation;
}

// ---------------------------------------------------------------------------
// Whiteboard Drawing Types
// ---------------------------------------------------------------------------

/**
 * Drawing tool types for whiteboard mode
 */
export type DrawingToolType = 'pen' | 'rectangle' | 'circle' | 'triangle' | 'eraser';

/**
 * A single drawing stroke (synced unit)
 */
export interface DrawingStroke {
  /** Unique identifier for CRDT sync */
  id: string;
  /** Tool used to create this stroke */
  type: DrawingToolType;
  /** Path points - pen uses many, shapes use 2 (start/end corners) */
  points: { x: number; y: number }[];
  /** Hex color (e.g., '#FF0000') */
  color: string;
  /** Stroke width in pixels */
  width: number;
  /** Opacity 0-1 */
  opacity: number;
  /** Whether grid snap was enabled when drawing */
  gridSnapped: boolean;
  /** Director user ID who created this stroke */
  createdBy: string;
  /** Unix timestamp */
  createdAt: number;
}

/**
 * Drawing layer state for whiteboard mode
 */
export interface DrawingLayerState {
  /** All strokes in draw order */
  strokes: DrawingStroke[];
  /** true = empty canvas (no map), false = draw over map */
  isWhiteboardMode: boolean;
}

/**
 * Battle grid state
 */
export interface GridState {
  width: number;
  height: number;
  /** Pixels per square (1 square = 5 feet) */
  squareSize: number;
  backgroundUrl?: string;
  tokens: TokenState[];
  walls: Wall[];
  lights: Light[];
  fogRevealed: boolean[][];
  difficultTerrain: boolean[][];
  /** Whiteboard drawing layer state */
  drawings?: DrawingLayerState;

  // Grid display settings
  /** Grid line opacity (0.0 - 1.0, default 0.5) */
  gridOpacity?: number;
  /** Grid line color as hex string (default '#444444') */
  gridColor?: string;
  /** Whether to show grid lines (default true) */
  showGrid?: boolean;

  // Grid alignment settings (for aligning with pre-drawn map grids)
  /** Grid offset X in pixels for alignment (default 0) */
  gridOffsetX?: number;
  /** Grid offset Y in pixels for alignment (default 0) */
  gridOffsetY?: number;
}

// Scene state types

export interface StoryState {
  type: 'story';
  /** Director-only */
  directorNotes: string;
  readAloudText?: string;
}

/**
 * Serialized combatant for sync
 */
export interface SerializedCombatant {
  entityId: string;
  side: 'heroes' | 'enemies';
  hasActed: boolean;
  isSurprised: boolean;
  groupId?: string;
}

/**
 * Serialized enemy group for sync
 */
export interface SerializedEnemyGroup {
  id: string;
  name: string;
  memberIds: string[];
  membersActed: string[];
  isActive: boolean;
}

/**
 * Combat log entry for persistence
 */
export interface CombatLogEntry {
  id: string;
  timestamp: number;
  type: string;
  message: string;
  entityId?: string;
  entityName?: string;
  amount?: number;
  details?: Record<string, unknown>;
}

export interface BattleState {
  type: 'battle';
  round: number;
  turn: number;
  phase: 'setup' | 'initiative' | 'active' | 'resolved';
  initiativeOrder: InitiativeEntry[];
  grid: GridState;
  /** Director's resource for enemy abilities */
  malice: number;
  malicePerRound: number;

  /** Full combat state for alternating activation */
  combatState?: {
    firstSide: 'heroes' | 'enemies';
    activeSide: 'heroes' | 'enemies';
    activeEntityId: string | null;
    activeGroupId: string | null;
    isFirstRound: boolean;
    combatants: SerializedCombatant[];
    enemyGroups: SerializedEnemyGroup[];
  };

  /** Per-entity heroic resources (hero ID -> amount) */
  heroicResources?: Record<string, number>;

  /** Combat log for replay/display */
  combatLog?: CombatLogEntry[];
}

// ---------------------------------------------------------------------------
// Enhanced Montage Types
// ---------------------------------------------------------------------------

/** Montage test difficulty levels */
export type MontageDifficulty = 'trivial' | 'easy' | 'moderate' | 'hard' | 'extreme';

/** Test difficulty category for roll interpretation */
export type MontageTestDifficulty = 'easy' | 'medium' | 'hard';

/** Test result types matching Draw Steel outcomes */
export type MontageTestResult =
  | 'success'
  | 'success_consequence' // S+C - Success with consequence
  | 'success_reward' // S+R - Success with reward
  | 'failure'
  | 'failure_consequence'; // F+C - Failure with consequence

/** Assist result types - effect on the test being assisted */
export type MontageAssistResult = 'bane' | 'edge' | 'double_edge';

/** Challenge unlock condition */
export interface MontageChallengeUnlock {
  type: 'none' | 'any_of' | 'all_of';
  challengeIds?: string[];
}

/** Runtime montage challenge (used during play) */
export interface MontageRuntimeChallenge {
  id: string;
  name: string;
  description: string;
  category: 'general' | 'hazard' | 'restricted';
  suggestedCharacteristics: CharacteristicName[];
  suggestedSkills: string[];
  specialNote?: string; // Bane/edge conditions
  unlock: MontageChallengeUnlock; // Prerequisites
  completed: boolean;
  order: number;
}

/** Enhanced test record with full details */
export interface MontageTest {
  id: string;
  round: number;
  heroId: string;
  heroName: string;
  challengeId: string;
  challengeName: string;
  skill: string;
  characteristic: CharacteristicName;
  roll: number; // Raw roll (1-20)
  modifier: number; // Characteristic modifier
  difficulty: MontageTestDifficulty;
  result: MontageTestResult;
  isNatural19or20: boolean;
  timestamp: number;
  revealed: boolean; // For reveal queue
}

/** Assist attempt */
export interface MontageAssist {
  id: string;
  round: number;
  heroId: string;
  heroName: string;
  targetTestId: string; // Which test they're assisting
  skill: string;
  characteristic: CharacteristicName;
  roll: number;
  result: MontageAssistResult; // ≤11: bane, 12-16: edge, 17+: double_edge
  timestamp: number;
  revealed: boolean;
}

/** Outcome descriptions (director-defined) */
export interface MontageOutcomeDescriptions {
  totalSuccess: string;
  partialSuccess: string;
  totalFailure: string;
}

/** Queued reveal for dramatic timing */
export interface MontageQueuedReveal {
  id: string;
  type: 'test_result' | 'assist_result' | 'challenge_unlock' | 'outcome';
  targetId: string; // Test ID, assist ID, challenge ID, or outcome type
  timestamp: number;
}

/** Enhanced MontageState */
export interface MontageState {
  type: 'montage';

  // Core metadata
  title: string;
  goal: string; // "Unmask the Ringmaster..."
  difficulty: MontageDifficulty;

  // Limits (scale by hero count)
  baseSuccessLimit: number;
  baseFailureLimit: number;
  heroCountAdjustment: boolean; // Auto-adjust limits by hero count

  // Current state
  currentRound: number;
  currentSuccesses: number;
  currentFailures: number;
  outcome: 'pending' | 'total_success' | 'partial_success' | 'total_failure';

  // Challenges
  challenges: MontageRuntimeChallenge[];
  hazards: string[]; // Director-only hazard notes

  // Test tracking
  tests: MontageTest[];
  assists: MontageAssist[];
  usedSkills: Record<string, string[]>; // heroId -> skills used

  // Outcomes (editable by director)
  outcomeDescriptions: MontageOutcomeDescriptions;

  // Reveal queue (for dramatic timing)
  revealQueueEnabled: boolean;
  revealQueue: MontageQueuedReveal[];

  // Assets
  backgroundAssetId?: string; // Reference to campaign asset
  directorNotes: string;
  readAloudText: string; // Shown to players
}

export interface Motivation {
  id: string;
  description: string;
  revealed: boolean;
  edgeOnAppeal: boolean;
}

export interface Pitfall {
  id: string;
  description: string;
  triggered: boolean;
  patienceLoss: number;
}

export interface ArgumentAttempt {
  entityId: string;
  approach: string;
  skill?: string;
  rollResult?: number;
  tier: 1 | 2 | 3;
  usedMotivation?: string;
  hitPitfall?: string;
  interestChange: number;
  patienceChange: number;
}

export interface NegotiationState {
  type: 'negotiation';
  npcEntityId: string;
  interest: number;
  patience: number;
  targetInterest: number;
  interestRevealed: boolean;
  phase: 'active' | 'success' | 'failure';
  motivations: Motivation[];
  /** Director-only */
  pitfalls: Pitfall[];
  arguments: ArgumentAttempt[];
}

export interface ProjectProgress {
  projectId: string;
  projectName: string;
  rollResult: number;
  progressMade: number;
  totalProgress: number;
  goalProgress: number;
}

export type RespiteActivityType =
  | 'recover'
  | 'craft'
  | 'research'
  | 'socialize'
  | 'change-kit'
  | 'custom';

export interface RespiteActivity {
  entityId: string;
  activity: RespiteActivityType;
  customDescription?: string;
  project?: ProjectProgress;
  result?: string;
}

export interface RespiteState {
  type: 'respite';
  location: string;
  activities: RespiteActivity[];
  completed: boolean;
  victoriesConverted: number;
}

/**
 * Scene state discriminated union
 */
export type SceneState = StoryState | BattleState | MontageState | NegotiationState | RespiteState;

/**
 * Scene - the unit of play
 */
export interface Scene {
  id: string;
  type: SceneType;
  title: string;
  order: number;
  backgroundImage?: string;
  entityIds: string[];
  state: SceneState;
  lastModifiedBy: string;

  // Sync metadata for CRDT conflict resolution
  version: number;
  versionNonce: number;
  isDeleted: boolean;
}

// Type guards
export function isStoryScene(scene: Scene): scene is Scene & { state: StoryState } {
  return scene.type === 'story';
}

export function isBattleScene(scene: Scene): scene is Scene & { state: BattleState } {
  return scene.type === 'battle';
}

export function isMontageScene(scene: Scene): scene is Scene & { state: MontageState } {
  return scene.type === 'montage';
}

export function isNegotiationScene(scene: Scene): scene is Scene & { state: NegotiationState } {
  return scene.type === 'negotiation';
}

export function isRespiteScene(scene: Scene): scene is Scene & { state: RespiteState } {
  return scene.type === 'respite';
}

// ---------------------------------------------------------------------------
// Scene Template Types (for Wizard)
// ---------------------------------------------------------------------------

/**
 * 12 Draw Steel motivation/pitfall types
 */
export type MotivationType =
  | 'benevolence'
  | 'discovery'
  | 'freedom'
  | 'greed'
  | 'higher_authority'
  | 'justice'
  | 'legacy'
  | 'peace'
  | 'power'
  | 'protection'
  | 'revelry'
  | 'vengeance';

/**
 * Difficulty levels for scenes
 */
export type SceneDifficulty = 'easy' | 'moderate' | 'hard';

/**
 * NPC starting attitude in negotiations
 */
export type NPCAttitude = 'hostile' | 'unfriendly' | 'neutral' | 'friendly' | 'helpful';

// Battle Scene Template Types

export interface MaliceFeature {
  id: string;
  name: string;
  cost: number | string; // number or "5+" for variable
  description: string;
  isStandard: boolean;
}

export interface CreatureStats {
  stability: number;
  speed: number | string; // number or "6 (climb)"
  freeStrike: number;
  distance: number;
}

export interface CreatureEntry {
  id: string;
  monsterId?: string; // Reference to bestiary
  name: string;
  count: number;
  ev: number;
  stamina: number | number[]; // Single or per-creature array
  stats: CreatureStats;
  notes?: string;
}

export interface CreatureGroup {
  id: string;
  turnOrder: number;
  creatures: CreatureEntry[];
  notes?: string;
}

export interface DynamicTerrainObject {
  id: string;
  name: string;
  ev: number;
  stamina?: number;
  notes?: string;
}

export interface BattleSceneTemplate {
  // Header
  title: string;
  mapUrl?: string;

  // Grid dimensions (for whiteboard/drawing mode)
  gridWidth?: number;
  gridHeight?: number;

  // Drawing state (whiteboard annotations)
  drawings?: DrawingLayerState;

  // Fog of war state (paint-to-hide model)
  // true = revealed (no fog), false = fogged (hidden)
  // Default: all true (fully revealed) - director paints to hide
  fogRevealed?: boolean[][];

  // Party Context
  partyConfig: {
    expectedHeroes: number;
    averageLevel: number;
    heroesVictories: number;
  };

  // Difficulty
  difficulty: SceneDifficulty;
  expectedEV: { min: number; max: number };

  // Malice System
  maliceFeatures: MaliceFeature[];

  // === NEW: Positioned Tokens (Primary - Campaign Builder Canvas) ===
  /** Tokens placed on the canvas with exact positions */
  placedTokens?: PlacedToken[];

  // === DEPRECATED: Quantity-based (Legacy Support) ===
  /**
   * @deprecated Use placedTokens instead. Kept for migration and backward compatibility.
   * CreatureGroups define monsters by quantity without positions.
   */
  creatureGroups: CreatureGroup[];

  // Synced Heroes (from Mettle)
  selectedHeroIds?: string[];

  // Terrain
  dynamicTerrain: DynamicTerrainObject[];

  // Victory Conditions
  successCondition: string;
  failureCondition: string;

  // Audio
  /** ID of music track from campaign assets */
  audioMusic?: string;
  /** ID of ambient/effect track from campaign assets */
  audioEffect?: string;
}

// Negotiation Scene Template Types

export interface NegotiationMotivation {
  id: string;
  type: MotivationType;
  description: string;
  revealed: boolean;
}

export interface NegotiationPitfall {
  id: string;
  type: MotivationType;
  description: string;
  revealed: boolean;
}

export interface ImpressionModifier {
  id: string;
  condition: string;
  modifier: number;
  appliesTo?: string[]; // Skills this affects
}

export interface InterestResponse {
  label: string;
  text: string;
}

export interface NegotiationSceneTemplate {
  // NPC Info
  npc: {
    name: string;
    description?: string;
    portraitUrl?: string;
  };

  // Starting State
  startingAttitude: NPCAttitude;
  startingInterest: number; // 0-5
  startingPatience: number; // 0-5
  impression: number; // Modifier

  // Impression Modifiers
  impressionModifiers: ImpressionModifier[];

  // Motivations & Pitfalls
  motivations: NegotiationMotivation[];
  pitfalls: NegotiationPitfall[];

  // NPC Stats
  characteristics: {
    might: number;
    agility: number;
    reason: number;
    intuition: number;
    presence: number;
  };
  skills: string[];
  languages: string[];

  // Responses by Interest Level
  responses: {
    interest0: InterestResponse; // "No, and..."
    interest1: InterestResponse; // "No."
    interest2: InterestResponse; // "No, but..."
    interest3: InterestResponse; // "Yes, but..."
    interest4: InterestResponse; // "Yes."
    interest5: InterestResponse; // "Yes, and..."
  };

  // Audio
  /** ID of music track from campaign assets */
  audioMusic?: string;
  /** ID of ambient/effect track from campaign assets */
  audioEffect?: string;
}

// Montage Scene Template Types

/** Challenge template for scene creation (converts to MontageRuntimeChallenge) */
export interface MontageTemplateChallenge {
  id: string;
  name: string;
  description: string;
  category: 'hazard' | 'restricted' | 'general';
  suggestedCharacteristics?: CharacteristicName[];
  suggestedSkills?: string[];
  specialNote?: string; // Edge/bane conditions
  unlockType: 'none' | 'any_of' | 'all_of';
  unlockChallengeIds?: string[]; // Prerequisites
  order: number;
}

/** Re-export for backward compatibility */
export type MontageChallenge = MontageTemplateChallenge;

/** Outcomes - re-export for template usage */
export type MontageOutcomes = MontageOutcomeDescriptions;

export interface MontageSceneTemplate {
  // Header
  title: string;
  goal: string;
  description?: string;

  // Configuration
  rounds?: number; // Optional, unlimited if not set
  difficulty: MontageDifficulty;

  // Limits (base - adjusted by hero count if heroCountAdjustment is true)
  baseSuccessLimit: number;
  baseFailureLimit: number;
  heroCountAdjustment: boolean;

  // Challenges
  challenges: MontageTemplateChallenge[];
  hazards: string[]; // Director-only hazard notes

  // Outcomes
  outcomes: MontageOutcomeDescriptions;

  // Assets
  backgroundAssetId?: string;
  readAloudText?: string;

  // Notes
  directorNotes?: string;

  // Audio
  /** ID of music track from campaign assets */
  audioMusic?: string;
  /** ID of ambient/effect track from campaign assets */
  audioEffect?: string;
}

// Story Scene Template Types

export interface StorySceneTemplate {
  title: string;
  readAloudText?: string;
  directorNotes?: string;
  npcIds: string[]; // Entity references
  backgroundUrl?: string;

  // Audio
  /** ID of music track from campaign assets */
  audioMusic?: string;
  /** ID of ambient/effect track from campaign assets */
  audioEffect?: string;
}

// Respite Scene Template Types

export interface RespiteActivityOption {
  id: string;
  name: string;
  description: string;
  category: 'recover' | 'craft' | 'research' | 'socialize' | 'change_kit' | 'custom';
}

export interface RespiteProject {
  id: string;
  name: string;
  description: string;
  goalPoints: number;
  currentPoints: number;
  source: 'stronghold' | 'organization' | 'research' | 'title' | 'other';
}

export interface RespiteSceneTemplate {
  location: {
    name: string;
    description?: string;
  };
  availableActivities: RespiteActivityOption[];
  projects?: RespiteProject[];
  duration?: string;

  // Audio
  /** ID of music track from campaign assets */
  audioMusic?: string;
  /** ID of ambient/effect track from campaign assets */
  audioEffect?: string;
}

// Union type for all templates
export type SceneTemplate =
  | { type: 'battle'; template: BattleSceneTemplate }
  | { type: 'negotiation'; template: NegotiationSceneTemplate }
  | { type: 'montage'; template: MontageSceneTemplate }
  | { type: 'story'; template: StorySceneTemplate }
  | { type: 'respite'; template: RespiteSceneTemplate };
