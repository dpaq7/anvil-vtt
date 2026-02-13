import { create } from 'zustand';
import { api } from '../lib/api.js';
import type {
  AssetFolder,
  MapAsset,
  CreateMapInput,
  UpdateMapInput,
  Npc,
  CreateNpcInput,
  UpdateNpcInput,
  SceneMonster,
  AddSceneMonstersInput,
  AudioAsset,
  CreateAudioInput,
  UpdateAudioInput,
  CustomTerrain,
  CreateCustomTerrainInput,
  ActivityCard,
  CreateActivityCardInput,
  UpdateActivityCardInput,
  MontageTestRecord,
  CreateMontageTestInput,
  UpdateMontageTestInput,
  MonsterPortrait,
  GridType,
  MapSize,
  MapTerrainTag,
  MapBiome,
  SceneType,
} from '@anvil/types';

// ── Filter State ──

export interface MapFilters {
  sceneType?: SceneType;
  terrain?: MapTerrainTag[];
  biome?: MapBiome[];
  gridType?: GridType;
  size?: MapSize;
  search?: string;
}

// ── Store Interface ──

interface AssetsState {
  // Currently selected folder in the tree
  selectedFolder: AssetFolder;

  // Data per folder
  maps: MapAsset[];
  npcs: Npc[];
  sceneMonsters: SceneMonster[];
  customTerrain: CustomTerrain[];
  audioAssets: AudioAsset[];
  activityCards: ActivityCard[];
  montageTests: MontageTestRecord[];
  monsterPortraits: MonsterPortrait[];

  // UI state
  loading: boolean;
  error: string | null;
  selectedItemId: string | null;

  // Filters
  mapFilters: MapFilters;

  // Actions — navigation
  setSelectedFolder: (folder: AssetFolder) => void;
  setSelectedItemId: (id: string | null) => void;
  setMapFilters: (filters: Partial<MapFilters>) => void;
  clearError: () => void;

  // Actions — maps
  loadMaps: (campaignId: string) => Promise<void>;
  createMap: (campaignId: string, input: CreateMapInput, file?: File) => Promise<MapAsset>;
  updateMap: (campaignId: string, mapId: string, input: UpdateMapInput) => Promise<void>;
  deleteMap: (campaignId: string, mapId: string) => Promise<void>;

  // Actions — NPCs
  loadNpcs: (campaignId: string) => Promise<void>;
  createNpc: (campaignId: string, input: CreateNpcInput) => Promise<Npc>;
  updateNpc: (campaignId: string, npcId: string, input: UpdateNpcInput) => Promise<void>;
  deleteNpc: (campaignId: string, npcId: string) => Promise<void>;

  // Actions — Scene monsters
  loadSceneMonsters: (sceneId: string) => Promise<void>;
  addSceneMonster: (sceneId: string, input: AddSceneMonstersInput) => Promise<void>;
  removeSceneMonster: (sceneId: string, entryId: string) => Promise<void>;

  // Actions — Audio
  loadAudio: (campaignId: string) => Promise<void>;
  createAudio: (campaignId: string, input: CreateAudioInput, file: File) => Promise<AudioAsset>;
  updateAudio: (campaignId: string, audioId: string, input: UpdateAudioInput) => Promise<void>;
  deleteAudio: (campaignId: string, audioId: string) => Promise<void>;

  // Actions — Custom terrain
  loadCustomTerrain: (campaignId: string) => Promise<void>;
  createCustomTerrain: (campaignId: string, input: CreateCustomTerrainInput, file?: File) => Promise<CustomTerrain>;
  deleteCustomTerrain: (campaignId: string, terrainId: string) => Promise<void>;

  // Actions — Activity cards
  loadActivityCards: (campaignId: string) => Promise<void>;
  createActivityCard: (campaignId: string, input: CreateActivityCardInput) => Promise<ActivityCard>;
  updateActivityCard: (campaignId: string, activityId: string, input: UpdateActivityCardInput) => Promise<void>;
  deleteActivityCard: (campaignId: string, activityId: string) => Promise<void>;

