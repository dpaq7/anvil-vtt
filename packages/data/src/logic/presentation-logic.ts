/**
 * Presentation Logic
 *
 * Pure functions for the Director's "Go Live" presentation system.
 * Handles snapshot creation, comparison, and status calculation.
 *
 * Following the Logic Layer pattern: UI is "dumb", Logic calculates.
 *
 * @example
 * import { PresentationLogic } from '@anvil/data';
 *
 * const snapshot = PresentationLogic.createSnapshot(scene, entities);
 * const isDirty = PresentationLogic.hasUnsyncedChanges(workingScene, snapshot);
 * const status = PresentationLogic.getStatus(activeSceneId, presentedSceneId, isDirty);
 */

import type { Scene, SceneState, Entity, Visibility } from '@anvil/types';
import type { PresentedSceneSnapshot, PresentationStatus } from '@anvil/types';

// ---------------------------------------------------------------------------
// Snapshot Creation
// ---------------------------------------------------------------------------

/**
 * Creates an immutable snapshot of a scene for presentation.
 * Deep clones all state to prevent mutation affecting players.
 *
 * @param scene - The scene to snapshot
 * @param entities - All entities (will be filtered for player visibility)
 * @returns A frozen snapshot for player presentation
 */
export function createSnapshot(scene: Scene, entities: Entity[]): PresentedSceneSnapshot {
  // Filter entities for player visibility
  const visibleEntities = filterEntitiesForPresentation(entities, scene.entityIds);

  // Deep clone scene state to prevent mutations
  const frozenState = deepCloneSceneState(scene.state);

  return {
    sourceSceneId: scene.id,
    type: scene.type,
    title: scene.title,
    state: frozenState,
    entityIds: scene.entityIds.filter((id) => visibleEntities.some((e) => e.id === id)),
    entities: visibleEntities,
    backgroundImage: scene.backgroundImage,
    createdAt: Date.now(),
    version: scene.version,
  };
}

/**
 * Filters entities for presentation (player-visible only).
 * Excludes director-only entities and filters sensitive data.
 *
 * @param entities - All entities
 * @param sceneEntityIds - Entity IDs in the scene
 * @returns Entities suitable for player presentation
 */
export function filterEntitiesForPresentation(
  entities: Entity[],
  sceneEntityIds: string[]
): Entity[] {
  return entities
    .filter((entity) => {
      // Only include entities in this scene
      if (!sceneEntityIds.includes(entity.id)) return false;

      // Exclude director-only visibility
      if (entity.visibility === 'director') return false;

      // Exclude hidden entities
      if (entity.panePosition === 'hidden') return false;

      return true;
    })
    .map((entity) => filterEntityForPlayers(entity));
}

/**
 * Filters a single entity for player view.
 * Removes director-only data like notes and tactics.
 *
 * @param entity - The entity to filter
 * @returns Entity with sensitive data removed
 */
export function filterEntityForPlayers(entity: Entity): Entity {
  // Deep clone to prevent mutation
  const filtered = JSON.parse(JSON.stringify(entity)) as Entity;

  // Filter entity-specific data
  switch (filtered.data.type) {
    case 'npc':
      // Remove director notes
      filtered.data.notes = '';
      break;

    case 'enemy':
      // Remove tactics
      if ('tactics' in filtered.data) {
        filtered.data.tactics = '';
      }
      // Obfuscate stamina (show percentage, not exact value)
      if (filtered.stamina) {
        const percentage =
          filtered.stamina.max > 0
            ? Math.round((filtered.stamina.current / filtered.stamina.max) * 100)
            : 0;
        filtered.stamina = {
          current: percentage,
          max: 100,
          winded: 50,
          temporary: (filtered.stamina.temporary ?? 0) > 0 ? 1 : 0,
        };
      }
      break;
  }

  return filtered;
}

// ---------------------------------------------------------------------------
// Change Detection
// ---------------------------------------------------------------------------

/**
 * Compares working scene state to presented snapshot.
 * Returns true if Director has made changes since "Go Live".
 *
 * @param workingScene - Director's current working scene
 * @param presentedSnapshot - The frozen snapshot players see
 * @param workingEntities - Optional: current entity states for entity change detection
 * @returns True if there are unsynced changes
 */
