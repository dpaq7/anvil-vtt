/**
 * Update Logic Index
 *
 * Exports all update logic modules for schema migration.
 *
 * Usage:
 *   import { HeroUpdateLogic, SceneUpdateLogic, CampaignUpdateLogic } from '@anvil/data';
 *
 *   // After loading from database
 *   HeroUpdateLogic.update(hero);
 *   SceneUpdateLogic.update(scene);
 *   CampaignUpdateLogic.update(campaign);
 */

// Individual update modules as namespaces
export * as HeroUpdateLogic from './hero-update-logic.js';
export * as SceneUpdateLogic from './scene-update-logic.js';
export * as CampaignUpdateLogic from './campaign-update-logic.js';

// Re-export types for convenience
export type { HeroLike } from './hero-update-logic.js';
export type {
  SceneLike,
  SceneType,
  BattleStateLike,
  MontageStateLike,
  NegotiationStateLike,
  RespiteStateLike,
  StoryStateLike,
} from './scene-update-logic.js';
export type {
  CampaignLike,
  CampaignSettingsLike,
  ModuleLike,
  SessionLike,
} from './campaign-update-logic.js';

// ---------------------------------------------------------------------------
// Convenience Functions
// ---------------------------------------------------------------------------

import * as HeroUpdateLogic from './hero-update-logic.js';
import * as SceneUpdateLogic from './scene-update-logic.js';
import * as CampaignUpdateLogic from './campaign-update-logic.js';

/**
 * Update all entities in a data payload.
 * Useful when loading multiple types at once.
 *
 * @param data - Data containing heroes, scenes, and/or campaigns
 */
export function updateAll(data: {
  heroes?: HeroUpdateLogic.HeroLike[];
  scenes?: SceneUpdateLogic.SceneLike[];
  campaigns?: CampaignUpdateLogic.CampaignLike[];
}): void {
  if (data.heroes) {
    data.heroes.forEach((h) => HeroUpdateLogic.update(h));
  }
  if (data.scenes) {
    data.scenes.forEach((s) => SceneUpdateLogic.update(s));
  }
  if (data.campaigns) {
    data.campaigns.forEach((c) => CampaignUpdateLogic.update(c));
  }
}

/**
 * Check if an object needs update (has missing fields).
 * Useful for debugging or conditional updates.
 *
 * @param obj - Object to check
 * @param requiredFields - Fields that should exist
 * @returns True if any required field is missing
 */
export function needsUpdate(obj: Record<string, unknown>, requiredFields: string[]): boolean {
  return requiredFields.some((field) => obj[field] === undefined);
}
