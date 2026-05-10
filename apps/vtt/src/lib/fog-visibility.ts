/**
 * Client-side fog of war visibility filtering.
 *
 * The server broadcasts ALL entities. Players filter visibility locally:
 * - Heroes are always visible (your party)
 * - Monsters/NPCs inside fog zones are hidden from players
 * - Director sees everything (fog is semi-transparent for them)
 */

import type { EntityData } from '../types/protocol.js';

export interface FogZone {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Check if a grid position falls inside any fog zone.
 */
export function isInFog(gridX: number, gridY: number, fogZones: FogZone[]): boolean {
  for (const zone of fogZones) {
    if (
      gridX >= zone.x &&
      gridX < zone.x + zone.w &&
      gridY >= zone.y &&
      gridY < zone.y + zone.h
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Filter entities for player visibility.
 *
 * - Heroes are always visible (players can always see party members)
 * - Monsters/NPCs are hidden if they're inside a fog zone
 * - If no fog zones exist, all entities are visible
 */
export function filterVisibleEntities(
  entities: EntityData[],
  fogZones: FogZone[],
): EntityData[] {
  if (fogZones.length === 0) return entities;

  return entities.filter((entity) => {
    // Heroes are always visible to players
    if (entity.type === 'hero') return true;

    // Check if this entity's position is inside fog
    return !isInFog(entity.x, entity.y, fogZones);
  });
}
