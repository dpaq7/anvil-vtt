/**
 * Session Logic
 *
 * Pure functions for transforming scene templates into running instances.
 * This is the core pattern for the Director system - scenes are created once
 * as templates, then "started" to create a running instance with runtime state.
 *
 * Key insight: Templates are never mutated. Starting a scene creates a deep copy
 * with a new ID and initialized runtime state.
 *
 * Reference: Forge Steel src/logic/session-logic.ts
 */

import * as FactoryLogic from './factory-logic.js';
import * as HeroLogic from './hero-logic.js';
import * as MonsterLogic from './monster-logic.js';
import * as MontageLogic from './montage-logic.js';
import * as NegotiationLogic from './negotiation-logic.js';
import * as BattleLogic from './battle-logic.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Scene types.
 */
export type SceneType = 'battle' | 'montage' | 'negotiation' | 'respite' | 'story';

/**
 * Grid position on battle map.
 */
export interface GridPosition {
  x: number;
  y: number;
  elevation?: number;
}

/**
 * Condition instance.
 */
export interface ConditionInstance {
  name: string;
  source?: string;
  endTrigger?: 'end_of_turn' | 'save_ends' | 'duration' | 'manual';
  duration?: number;
  potency?: number;
}

/**
 * Hero battle state (runtime state during combat).
 */
export interface HeroBattleState {
  currentStamina: number;
  tempStamina: number;
  heroicResource: number;
  surges: number;
  conditions: ConditionInstance[];
  usedRecoveries: number;
  usedActions: {
    action: boolean;
    maneuver: boolean;
    reaction: boolean;
    freeManeuver: boolean;
  };
  position: GridPosition | null;
  defeated: boolean;
}

/**
 * Monster battle state (runtime state during combat).
 */
export interface MonsterBattleState {
  currentStamina: number;
  tempStamina: number;
  conditions: ConditionInstance[];
  usedActions: {
    action: boolean;
    reaction: boolean;
  };
  position: GridPosition | null;
  defeated: boolean;
  captainId: string | null;
}

/**
 * Minimal hero for session logic.
 */
export interface HeroLike {
  id: string;
  name: string;
  heroClass?: string | null;
  level?: number;
  characteristics?: Record<string, number>;
  maxStamina?: number;
  maxRecoveries?: number;
}

/**
 * Minimal monster for session logic.
 */
export interface MonsterLike {
  id?: string;
  name: string;
  level?: number;
  stamina?: number;
  role?: {
    type?: string;
    organization?: MonsterLogic.MonsterOrganization;
  };
}

/**
 * Party (collection of heroes).
 */
export interface Party {
  heroes: HeroLike[];
}

/**
 * Encounter slot for battle templates.
 */
export interface EncounterSlot {
  monster: MonsterLike;
  count: number;
}

/**
 * Scene outcome result.
 */
export type SceneOutcome =
  | { type: 'success'; details?: string }
  | { type: 'failure'; details?: string }
  | { type: 'partial'; details?: string }
  | { type: 'abandoned'; details?: string };

// ---------------------------------------------------------------------------
// Template Types (what you design)
// ---------------------------------------------------------------------------

/**
 * Base template properties.
 */
export interface BaseTemplate {
  id: string;
  title?: string;
}

/**
 * Battle scene template.
 */
export interface BattleSceneTemplate extends BaseTemplate {
  type: 'battle';
  encounterSlots?: EncounterSlot[];
  maliceFeatures?: unknown[];
  gridConfig?: {
    width?: number;
    height?: number;
  };
}

/**
 * Montage scene template.
 */
export interface MontageSceneTemplate extends BaseTemplate {
  type: 'montage';
  goal?: string;
  difficulty?: string;
  baseSuccessLimit?: number;
  baseFailureLimit?: number;
  heroCountAdjustment?: boolean;
  challenges?: Array<{ id: string; name: string }>;
  outcomes?: {
    totalSuccess?: string;
    partialSuccess?: string;
    totalFailure?: string;
  };
}

