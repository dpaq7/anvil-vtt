/**
 * Campaign Update Logic
 *
 * Ensures backward compatibility when loading campaign data from Supabase.
 * Updates campaigns and their nested heroes/scenes.
 *
 * Reference: Forge Steel update logic patterns
 */

import * as HeroUpdateLogic from './hero-update-logic.js';
import * as SceneUpdateLogic from './scene-update-logic.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CampaignLike {
  id?: string;
  directorId?: string;
  name?: string;
  description?: string | null;
  coverImageUrl?: string | null;
  settings?: CampaignSettingsLike;
  modules?: ModuleLike[];
  heroes?: HeroUpdateLogic.HeroLike[];
  scenes?: SceneUpdateLogic.SceneLike[];
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface CampaignSettingsLike {
  heroCountAdjustment?: boolean;
  defaultDifficulty?: string;
  allowPlayerSceneCreation?: boolean;
  showMonsterStats?: boolean;
  autoRollInitiative?: boolean;
  trackMalice?: boolean;
  [key: string]: unknown;
}

export interface ModuleLike {
  id?: string;
  campaignId?: string;
  name?: string;
  description?: string | null;
  artworkUrl?: string | null;
  orderIndex?: number;
  sessions?: SessionLike[];
  createdAt?: string;
  updatedAt?: string;
}

export interface SessionLike {
  id?: string;
  campaignId?: string;
  moduleId?: string | null;
  name?: string;
  description?: string | null;
  status?: string;
  orderIndex?: number;
  recap?: string | null;
  dateScheduled?: string | null;
  yjsRoomId?: string | null;
  sceneData?: unknown;
  scenes?: SceneUpdateLogic.SceneLike[];
  startedAt?: string | null;
  endedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

// ---------------------------------------------------------------------------
// Campaign Update Logic
// ---------------------------------------------------------------------------

/**
 * Update campaign structure to current schema version.
 * Also updates nested heroes, modules, sessions, and scenes.
 *
 * @param campaign - Campaign object to update (mutated in place)
 */
export function update(campaign: CampaignLike): void {
  updateStructure(campaign);
  updateSettings(campaign);
  updateNestedEntities(campaign);
}

/**
 * Add missing top-level campaign fields with defaults.
 */
export function updateStructure(campaign: CampaignLike): void {
  if (campaign.description === undefined) campaign.description = null;
  if (campaign.coverImageUrl === undefined) campaign.coverImageUrl = null;
  if (campaign.notes === undefined) campaign.notes = '';
  if (campaign.modules === undefined) campaign.modules = [];
  if (campaign.heroes === undefined) campaign.heroes = [];
  if (campaign.scenes === undefined) campaign.scenes = [];
  if (campaign.deletedAt === undefined) campaign.deletedAt = null;
}

/**
 * Update campaign settings with defaults.
 */
export function updateSettings(campaign: CampaignLike): void {
  if (campaign.settings === undefined) {
    campaign.settings = createDefaultSettings();
    return;
  }

  const settings = campaign.settings;
  if (settings.heroCountAdjustment === undefined) settings.heroCountAdjustment = true;
  if (settings.defaultDifficulty === undefined) settings.defaultDifficulty = 'standard';
  if (settings.allowPlayerSceneCreation === undefined) settings.allowPlayerSceneCreation = false;
  if (settings.showMonsterStats === undefined) settings.showMonsterStats = false;
  if (settings.autoRollInitiative === undefined) settings.autoRollInitiative = true;
  if (settings.trackMalice === undefined) settings.trackMalice = true;
}

/**
 * Create default campaign settings.
 */
export function createDefaultSettings(): CampaignSettingsLike {
  return {
    heroCountAdjustment: true,
    defaultDifficulty: 'standard',
    allowPlayerSceneCreation: false,
    showMonsterStats: false,
    autoRollInitiative: true,
    trackMalice: true,
  };
}

/**
 * Update all nested entities (heroes, modules, sessions, scenes).
 */
export function updateNestedEntities(campaign: CampaignLike): void {
  // Update heroes
  if (campaign.heroes) {
    campaign.heroes.forEach((hero) => HeroUpdateLogic.update(hero));
  }

  // Update standalone scenes
  if (campaign.scenes) {
    campaign.scenes.forEach((scene) => SceneUpdateLogic.update(scene));
  }

  // Update modules
  if (campaign.modules) {
    campaign.modules.forEach(updateModule);
  }
}

/**
 * Update module structure with defaults.
 */
export function updateModule(module: ModuleLike): void {
  if (module.description === undefined) module.description = null;
  if (module.artworkUrl === undefined) module.artworkUrl = null;
  if (module.orderIndex === undefined) module.orderIndex = 0;
  if (module.sessions === undefined) module.sessions = [];

  // Update sessions within module
  module.sessions.forEach(updateSession);
}

/**
 * Update session structure with defaults.
 */
export function updateSession(session: SessionLike): void {
  if (session.description === undefined) session.description = null;
  if (session.status === undefined) session.status = 'draft';
  if (session.orderIndex === undefined) session.orderIndex = 0;
  if (session.recap === undefined) session.recap = null;
  if (session.dateScheduled === undefined) session.dateScheduled = null;
  if (session.yjsRoomId === undefined) session.yjsRoomId = null;
  if (session.sceneData === undefined) session.sceneData = {};
  if (session.scenes === undefined) session.scenes = [];
  if (session.startedAt === undefined) session.startedAt = null;
  if (session.endedAt === undefined) session.endedAt = null;

  // Update scenes within session
  session.scenes.forEach((scene) => SceneUpdateLogic.update(scene));
}

// ---------------------------------------------------------------------------
// Migration Helpers
// ---------------------------------------------------------------------------

/**
 * Migrate deprecated campaign field names.
 */
export function migrateDeprecatedFields(campaign: CampaignLike): void {
  const campaignAny = campaign as Record<string, unknown>;

  // Migration: director_id -> directorId
  if (campaignAny['director_id'] !== undefined && campaign.directorId === undefined) {
    campaign.directorId = campaignAny['director_id'] as string;
    delete campaignAny['director_id'];
  }

  // Migration: cover_image_url -> coverImageUrl
  if (campaignAny['cover_image_url'] !== undefined && campaign.coverImageUrl === undefined) {
    campaign.coverImageUrl = campaignAny['cover_image_url'] as string | null;
    delete campaignAny['cover_image_url'];
  }

  // Migration: created_at -> createdAt
  if (campaignAny['created_at'] !== undefined && campaign.createdAt === undefined) {
    campaign.createdAt = campaignAny['created_at'] as string;
    delete campaignAny['created_at'];
  }

  // Migration: updated_at -> updatedAt
  if (campaignAny['updated_at'] !== undefined && campaign.updatedAt === undefined) {
    campaign.updatedAt = campaignAny['updated_at'] as string;
    delete campaignAny['updated_at'];
  }

  // Migration: deleted_at -> deletedAt
  if (campaignAny['deleted_at'] !== undefined && campaign.deletedAt === undefined) {
    campaign.deletedAt = campaignAny['deleted_at'] as string | null;
    delete campaignAny['deleted_at'];
  }
}
