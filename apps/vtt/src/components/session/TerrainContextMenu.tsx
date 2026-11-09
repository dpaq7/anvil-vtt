import { useEffect, useRef } from 'react';
import { Eye, EyeOff, Trash2, X } from 'lucide-react';
import { Button } from '@anvil/ui';
import { useSessionConnection } from './shell/connection-context.js';
import type { TerrainZoneData } from '../../canvas/layers/TerrainLayer.js';

interface TerrainContextMenuProps {
  terrain: TerrainZoneData;
  x: number;
  y: number;
  stageWidth?: number;
  stageHeight?: number;
  onToggleHidden: (terrain: TerrainZoneData) => void;
  onDelete: (terrainId: string) => void;
  onClose: () => void;
}

export function TerrainContextMenu({
  terrain,
  x,
  y,
  stageWidth = window.innerWidth,
  stageHeight = window.innerHeight,
  onToggleHidden,
  onDelete,
  onClose,
}: TerrainContextMenuProps) {
  const { paused } = useSessionConnection();
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

  // x and y are relative to the stage, which clips what overflows it.
  const menuWidth = stageWidth < 720 ? 148 : 178;
  const menuHeight = 150;
  const clampedX = Math.min(Math.max(8, x), Math.max(8, stageWidth - menuWidth - 12));
  const clampedY = Math.min(Math.max(8, y), Math.max(8, stageHeight - menuHeight - 12));
  const HiddenIcon = terrain.hidden ? Eye : EyeOff;

  return (
    <div
      ref={menuRef}
      className="sb-pop absolute z-40 w-[var(--pop)]"
      data-map-panel
      style={{ left: clampedX, top: clampedY }}
      onContextMenu={(event) => event.stopPropagation()}
    >
      <div className="flex items-start gap-1">
        <strong className="min-w-0 flex-1">{terrain.name}</strong>
        <Button variant="ghost" size="icon" className="size-6 shrink-0" aria-label="Close menu" onClick={onClose}>
          <X className="size-3.5" />
        </Button>
      </div>
      <p className="sb-note">{terrain.w} x {terrain.h} tiles</p>
      <button
        type="button"
        className="sb-pop__row"
        disabled={paused}
        onClick={() => {
          onToggleHidden(terrain);
          onClose();
        }}
      >
        <span className="flex items-center gap-1.5">
          <HiddenIcon className="size-3.5" aria-hidden="true" />
          {paused ? 'Wait, when back' : terrain.hidden ? 'Show to players' : 'Hide from players'}
        </span>
      </button>
      <button
        type="button"
        className="sb-pop__row"
        disabled={paused}
        onClick={() => {
          onDelete(terrain.id);
          onClose();
        }}
      >
        <span className="flex items-center gap-1.5">
          <Trash2 className="size-3.5" aria-hidden="true" />
          Delete tile
        </span>
      </button>
    </div>
  );
}
