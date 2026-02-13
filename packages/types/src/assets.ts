/**
 * Director Assets — shared types for maps, NPCs, terrain, audio,
 * activity cards, montage tests, and scene monsters.
 */

import type { TerrainCategory } from './terrain.js';
import type { SceneType } from './scene.js';

// ── Maps ──

export type MapTerrainTag =
  | 'forest' | 'cave' | 'urban' | 'dungeon' | 'castle'
  | 'ship' | 'wilderness' | 'underwater' | 'planar';

export type MapBiome =
  | 'arctic' | 'desert' | 'coastal' | 'mountain'
  | 'swamp' | 'volcanic' | 'grassland' | 'underground';

export type GridType = 'gridded' | 'gridless' | 'hex';

export type MapSize = 'small' | 'medium' | 'large';

export interface MapAsset {
  id: string;
  campaignId: string;
  name: string;
  assetId: string | null;
  /** Presigned or proxied URL for the image */
  imageUrl?: string;
  sceneType: SceneType | null;
  gridType: GridType;
  size: MapSize;
  width: number | null;
  height: number | null;
  terrains: MapTerrainTag[];
  biomes: MapBiome[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateMapInput {
  name: string;
  sceneType?: SceneType;
  gridType?: GridType;
  size?: MapSize;
  width?: number;
  height?: number;
  terrains?: MapTerrainTag[];
  biomes?: MapBiome[];
  tags?: string[];
}

export interface UpdateMapInput {
  name?: string;
  sceneType?: SceneType | null;
  gridType?: GridType;
  size?: MapSize;
  terrains?: MapTerrainTag[];
  biomes?: MapBiome[];
  tags?: string[];
}

// ── NPCs ──

export interface Npc {
  id: string;
  campaignId: string;
  name: string;
  portraitAssetId: string | null;
  portraitUrl?: string;
  location: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNpcInput {
  name: string;
  location?: string;
  notes?: string;
}

export interface UpdateNpcInput {
  name?: string;
  location?: string | null;
  notes?: string | null;
}

// ── Scene Monsters ──

export interface SceneMonster {
  id: string;
  sceneId: string;
  monsterName: string;
  quantity: number;
  createdAt: string;
}

export interface AddSceneMonstersInput {
  monsterName: string;
  quantity: number;
}

// ── Monster Portraits ──

export interface MonsterPortrait {
  id: string;
  campaignId: string;
  monsterName: string;
  assetId: string;
  portraitUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Audio ──

export type AudioType = 'ambient' | 'music' | 'sound_effect';

export type AudioMood =
  | 'combat' | 'tense' | 'calm'
  | 'celebratory' | 'eerie' | 'exploration';

export interface AudioAsset {
  id: string;
  campaignId: string;
  name: string;
  assetId: string;
  audioUrl?: string;
  durationSeconds: number | null;
  audioType: AudioType | null;
  mood: AudioMood | null;
  sceneTypes: SceneType[];
  tags: string[];
  createdAt: string;
}

export interface CreateAudioInput {
  name: string;
  durationSeconds?: number;
  audioType?: AudioType;
  mood?: AudioMood;
  sceneTypes?: SceneType[];
  tags?: string[];
}

export interface UpdateAudioInput {
  name?: string;
  audioType?: AudioType | null;
  mood?: AudioMood | null;
  sceneTypes?: SceneType[];
  tags?: string[];
}

// ── Custom Terrain ──

export interface CustomTerrain {
  id: string;
  campaignId: string;
  name: string;
  assetId: string | null;
  imageUrl?: string;
  category: TerrainCategory;
  gridWidth: number;
  gridHeight: number;
  material: 'wood' | 'stone' | 'metal' | 'organic' | null;
  createdAt: string;
}

export interface CreateCustomTerrainInput {
  name: string;
  category: TerrainCategory;
  gridWidth?: number;
  gridHeight?: number;
  material?: 'wood' | 'stone' | 'metal' | 'organic';
}

// ── Activity Cards (Respite) ──

/** Activity card type — DB-level categories (underscore style for DB compat) */
export type ActivityCardType =
  | 'recover' | 'craft' | 'research' | 'socialize'
  | 'change_kit' | 'project' | 'custom';

export interface ActivityCard {
  id: string;
  campaignId: string;
  activityName: string;
  activityType: ActivityCardType;
  activityData: Record<string, unknown> | null;
  pointsSpent: number;
  pointsTotal: number | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateActivityCardInput {
  activityName: string;
  activityType: ActivityCardType;
  activityData?: Record<string, unknown>;
  pointsTotal?: number;
  notes?: string;
}

export interface UpdateActivityCardInput {
  pointsSpent?: number;
  notes?: string | null;
  isActive?: boolean;
}

// ── Montage Tests (DB-level tracker) ──

export type MontageTestStatus = 'in_progress' | 'succeeded' | 'failed';

/** DB-level montage test tracker (distinct from scene.ts MontageTest which is a roll result) */
export interface MontageTestRecord {
  id: string;
  sceneId: string;
  testName: string;
  testData: Record<string, unknown> | null;
  successes: number;
  failures: number;
  targetSuccesses: number;
  maxFailures: number;
  status: MontageTestStatus;
  createdAt: string;
}

export interface CreateMontageTestInput {
  testName: string;
  testData?: Record<string, unknown>;
  targetSuccesses: number;
  maxFailures: number;
}

export interface UpdateMontageTestInput {
  successes?: number;
  failures?: number;
  status?: MontageTestStatus;
}

// ── Asset folder type for tree sidebar ──

export type AssetFolder = 'heroes' | 'npcs' | 'maps' | 'bestiary' | 'terrain' | 'audio';
