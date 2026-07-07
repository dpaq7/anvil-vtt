import type { ReactNode } from 'react';
import { Button } from '@anvil/ui';

export type BattleTool =
  | 'select'
  | 'draw'
  | 'fog'
  | 'terrain'
  | 'eraser'
  | 'measure'
  | 'pan';
export type FogBrushMode = 'draw' | 'reveal';

export interface BattleToolbarProps {
  activeTool: BattleTool;
  onToolChange: (tool: BattleTool) => void;
  drawColor: string;
  onDrawColorChange: (color: string) => void;
  drawWidth: number;
  onDrawWidthChange: (width: number) => void;
  gridVisible: boolean;
  onToggleGrid: () => void;
  fogZoneCount?: number;
  fogBrushMode?: FogBrushMode;
  onFogBrushModeChange?: (mode: FogBrushMode) => void;
  fogBrushSize?: number;
  onFogBrushSizeChange?: (size: number) => void;
  onClearFog?: () => void;
  viewportControls?: ReactNode;
  orientation?: 'horizontal' | 'vertical';
}

const TOOLS: { id: BattleTool; label: string; shortcut: string }[] = [
  { id: 'pan', label: 'Pan', shortcut: 'H' },
  { id: 'select', label: 'Select', shortcut: 'V' },
  { id: 'draw', label: 'Draw', shortcut: 'D' },
  { id: 'fog', label: 'Fog', shortcut: 'F' },
  { id: 'terrain', label: 'Terrain', shortcut: 'T' },
  { id: 'eraser', label: 'Eraser', shortcut: 'E' },
  { id: 'measure', label: 'Measure', shortcut: 'M' },
];

const PRESET_COLORS = [
  'none',
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#3b82f6',
  '#8b5cf6',
  '#ffffff',
];

export function BattleToolbar({
  activeTool,
  onToolChange,
  drawColor,
  onDrawColorChange,
  drawWidth,
  onDrawWidthChange,
  gridVisible,
  onToggleGrid,
  fogZoneCount = 0,
  fogBrushMode = 'draw',
  onFogBrushModeChange,
  fogBrushSize = 1,
  onFogBrushSizeChange,
  onClearFog,
  viewportControls,
  orientation = 'horizontal',
}: BattleToolbarProps) {
  const isVertical = orientation === 'vertical';
  const toolButtonClass = isVertical ? 'w-full justify-start px-2' : 'px-2';
  const dividerClass = isVertical
    ? 'my-1 h-px w-full bg-zinc-700'
    : 'mx-1 w-px bg-zinc-700';

  return (
    <div
      className={`absolute left-4 top-3 z-30 flex gap-2 ${
        isVertical ? 'items-start' : 'flex-col'
      }`}
    >
      {/* Primary tools */}
      <div
        className={`flex gap-1 rounded-lg bg-zinc-900/90 p-1.5 shadow-lg backdrop-blur-sm ${
          isVertical ? 'flex-col items-stretch' : ''
        }`}
      >
        {TOOLS.map((tool) => (
          <Button
            key={tool.id}
            variant={activeTool === tool.id ? 'secondary' : 'ghost'}
            size="sm"
            className={toolButtonClass}
            title={`${tool.label} (${tool.shortcut})`}
            onClick={() => onToolChange(tool.id)}
          >
            <span className="text-xs">{tool.label}</span>
          </Button>
        ))}
        <div className={dividerClass} />
        <Button
          variant={gridVisible ? 'secondary' : 'ghost'}
          size="sm"
          className={toolButtonClass}
          title="Toggle Grid (G)"
          onClick={onToggleGrid}
        >
          <span className="text-xs">Grid</span>
        </Button>
        {viewportControls ? (
          <>
            <div className={dividerClass} />
            {viewportControls}
          </>
        ) : null}
      </div>

      {/* Draw config — shown when draw or eraser tool is active */}
      {(activeTool === 'draw' || activeTool === 'eraser') && (
        <div className="flex items-center gap-2 rounded-lg bg-zinc-900/90 p-2 shadow-lg backdrop-blur-sm">
          {activeTool === 'draw' && (
            <>
              <div className="flex gap-1">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`relative h-5 w-5 rounded-full border-2 transition-transform ${
                      drawColor === color
                        ? 'scale-125 border-white'
                        : 'border-zinc-600 hover:border-zinc-400'
                    }`}
                    style={
                      color === 'none'
                        ? { backgroundColor: '#27272a' }
                        : { backgroundColor: color }
                    }
                    title={color === 'none' ? 'No stroke' : color}
                    onClick={() => onDrawColorChange(color)}
                  >
                    {color === 'none' && (
                      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-zinc-500">
                        /
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <div className="mx-1 w-px self-stretch bg-zinc-700" />
            </>
          )}
          <label className="flex items-center gap-1.5">
            <span className="text-xs text-zinc-400">Size</span>
            <input
              type="range"
              min={1}
              max={10}
              value={drawWidth}
              onChange={(e) => onDrawWidthChange(Number(e.target.value))}
              className="h-1 w-16 accent-zinc-400"
            />
            <span className="w-4 text-center text-xs text-zinc-400">
              {drawWidth}
            </span>
          </label>
        </div>
      )}

      {activeTool === 'fog' && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg bg-zinc-900/90 p-2 shadow-lg backdrop-blur-sm">
          <div className="flex overflow-hidden rounded-md border border-zinc-700">
            <button
              type="button"
              className={`px-2 py-1 text-xs transition ${fogBrushMode === 'draw' ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'}`}
              onClick={() => onFogBrushModeChange?.('draw')}
            >
              Draw
            </button>
            <button
              type="button"
              className={`px-2 py-1 text-xs transition ${fogBrushMode === 'reveal' ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'}`}
              onClick={() => onFogBrushModeChange?.('reveal')}
            >
              Reveal
            </button>
          </div>
          {fogBrushMode === 'draw' ? (
            <label className="flex items-center gap-1.5">
              <span className="text-xs text-zinc-400">Brush</span>
              <input
                type="range"
                min={1}
                max={10}
                value={fogBrushSize}
                onChange={(e) => onFogBrushSizeChange?.(Number(e.target.value))}
                className="h-1 w-16 accent-zinc-400"
              />
              <span className="w-4 text-center text-xs text-zinc-400">
                {fogBrushSize}
              </span>
            </label>
          ) : (
            <span className="rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-400">
              1 square
            </span>
          )}
          <span className="rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-400">
            {fogZoneCount} zone{fogZoneCount !== 1 ? 's' : ''}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={fogZoneCount === 0}
            onClick={onClearFog}
            className="h-7 px-2 text-xs text-red-400"
          >
            Clear All
          </Button>
        </div>
      )}
    </div>
  );
}
