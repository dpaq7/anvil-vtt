import type { MouseEvent, RefObject } from 'react';
import { Minus, Plus, Scan } from 'lucide-react';
import { resolveApiBackedMediaUrl } from '../../../lib/api-url.js';
import { CANVAS_THEME, toCssHex } from '../../../canvas/theme.js';
import type { ViewportSystem } from '../../../canvas/systems/ViewportSystem.js';
import type { FogZoneData } from '../../../canvas/layers/FogLayer.js';
import type { EntityData } from '../../../types/protocol.js';
import { SMALL_SESSION, useMediaQuery, useViewportView } from './hooks.js';

const ART = CANVAS_THEME.light;
const sizeOf = (e: EntityData) => (typeof e['size'] === 'number' && e['size'] >= 1 ? (e['size'] as number) : 1);

interface MapNavProps {
  viewportRef: RefObject<ViewportSystem | null>;
  /** What this viewer may see: a Player's mini-map has no fogged creature on it. */
  entities: EntityData[];
  fogZones: FogZoneData[];
  isDirector: boolean;
  cols: number;
  rows: number;
  cellSize: number;
  worldWidth: number;
  worldHeight: number;
  backgroundUrl?: string | null;
  onShowAll: () => void;
}

/** Bottom-right of the map (`sb-nav`): the mini-map, zoom, "Show all" and "N above view". */
export function MapNav({ viewportRef, entities, fogZones, isDirector, cellSize, worldWidth, worldHeight, backgroundUrl, onShowAll }: MapNavProps) {
  const view = useViewportView(viewportRef);
  const small = useMediaQuery(SMALL_SESSION);
  const width = small ? 84 : 112;
  const k = width / worldWidth;
  const height = worldHeight * k;
  const cell = cellSize * k;
  const zoom = view?.zoom ?? 1;
  const box = view
    ? {
        x: Math.max(0, -view.x / zoom) * k,
        y: Math.max(0, -view.y / zoom) * k,
        w: (Math.min(worldWidth, (view.width - view.x) / zoom) - Math.max(0, -view.x / zoom)) * k,
        h: (Math.min(worldHeight, (view.height - view.y) / zoom) - Math.max(0, -view.y / zoom)) * k,
      }
    : null;
  const above = view
    ? entities.filter((e) => e.type !== 'hero' && (e.y + sizeOf(e)) * cellSize * zoom + view.y <= 0).length
    : 0;

  const jump = (event: MouseEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    viewportRef.current?.centerOnGrid((event.clientX - rect.left) / cell, (event.clientY - rect.top) / cell, cellSize);
  };

  return (
    <div className="sb-nav" data-map-panel>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Whole map, current view marked" onClick={jump}>
        <rect width={width} height={height} fill={toCssHex(ART.mapBlank)} />
        {backgroundUrl && <image href={resolveApiBackedMediaUrl(backgroundUrl)} width={width} height={height} preserveAspectRatio="none" />}
        {fogZones.map((f) => (
          <rect key={f.id} x={f.x * cell} y={f.y * cell} width={f.w * cell} height={f.h * cell} fill={toCssHex(ART.fog)} fillOpacity={isDirector ? 0.4 : 1} />
        ))}
        {entities.filter((e) => e.type !== 'hero').map((e) => (
          <rect key={e.id} x={e.x * cell} y={e.y * cell} width={cell * sizeOf(e)} height={cell * sizeOf(e)} fill={toCssHex(ART.miniMapFoe)} />
        ))}
        {entities.filter((e) => e.type === 'hero').map((e) => (
          <circle key={e.id} cx={(e.x + 0.5) * cell} cy={(e.y + 0.5) * cell} r={cell * 0.55} fill={toCssHex(ART.miniMapHero)} />
        ))}
        {box && box.w > 0 && box.h > 0 && (
          <rect x={box.x + 1} y={box.y + 1} width={Math.max(2, box.w - 2)} height={Math.max(2, box.h - 2)} fill="none" stroke={toCssHex(ART.miniMapHero)} strokeWidth={2} />
        )}
      </svg>
      <div className="sb-nav__z">
        <button type="button" aria-label="Zoom out" title="Zoom Out (Ctrl+-)" onClick={() => viewportRef.current?.zoomOut()}><Minus size={15} strokeWidth={3} aria-hidden="true" /></button>
        <span>{Math.round(zoom * 100)}%</span>
        <button type="button" aria-label="Zoom in" title="Zoom In (Ctrl+=)" onClick={() => viewportRef.current?.zoomIn()}><Plus size={15} strokeWidth={3} aria-hidden="true" /></button>
      </div>
      <button type="button" className="sb-all" title="Fit to Map (Ctrl+0)" onClick={onShowAll}><Scan size={15} strokeWidth={2.6} aria-hidden="true" />Show all</button>
      {above > 0 && <small>{above} above view</small>}
    </div>
  );
}
