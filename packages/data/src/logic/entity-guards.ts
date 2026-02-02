/**
 * Entity Type Guards
 *
 * Type-safe predicates for discriminating entity types.
 * Use these to narrow types in conditional logic.
 */

import type {
  Entity,
  EntityType,
  HeroData,
  NPCData,
  EnemyData,
  ObjectData,
  HazardData,
} from '@anvil/types';

// ---------------------------------------------------------------------------
// Primary Type Guards
// ---------------------------------------------------------------------------

/**
 * Check if an entity is a hero.
 *
 * @param entity - The entity to check
 * @returns True if entity is a hero, with narrowed type
 *
 * @example
 * if (isHero(entity)) {
 *   // entity.data is HeroData
 *   console.log(entity.data.heroClass);
 * }
 */
export function isHero(entity: Entity): entity is Entity & { data: HeroData } {
  return entity.type === 'hero';
}

/**
 * Check if an entity is a monster (enemy or creature).
 * Monsters are combat-capable entities controlled by the Director.
 *
 * @param entity - The entity to check
 * @returns True if entity is a monster type
 *
 * @example
 * if (isMonster(entity)) {
 *   // entity.data is EnemyData
 *   console.log(entity.data.level, entity.data.role);
 * }
 */
export function isMonster(entity: Entity): entity is Entity & { data: EnemyData } {
  return entity.type === 'enemy';
}

/**
 * Check if an entity is an NPC.
 *
 * @param entity - The entity to check
 * @returns True if entity is an NPC
 */
export function isNPC(entity: Entity): entity is Entity & { data: NPCData } {
  return entity.type === 'npc';
}

/**
 * Check if an entity is an object (furniture, doors, etc.).
 *
 * @param entity - The entity to check
 * @returns True if entity is an object
 */
export function isObject(entity: Entity): entity is Entity & { data: ObjectData } {
  return entity.type === 'object';
}

/**
 * Check if an entity is a hazard.
 *
 * @param entity - The entity to check
 * @returns True if entity is a hazard
 */
export function isHazard(entity: Entity): entity is Entity & { data: HazardData } {
  return entity.type === 'hazard';
}

// ---------------------------------------------------------------------------
// Control & Ownership Guards
// ---------------------------------------------------------------------------

/**
 * Check if an entity is controlled by a player.
 * Heroes are always player-controlled. Other entities check the ownerId.
 *
 * @param entity - The entity to check
 * @returns True if entity is player-controlled
 *
 * @example
 * const playerEntities = entities.filter(isPlayerControlled);
 */
export function isPlayerControlled(entity: Entity): boolean {
  // Heroes are always player-controlled
  if (entity.type === 'hero') return true;

  // Other entities can be assigned to players
  return entity.ownerId !== undefined && entity.ownerId !== null;
}

/**
 * Check if an entity is controlled by the Director.
 * Enemies, NPCs, hazards, and unassigned objects are Director-controlled.
 *
 * @param entity - The entity to check
 * @returns True if entity is Director-controlled
 *
 * @example
 * const directorEntities = entities.filter(isDirectorControlled);
 */
export function isDirectorControlled(entity: Entity): boolean {
  // Enemies and NPCs are Director-controlled
  if (entity.type === 'enemy' || entity.type === 'npc') return true;

  // Hazards are Director-controlled
  if (entity.type === 'hazard') return true;

  // Unowned objects are Director-controlled
  if (entity.type === 'object' && !entity.ownerId) return true;

  // Heroes are player-controlled
  if (entity.type === 'hero') return false;

  return !entity.ownerId;
}

// ---------------------------------------------------------------------------
// Combat Guards
// ---------------------------------------------------------------------------

/**
 * Check if an entity can participate in combat (has stamina).
 *
 * @param entity - The entity to check
 * @returns True if entity has combat capability
 */
export function isCombatant(entity: Entity): boolean {
  return entity.stamina !== undefined;
}

/**
 * Check if an entity is a minion (fights in squads).
 *
 * @param entity - The entity to check
 * @returns True if entity is a minion
 */
export function isMinion(entity: Entity): boolean {
  return isMonster(entity) && entity.data.isMinion;
}

/**
 * Check if an entity is a standard enemy (not minion, not solo).
 *
 * @param entity - The entity to check
 * @returns True if entity is a standard enemy
 */
export function isStandardEnemy(entity: Entity): boolean {
  return isMonster(entity) && entity.data.role === 'standard';
}

/**
 * Check if an entity is a leader enemy.
 *
 * @param entity - The entity to check
 * @returns True if entity is a leader
 */
export function isLeader(entity: Entity): boolean {
  return isMonster(entity) && entity.data.role === 'leader';
}

/**
 * Check if an entity is a solo (boss) enemy.
 *
 * @param entity - The entity to check
 * @returns True if entity is a solo/boss
 */
export function isSolo(entity: Entity): boolean {
  return isMonster(entity) && entity.data.role === 'solo';
}

// ---------------------------------------------------------------------------
// Utility Type Guards
// ---------------------------------------------------------------------------

/**
 * Check if entity is visible to a specific viewer.
 *
 * @param entity - The entity to check
 * @param viewerId - ID of the viewer (null for Director)
 * @returns True if entity is visible to the viewer
 */
export function isVisibleTo(entity: Entity, viewerId: string | null): boolean {
  // 'all' visibility: everyone can see
  if (entity.visibility === 'all') return true;

  // 'director' visibility: only Director (null viewerId)
  if (entity.visibility === 'director') return viewerId === null;

  // 'owner' visibility: Director or owner
  if (entity.visibility === 'owner') {
    return viewerId === null || entity.ownerId === viewerId;
  }

  return false;
}

/**
 * Check if entity type can take damage.
 *
 * @param entityType - The entity type to check
 * @returns True if this type can have stamina
 */
export function canTakeDamage(entityType: EntityType): boolean {
  return entityType === 'hero' || entityType === 'enemy' || entityType === 'object';
}

/**
 * Check if entity type can move.
 *
 * @param entityType - The entity type to check
 * @returns True if this type can move
 */
export function canMove(entityType: EntityType): boolean {
  return entityType === 'hero' || entityType === 'enemy' || entityType === 'npc';
}
