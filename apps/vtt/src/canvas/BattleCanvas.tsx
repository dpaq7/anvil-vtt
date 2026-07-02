import { useEffect, useRef, useCallback, useState, type SyntheticEvent } from 'react';
import { Application, Container } from 'pixi.js';
import { BackgroundLayer } from './layers/BackgroundLayer.js';
import { GridLayer } from './layers/GridLayer.js';
import { TokenLayer } from './layers/TokenLayer.js';
import { FogLayer } from './layers/FogLayer.js';
import { DrawingLayer } from './layers/DrawingLayer.js';
import { TerrainLayer } from './layers/TerrainLayer.js';
import { ViewportSystem } from './systems/ViewportSystem.js';
import { InteractionManager } from './systems/InteractionManager.js';
import type { ActiveTool } from './systems/InteractionManager.js';
import type { Segment } from './vision/VisibilityCalculator.js';
import type { EntityData } from '../types/protocol.js';
import type { DrawingData } from './layers/DrawingLayer.js';
import type { TerrainZoneData } from './layers/TerrainLayer.js';
import type { FogZoneData } from './layers/FogLayer.js';
import {
  credentialedMediaCrossOrigin,
  resolveApiBackedMediaUrl,
} from '../lib/api-url.js';

type RendererPreference = 'webgl' | 'canvas';

interface BattleCanvasFallbackProps {
  cols: number;
  rows: number;
  cellSize: number;
  entities: EntityData[];
  selectedEntityId: string | null;
  selectedEntityIds: string[];
  backgroundUrl?: string | null;
  isDirector: boolean;
  drawings: DrawingData[];
  terrain: TerrainZoneData[];
  fogZones: FogZoneData[];
  onSelectEntity: (entityId: string | null) => void;
  onTokenHover?: (
    entityId: string | null,
    screenX: number,
    screenY: number,
  ) => void;
  onTokenRightClick?: (
    entityId: string | null,
    screenX: number,
    screenY: number,
  ) => void;
}

const getEntityTokenSize = (entity: EntityData): number => {
  const rawSize = entity['size'];
  const size =
    typeof rawSize === 'number'
      ? rawSize
      : typeof rawSize === 'string'
        ? Number(rawSize)
        : 1;
  return Number.isFinite(size) ? Math.max(1, size) : 1;
};

const tokenColorForType = (type: string): string => {
  if (type === 'hero') return '#3b82f6';
  if (type === 'monster') return '#ef4444';
  return '#8b5cf6';
};

const formatErrorForLog = (error: unknown): string => {
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  return String(error);
};

