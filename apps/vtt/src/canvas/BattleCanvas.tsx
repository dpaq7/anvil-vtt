import { useEffect, useRef, useCallback, useState } from 'react';
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

const getEntityTokenSize = (entity: EntityData): number => {
  const rawSize = entity['size'];
  const size = typeof rawSize === 'number' ? rawSize : typeof rawSize === 'string' ? Number(rawSize) : 1;
  return Number.isFinite(size) ? Math.max(1, size) : 1;
};

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
  onMultiMoveEntities?: (moves: Array<{ entityId: string; gridX: number; gridY: number }>) => void;

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
  onTerrainRemove?: (terrainId: string) => void;
  fogZones?: FogZoneData[];
  onFogAdd?: (gridX: number, gridY: number, w: number, h: number) => void;
  onFogRemove?: (fogId: string) => void;
  fogBrushMode?: 'draw' | 'reveal';
  fogBrushSize?: number;
  gridVisible?: boolean;
  gridOpacity?: number;
  gridColor?: string;

  // Token interaction callbacks
  onTokenHover?: (entityId: string | null, screenX: number, screenY: number) => void;
  onTokenRightClick?: (entityId: string | null, screenX: number, screenY: number) => void;

  // Viewport controls
  onZoomChange?: (zoom: number) => void;
  /** Called when a background image loads with its native pixel dimensions. */
  onBackgroundLoaded?: (info: { naturalWidth: number; naturalHeight: number }) => void;
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
  onTerrainRemove,
  fogZones = [],
  onFogAdd,
  onFogRemove,
  fogBrushMode = 'draw',
  fogBrushSize = 1,
  gridVisible = true,
  gridOpacity = 0.4,
  gridColor = '#444444',
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
  const onTerrainRemoveRef = useRef(onTerrainRemove);
  onTerrainRemoveRef.current = onTerrainRemove;
  const onFogAddRef = useRef(onFogAdd);
  onFogAddRef.current = onFogAdd;
  const onFogRemoveRef = useRef(onFogRemove);
  onFogRemoveRef.current = onFogRemove;
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

    const app = new Application();
    let mounted = true;

    void app.init({
      resizeTo: el,
      backgroundColor: 0x1a1a2e,
      antialias: true,
    }).then(() => {
      if (!mounted) return;

      el.appendChild(app.canvas as HTMLCanvasElement);
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

      const viewport = new ViewportSystem(world, app.canvas as HTMLCanvasElement);
      viewport.onZoomChange = (zoom) => onZoomChangeRef.current?.(zoom);

      // Expose viewport to parent via ref
      if (viewportRef) {
        viewportRef.current = viewport;
      }

      const interaction = new InteractionManager(
        app.canvas as HTMLCanvasElement,
        viewport,
        tokens,
        cellSize,
        {
          onTokenSelect: (id) => onSelectEntityRef.current(id),
          onTokenMove: (id, x, y) => onMoveEntityRef.current(id, x, y),
          onMultiTokenSelect: (ids) => onMultiSelectEntitiesRef.current?.(ids),
          onMultiTokenMove: (moves) => onMultiMoveEntitiesRef.current?.(moves),
          onDrawingAdd: (...args) => onDrawingAddRef.current?.(...args),
          onDrawingRemove: (...args) => onDrawingRemoveRef.current?.(...args),
          onTerrainAdd: (...args) => onTerrainAddRef.current?.(...args),
          onTerrainRemove: (...args) => onTerrainRemoveRef.current?.(...args),
          onFogAdd: (...args) => onFogAddRef.current?.(...args),
          onFogRemove: (...args) => onFogRemoveRef.current?.(...args),
          onTokenHover: (...args) => onTokenHoverRef.current?.(...args),
          onTokenRightClick: (...args) => onTokenRightClickRef.current?.(...args),
        },
        { cols, rows },
        isDirector,
      );

      // Wire editable overlay layers for hit-testing and previews.
      if (builderMode || isDirector) {
        interaction.setBuilderLayers(drawingLayer, terrainLayer, fog);
      }

      tokens.setCellSize(cellSize);
      terrainLayer.setCellSize(cellSize);
      fog.setCellSize(cellSize);
      fog.setDirectorMode(isDirector);
      grid.draw({ cellSize, cols, rows, lineAlpha: gridOpacity, lineColor: parseInt(gridColor.replace('#', ''), 16) });

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
      const color = entity.type === 'hero' ? 0x3b82f6 : entity.type === 'monster' ? 0xef4444 : 0x8b5cf6;
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
    layersRef.current?.terrain.sync(terrain);
  }, [terrain, pixiReady]);

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
      layers.grid.draw({ cellSize, cols, rows, lineAlpha: gridOpacity, lineColor: parseInt(gridColor.replace('#', ''), 16) });
    }
  }, [gridOpacity, gridColor, cellSize, cols, rows, pixiReady]);

  return (
    <div ref={containerRef} className="h-full w-full" />
  );
}
