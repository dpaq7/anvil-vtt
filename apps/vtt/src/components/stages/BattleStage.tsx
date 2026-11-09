import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { AbilityLogic, GeometryLogic, MovementLogic } from '@anvil/data';
import type { ConditionName } from '@anvil/types';
import { BattleCanvas } from '../../canvas/BattleCanvas.js';
import type { TargetingModeContext } from '../../canvas/systems/InteractionManager.js';
import type { PendingTargetedAction } from '../../lib/targeting.js';
import { conditionNames } from '../../lib/conditions.js';
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
import { MapTools, ToolOptions } from '../session/battle/MapTools.js';
import { MapNav } from '../session/battle/MapNav.js';
import { SMALL_SESSION, useMediaQuery } from '../session/battle/hooks.js';
import { useSessionConnection } from '../session/shell/connection-context.js';
import { useSessionStore } from '../../stores/sessionStore.js';
import { isInOverlay, isKeyOwner } from '../../hooks/useKeyboardShortcuts.js';
import { TokenTooltip } from '../session/TokenTooltip.js';
import { TokenContextMenu } from '../session/TokenContextMenu.js';
import { TerrainContextMenu } from '../session/TerrainContextMenu.js';
import { CANVAS_THEME, GRID_DEFAULT_ALPHA } from '../../canvas/theme.js';

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
  /** Begin on-canvas targeting for a token-menu action (ability / strike / maneuver). */
  onRequestTargeting?: (action: PendingTargetedAction) => void;
  /** The requesting player's own hero id (lets them act on that token's menu). */
  ownHeroEntityId?: string | null;
  onSelectEntity: (entityId: string | null) => void;
  onSelectEntities?: (entityIds: string[]) => void;
  onRollInitiative?: () => void;
  send: (msg: ClientMessage) => void;
  /** False on the read-only Display: no tools, dice, zoom or mini-map. */
  showDiceControls?: boolean;
  /** The token a roll from the bar opens beside. */
  rollAnchorId?: string | null;
  /** The bar under the screen. Tools and dice render into it. */
  barTarget?: HTMLElement | null;
  /** Changes with the live scene, so a new scene opens on its own action. */
  sceneKey?: string | null;
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
  gridOpacity = GRID_DEFAULT_ALPHA,
  gridColor = CANVAS_THEME.dark.gridDefaultHex,
  gridCellSize = cellSize,
  gridOffsetX = 0,
  gridOffsetY = 0,
  combatLog,
  entityNames,
  focusEntityRequest,
  targetingContext = null,
  onTargetConfirm,
  onTargetCancel,
  onRequestTargeting,
  ownHeroEntityId = null,
  onSelectEntity,
  onSelectEntities,
  onRollInitiative,
  send,
  showDiceControls = true,
  rollAnchorId = null,
  barTarget = null,
  sceneKey = null,
}: BattleStageProps) {
  // During a drop the map stays readable and only pans: drags and tools need the server.
  const { paused } = useSessionConnection();
  const small = useMediaQuery(SMALL_SESSION);
  const lastRoll = useSessionStore((s) => s.lastRoll);
  // Tool state (director only)
  const [activeTool, setActiveTool] = useState<BattleTool>('select');
  // Players don't get the full toolbar, but can toggle select/pan on the canvas.
  const [playerTool, setPlayerTool] = useState<BattleTool>('select');
  const [drawColor, setDrawColor] = useState(CANVAS_THEME.dark.drawDefault);
  const [drawWidth, setDrawWidth] = useState(2);
  const [fogBrushMode, setFogBrushMode] = useState<FogBrushMode>('draw');
  const [fogBrushSize, setFogBrushSize] = useState(1);
  const [gridVisible, setGridVisible] = useState(true);

  // Optimistic overlays: the director's own drawings/fog render locally the
  // instant they're committed, rather than waiting for the server echo (the
  // pen preview is torn down on pointer-up). Each item is pruned once its id
  // appears in the synced server props, which then become the source of truth.
  const [optimisticDrawings, setOptimisticDrawings] = useState<DrawingData[]>(
    [],
  );
  const [optimisticFog, setOptimisticFog] = useState<FogZoneData[]>([]);

  // Manual cover advisory shown while targeting (advisory only — feeds the
  // banes readout in the targeting banner, never sent).
  const [coverLevel, setCoverLevel] = useState<AbilityLogic.CoverLevel>('none');

  // Viewport
  const [bgNaturalSize, setBgNaturalSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const viewportRef = useRef<ViewportSystem | null>(null);
  const prevToolRef = useRef<BattleTool>('select');
  const spacePanRef = useRef(false);

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

  // Battle opens on the action for the Director, and on their own token for a Player. Camera only:
  // "Show all", the mini-map and "N above view" keep the whole map in reach.
  const openedSceneRef = useRef<string | null | undefined>(undefined);
  const worldWidth = Math.max(bgNaturalSize?.width ?? 0, cols * cellSize);
  const worldHeight = Math.max(bgNaturalSize?.height ?? 0, rows * cellSize);
  useEffect(() => {
    if (openedSceneRef.current === sceneKey) return;
    const timer = setInterval(() => {
      const viewport = viewportRef.current;
      if (!viewport || !showDiceControls) return;
      const { width, height } = viewport.getViewSize();
      if (width < 50 || height < 50 || openedSceneRef.current === sceneKey) return;
      openedSceneRef.current = sceneKey;
      clearInterval(timer);
      const own = ownHeroEntityId ? entityMap.get(ownHeroEntityId) : undefined;
      const acting = combat?.activeEntityId ? entityMap.get(combat.activeEntityId) : undefined;
      const focus = isDirector ? acting : (own ?? acting);
      const others = entities.filter((e) => e.type !== 'npc');
      if (!focus && others.length === 0) {
        viewport.fitToRect(worldWidth, worldHeight);
        return;
      }
      const cx = focus ? focus.x + entitySizeOf(focus) / 2 : others.reduce((n, e) => n + e.x + 0.5, 0) / others.length;
      const cy = focus ? focus.y + entitySizeOf(focus) / 2 : others.reduce((n, e) => n + e.y + 0.5, 0) / others.length;
      // About 17 squares across, as in the demos. The map fills the screen wherever it can.
      const zoom = Math.max(0.25, Math.min(1.25, width / (17 * cellSize)));
      viewport.centerOnGrid(cx, cy, cellSize, zoom);
      const pan = viewport.getPan();
      const fit = (value: number, view: number, world: number) =>
        world * zoom <= view ? (view - world * zoom) / 2 : Math.min(0, Math.max(view - world * zoom, value));
      viewport.setPan(fit(pan.x, width, worldWidth), fit(pan.y, height, worldHeight));
    }, 120);
    return () => clearInterval(timer);
  }, [sceneKey, showDiceControls, entityMap, entities, combat?.activeEntityId, ownHeroEntityId, isDirector, cellSize, worldWidth, worldHeight]);

  const showAll = useCallback(() => {
    viewportRef.current?.fitToRect(worldWidth, worldHeight);
  }, [worldWidth, worldHeight]);

  /** Where a token is on screen, relative to the stage. Popovers open beside it. */
  const tokenRect = useCallback(
    (entityId: string) => {
      const entity = entityMap.get(entityId);
      const viewport = viewportRef.current;
      if (!entity || !viewport) return null;
      const pan = viewport.getPan();
      const zoom = viewport.getZoom();
      const px = entitySizeOf(entity) * cellSize * zoom;
      return { x: pan.x + entity.x * cellSize * zoom, y: pan.y + entity.y * cellSize * zoom, w: px, h: px };
    },
    [entityMap, cellSize],
  );
  // Dev only: lets the browser journey find a grid square on the canvas.
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const probe = window as unknown as { __anvilGridToClient?: (gx: number, gy: number) => { x: number; y: number } | null };
    probe.__anvilGridToClient = (gx, gy) => {
      const viewport = viewportRef.current;
      const rect = stageRef.current?.getBoundingClientRect();
      if (!viewport || !rect) return null;
      const pan = viewport.getPan();
      const zoom = viewport.getZoom();
      return { x: rect.left + pan.x + gx * cellSize * zoom, y: rect.top + pan.y + gy * cellSize * zoom };
    };
    return () => {
      delete probe.__anvilGridToClient;
    };
  }, [cellSize]);
  const stageSize = useCallback(
    () => ({ width: stageRef.current?.clientWidth ?? 800, height: stageRef.current?.clientHeight ?? 600 }),
    [],
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
    const conditions = conditionNames(entity) as ConditionName[];
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

  // Escape leaves targeting mode (advisory cancel); each new targeting session
  // starts from no cover.
  useEffect(() => {
    if (!targetingContext) return;
    setCoverLevel('none');
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
        // Sits above the token, never over it.
        const rect = tokenRect(entityId);
        const { x, y } = rect ? { x: rect.x + rect.w / 2, y: rect.y } : toLocal(screenX, screenY);
        setHoverInfo({ entityId, x, y });
      } else {
        setHoverInfo(null);
      }
    },
    [toLocal, tokenRect],
  );

  const handleTokenRightClick = useCallback(
    (entityId: string | null, screenX: number, screenY: number) => {
      if (entityId) {
        const local = toLocal(screenX, screenY);
        const rect = tokenRect(entityId);
        // Opens beside the token, never over it. The menu flips left when it would run off.
        setContextMenu({ entityId, x: rect ? rect.x + rect.w + 8 : local.x, y: rect ? rect.y : local.y });
        setTerrainMenu(null);
        setHoverInfo(null); // hide tooltip when context menu opens
      } else {
        // Right-clicked on empty space — close any open context menu
        setContextMenu(null);
      }
    },
    [toLocal, tokenRect],
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

  // Drawing handlers — sync via WebSocket, rendered optimistically
  const handleDrawingAdd = useCallback(
    (points: number[], color: string, width: number) => {
      if (color === 'none') return; // Blank color — no stroke
      const drawing: DrawingData = {
        id: generateId(),
        type: 'freehand',
        points,
        color,
        width,
      };
      setOptimisticDrawings((prev) => [...prev, drawing]);
      send({ type: 'scene_drawing_add', drawing });
    },
    [send],
  );

  const handleDrawingRemove = useCallback(
    (drawingId: string) => {
      setOptimisticDrawings((prev) => prev.filter((d) => d.id !== drawingId));
      send({ type: 'scene_drawing_remove', drawingId });
    },
    [send],
  );

  // Fog handlers — sync via WebSocket, rendered optimistically
  const handleFogAdd = useCallback(
    (gridX: number, gridY: number, w: number, h: number) => {
      const fog: FogZoneData = { id: generateId(), x: gridX, y: gridY, w, h };
      setOptimisticFog((prev) => [...prev, fog]);
      send({ type: 'scene_fog_add', fog });
    },
    [send],
  );

  const handleFogRemove = useCallback(
    (fogId: string) => {
      setOptimisticFog((prev) => prev.filter((z) => z.id !== fogId));
      send({ type: 'scene_fog_remove', fogId });
    },
    [send],
  );

  const handleFogRevealCell = useCallback(
    (gridX: number, gridY: number) => {
      // Reveal against the merged view so freshly-painted (still-optimistic)
      // fog can also be carved out before the server round-trip completes.
      const zones = [
        ...fogZones,
        ...optimisticFog.filter((z) => !fogZones.some((f) => f.id === z.id)),
      ];
      for (const zone of zones) {
        const pieces = splitFogZoneAroundCell(zone, gridX, gridY);
        if (pieces.length === 1 && pieces[0] === zone) continue;
        setOptimisticFog((prev) => [
          ...prev.filter((z) => z.id !== zone.id),
          ...pieces,
        ]);
        send({ type: 'scene_fog_remove', fogId: zone.id });
        for (const piece of pieces) {
          send({ type: 'scene_fog_add', fog: piece });
        }
      }
    },
    [fogZones, optimisticFog, send],
  );

  const handleClearFog = useCallback(() => {
    setOptimisticFog([]);
    for (const zone of fogZones) {
      send({ type: 'scene_fog_remove', fogId: zone.id });
    }
  }, [fogZones, send]);

  // Prune optimistic overlays once the server confirms them (their id appears
  // in the synced props) so the merged view can't double-render or grow
  // unbounded. Server state is authoritative from that point on.
  useEffect(() => {
    if (optimisticDrawings.length === 0) return;
    const serverIds = new Set(drawings.map((d) => d.id));
    if (optimisticDrawings.some((d) => serverIds.has(d.id))) {
      setOptimisticDrawings((prev) => prev.filter((d) => !serverIds.has(d.id)));
    }
  }, [drawings, optimisticDrawings]);

  useEffect(() => {
    if (optimisticFog.length === 0) return;
    const serverIds = new Set(fogZones.map((z) => z.id));
    if (optimisticFog.some((z) => serverIds.has(z.id))) {
      setOptimisticFog((prev) => prev.filter((z) => !serverIds.has(z.id)));
    }
  }, [fogZones, optimisticFog]);

  const mergedDrawings = useMemo(() => {
    if (optimisticDrawings.length === 0) return drawings;
    const serverIds = new Set(drawings.map((d) => d.id));
    return [
      ...drawings,
      ...optimisticDrawings.filter((d) => !serverIds.has(d.id)),
    ];
  }, [drawings, optimisticDrawings]);

  const mergedFog = useMemo(() => {
    if (optimisticFog.length === 0) return fogZones;
    const serverIds = new Set(fogZones.map((z) => z.id));
    return [...fogZones, ...optimisticFog.filter((z) => !serverIds.has(z.id))];
  }, [fogZones, optimisticFog]);

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
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || isInOverlay(e.target)) return;

      // Space hold for temporary pan. Space on a focused button presses that button.
      if (e.key === ' ') {
        if (isKeyOwner(e.target)) return;
        e.preventDefault();
        if (e.repeat) return;
        prevToolRef.current = activeTool;
        spacePanRef.current = true;
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
      if (e.key === ' ' && spacePanRef.current) {
        spacePanRef.current = false;
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
    <div ref={stageRef} className="relative h-full w-full overflow-hidden">
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
        fogZones={mergedFog}
        onSelectEntity={handleSelectEntity}
        onMoveEntity={handleMoveEntity}
        onMultiSelectEntities={handleMultiSelectEntities}
        onMultiMoveEntities={handleMultiMoveEntities}
        activeMoverBudget={activeMoverBudget}
        targeting={canvasTargeting}
        onTargetConfirm={onTargetConfirm}
        actedEntityIds={combat?.actedThisRound}
        activeEntityId={combat?.activeEntityId ?? null}
        builderMode={isDirector}
        activeTool={paused ? 'pan' : isDirector ? activeTool : playerTool}
        combat={combat}
        ownEntityId={ownHeroEntityId}
        drawColor={drawColor}
        drawWidth={drawWidth}
        drawings={mergedDrawings}
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
        onBackgroundLoaded={(info) =>
          setBgNaturalSize({
            width: info.naturalWidth,
            height: info.naturalHeight,
          })
        }
        viewportRef={viewportRef}
      />

      {combat && isInitiativePending(combat) && showDiceControls && (
        <div className="sb-pop sb-screen-msg" data-map-panel>
          <strong>{isDirector || !onRollInitiative ? 'Waiting for a player to roll' : 'Players roll initiative'}</strong>
          <p className="sb-note">Roll 1d10. On 6 or higher, heroes act first.</p>
          {!isDirector && onRollInitiative && (
            <button
              type="button"
              className="sb-end my-1 w-full"
              data-wait={paused || undefined}
              disabled={paused}
              onClick={onRollInitiative}
            >
              {paused ? 'Roll d10, when back' : 'Roll d10'}
            </button>
          )}
        </div>
      )}

      {/* On-canvas targeting banner (advisory) */}
      {targetingContext && (
        <div className="sb-pop sb-target-bar" data-map-panel>
          <span>
            Click a target for <b>{targetingContext.abilityName}</b>
          </span>
          <span className="flex items-center gap-1">
            <i className="size-2.5 rounded-full bg-[var(--art-active-plate)]" aria-hidden="true" />
            flank
          </span>
          <span className="flex items-center gap-1">
            <i className="size-2.5 rotate-45 bg-[var(--art-ink)]" aria-hidden="true" />
            high ground
          </span>
          <label className="flex items-center gap-1">
            Cover
            <select
              value={coverLevel}
              onChange={(e) => setCoverLevel(e.target.value as AbilityLogic.CoverLevel)}
              className="h-6 bg-raised px-1 text-[13px] text-text shadow-[inset_0_0_0_1.5px_var(--color-line)]"
            >
              <option value="none">none</option>
              <option value="half">half</option>
              <option value="three-quarters">¾</option>
              <option value="full">full</option>
            </select>
            {coverLevel !== 'none' && (
              <b>
                {coverLevel === 'full'
                  ? 'no target'
                  : `+${AbilityLogic.getCoverBanes(coverLevel)} bane${
                      AbilityLogic.getCoverBanes(coverLevel) > 1 ? 's' : ''
                    }`}
              </b>
            )}
          </label>
          <button type="button" className="sb-link inline-flex items-center gap-1" onClick={() => onTargetCancel?.()}>
            <X className="size-3.5" aria-hidden="true" />
            Cancel, Esc
          </button>
        </div>
      )}

      {combat && <BattleTurnTracker combat={combat} entities={entities} />}

      {showDiceControls && (
        <MapNav
          viewportRef={viewportRef}
          entities={entities}
          fogZones={mergedFog}
          isDirector={isDirector}
          cols={cols}
          rows={rows}
          cellSize={cellSize}
          worldWidth={worldWidth}
          worldHeight={worldHeight}
          backgroundUrl={backgroundUrl}
          onShowAll={showAll}
        />
      )}

      {isDirector && !paused && (
        <ToolOptions
          tool={activeTool}
          drawColor={drawColor}
          onDrawColor={setDrawColor}
          drawWidth={drawWidth}
          onDrawWidth={setDrawWidth}
          fogZoneCount={fogZones.length}
          fogBrushMode={fogBrushMode}
          onFogBrushMode={setFogBrushMode}
          fogBrushSize={fogBrushSize}
          onFogBrushSize={setFogBrushSize}
          onClearFog={handleClearFog}
        />
      )}

      {/* The bar under the screen: the tools, and the same dice in every mode. */}
      {showDiceControls &&
        barTarget &&
        createPortal(
          <div className="sb-bar-host">
            <MapTools
              isDirector={isDirector}
              tool={isDirector ? activeTool : playerTool}
              onTool={isDirector ? setActiveTool : setPlayerTool}
            />
            <DiceRollControls send={send} variant="bar" fold={isDirector && small} />
          </div>,
          barTarget,
        )}

      {/* Power rolls open beside the token */}
      {combatLog && entityNames && (
        <DiceTray
          entries={combatLog}
          lastRoll={lastRoll}
          rollAnchorId={rollAnchorId}
          entityNames={entityNames}
          anchorFor={tokenRect}
          stageSize={stageSize}
        />
      )}

      {/* Token hover tooltip */}
      {hoverInfo && !contextMenu && entityMap.get(hoverInfo.entityId) && (
        <TokenTooltip
          entity={entityMap.get(hoverInfo.entityId)!}
          x={hoverInfo.x}
          y={hoverInfo.y}
          isDirector={isDirector}
        />
      )}

      {/* Token right-click context menu */}
      {contextMenu && entityMap.get(contextMenu.entityId) && (
        <TokenContextMenu
          entity={entityMap.get(contextMenu.entityId)!}
          x={contextMenu.x}
          y={contextMenu.y}
          tokenWidth={tokenRect(contextMenu.entityId)?.w ?? 0}
          stageWidth={stageSize().width}
          stageHeight={stageSize().height}
          isDirector={isDirector}
          ownHeroEntityId={ownHeroEntityId}
          send={send}
          onRequestTargeting={(action) => {
            handleCloseContextMenu();
            onRequestTargeting?.(action);
          }}
          onClose={handleCloseContextMenu}
        />
      )}

      {terrainMenu &&
        terrain.find((zone) => zone.id === terrainMenu.terrainId) && (
          <TerrainContextMenu
            terrain={terrain.find((zone) => zone.id === terrainMenu.terrainId)!}
            x={terrainMenu.x}
            y={terrainMenu.y}
            stageWidth={stageSize().width}
            stageHeight={stageSize().height}
            onToggleHidden={handleToggleTerrainHidden}
            onDelete={handleTerrainRemove}
            onClose={handleCloseTerrainMenu}
          />
        )}
    </div>
  );
}
