import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import type {
  CSSProperties,
  PointerEvent as ReactPointerEvent,
  ReactNode,
} from 'react';
import { Dices, GripVertical, X } from 'lucide-react';
import { GeometryLogic, MovementLogic } from '@anvil/data';
import type { AbilityLogic } from '@anvil/data';
import type { ConditionName } from '@anvil/types';
import { BattleCanvas } from '../../canvas/BattleCanvas.js';
import type { TargetingModeContext } from '../../canvas/systems/InteractionManager.js';
import { BattleToolbar } from '../builder/BattleToolbar.js';
import { ViewportControls } from '../builder/ViewportControls.js';
import type { BattleTool, FogBrushMode } from '../builder/BattleToolbar.js';
import type { ViewportSystem } from '../../canvas/systems/ViewportSystem.js';
import type {
  EntityData,
  CombatState,
  ClientMessage,
  AbilityResult,
} from '../../types/protocol.js';
import type { DrawingData } from '../../canvas/layers/DrawingLayer.js';
import type { FogZoneData } from '../../canvas/layers/FogLayer.js';
import type { TerrainZoneData } from '../../canvas/layers/TerrainLayer.js';
import { BattleTurnTracker } from '../session/BattleTurnTracker.js';
import { DiceTray } from '../session/DiceTray.js';
import { DiceRollControls } from '../session/DiceRollControls.js';
import { TokenTooltip } from '../session/TokenTooltip.js';
import { TokenContextMenu } from '../session/TokenContextMenu.js';
import { TerrainContextMenu } from '../session/TerrainContextMenu.js';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function splitFogZoneAroundCell(
  zone: FogZoneData,
  gridX: number,
  gridY: number,
): FogZoneData[] {
  const zoneRight = zone.x + zone.w;
  const zoneBottom = zone.y + zone.h;
  if (
    gridX < zone.x ||
    gridX >= zoneRight ||
    gridY < zone.y ||
    gridY >= zoneBottom
  ) {
    return [zone];
  }

  const pieces: FogZoneData[] = [];
  const addPiece = (x: number, y: number, w: number, h: number) => {
    if (w <= 0 || h <= 0) return;
    pieces.push({ id: generateId(), x, y, w, h });
  };

  addPiece(zone.x, zone.y, zone.w, gridY - zone.y);
  addPiece(zone.x, gridY + 1, zone.w, zoneBottom - gridY - 1);
  addPiece(zone.x, gridY, gridX - zone.x, 1);
  addPiece(gridX + 1, gridY, zoneRight - gridX - 1, 1);

  return pieces;
}

type StageDockEdge = 'top' | 'bottom' | 'left' | 'right';

interface StagePanelPlacement {
  edge: StageDockEdge;
  offset: number;
}

function clamp(value: number, min: number, max: number): number {
  if (min > max) return 0.5;
  return Math.max(min, Math.min(max, value));
}

function isInitiativePending(combat: CombatState): boolean {
  return (
    combat.initiativeRoll === null ||
    combat.firstSide === null ||
    combat.activeSide === null
  );
}

/**
 * Expand a straight drag from `a` to `b` into unit grid steps (Chebyshev line),
 * so the server can cost each square and detect opportunity attacks along the way.
 */
function expandGridPath(
  a: { x: number; y: number },
  b: { x: number; y: number },
): Array<{ x: number; y: number }> {
  const path = [{ x: a.x, y: a.y }];
  let cx = a.x;
  let cy = a.y;
  let guard = 0;
  while ((cx !== b.x || cy !== b.y) && guard++ < 500) {
    cx += Math.sign(b.x - cx);
    cy += Math.sign(b.y - cy);
    path.push({ x: cx, y: cy });
  }
  return path;
}

function loadPanelPlacement(
  storageKey: string,
  fallback: StagePanelPlacement,
): StagePanelPlacement {
  if (typeof window === 'undefined') return fallback;

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<StagePanelPlacement>;
    if (
      (parsed.edge === 'top' ||
        parsed.edge === 'bottom' ||
        parsed.edge === 'left' ||
        parsed.edge === 'right') &&
      typeof parsed.offset === 'number' &&
      Number.isFinite(parsed.offset)
    ) {
      return { edge: parsed.edge, offset: clamp(parsed.offset, 0.05, 0.95) };
    }
  } catch {
    // Ignore invalid persisted panel placement.
  }

  return fallback;
}

function savePanelPlacement(
  storageKey: string,
  placement: StagePanelPlacement,
): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(placement));
  } catch {
    // Ignore localStorage failures; controls still move for the current drag.
  }
}

