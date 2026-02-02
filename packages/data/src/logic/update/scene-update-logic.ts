/**
 * Scene Update Logic
 *
 * Ensures backward compatibility when loading scene data from Supabase.
 * Adds missing fields with sensible defaults for each scene type.
 *
 * Reference: Forge Steel update logic patterns
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SceneType = 'battle' | 'story' | 'montage' | 'negotiation' | 'respite';

export interface SceneLike {
  id?: string;
  type?: SceneType;
  title?: string;
  order?: number;
  backgroundImage?: string | null;
  entityIds?: string[];
  state?: unknown;
  version?: number;
  lastModifiedBy?: string | null;
}

export interface BattleStateLike {
  type?: 'battle';
  round?: number;
  turn?: number;
  phase?: string;
  initiativeOrder?: unknown[];
  grid?: unknown;
  malice?: number;
  malicePerRound?: number;
  combatState?: unknown;
  heroicResources?: Record<string, number>;
  combatLog?: unknown[];
  firstSide?: string | null;
  currentTurnIndex?: number;
}

export interface MontageStateLike {
  type?: 'montage';
  title?: string;
  goal?: string;
  difficulty?: string;
  baseSuccessLimit?: number;
  baseFailureLimit?: number;
  heroCountAdjustment?: boolean;
  currentRound?: number;
  currentSuccesses?: number;
  currentFailures?: number;
  outcome?: string;
  challenges?: unknown[];
  hazards?: unknown[];
  tests?: unknown[];
  assists?: unknown[];
  usedSkills?: Record<string, string[]>;
  outcomeDescriptions?: {
    totalSuccess?: string;
    partialSuccess?: string;
    totalFailure?: string;
  };
  revealQueueEnabled?: boolean;
  revealQueue?: unknown[];
  directorNotes?: string;
  readAloudText?: string;
}

export interface NegotiationStateLike {
  type?: 'negotiation';
  npcEntityId?: string;
  interest?: number;
  patience?: number;
  targetInterest?: number;
  interestRevealed?: boolean;
  phase?: string;
  motivations?: unknown[];
  pitfalls?: unknown[];
  arguments?: unknown[];
}

export interface RespiteStateLike {
  type?: 'respite';
  location?: string;
  activities?: unknown[];
  completed?: boolean;
  victoriesConverted?: number;
}

export interface StoryStateLike {
  type?: 'story';
  directorNotes?: string;
  readAloudText?: string;
}

// ---------------------------------------------------------------------------
// Scene Update Logic
// ---------------------------------------------------------------------------

/**
 * Update scene structure to current schema version.
 * Safe to call multiple times (idempotent).
 *
 * @param scene - Scene object to update (mutated in place)
 */
export function update(scene: SceneLike): void {
  updateStructure(scene);
  updateSceneTypeState(scene);
}

/**
 * Add missing top-level scene fields with defaults.
 */
export function updateStructure(scene: SceneLike): void {
  if (scene.version === undefined) scene.version = 1;
  if (scene.lastModifiedBy === undefined) scene.lastModifiedBy = null;
  if (scene.entityIds === undefined) scene.entityIds = [];
  if (scene.backgroundImage === undefined) scene.backgroundImage = null;
  if (scene.order === undefined) scene.order = 0;
}

/**
 * Update scene-type-specific state.
 */
export function updateSceneTypeState(scene: SceneLike): void {
  if (!scene.type || !scene.state) return;

  switch (scene.type) {
    case 'battle':
      updateBattleState(scene.state as BattleStateLike);
      break;
    case 'montage':
      updateMontageState(scene.state as MontageStateLike);
      break;
    case 'negotiation':
      updateNegotiationState(scene.state as NegotiationStateLike);
      break;
    case 'respite':
      updateRespiteState(scene.state as RespiteStateLike);
      break;
    case 'story':
      updateStoryState(scene.state as StoryStateLike);
      break;
  }
}

// ---------------------------------------------------------------------------
// Battle State Updates
// ---------------------------------------------------------------------------

/**
 * Update battle state with defaults.
 */
export function updateBattleState(state: BattleStateLike): void {
  if (state.type === undefined) state.type = 'battle';
  if (state.round === undefined) state.round = 0;
  if (state.turn === undefined) state.turn = 0;
  if (state.phase === undefined) state.phase = 'setup';
  if (state.initiativeOrder === undefined) state.initiativeOrder = [];
  if (state.malice === undefined) state.malice = 0;
  if (state.malicePerRound === undefined) state.malicePerRound = 4;
  if (state.heroicResources === undefined) state.heroicResources = {};
  if (state.combatLog === undefined) state.combatLog = [];
  if (state.firstSide === undefined) state.firstSide = null;
  if (state.currentTurnIndex === undefined) state.currentTurnIndex = 0;

  // Grid defaults
  if (state.grid === undefined) {
    state.grid = createDefaultGrid();
  }
}