function BattleCanvasFallback({
  cols,
  rows,
  cellSize,
  entities,
  selectedEntityId,
  selectedEntityIds,
  backgroundUrl,
  isDirector,
  drawings,
  terrain,
  fogZones,
  onSelectEntity,
  onTokenHover,
  onTokenRightClick,
}: BattleCanvasFallbackProps) {
  const [backgroundSize, setBackgroundSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const gridWidth = Math.max(1, cols * cellSize);
  const gridHeight = Math.max(1, rows * cellSize);
  const worldWidth = backgroundSize?.width ?? gridWidth;
  const worldHeight = backgroundSize?.height ?? gridHeight;
  const scaleX = worldWidth / gridWidth;
  const scaleY = worldHeight / gridHeight;
  const resolvedBackgroundUrl = backgroundUrl
    ? resolveApiBackedMediaUrl(backgroundUrl)
    : null;
  const selectedSet = new Set(selectedEntityIds);
  if (selectedEntityId) selectedSet.add(selectedEntityId);

  const handleBackgroundLoad = useCallback(
    (event: SyntheticEvent<HTMLImageElement>) => {
      const image = event.currentTarget;
      if (image.naturalWidth > 0 && image.naturalHeight > 0) {
        setBackgroundSize({
          width: image.naturalWidth,
          height: image.naturalHeight,
        });
      }
    },
    [],
  );

  const scalePointList = (points: number[]): string => {
    const scaled: string[] = [];
    for (let i = 0; i < points.length - 1; i += 2) {
      scaled.push(`${points[i]! * scaleX},${points[i + 1]! * scaleY}`);
    }
    return scaled.join(' ');
  };

  return (
    <div className="relative h-full w-full overflow-auto bg-zinc-950">
      <div
        className="relative"
        style={{ width: worldWidth, height: worldHeight }}
        onClick={() => onSelectEntity(null)}
      >
        {resolvedBackgroundUrl ? (
          <img
            src={resolvedBackgroundUrl}
            alt=""
            crossOrigin={credentialedMediaCrossOrigin(resolvedBackgroundUrl)}
            draggable={false}
            onLoad={handleBackgroundLoad}
            className="absolute inset-0 h-full w-full select-none object-fill"
          />
        ) : (
          <div className="absolute inset-0 bg-zinc-900" />
        )}

        {terrain.map((zone) => {
          const color = `#${(zone.color ?? 0x3b82f6).toString(16).padStart(6, '0')}`;
          return (
            <div
              key={zone.id}
              className="pointer-events-none absolute border text-[11px] font-semibold text-white/85"
              style={{
                left: zone.x * cellSize * scaleX,
                top: zone.y * cellSize * scaleY,
                width: zone.w * cellSize * scaleX,
                height: zone.h * cellSize * scaleY,
                borderColor: color,
                backgroundColor: `${color}33`,
              }}
            >
              <span className="absolute left-1 top-0.5 rounded bg-zinc-950/70 px-1">
                {zone.name}
              </span>
            </div>
          );
        })}

        {drawings.length > 0 && (
          <svg
            className="pointer-events-none absolute inset-0"
            width={worldWidth}
            height={worldHeight}
            viewBox={`0 0 ${worldWidth} ${worldHeight}`}
          >
            {drawings.map((drawing) => {
              if (drawing.color === 'none') return null;
              if (
                (drawing.type === 'freehand' || drawing.type === 'line') &&
                drawing.points.length >= 4
              ) {
                return (
                  <polyline
                    key={drawing.id}
                    points={scalePointList(drawing.points)}
                    fill="none"
                    stroke={drawing.color}
                    strokeWidth={Math.max(
                      1,
                      drawing.width * ((scaleX + scaleY) / 2),
                    )}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                );
              }
              if (drawing.type === 'rect' && drawing.points.length >= 4) {
                const [x, y, w, h] = drawing.points as [
                  number,
                  number,
                  number,
                  number,
                ];
                return (
                  <rect
                    key={drawing.id}
                    x={x * scaleX}
                    y={y * scaleY}
                    width={w * scaleX}
                    height={h * scaleY}
                    fill={`${drawing.color}22`}
                    stroke={drawing.color}
                    strokeWidth={Math.max(
                      1,
                      drawing.width * ((scaleX + scaleY) / 2),
                    )}
                  />
                );
              }
              if (drawing.type === 'circle' && drawing.points.length >= 3) {
                const [cx, cy, r] = drawing.points as [
                  number,
                  number,
                  number,
                ];
                return (
                  <circle
                    key={drawing.id}
                    cx={cx * scaleX}
                    cy={cy * scaleY}
                    r={r * ((scaleX + scaleY) / 2)}
                    fill={`${drawing.color}22`}
                    stroke={drawing.color}
                    strokeWidth={Math.max(
                      1,
                      drawing.width * ((scaleX + scaleY) / 2),
                    )}
                  />
                );
              }
              return null;
            })}
          </svg>
        )}

        {entities.map((entity) => {
          const size = getEntityTokenSize(entity);
          const tokenSize = Math.max(
            28,
            size * cellSize * Math.min(scaleX, scaleY),
          );
          const color = tokenColorForType(entity.type);
          const selected = selectedSet.has(entity.id);
          return (
            <button
              key={entity.id}
              type="button"
              title={entity.name}
              className="absolute flex -translate-x-1 -translate-y-1 items-center justify-center rounded-full border-2 text-[10px] font-bold text-white shadow-lg shadow-zinc-950/50"
              style={{
                left: entity.x * cellSize * scaleX,
                top: entity.y * cellSize * scaleY,
                width: tokenSize,
                height: tokenSize,
                borderColor: selected ? '#ffffff' : '#09090b',
                backgroundColor: `${color}dd`,
                outline: selected ? `2px solid ${color}` : 'none',
              }}
              onClick={(event) => {
                event.stopPropagation();
                onSelectEntity(entity.id);
              }}
              onMouseMove={(event) =>
                onTokenHover?.(entity.id, event.clientX, event.clientY)
              }
              onMouseLeave={(event) =>
                onTokenHover?.(null, event.clientX, event.clientY)
              }
              onContextMenu={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onTokenRightClick?.(entity.id, event.clientX, event.clientY);
              }}
            >
              {entity.name.slice(0, 2).toUpperCase()}
            </button>
          );
        })}

        {fogZones.map((zone) => (
          <div
            key={zone.id}
            className="pointer-events-none absolute bg-black"
            style={{
              left: zone.x * cellSize * scaleX,
              top: zone.y * cellSize * scaleY,
              width: zone.w * cellSize * scaleX,
              height: zone.h * cellSize * scaleY,
              opacity: isDirector ? 0.5 : 1,
            }}
          />
        ))}
      </div>

      <div className="pointer-events-none absolute left-3 top-3 rounded border border-amber-400/30 bg-zinc-950/90 px-3 py-2 text-xs text-amber-100 shadow-lg">
        Limited map mode: the browser could not start the accelerated battle
        renderer.
      </div>
    </div>
  );
}