function styleForPanelPlacement(
  placement: StagePanelPlacement,
  inset: number,
): CSSProperties {
  switch (placement.edge) {
    case 'bottom':
      return {
        bottom: inset,
        left: `${placement.offset * 100}%`,
        transform: 'translateX(-50%)',
      };
    case 'left':
      return {
        left: inset,
        top: `${placement.offset * 100}%`,
        transform: 'translateY(-50%)',
      };
    case 'right':
      return {
        right: inset,
        top: `${placement.offset * 100}%`,
        transform: 'translateY(-50%)',
      };
    case 'top':
    default:
      return {
        top: inset,
        left: `${placement.offset * 100}%`,
        transform: 'translateX(-50%)',
      };
  }
}

interface FloatingStagePanelProps {
  children: ReactNode;
  storageKey: string;
  initialPlacement: StagePanelPlacement;
  stageRef: { current: HTMLDivElement | null };
  inset?: number;
  label: string;
}

function FloatingStagePanel({
  children,
  storageKey,
  initialPlacement,
  stageRef,
  inset = 12,
  label,
}: FloatingStagePanelProps) {
  const [placement, setPlacement] = useState(() =>
    loadPanelPlacement(storageKey, initialPlacement),
  );
  const [dragPosition, setDragPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const snapToNearestEdge = useCallback(
    (x: number, y: number, width: number, height: number) => {
      const stage = stageRef.current;
      if (!stage) return placement;

      const stageWidth = Math.max(1, stage.clientWidth);
      const stageHeight = Math.max(1, stage.clientHeight);
      const centerX = x + width / 2;
      const centerY = y + height / 2;
      const distances: Record<StageDockEdge, number> = {
        top: centerY,
        bottom: stageHeight - centerY,
        left: centerX,
        right: stageWidth - centerX,
      };
      const edge = (Object.entries(distances).sort(
        (a, b) => a[1] - b[1],
      )[0]?.[0] ?? 'top') as StageDockEdge;
      const horizontalMin = Math.min(0.5, (width / 2 + 8) / stageWidth);
      const verticalMin = Math.min(0.5, (height / 2 + 8) / stageHeight);
      const offset =
        edge === 'top' || edge === 'bottom'
          ? clamp(centerX / stageWidth, horizontalMin, 1 - horizontalMin)
          : clamp(centerY / stageHeight, verticalMin, 1 - verticalMin);

      return { edge, offset };
    },
    [placement, stageRef],
  );

  const startDrag = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      const panel = panelRef.current;
      const stage = stageRef.current;
      if (!panel || !stage) return;

      event.preventDefault();
      event.stopPropagation();

      const stageRect = stage.getBoundingClientRect();
      const panelRect = panel.getBoundingClientRect();
      const start = {
        pointerX: event.clientX,
        pointerY: event.clientY,
        x: panelRect.left - stageRect.left,
        y: panelRect.top - stageRect.top,
        width: panelRect.width,
        height: panelRect.height,
      };
      let latest = { x: start.x, y: start.y };
      setDragPosition(latest);

      const handleMove = (moveEvent: PointerEvent) => {
        const maxX = Math.max(0, stage.clientWidth - start.width);
        const maxY = Math.max(0, stage.clientHeight - start.height);
        latest = {
          x: clamp(start.x + moveEvent.clientX - start.pointerX, 0, maxX),
          y: clamp(start.y + moveEvent.clientY - start.pointerY, 0, maxY),
        };
        setDragPosition(latest);
      };

      const handleUp = () => {
        window.removeEventListener('pointermove', handleMove);
        window.removeEventListener('pointerup', handleUp);
        const nextPlacement = snapToNearestEdge(
          latest.x,
          latest.y,
          start.width,
          start.height,
        );
        setPlacement(nextPlacement);
        savePanelPlacement(storageKey, nextPlacement);
        setDragPosition(null);
      };

      window.addEventListener('pointermove', handleMove);
      window.addEventListener('pointerup', handleUp, { once: true });
    },
    [snapToNearestEdge, stageRef, storageKey],
  );

  const style = dragPosition
    ? { left: dragPosition.x, top: dragPosition.y, transform: 'none' }
    : styleForPanelPlacement(placement, inset);

  return (
    <div
      ref={panelRef}
      className="pointer-events-auto absolute z-30 flex items-center gap-1"
      style={style}
    >
      <button
        type="button"
        className="flex size-7 cursor-grab items-center justify-center rounded-md border border-zinc-800 bg-zinc-950/85 text-zinc-500 shadow-lg backdrop-blur transition hover:border-zinc-600 hover:text-zinc-200 active:cursor-grabbing"
        title={`Move ${label}; release near an edge to stick`}
        aria-label={`Move ${label}`}
        onPointerDown={startDrag}
      >
        <GripVertical className="size-3.5" />
      </button>
      {children}
    </div>
  );
}

