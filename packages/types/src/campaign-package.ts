import type {
  AudioMood,
  AudioType,
  GridType,
  MapBiome,
  MapSize,
  MapTerrainTag,
} from './assets.js';
import type { SceneImportDocument } from './scene-import.js';
import type { SceneType } from './scene.js';
import type { TerrainCategory } from './terrain.js';

export const CAMPAIGN_PACKAGE_FORMAT = 'anvil.campaign-package';
export const CAMPAIGN_ASSET_SCHEME = 'anvil-asset://';

export type CampaignPackageAssetType = 'map' | 'token' | 'portrait' | 'handout' | 'audio' | 'other';

export interface CampaignPackageMapRegistration {
  kind: 'map';
  name?: string;
  sceneType?: SceneType;
  gridType?: GridType;
  size?: MapSize;
  width?: number;
  height?: number;
  terrains?: MapTerrainTag[];
  biomes?: MapBiome[];
  tags?: string[];
}

export interface CampaignPackageTerrainRegistration {
  kind: 'terrain';
  name?: string;
  category: TerrainCategory;
  gridWidth?: number;
  gridHeight?: number;
  material?: 'wood' | 'stone' | 'metal' | 'organic';
}

export interface CampaignPackageNpcRegistration {
  kind: 'npc';
  name: string;
  location?: string;
  notes?: string;
}

export interface CampaignPackageAudioRegistration {
  kind: 'audio';
  name?: string;
  durationSeconds?: number;
  audioType?: AudioType;
  mood?: AudioMood;
  sceneTypes?: SceneType[];
  tags?: string[];
}

export interface CampaignPackageMonsterPortraitRegistration {
  kind: 'monster-portrait';
  monsterName: string;
}

export type CampaignPackageAssetRegistration =
  | CampaignPackageMapRegistration
  | CampaignPackageTerrainRegistration
  | CampaignPackageNpcRegistration
  | CampaignPackageAudioRegistration
  | CampaignPackageMonsterPortraitRegistration;

export interface CampaignPackageAsset {
  /** Stable identifier used by anvil-asset:// references in the document. */
  ref: string;
  /** Safe, relative path to the binary file inside the .cam ZIP archive. */
  path: string;
  name: string;
  type: CampaignPackageAssetType;
  contentType: string;
  size: number;
  /** Lowercase SHA-256 hex digest of the uncompressed bytes. */
  sha256: string;
  registrations?: CampaignPackageAssetRegistration[];
}

export interface CampaignPackageManifest {
  format: typeof CAMPAIGN_PACKAGE_FORMAT;
  version: 1;
  document: SceneImportDocument;
  assets: CampaignPackageAsset[];
  content?: CampaignPackageContent;
  metadata?: {
    title?: string;
    author?: string;
    description?: string;
    createdAt?: string;
  };
}

export interface CampaignPackageTerrainContent {
  name: string;
  category: TerrainCategory;
  gridWidth?: number;
  gridHeight?: number;
  material?: 'wood' | 'stone' | 'metal' | 'organic';
  assetRef?: string;
  /** Full or partial source stat block retained in campaign settings. */
  sourceData?: Record<string, unknown>;
}

export interface CampaignPackageNpcContent {
  name: string;
  location?: string;
  notes?: string;
  portraitRef?: string;
  sourceData?: Record<string, unknown>;
}

export interface CampaignPackageBestiaryContent {
  name: string;
  anvilMapping: 'existing-bestiary' | 'campaign-inline';
  monsterName?: string;
  sourceData?: Record<string, unknown>;
}

export interface CampaignPackageContent {
  terrain?: CampaignPackageTerrainContent[];
  npcs?: CampaignPackageNpcContent[];
  bestiary?: CampaignPackageBestiaryContent[];
}

export interface CampaignPackageImportRequest {
  manifest: CampaignPackageManifest;
  uploadedAssets: Record<string, string>;
}

export interface CampaignPackageImportResult {
  campaignId: string;
  moduleIds: string[];
  sessionIds: string[];
  sceneIds: string[];
  imported: {
    modules: number;
    sessions: number;
    scenes: number;
    assets: number;
    maps: number;
    terrain: number;
    npcs: number;
    audio: number;
    monsterPortraits: number;
  };
}
