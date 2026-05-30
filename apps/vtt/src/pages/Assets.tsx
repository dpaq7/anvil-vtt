import { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Upload, AlertCircle, RefreshCw } from 'lucide-react';
import {
  Button,
  Input,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogClose,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@anvil/ui';
import { api } from '../lib/api.js';
import { useAssetsStore } from '../stores/assetsStore.js';
import { AssetTreeSidebar } from '../components/assets/AssetTreeSidebar.js';
import { HeroGrid } from '../components/assets/HeroGrid.js';
import { NpcGrid } from '../components/assets/NpcGrid.js';
import { NpcDetailPane } from '../components/assets/NpcDetailPane.js';
import { MapGrid } from '../components/assets/MapGrid.js';
import { MapFilterBar } from '../components/assets/MapFilterBar.js';
import { MapUploadDialog } from '../components/assets/MapUploadDialog.js';
import { MapDetailPane } from '../components/assets/MapDetailPane.js';
import { BestiaryTable } from '../components/assets/BestiaryTable.js';
import { TerrainGrid } from '../components/assets/TerrainGrid.js';
import { AudioGrid } from '../components/assets/AudioGrid.js';
import { AudioUploadDialog } from '../components/assets/AudioUploadDialog.js';
import { PictureGrid, type PictureAsset, type UpdatePictureAssetInput } from '../components/assets/PictureGrid.js';
import { ALL_TERRAINS, loadMonsters, isMonsterStatblock, FORGESTEEL_MONSTERS } from '@anvil/data';
import type { HeroSummary, AssetFolder, SceneType } from '@anvil/types';
import type { CompendiumMonster } from '@anvil/data';

interface Scene {
  id: string;
  title: string;
  type: SceneType;
  game_session_id: string;
  order_index: number;
}

interface Session {
  id: string;
  name: string;
  campaign_id: string;
  status: string;
}

// ── Loading skeleton ──

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-lg border border-zinc-800 bg-zinc-900 p-4">
      <div className="flex items-start gap-3">
        <div className="size-10 shrink-0 rounded-md bg-zinc-800" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-2/3 rounded bg-zinc-800" />
          <div className="h-2 w-1/2 rounded bg-zinc-800" />
          <div className="flex gap-1">
            <div className="h-4 w-12 rounded bg-zinc-800" />
            <div className="h-4 w-10 rounded bg-zinc-800" />
          </div>
        </div>
      </div>
    </div>
  );
}

function SkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

// ── Empty state ──

function EmptyState({
  message,
  action,
}: {
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 p-12">
      <p className="text-sm text-zinc-500">{message}</p>
      {action}
    </div>
  );
}

// ── Error banner ──

function ErrorBanner({
  message,
  onRetry,
  onDismiss,
}: {
  message: string;
  onRetry: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="mx-4 mt-2 flex items-center gap-3 rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-2">
      <AlertCircle className="size-4 shrink-0 text-red-400" />
      <p className="flex-1 text-xs text-red-300">{message}</p>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 px-2 text-xs text-red-400 hover:text-red-300"
        onClick={onRetry}
      >
        <RefreshCw className="mr-1 size-3" />
        Retry
      </Button>
      <button
        onClick={onDismiss}
        className="text-xs text-zinc-500 hover:text-zinc-300"
      >
        ✕
      </button>
    </div>
  );
}

interface Campaign {
  id: string;
  name: string;
}