/**
 * Active on-canvas ability targeting, resolved by the owning view (via
 * `useTargetingResolution`). BattleStage turns this into the canvas-level range
 * ring / target highlights / AoE template and surfaces a cancel affordance.
 */
export interface BattleTargetingContext {
  sourceId: string;
  abilityName: string;
  parsedDistance: AbilityLogic.ParsedDistance;
  rangeSquares: GeometryLogic.GridPoint[];
  inRangeById: Record<string, boolean>;
  flankingByTargetId: Record<string, boolean>;
  highGroundByTargetId: Record<string, boolean>;
}

const AOE_TYPES: ReadonlySet<AbilityLogic.DistanceType> = new Set([
  'burst',
  'cube',
  'aura',
  'line',
  'wall',
]);

function entitySizeOf(entity: EntityData | undefined): number {
  const raw = entity?.['size'];
  const size = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(size) && size >= 1 ? Math.floor(size) : 1;
}

interface BattleStageProps {
  entities: EntityData[];
  combat: CombatState | null;
  selectedEntityId: string | null;
  selectedEntityIds?: string[];
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
  gridCellSize?: number;
  gridOffsetX?: number;
  gridOffsetY?: number;
  combatLog?: AbilityResult[];
  entityNames?: Map<string, string>;
  focusEntityRequest?: { entityId: string; nonce: number } | null;
  /** When set, the canvas is in on-canvas ability targeting mode. */
  targetingContext?: BattleTargetingContext | null;
  /** Fired when a target token is clicked while targeting. */
  onTargetConfirm?: (targetId: string) => void;
  /** Fired to leave targeting mode (cancel button / Escape). */
  onTargetCancel?: () => void;
  onSelectEntity: (entityId: string | null) => void;
  onSelectEntities?: (entityIds: string[]) => void;
  onRollInitiative?: () => void;
  send: (msg: ClientMessage) => void;
}