/**
 * NPC attitude type - imported from negotiation-logic.
 */
import type { NPCAttitude } from './negotiation-logic.js';
export type { NPCAttitude };

/**
 * Negotiation scene template.
 */
export interface NegotiationSceneTemplate extends BaseTemplate {
  type: 'negotiation';
  npc?: {
    name?: string;
    attitude?: NPCAttitude;
  };
  targetInterest?: number;
  motivations?: Array<{ id: string; description: string }>;
  pitfalls?: Array<{ id: string; description: string }>;
}

/**
 * Respite scene template.
 */
export interface RespiteSceneTemplate extends BaseTemplate {
  type: 'respite';
  location?: {
    name?: string;
  };
  activitiesAllowed?: number;
}

/**
 * Story scene template.
 */
export interface StorySceneTemplate extends BaseTemplate {
  type: 'story';
  readAloudText?: string;
  directorNotes?: string;
}

/**
 * Union of all scene templates.
 */
export type SceneTemplate =
  | BattleSceneTemplate
  | MontageSceneTemplate
  | NegotiationSceneTemplate
  | RespiteSceneTemplate
  | StorySceneTemplate;

// ---------------------------------------------------------------------------
// Instance Types (what you run)
// ---------------------------------------------------------------------------

/**
 * Base instance properties.
 */
export interface BaseInstance {
  id: string;
  templateId: string;
  title?: string;
  startedAt: string;
  completedAt?: string;
  outcome?: SceneOutcome;
  resetCount?: number;
}

/**
 * Battle instance state.
 */
export interface BattleInstanceState {
  phase: 'setup' | 'initiative' | 'active' | 'resolved';
  round: number;
  malice: number;
  firstSide: 'heroes' | 'enemies' | null;
  initiativeOrder: Array<{ entityId: string; initiative: number }>;
  currentTurnIndex: number;
  turnsTakenThisRound: string[];
  defeatedEntities: string[];
  completed?: boolean;
}

/**
 * Battle scene instance.
 */
export interface BattleSceneInstance extends BaseInstance {
  type: 'battle';
  state: BattleInstanceState;
  monsters: Array<MonsterLike & { state: MonsterBattleState }>;
  heroes?: Array<HeroLike & { instanceState: HeroBattleState }>;
  malicePerRound: number;
}

/**
 * Hero participation in montage.
 */
export interface MontageHeroParticipation {
  heroId: string;
  testsThisRound: number;
  totalTests: number;
}

/**
 * Montage test result record.
 */
export interface MontageTestRecord {
  id: string;
  heroId: string;
  challengeId?: string;
  skill?: string;
  result: 'success' | 'failure';
  timestamp: number;
}

/**
 * Montage instance state.
 */
export interface MontageInstanceState {
  currentRound: number;
  maxRounds: number;
  successes: number;
  failures: number;
  successLimit: number;
  failureLimit: number;
  heroParticipation: MontageHeroParticipation[];
  testResults: MontageTestRecord[];
  unlockedChallenges: string[];
  completed?: boolean;
}

/**
 * Montage scene instance.
 */
export interface MontageSceneInstance extends BaseInstance {
  type: 'montage';
  state: MontageInstanceState;
  goal?: string;
  challenges?: Array<{ id: string; name: string }>;
}

/**
 * Argument record for negotiation.
 */
export interface ArgumentRecord {
  id: string;
  heroId?: string;
  skill?: string;
  tier: 1 | 2 | 3;
  usedMotivation: boolean;
  hitPitfall: boolean;
  interestChange: number;
  patienceChange: number;
  timestamp: number;
}

/**
 * Negotiation instance state.
 */
export interface NegotiationInstanceState {
  currentInterest: number;
  currentPatience: number;
  targetInterest: number;
  motivationsUsed: string[];
  pitfallsTriggered: string[];
  argumentHistory: ArgumentRecord[];
  phase: 'active' | 'success' | 'failure';
  completed?: boolean;
}

/**
 * Negotiation scene instance.
 */
