import { useState, useCallback } from "react";
import { X, Trash2, Map as MapIcon } from "lucide-react";
import {
  Button,
  Input,
  Badge,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@anvil/ui";
import type { MapAsset, UpdateMapInput } from "@anvil/types";
import {
  BACKGROUND_SCENE_TYPES,
  type BackgroundSceneType,
} from "../../lib/scene-backgrounds.js";

// ── Option lists for dropdowns ──

const SCENE_TYPES = [
  "battle",
  "story",
  "montage",
  "negotiation",
  "respite",
] as const;
const GRID_TYPES = ["gridded", "gridless", "hex"] as const;
const MAP_SIZES = ["small", "medium", "large"] as const;

const TERRAIN_TAGS = [
  "forest",
  "cave",
  "urban",
  "dungeon",
  "castle",
  "ship",
  "wilderness",
  "underwater",
  "planar",
] as const;

const BIOMES = [
  "arctic",
  "desert",
  "coastal",
  "mountain",
  "swamp",
  "volcanic",
  "grassland",
  "underground",
] as const;

const SCENE_BADGE_VARIANT: Record<
  string,
  "battle" | "story" | "montage" | "negotiation" | "respite"
> = {
  battle: "battle",
  story: "story",
  montage: "montage",
  negotiation: "negotiation",
  respite: "respite",
};

// ── Component ──

export interface MapDetailPaneProps {
  map: MapAsset;
  onUpdate: (mapId: string, input: UpdateMapInput) => Promise<void>;
  onDelete: (mapId: string) => Promise<void>;
  onClose: () => void;
}

export function MapDetailPane({
  map,
  onUpdate,
  onDelete,
  onClose,
}: MapDetailPaneProps) {
  const [name, setName] = useState(map.name);
  const [sceneType, setSceneType] = useState<string>(map.sceneType ?? "");
  const [gridType, setGridType] = useState<string>(map.gridType);
  const [size, setSize] = useState<string>(map.size);
  const [terrains, setTerrains] = useState<string[]>(map.terrains);
  const [biomes, setBiomes] = useState<string[]>(map.biomes);
  const [tags, setTags] = useState<string[]>(map.tags);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Track dirty state
  const isDirty =
    name !== map.name ||
    sceneType !== (map.sceneType ?? "") ||
    gridType !== map.gridType ||
    size !== map.size ||
    JSON.stringify(terrains) !== JSON.stringify(map.terrains) ||
    JSON.stringify(biomes) !== JSON.stringify(map.biomes) ||
    JSON.stringify(tags) !== JSON.stringify(map.tags);

  const handleSave = useCallback(async () => {
    if (!isDirty) return;
    setSaving(true);
    try {
      await onUpdate(map.id, {
        name: name !== map.name ? name : undefined,
        sceneType:
          sceneType !== (map.sceneType ?? "")
            ? ((sceneType || null) as MapAsset["sceneType"])
            : undefined,
        gridType:
          gridType !== map.gridType
            ? (gridType as MapAsset["gridType"])
            : undefined,
        size: size !== map.size ? (size as MapAsset["size"]) : undefined,
        terrains:
          JSON.stringify(terrains) !== JSON.stringify(map.terrains)
            ? (terrains as MapAsset["terrains"])
            : undefined,
        biomes:
          JSON.stringify(biomes) !== JSON.stringify(map.biomes)
            ? (biomes as MapAsset["biomes"])
            : undefined,
        tags:
          JSON.stringify(tags) !== JSON.stringify(map.tags) ? tags : undefined,
      });
    } finally {
      setSaving(false);
    }
  }, [
    isDirty,
    name,
    sceneType,
    gridType,
    size,
    terrains,
    biomes,
    tags,
    map,
    onUpdate,
  ]);

  const handleDelete = useCallback(async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    await onDelete(map.id);
    onClose();
  }, [confirmDelete, map.id, onDelete, onClose]);

  const toggleTerrain = (tag: string) => {
    setTerrains((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const toggleBiome = (b: string) => {
    setBiomes((prev) =>
      prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b],
    );
  };

  const toggleBackgroundTag = (tag: BackgroundSceneType) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag],
    );
  };

  const otherTags = tags.filter(
    (tag) => !BACKGROUND_SCENE_TYPES.includes(tag as BackgroundSceneType),
  );

  return (
    <div className="flex h-full w-80 flex-col border-l border-zinc-800 bg-zinc-950">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <h3 className="text-sm font-semibold text-zinc-200">Map Details</h3>
        <button
          onClick={onClose}
          className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {/* Thumbnail — full image, not cropped */}
        <div className="overflow-hidden rounded-lg border border-zinc-700 bg-zinc-900">
          {map.imageUrl ? (
            <img
              src={map.imageUrl}
              alt={map.name}
              className="w-full object-contain"
            />
          ) : (
            <div className="flex aspect-video items-center justify-center">
              <MapIcon className="size-12 text-zinc-600" />
            </div>
          )}
        </div>

        {/* Name */}
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-400">
            Name
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleSave}
            placeholder="Map name"
          />
        </div>

        {/* Scene Type */}
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-400">
            Scene Type
          </label>
          <Select
            value={sceneType}
            onValueChange={(v: string) => {
              setSceneType(v === "__none__" ? "" : v);
            }}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select scene type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__" className="text-xs text-zinc-500">
                None
              </SelectItem>
              {SCENE_TYPES.map((st) => (
                <SelectItem key={st} value={st} className="text-xs capitalize">
                  {st}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Grid Type */}
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-400">
            Grid Type
          </label>
          <Select
            value={gridType}
            onValueChange={(v: string) => setGridType(v)}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GRID_TYPES.map((gt) => (
                <SelectItem key={gt} value={gt} className="text-xs capitalize">
                  {gt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Size */}
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-400">
            Size
          </label>
          <Select value={size} onValueChange={(v: string) => setSize(v)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MAP_SIZES.map((s) => (
                <SelectItem key={s} value={s} className="text-xs capitalize">
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Terrain Tags — toggle chips */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-400">
            Terrain
          </label>
          <div className="flex flex-wrap gap-1.5">
            {TERRAIN_TAGS.map((tag) => {
              const active = terrains.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTerrain(tag)}
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize transition-colors ${
                    active
                      ? "border-anvil-accent/50 bg-anvil-accent/15 text-anvil-accent"
                      : "border-zinc-700 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* Biomes — toggle chips */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-400">
            Biome
          </label>
          <div className="flex flex-wrap gap-1.5">
            {BIOMES.map((b) => {
              const active = biomes.includes(b);
              return (
                <button
                  key={b}
                  type="button"
                  onClick={() => toggleBiome(b)}
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize transition-colors ${
                    active
                      ? "border-anvil-accent/50 bg-anvil-accent/15 text-anvil-accent"
                      : "border-zinc-700 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
                  }`}
                >
                  {b}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-400">
            Background Tags
          </label>
          <div className="flex flex-wrap gap-1.5">
            {BACKGROUND_SCENE_TYPES.map((tag) => {
              const active = tags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleBackgroundTag(tag)}
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize transition-colors ${
                    active
                      ? "border-anvil-accent/50 bg-anvil-accent/15 text-anvil-accent"
                      : "border-zinc-700 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {otherTags.length > 0 && (
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">
              Other Tags
            </label>
            <div className="flex flex-wrap gap-1">
              {otherTags.map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="text-[9px] px-1.5 py-0"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Scene type badge preview */}
        {sceneType && (
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">
              Preview
            </label>
            <Badge
              variant={SCENE_BADGE_VARIANT[sceneType] ?? "secondary"}
              className="capitalize"
            >
              {sceneType}
            </Badge>
          </div>
        )}

        {/* Metadata */}
        <div className="space-y-1 text-[10px] text-zinc-600">
          {map.width && map.height && (
            <p>
              Dimensions: {map.width}&times;{map.height} squares
            </p>
          )}
          <p>Created: {new Date(map.createdAt).toLocaleDateString()}</p>
          <p>Updated: {new Date(map.updatedAt).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Footer actions */}
      <div className="flex items-center gap-2 border-t border-zinc-800 px-4 py-3">
        <Button
          onClick={handleSave}
          disabled={!isDirty || saving}
          className="flex-1"
        >
          {saving ? "Saving..." : "Save"}
        </Button>
        <Button
          variant="destructive"
          onClick={handleDelete}
          className="shrink-0"
        >
          {confirmDelete ? "Confirm?" : <Trash2 className="size-4" />}
        </Button>
      </div>
    </div>
  );
}
