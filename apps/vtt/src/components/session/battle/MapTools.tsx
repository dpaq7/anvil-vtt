import type { BattleTool, FogBrushMode } from '../../builder/BattleToolbar.js';
import { CANVAS_THEME } from '../../../canvas/theme.js';
import { useSessionConnection } from '../shell/connection-context.js';

const DIRECTOR_TOOLS: { id: BattleTool; label: string; shortcut: string }[] = [
  { id: 'pan', label: 'Pan', shortcut: 'H' },
  { id: 'select', label: 'Select', shortcut: 'V' },
  { id: 'draw', label: 'Draw', shortcut: 'D' },
  { id: 'fog', label: 'Fog', shortcut: 'F' },
  { id: 'terrain', label: 'Terrain', shortcut: 'T' },
  { id: 'eraser', label: 'Eraser', shortcut: 'E' },
  { id: 'measure', label: 'Measure', shortcut: 'M' },
];
const PLAYER_TOOLS: { id: BattleTool; label: string; shortcut: string }[] = [
  { id: 'select', label: 'Select', shortcut: '' },
  { id: 'pan', label: 'Pan', shortcut: '' },
];

const PRESET_COLORS = [CANVAS_THEME.dark.drawDefault, '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ffffff'];

/** The tools in the bar under the screen (`sb-tools`). During a drop the map only pans. */
export function MapTools({ isDirector, tool, onTool }: { isDirector: boolean; tool: BattleTool; onTool: (tool: BattleTool) => void }) {
  const { paused } = useSessionConnection();
  const tools = isDirector ? DIRECTOR_TOOLS : PLAYER_TOOLS;
  return (
    <div className="sb-tools" role="toolbar" aria-label="Map tools">
      {tools.map((t) => {
        const on = paused ? t.id === 'pan' : tool === t.id;
        return (
          <button
            key={t.id}
            type="button"
            data-on={on || undefined}
            aria-pressed={on}
            disabled={paused && t.id !== 'pan'}
            title={t.shortcut ? `${t.label} (${t.shortcut})` : t.label}
            onClick={() => onTool(t.id)}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

interface ToolOptionsProps {
  tool: BattleTool;
  drawColor: string;
  onDrawColor: (color: string) => void;
  drawWidth: number;
  onDrawWidth: (width: number) => void;
  fogZoneCount: number;
  fogBrushMode: FogBrushMode;
  onFogBrushMode: (mode: FogBrushMode) => void;
  fogBrushSize: number;
  onFogBrushSize: (size: number) => void;
  onClearFog: () => void;
}

/** Options for the Director's draw, eraser and fog tools. Floats over the map's corner. */
export function ToolOptions({
  tool,
  drawColor,
  onDrawColor,
  drawWidth,
  onDrawWidth,
  fogZoneCount,
  fogBrushMode,
  onFogBrushMode,
  fogBrushSize,
  onFogBrushSize,
  onClearFog,
}: ToolOptionsProps) {
  if (tool !== 'draw' && tool !== 'eraser' && tool !== 'fog') return null;
  return (
    <div className="sb-toolopts" data-map-panel>
      {tool === 'draw' &&
        PRESET_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            className="sb-swatch"
            aria-pressed={drawColor === color}
            aria-label={`Draw colour ${color}`}
            title={color}
            style={{ backgroundColor: color }}
            onClick={() => onDrawColor(color)}
          />
        ))}
      {(tool === 'draw' || tool === 'eraser') && (
        <label>
          Size
          <input type="range" min={1} max={10} value={drawWidth} onChange={(e) => onDrawWidth(Number(e.target.value))} className="h-1 w-16" />
          <b>{drawWidth}</b>
        </label>
      )}
      {tool === 'fog' && (
        <>
          <div className="sb-seg w-[120px]" role="group" aria-label="Fog brush">
            <button type="button" data-on={fogBrushMode === 'draw' || undefined} aria-pressed={fogBrushMode === 'draw'} onClick={() => onFogBrushMode('draw')}>Draw</button>
            <button type="button" data-on={fogBrushMode === 'reveal' || undefined} aria-pressed={fogBrushMode === 'reveal'} onClick={() => onFogBrushMode('reveal')}>Reveal</button>
          </div>
          {fogBrushMode === 'draw' ? (
            <label>
              Brush
              <input type="range" min={1} max={10} value={fogBrushSize} onChange={(e) => onFogBrushSize(Number(e.target.value))} className="h-1 w-16" />
              <b>{fogBrushSize}</b>
            </label>
          ) : (
            <span>1 square</span>
          )}
          <span>{fogZoneCount} zone{fogZoneCount !== 1 ? 's' : ''}</span>
          <button type="button" className="sb-link" disabled={fogZoneCount === 0} onClick={onClearFog}>Clear all</button>
        </>
      )}
    </div>
  );
}
