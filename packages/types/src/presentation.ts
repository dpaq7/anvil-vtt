/**
 * Presentation System Types
 *
 * Types for the Director's "Go Live" presentation system.
 * Allows Directors to work on scenes privately before presenting to players.
 */

import type { SceneType, SceneState } from './scene.js';
import type { Entity } from './entity.js';

// ---------------------------------------------------------------------------
// Presentation Status
// ---------------------------------------------------------------------------

/**
 * Current state of the presentation system.
 *
 * - 'live': Scene is presented and in sync with Director's working state
 * - 'draft': Director is working on a scene not yet presented
 * - 'modified': Scene is presented but Director has made changes since
 * - 'hidden': No scene is presented to players (they see waiting screen)
 */
export type PresentationStatus = 'live' | 'draft' | 'modified' | 'hidden';

// ---------------------------------------------------------------------------
// Presented Scene Snapshot
// ---------------------------------------------------------------------------

/**
 * Immutable snapshot of a scene state at "Go Live" time.
 * This is what players see - frozen until the next "Go Live" or "Update".
 *
 * Deep copy of scene and entity data prevents Director's live edits
 * from affecting player view until explicitly published.
 */
export interface PresentedSceneSnapshot {
  /** Original scene ID this snapshot was created from */
  sourceSceneId: string;

  /** Scene type (battle, story, montage, negotiation, respite) */
  type: SceneType;

  /** Scene title at time of presentation */
  title: string;

  /** Frozen scene state (deep copy, read-only for players) */
  state: SceneState;

  /** Entity IDs included in this presentation */
  entityIds: string[];

  /**
   * Frozen entity states (deep copies).
   * Already filtered for player visibility (no director-only data).
   */
  entities: Entity[];

  /** Background image URL */
  backgroundImage?: string;

  /** Timestamp when this snapshot was created */
  createdAt: number;

  /** Version number for conflict detection */
  version: number;
}

// ---------------------------------------------------------------------------
// Event Payloads
// ---------------------------------------------------------------------------

/**
 * Payload for SCENE_PRESENTED event (Go Live action)
 */
export interface ScenePresentedPayload {
  /** ID of the scene being presented */
  sceneId: string;
  /** The frozen snapshot */
  snapshot: PresentedSceneSnapshot;
}

/**
 * Payload for SCENE_HIDDEN event (Hide from Players action)
 */
export interface SceneHiddenPayload {
  /** ID of the scene that was hidden */
  previousSceneId: string;
}

/**
 * Payload for PRESENTATION_UPDATED event (Update Presentation action)
 */
export interface PresentationUpdatedPayload {
  /** ID of the scene being updated */
  sceneId: string;
  /** The new frozen snapshot */
  snapshot: PresentedSceneSnapshot;
}

/**
 * Payload for PRESENTATION_RESTORED event (Restore Presentation action)
 */
export interface PresentationRestoredPayload {
  /** ID of the scene being restored */
  sceneId: string;
  /** The restored snapshot */
  snapshot: PresentedSceneSnapshot;
}

// ---------------------------------------------------------------------------
// Presentation State (for SessionMetadata)
// ---------------------------------------------------------------------------

/**
 * Presentation state stored in SessionMetadata.
 * This is what gets synced via Yjs.
 */
export interface PresentationState {
  /** Currently presented scene ID (null = players see waiting screen) */
  presentedSceneId: string | null;

  /** Frozen snapshot of the presented scene */
  presentedSceneState: PresentedSceneSnapshot | null;

  /** Timestamp of last "Go Live" action */
  presentedAt: number | null;

  /**
   * Cached last presentation (for restore after hide).
   * When hideFromPlayers() is called, current snapshot is cached here.
   * restorePresentation() moves this back to presentedSceneState.
   */
  lastPresentedSnapshot: PresentedSceneSnapshot | null;
}

// ---------------------------------------------------------------------------
// Default State
// ---------------------------------------------------------------------------

/**
 * Default presentation state for new sessions.
 */
export const defaultPresentationState: PresentationState = {
  presentedSceneId: null,
  presentedSceneState: null,
  presentedAt: null,
  lastPresentedSnapshot: null,
};
