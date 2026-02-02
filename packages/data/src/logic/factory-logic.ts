/**
 * Factory Logic
 *
 * Pure factory functions for creating game objects.
 * Handles character creation, scene creation, and entity creation.
 *
 * These are pure functions that don't depend on database or React.
 */

import type { Characteristics, HeroClass, SceneType, ConditionName } from '@anvil/types';
import * as HeroLogic from './hero-logic.js';
import * as KitLogic from './kit-logic.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Culture selection during character creation.
 */
export interface CultureSelection {
  environment: string | null;
  organization: string | null;
  upbringing: string | null;
}

/**
 * Complication structure.
 */
export interface Complication {
  id: string;
  name: string;
  description?: string;
}

/**
 * Title structure.
 */
export interface Title {
  id: string;
  name: string;
  description?: string;
  effect?: string;
}

/**
 * Character in progress (wizard state).
 */
export interface CharacterInProgress {
  ancestry: string | null;
  ancestryTraits: string[];
  culture: CultureSelection;
  career: string | null;
  incitingIncident: string | null;
  heroClass: HeroClass | null;
  subclass: string | string[] | null;
  complication: Complication | null;
  characteristics: Characteristics | null;
  kit: string | null;
  selectedSkills: string[];
  selectedLanguages: string[];
  selectedPerks: string[];
  selectedTitles: Title[];
  selectedAbilities: string[];
  name: string;
  pronouns: string;
  backstory: string;
  appearance: string;
  portraitUrl: string | null;
}

/**
 * Derived stats from character choices.
 */
export interface DerivedStats {
  stamina: number;
  speed: number;
  stability: number;
  size: string;
  recoveries: number;
}

/**
 * Hero data for database insert.
 */
export interface HeroInsertData {
  userId: string;
  name: string;
  heroClass: HeroClass;
  level: number;
  ancestry: string | null;
  ancestryTraits: string[];
  culture: CultureSelection;
  career: string | null;
  incitingIncident: string | null;
  subclass: string | null;
  complication: Complication | null;
  characteristics: Characteristics | null;
  kit: string | null;
  selectedSkills: string[];
  selectedLanguages: string[];
  selectedPerks: string[];
  selectedTitles: Title[];
  selectedAbilities: string[];
  pronouns: string;
  backstory: string;
  appearance: string;
  portraitUrl: string | null;
  maxStamina: number;
  currentStamina: number;
  maxRecoveries: number;
  currentRecoveries: number;
  speed: number;
  stability: number;
  size: string;
  heroicResource: number;
  heroTokens: number;
  victories: number;
  xp: number;
  status: 'active' | 'retired' | 'deceased';
}

/**
 * Scene creation options.
 */
export interface CreateSceneOptions {
  id?: string;
  title: string;
  order?: number;
  backgroundImage?: string;
  entityIds?: string[];
}

// ---------------------------------------------------------------------------
// Character Creation Factories
// ---------------------------------------------------------------------------

/**
 * Create an empty CharacterInProgress for the wizard.
 *
 * @returns Fresh character in progress
 */
export function createEmptyCharacter(): CharacterInProgress {
  return {
    ancestry: null,
    ancestryTraits: [],
    culture: {
      environment: null,
      organization: null,
      upbringing: null,
    },
    career: null,
    incitingIncident: null,
    heroClass: null,
    subclass: null,
    complication: null,
    characteristics: null,
    kit: null,
    selectedSkills: [],
    selectedLanguages: [],
    selectedPerks: [],
    selectedTitles: [],
    selectedAbilities: [],
    name: '',
    pronouns: '',
    backstory: '',
    appearance: '',
    portraitUrl: null,
  };
}

/**
 * Create default characteristics (all zeros).
 *
 * @returns Default characteristics
 */
export function createDefaultCharacteristics(): Characteristics {
  return {
    might: 0,
    agility: 0,
    reason: 0,
    intuition: 0,
    presence: 0,
  };
}

/**
 * Create default derived stats.
 *
 * @returns Default derived stats
 */
export function createDefaultDerivedStats(): DerivedStats {
  return {
    stamina: 18,
    speed: 5,
    stability: 0,
    size: '1M',
    recoveries: 8,
  };
}

/**
 * Calculate derived stats from character choices.
 *
 * @param character - Character in progress
 * @returns Derived stats
 */
export function calculateDerivedStats(character: CharacterInProgress): DerivedStats {
  if (!character.heroClass) {
    return createDefaultDerivedStats();
  }

  // Get stamina from class and kit
  const baseStamina = HeroLogic.getMaxStaminaForClass(character.heroClass, 1);
  const kitStaminaBonus = character.kit
    ? KitLogic.getKitStaminaBonus(character.kit, 1)
    : 0;

  // Get recoveries from class
  const recoveries = HeroLogic.getMaxRecoveries(character.heroClass);

  // Get kit bonuses
  const kitBonuses = character.kit
    ? KitLogic.getKitBonuses(character.kit)
    : null;

  // Base speed is 5 (ancestry speed would come from ancestry data)
  const baseSpeed = 5;
  const speedBonus = kitBonuses?.speedBonus ?? 0;

  return {
    stamina: baseStamina + kitStaminaBonus,
    speed: baseSpeed + speedBonus,
    stability: kitBonuses?.stabilityBonus ?? 0,
    size: '1M', // Would come from ancestry
    recoveries,
  };
}

