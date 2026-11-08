/**
 * Client-side fog of war visibility filtering.
 *
 * The server also leaves fogged creatures out of what it sends a Player. The client still filters,
 * so no view depends on that:
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

/** Monsters and NPCs this viewer's fog hides. */
export function hiddenEntities(entities: EntityData[], fogZones: FogZone[]): EntityData[] {
  return entities.filter((entity) => entity.type !== 'hero' && isInFog(entity.x, entity.y, fogZones));
}

/**
 * Creatures this viewer has seen that are no longer visible. Worked out only from what the viewer
 * has seen: the server redacts hidden ids from a Player's combat lists, so those can't tell.
 */
export function seenButNotVisible(seen: EntityData[], visible: EntityData[]): EntityData[] {
  const visibleIds = new Set(visible.map((entity) => entity.id));
  return seen.filter((entity) => !visibleIds.has(entity.id));
}

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * A hidden creature's name never reaches a Player's log: it reads "Something" (DESIGN.md section 7).
 * Longest names first, whole words only, so "Scrapper 1" does not eat into "Scrapper 10". A creature
 * that shares its exact name with one the Player can see stays as written.
 */
export function maskHiddenNames(text: string, hidden: EntityData[], visible: EntityData[] = []): string {
  const seen = new Set(visible.map((entity) => entity.name));
  const names = hidden.map((entity) => entity.name).filter((name) => !seen.has(name)).sort((a, b) => b.length - a.length);
  let out = text;
  for (const name of names) {
    out = out.replace(new RegExp(`(?<![\\w-])${escapeRegExp(name)}(?![\\w-])`, 'g'), 'Something');
  }
  return out;
}
