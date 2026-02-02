/**
 * Scene Object Presets
 *
 * Common placeable objects for battle maps and scenes.
 * Categories: furniture, terrain, hazard, marker
 */

import type { SceneObjectDefinition, SceneObjectCategory } from '@anvil/types';

// ---------------------------------------------------------------------------
// Furniture Objects
// ---------------------------------------------------------------------------

export const FURNITURE_OBJECTS: SceneObjectDefinition[] = [
  {
    id: 'table-small',
    name: 'Small Table',
    category: 'furniture',
    defaultSize: { width: 1, height: 1 },
    defaultProperties: {
      isInteractable: true,
      isDestructible: true,
      hitPoints: 10,
      blocksSight: false,
      blocksMovement: true,
    },
  },
  {
    id: 'table-large',
    name: 'Large Table',
    category: 'furniture',
    defaultSize: { width: 2, height: 1 },
    defaultProperties: {
      isInteractable: true,
      isDestructible: true,
      hitPoints: 20,
      blocksSight: false,
      blocksMovement: true,
    },
  },
  {
    id: 'chair',
    name: 'Chair',
    category: 'furniture',
    defaultSize: { width: 1, height: 1 },
    defaultProperties: {
      isInteractable: false,
      isDestructible: true,
      hitPoints: 5,
      blocksSight: false,
      blocksMovement: false,
    },
  },
  {
    id: 'throne',
    name: 'Throne',
    category: 'furniture',
    defaultSize: { width: 1, height: 1 },
    defaultProperties: {
      isInteractable: true,
      isDestructible: false,
      blocksSight: false,
      blocksMovement: true,
    },
  },
  {
    id: 'bed',
    name: 'Bed',
    category: 'furniture',
    defaultSize: { width: 2, height: 1 },
    defaultProperties: {
      isInteractable: false,
      isDestructible: true,
      hitPoints: 15,
      blocksSight: false,
      blocksMovement: true,
    },
  },
  {
    id: 'chest',
    name: 'Chest',
    category: 'furniture',
    defaultSize: { width: 1, height: 1 },
    defaultProperties: {
      isInteractable: true,
      isDestructible: true,
      hitPoints: 15,
      blocksSight: false,
      blocksMovement: true,
    },
  },
  {
    id: 'bookshelf',
    name: 'Bookshelf',
    category: 'furniture',
    defaultSize: { width: 2, height: 1 },
    defaultProperties: {
      isInteractable: true,
      isDestructible: true,
      hitPoints: 20,
      blocksSight: true,
      blocksMovement: true,
    },
  },
  {
    id: 'altar',
    name: 'Altar',
    category: 'furniture',
    defaultSize: { width: 2, height: 1 },
    defaultProperties: {
      isInteractable: true,
      isDestructible: false,
      blocksSight: false,
      blocksMovement: true,
    },
  },
  {
    id: 'barrel',
    name: 'Barrel',
    category: 'furniture',
    defaultSize: { width: 1, height: 1 },
    defaultProperties: {
      isInteractable: true,
      isDestructible: true,
      hitPoints: 8,
      blocksSight: false,
      blocksMovement: true,
    },
  },
  {
    id: 'crate',
    name: 'Crate',
    category: 'furniture',
    defaultSize: { width: 1, height: 1 },
    defaultProperties: {
      isInteractable: true,
      isDestructible: true,
      hitPoints: 12,
      blocksSight: false,
      blocksMovement: true,
    },
  },
];

// ---------------------------------------------------------------------------
// Terrain Objects
// ---------------------------------------------------------------------------