export interface NegotiationSceneInstance extends BaseInstance {
  type: 'negotiation';
  state: NegotiationInstanceState;
}

/**
 * Activity record for respite.
 */
export interface ActivityRecord {
  id: string;
  heroId: string;
  activityType: string;
  result?: string;
  timestamp: number;
}

/**
 * Project progress record.
 */
export interface ProjectProgressRecord {
  projectId: string;
  progress: number;
  completed: boolean;
}

/**
 * Hero activities in respite.
 */
export interface RespiteHeroActivities {
  heroId: string;
  activitiesUsed: number;
  activitiesRemaining: number;
  completedActivities: ActivityRecord[];
}

/**
 * Respite instance state.
 */
export interface RespiteInstanceState {
  activitiesPerHero: number;
  heroActivities: RespiteHeroActivities[];
  projectProgress: ProjectProgressRecord[];
  completedActivities: ActivityRecord[];
  completed?: boolean;
}

/**
 * Respite scene instance.
 */
export interface RespiteSceneInstance extends BaseInstance {
  type: 'respite';
  state: RespiteInstanceState;
}

/**
 * Story instance state.
 */
export interface StoryInstanceState {
  notes: string;
  completed: boolean;
}

/**
 * Story scene instance.
 */
export interface StorySceneInstance extends BaseInstance {
  type: 'story';
  state: StoryInstanceState;
}

/**
 * Union of all scene instances.
 */
export type SceneInstance =
  | BattleSceneInstance
  | MontageSceneInstance
  | NegotiationSceneInstance
  | RespiteSceneInstance
  | StorySceneInstance;

// ---------------------------------------------------------------------------
// Start Options
// ---------------------------------------------------------------------------

export interface StartBattleOptions {
  expectedHeroCount?: number;
  prerollInitiative?: boolean;
}

export interface StartMontageOptions {
  expectedHeroCount?: number;
}

export interface StartNegotiationOptions {
  // Reserved for future options
}

export interface StartRespiteOptions {
  activitiesOverride?: number;
}

export interface StartSceneOptions
  extends StartBattleOptions,
    StartMontageOptions,
    StartNegotiationOptions,
    StartRespiteOptions {}

// ---------------------------------------------------------------------------
// Utility Functions
// ---------------------------------------------------------------------------

/**
 * Deep copy an object (templates are never mutated).
 *
 * @param obj - Object to copy
 * @returns Deep copy
 */
export function deepCopy<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  // Use structuredClone if available, fallback to JSON
  if (typeof structuredClone === 'function') {
    return structuredClone(obj);
  }

  return JSON.parse(JSON.stringify(obj));
}

// ---------------------------------------------------------------------------
// Battle Scene
// ---------------------------------------------------------------------------

/**
 * Start a battle scene from a template.
 *
 * - Creates deep copy (never mutates template)
 * - Assigns new instance ID
 * - Instantiates monsters from slots (with unique names if multiples)
 * - Initializes combat state
 * - Optionally adds heroes from party
 *
 * @param template - Battle scene template
 * @param party - Optional party of heroes
 * @param options - Start options
 * @returns Battle scene instance
 */
export function startBattle(
  template: BattleSceneTemplate,
  party?: Party,
  options?: StartBattleOptions
): BattleSceneInstance {
  const templateCopy = deepCopy(template);

  // Initialize battle state
  const state: BattleInstanceState = {
    phase: 'setup',
    round: 0,
    malice: 0,
    firstSide: null,
    initiativeOrder: [],
    currentTurnIndex: -1,
    turnsTakenThisRound: [],
    defeatedEntities: [],
  };

  // Instantiate monsters from encounter slots
  const monsters = instantiateMonsters(templateCopy.encounterSlots ?? []);

  // Add heroes if party provided
  let heroes: Array<HeroLike & { instanceState: HeroBattleState }> | undefined;
  if (party) {
    heroes = party.heroes.map((hero) => ({
      ...deepCopy(hero),
      instanceState: createHeroBattleState(hero),
    }));
  }

  // Calculate malice per round
  const heroCount = heroes?.length ?? options?.expectedHeroCount ?? 4;
  const malicePerRound = BattleLogic.getMalicePerRound(heroCount);

  return {
    id: FactoryLogic.generateId('battle'),
    templateId: template.id,
    title: templateCopy.title,
    type: 'battle',
    startedAt: new Date().toISOString(),
    state,
    monsters,
    heroes,
    malicePerRound,
  };
}

