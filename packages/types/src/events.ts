/**
 * Game Events
 * Every state change is an event for sync and audit
 */

export type EventType =
  // Scene events
  | 'SCENE_CREATED'
  | 'SCENE_ACTIVATED'
  | 'SCENE_REORDERED'
  | 'SCENE_DELETED'

  // Combat events
  | 'COMBAT_STARTED'
  | 'COMBAT_ENDED'
  | 'ROUND_STARTED'
  | 'TURN_STARTED'
  | 'TURN_ENDED'
  | 'INITIATIVE_ROLLED'
  | 'INITIATIVE_CHANGED'

  // Combat flow events (alternating activation)
  | 'FIRST_SIDE_DETERMINED'
  | 'ACTOR_SELECTED'
  | 'SIDE_SWITCHED'
  | 'ENEMY_GROUP_ACTIVATED'
  | 'ENEMY_GROUP_COMPLETED'

  // Action events
  | 'ABILITY_USED'
  | 'FREE_STRIKE_MADE'
  | 'MANEUVER_USED'
  | 'ACTION_USED'
  | 'MAIN_ACTION_CONVERTED'
  | 'MOVE_ACTION_USED'

  // Entity events
  | 'ENTITY_CREATED'
  | 'ENTITY_UPDATED'
  | 'ENTITY_DELETED'
  | 'ENTITY_MOVED'
  | 'ENTITY_FORCE_MOVED'
  | 'STAMINA_CHANGED'
  | 'RECOVERY_SPENT'
  | 'TEMPORARY_STAMINA_ADDED'
  | 'CONDITION_APPLIED'
  | 'CONDITION_REMOVED'
  | 'CONDITION_SAVED'

  // Resource events
  | 'HEROIC_RESOURCE_CHANGED'
  | 'SURGE_GAINED'
  | 'SURGE_SPENT'
  | 'MALICE_CHANGED'

  // Montage events
  | 'MONTAGE_TEST_MADE'
  | 'MONTAGE_TEST_RECORDED'
  | 'MONTAGE_ASSIST_RECORDED'
  | 'MONTAGE_ROUND_ADVANCED'
  | 'MONTAGE_PROGRESS_ADJUSTED'
  | 'MONTAGE_OUTCOME_SET'
  | 'MONTAGE_CHALLENGE_TOGGLED'
  | 'MONTAGE_REVEAL_TOGGLED'
  | 'MONTAGE_RESULTS_REVEALED'
  | 'MONTAGE_RESOLVED'

  // Negotiation events
  | 'ARGUMENT_MADE'
  | 'MOTIVATION_REVEALED'
  | 'PITFALL_TRIGGERED'
  | 'INTEREST_CHANGED'
  | 'PATIENCE_CHANGED'

  // Respite events
  | 'RESPITE_ACTIVITY_SELECTED'
  | 'RESPITE_ACTIVITY_COMPLETED'
  | 'RESPITE_VICTORIES_CONVERTED'
  | 'RESPITE_PROJECT_ADDED'
  | 'RESPITE_PROJECT_CONTRIBUTED'
  | 'RESPITE_COMPLETED'

  // Progression events
  | 'VICTORY_EARNED'
  | 'XP_GAINED'
  | 'LEVEL_UP'

  // Dice events
  | 'POWER_ROLL_MADE'
  | 'SAVING_THROW_MADE'

  // Session events
  | 'SESSION_STARTED'
  | 'SESSION_ENDED'
  | 'HERO_TOKEN_GRANTED'
  | 'HERO_TOKEN_SPENT'
  | 'TOKEN_MOVED'
  | 'DICE_ROLLED'

  // Presentation events (Director Go Live system)
  | 'SCENE_PRESENTED' // Go Live - present scene to players
  | 'SCENE_HIDDEN' // Hide from Players - show waiting screen
  | 'PRESENTATION_UPDATED' // Update Presentation - re-sync while live
  | 'PRESENTATION_RESTORED' // Restore Presentation - undo a hide

  // Drawing events (Whiteboard mode)
  | 'DRAWING_STROKE_ADDED' // Add a stroke to the drawing layer
  | 'DRAWING_STROKE_REMOVED' // Remove a stroke by ID
  | 'DRAWING_CLEARED' // Clear all strokes
  | 'DRAWING_WHITEBOARD_MODE_CHANGED' // Toggle whiteboard mode on/off

  // Grid settings events
  | 'GRID_SETTINGS_CHANGED'; // Update grid display settings (opacity, color, visibility)

/**
 * Game event structure
 */
export interface GameEvent<T = unknown> {
  id: string;
  timestamp: number;
  actorId: string;
  type: EventType;
  payload: T;
  vectorClock: number;
  acknowledged: boolean;
}

/**
 * Event payloads for type-safe event handling
 */
export interface EntityMovedPayload {
  entityId: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

export interface StaminaChangedPayload {
  entityId: string;
  previousValue: number;
  newValue: number;
  source: string;
}

export interface ConditionAppliedPayload {
  entityId: string;
  condition: string;
  sourceEntityId?: string;
  duration?: number;
}

export interface PowerRollPayload {
  entityId: string;
  characteristic: string;
  dice: number[];
  total: number;
  tier: 1 | 2 | 3;
  modifiers: Array<{ type: string; source: string; value?: number }>;
}

// ---------------------------------------------------------------------------
// Drawing Event Payloads
// ---------------------------------------------------------------------------

export interface DrawingStrokeAddedPayload {
  sceneId: string;
  stroke: {
    id: string;
    type: 'pen' | 'rectangle' | 'circle' | 'triangle' | 'eraser';
    points: Array<{ x: number; y: number }>;
    color: string;
    width: number;
    opacity: number;
    gridSnapped: boolean;
    createdBy: string;
    createdAt: number;
  };
}

export interface DrawingStrokeRemovedPayload {
  sceneId: string;
  strokeId: string;
}

export interface DrawingClearedPayload {
  sceneId: string;
}

export interface DrawingWhiteboardModeChangedPayload {
  sceneId: string;
  isWhiteboardMode: boolean;
}

// ---------------------------------------------------------------------------
// Grid Settings Event Payloads
// ---------------------------------------------------------------------------

export interface GridSettingsChangedPayload {
  sceneId: string;
  settings: {
    gridOpacity?: number;
    gridColor?: string;
    showGrid?: boolean;
  };
}
