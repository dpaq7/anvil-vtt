import { useEffect, useRef } from 'react';
import { Eye, EyeOff, Trash2, X } from 'lucide-react';
import { Button } from '@anvil/ui';
import type { TerrainZoneData } from '../../canvas/layers/TerrainLayer.js';

interface TerrainContextMenuProps {
  terrain: TerrainZoneData;
  x: number;
  y: number;
  onToggleHidden: (terrain: TerrainZoneData) => void;
  onDelete: (terrainId: string) => void;
  onClose: () => void;
}

export function TerrainContextMenu({
  terrain,
  x,
  y,
  onToggleHidden,
  onDelete,
  onClose,
}: TerrainContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    const timer = window.setTimeout(() => {
      document.addEventListener('pointerdown', handlePointerDown);
    }, 50);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [onClose]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const menuWidth = 220;
  const menuHeight = 150;
  const clampedX = Math.min(Math.max(8, x), window.innerWidth - menuWidth - 8);
  const clampedY = Math.min(Math.max(8, y), window.innerHeight - menuHeight - 8);
  const HiddenIcon = terrain.hidden ? Eye : EyeOff;

  return (
    <div
      ref={menuRef}
      className="absolute z-40 w-[220px] overflow-hidden rounded-lg border border-zinc-700/60 bg-zinc-900/95 shadow-2xl backdrop-blur-sm"
      style={{ left: clampedX, top: clampedY }}
      onContextMenu={(event) => event.stopPropagation()}
    >
      <div className="flex items-center gap-2 border-b border-zinc-800 px-3 py-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-zinc-100">{terrain.name}</p>
          <p className="text-[10px] text-zinc-500">
            {terrain.w} x {terrain.h} tiles
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-6 shrink-0 text-zinc-500 hover:text-zinc-300"
          onClick={onClose}
        >
          <X className="size-3.5" />
        </Button>
      </div>

      <div className="p-2">
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded px-2 py-2 text-left text-sm text-zinc-300 transition hover:bg-zinc-800 hover:text-zinc-100"
          onClick={() => {
            onToggleHidden(terrain);
            onClose();
          }}
        >
          <HiddenIcon className="size-4 text-zinc-500" />
          {terrain.hidden ? 'Show to players' : 'Hide from players'}
        </button>
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded px-2 py-2 text-left text-sm text-red-300 transition hover:bg-red-950/40 hover:text-red-200"
          onClick={() => {
            onDelete(terrain.id);
            onClose();
          }}
        >
          <Trash2 className="size-4" />
          Delete tile
        </button>
      </div>
    </div>
  );
}