/**
 * Instantiate monsters from encounter slots.
 * Handles naming (Goblin 1, Goblin 2) for multiples.
 *
 * @param slots - Encounter slots
 * @returns Array of instantiated monsters
 */
export function instantiateMonsters(
  slots: EncounterSlot[]
): Array<MonsterLike & { state: MonsterBattleState }> {
  const monsters: Array<MonsterLike & { state: MonsterBattleState }> = [];
  const nameCounts = new Map<string, number>();

  for (const slot of slots) {
    const multiplier = MonsterLogic.getRoleMultiplier(slot.monster.role?.organization);
    const count = slot.count * multiplier;

    for (let i = 0; i < count; i++) {
      const monster = deepCopy(slot.monster);
      monster.id = FactoryLogic.generateId('monster');

      // Handle naming for multiples
      const baseName = monster.name;
      const existingCount = nameCounts.get(baseName) ?? 0;
      nameCounts.set(baseName, existingCount + 1);

      if (count > 1 || existingCount > 0) {
        monster.name = `${baseName} ${existingCount + 1}`;
      }

      // Initialize monster combat state
      const state = createMonsterBattleState(monster);

      monsters.push({ ...monster, state });
    }
  }

  return monsters;
}

/**
 * Create initial battle state for a hero.
 *
 * @param hero - Hero data
 * @returns Hero battle state
 */
export function createHeroBattleState(hero: HeroLike): HeroBattleState {
  // Get max stamina - use provided value or calculate from class/level
  const heroClass = (hero.heroClass ?? 'fury') as HeroLogic.HeroClass;
  const maxStamina = hero.maxStamina ?? HeroLogic.getMaxStaminaForClass(heroClass, hero.level ?? 1);

  // Starting heroic resource is typically 0
  const heroicResource = HeroLogic.getStartingHeroicResource(heroClass);

  return {
    currentStamina: maxStamina,
    tempStamina: 0,
    heroicResource,
    surges: 0,
    conditions: [],
    usedRecoveries: 0,
    usedActions: {
      action: false,
      maneuver: false,
      reaction: false,
      freeManeuver: false,
    },
    position: null,
    defeated: false,
  };
}

/**
 * Create initial battle state for a monster.
 *
 * @param monster - Monster data
 * @returns Monster battle state
 */
export function createMonsterBattleState(monster: MonsterLike): MonsterBattleState {
  const stamina = monster.stamina ?? MonsterLogic.getStamina(monster as MonsterLogic.MonsterLike);

  return {
    currentStamina: stamina,
    tempStamina: 0,
    conditions: [],
    usedActions: {
      action: false,
      reaction: false,
    },
    position: null,
    defeated: false,
    captainId: null,
  };
}

// ---------------------------------------------------------------------------
// Montage Scene
// ---------------------------------------------------------------------------

/**
 * Start a montage scene from a template.
 *
 * - Creates deep copy
 * - Initializes success/failure tracking
 * - Calculates limits based on party size
 *
 * @param template - Montage scene template
 * @param party - Optional party of heroes
 * @param options - Start options
 * @returns Montage scene instance
 */
