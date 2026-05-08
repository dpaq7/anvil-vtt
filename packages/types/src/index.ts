/**
 * @anvil/types
 *
 * TypeScript types for Anvil VTT - aligned with Draw Steel (MCDM Heroes v1.1.1)
 *
 * Core philosophy: Everything is typed, nothing is `any`.
 * See DATA_MODEL.md for detailed documentation.
 */

// Hero types (from Mettle - complete character system)
// This is the canonical source for all character-related types
export * from './hero/index.js';

// VTT types (Anvil-specific)
export * from './entity.js';
export * from './scene.js';
export * from './session.js';
export * from './events.js';
export * from './combat.js';
export * from './conditions.js';
export * from './characteristics.js';
export * from './presentation.js';
export * from './terrain.js';
export * from './hydration.js';
export * from './assets.js';
export * from './notes.js';
export * from './scene-import.js';
