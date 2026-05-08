import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { BattleCanvas } from '../../canvas/BattleCanvas.js';
import { BattleToolbar } from '../builder/BattleToolbar.js';
import { ViewportControls } from '../builder/ViewportControls.js';
import type { BattleTool, FogBrushMode } from '../builder/BattleToolbar.js';
import type { ViewportSystem } from '../../canvas/systems/ViewportSystem.js';
import type { EntityData, CombatState, ClientMessage, AbilityResult } from '../../types/protocol.js';
import type { DrawingData } from '../../canvas/layers/DrawingLayer.js';
import type { FogZoneData } from '../../canvas/layers/FogLayer.js';
import type { TerrainZoneData } from '../../canvas/layers/TerrainLayer.js';
import { DiceTray } from '../session/DiceTray.js';
import { TokenTooltip } from '../session/TokenTooltip.js';
import { TokenContextMenu } from '../session/TokenContextMenu.js';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

interface BattleStageProps {
  entities: EntityData[];
  combat: CombatState | null;
  selectedEntityId: string | null;
  isDirector: boolean;
  cols?: number;
  rows?: number;
  cellSize?: number;
  backgroundUrl?: string | null;
  heroPosition?: { x: number; y: number } | null;
  fogZones?: FogZoneData[];
  drawings?: DrawingData[];
  terrain?: TerrainZoneData[];
  gridOpacity?: number;
  gridColor?: string;
  combatLog?: AbilityResult[];
  entityNames?: Map<string, string>;
  onSelectEntity: (entityId: string | null) => void;
  send: (msg: ClientMessage) => void;
}