export function BattleStage({
  entities,
  combat,
  selectedEntityId,
  selectedEntityIds,
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
  gridCellSize = cellSize,
  gridOffsetX = 0,
  gridOffsetY = 0,
  combatLog,
  entityNames,
  focusEntityRequest,
  targetingContext = null,
  onTargetConfirm,
  onTargetCancel,
  onSelectEntity,
  onSelectEntities,
  onRollInitiative,
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
  const [bgNaturalSize, setBgNaturalSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const viewportRef = useRef<ViewportSystem | null>(null);
  const prevToolRef = useRef<BattleTool>('select');

  // Container ref for converting viewport coords → container-relative coords.
  // Overlays are `position: absolute` inside this `relative` container, so their
  // left/top must be relative to the container, not the viewport.
  const stageRef = useRef<HTMLDivElement>(null);

  // Multi-select state. Parent views own selection when they need to synchronize
  // tracker clicks with the map; the local fallback keeps the stage usable alone.
  const [localSelectedEntityIds, setLocalSelectedEntityIds] = useState<
    string[]
  >([]);
  const currentSelectedEntityIds = selectedEntityIds ?? localSelectedEntityIds;

  // Token hover / context menu overlays
  const [hoverInfo, setHoverInfo] = useState<{
    entityId: string;
    x: number;
    y: number;
  } | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    entityId: string;
    x: number;
    y: number;
  } | null>(null);
  const [terrainMenu, setTerrainMenu] = useState<{
    terrainId: string;
    x: number;
    y: number;
  } | null>(null);

  const entityMap = useMemo(
    () => new Map(entities.map((e) => [e.id, e])),
    [entities],
  );

  // Condition-adjusted movement remaining for the active combatant — drives the
  // costed drag path on the canvas (red when over speed).
  const activeMoverBudget = useMemo(() => {
    const activeId = combat?.activeEntityId;
    if (!activeId) return null;
    const turnState = combat?.turnActions?.[activeId];
    if (!turnState) return null;
    const entity = entityMap.get(activeId);
    const baseSpeed = typeof entity?.['speed'] === 'number' ? (entity['speed'] as number) : 5;
    const conditions = Array.isArray(entity?.['conditions'])
      ? (entity['conditions'] as ConditionName[])
      : [];
    const budget = MovementLogic.getMovementBudget(baseSpeed, turnState, conditions);
    return { entityId: activeId, remaining: budget.remaining };
  }, [combat, entityMap]);

  // Build the canvas-level targeting overlay (range ring, target footprints, and
  // a cursor-following AoE template for area abilities) from the resolved context.
  const canvasTargeting = useMemo<TargetingModeContext | null>(() => {
    if (!targetingContext) return null;
    const source = entityMap.get(targetingContext.sourceId);
    if (!source) return null;

    // Enemies only, matching the phone target picker. Source's own side is not
    // highlighted (avoids a green "valid target" ring on allies).
    const enemyType = source.type === 'hero' ? ['monster', 'npc'] : ['hero'];
    const targets = entities
      .filter((entity) => entity.id !== source.id && enemyType.includes(entity.type))
      .map((entity) => ({
        id: entity.id,
        footprint: { x: entity.x, y: entity.y, size: entitySizeOf(entity) },
        inRange: targetingContext.inRangeById[entity.id] ?? false,
        flanking: targetingContext.flankingByTargetId[entity.id] ?? false,
        highGround: targetingContext.highGroundByTargetId[entity.id] ?? false,
      }));

    const parsed = targetingContext.parsedDistance;
    let computeAoE: ((cursor: GeometryLogic.GridPoint) => GeometryLogic.GridPoint[]) | undefined;
    if (AOE_TYPES.has(parsed.type)) {
      const casterFootprint = GeometryLogic.makeFootprint(
        source.x,
        source.y,
        entitySizeOf(source),
      );
      const casterCenter = GeometryLogic.footprintCenter(casterFootprint);
      computeAoE = (cursor) =>
        GeometryLogic.getAffectedSquares(parsed, cursor, {
          casterFootprint,
          direction: {
            x: cursor.x - Math.round(casterCenter.x),
            y: cursor.y - Math.round(casterCenter.y),
          },
          bounds: { cols, rows },
        });
    }

    return {
      sourceId: source.id,
      rangeSquares: targetingContext.rangeSquares,
      targets,
      computeAoE,
    };
  }, [targetingContext, entities, entityMap, cols, rows]);

  // Escape leaves targeting mode (advisory cancel).
  useEffect(() => {
    if (!targetingContext) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onTargetCancel?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [targetingContext, onTargetCancel]);

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
        setTerrainMenu(null);
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

  const handleTerrainRightClick = useCallback(
    (terrainId: string | null, screenX: number, screenY: number) => {
      if (terrainId) {
        const { x, y } = toLocal(screenX, screenY);
        setTerrainMenu({ terrainId, x, y });
        setContextMenu(null);
        setHoverInfo(null);
      } else {
        setTerrainMenu(null);
      }
    },
    [toLocal],
  );

  const handleCloseTerrainMenu = useCallback(() => {
    setTerrainMenu(null);
  }, []);

  const handleMoveEntity = useCallback(
    (entityId: string, x: number, y: number) => {
      const entity = entityMap.get(entityId);
      if (!entity) {
        onSelectEntity(null);
        if (onSelectEntities) onSelectEntities([]);
        else setLocalSelectedEntityIds([]);
        return;
      }
      // During this token's combat turn, commit the move with its path so the
      // server records movement cost and opportunity attacks (advisory). Outside
      // combat (builder placement, off-turn repositioning) use a plain move.
      const isActiveCombatant = combat?.activeEntityId === entityId;
      const fromX = typeof entity.x === 'number' ? entity.x : null;
      const fromY = typeof entity.y === 'number' ? entity.y : null;
      if (isActiveCombatant && fromX !== null && fromY !== null && (fromX !== x || fromY !== y)) {
        send({
          type: 'commit_move',
          entityId,
          path: expandGridPath({ x: fromX, y: fromY }, { x, y }),
          mode: 'advance',
        });
      } else {
        send({ type: 'move_token', entityId, x, y });
      }
    },
    [entityMap, combat, onSelectEntities, onSelectEntity, send],
  );

  const handleSelectEntity = useCallback(
    (entityId: string | null) => {
      onSelectEntity(entityId);
      const nextIds = entityId ? [entityId] : [];
      if (onSelectEntities) onSelectEntities(nextIds);
      else setLocalSelectedEntityIds(nextIds);
    },
    [onSelectEntities, onSelectEntity],
  );

  const handleMultiSelectEntities = useCallback(
    (entityIds: string[]) => {
      if (onSelectEntities) onSelectEntities(entityIds);
      else setLocalSelectedEntityIds(entityIds);
    },
    [onSelectEntities],
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
      const drawing = {
        id: generateId(),
        type: 'freehand',
        points,
        color,
        width,
      };
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

  const handleFogRevealCell = useCallback(
    (gridX: number, gridY: number) => {
      for (const zone of fogZones) {
        const pieces = splitFogZoneAroundCell(zone, gridX, gridY);
        if (pieces.length === 1 && pieces[0] === zone) continue;
        send({ type: 'scene_fog_remove', fogId: zone.id });
        for (const piece of pieces) {
          send({ type: 'scene_fog_add', fog: piece });
        }
      }
    },
    [fogZones, send],
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

  const handleTerrainUpdate = useCallback(
    (terrainZone: TerrainZoneData) => {
      send({ type: 'scene_terrain_update', terrain: terrainZone });
    },
    [send],
  );

  const handleToggleTerrainHidden = useCallback(
    (terrainZone: TerrainZoneData) => {
      send({
        type: 'scene_terrain_update',
        terrain: { ...terrainZone, hidden: !terrainZone.hidden },
      });
    },
    [send],
  );

  useEffect(() => {
    const entityId = focusEntityRequest?.entityId;
    if (!entityId) return;
    const entity = entityMap.get(entityId);
    if (!entity) return;
    const size =
      typeof entity['size'] === 'number' ? (entity['size'] as number) : 1;
    viewportRef.current?.centerOnGrid(
      entity.x + Math.max(1, size) / 2,
      entity.y + Math.max(1, size) / 2,
      cellSize,
      1,
    );
  }, [cellSize, entityMap, focusEntityRequest]);

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
        case 'h':
          setActiveTool('pan');
          return;
        case 'v':
          setActiveTool('select');
          return;
        case 'd':
          setActiveTool('draw');
          return;
        case 'f':
          setActiveTool('fog');
          return;
        case 't':
          setActiveTool('terrain');
          return;
        case 'e':
          setActiveTool('eraser');
          return;
        case 'm':
          setActiveTool('measure');
          return;
        case 'g':
          setGridVisible((v) => !v);
          return;
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
        selectedEntityIds={currentSelectedEntityIds}
        backgroundUrl={backgroundUrl}
        isDirector={isDirector}
        heroPosition={heroPosition}
        fogZones={fogZones}
        onSelectEntity={handleSelectEntity}
        onMoveEntity={handleMoveEntity}
        onMultiSelectEntities={handleMultiSelectEntities}
        onMultiMoveEntities={handleMultiMoveEntities}
        activeMoverBudget={activeMoverBudget}
        targeting={canvasTargeting}
        onTargetConfirm={onTargetConfirm}
        builderMode={isDirector}
        activeTool={isDirector ? activeTool : 'select'}
        drawColor={drawColor}
        drawWidth={drawWidth}
        drawings={drawings}
        terrain={terrain}
        onDrawingAdd={handleDrawingAdd}
        onDrawingRemove={handleDrawingRemove}
        onTerrainAdd={handleTerrainAdd}
        onTerrainUpdate={handleTerrainUpdate}
        onTerrainRemove={handleTerrainRemove}
        onTerrainRightClick={handleTerrainRightClick}
        onFogAdd={handleFogAdd}
        onFogRemove={handleFogRemove}
        onFogRevealCell={handleFogRevealCell}
        fogBrushMode={fogBrushMode}
        fogBrushSize={fogBrushSize}
        gridVisible={gridVisible}
        gridOpacity={gridOpacity}
        gridColor={gridColor}
        gridCellSize={gridCellSize}
        gridOffsetX={gridOffsetX}
        gridOffsetY={gridOffsetY}
        onTokenHover={handleTokenHover}
        onTokenRightClick={handleTokenRightClick}
        onZoomChange={setZoom}
        onBackgroundLoaded={(info) =>
          setBgNaturalSize({
            width: info.naturalWidth,
            height: info.naturalHeight,
          })
        }
        viewportRef={viewportRef}
      />

      {combat && isInitiativePending(combat) && (
        <div className="pointer-events-none absolute inset-x-4 top-20 z-30 flex justify-center">
          <div className="pointer-events-auto max-w-sm rounded-lg border border-amber-500/40 bg-zinc-950/90 p-4 text-center shadow-2xl backdrop-blur">
            <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-amber-500/15 text-amber-200">
              <Dices className="size-5" />
            </div>
            <p className="mt-3 text-sm font-semibold text-zinc-100">
              Players roll initiative
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              Roll 1d10. On 6 or higher, heroes act first.
            </p>
            {isDirector || !onRollInitiative ? (
              <p className="mt-3 rounded border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-xs text-zinc-400">
                Waiting for a player to roll.
              </p>
            ) : (
              <button
                type="button"
                className="mt-3 inline-flex h-9 items-center justify-center rounded-md bg-amber-500 px-4 text-sm font-semibold text-anvil-ink transition hover:bg-amber-400"
                onClick={onRollInitiative}
              >
                Roll d10
              </button>
            )}
          </div>
        </div>
      )}

      {/* On-canvas targeting banner (advisory) */}
      {targetingContext && (
        <div className="pointer-events-none absolute inset-x-4 top-16 z-40 flex justify-center">
          <div className="pointer-events-auto flex items-center gap-3 rounded-lg border border-amber-500/40 bg-zinc-950/90 px-4 py-2 text-xs text-amber-100 shadow-xl backdrop-blur">
            <span>
              Click a target for{' '}
              <span className="font-semibold text-amber-300">
                {targetingContext.abilityName}
              </span>
            </span>
            <span className="flex items-center gap-2 border-l border-zinc-700 pl-3 text-[10px] text-zinc-400">
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-emerald-400" />
                flank
              </span>
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-sky-400" />
                high ground
              </span>
            </span>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded border border-zinc-700 px-2 py-0.5 text-[11px] font-medium text-zinc-300 transition hover:border-zinc-500 hover:text-zinc-100"
              onClick={() => onTargetCancel?.()}
            >
              <X className="size-3" />
              Cancel <span className="text-zinc-500">Esc</span>
            </button>
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-4 top-3 z-30 flex justify-center">
        {combat && (
          <BattleTurnTracker
            combat={combat}
            entities={entities}
            onRollInitiative={
              isInitiativePending(combat) ? undefined : onRollInitiative
            }
            className="pointer-events-auto"
          />
        )}
      </div>

      <div className="pointer-events-none absolute bottom-4 right-4 z-30">
        <DiceRollControls send={send} className="pointer-events-auto" />
      </div>

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
          orientation="vertical"
          viewportControls={
            <ViewportControls
              zoom={zoom}
              orientation="vertical"
              className="flex flex-col items-center gap-1"
              onZoomIn={() => viewportRef.current?.zoomIn()}
              onZoomOut={() => viewportRef.current?.zoomOut()}
              onFitToMap={() => {
                const fitW = bgNaturalSize?.width ?? cols * cellSize;
                const fitH = bgNaturalSize?.height ?? rows * cellSize;
                viewportRef.current?.fitToRect(fitW, fitH);
              }}
            />
          }
        />
      )}

      {!isDirector && (
        <FloatingStagePanel
          storageKey="anvil-session-stage-viewport-controls"
          initialPlacement={{ edge: 'right', offset: 0.86 }}
          stageRef={stageRef}
          inset={16}
          label="zoom controls"
        >
          <ViewportControls
            zoom={zoom}
            className="flex flex-col items-center gap-1 rounded-lg bg-zinc-900/90 p-1.5 shadow-lg backdrop-blur-sm"
            onZoomIn={() => viewportRef.current?.zoomIn()}
            onZoomOut={() => viewportRef.current?.zoomOut()}
            onFitToMap={() => {
              const fitW = bgNaturalSize?.width ?? cols * cellSize;
              const fitH = bgNaturalSize?.height ?? rows * cellSize;
              viewportRef.current?.fitToRect(fitW, fitH);
            }}
          />
        </FloatingStagePanel>
      )}

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
          entities={entities}
          selectedTargetId={selectedEntityId}
          x={contextMenu.x}
          y={contextMenu.y}
          isDirector={isDirector}
          send={send}
          onClose={handleCloseContextMenu}
        />
      )}

      {terrainMenu &&
        terrain.find((zone) => zone.id === terrainMenu.terrainId) && (
          <TerrainContextMenu
            terrain={terrain.find((zone) => zone.id === terrainMenu.terrainId)!}
            x={terrainMenu.x}
            y={terrainMenu.y}
            onToggleHidden={handleToggleTerrainHidden}
            onDelete={handleTerrainRemove}
            onClose={handleCloseTerrainMenu}
          />
        )}
    </div>
  );
}