/**
 * Convert CharacterInProgress to HeroInsertData for database.
 *
 * @param userId - User ID
 * @param character - Character in progress
 * @param derivedStats - Calculated derived stats
 * @returns Hero insert data
 */
export function createHeroInsertFromWizard(
  userId: string,
  character: CharacterInProgress,
  derivedStats: DerivedStats
): HeroInsertData {
  // Handle subclass which can be string or string[]
  const subclass = Array.isArray(character.subclass)
    ? character.subclass.join(', ')
    : character.subclass;

  return {
    userId,
    name: character.name,
    heroClass: character.heroClass ?? 'fury',
    level: 1,
    ancestry: character.ancestry,
    ancestryTraits: character.ancestryTraits,
    culture: character.culture,
    career: character.career,
    incitingIncident: character.incitingIncident,
    subclass,
    complication: character.complication,
    characteristics: character.characteristics,
    kit: character.kit,
    selectedSkills: character.selectedSkills,
    selectedLanguages: character.selectedLanguages,
    selectedPerks: character.selectedPerks,
    selectedTitles: character.selectedTitles,
    selectedAbilities: character.selectedAbilities,
    pronouns: character.pronouns,
    backstory: character.backstory,
    appearance: character.appearance,
    portraitUrl: character.portraitUrl,
    maxStamina: derivedStats.stamina,
    currentStamina: derivedStats.stamina,
    maxRecoveries: derivedStats.recoveries,
    currentRecoveries: derivedStats.recoveries,
    speed: derivedStats.speed,
    stability: derivedStats.stability,
    size: derivedStats.size,
    heroicResource: 0,
    heroTokens: 0,
    victories: 0,
    xp: 0,
    status: 'active',
  };
}

// ---------------------------------------------------------------------------
// Scene Factories
// ---------------------------------------------------------------------------

/**
 * Generate a unique ID.
 *
 * @param prefix - Optional prefix
 * @returns Unique ID
 */
export function generateId(prefix = ''): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  return prefix ? `${prefix}-${timestamp}-${random}` : `${timestamp}-${random}`;
}

/**
 * Create a story scene.
 *
 * @param options - Scene options
 * @returns Story scene object
 */
export function createStoryScene(options: CreateSceneOptions) {
  return {
    id: options.id ?? generateId('scene'),
    type: 'story' as SceneType,
    title: options.title,
    order: options.order ?? 0,
    backgroundImage: options.backgroundImage,
    entityIds: options.entityIds ?? [],
    state: {
      type: 'story' as const,
      directorNotes: '',
      readAloudText: '',
    },
    version: 1,
    lastModifiedBy: '',
  };
}

/**
 * Create a battle scene.
 *
 * @param options - Scene options
 * @param heroCount - Number of heroes (for malice calculation)
 * @returns Battle scene object
 */
export function createBattleScene(
  options: CreateSceneOptions,
  heroCount = 4
) {
  return {
    id: options.id ?? generateId('scene'),
    type: 'battle' as SceneType,
    title: options.title,
    order: options.order ?? 0,
    backgroundImage: options.backgroundImage,
    entityIds: options.entityIds ?? [],
    state: {
      type: 'battle' as const,
      round: 0,
      turn: 0,
      phase: 'setup' as const,
      initiativeOrder: [],
      grid: createDefaultGrid(),
      malice: 0,
      malicePerRound: heroCount,
      combatState: undefined,
      heroicResources: {},
      combatLog: [],
    },
    version: 1,
    lastModifiedBy: '',
  };
}

/**
 * Create a montage scene.
 *
 * @param options - Scene options
 * @param montageOptions - Montage-specific options
 * @returns Montage scene object
 */
export function createMontageScene(
  options: CreateSceneOptions,
  montageOptions?: {
    goal?: string;
    baseSuccessLimit?: number;
    baseFailureLimit?: number;
    heroCountAdjustment?: boolean;
  }
) {
  return {
    id: options.id ?? generateId('scene'),
    type: 'montage' as SceneType,
    title: options.title,
    order: options.order ?? 0,
    backgroundImage: options.backgroundImage,
    entityIds: options.entityIds ?? [],
    state: {
      type: 'montage' as const,
      title: options.title,
      goal: montageOptions?.goal ?? '',
      difficulty: 'moderate' as const,
      baseSuccessLimit: montageOptions?.baseSuccessLimit ?? 6,
      baseFailureLimit: montageOptions?.baseFailureLimit ?? 3,
      heroCountAdjustment: montageOptions?.heroCountAdjustment ?? true,
      currentRound: 1,
      currentSuccesses: 0,
      currentFailures: 0,
      outcome: 'pending' as const,
      challenges: [],
      hazards: [],
      tests: [],
      assists: [],
      usedSkills: {},
      outcomeDescriptions: {
        totalSuccess: '',
        partialSuccess: '',
        totalFailure: '',
      },
      revealQueueEnabled: false,
      revealQueue: [],
      directorNotes: '',
      readAloudText: '',
    },
    version: 1,
    lastModifiedBy: '',
  };
}