export function hasUnsyncedChanges(
  workingScene: Scene | null,
  presentedSnapshot: PresentedSceneSnapshot | null,
  workingEntities?: Entity[]
): boolean {
  // No working scene = no changes
  if (!workingScene) return false;

  // No snapshot = everything is unsynced
  if (!presentedSnapshot) return true;

  // Different scene = unsynced
  if (workingScene.id !== presentedSnapshot.sourceSceneId) return true;

  // Different version = unsynced
  if (workingScene.version !== presentedSnapshot.version) return true;

  // Compare scene states
  if (!areSceneStatesEqual(workingScene.state, presentedSnapshot.state)) {
    return true;
  }

  // Compare entity states if provided
  if (workingEntities && presentedSnapshot.entities) {
    if (
      !areEntityStatesEqual(
        workingEntities,
        presentedSnapshot.entities,
        workingScene.entityIds
      )
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Compares entity states between working entities and snapshot entities.
 * Only compares entities that are in the scene.
 *
 * @param workingEntities - Current entity states
 * @param snapshotEntities - Snapshot entity states
 * @param sceneEntityIds - Entity IDs in the scene
 * @returns True if entity states are equal
 */
function areEntityStatesEqual(
  workingEntities: Entity[],
  snapshotEntities: Entity[],
  sceneEntityIds: string[]
): boolean {
  // Filter to only scene entities
  const workingInScene = workingEntities.filter((e) =>
    sceneEntityIds.includes(e.id)
  );

  // Different count = not equal
  if (workingInScene.length !== snapshotEntities.length) return false;

  // Compare each entity by key combat-relevant fields
  for (const working of workingInScene) {
    const snapshot = snapshotEntities.find((e) => e.id === working.id);
    if (!snapshot) return false;

    // Compare stamina (most common change)
    if (working.stamina?.current !== snapshot.stamina?.current) return false;
    if (working.stamina?.temporary !== snapshot.stamina?.temporary) return false;

    // Compare conditions
    if (JSON.stringify(working.conditions) !== JSON.stringify(snapshot.conditions)) {
      return false;
    }
  }

  return true;
}

/**
 * Deep equality check for scene states.
 * Used by hasUnsyncedChanges to detect modifications.
 *
 * @param a - First scene state
 * @param b - Second scene state
 * @returns True if states are equal
 */
export function areSceneStatesEqual(a: SceneState, b: SceneState): boolean {
  // Different types = not equal
  if (a.type !== b.type) return false;

  // Deep comparison via JSON serialization
  // Note: This is simple but effective for our use case
  return JSON.stringify(a) === JSON.stringify(b);
}

// ---------------------------------------------------------------------------
// Status Calculation
// ---------------------------------------------------------------------------

/**
 * Determines current presentation status.
 *
 * @param activeSceneId - Director's currently active scene
 * @param presentedSceneId - Scene currently presented to players
 * @param isDirty - Whether working state differs from presented
 * @returns Current presentation status
 */
export function getStatus(
  activeSceneId: string | null,
  presentedSceneId: string | null,
  isDirty: boolean
): PresentationStatus {
  // No presentation = hidden
  if (!presentedSceneId) {
    return 'hidden';
  }

  // Different scene is active = working on draft
  if (activeSceneId !== presentedSceneId) {
    return 'draft';
  }

  // Same scene but modified = modified
  if (isDirty) {
    return 'modified';
  }

  // Same scene, no changes = live
  return 'live';
}

/**
 * Gets a human-readable label for presentation status.
 *
 * @param status - The presentation status
 * @returns Human-readable label for UI display
 */
export function getStatusLabel(status: PresentationStatus): string {
  switch (status) {
    case 'live':
      return 'Live';
    case 'draft':
      return 'Draft (Different Scene Live)';
    case 'modified':
      return 'Unsaved Changes';
    case 'hidden':
      return 'Hidden from Players';
  }
}

/**
 * Gets a short label for compact UI display.
 *
 * @param status - The presentation status
 * @returns Short label (1-2 words)
 */
export function getStatusLabelShort(status: PresentationStatus): string {
  switch (status) {
    case 'live':
      return 'Live';
    case 'draft':
      return 'Draft';
    case 'modified':
      return 'Modified';
    case 'hidden':
      return 'Hidden';
  }
}

/**
 * Gets the color associated with a presentation status.
 * Returns CSS variable name for theming.
 *
 * @param status - The presentation status
 * @returns CSS variable name for status color
 */
export function getStatusColor(status: PresentationStatus): string {
  switch (status) {
    case 'live':
      return 'var(--status-success)';
    case 'draft':
      return 'var(--status-warning)';
    case 'modified':
      return 'var(--status-warning)';
    case 'hidden':
      return 'var(--text-muted)';
  }
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Checks if a scene can be presented (Go Live).
 *
 * @param scene - The scene to check
 * @returns True if scene is valid for presentation
 */
export function canPresent(scene: Scene | null): boolean {
  if (!scene) return false;

  // Scene must have an ID and type
  if (!scene.id || !scene.type) return false;

  // Scene must have a valid state
  if (!scene.state || scene.state.type !== scene.type) return false;

  return true;
}

/**
 * Checks if presentation can be restored (after hide).
 *
 * @param lastSnapshot - The cached last presentation snapshot
 * @returns True if restore is possible
 */
export function canRestore(lastSnapshot: PresentedSceneSnapshot | null): boolean {
  return lastSnapshot !== null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Deep clones a scene state.
 * Uses JSON serialization for simplicity and immutability.
 *
 * @param state - The scene state to clone
 * @returns Deep cloned scene state
 */
function deepCloneSceneState(state: SceneState): SceneState {
  return JSON.parse(JSON.stringify(state)) as SceneState;
}

/**
 * Creates an empty presentation state.
 * Useful for initializing new sessions.
 */
export function createEmptyPresentationState() {
  return {
    presentedSceneId: null,
    presentedSceneState: null,
    presentedAt: null,
    lastPresentedSnapshot: null,
  };
}
