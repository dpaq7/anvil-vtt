import { Map as MapIcon } from 'lucide-react';
import { Card, Badge } from '@anvil/ui';
import type { MapAsset } from '@anvil/types';

const SCENE_BADGE_VARIANT: Record<string, 'battle' | 'story' | 'montage' | 'negotiation' | 'respite'> = {
  battle: 'battle',
  story: 'story',
  montage: 'montage',
  negotiation: 'negotiation',
  respite: 'respite',
};

export interface MapGridProps {
  maps: MapAsset[];
  onSelect: (mapId: string) => void;
  selectedId?: string | null;
  compact?: boolean;
}

export function MapGrid({ maps, onSelect, selectedId, compact }: MapGridProps) {
  if (maps.length === 0) {
    return <p className="p-8 text-center text-zinc-500">No maps yet.</p>;
  }

  return (
    <div
      className={
        compact
          ? 'grid grid-cols-1 gap-3 p-3 sm:grid-cols-2'
          : 'grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
      }
    >
      {maps.map((map) => (
        <Card
          key={map.id}
          className={`group cursor-pointer overflow-hidden transition hover:border-zinc-600 ${
            selectedId === map.id ? 'ring-2 ring-zinc-400' : ''
          }`}
          onClick={() => onSelect(map.id)}
        >
          {/* Map thumbnail */}
          <div className="relative aspect-video bg-zinc-800">
            {map.imageUrl ? (
              <img
                src={map.imageUrl}
                alt={map.name}
                className="size-full object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center">
                <MapIcon className="size-10 text-zinc-600" />
              </div>
            )}

            {/* Name overlay with gradient scrim */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 pb-2 pt-6">
              <p className="truncate text-sm font-semibold text-white">{map.name}</p>
            </div>

            {/* Scene type badge (top-right) */}
            {map.sceneType && (
              <div className="absolute right-2 top-2">
                <Badge variant={SCENE_BADGE_VARIANT[map.sceneType] ?? 'secondary'} className="text-[10px] px-1.5 py-0">
                  {map.sceneType}
                </Badge>
              </div>
            )}
          </div>

          {/* Metadata chips */}
          {!compact && (map.terrains.length > 0 || map.biomes.length > 0 || map.tags.length > 0) && (
            <div className="flex flex-wrap gap-1 px-3 py-2">
              {map.terrains.map((t) => (
                <Badge key={t} variant="secondary" className="text-[9px] px-1 py-0">
                  {t}
                </Badge>
              ))}
              {map.biomes.map((b) => (
                <Badge key={b} variant="secondary" className="text-[9px] px-1 py-0">
                  {b}
                </Badge>
              ))}
              {map.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-[9px] px-1 py-0">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Grid type + size info line */}
          {!compact && (
            <div className="flex items-center gap-2 px-3 pb-2 text-[10px] text-zinc-500">
              <span>{map.gridType}</span>
              <span>&middot;</span>
              <span>{map.size}</span>
              {map.width && map.height && (
                <>
                  <span>&middot;</span>
                  <span>{map.width}&times;{map.height}</span>
                </>
              )}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