/**
 * Create a negotiation scene.
 *
 * @param options - Scene options
 * @param npcEntityId - NPC entity ID
 * @returns Negotiation scene object
 */
export function createNegotiationScene(
  options: CreateSceneOptions,
  npcEntityId: string
) {
  return {
    id: options.id ?? generateId('scene'),
    type: 'negotiation' as SceneType,
    title: options.title,
    order: options.order ?? 0,
    backgroundImage: options.backgroundImage,
    entityIds: options.entityIds ?? [],
    state: {
      type: 'negotiation' as const,
      npcEntityId,
      interest: 0,
      patience: 5,
      targetInterest: 5,
      interestRevealed: false,
      phase: 'active' as const,
      motivations: [],
      pitfalls: [],
      arguments: [],
    },
    version: 1,
    lastModifiedBy: '',
  };
}

/**
 * Create a respite scene.
 *
 * @param options - Scene options
 * @param location - Respite location name
 * @returns Respite scene object
 */
export function createRespiteScene(
  options: CreateSceneOptions,
  location: string
) {
  return {
    id: options.id ?? generateId('scene'),
    type: 'respite' as SceneType,
    title: options.title,
    order: options.order ?? 0,
    backgroundImage: options.backgroundImage,
    entityIds: options.entityIds ?? [],
    state: {
      type: 'respite' as const,
      location,
      activities: [],
      completed: false,
      victoriesConverted: 0,
    },
    version: 1,
    lastModifiedBy: '',
  };
}

/**
 * Create a scene of any type.
 *
 * @param type - Scene type
 * @param options - Scene options
 * @returns Scene object
 */
export function createScene(type: SceneType, options: CreateSceneOptions) {
  switch (type) {
    case 'story':
      return createStoryScene(options);
    case 'battle':
      return createBattleScene(options);
    case 'montage':
      return createMontageScene(options);
    case 'negotiation':
      return createNegotiationScene(options, '');
    case 'respite':
      return createRespiteScene(options, options.title);
  }
}

// ---------------------------------------------------------------------------
// Entity Factories
// ---------------------------------------------------------------------------

/**
 * Token state for entities.
 */
export interface TokenPosition {
  x: number;
  y: number;
  rotation: number;
  size: number;
  visible: boolean;
  conditions: ConditionName[];
}

/**
 * Create a token position.
 *
 * @param x - X coordinate
 * @param y - Y coordinate
 * @param size - Token size
 * @returns Token position
 */
export function createTokenPosition(
  x: number,
  y: number,
  size = 1
): TokenPosition {
  return {
    x,
    y,
    rotation: 0,
    size,
    visible: true,
    conditions: [],
  };
}

/**
 * Create a default grid for battle scenes.
 *
 * @param width - Grid width in squares
 * @param height - Grid height in squares
 * @param squareSize - Pixels per square
 * @returns Grid state
 */
export function createDefaultGrid(
  width = 20,
  height = 15,
  squareSize = 50
) {
  // Create empty fog array
  const fogRevealed: boolean[][] = [];
  for (let y = 0; y < height; y++) {
    fogRevealed.push(new Array(width).fill(true));
  }

  // Create empty difficult terrain array
  const difficultTerrain: boolean[][] = [];
  for (let y = 0; y < height; y++) {
    difficultTerrain.push(new Array(width).fill(false));
  }

  return {
    width,
    height,
    squareSize,
    backgroundUrl: undefined,
    tokens: [],
    walls: [],
    lights: [],
    fogRevealed,
    difficultTerrain,
    // Grid display defaults
    gridOpacity: 0.5,
    gridColor: '#444444',
    showGrid: true,
  };
}

// ---------------------------------------------------------------------------
// Encounter Factories
// ---------------------------------------------------------------------------

/**
 * Create a creature entry for encounter building.
 *
 * @param monsterId - Monster ID from bestiary
 * @param name - Creature name
 * @param ev - Encounter value
 * @param count - Number of creatures
 * @returns Creature entry
 */
export function createCreatureEntry(
  monsterId: string,
  name: string,
  ev: number,
  count = 1
) {
  return {
    id: generateId('creature'),
    monsterId,
    name,
    count,
    ev,
    stamina: 10, // Would come from monster data
    stats: {
      stability: 0,
      speed: 5,
      freeStrike: 3,
      distance: 5,
    },
    notes: '',
  };
}

/**
 * Create a creature group for turn management.
 *
 * @param creatures - Array of creature entries
 * @param turnOrder - Group's turn order
 * @returns Creature group
 */
export function createCreatureGroup(
  creatures: ReturnType<typeof createCreatureEntry>[],
  turnOrder = 1
) {
  return {
    id: generateId('group'),
    turnOrder,
    creatures,
    notes: '',
  };
}