export function startMontage(
  template: MontageSceneTemplate,
  party?: Party,
  options?: StartMontageOptions
): MontageSceneInstance {
  const templateCopy = deepCopy(template);
  const heroCount = party?.heroes.length ?? options?.expectedHeroCount ?? 5;

  // Create state summary for limit calculation
  const stateSummary: MontageLogic.MontageStateSummary = {
    baseSuccessLimit: templateCopy.baseSuccessLimit ?? 6,
    baseFailureLimit: templateCopy.baseFailureLimit ?? 3,
    heroCountAdjustment: templateCopy.heroCountAdjustment ?? true,
    currentSuccesses: 0,
    currentFailures: 0,
  };

  // Initialize montage state
  const state: MontageInstanceState = {
    currentRound: 1,
    maxRounds: 2, // Standard montage is 2 rounds
    successes: 0,
    failures: 0,
    successLimit: MontageLogic.getEffectiveSuccessLimit(stateSummary, heroCount),
    failureLimit: MontageLogic.getEffectiveFailureLimit(stateSummary, heroCount),
    heroParticipation: [],
    testResults: [],
    unlockedChallenges: templateCopy.challenges?.[0]?.id
      ? [templateCopy.challenges[0].id]
      : [],
  };

  // Track hero participation
  if (party) {
    state.heroParticipation = party.heroes.map((hero) => ({
      heroId: hero.id,
      testsThisRound: 0,
      totalTests: 0,
    }));
  }

  return {
    id: FactoryLogic.generateId('montage'),
    templateId: template.id,
    title: templateCopy.title,
    type: 'montage',
    startedAt: new Date().toISOString(),
    state,
    goal: templateCopy.goal,
    challenges: templateCopy.challenges,
  };
}

// ---------------------------------------------------------------------------
// Negotiation Scene
// ---------------------------------------------------------------------------

/**
 * Start a negotiation scene from a template.
 *
 * - Creates deep copy
 * - Initializes interest/patience from NPC attitude
 *
 * @param template - Negotiation scene template
 * @param _options - Start options (reserved)
 * @returns Negotiation scene instance
 */
export function startNegotiation(
  template: NegotiationSceneTemplate,
  _options?: StartNegotiationOptions
): NegotiationSceneInstance {
  const templateCopy = deepCopy(template);

  // Get starting values from NPC attitude
  const attitude = templateCopy.npc?.attitude ?? 'neutral';
  const startingInterest = NegotiationLogic.getStartingInterest(attitude);
  const startingPatience = NegotiationLogic.getStartingPatience(attitude);

  // Initialize negotiation state
  const state: NegotiationInstanceState = {
    currentInterest: startingInterest,
    currentPatience: startingPatience,
    targetInterest: templateCopy.targetInterest ?? 5,
    motivationsUsed: [],
    pitfallsTriggered: [],
    argumentHistory: [],
    phase: 'active',
  };

  return {
    id: FactoryLogic.generateId('negotiation'),
    templateId: template.id,
    title: templateCopy.title,
    type: 'negotiation',
    startedAt: new Date().toISOString(),
    state,
  };
}

// ---------------------------------------------------------------------------
// Respite Scene
// ---------------------------------------------------------------------------

/**
 * Start a respite scene from a template.
 *
 * - Creates deep copy
 * - Initializes activity tracking per hero
 *
 * @param template - Respite scene template
 * @param party - Optional party of heroes
 * @param options - Start options
 * @returns Respite scene instance
 */
export function startRespite(
  template: RespiteSceneTemplate,
  party?: Party,
  options?: StartRespiteOptions
): RespiteSceneInstance {
  const templateCopy = deepCopy(template);
  const activitiesPerHero =
    options?.activitiesOverride ?? templateCopy.activitiesAllowed ?? 2;

  // Initialize respite state
  const state: RespiteInstanceState = {
    activitiesPerHero,
    heroActivities: [],
    projectProgress: [],
    completedActivities: [],
  };

  // Track activities per hero
  if (party) {
    state.heroActivities = party.heroes.map((hero) => ({
      heroId: hero.id,
      activitiesUsed: 0,
      activitiesRemaining: activitiesPerHero,
      completedActivities: [],
    }));
  }

  return {
    id: FactoryLogic.generateId('respite'),
    templateId: template.id,
    title: templateCopy.title,
    type: 'respite',
    startedAt: new Date().toISOString(),
    state,
  };
}

