import type { SceneType } from './scene.js';

export const SCENE_IMPORT_FORMAT = 'anvil.scene-import';

export interface SceneImportCampaign {
  name: string;
  description?: string;
  settings?: Record<string, unknown>;
}

export interface SceneImportScene {
  id?: string;
  title: string;
  type: SceneType;
  data?: Record<string, unknown>;
  orderIndex?: number;
}

export interface SceneImportSession {
  id?: string;
  name: string;
  description?: string;
  scenes: SceneImportScene[];
  orderIndex?: number;
}

export interface SceneImportModule {
  id?: string;
  name: string;
  description?: string;
  sessions: SceneImportSession[];
  orderIndex?: number;
}

export interface SceneImportDocument {
  format: typeof SCENE_IMPORT_FORMAT;
  version: 1;
  campaign: SceneImportCampaign;
  modules?: SceneImportModule[];
  sessions?: SceneImportSession[];
}

export interface SceneImportRequest {
  document: SceneImportDocument;
}

export interface SceneImportResult {
  campaignId: string;
  moduleIds: string[];
  sessionIds: string[];
  sceneIds: string[];
  imported: {
    modules: number;
    sessions: number;
    scenes: number;
  };
}