export const TERRAIN_OBJECTS: SceneObjectDefinition[] = [
  {
    id: 'pillar-stone',
    name: 'Stone Pillar',
    category: 'terrain',
    defaultSize: { width: 1, height: 1 },
    defaultProperties: {
      isInteractable: false,
      isDestructible: false,
      blocksSight: true,
      blocksMovement: true,
    },
  },
  {
    id: 'pillar-wooden',
    name: 'Wooden Pillar',
    category: 'terrain',
    defaultSize: { width: 1, height: 1 },
    defaultProperties: {
      isInteractable: false,
      isDestructible: true,
      hitPoints: 25,
      blocksSight: false,
      blocksMovement: true,
    },
  },
  {
    id: 'boulder',
    name: 'Boulder',
    category: 'terrain',
    defaultSize: { width: 1, height: 1 },
    defaultProperties: {
      isInteractable: false,
      isDestructible: false,
      blocksSight: true,
      blocksMovement: true,
    },
  },
  {
    id: 'boulder-large',
    name: 'Large Boulder',
    category: 'terrain',
    defaultSize: { width: 2, height: 2 },
    defaultProperties: {
      isInteractable: false,
      isDestructible: false,
      blocksSight: true,
      blocksMovement: true,
    },
  },
  {
    id: 'tree',
    name: 'Tree',
    category: 'terrain',
    defaultSize: { width: 1, height: 1 },
    defaultProperties: {
      isInteractable: false,
      isDestructible: true,
      hitPoints: 30,
      blocksSight: true,
      blocksMovement: true,
    },
  },
  {
    id: 'tree-large',
    name: 'Large Tree',
    category: 'terrain',
    defaultSize: { width: 2, height: 2 },
    defaultProperties: {
      isInteractable: false,
      isDestructible: true,
      hitPoints: 50,
      blocksSight: true,
      blocksMovement: true,
    },
  },
  {
    id: 'bush',
    name: 'Bush',
    category: 'terrain',
    defaultSize: { width: 1, height: 1 },
    defaultProperties: {
      isInteractable: false,
      isDestructible: true,
      hitPoints: 5,
      blocksSight: false,
      blocksMovement: false,
    },
  },
  {
    id: 'statue',
    name: 'Statue',
    category: 'terrain',
    defaultSize: { width: 1, height: 1 },
    defaultProperties: {
      isInteractable: true,
      isDestructible: true,
      hitPoints: 20,
      blocksSight: false,
      blocksMovement: true,
    },
  },
  {
    id: 'statue-large',
    name: 'Large Statue',
    category: 'terrain',
    defaultSize: { width: 2, height: 2 },
    defaultProperties: {
      isInteractable: true,
      isDestructible: true,
      hitPoints: 40,
      blocksSight: true,
      blocksMovement: true,
    },
  },
  {
    id: 'rubble',
    name: 'Rubble',
    category: 'terrain',
    defaultSize: { width: 1, height: 1 },
    defaultProperties: {
      isInteractable: false,
      isDestructible: false,
      blocksSight: false,
      blocksMovement: false, // Difficult terrain, but doesn't fully block
    },
  },
  {
    id: 'water-shallow',
    name: 'Shallow Water',
    category: 'terrain',
    defaultSize: { width: 2, height: 2 },
    defaultProperties: {
      isInteractable: false,
      isDestructible: false,
      blocksSight: false,
      blocksMovement: false, // Difficult terrain
    },
  },
];

// ---------------------------------------------------------------------------
// Hazard Objects
// ---------------------------------------------------------------------------

export const HAZARD_OBJECTS: SceneObjectDefinition[] = [
  {
    id: 'pit',
    name: 'Pit',
    category: 'hazard',
    defaultSize: { width: 1, height: 1 },
    defaultProperties: {
      isInteractable: false,
      isDestructible: false,
      blocksSight: false,
      blocksMovement: true,
    },
  },
  {
    id: 'pit-large',
    name: 'Large Pit',
    category: 'hazard',
    defaultSize: { width: 2, height: 2 },
    defaultProperties: {
      isInteractable: false,
      isDestructible: false,
      blocksSight: false,
      blocksMovement: true,
    },
  },
  {
    id: 'spike-trap',
    name: 'Spike Trap',
    category: 'hazard',
    defaultSize: { width: 1, height: 1 },
    defaultProperties: {
      isInteractable: true,
      isDestructible: true,
      hitPoints: 10,
      blocksSight: false,
      blocksMovement: false,
    },
  },
  {
    id: 'fire-pit',
    name: 'Fire Pit',
    category: 'hazard',
    defaultSize: { width: 1, height: 1 },
    defaultProperties: {
      isInteractable: false,
      isDestructible: false,
      blocksSight: false,
      blocksMovement: false,
    },
  },
  {
    id: 'acid-pool',
    name: 'Acid Pool',
    category: 'hazard',
    defaultSize: { width: 2, height: 2 },
    defaultProperties: {
      isInteractable: false,
      isDestructible: false,
      blocksSight: false,
      blocksMovement: false,
    },
  },
  {
    id: 'lava-pool',
    name: 'Lava Pool',
    category: 'hazard',
    defaultSize: { width: 2, height: 2 },
    defaultProperties: {
      isInteractable: false,
      isDestructible: false,
      blocksSight: false,
      blocksMovement: true, // Too dangerous to walk through
    },
  },
];

// ---------------------------------------------------------------------------
// Marker Objects
// ---------------------------------------------------------------------------

