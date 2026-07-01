import { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@anvil/ui';
import type { MapAsset, MapBiome, MapTerrainTag, SceneType, UpdateMapInput } from '@anvil/types';

const SCENE_TYPES: SceneType[] = ['battle', 'negotiation', 'montage', 'story', 'respite'];
const GRID_TYPES: MapAsset['gridType'][] = ['gridded', 'gridless', 'hex'];
const MAP_SIZES: MapAsset['size'][] = ['small', 'medium', 'large'];
const TERRAIN_TAGS: MapTerrainTag[] = [
  'forest',
  'cave',
  'urban',
  'dungeon',
  'castle',
  'ship',
  'wilderness',
  'underwater',
  'planar',
];
const BIOMES: MapBiome[] = [
  'arctic',
  'desert',
  'coastal',
  'mountain',
  'swamp',
  'volcanic',
  'grassland',
  'underground',
];

interface MapDetailsDialogProps {
  map: MapAsset | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (mapId: string, input: UpdateMapInput) => Promise<void>;
}

function sameValues(left: string[], right: string[]) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function parseTags(value: string) {
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function MapDetailsDialog({ map, open, onOpenChange, onSave }: MapDetailsDialogProps) {
  const [name, setName] = useState('');
  const [sceneType, setSceneType] = useState<SceneType | ''>('');
  const [gridType, setGridType] = useState<MapAsset['gridType']>('gridded');
  const [size, setSize] = useState<MapAsset['size']>('medium');
  const [terrains, setTerrains] = useState<MapTerrainTag[]>([]);
  const [biomes, setBiomes] = useState<MapBiome[]>([]);
  const [tagsInput, setTagsInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!map || !open) return;
    setName(map.name);
    setSceneType(map.sceneType ?? '');
    setGridType(map.gridType);
    setSize(map.size);
    setTerrains(map.terrains);
    setBiomes(map.biomes);
    setTagsInput(map.tags.join(', '));
    setSaving(false);
    setError(null);
  }, [map, open]);

  const tags = useMemo(() => parseTags(tagsInput), [tagsInput]);
  const isDirty = Boolean(
    map &&
      (name.trim() !== map.name ||
        sceneType !== (map.sceneType ?? '') ||
        gridType !== map.gridType ||
        size !== map.size ||
        !sameValues(terrains, map.terrains) ||
        !sameValues(biomes, map.biomes) ||
        !sameValues(tags, map.tags)),
  );

  const toggleTerrain = (tag: MapTerrainTag) => {
    setTerrains((current) => (current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]));
  };

  const toggleBiome = (biome: MapBiome) => {
    setBiomes((current) => (current.includes(biome) ? current.filter((item) => item !== biome) : [...current, biome]));
  };

  const handleSave = async () => {
    if (!map || !isDirty || !name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await onSave(map.id, {
        name: name.trim() !== map.name ? name.trim() : undefined,
        sceneType: sceneType !== (map.sceneType ?? '') ? sceneType || null : undefined,
        gridType: gridType !== map.gridType ? gridType : undefined,
        size: size !== map.size ? size : undefined,
        terrains: !sameValues(terrains, map.terrains) ? terrains : undefined,
        biomes: !sameValues(biomes, map.biomes) ? biomes : undefined,
        tags: !sameValues(tags, map.tags) ? tags : undefined,
      });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Map update failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogTitle className="text-sm">Edit Map Details</DialogTitle>
        <div className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-400">Name</label>
            <Input value={name} onChange={(event) => setName(event.currentTarget.value)} disabled={saving} />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-400">Scene Type</label>
              <Select
                value={sceneType || '__none__'}
                onValueChange={(value) => setSceneType(value === '__none__' ? '' : (value as SceneType))}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__" className="text-xs text-zinc-500">
                    None
                  </SelectItem>
                  {SCENE_TYPES.map((type) => (
                    <SelectItem key={type} value={type} className="text-xs capitalize">
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-400">Grid</label>
              <Select value={gridType} onValueChange={(value) => setGridType(value as MapAsset['gridType'])}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GRID_TYPES.map((type) => (
                    <SelectItem key={type} value={type} className="text-xs capitalize">
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-400">Size</label>
              <Select value={size} onValueChange={(value) => setSize(value as MapAsset['size'])}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MAP_SIZES.map((mapSize) => (
                    <SelectItem key={mapSize} value={mapSize} className="text-xs capitalize">
                      {mapSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">Terrain</label>
            <div className="flex flex-wrap gap-1">
              {TERRAIN_TAGS.map((tag) => (
                <button key={tag} type="button" onClick={() => toggleTerrain(tag)} disabled={saving}>
                  <Badge
                    variant={terrains.includes(tag) ? 'secondary' : 'outline'}
                    className="cursor-pointer px-1.5 py-0.5 text-[10px] capitalize"
                  >
                    {tag}
                  </Badge>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">Biome</label>
            <div className="flex flex-wrap gap-1">
              {BIOMES.map((biome) => (
                <button key={biome} type="button" onClick={() => toggleBiome(biome)} disabled={saving}>
                  <Badge
                    variant={biomes.includes(biome) ? 'secondary' : 'outline'}
                    className="cursor-pointer px-1.5 py-0.5 text-[10px] capitalize"
                  >
                    {biome}
                  </Badge>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-400">Tags</label>
            <Input
              value={tagsInput}
              onChange={(event) => setTagsInput(event.currentTarget.value)}
              placeholder="fortress, rain, puzzle..."
              disabled={saving}
            />
          </div>

          {error && (
            <p className="rounded-md border border-red-900/60 bg-red-950/20 px-3 py-2 text-xs text-red-300">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <DialogClose asChild>
              <Button type="button" variant="ghost" disabled={saving}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="button" onClick={handleSave} disabled={!isDirty || !name.trim() || saving}>
              {saving ? 'Saving...' : 'Save Details'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