export function BattleStage({
  entities,
  selectedEntityId,
  isDirector,
  cols = 30,
  rows = 20,
  cellSize = 48,
  backgroundUrl,
  heroPosition,
  fogZones = [],
  drawings = [],
  terrain = [],
  gridOpacity = 0.4,
  gridColor = '#444444',
  combatLog,
  entityNames,
  onSelectEntity,
  send,
}: BattleStageProps) {
  // Tool state (director only)
  const [activeTool, setActiveTool] = useState<BattleTool>('select');
  const [drawColor, setDrawColor] = useState('#ef4444');
  const [drawWidth, setDrawWidth] = useState(2);
  const [fogBrushMode, setFogBrushMode] = useState<FogBrushMode>('draw');
  const [fogBrushSize, setFogBrushSize] = useState(1);
  const [gridVisible, setGridVisible] = useState(true);

  // Viewport
  const [zoom, setZoom] = useState(1);
  const [bgNaturalSize, setBgNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const viewportRef = useRef<ViewportSystem | null>(null);
  const prevToolRef = useRef<BattleTool>('select');

  // Container ref for converting viewport coords → container-relative coords.
  // Overlays are `position: absolute` inside this `relative` container, so their
  // left/top must be relative to the container, not the viewport.
  const stageRef = useRef<HTMLDivElement>(null);

  // Multi-select state
  const [selectedEntityIds, setSelectedEntityIds] = useState<string[]>([]);

  // Token hover / context menu overlays
  const [hoverInfo, setHoverInfo] = useState<{ entityId: string; x: number; y: number } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ entityId: string; x: number; y: number } | null>(null);

  const entityMap = useMemo(() => new Map(entities.map((e) => [e.id, e])), [entities]);

  /** Convert viewport-relative coords to container-relative coords for overlays. */
  const toLocal = useCallback((viewportX: number, viewportY: number) => {
    const rect = stageRef.current?.getBoundingClientRect();
    return {
      x: viewportX - (rect?.left ?? 0),
      y: viewportY - (rect?.top ?? 0),
    };
  }, []);

  const handleTokenHover = useCallback(
    (entityId: string | null, screenX: number, screenY: number) => {
      if (entityId) {
        const { x, y } = toLocal(screenX, screenY);
        setHoverInfo({ entityId, x, y });
      } else {
        setHoverInfo(null);
      }
    },
    [toLocal],
  );

  const handleTokenRightClick = useCallback(
    (entityId: string | null, screenX: number, screenY: number) => {
      if (entityId) {
        const { x, y } = toLocal(screenX, screenY);
        setContextMenu({ entityId, x, y });
        setHoverInfo(null); // hide tooltip when context menu opens
      } else {
        // Right-clicked on empty space — close any open context menu
        setContextMenu(null);
      }
    },
    [toLocal],
  );

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const handleMoveEntity = useCallback(
    (entityId: string, x: number, y: number) => {
      if (!entityMap.has(entityId)) {
        onSelectEntity(null);
        return;
      }
      send({ type: 'move_token', entityId, x, y });
    },
    [entityMap, onSelectEntity, send],
  );

  const handleMultiSelectEntities = useCallback(
    (entityIds: string[]) => {
      setSelectedEntityIds(entityIds);
    },
    [],
  );

  const handleMultiMoveEntities = useCallback(
    (moves: Array<{ entityId: string; gridX: number; gridY: number }>) => {
      for (const { entityId, gridX, gridY } of moves) {
        if (entityMap.has(entityId)) {
          send({ type: 'move_token', entityId, x: gridX, y: gridY });
        }
      }
    },
    [entityMap, send],
  );

  // Drawing handlers — sync via WebSocket
  const handleDrawingAdd = useCallback(
    (points: number[], color: string, width: number) => {
      if (color === 'none') return; // Blank color — no stroke
      const drawing = { id: generateId(), type: 'freehand', points, color, width };
      send({ type: 'scene_drawing_add', drawing });
    },
    [send],
  );

  const handleDrawingRemove = useCallback(
    (drawingId: string) => {
      send({ type: 'scene_drawing_remove', drawingId });
    },
    [send],
  );

  // Fog handlers — sync via WebSocket
  const handleFogAdd = useCallback(
    (gridX: number, gridY: number, w: number, h: number) => {
      const fog = { id: generateId(), x: gridX, y: gridY, w, h };
      send({ type: 'scene_fog_add', fog });
    },
    [send],
  );

  const handleFogRemove = useCallback(
    (fogId: string) => {
      send({ type: 'scene_fog_remove', fogId });
    },
    [send],
  );

  const handleClearFog = useCallback(() => {
    for (const zone of fogZones) {
      send({ type: 'scene_fog_remove', fogId: zone.id });
    }
  }, [fogZones, send]);

  // Terrain handlers — sync via WebSocket
  const handleTerrainAdd = useCallback(
    (gridX: number, gridY: number, w: number, h: number) => {
      const terrainZone = {
        id: generateId(),
        terrainId: 'difficult',
        name: 'Difficult Terrain',
        x: gridX,
        y: gridY,
        w,
        h,
      };
      send({ type: 'scene_terrain_add', terrain: terrainZone });
    },
    [send],
  );

  const handleTerrainRemove = useCallback(
    (terrainId: string) => {
      send({ type: 'scene_terrain_remove', terrainId });
    },
    [send],
  );

  // Keyboard shortcuts (director only)
  useEffect(() => {
    if (!isDirector) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      // Space hold for temporary pan
      if (e.key === ' ' && !e.repeat) {
        e.preventDefault();
        prevToolRef.current = activeTool;
        setActiveTool('pan');
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'h': setActiveTool('pan'); return;
        case 'v': setActiveTool('select'); return;
        case 'd': setActiveTool('draw'); return;
        case 'f': setActiveTool('fog'); return;
        case 't': setActiveTool('terrain'); return;
        case 'e': setActiveTool('eraser'); return;
        case 'g': setGridVisible((v) => !v); return;
      }

      // Zoom shortcuts
      if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        viewportRef.current?.zoomIn();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        e.preventDefault();
        viewportRef.current?.zoomOut();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
        const fitW = bgNaturalSize?.width ?? cols * cellSize;
        const fitH = bgNaturalSize?.height ?? rows * cellSize;
        viewportRef.current?.fitToRect(fitW, fitH);
        return;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        setActiveTool(prevToolRef.current);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isDirector, activeTool, cols, rows, cellSize, bgNaturalSize]);

  return (
    <div ref={stageRef} className="relative h-full w-full">
      <BattleCanvas
        cols={cols}
        rows={rows}
        cellSize={cellSize}
        entities={entities}
        selectedEntityId={selectedEntityId}
        selectedEntityIds={selectedEntityIds}
        backgroundUrl={backgroundUrl}
        isDirector={isDirector}
        heroPosition={heroPosition}
        fogZones={fogZones}
        onSelectEntity={onSelectEntity}
        onMoveEntity={handleMoveEntity}
        onMultiSelectEntities={handleMultiSelectEntities}
        onMultiMoveEntities={handleMultiMoveEntities}
        builderMode={isDirector}
        activeTool={isDirector ? activeTool : 'select'}
        drawColor={drawColor}
        drawWidth={drawWidth}
        drawings={drawings}
        terrain={terrain}
        onDrawingAdd={handleDrawingAdd}
        onDrawingRemove={handleDrawingRemove}
        onTerrainAdd={handleTerrainAdd}
        onTerrainRemove={handleTerrainRemove}
        onFogAdd={handleFogAdd}
        onFogRemove={handleFogRemove}
        fogBrushMode={fogBrushMode}
        fogBrushSize={fogBrushSize}
        gridVisible={gridVisible}
        gridOpacity={gridOpacity}
        gridColor={gridColor}
        onTokenHover={handleTokenHover}
        onTokenRightClick={handleTokenRightClick}
        onZoomChange={setZoom}
        onBackgroundLoaded={(info) =>
          setBgNaturalSize({ width: info.naturalWidth, height: info.naturalHeight })
        }
        viewportRef={viewportRef}
      />

      {/* Floating toolbar — director only */}
      {isDirector && (
        <BattleToolbar
          activeTool={activeTool}
          onToolChange={setActiveTool}
          drawColor={drawColor}
          onDrawColorChange={setDrawColor}
          drawWidth={drawWidth}
          onDrawWidthChange={setDrawWidth}
          gridVisible={gridVisible}
          onToggleGrid={() => setGridVisible((v) => !v)}
          fogZoneCount={fogZones.length}
          fogBrushMode={fogBrushMode}
          onFogBrushModeChange={setFogBrushMode}
          fogBrushSize={fogBrushSize}
          onFogBrushSizeChange={setFogBrushSize}
          onClearFog={handleClearFog}
        />
      )}

      <ViewportControls
        zoom={zoom}
        onZoomIn={() => viewportRef.current?.zoomIn()}
        onZoomOut={() => viewportRef.current?.zoomOut()}
        onFitToMap={() => {
          const fitW = bgNaturalSize?.width ?? cols * cellSize;
          const fitH = bgNaturalSize?.height ?? rows * cellSize;
          viewportRef.current?.fitToRect(fitW, fitH);
        }}
      />

      {/* Dice roll overlay */}
      {combatLog && entityNames && (
        <DiceTray entries={combatLog} entityNames={entityNames} />
      )}

      {/* Token hover tooltip */}
      {hoverInfo && !contextMenu && entityMap.get(hoverInfo.entityId) && (
        <TokenTooltip
          entity={entityMap.get(hoverInfo.entityId)!}
          x={hoverInfo.x}
          y={hoverInfo.y}
        />
      )}

      {/* Token right-click context menu */}
      {contextMenu && entityMap.get(contextMenu.entityId) && (
        <TokenContextMenu
          entity={entityMap.get(contextMenu.entityId)!}
          x={contextMenu.x}
          y={contextMenu.y}
          send={send}
          onClose={handleCloseContextMenu}
        />
      )}
    </div>
  );
}