// ---------------------------------------------------------------------------
// Story Scene
// ---------------------------------------------------------------------------

/**
 * Start a story scene from a template.
 * Story scenes have minimal runtime state.
 *
 * @param template - Story scene template
 * @returns Story scene instance
 */
export function startStory(template: StorySceneTemplate): StorySceneInstance {
  const templateCopy = deepCopy(template);

  return {
    id: FactoryLogic.generateId('story'),
    templateId: template.id,
    title: templateCopy.title,
    type: 'story',
    startedAt: new Date().toISOString(),
    state: {
      notes: '',
      completed: false,
    },
  };
}

// ---------------------------------------------------------------------------
// Generic Start
// ---------------------------------------------------------------------------

/**
 * Start any scene type from a template.
 * Dispatches to the appropriate specific method.
 *
 * @param template - Scene template
 * @param party - Optional party of heroes
 * @param options - Start options
 * @returns Scene instance
 */
export function startScene(
  template: SceneTemplate,
  party?: Party,
  options?: StartSceneOptions
): SceneInstance {
  switch (template.type) {
    case 'battle':
      return startBattle(template, party, options);
    case 'montage':
      return startMontage(template, party, options);
    case 'negotiation':
      return startNegotiation(template, options);
    case 'respite':
      return startRespite(template, party, options);
    case 'story':
      return startStory(template);
    default:
      throw new Error(`Unknown scene type: ${(template as { type: string }).type}`);
  }
}

// ---------------------------------------------------------------------------
// Scene Reset
// ---------------------------------------------------------------------------

/**
 * Reset a scene instance back to initial state.
 * Preserves the instance ID but reinitializes all state.
 *
 * @param instance - Scene instance to reset
 * @param party - Optional party for state initialization
 * @returns Fresh scene instance with same ID
 */
export function resetScene(instance: SceneInstance, party?: Party): SceneInstance {
  // Reconstruct minimal template from instance
  const template = {
    id: instance.templateId,
    type: instance.type,
    title: instance.title,
  } as SceneTemplate;

  // Start fresh
  const fresh = startScene(template, party);

  // Preserve instance ID for DB consistency
  fresh.id = instance.id;
  fresh.resetCount = (instance.resetCount ?? 0) + 1;

  return fresh;
}

// ---------------------------------------------------------------------------
// Scene Completion
// ---------------------------------------------------------------------------

/**
 * Mark a scene as complete and record outcome.
 *
 * @param instance - Scene instance
 * @param outcome - Scene outcome
 * @returns Updated scene instance
 */
export function completeScene(
  instance: SceneInstance,
  outcome: SceneOutcome
): SceneInstance {
  return {
    ...instance,
    completedAt: new Date().toISOString(),
    outcome,
    state: {
      ...instance.state,
      completed: true,
    },
  } as SceneInstance;
}

// ---------------------------------------------------------------------------
// Type Guards
// ---------------------------------------------------------------------------

/**
 * Check if instance is a battle scene.
 */
export function isBattleInstance(instance: SceneInstance): instance is BattleSceneInstance {
  return instance.type === 'battle';
}

/**
 * Check if instance is a montage scene.
 */
export function isMontageInstance(instance: SceneInstance): instance is MontageSceneInstance {
  return instance.type === 'montage';
}

/**
 * Check if instance is a negotiation scene.
 */
export function isNegotiationInstance(
  instance: SceneInstance
): instance is NegotiationSceneInstance {
  return instance.type === 'negotiation';
}

/**
 * Check if instance is a respite scene.
 */
export function isRespiteInstance(instance: SceneInstance): instance is RespiteSceneInstance {
  return instance.type === 'respite';
}

/**
 * Check if instance is a story scene.
 */
export function isStoryInstance(instance: SceneInstance): instance is StorySceneInstance {
  return instance.type === 'story';
}

/**
 * Check if scene is complete.
 */
export function isSceneComplete(instance: SceneInstance): boolean {
  return instance.completedAt !== undefined || instance.state.completed === true;
}