export function Assets() {
  // ── Campaign selection ──
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignId, setCampaignId] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<{ directed: Campaign[] }>('/api/campaigns')
      .then((data) => {
        setCampaigns(data.directed);
        if (data.directed.length > 0 && !campaignId) {
          setCampaignId(data.directed[0]!.id);
        }
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Assets store ──
  const {
    selectedFolder,
    setSelectedFolder,
    selectedItemId,
    setSelectedItemId,
    maps,
    npcs,
    customTerrain,
    audioAssets,
    mapFilters,
    setMapFilters,
    loadMaps,
    createMap,
    updateMap,
    deleteMap,
    loadNpcs,
    createNpc,
    updateNpc,
    deleteNpc,
    loadCustomTerrain,
    loadAudio,
    createAudio,
    updateAudio,
    deleteAudio,
    addSceneMonster,
    monsterPortraits,
    loadMonsterPortraits,
    setMonsterPortrait,
    deleteMonsterPortrait,
    loading,
    error,
    clearError,
  } = useAssetsStore();

  // ── Heroes (loaded separately, not stored in assets store) ──
  const [heroes, setHeroes] = useState<HeroSummary[]>([]);
  const [pictureAssets, setPictureAssets] = useState<PictureAsset[]>([]);
  const [picturesLoading, setPicturesLoading] = useState(false);
  const [picturesError, setPicturesError] = useState<string | null>(null);

  // ── Scenes for add-to-scene dropdown ──
  const [scenes, setScenes] = useState<Array<{ id: string; name: string; sceneType: string }>>([]);

  // ── Monster data (from @anvil/data compendium — read-only) ──
  const [monsters, setMonsters] = useState<CompendiumMonster[]>([]);

  // ── Load bestiary from compendium on mount (once) ──
  useEffect(() => {
    loadMonsters()
      .then((data) => {
        const statblocks = data.items.filter(isMonsterStatblock) as CompendiumMonster[];
        // Merge in supplementary Forgesteel monsters, dedup by _id
        const ids = new Set(statblocks.map((m) => m._id));
        const supplementary = FORGESTEEL_MONSTERS.filter((m) => !ids.has(m._id));
        const all = [...statblocks, ...supplementary].sort((a, b) =>
          a.name.localeCompare(b.name),
        );
        setMonsters(all);
      })
      .catch(() => setMonsters([]));
  }, []);

  const loadPictures = useCallback(async () => {
    setPicturesLoading(true);
    setPicturesError(null);
    try {
      const { assets } = await api.get<{ assets: PictureAsset[] }>('/api/assets');
      setPictureAssets(
        assets.filter((asset) =>
          asset.uploaded_at !== null &&
          asset.type !== 'map' &&
          (asset.content_type?.toLowerCase().startsWith('image/') ?? false),
        ),
      );
    } catch (err) {
      setPicturesError(err instanceof Error ? err.message : 'Failed to load pictures');
      setPictureAssets([]);
    } finally {
      setPicturesLoading(false);
    }
  }, []);

  // ── Load campaign data when campaign changes ──
  useEffect(() => {
    if (!campaignId) return;
    loadMaps(campaignId);
    loadNpcs(campaignId);
    loadCustomTerrain(campaignId);
    loadAudio(campaignId);
    loadMonsterPortraits(campaignId);
    void loadPictures();

    // Heroes (user-scoped, not campaign-scoped)
    api
      .get<HeroSummary[]>('/api/heroes')
      .then((data) => setHeroes(data))
      .catch(() => setHeroes([]));

    // Load sessions → scenes for add-to-scene dropdown
    api
      .get<{ sessions: Session[] }>(`/api/campaigns/${campaignId}/sessions`)
      .then(async (sessionsData) => {
        const allScenes: Array<{ id: string; name: string; sceneType: string }> = [];
        for (const session of sessionsData.sessions) {
          try {
            const scenesData = await api.get<{ scenes: Scene[] }>(
              `/api/sessions/${session.id}/scenes`,
            );
            for (const scene of scenesData.scenes) {
              allScenes.push({
                id: scene.id,
                name: `${scene.title} (${session.name})`,
                sceneType: scene.type,
              });
            }
          } catch {
            // Skip sessions we can't fetch scenes for
          }
        }
        setScenes(allScenes);
      })
      .catch(() => setScenes([]));
  }, [campaignId, loadMaps, loadNpcs, loadCustomTerrain, loadAudio, loadMonsterPortraits, loadPictures]);

  // ── Reload current data ──
  const reloadData = useCallback(() => {
    if (!campaignId) return;
    loadMaps(campaignId);
    loadNpcs(campaignId);
    loadCustomTerrain(campaignId);
    loadAudio(campaignId);
    loadMonsterPortraits(campaignId);
    void loadPictures();
    api
      .get<HeroSummary[]>('/api/heroes')
      .then((data) => setHeroes(data))
      .catch(() => setHeroes([]));
  }, [campaignId, loadMaps, loadNpcs, loadCustomTerrain, loadAudio, loadMonsterPortraits, loadPictures]);

  const handleUpdatePicture = useCallback(async (assetId: string, input: UpdatePictureAssetInput) => {
    const { asset } = await api.patch<{ asset: PictureAsset }>(`/api/assets/${assetId}`, input);
    setPictureAssets((current) => current.map((item) => (item.id === assetId ? asset : item)));
  }, []);

  const handleDeletePicture = useCallback(async (assetId: string) => {
    await api.delete(`/api/assets/${assetId}`);
    setPictureAssets((current) => current.filter((item) => item.id !== assetId));
  }, []);

  // ── NPC create dialog ──
  const [npcDialogOpen, setNpcDialogOpen] = useState(false);
  const [newNpcName, setNewNpcName] = useState('');

  const handleCreateNpc = useCallback(async () => {
    if (!campaignId || !newNpcName.trim()) return;
    await createNpc(campaignId, { name: newNpcName.trim() });
    setNewNpcName('');
    setNpcDialogOpen(false);
  }, [campaignId, newNpcName, createNpc]);

  const handleHeroPortraitSave = useCallback(async (heroId: string, assetId: string) => {
    await api.put(`/api/heroes/${heroId}`, { portraitAssetId: assetId });
    const portraitUrl = `/api/assets/${assetId}/data`;
    setHeroes((current) =>
      current.map((hero) =>
        hero.id === heroId
          ? { ...hero, portraitAssetId: assetId, portraitUrl }
          : hero,
      ),
    );
  }, []);

  const handleHeroPortraitRemove = useCallback(async (heroId: string) => {
    await api.put(`/api/heroes/${heroId}`, { portraitAssetId: null, portraitUrl: null });
    setHeroes((current) =>
      current.map((hero) =>
        hero.id === heroId
          ? { ...hero, portraitAssetId: null, portraitUrl: null }
          : hero,
      ),
    );
  }, []);

  // ── Counts for sidebar ──
  const counts = useMemo(
    () => ({
      heroes: heroes.length,
      npcs: npcs.length,
      pictures: pictureAssets.length,
      maps: maps.length,
      bestiary: monsters.length,
      terrain: ALL_TERRAINS.length + customTerrain.length,
      audio: audioAssets.length,
    }),
    [heroes, npcs, pictureAssets, maps, monsters, customTerrain, audioAssets],
  ) as Record<AssetFolder, number>;

  // ── Selected NPC for detail pane ──
  const selectedNpc = useMemo(
    () => (selectedFolder === 'npcs' ? npcs.find((n) => n.id === selectedItemId) : undefined),
    [selectedFolder, npcs, selectedItemId],
  );

  // ── Selected Map for detail pane ──
  const selectedMap = useMemo(
    () => (selectedFolder === 'maps' ? maps.find((m) => m.id === selectedItemId) : undefined),
    [selectedFolder, maps, selectedItemId],
  );

  // ── Filtered maps ──
  const filteredMaps = useMemo(() => {
    let result = maps;
    const f = mapFilters;
    if (f.sceneType) result = result.filter((m) => m.sceneType === f.sceneType);
    if (f.gridType) result = result.filter((m) => m.gridType === f.gridType);
    if (f.size) result = result.filter((m) => m.size === f.size);
    if (f.terrain && f.terrain.length > 0)
      result = result.filter((m) => f.terrain!.some((t) => m.terrains.includes(t)));
    if (f.biome && f.biome.length > 0)
      result = result.filter((m) => f.biome!.some((b) => m.biomes.includes(b)));
    if (f.search) {
      const q = f.search.toLowerCase();
      result = result.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }
    return result;
  }, [maps, mapFilters]);

  // ── No campaign selected ──
  if (!campaignId) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-zinc-500">
          {campaigns.length === 0 ? 'Create a campaign first.' : 'Select a campaign.'}
        </p>
      </div>
    );
  }

  // ── Content pane ──
  const renderContent = () => {
    // Loading state
    if (loading || (selectedFolder === 'pictures' && picturesLoading)) {
      return <SkeletonGrid />;
    }

    switch (selectedFolder) {
      case 'heroes':
        if (heroes.length === 0) {
          return (
            <EmptyState
              message="No heroes yet. Create your first hero."
              action={
                <Link to="/app/heroes/new">
                  <Button size="sm" variant="secondary">
                    <Plus className="mr-1 size-3.5" /> Create Hero
                  </Button>
                </Link>
              }
            />
          );
        }
        return (
          <HeroGrid
            heroes={heroes}
            onSelect={(id) => setSelectedItemId(id)}
            onPortraitSave={handleHeroPortraitSave}
            onPortraitRemove={handleHeroPortraitRemove}
            selectedId={selectedItemId}
          />
        );

      case 'npcs':
        if (npcs.length === 0) {
          return (
            <EmptyState
              message="No NPCs yet. Create your first NPC."
              action={
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setNpcDialogOpen(true)}
                >
                  <Plus className="mr-1 size-3.5" /> New NPC
                </Button>
              }
            />
          );
        }
        return (
          <NpcGrid
            npcs={npcs}
            onSelect={(id) => setSelectedItemId(id)}
            selectedId={selectedItemId}
          />
        );

      case 'pictures':
        if (picturesError) {
          return (
            <EmptyState
              message={picturesError}
              action={
                <Button size="sm" variant="secondary" onClick={() => void loadPictures()}>
                  <RefreshCw className="mr-1 size-3.5" /> Retry
                </Button>
              }
            />
          );
        }
        return (
          <PictureGrid
            assets={pictureAssets}
            onUpdate={handleUpdatePicture}
            onDelete={handleDeletePicture}
          />
        );

      case 'maps':
        return (
          <>
            <MapFilterBar
              filters={mapFilters}
              onChange={setMapFilters}
              onClear={() =>
                setMapFilters({
                  sceneType: undefined,
                  terrain: undefined,
                  biome: undefined,
                  gridType: undefined,
                  size: undefined,
                  search: undefined,
                })
              }
            />
            {filteredMaps.length === 0 && maps.length === 0 ? (
              <EmptyState
                message="No maps yet. Upload your first map."
                action={
                  <MapUploadDialog
                    onUpload={async (input, file) => {
                      await createMap(campaignId, input, file);
                    }}
                  >
                    <Button size="sm" variant="secondary">
                      <Upload className="mr-1 size-3.5" /> Upload Map
                    </Button>
                  </MapUploadDialog>
                }
              />
            ) : (
              <MapGrid
                maps={filteredMaps}
                onSelect={(id) => setSelectedItemId(id)}
                onUpdate={(mapId, input) => updateMap(campaignId, mapId, input)}
                onDelete={(mapId) => deleteMap(campaignId, mapId)}
                selectedId={selectedItemId}
              />
            )}
          </>
        );

      case 'bestiary':
        return (
          <BestiaryTable
            monsters={monsters}
            onAddToScene={(monsterName, quantity, targetSceneId) =>
              addSceneMonster(targetSceneId, { monsterName, quantity })
            }
            availableScenes={scenes}
            monsterPortraits={monsterPortraits}
            onPortraitSave={campaignId ? (name, assetId) => setMonsterPortrait(campaignId, name, assetId) : undefined}
            onPortraitRemove={campaignId ? (name) => deleteMonsterPortrait(campaignId, name) : undefined}
          />
        );

      case 'terrain':
        return (
          <TerrainGrid
            builtInTerrains={ALL_TERRAINS}
            customTerrains={customTerrain}
            onSelectBuiltIn={(id) => setSelectedItemId(id)}
            onSelectCustom={(id) => setSelectedItemId(id)}
          />
        );

      case 'audio':
        if (audioAssets.length === 0) {
          return (
            <EmptyState
              message="No audio assets yet. Upload your first track."
              action={
                <AudioUploadDialog
                  onUpload={async (input, file) => {
                    await createAudio(campaignId, input, file);
                  }}
                >
                  <Button size="sm" variant="secondary">
                    <Upload className="mr-1 size-3.5" /> Upload Audio
                  </Button>
                </AudioUploadDialog>
              }
            />
          );
        }
        return (
          <AudioGrid
            audioAssets={audioAssets}
            onSelect={(id) => setSelectedItemId(id)}
            onUpdate={(audioId, input) => updateAudio(campaignId, audioId, input)}
            onDelete={(audioId) => deleteAudio(campaignId, audioId)}
            selectedId={selectedItemId}
          />
        );
    }
  };

  // ── Toolbar per folder ──
  const renderToolbar = () => {
    switch (selectedFolder) {
      case 'heroes':
        return (
          <Link to="/app/heroes/new">
            <Button size="sm" variant="secondary">
              <Plus className="mr-1 size-3.5" /> Create Hero
            </Button>
          </Link>
        );
      case 'npcs':
        return (
          <Dialog open={npcDialogOpen} onOpenChange={setNpcDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="secondary">
                <Plus className="mr-1 size-3.5" /> New NPC
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogTitle>Create NPC</DialogTitle>
              <div className="mt-4 space-y-3">
                <Input
                  value={newNpcName}
                  onChange={(e) => setNewNpcName(e.target.value)}
                  placeholder="NPC name"
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateNpc()}
                />
                <div className="flex justify-end gap-2">
                  <DialogClose asChild>
                    <Button variant="ghost">Cancel</Button>
                  </DialogClose>
                  <Button onClick={handleCreateNpc} disabled={!newNpcName.trim()}>
                    Create
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        );
      case 'maps':
        return (
          <MapUploadDialog
            onUpload={async (input, file) => {
              await createMap(campaignId, input, file);
            }}
          >
            <Button size="sm" variant="secondary">
              <Upload className="mr-1 size-3.5" /> Upload Map
            </Button>
          </MapUploadDialog>
        );
      case 'audio':
        return (
          <AudioUploadDialog
            onUpload={async (input, file) => {
              await createAudio(campaignId, input, file);
            }}
          >
            <Button size="sm" variant="secondary">
              <Upload className="mr-1 size-3.5" /> Upload Audio
            </Button>
          </AudioUploadDialog>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-full">
      {/* Tree sidebar */}
      <AssetTreeSidebar
        selectedFolder={selectedFolder}
        onSelect={setSelectedFolder}
        counts={counts}
      />

      {/* Main content area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-zinc-200">Select Campaign</h2>
            {campaigns.length > 1 && (
              <Select value={campaignId} onValueChange={(v: string) => setCampaignId(v)}>
                <SelectTrigger className="h-7 w-[160px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {campaigns.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="text-xs">
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="flex items-center gap-2">
            {loading && <span className="text-xs text-zinc-500">Loading...</span>}
            {renderToolbar()}
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <ErrorBanner
            message={error}
            onRetry={reloadData}
            onDismiss={() => {
              clearError();
              setPicturesError(null);
            }}
          />
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">{renderContent()}</div>
      </div>

      {/* Detail pane — contextual right sidebar */}
      {selectedNpc && (
        <NpcDetailPane
          npc={selectedNpc}
          onUpdate={(npcId, input) => updateNpc(campaignId, npcId, input)}
          onDelete={(npcId) => deleteNpc(campaignId, npcId)}
          onClose={() => setSelectedItemId(null)}
        />
      )}
      {selectedMap && (
        <MapDetailPane
          key={selectedMap.id}
          map={selectedMap}
          onUpdate={(mapId, input) => updateMap(campaignId, mapId, input)}
          onDelete={(mapId) => deleteMap(campaignId, mapId)}
          onClose={() => setSelectedItemId(null)}
        />
      )}
    </div>
  );
}
