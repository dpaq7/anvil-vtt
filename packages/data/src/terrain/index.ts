/**
 * Terrain System for Draw Steel
 *
 * Ported from Forgesteel (https://github.com/andyaiken/forgesteel)
 * Original work Copyright (c) Andy Aiken, Licensed under GPL-3.0
 *
 * 35 tactical terrains across 6 categories for encounter building.
 */

import type { CompendiumTerrain, TerrainCategory, TerrainMonsterRole, TerrainRoleType } from '@anvil/types';

// Category exports
export * from './environmental.js';
export * from './fieldwork.js';
export * from './mechanism.js';
export * from './siege-engine.js';
export * from './power-fixture.js';
export * from './supernatural.js';

// Import all terrain arrays
import { ENVIRONMENTAL_TERRAINS } from './environmental.js';
import { FIELDWORK_TERRAINS } from './fieldwork.js';
import { MECHANISM_TERRAINS } from './mechanism.js';
import { SIEGE_ENGINE_TERRAINS } from './siege-engine.js';
import { POWER_FIXTURE_TERRAINS } from './power-fixture.js';
import { SUPERNATURAL_TERRAINS } from './supernatural.js';

/**
 * All terrains from all categories (35 total)
 */
export const ALL_TERRAINS: CompendiumTerrain[] = [
  ...ENVIRONMENTAL_TERRAINS,
  ...FIELDWORK_TERRAINS,
  ...MECHANISM_TERRAINS,
  ...SIEGE_ENGINE_TERRAINS,
  ...POWER_FIXTURE_TERRAINS,
  ...SUPERNATURAL_TERRAINS,
];

/**
 * Terrains grouped by category
 */
export const TERRAINS_BY_CATEGORY: Record<TerrainCategory, CompendiumTerrain[]> = {
  environmental: ENVIRONMENTAL_TERRAINS,
  fieldwork: FIELDWORK_TERRAINS,
  mechanism: MECHANISM_TERRAINS,
  'siege-engine': SIEGE_ENGINE_TERRAINS,
  'power-fixture': POWER_FIXTURE_TERRAINS,
  supernatural: SUPERNATURAL_TERRAINS,
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get all terrains
 */
export function getAllTerrains(): CompendiumTerrain[] {
  return ALL_TERRAINS;
}

/**
 * Get a terrain by ID
 */
export function getTerrainById(id: string): CompendiumTerrain | undefined {
  return ALL_TERRAINS.find(t => t.id === id);
}

/**
 * Get terrains by category
 */
export function getTerrainsByCategory(category: TerrainCategory): CompendiumTerrain[] {
  return TERRAINS_BY_CATEGORY[category] ?? [];
}

/**
 * Get terrains by level
 */
export function getTerrainsByLevel(level: number): CompendiumTerrain[] {
  return ALL_TERRAINS.filter(t => t.level === level);
}

/**
 * Get terrains by level range
 */
export function getTerrainsByLevelRange(minLevel: number, maxLevel: number): CompendiumTerrain[] {
  return ALL_TERRAINS.filter(t => t.level >= minLevel && t.level <= maxLevel);
}

/**
 * Get terrains by monster role
 */
export function getTerrainsByMonsterRole(role: TerrainMonsterRole): CompendiumTerrain[] {
  return ALL_TERRAINS.filter(t => t.role.type === role);
}

/**
 * Get terrains by terrain role type
 */
export function getTerrainsByRoleType(roleType: TerrainRoleType): CompendiumTerrain[] {
  return ALL_TERRAINS.filter(t => t.role.terrainType === roleType);
}

/**
 * Get terrains by encounter value range
 */
export function getTerrainsByEVRange(minEV: number, maxEV: number): CompendiumTerrain[] {
  return ALL_TERRAINS.filter(t => t.encounterValue >= minEV && t.encounterValue <= maxEV);
}

/**
 * Search terrains by name
 */
export function searchTerrains(query: string): CompendiumTerrain[] {
  const lowerQuery = query.toLowerCase();
  return ALL_TERRAINS.filter(t =>
    t.name.toLowerCase().includes(lowerQuery) ||
    t.description.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get terrain description (for display)
 */
export function getTerrainDescription(terrain: CompendiumTerrain): string {
  const roleType = terrain.role.terrainType
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  const monsterRole = terrain.role.type.charAt(0).toUpperCase() + terrain.role.type.slice(1);
  return `Level ${terrain.level} ${roleType} ${monsterRole}`;
}

/**
 * Get terrain stamina description (for display)
 */
export function getTerrainStaminaDescription(terrain: CompendiumTerrain): string {
  const { base, perSquare } = terrain.stamina;

  if (base && !perSquare) {
    return `${base}`;
  }

  if (!base && perSquare) {
    return `${perSquare} per square`;
  }

  if (base === 0 && perSquare === 0) {
    return '—';
  }

  return `${base} + ${perSquare} per square`;
}

/**
 * Calculate total stamina for a terrain instance
 */
export function calculateTerrainStamina(terrain: CompendiumTerrain, squares: number, damage = 0): number {
  let value = terrain.stamina.base;

  if (terrain.stamina.perSquare) {
    value += terrain.stamina.perSquare * squares;
  }

  if (damage > 0) {
    value -= damage;
  }

  return Math.max(value, 0);
}

/**
 * Category display names
 */
export const TERRAIN_CATEGORY_NAMES: Record<TerrainCategory, string> = {
  environmental: 'Environmental Hazard',
  fieldwork: 'Fieldwork',
  mechanism: 'Mechanism',
  'siege-engine': 'Siege Engine',
  'power-fixture': 'Power Fixture',
  supernatural: 'Supernatural Object',
};

/**
 * Role type display names
 */
export const TERRAIN_ROLE_TYPE_NAMES: Record<TerrainRoleType, string> = {
  fortification: 'Fortification',
  hazard: 'Hazard',
  relic: 'Relic',
  'siege-engine': 'Siege Engine',
  trap: 'Trap',
  trigger: 'Trigger',
};
