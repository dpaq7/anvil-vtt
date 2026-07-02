import { useEffect, useMemo } from "react";
import { Badge, Button, cn } from "@anvil/ui";
import { Check, ImageIcon, X } from "lucide-react";
import type { MapAsset } from "@anvil/types";
import { useAssetsStore } from "../../stores/assetsStore.js";
import {
  BUILT_IN_SCENE_BACKGROUNDS,
  type BackgroundSceneType,
} from "../../lib/scene-backgrounds.js";

interface SceneBackgroundSelection {
  url: string;
  mapAssetId?: string | null;
  name: string;
}

interface SceneBackgroundPickerProps {
  campaignId: string;
  sceneType: BackgroundSceneType;
  selectedUrl: string | null;
  selectedMapAssetId: string | null;
  onSelect: (selection: SceneBackgroundSelection) => void;
  onClear: () => void;
}

function hasSceneBackgroundTag(
  map: MapAsset,
  sceneType: BackgroundSceneType,
): boolean {
  const tags = map.tags.map((tag) => tag.toLowerCase());
  return map.sceneType === sceneType || tags.includes(sceneType);
}

export function SceneBackgroundPicker({
  campaignId,
  sceneType,
  selectedUrl,
  selectedMapAssetId,
  onSelect,
  onClear,
}: SceneBackgroundPickerProps) {
  const maps = useAssetsStore((state) => state.maps);
  const loading = useAssetsStore((state) => state.loading);
  const loadMaps = useAssetsStore((state) => state.loadMaps);

  useEffect(() => {
    if (campaignId) void loadMaps(campaignId);
  }, [campaignId, loadMaps]);

  const builtInBackgrounds = useMemo(
    () =>
      BUILT_IN_SCENE_BACKGROUNDS.filter(
        (background) => background.sceneType === sceneType,
      ),
    [sceneType],
  );

  const libraryBackgrounds = useMemo(
    () =>
      maps.filter(
        (map) => map.imageUrl && hasSceneBackgroundTag(map, sceneType),
      ),
    [maps, sceneType],
  );

  const hasSelection = Boolean(selectedUrl);

  return (
    <div className="flex flex-col gap-4">
      {hasSelection ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onClear}
          className="w-full justify-center gap-2"
        >
          <X className="size-3.5" />
          Clear Background
        </Button>
      ) : null}

      {builtInBackgrounds.length > 0 ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Anvil
            </span>
            <Badge variant="outline" className="px-1.5 py-0 text-[9px]">
              Default
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {builtInBackgrounds.map((background) => {
              const selected = selectedUrl === background.url;
              return (
                <button
                  key={background.id}
                  type="button"
                  onClick={() =>
                    onSelect({
                      url: background.url,
                      mapAssetId: null,
                      name: background.name,
                    })
                  }
                  className={cn(
                    "group overflow-hidden rounded-md border bg-zinc-950 text-left transition hover:border-zinc-500",
                    selected
                      ? "border-zinc-200 ring-1 ring-zinc-200"
                      : "border-zinc-800",
                  )}
                >
                  <span className="relative block aspect-video bg-zinc-800">
                    <img
                      src={background.url}
                      alt={background.name}
                      className="size-full object-cover"
                    />
                    {selected ? (
                      <span className="absolute right-1.5 top-1.5 rounded-full bg-zinc-100 p-1 text-zinc-950">
                        <Check className="size-3" />
                      </span>
                    ) : null}
                  </span>
                  <span className="block truncate px-2 py-1.5 text-xs font-medium text-zinc-300">
                    {background.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Library
          </span>
          {loading ? (
            <span className="text-[10px] text-zinc-600">Loading</span>
          ) : null}
        </div>

        {libraryBackgrounds.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {libraryBackgrounds.map((map) => {
              const imageUrl = map.imageUrl!;
              const selected = selectedMapAssetId
                ? selectedMapAssetId === map.id
                : selectedUrl === imageUrl;
              return (
                <button
                  key={map.id}
                  type="button"
                  onClick={() =>
                    onSelect({
                      url: imageUrl,
                      mapAssetId: map.id,
                      name: map.name,
                    })
                  }
                  className={cn(
                    "group overflow-hidden rounded-md border bg-zinc-950 text-left transition hover:border-zinc-500",
                    selected
                      ? "border-zinc-200 ring-1 ring-zinc-200"
                      : "border-zinc-800",
                  )}
                >
                  <span className="relative block aspect-video bg-zinc-800">
                    <img
                      src={imageUrl}
                      alt={map.name}
                      className="size-full object-cover"
                    />
                    {selected ? (
                      <span className="absolute right-1.5 top-1.5 rounded-full bg-zinc-100 p-1 text-zinc-950">
                        <Check className="size-3" />
                      </span>
                    ) : null}
                  </span>
                  <span className="block truncate px-2 py-1.5 text-xs font-medium text-zinc-300">
                    {map.name}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex min-h-28 flex-col items-center justify-center gap-2 rounded-md border border-dashed border-zinc-800 bg-zinc-950/60 px-3 text-center">
            <ImageIcon className="size-5 text-zinc-700" />
            <p className="text-xs text-zinc-500">No tagged images.</p>
          </div>
        )}
      </div>
    </div>
  );
}
