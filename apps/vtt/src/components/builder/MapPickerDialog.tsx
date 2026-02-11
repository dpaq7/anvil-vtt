import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogClose,
  Button,
} from '@anvil/ui';
import { X } from 'lucide-react';
import type { MapAsset, SceneType } from '@anvil/types';
import { useAssetsStore } from '../../stores/assetsStore.js';
import type { MapFilters } from '../../stores/assetsStore.js';
import { MapFilterBar } from '../assets/MapFilterBar.js';
import { MapGrid } from '../assets/MapGrid.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MapPickerDialogProps {
  campaignId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (map: MapAsset) => void;
  /** Pre-set the sceneType filter when dialog opens */
  defaultSceneTypeFilter?: SceneType;
  /** Currently selected map ID — shows selection ring */
  selectedMapId?: string | null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MapPickerDialog({
  campaignId,
  open,
  onOpenChange,
  onSelect,
  defaultSceneTypeFilter,
  selectedMapId,
}: MapPickerDialogProps) {
  // Local filter state — independent of the global assetsStore filters
  const [localFilters, setLocalFilters] = useState<MapFilters>(() => ({
    sceneType: defaultSceneTypeFilter,
  }));

  const maps = useAssetsStore((s) => s.maps);
  const loading = useAssetsStore((s) => s.loading);
  const loadMaps = useAssetsStore((s) => s.loadMaps);

  // Reset filters when dialog opens
  useEffect(() => {
    if (open) {
      setLocalFilters({ sceneType: defaultSceneTypeFilter });
    }
  }, [open, defaultSceneTypeFilter]);

  // Load maps if not yet cached
  useEffect(() => {
    if (open && maps.length === 0) {
      void loadMaps(campaignId);
    }
  }, [open, maps.length, loadMaps, campaignId]);

  // Apply local filters
  const filteredMaps = useMemo(() => {
    let result = maps;
    if (localFilters.sceneType) {
      result = result.filter((m) => m.sceneType === localFilters.sceneType);
    }
    if (localFilters.gridType) {
      result = result.filter((m) => m.gridType === localFilters.gridType);
    }
    if (localFilters.size) {
      result = result.filter((m) => m.size === localFilters.size);
    }
    if (localFilters.terrain && localFilters.terrain.length > 0) {
      result = result.filter((m) =>
        localFilters.terrain!.some((t) => m.terrains.includes(t)),
      );
    }
    if (localFilters.biome && localFilters.biome.length > 0) {
      result = result.filter((m) =>
        localFilters.biome!.some((b) => m.biomes.includes(b)),
      );
    }
    if (localFilters.search) {
      const q = localFilters.search.toLowerCase();
      result = result.filter((m) => m.name.toLowerCase().includes(q));
    }
    return result;
  }, [maps, localFilters]);

  const handleFilterChange = useCallback((partial: Partial<MapFilters>) => {
    setLocalFilters((prev) => ({ ...prev, ...partial }));
  }, []);

  const handleFilterClear = useCallback(() => {
    setLocalFilters({ sceneType: defaultSceneTypeFilter });
  }, [defaultSceneTypeFilter]);

  const handleMapClick = useCallback(
    (mapId: string) => {
      const map = maps.find((m) => m.id === mapId);
      if (map) {
        onSelect(map);
        onOpenChange(false);
      }
    },
    [maps, onSelect, onOpenChange],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogOverlay />
      <DialogContent aria-describedby={undefined} className="flex max-h-[80vh] w-full max-w-4xl flex-col gap-0 overflow-hidden p-0">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
          <DialogTitle className="text-sm font-semibold text-zinc-200">
            Select Map
          </DialogTitle>
          <DialogClose asChild>
            <button className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200">
              <X className="size-4" />
            </button>
          </DialogClose>
        </div>

        {/* Filter bar */}
        <MapFilterBar
          filters={localFilters}
          onChange={handleFilterChange}
          onClear={handleFilterClear}
        />

        {/* Map grid (scrollable) */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <span className="text-sm text-zinc-500">Loading maps...</span>
            </div>
          ) : (
            <MapGrid
              maps={filteredMaps}
              onSelect={handleMapClick}
              selectedId={selectedMapId}
              compact
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-zinc-800 px-4 py-2">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