export const MARKER_OBJECTS: SceneObjectDefinition[] = [
  {
    id: 'spawn-point-heroes',
    name: 'Hero Spawn',
    category: 'marker',
    defaultSize: { width: 1, height: 1 },
    defaultProperties: {
      isInteractable: false,
      isDestructible: false,
      blocksSight: false,
      blocksMovement: false,
    },
  },
  {
    id: 'spawn-point-enemies',
    name: 'Enemy Spawn',
    category: 'marker',
    defaultSize: { width: 1, height: 1 },
    defaultProperties: {
      isInteractable: false,
      isDestructible: false,
      blocksSight: false,
      blocksMovement: false,
    },
  },
  {
    id: 'objective-point',
    name: 'Objective',
    category: 'marker',
    defaultSize: { width: 1, height: 1 },
    defaultProperties: {
      isInteractable: true,
      isDestructible: false,
      blocksSight: false,
      blocksMovement: false,
    },
  },
  {
    id: 'waypoint',
    name: 'Waypoint',
    category: 'marker',
    defaultSize: { width: 1, height: 1 },
    defaultProperties: {
      isInteractable: false,
      isDestructible: false,
      blocksSight: false,
      blocksMovement: false,
    },
  },
  {
    id: 'exit-point',
    name: 'Exit',
    category: 'marker',
    defaultSize: { width: 2, height: 1 },
    defaultProperties: {
      isInteractable: true,
      isDestructible: false,
      blocksSight: false,
      blocksMovement: false,
    },
  },
  {
    id: 'door-closed',
    name: 'Closed Door',
    category: 'marker',
    defaultSize: { width: 1, height: 1 },
    defaultProperties: {
      isInteractable: true,
      isDestructible: true,
      hitPoints: 15,
      blocksSight: true,
      blocksMovement: true,
    },
  },
  {
    id: 'door-open',
    name: 'Open Door',
    category: 'marker',
    defaultSize: { width: 1, height: 1 },
    defaultProperties: {
      isInteractable: true,
      isDestructible: false,
      blocksSight: false,
      blocksMovement: false,
    },
  },
  {
    id: 'door-locked',
    name: 'Locked Door',
    category: 'marker',
    defaultSize: { width: 1, height: 1 },
    defaultProperties: {
      isInteractable: true,
      isDestructible: true,
      hitPoints: 25,
      blocksSight: true,
      blocksMovement: true,
    },
  },
  {
    id: 'secret-door',
    name: 'Secret Door',
    category: 'marker',
    defaultSize: { width: 1, height: 1 },
    defaultProperties: {
      isInteractable: true,
      isDestructible: false,
      blocksSight: true,
      blocksMovement: true,
    },
  },
];

// ---------------------------------------------------------------------------
// Combined Collections
// ---------------------------------------------------------------------------

/**
 * All scene objects from all categories
 */
export const ALL_SCENE_OBJECTS: SceneObjectDefinition[] = [
  ...FURNITURE_OBJECTS,
  ...TERRAIN_OBJECTS,
  ...HAZARD_OBJECTS,
  ...MARKER_OBJECTS,
];

/**
 * Scene objects grouped by category
 */
export const SCENE_OBJECTS_BY_CATEGORY: Record<SceneObjectCategory, SceneObjectDefinition[]> = {
  furniture: FURNITURE_OBJECTS,
  terrain: TERRAIN_OBJECTS,
  hazard: HAZARD_OBJECTS,
  marker: MARKER_OBJECTS,
};

// ---------------------------------------------------------------------------
// Utility Functions
// ---------------------------------------------------------------------------

/**
 * Get all scene objects
 */
export function getAllSceneObjects(): SceneObjectDefinition[] {
  return ALL_SCENE_OBJECTS;
}

/**
 * Get a scene object by ID
 */
export function getSceneObjectById(id: string): SceneObjectDefinition | undefined {
  return ALL_SCENE_OBJECTS.find(obj => obj.id === id);
}

/**
 * Get scene objects by category
 */
export function getSceneObjectsByCategory(category: SceneObjectCategory): SceneObjectDefinition[] {
  return SCENE_OBJECTS_BY_CATEGORY[category] ?? [];
}

/**
 * Search scene objects by name
 */
export function searchSceneObjects(query: string): SceneObjectDefinition[] {
  const lowerQuery = query.toLowerCase();
  return ALL_SCENE_OBJECTS.filter(obj =>
    obj.name.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Category display names
 */
export const SCENE_OBJECT_CATEGORY_NAMES: Record<SceneObjectCategory, string> = {
  furniture: 'Furniture',
  terrain: 'Terrain',
  hazard: 'Hazard',
  marker: 'Marker',
};
