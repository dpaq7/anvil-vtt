import { useEffect, useState, useCallback, useMemo } from 'react';
import { Plus, Upload } from 'lucide-react';
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
import { BestiaryTable } from '../components/assets/BestiaryTable.js';
import { TerrainGrid } from '../components/assets/TerrainGrid.js';
import { AudioGrid } from '../components/assets/AudioGrid.js';
import { AudioUploadDialog } from '../components/assets/AudioUploadDialog.js';
import { ALL_TERRAINS } from '@anvil/data';
import type { Hero, AssetFolder } from '@anvil/types';
import type { CompendiumMonster } from '@anvil/data';

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
    addSceneMonster,
    loading,
  } = useAssetsStore();

  // ── Heroes (loaded separately, not stored in assets store) ──
  const [heroes, setHeroes] = useState<Hero[]>([]);

  // ── Monster data (from @anvil/data compendium — read-only) ──
  const [monsters] = useState<CompendiumMonster[]>([]);

  // ── Load data when campaign changes ──
  useEffect(() => {
    if (!campaignId) return;
    loadMaps(campaignId);
    loadNpcs(campaignId);
    loadCustomTerrain(campaignId);
    loadAudio(campaignId);
    // Heroes
    api
      .get<{ heroes: Hero[] }>(`/api/campaigns/${campaignId}/heroes`)
      .then((data) => setHeroes(data.heroes))
      .catch(() => setHeroes([]));
  }, [campaignId, loadMaps, loadNpcs, loadCustomTerrain, loadAudio]);

  // ── NPC create dialog ──
  const [npcDialogOpen, setNpcDialogOpen] = useState(false);
  const [newNpcName, setNewNpcName] = useState('');

  const handleCreateNpc = useCallback(async () => {
    if (!campaignId || !newNpcName.trim()) return;
    await createNpc(campaignId, { name: newNpcName.trim() });
    setNewNpcName('');
    setNpcDialogOpen(false);
  }, [campaignId, newNpcName, createNpc]);

  // ── Counts for sidebar ──
  const counts = useMemo(
    () => ({
      heroes: heroes.length,
      npcs: npcs.length,
      maps: maps.length,
      bestiary: monsters.length,
      terrain: ALL_TERRAINS.length + customTerrain.length,
      audio: audioAssets.length,
    }),
    [heroes, npcs, maps, monsters, customTerrain, audioAssets],
  ) as Record<AssetFolder, number>;

  // ── Selected NPC for detail pane ──
  const selectedNpc = useMemo(
    () => (selectedFolder === 'npcs' ? npcs.find((n) => n.id === selectedItemId) : undefined),
    [selectedFolder, npcs, selectedItemId],
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
    switch (selectedFolder) {
      case 'heroes':
        return (
          <HeroGrid
            heroes={heroes}
            onSelect={(id) => setSelectedItemId(id)}
            selectedId={selectedItemId}
          />
        );
      case 'npcs':
        return (
          <NpcGrid
            npcs={npcs}
            onSelect={(id) => setSelectedItemId(id)}
            selectedId={selectedItemId}
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
            <MapGrid
              maps={filteredMaps}
              onSelect={(id) => setSelectedItemId(id)}
              selectedId={selectedItemId}
            />
          </>
        );
      case 'bestiary':
        return (
          <BestiaryTable
            monsters={monsters}
            onAddToScene={(monsterName, quantity, sceneId) =>
              addSceneMonster(sceneId, { monsterName, quantity })
            }
            availableScenes={[]}
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
        return (
          <AudioGrid
            audioAssets={audioAssets}
            onSelect={(id) => setSelectedItemId(id)}
            selectedId={selectedItemId}
          />
        );
    }
  };

  // ── Toolbar per folder ──
  const renderToolbar = () => {
    switch (selectedFolder) {
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
            <h2 className="text-sm font-semibold capitalize text-zinc-200">{selectedFolder}</h2>
            {campaigns.length > 1 && (
              <Select value={campaignId} onValueChange={(v) => setCampaignId(v)}>
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto">{renderContent()}</div>
      </div>

      {/* Detail pane (NPC only for now) */}
      {selectedNpc && (
        <NpcDetailPane
          npc={selectedNpc}
          onUpdate={(npcId, input) => updateNpc(campaignId, npcId, input)}
          onDelete={(npcId) => deleteNpc(campaignId, npcId)}
          onClose={() => setSelectedItemId(null)}
        />
      )}
    </div>
  );
}