  // Actions — Montage tests
  loadMontageTests: (sceneId: string) => Promise<void>;
  createMontageTest: (sceneId: string, input: CreateMontageTestInput) => Promise<MontageTestRecord>;
  updateMontageTest: (sceneId: string, testId: string, input: UpdateMontageTestInput) => Promise<void>;
  deleteMontageTest: (sceneId: string, testId: string) => Promise<void>;

  // Actions — Monster portraits
  loadMonsterPortraits: (campaignId: string) => Promise<void>;
  setMonsterPortrait: (campaignId: string, monsterName: string, assetId: string) => Promise<void>;
  deleteMonsterPortrait: (campaignId: string, monsterName: string) => Promise<void>;
}

// ── File Upload Helper ──

export async function uploadFile(file: File, assetType: string): Promise<string> {
  const { id } = await api.post<{ id: string; storageKey: string }>('/api/assets/upload', {
    name: file.name,
    type: assetType,
    contentType: file.type,
  });
  const buffer = await file.arrayBuffer();
  await api.putRaw(`/api/assets/${id}/data`, buffer, file.type);
  return id;
}

// ── Store ──

export const useAssetsStore = create<AssetsState>((set, _get) => ({
  // Initial state
  selectedFolder: 'heroes',
  maps: [],
  npcs: [],
  sceneMonsters: [],
  customTerrain: [],
  audioAssets: [],
  activityCards: [],
  montageTests: [],
  monsterPortraits: [],
  loading: false,
  error: null,
  selectedItemId: null,
  mapFilters: {},

  // ── Navigation ──

  setSelectedFolder: (folder) => set({ selectedFolder: folder, selectedItemId: null }),
  setSelectedItemId: (id) => set({ selectedItemId: id }),
  setMapFilters: (filters) => set((s) => ({ mapFilters: { ...s.mapFilters, ...filters } })),
  clearError: () => set({ error: null }),

  // ── Maps ──

  loadMaps: async (campaignId) => {
    set({ loading: true, error: null });
    try {
      const { maps } = await api.get<{ maps: MapAsset[] }>(`/api/campaigns/${campaignId}/maps`);
      set({ maps, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  createMap: async (campaignId, input, file) => {
    set({ loading: true, error: null });
    try {
      let assetId: string | undefined;
      if (file) {
        assetId = await uploadFile(file, 'map');
      }
      const { map } = await api.post<{ map: MapAsset }>(`/api/campaigns/${campaignId}/maps`, {
        ...input,
        assetId,
      });
      set((s) => ({ maps: [map, ...s.maps], loading: false }));
      return map;
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
      throw e;
    }
  },

  updateMap: async (campaignId, mapId, input) => {
    try {
      const { map } = await api.patch<{ map: MapAsset }>(`/api/campaigns/${campaignId}/maps/${mapId}`, input);
      set((s) => ({ maps: s.maps.map((m) => (m.id === mapId ? map : m)) }));
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  deleteMap: async (campaignId, mapId) => {
    try {
      await api.delete(`/api/campaigns/${campaignId}/maps/${mapId}`);
      set((s) => ({
        maps: s.maps.filter((m) => m.id !== mapId),
        selectedItemId: s.selectedItemId === mapId ? null : s.selectedItemId,
      }));
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  // ── NPCs ──

  loadNpcs: async (campaignId) => {
    set({ loading: true, error: null });
    try {
      const { npcs } = await api.get<{ npcs: Npc[] }>(`/api/campaigns/${campaignId}/npcs`);
      set({ npcs, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  createNpc: async (campaignId, input) => {
    set({ loading: true, error: null });
    try {
      const { npc } = await api.post<{ npc: Npc }>(`/api/campaigns/${campaignId}/npcs`, input);
      set((s) => ({ npcs: [npc, ...s.npcs], loading: false }));
      return npc;
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
      throw e;
    }
  },

  updateNpc: async (campaignId, npcId, input) => {
    try {
      const { npc } = await api.patch<{ npc: Npc }>(`/api/campaigns/${campaignId}/npcs/${npcId}`, input);
      set((s) => ({ npcs: s.npcs.map((n) => (n.id === npcId ? npc : n)) }));
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  deleteNpc: async (campaignId, npcId) => {
    try {
      await api.delete(`/api/campaigns/${campaignId}/npcs/${npcId}`);
      set((s) => ({
        npcs: s.npcs.filter((n) => n.id !== npcId),
        selectedItemId: s.selectedItemId === npcId ? null : s.selectedItemId,
      }));
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  // ── Scene Monsters ──

  loadSceneMonsters: async (sceneId) => {
    set({ loading: true, error: null });
    try {
      const { monsters } = await api.get<{ monsters: SceneMonster[] }>(`/api/scenes/${sceneId}/monsters`);
      set({ sceneMonsters: monsters, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  addSceneMonster: async (sceneId, input) => {
    try {
      const { monster } = await api.post<{ monster: SceneMonster }>(`/api/scenes/${sceneId}/monsters`, input);
      set((s) => ({ sceneMonsters: [monster, ...s.sceneMonsters] }));
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  removeSceneMonster: async (sceneId, entryId) => {
    try {
      await api.delete(`/api/scenes/${sceneId}/monsters/${entryId}`);
      set((s) => ({ sceneMonsters: s.sceneMonsters.filter((m) => m.id !== entryId) }));
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  // ── Audio ──

  loadAudio: async (campaignId) => {
    set({ loading: true, error: null });
    try {
      const { audio } = await api.get<{ audio: AudioAsset[] }>(`/api/campaigns/${campaignId}/audio`);
      set({ audioAssets: audio, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  createAudio: async (campaignId, input, file) => {
    set({ loading: true, error: null });
    try {
      const assetId = await uploadFile(file, 'other');
      const { audio } = await api.post<{ audio: AudioAsset }>(`/api/campaigns/${campaignId}/audio`, {
        ...input,
        assetId,
      });
      set((s) => ({ audioAssets: [audio, ...s.audioAssets], loading: false }));
      return audio;
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
      throw e;
    }
  },

  updateAudio: async (campaignId, audioId, input) => {
    try {
      const { audio } = await api.patch<{ audio: AudioAsset }>(`/api/campaigns/${campaignId}/audio/${audioId}`, input);
      set((s) => ({ audioAssets: s.audioAssets.map((a) => (a.id === audioId ? audio : a)) }));
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  deleteAudio: async (campaignId, audioId) => {
    try {
      await api.delete(`/api/campaigns/${campaignId}/audio/${audioId}`);
      set((s) => ({
        audioAssets: s.audioAssets.filter((a) => a.id !== audioId),
        selectedItemId: s.selectedItemId === audioId ? null : s.selectedItemId,
      }));
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  // ── Custom Terrain ──

  loadCustomTerrain: async (campaignId) => {
    set({ loading: true, error: null });
    try {
      const { terrain } = await api.get<{ terrain: CustomTerrain[] }>(`/api/campaigns/${campaignId}/terrain`);
      set({ customTerrain: terrain, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  createCustomTerrain: async (campaignId, input, file) => {
    set({ loading: true, error: null });
    try {
      let assetId: string | undefined;
      if (file) {
        assetId = await uploadFile(file, 'other');
      }
      const { terrain } = await api.post<{ terrain: CustomTerrain }>(`/api/campaigns/${campaignId}/terrain`, {
        ...input,
        assetId,
      });
      set((s) => ({ customTerrain: [terrain, ...s.customTerrain], loading: false }));
      return terrain;
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
      throw e;
    }
  },

  deleteCustomTerrain: async (campaignId, terrainId) => {
    try {
      await api.delete(`/api/campaigns/${campaignId}/terrain/${terrainId}`);
      set((s) => ({
        customTerrain: s.customTerrain.filter((t) => t.id !== terrainId),
        selectedItemId: s.selectedItemId === terrainId ? null : s.selectedItemId,
      }));
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  // ── Activity Cards ──

  loadActivityCards: async (campaignId) => {
    set({ loading: true, error: null });
    try {
      const { activities } = await api.get<{ activities: ActivityCard[] }>(`/api/campaigns/${campaignId}/activities`);
      set({ activityCards: activities, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  createActivityCard: async (campaignId, input) => {
    set({ loading: true, error: null });
    try {
      const { activity } = await api.post<{ activity: ActivityCard }>(`/api/campaigns/${campaignId}/activities`, input);
      set((s) => ({ activityCards: [activity, ...s.activityCards], loading: false }));
      return activity;
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
      throw e;
    }
  },

  updateActivityCard: async (campaignId, activityId, input) => {
    try {
      const { activity } = await api.patch<{ activity: ActivityCard }>(
        `/api/campaigns/${campaignId}/activities/${activityId}`,
        input,
      );
      set((s) => ({ activityCards: s.activityCards.map((a) => (a.id === activityId ? activity : a)) }));
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  deleteActivityCard: async (campaignId, activityId) => {
    try {
      await api.delete(`/api/campaigns/${campaignId}/activities/${activityId}`);
      set((s) => ({ activityCards: s.activityCards.filter((a) => a.id !== activityId) }));
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  // ── Montage Tests ──

  loadMontageTests: async (sceneId) => {
    set({ loading: true, error: null });
    try {
      const { tests } = await api.get<{ tests: MontageTestRecord[] }>(`/api/scenes/${sceneId}/montage-tests`);
      set({ montageTests: tests, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  createMontageTest: async (sceneId, input) => {
    set({ loading: true, error: null });
    try {
      const { test } = await api.post<{ test: MontageTestRecord }>(`/api/scenes/${sceneId}/montage-tests`, input);
      set((s) => ({ montageTests: [test, ...s.montageTests], loading: false }));
      return test;
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
      throw e;
    }
  },

  updateMontageTest: async (sceneId, testId, input) => {
    try {
      const { test } = await api.patch<{ test: MontageTestRecord }>(
        `/api/scenes/${sceneId}/montage-tests/${testId}`,
        input,
      );
      set((s) => ({ montageTests: s.montageTests.map((t) => (t.id === testId ? test : t)) }));
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  deleteMontageTest: async (sceneId, testId) => {
    try {
      await api.delete(`/api/scenes/${sceneId}/montage-tests/${testId}`);
      set((s) => ({ montageTests: s.montageTests.filter((t) => t.id !== testId) }));
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  // ── Monster Portraits ──

  loadMonsterPortraits: async (campaignId) => {
    try {
      const { portraits } = await api.get<{ portraits: MonsterPortrait[] }>(
        `/api/campaigns/${campaignId}/monster-portraits`,
      );
      set({ monsterPortraits: portraits });
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  setMonsterPortrait: async (campaignId, monsterName, assetId) => {
    try {
      const { portrait } = await api.post<{ portrait: MonsterPortrait }>(
        `/api/campaigns/${campaignId}/monster-portraits`,
        { monsterName, assetId },
      );
      set((s) => ({
        monsterPortraits: [
          ...s.monsterPortraits.filter(
            (p) => p.monsterName.toLowerCase() !== monsterName.toLowerCase(),
          ),
          portrait,
        ],
      }));
    } catch (e) {
      set({ error: (e as Error).message });
      throw e;
    }
  },

  deleteMonsterPortrait: async (campaignId, monsterName) => {
    try {
      await api.delete(
        `/api/campaigns/${campaignId}/monster-portraits/${encodeURIComponent(monsterName)}`,
      );
      set((s) => ({
        monsterPortraits: s.monsterPortraits.filter(
          (p) => p.monsterName.toLowerCase() !== monsterName.toLowerCase(),
        ),
      }));
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },
}));

// ── Portrait Helpers ──

/** Look up a portrait URL for a monster by name (case-insensitive). */
export function getMonsterPortraitUrl(
  portraits: MonsterPortrait[],
  name: string,
): string | undefined {
  return portraits.find(
    (p) => p.monsterName.toLowerCase() === name.toLowerCase(),
  )?.portraitUrl;
}