/**
 * Create default battle grid.
 */
export function createDefaultGrid(): unknown {
  return {
    width: 20,
    height: 15,
    squareSize: 50,
    backgroundUrl: undefined,
    tokens: [],
    walls: [],
    lights: [],
    fogRevealed: [],
    difficultTerrain: [],
  };
}

// ---------------------------------------------------------------------------
// Montage State Updates
// ---------------------------------------------------------------------------

/**
 * Update montage state with defaults.
 */
export function updateMontageState(state: MontageStateLike): void {
  if (state.type === undefined) state.type = 'montage';
  if (state.title === undefined) state.title = '';
  if (state.goal === undefined) state.goal = '';
  if (state.difficulty === undefined) state.difficulty = 'moderate';
  if (state.baseSuccessLimit === undefined) state.baseSuccessLimit = 6;
  if (state.baseFailureLimit === undefined) state.baseFailureLimit = 3;
  if (state.heroCountAdjustment === undefined) state.heroCountAdjustment = true;
  if (state.currentRound === undefined) state.currentRound = 1;
  if (state.currentSuccesses === undefined) state.currentSuccesses = 0;
  if (state.currentFailures === undefined) state.currentFailures = 0;
  if (state.outcome === undefined) state.outcome = 'pending';
  if (state.challenges === undefined) state.challenges = [];
  if (state.hazards === undefined) state.hazards = [];
  if (state.tests === undefined) state.tests = [];
  if (state.assists === undefined) state.assists = [];
  if (state.usedSkills === undefined) state.usedSkills = {};
  if (state.revealQueueEnabled === undefined) state.revealQueueEnabled = false;
  if (state.revealQueue === undefined) state.revealQueue = [];
  if (state.directorNotes === undefined) state.directorNotes = '';
  if (state.readAloudText === undefined) state.readAloudText = '';

  // Outcome descriptions
  if (state.outcomeDescriptions === undefined) {
    state.outcomeDescriptions = {
      totalSuccess: '',
      partialSuccess: '',
      totalFailure: '',
    };
  } else {
    if (state.outcomeDescriptions.totalSuccess === undefined) {
      state.outcomeDescriptions.totalSuccess = '';
    }
    if (state.outcomeDescriptions.partialSuccess === undefined) {
      state.outcomeDescriptions.partialSuccess = '';
    }
    if (state.outcomeDescriptions.totalFailure === undefined) {
      state.outcomeDescriptions.totalFailure = '';
    }
  }
}

// ---------------------------------------------------------------------------
// Negotiation State Updates
// ---------------------------------------------------------------------------

/**
 * Update negotiation state with defaults.
 */
export function updateNegotiationState(state: NegotiationStateLike): void {
  if (state.type === undefined) state.type = 'negotiation';
  if (state.npcEntityId === undefined) state.npcEntityId = '';
  if (state.interest === undefined) state.interest = 0;
  if (state.patience === undefined) state.patience = 5;
  if (state.targetInterest === undefined) state.targetInterest = 5;
  if (state.interestRevealed === undefined) state.interestRevealed = false;
  if (state.phase === undefined) state.phase = 'active';
  if (state.motivations === undefined) state.motivations = [];
  if (state.pitfalls === undefined) state.pitfalls = [];
  if (state.arguments === undefined) state.arguments = [];
}

// ---------------------------------------------------------------------------
// Respite State Updates
// ---------------------------------------------------------------------------

/**
 * Update respite state with defaults.
 */
export function updateRespiteState(state: RespiteStateLike): void {
  if (state.type === undefined) state.type = 'respite';
  if (state.location === undefined) state.location = '';
  if (state.activities === undefined) state.activities = [];
  if (state.completed === undefined) state.completed = false;
  if (state.victoriesConverted === undefined) state.victoriesConverted = 0;
}

// ---------------------------------------------------------------------------
// Story State Updates
// ---------------------------------------------------------------------------

/**
 * Update story state with defaults.
 */
export function updateStoryState(state: StoryStateLike): void {
  if (state.type === undefined) state.type = 'story';
  if (state.directorNotes === undefined) state.directorNotes = '';
  if (state.readAloudText === undefined) state.readAloudText = '';
}