export interface BattleCanvasProps {
  cols: number;
  rows: number;
  cellSize: number;
  entities: EntityData[];
  selectedEntityId: string | null;
  selectedEntityIds?: string[];
  backgroundUrl?: string | null;
  walls?: Segment[];
  isDirector: boolean;
  heroPosition?: { x: number; y: number } | null;
  onSelectEntity: (entityId: string | null) => void;
  onMoveEntity: (entityId: string, x: number, y: number) => void;
  onMultiSelectEntities?: (entityIds: string[]) => void;
  onMultiMoveEntities?: (
    moves: Array<{ entityId: string; gridX: number; gridY: number }>,
  ) => void;

  // Builder mode props (all optional — omit for live session)
  builderMode?: boolean;
  activeTool?: ActiveTool;
  drawColor?: string;
  drawWidth?: number;
  drawings?: DrawingData[];
  terrain?: TerrainZoneData[];
  onDrawingAdd?: (points: number[], color: string, width: number) => void;
  onDrawingRemove?: (drawingId: string) => void;
  onTerrainAdd?: (gridX: number, gridY: number, w: number, h: number) => void;
  onTerrainUpdate?: (terrain: TerrainZoneData) => void;
  onTerrainRemove?: (terrainId: string) => void;
  onTerrainRightClick?: (
    terrainId: string | null,
    screenX: number,
    screenY: number,
  ) => void;
  fogZones?: FogZoneData[];
  onFogAdd?: (gridX: number, gridY: number, w: number, h: number) => void;
  onFogRemove?: (fogId: string) => void;
  onFogRevealCell?: (gridX: number, gridY: number) => void;
  fogBrushMode?: 'draw' | 'reveal';
  fogBrushSize?: number;
  gridVisible?: boolean;
  gridOpacity?: number;
  gridColor?: string;
  gridCellSize?: number;
  gridOffsetX?: number;
  gridOffsetY?: number;

  // Token interaction callbacks
  onTokenHover?: (
    entityId: string | null,
    screenX: number,
    screenY: number,
  ) => void;
  onTokenRightClick?: (
    entityId: string | null,
    screenX: number,
    screenY: number,
  ) => void;

  // Viewport controls
  onZoomChange?: (zoom: number) => void;
  /** Called when a background image loads with its native pixel dimensions. */
  onBackgroundLoaded?: (info: {
    naturalWidth: number;
    naturalHeight: number;
  }) => void;
  viewportRef?: React.MutableRefObject<ViewportSystem | null>;
}

