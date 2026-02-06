import { X } from 'lucide-react';
import { Button, Input, Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@anvil/ui';
import type { MapFilters } from '../../stores/assetsStore.js';
import type { SceneType, GridType, MapSize } from '@anvil/types';

const SCENE_TYPES: SceneType[] = ['battle', 'negotiation', 'montage', 'story', 'respite'];
const GRID_TYPES: GridType[] = ['gridded', 'gridless', 'hex'];
const MAP_SIZES: MapSize[] = ['small', 'medium', 'large'];

export interface MapFilterBarProps {
  filters: MapFilters;
  onChange: (filters: Partial<MapFilters>) => void;
  onClear: () => void;
}

function hasActiveFilters(filters: MapFilters): boolean {
  return !!(
    filters.sceneType ||
    (filters.terrain && filters.terrain.length > 0) ||
    (filters.biome && filters.biome.length > 0) ||
    filters.gridType ||
    filters.size ||
    filters.search
  );
}

export function MapFilterBar({ filters, onChange, onClear }: MapFilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800 px-4 py-2">
      {/* Scene Type */}
      <Select
        value={filters.sceneType ?? ''}
        onValueChange={(v) => onChange({ sceneType: (v || undefined) as SceneType | undefined })}
      >
        <SelectTrigger className="h-8 w-[130px] text-xs">
          <SelectValue placeholder="Scene type" />
        </SelectTrigger>
        <SelectContent>
          {SCENE_TYPES.map((st) => (
            <SelectItem key={st} value={st} className="text-xs">
              {st.charAt(0).toUpperCase() + st.slice(1)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Grid Type */}
      <Select
        value={filters.gridType ?? ''}
        onValueChange={(v) => onChange({ gridType: (v || undefined) as GridType | undefined })}
      >
        <SelectTrigger className="h-8 w-[110px] text-xs">
          <SelectValue placeholder="Grid" />
        </SelectTrigger>
        <SelectContent>
          {GRID_TYPES.map((gt) => (
            <SelectItem key={gt} value={gt} className="text-xs">
              {gt.charAt(0).toUpperCase() + gt.slice(1)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Size */}
      <Select
        value={filters.size ?? ''}
        onValueChange={(v) => onChange({ size: (v || undefined) as MapSize | undefined })}
      >
        <SelectTrigger className="h-8 w-[100px] text-xs">
          <SelectValue placeholder="Size" />
        </SelectTrigger>
        <SelectContent>
          {MAP_SIZES.map((s) => (
            <SelectItem key={s} value={s} className="text-xs">
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Search */}
      <Input
        value={filters.search ?? ''}
        onChange={(e) => onChange({ search: e.target.value || undefined })}
        placeholder="Search maps..."
        className="h-8 w-[180px] text-xs"
      />

      {/* Clear */}
      {hasActiveFilters(filters) && (
        <Button variant="ghost" size="sm" onClick={onClear} className="h-8 px-2">
          <X className="mr-1 size-3" />
          <span className="text-xs">Clear</span>
        </Button>
      )}
    </div>
  );
}