export function BattleCanvas({
  cols,
  rows,
  cellSize,
  entities,
  selectedEntityId,
  selectedEntityIds = [],
  backgroundUrl,
  walls: _walls = [],
  isDirector,
  heroPosition: _heroPosition,
  onSelectEntity,
  onMoveEntity,
  onMultiSelectEntities,
  onMultiMoveEntities,
  builderMode = false,
  activeTool = 'select',
  drawColor = '#ef4444',
  drawWidth = 2,
  drawings = [],
  terrain = [],
  onDrawingAdd,
  onDrawingRemove,
  onTerrainAdd,
  onTerrainUpdate,
  onTerrainRemove,
  onTerrainRightClick,
  fogZones = [],
  onFogAdd,
  onFogRemove,
  onFogRevealCell,
  fogBrushMode = 'draw',
  fogBrushSize = 1,
  gridVisible = true,
  gridOpacity = 0.4,
  gridColor = '#444444',
  gridCellSize = cellSize,
  gridOffsetX = 0,
  gridOffsetY = 0,
  onTokenHover,
  onTokenRightClick,
  onZoomChange,
  onBackgroundLoaded,
  viewportRef,
}: BattleCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  /** Flipped to true once PixiJS finishes async init so update effects re-run. */
  const [pixiReady, setPixiReady] = useState(false);
  const [canvasError, setCanvasError] = useState<string | null>(null);
  const layersRef = useRef<{
    background: BackgroundLayer;
    grid: GridLayer;
    drawing: DrawingLayer;
    terrain: TerrainLayer;
    tokens: TokenLayer;
    fog: FogLayer;
    world: Container;
    viewport: ViewportSystem;
    interaction: InteractionManager;
  } | null>(null);

  // Keep callback refs fresh to avoid stale closures in the init effect
  const onZoomChangeRef = useRef(onZoomChange);
  onZoomChangeRef.current = onZoomChange;
  const onBackgroundLoadedRef = useRef(onBackgroundLoaded);
  onBackgroundLoadedRef.current = onBackgroundLoaded;
  const onSelectEntityRef = useRef(onSelectEntity);
  onSelectEntityRef.current = onSelectEntity;
  const onMoveEntityRef = useRef(onMoveEntity);
  onMoveEntityRef.current = onMoveEntity;
  const onDrawingAddRef = useRef(onDrawingAdd);
  onDrawingAddRef.current = onDrawingAdd;
  const onDrawingRemoveRef = useRef(onDrawingRemove);
  onDrawingRemoveRef.current = onDrawingRemove;
  const onTerrainAddRef = useRef(onTerrainAdd);
  onTerrainAddRef.current = onTerrainAdd;
  const onTerrainUpdateRef = useRef(onTerrainUpdate);
  onTerrainUpdateRef.current = onTerrainUpdate;
  const onTerrainRemoveRef = useRef(onTerrainRemove);
  onTerrainRemoveRef.current = onTerrainRemove;
  const onTerrainRightClickRef = useRef(onTerrainRightClick);
  onTerrainRightClickRef.current = onTerrainRightClick;
  const onFogAddRef = useRef(onFogAdd);
  onFogAddRef.current = onFogAdd;
  const onFogRemoveRef = useRef(onFogRemove);
  onFogRemoveRef.current = onFogRemove;
  const onFogRevealCellRef = useRef(onFogRevealCell);
  onFogRevealCellRef.current = onFogRevealCell;
  const onMultiSelectEntitiesRef = useRef(onMultiSelectEntities);
  onMultiSelectEntitiesRef.current = onMultiSelectEntities;
  const onMultiMoveEntitiesRef = useRef(onMultiMoveEntities);
  onMultiMoveEntitiesRef.current = onMultiMoveEntities;
  const onTokenHoverRef = useRef(onTokenHover);
  onTokenHoverRef.current = onTokenHover;
  const onTokenRightClickRef = useRef(onTokenRightClick);
  onTokenRightClickRef.current = onTokenRightClick;

  // Init PixiJS
  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;

    const createApp = async (
      preference: RendererPreference,
    ): Promise<Application> => {
      const nextApp = new Application();
      try {
        await nextApp.init({
          width: Math.max(1, el.clientWidth || 1),
          height: Math.max(1, el.clientHeight || 1),
          resizeTo: el,
          backgroundColor: 0x1a1a2e,
          antialias: preference === 'webgl',
          preference: [preference],
          failIfMajorPerformanceCaveat: false,
        });
        return nextApp;
      } catch (error) {
        try {
          nextApp.destroy(true);
        } catch {
          /* Pixi may not be fully initialized after a failed init. */
        }
        throw error;
      }
    };

    let mounted = true;
    setCanvasError(null);

    void (async () => {
        let app: Application;
        let webglError: unknown = null;
        try {
          app = await createApp('webgl');
        } catch (error) {
          webglError = error;
          console.warn(
            '[BattleCanvas] WebGL renderer failed; retrying canvas renderer',
            webglError,
          );
          try {
            app = await createApp('canvas');
          } catch (canvasRendererError) {
            console.error('[BattleCanvas] Renderer initialization failed', {
              webgl: formatErrorForLog(webglError),
              canvas: formatErrorForLog(canvasRendererError),
            });
            throw canvasRendererError;
          }
        }

        if (!mounted) {
          app.destroy(true);
          return;
        }

        const canvas = app.canvas as HTMLCanvasElement;
        canvas.style.display = 'block';
        canvas.style.touchAction = 'none';
        canvas.style.userSelect = 'none';
        canvas.style.setProperty('-webkit-user-select', 'none');
        canvas.style.setProperty('-webkit-touch-callout', 'none');

        el.appendChild(canvas);
        appRef.current = app;

        const world = new Container();
        app.stage.addChild(world);

        const background = new BackgroundLayer();
        const grid = new GridLayer();
        const drawingLayer = new DrawingLayer();
        const terrainLayer = new TerrainLayer();
        const tokens = new TokenLayer();
        const fog = new FogLayer();

        // Render order: bg → grid → drawings → terrain → tokens → fog
        world.addChild(background);
        world.addChild(grid);
        world.addChild(drawingLayer);
        world.addChild(terrainLayer);
        world.addChild(tokens);
        world.addChild(fog);

        const viewport = new ViewportSystem(
          world,
          canvas,
        );
        viewport.onZoomChange = (zoom) => onZoomChangeRef.current?.(zoom);

        // Expose viewport to parent via ref
        if (viewportRef) {
          viewportRef.current = viewport;
        }

        const interaction = new InteractionManager(
          canvas,
          viewport,
          tokens,
          cellSize,
          {
            onTokenSelect: (id) => onSelectEntityRef.current(id),
            onTokenMove: (id, x, y) => onMoveEntityRef.current(id, x, y),
            onMultiTokenSelect: (ids) =>
              onMultiSelectEntitiesRef.current?.(ids),
            onMultiTokenMove: (moves) =>
              onMultiMoveEntitiesRef.current?.(moves),
            onDrawingAdd: (...args) => onDrawingAddRef.current?.(...args),
            onDrawingRemove: (...args) => onDrawingRemoveRef.current?.(...args),
            onTerrainAdd: (...args) => onTerrainAddRef.current?.(...args),
            onTerrainUpdate: (...args) => onTerrainUpdateRef.current?.(...args),
            onTerrainRemove: (...args) => onTerrainRemoveRef.current?.(...args),
            onTerrainRightClick: (...args) =>
              onTerrainRightClickRef.current?.(...args),
            onFogAdd: (...args) => onFogAddRef.current?.(...args),
            onFogRemove: (...args) => onFogRemoveRef.current?.(...args),
            onFogRevealCell: (...args) => onFogRevealCellRef.current?.(...args),
            onTokenHover: (...args) => onTokenHoverRef.current?.(...args),
            onTokenRightClick: (...args) =>
              onTokenRightClickRef.current?.(...args),
          },
          { cols, rows },
          isDirector,
        );

        // A two-finger pinch takes over the pointer stream — abort any
        // in-progress token drag/marquee so tokens don't jump mid-gesture.
        viewport.onPinchStart = () => interaction.cancelCurrentInteraction();

        // Wire editable overlay layers for hit-testing and previews.
        if (builderMode || isDirector) {
          interaction.setBuilderLayers(drawingLayer, terrainLayer, fog);
        }

        tokens.setCellSize(cellSize);
        terrainLayer.setCellSize(cellSize);
        terrainLayer.setDirectorMode(isDirector);
        fog.setCellSize(cellSize);
        fog.setDirectorMode(isDirector);
        grid.draw({
          cellSize: gridCellSize,
          stageCellSize: cellSize,
          cols,
          rows,
          lineAlpha: gridOpacity,
          lineColor: parseInt(gridColor.replace('#', ''), 16),
          offsetX: gridOffsetX,
          offsetY: gridOffsetY,
        });

        layersRef.current = {
          background,
          grid,
          drawing: drawingLayer,
          terrain: terrainLayer,
          tokens,
          fog,
          world,
          viewport,
          interaction,
        };

        // Signal that layers are ready so update effects re-run
        setPixiReady(true);
      })().catch((error: unknown) => {
        if (!mounted) {
          return;
        }
        console.error('[BattleCanvas] PixiJS initialization failed', error);
        try {
          appRef.current?.destroy(true);
        } catch {
          /* Pixi may not be fully initialized after a failed init. */
        }
        appRef.current = null;
        setCanvasError('Battle map could not start in this browser or device.');
      });

    return () => {
      mounted = false;
      setPixiReady(false);
      if (viewportRef) {
        viewportRef.current = null;
      }
      layersRef.current?.viewport.destroy();
      layersRef.current?.interaction.destroy();
      layersRef.current = null;
      appRef.current?.destroy(true);
      appRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep Pixi's renderer synchronized with flex layout changes such as pane collapse and focus mode.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let frame = 0;
    const resize = () => {
      const app = appRef.current;
      if (!app) return;
      const width = Math.max(1, Math.floor(el.clientWidth));
      const height = Math.max(1, Math.floor(el.clientHeight));
      app.renderer.resize(width, height);
    };

    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(resize);
    });

    observer.observe(el);
    frame = requestAnimationFrame(resize);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [pixiReady]);

  // Callback for when background image loads at native dimensions
  const handleImageLoaded = useCallback(
    (info: { naturalWidth: number; naturalHeight: number }) => {
      // Notify parent so it can use the dimensions (e.g. for fit-to-map)
      onBackgroundLoadedRef.current?.(info);
    },
    [],
  );

  // Keep layer scale and interaction bounds in sync with map settings.
  useEffect(() => {
    const layers = layersRef.current;
    if (!layers) return;
    layers.tokens.setCellSize(cellSize);
    layers.terrain.setCellSize(cellSize);
    layers.fog.setCellSize(cellSize);
    layers.interaction.setCellSize(cellSize);
    layers.interaction.setGridBounds({ cols, rows });
  }, [cellSize, cols, rows, pixiReady]);

  // Update background — renders at native image dimensions, independent of grid.
  // Only re-runs when the URL actually changes (not on grid resize).
  useEffect(() => {
    const layers = layersRef.current;
    if (!layers) return;
    if (backgroundUrl) {
      layers.background.setImage(backgroundUrl, handleImageLoaded);
    } else {
      layers.background.setImage(null);
    }
  }, [backgroundUrl, handleImageLoaded, pixiReady]);

  // Fallback color background when no image — sized to the grid
  useEffect(() => {
    const layers = layersRef.current;
    if (!layers || backgroundUrl) return;
    layers.background.setColor(0x1a1a2e, cols * cellSize, rows * cellSize);
  }, [backgroundUrl, cols, rows, cellSize, pixiReady]);

  // Update tokens — diff-based to avoid destroying tokens during drag
  const prevEntityIdsRef = useRef(new Set<string>());
  useEffect(() => {
    const layers = layersRef.current;
    if (!layers) return;

    const currentIds = new Set(entities.map((e) => e.id));
    const prevIds = prevEntityIdsRef.current;
    const selectedSet = new Set(selectedEntityIds);
    // Always include the single-select ID too
    if (selectedEntityId) selectedSet.add(selectedEntityId);

    // Sync multi-select state into the InteractionManager so group-drag works
    layers.interaction.setSelectedIds(selectedSet);

    // Remove tokens that no longer exist
    for (const id of prevIds) {
      if (!currentIds.has(id)) {
        layers.tokens.removeToken(id);
      }
    }

    // Add new tokens or update changed ones
    for (const entity of entities) {
      const color =
        entity.type === 'hero'
          ? 0x3b82f6
          : entity.type === 'monster'
            ? 0xef4444
            : 0x8b5cf6;
      const size = getEntityTokenSize(entity);
      if (!prevIds.has(entity.id)) {
        // New entity — add token
        layers.tokens.addToken(entity, {
          size,
          color,
          selected: selectedSet.has(entity.id),
        });
      } else {
        // Existing entity — update in place (position, selection, stamina, conditions)
        layers.tokens.updateToken(entity, {
          size,
          color,
          selected: selectedSet.has(entity.id),
        });
      }
    }

    prevEntityIdsRef.current = currentIds;
    layers.interaction.rebuildIndex();
  }, [entities, selectedEntityId, selectedEntityIds, pixiReady]);

  // Update fog zones
  useEffect(() => {
    const layers = layersRef.current;
    if (!layers) return;
    layers.fog.setDirectorMode(isDirector);
    layers.fog.sync(fogZones);
  }, [isDirector, fogZones, pixiReady]);

  // Sync active tool to InteractionManager
  useEffect(() => {
    layersRef.current?.interaction.setActiveTool(activeTool);
  }, [activeTool, pixiReady]);

  // Sync draw config to InteractionManager
  useEffect(() => {
    layersRef.current?.interaction.setDrawConfig(drawColor, drawWidth);
  }, [drawColor, drawWidth, pixiReady]);

  // Sync fog brush config to InteractionManager
  useEffect(() => {
    layersRef.current?.interaction.setFogConfig(fogBrushMode, fogBrushSize);
  }, [fogBrushMode, fogBrushSize, pixiReady]);

  // Sync drawings layer
  useEffect(() => {
    layersRef.current?.drawing.sync(drawings);
  }, [drawings, pixiReady]);

  // Sync terrain layer
  useEffect(() => {
    const layers = layersRef.current;
    if (!layers) return;
    layers.terrain.setDirectorMode(isDirector);
    layers.terrain.sync(terrain);
  }, [isDirector, terrain, pixiReady]);

  // Toggle grid visibility
  useEffect(() => {
    const layers = layersRef.current;
    if (layers) {
      layers.grid.visible = gridVisible;
    }
  }, [gridVisible, pixiReady]);

  // Update grid appearance (opacity, color, dimensions)
  useEffect(() => {
    const layers = layersRef.current;
    if (layers) {
      layers.grid.draw({
        cellSize: gridCellSize,
        stageCellSize: cellSize,
        cols,
        rows,
        lineAlpha: gridOpacity,
        lineColor: parseInt(gridColor.replace('#', ''), 16),
        offsetX: gridOffsetX,
        offsetY: gridOffsetY,
      });
    }
  }, [
    gridOpacity,
    gridColor,
    gridCellSize,
    gridOffsetX,
    gridOffsetY,
    cellSize,
    cols,
    rows,
    pixiReady,
  ]);

  if (canvasError) {
    return (
      <BattleCanvasFallback
        cols={cols}
        rows={rows}
        cellSize={cellSize}
        entities={entities}
        selectedEntityId={selectedEntityId}
        selectedEntityIds={selectedEntityIds}
        backgroundUrl={backgroundUrl}
        isDirector={isDirector}
        drawings={drawings}
        terrain={terrain}
        fogZones={fogZones}
        onSelectEntity={onSelectEntity}
        onTokenHover={onTokenHover}
        onTokenRightClick={onTokenRightClick}
      />
    );
  }

  return <div ref={containerRef} className="h-full w-full touch-none select-none" />;
}
