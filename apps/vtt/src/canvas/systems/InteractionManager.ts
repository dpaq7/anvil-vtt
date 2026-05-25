import type { ViewportSystem } from './ViewportSystem.js';
import type { TokenLayer } from '../layers/TokenLayer.js';
import type { DrawingLayer } from '../layers/DrawingLayer.js';
import type { TerrainLayer, TerrainZoneData } from '../layers/TerrainLayer.js';
import type { FogLayer } from '../layers/FogLayer.js';
import { Quadtree } from './Quadtree.js';

export type ActiveTool =
  | 'select'
  | 'draw'
  | 'fog'
  | 'terrain'
  | 'eraser'
  | 'pan';

const ERASER_CURSOR =
  'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2724%27 height=%2724%27 viewBox=%270 0 24 24%27%3E%3Cpath fill=%27%23f8fafc%27 stroke=%27%230f172a%27 stroke-width=%271.5%27 stroke-linejoin=%27round%27 d=%27M15.7 3.8 21 9.1 11.1 19H5.8L3 16.2z%27/%3E%3Cpath fill=%27none%27 stroke=%27%230f172a%27 stroke-width=%271.5%27 stroke-linecap=%27round%27 d=%27M12.1 7.4l5.3 5.3M5.8 19H21%27/%3E%3C/svg%3E") 4 20, auto';

export interface InteractionCallbacks {
  onTokenSelect: (entityId: string | null) => void;
  onTokenMove: (entityId: string, gridX: number, gridY: number) => void;
  onMultiTokenSelect?: (entityIds: string[]) => void;
  onMultiTokenMove?: (
    moves: Array<{ entityId: string; gridX: number; gridY: number }>,
  ) => void;
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
  onFogAdd?: (gridX: number, gridY: number, w: number, h: number) => void;
  onFogRemove?: (fogId: string) => void;
  onFogRevealCell?: (gridX: number, gridY: number) => void;
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

export class InteractionManager {
  private quadtree: Quadtree<string>;
  private selectedId: string | null = null;
  private selectedIds = new Set<string>();
  private dragging = false;
  private dragEntityId: string | null = null;
  private isDirector: boolean;
  private _activeTool: ActiveTool = 'select';
  private activePointerId: number | null = null;

  // Drag origin (for distance calculation)
  private dragOriginGrid: { gridX: number; gridY: number } | null = null;

  // Group drag state
  private groupDragging = false;
  private groupDragAnchorGrid: { gridX: number; gridY: number } | null = null;
  private groupDragLastGrid: { gridX: number; gridY: number } | null = null;

  // Marquee (box selection) state
  private marqueeActive = false;
  private marqueeStartWorld: { x: number; y: number } | null = null;

  // Drawing state
  private isDrawing = false;
  private drawPoints: number[] = [];
  private drawColor = '#ef4444';
  private drawWidth = 2;

  // Terrain placement state
  private terrainStart: { gridX: number; gridY: number } | null = null;
  private terrainDragging: {
    id: string;
    startGrid: { gridX: number; gridY: number };
    original: TerrainZoneData;
  } | null = null;
  private terrainResizing: {
    id: string;
    original: TerrainZoneData;
  } | null = null;

  // Fog brush state
  private fogStart: { gridX: number; gridY: number } | null = null;
  private fogMode: 'draw' | 'reveal' = 'draw';
  private fogBrushSize = 1;
  private fogBrushLastKey: string | null = null;

  // Hover state
  private hoveredId: string | null = null;

  // Optional layers (only present in builder mode)
  private drawingLayer: DrawingLayer | null = null;
  private terrainLayer: TerrainLayer | null = null;
  private fogLayer: FogLayer | null = null;

  constructor(
    private canvas: HTMLCanvasElement,
    private viewport: ViewportSystem,
    private tokenLayer: TokenLayer,
    private cellSize: number,
    private callbacks: InteractionCallbacks,
    private gridBounds: { cols: number; rows: number },
    isDirector: boolean,
  ) {
    this.isDirector = isDirector;
    this.quadtree = new Quadtree({ x: 0, y: 0, width: 10000, height: 10000 });
    this.bindEvents();
  }

  /** Attach optional layers for builder mode */
  setBuilderLayers(
    drawing: DrawingLayer | null,
    terrain: TerrainLayer | null,
    fog: FogLayer | null = null,
  ): void {
    this.drawingLayer = drawing;
    this.terrainLayer = terrain;
    this.fogLayer = fog;
  }

  get activeTool(): ActiveTool {
    return this._activeTool;
  }

  setActiveTool(tool: ActiveTool): void {
    // Cancel any in-progress interaction when switching tools
    this.cancelCurrentInteraction();
    this._activeTool = tool;
    // Toggle left-click panning in ViewportSystem
    this.viewport.setLeftClickPanEnabled(tool === 'pan');
    this.canvas.style.cursor = tool === 'eraser' ? 'default' : '';
  }

  /** Update cell size (e.g. when background image changes aspect ratio). */
  setCellSize(size: number): void {
    this.cellSize = size;
  }

  setGridBounds(bounds: { cols: number; rows: number }): void {
    this.gridBounds = bounds;
  }

  /** Update callbacks to avoid stale closures (called on every render). */
  setCallbacks(callbacks: InteractionCallbacks): void {
    this.callbacks = callbacks;
  }

  setDrawConfig(color: string, width: number): void {
    this.drawColor = color;
    this.drawWidth = width;
  }

  setFogConfig(mode: 'draw' | 'reveal', brushSize: number): void {
    this.fogMode = mode;
    this.fogBrushSize = Math.max(1, Math.min(10, Math.round(brushSize)));
    this.fogBrushLastKey = null;
  }

  /** Get the current set of selected entity IDs (for external state sync). */
  getSelectedIds(): Set<string> {
    return this.selectedIds;
  }

  /** Set selection from external state (e.g. React). */
  setSelectedIds(ids: Set<string>): void {
    this.selectedIds = ids;
    this.selectedId = [...ids][0] ?? null;
  }

  private cancelCurrentInteraction(): void {
    this.releaseActivePointer();
    this.dragging = false;
    this.dragEntityId = null;
    this.dragOriginGrid = null;
    this.groupDragging = false;
    this.groupDragAnchorGrid = null;
    this.groupDragLastGrid = null;
    this.marqueeActive = false;
    this.marqueeStartWorld = null;
    this.tokenLayer.clearSelectionRect();
    this.tokenLayer.clearDistanceLabel();
    this.isDrawing = false;
    this.drawPoints = [];
    this.terrainStart = null;
    this.terrainDragging = null;
    this.terrainResizing = null;
    this.fogStart = null;
    this.fogBrushLastKey = null;
    // Clean up any in-progress previews
    this.drawingLayer?.clearPreview();
    this.terrainLayer?.clearPreview();
    this.fogLayer?.clearPreview();
  }

  private bindEvents(): void {
    this.canvas.addEventListener('pointerdown', this.onPointerDown);
    this.canvas.addEventListener('pointermove', this.onPointerMove);
    this.canvas.addEventListener('pointerup', this.onPointerUp);
    this.canvas.addEventListener('pointerleave', this.onPointerLeave);
    this.canvas.addEventListener('pointercancel', this.onPointerCancel);
    this.canvas.addEventListener('contextmenu', this.onContextMenu);
  }

  destroy(): void {
    this.releaseActivePointer();
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    this.canvas.removeEventListener('pointermove', this.onPointerMove);
    this.canvas.removeEventListener('pointerup', this.onPointerUp);
    this.canvas.removeEventListener('pointerleave', this.onPointerLeave);
    this.canvas.removeEventListener('pointercancel', this.onPointerCancel);
    this.canvas.removeEventListener('contextmenu', this.onContextMenu);
    this.canvas.style.cursor = '';
  }

  private capturePointer(pointerId: number): void {
    try {
      this.canvas.setPointerCapture(pointerId);
      this.activePointerId = pointerId;
    } catch {
      this.activePointerId = pointerId;
    }
  }

  private releaseActivePointer(): void {
    const pointerId = this.activePointerId;
    if (pointerId === null) return;

    try {
      if (this.canvas.hasPointerCapture(pointerId)) {
        this.canvas.releasePointerCapture(pointerId);
      }
    } catch {
      /* Pointer capture can already be gone after browser cancellation. */
    }

    this.activePointerId = null;
  }

  rebuildIndex(): void {
    this.tokenLayer.buildIndex(this.quadtree);
  }

  private clampGrid(
    gridX: number,
    gridY: number,
  ): { gridX: number; gridY: number } {
    return {
      gridX: Math.max(0, Math.min(this.gridBounds.cols - 1, gridX)),
      gridY: Math.max(0, Math.min(this.gridBounds.rows - 1, gridY)),
    };
  }

  private clampTerrain(zone: TerrainZoneData): TerrainZoneData {
    const w = Math.max(1, Math.min(this.gridBounds.cols, Math.round(zone.w)));
    const h = Math.max(1, Math.min(this.gridBounds.rows, Math.round(zone.h)));
    return {
      ...zone,
      x: Math.max(0, Math.min(this.gridBounds.cols - w, Math.round(zone.x))),
      y: Math.max(0, Math.min(this.gridBounds.rows - h, Math.round(zone.y))),
      w,
      h,
    };
  }

  private screenToGrid(
    clientX: number,
    clientY: number,
  ): { gridX: number; gridY: number } {
    const { gridX, gridY } = this.viewport.screenToGrid(
      clientX,
      clientY,
      this.cellSize,
    );
    return this.clampGrid(gridX, gridY);
  }

  private screenToWorld(
    clientX: number,
    clientY: number,
  ): { worldX: number; worldY: number } {
    const rect = this.canvas.getBoundingClientRect();
    const pan = this.viewport.getPan();
    const zoom = this.viewport.getZoom();
    const worldX = (clientX - rect.left - pan.x) / zoom;
    const worldY = (clientY - rect.top - pan.y) / zoom;
    return { worldX, worldY };
  }

  private onPointerDown = (e: PointerEvent): void => {
    if (e.button !== 0) return; // Left click only
    if (this._activeTool === 'pan') return; // Let ViewportSystem handle
    if (this.activePointerId !== null) return;
    this.capturePointer(e.pointerId);
    e.preventDefault();
    const { gridX, gridY } = this.screenToGrid(e.clientX, e.clientY);

    switch (this._activeTool) {
      case 'select':
        this.handleSelectDown(e, gridX, gridY);
        break;
      case 'draw':
        this.handleDrawDown(e);
        break;
      case 'eraser':
        this.handleEraserDown(e, gridX, gridY);
        break;
      case 'terrain':
        this.handleTerrainDown(gridX, gridY);
        break;
      case 'fog':
        this.handleFogDown(gridX, gridY);
        break;
    }
  };

  private onPointerMove = (e: PointerEvent): void => {
    if (this._activeTool === 'pan') return;
    if (this.activePointerId !== null && e.pointerId !== this.activePointerId) return;
    switch (this._activeTool) {
      case 'select':
        this.handleSelectMove(e);
        break;
      case 'draw':
        this.handleDrawMove(e);
        break;
      case 'terrain':
        this.handleTerrainMove(e);
        break;
      case 'fog':
        this.handleFogMove(e);
        break;
      case 'eraser':
        this.handleEraserMove(e);
        break;
    }
  };

  private onPointerLeave = (): void => {
    if (this._activeTool === 'eraser') {
      this.canvas.style.cursor = 'default';
    }
  };

  private onPointerUp = (e: PointerEvent): void => {
    if (this._activeTool === 'pan') return;
    if (this.activePointerId !== null && e.pointerId !== this.activePointerId) return;
    switch (this._activeTool) {
      case 'select':
        this.handleSelectUp(e);
        break;
      case 'draw':
        this.handleDrawUp();
        break;
      case 'terrain':
        this.handleTerrainUp(e);
        break;
      case 'fog':
        this.handleFogUp(e);
        break;
    }
    this.releaseActivePointer();
  };

  private onPointerCancel = (e: PointerEvent): void => {
    if (this.activePointerId !== null && e.pointerId !== this.activePointerId) return;
    this.cancelCurrentInteraction();
  };

  // --- Select tool ---

  private handleSelectDown(
    e: PointerEvent,
    gridX: number,
    gridY: number,
  ): void {
    const entityId = this.tokenLayer.getTokenAt(gridX, gridY);
    const additiveSelection = e.ctrlKey || e.metaKey || e.shiftKey;

    if (entityId) {
      if (additiveSelection) {
        const nextIds = new Set(this.selectedIds);
        if (nextIds.has(entityId)) nextIds.delete(entityId);
        else nextIds.add(entityId);
        const nextList = [...nextIds];
        this.selectedIds = nextIds;
        this.selectedId = nextList[0] ?? null;
        this.callbacks.onTokenSelect(this.selectedId);
        this.callbacks.onMultiTokenSelect?.(nextList);
        return;
      }

      // Clicked on a token
      if (this.selectedIds.has(entityId) && this.selectedIds.size > 1) {
        // Clicked on an already-selected token in a multi-selection → start group drag
        if (this.isDirector) {
          this.groupDragging = true;
          this.groupDragAnchorGrid = { gridX, gridY };
          this.groupDragLastGrid = { gridX, gridY };
          this.dragOriginGrid = { gridX, gridY };
        }
        // Keep current multi-selection as is
      } else {
        // Single-select this token (clear previous multi-selection)
        this.selectedId = entityId;
        this.selectedIds.clear();
        this.selectedIds.add(entityId);
        this.callbacks.onTokenSelect(entityId);

        if (this.isDirector) {
          this.dragging = true;
          this.dragEntityId = entityId;
          this.dragOriginGrid = { gridX, gridY };
        }
      }
    } else {
      if (this.isDirector && this.terrainLayer) {
        const { worldX, worldY } = this.screenToWorld(e.clientX, e.clientY);
        const resizeId = this.terrainLayer.getResizeHandleAtWorld(
          worldX,
          worldY,
        );
        if (resizeId) {
          const zone = this.terrainLayer.getZone(resizeId);
          if (zone) {
            this.terrainResizing = { id: resizeId, original: { ...zone } };
            return;
          }
        }

        const terrainId = this.terrainLayer.getZoneAt(gridX, gridY);
        if (terrainId) {
          const zone = this.terrainLayer.getZone(terrainId);
          if (zone) {
            this.terrainDragging = {
              id: terrainId,
              startGrid: { gridX, gridY },
              original: { ...zone },
            };
            return;
          }
        }
      }

      // Clicked on empty space
      const { worldX, worldY } = this.screenToWorld(e.clientX, e.clientY);
      this.marqueeActive = true;
      this.marqueeStartWorld = { x: worldX, y: worldY };

      // Clear selection
      this.selectedId = null;
      this.selectedIds.clear();
      this.callbacks.onTokenSelect(null);
      this.callbacks.onMultiTokenSelect?.([]);
    }
  }

  private handleSelectMove(e: PointerEvent): void {
    if (this.terrainDragging) {
      const { gridX, gridY } = this.screenToGrid(e.clientX, e.clientY);
      const dx = gridX - this.terrainDragging.startGrid.gridX;
      const dy = gridY - this.terrainDragging.startGrid.gridY;
      const next = this.clampTerrain({
        ...this.terrainDragging.original,
        x: this.terrainDragging.original.x + dx,
        y: this.terrainDragging.original.y + dy,
      });
      this.terrainLayer?.moveZone(this.terrainDragging.id, next.x, next.y);
      return;
    }

    if (this.terrainResizing) {
      const { gridX, gridY } = this.screenToGrid(e.clientX, e.clientY);
      const original = this.terrainResizing.original;
      const next = this.clampTerrain({
        ...original,
        w: gridX - original.x + 1,
        h: gridY - original.y + 1,
      });
      this.terrainLayer?.resizeZone(this.terrainResizing.id, next);
      return;
    }

    // Group drag — move all selected tokens by grid delta
    if (this.groupDragging && this.groupDragLastGrid) {
      const { gridX, gridY } = this.screenToGrid(e.clientX, e.clientY);
      const dx = gridX - this.groupDragLastGrid.gridX;
      const dy = gridY - this.groupDragLastGrid.gridY;
      if (dx !== 0 || dy !== 0) {
        this.tokenLayer.moveTokensByDelta([...this.selectedIds], dx, dy);
        this.groupDragLastGrid = { gridX, gridY };
      }
      if (this.dragOriginGrid) {
        this.tokenLayer.showGroupDistanceLabel(
          this.dragOriginGrid.gridX,
          this.dragOriginGrid.gridY,
          gridX,
          gridY,
        );
      }
      return;
    }

    // Single drag
    if (this.dragging && this.dragEntityId) {
      const { gridX, gridY } = this.screenToGrid(e.clientX, e.clientY);
      this.tokenLayer.moveToken(this.dragEntityId, gridX, gridY);
      if (this.dragOriginGrid) {
        this.tokenLayer.showDistanceLabel(
          this.dragEntityId,
          this.dragOriginGrid.gridX,
          this.dragOriginGrid.gridY,
        );
      }
      return;
    }

    // Marquee draw
    if (this.marqueeActive && this.marqueeStartWorld) {
      const { worldX, worldY } = this.screenToWorld(e.clientX, e.clientY);
      const sx = this.marqueeStartWorld.x;
      const sy = this.marqueeStartWorld.y;
      const w = worldX - sx;
      const h = worldY - sy;
      this.tokenLayer.showSelectionRect(
        Math.min(sx, worldX),
        Math.min(sy, worldY),
        Math.abs(w),
        Math.abs(h),
      );
      return;
    }

    // Hover detection — check for token under cursor
    const { gridX, gridY } = this.screenToGrid(e.clientX, e.clientY);
    const entityId = this.tokenLayer.getTokenAt(gridX, gridY);
    if (entityId !== this.hoveredId) {
      this.hoveredId = entityId;
      this.callbacks.onTokenHover?.(entityId, e.clientX, e.clientY);
    } else if (entityId) {
      // Still hovering the same token — update screen position
      this.callbacks.onTokenHover?.(entityId, e.clientX, e.clientY);
    }
  }

  private handleSelectUp(e: PointerEvent): void {
    if (this.terrainDragging) {
      const { gridX, gridY } = this.screenToGrid(e.clientX, e.clientY);
      const dx = gridX - this.terrainDragging.startGrid.gridX;
      const dy = gridY - this.terrainDragging.startGrid.gridY;
      const next = this.clampTerrain({
        ...this.terrainDragging.original,
        x: this.terrainDragging.original.x + dx,
        y: this.terrainDragging.original.y + dy,
      });
      this.terrainLayer?.moveZone(this.terrainDragging.id, next.x, next.y);
      this.callbacks.onTerrainUpdate?.(next);
      this.terrainDragging = null;
      return;
    }

    if (this.terrainResizing) {
      const { gridX, gridY } = this.screenToGrid(e.clientX, e.clientY);
      const original = this.terrainResizing.original;
      const next = this.clampTerrain({
        ...original,
        w: gridX - original.x + 1,
        h: gridY - original.y + 1,
      });
      this.terrainLayer?.resizeZone(this.terrainResizing.id, next);
      this.callbacks.onTerrainUpdate?.(next);
      this.terrainResizing = null;
      return;
    }

    // Group drag finished
    if (
      this.groupDragging &&
      this.groupDragAnchorGrid &&
      this.groupDragLastGrid
    ) {
      // Emit final positions for all selected tokens
      const moves: Array<{ entityId: string; gridX: number; gridY: number }> =
        [];
      for (const id of this.selectedIds) {
        const pos = this.tokenLayer.getTokenPosition(id);
        if (pos) {
          moves.push({ entityId: id, gridX: pos.gridX, gridY: pos.gridY });
        }
      }
      if (moves.length > 0) {
        this.callbacks.onMultiTokenMove?.(moves);
      }
      this.groupDragging = false;
      this.groupDragAnchorGrid = null;
      this.groupDragLastGrid = null;
      this.dragOriginGrid = null;
      this.tokenLayer.clearDistanceLabel();
      this.rebuildIndex();
      return;
    }

    // Single drag finished
    if (this.dragging && this.dragEntityId) {
      const { gridX, gridY } = this.screenToGrid(e.clientX, e.clientY);
      this.callbacks.onTokenMove(this.dragEntityId, gridX, gridY);
      this.dragging = false;
      this.dragEntityId = null;
      this.dragOriginGrid = null;
      this.tokenLayer.clearDistanceLabel();
      this.rebuildIndex();
      return;
    }

    // Marquee selection finished
    if (this.marqueeActive && this.marqueeStartWorld) {
      const { worldX, worldY } = this.screenToWorld(e.clientX, e.clientY);
      const sx = this.marqueeStartWorld.x;
      const sy = this.marqueeStartWorld.y;
      const w = worldX - sx;
      const h = worldY - sy;

      this.tokenLayer.clearSelectionRect();
      this.marqueeActive = false;
      this.marqueeStartWorld = null;

      // Only count as a marquee if the drag was substantial (> 5 world pixels)
      if (Math.abs(w) > 5 || Math.abs(h) > 5) {
        const ids = this.tokenLayer.getTokensInRect(sx, sy, w, h);
        const firstId = ids[0] ?? null;
        if (firstId !== null) {
          this.selectedIds = new Set(ids);
          this.selectedId = firstId;
          // Also fire single-select for the first token (for context menu, etc.)
          this.callbacks.onTokenSelect(firstId);
          this.callbacks.onMultiTokenSelect?.(ids);
        }
      }
      return;
    }
  }

  // --- Draw tool ---

  private handleDrawDown(e: PointerEvent): void {
    this.isDrawing = true;
    const { worldX, worldY } = this.screenToWorld(e.clientX, e.clientY);
    this.drawPoints = [worldX, worldY];
  }

  private handleDrawMove(e: PointerEvent): void {
    if (!this.isDrawing) return;
    const { worldX, worldY } = this.screenToWorld(e.clientX, e.clientY);
    this.drawPoints.push(worldX, worldY);
    // Live-render the in-progress stroke
    this.drawingLayer?.previewStroke(
      this.drawPoints,
      this.drawColor,
      this.drawWidth,
    );
  }

  private handleDrawUp(): void {
    if (!this.isDrawing) return;
    this.isDrawing = false;
    // Remove the preview before committing the final stroke
    this.drawingLayer?.clearPreview();
    if (this.drawPoints.length >= 4) {
      this.callbacks.onDrawingAdd?.(
        this.drawPoints,
        this.drawColor,
        this.drawWidth,
      );
    }
    this.drawPoints = [];
  }

  // --- Eraser tool ---

  private getErasableTarget(
    e: PointerEvent,
    gridX: number,
    gridY: number,
  ): { type: 'drawing' | 'terrain'; id: string } | null {
    if (this.drawingLayer) {
      const { worldX, worldY } = this.screenToWorld(e.clientX, e.clientY);
      const drawingId = this.drawingLayer.getDrawingAt(worldX, worldY);
      if (drawingId) return { type: 'drawing', id: drawingId };
    }

    if (this.terrainLayer) {
      const terrainId = this.terrainLayer.getZoneAt(gridX, gridY);
      if (terrainId) return { type: 'terrain', id: terrainId };
    }

    return null;
  }

  private handleEraserMove(e: PointerEvent): void {
    const { gridX, gridY } = this.screenToGrid(e.clientX, e.clientY);
    const target = this.getErasableTarget(e, gridX, gridY);
    this.canvas.style.cursor = target ? ERASER_CURSOR : 'default';
  }

  private handleEraserDown(
    e: PointerEvent,
    gridX: number,
    gridY: number,
  ): void {
    const target = this.getErasableTarget(e, gridX, gridY);
    if (target?.type === 'drawing') {
      this.callbacks.onDrawingRemove?.(target.id);
      return;
    }
    if (target?.type === 'terrain') {
      this.callbacks.onTerrainRemove?.(target.id);
    }
    // Fog reveal is handled by the Fog tool's Reveal brush so this eraser
    // remains available for drawings and terrain annotations.
  }

  // --- Terrain tool ---

  private handleTerrainDown(gridX: number, gridY: number): void {
    this.terrainStart = this.clampGrid(gridX, gridY);
  }

  private handleTerrainMove(e: PointerEvent): void {
    if (!this.terrainStart) return;
    const { gridX, gridY } = this.screenToGrid(e.clientX, e.clientY);
    const x = Math.min(this.terrainStart.gridX, gridX);
    const y = Math.min(this.terrainStart.gridY, gridY);
    const w = Math.abs(gridX - this.terrainStart.gridX) + 1;
    const h = Math.abs(gridY - this.terrainStart.gridY) + 1;
    this.terrainLayer?.previewZone(x, y, w, h);
  }

  private handleTerrainUp(e: PointerEvent): void {
    if (!this.terrainStart) return;
    const { gridX, gridY } = this.screenToGrid(e.clientX, e.clientY);
    const x = Math.min(this.terrainStart.gridX, gridX);
    const y = Math.min(this.terrainStart.gridY, gridY);
    const w = Math.abs(gridX - this.terrainStart.gridX) + 1;
    const h = Math.abs(gridY - this.terrainStart.gridY) + 1;
    this.terrainLayer?.clearPreview();
    this.callbacks.onTerrainAdd?.(x, y, w, h);
    this.terrainStart = null;
  }

  // --- Fog tool ---

  private getFogBrushRect(
    gridX: number,
    gridY: number,
  ): { x: number; y: number; w: number; h: number } {
    const size = Math.max(
      1,
      Math.min(this.fogBrushSize, this.gridBounds.cols, this.gridBounds.rows),
    );
    const half = Math.floor(size / 2);
    const x = Math.max(0, Math.min(this.gridBounds.cols - size, gridX - half));
    const y = Math.max(0, Math.min(this.gridBounds.rows - size, gridY - half));
    return { x, y, w: size, h: size };
  }

  private applyFogBrush(gridX: number, gridY: number): void {
    const rect = this.getFogBrushRect(gridX, gridY);
    const key =
      this.fogMode === 'reveal'
        ? `${this.fogMode}:${gridX}:${gridY}:1:1`
        : `${this.fogMode}:${rect.x}:${rect.y}:${rect.w}:${rect.h}`;
    if (key === this.fogBrushLastKey) return;
    this.fogBrushLastKey = key;

    if (this.fogMode === 'reveal') {
      this.callbacks.onFogRevealCell?.(gridX, gridY);
      this.fogLayer?.previewZone(gridX, gridY, 1, 1);
      return;
    }

    this.callbacks.onFogAdd?.(rect.x, rect.y, rect.w, rect.h);
    this.fogLayer?.previewZone(rect.x, rect.y, rect.w, rect.h);
  }

  private handleFogDown(gridX: number, gridY: number): void {
    this.fogStart = { gridX, gridY };
    this.applyFogBrush(gridX, gridY);
  }

  private handleFogMove(e: PointerEvent): void {
    if (!this.fogStart) return;
    const { gridX, gridY } = this.screenToGrid(e.clientX, e.clientY);
    this.applyFogBrush(gridX, gridY);
  }

  private handleFogUp(_e: PointerEvent): void {
    if (!this.fogStart) return;
    this.fogLayer?.clearPreview();
    this.fogStart = null;
    this.fogBrushLastKey = null;
  }

  // --- Context menu (right-click) ---

  private onContextMenu = (e: MouseEvent): void => {
    e.preventDefault();
    const { gridX, gridY } = this.screenToGrid(e.clientX, e.clientY);
    const entityId = this.tokenLayer.getTokenAt(gridX, gridY);
    if (entityId) {
      // Position the context menu at the token's right edge (gridX + 1) for consistent placement
      const { screenX, screenY } = this.viewport.gridToScreen(
        gridX + 1,
        gridY,
        this.cellSize,
      );
      this.callbacks.onTokenRightClick?.(entityId, screenX, screenY);
      this.callbacks.onTerrainRightClick?.(null, 0, 0);
    } else if (this.terrainLayer) {
      const terrainId = this.terrainLayer.getZoneAt(gridX, gridY);
      if (terrainId) {
        const { screenX, screenY } = this.viewport.gridToScreen(
          gridX + 1,
          gridY,
          this.cellSize,
        );
        this.callbacks.onTokenRightClick?.(null, 0, 0);
        this.callbacks.onTerrainRightClick?.(terrainId, screenX, screenY);
      } else {
        // Right-clicked on empty space — signal close (null entityId = dismiss)
        this.callbacks.onTokenRightClick?.(null, 0, 0);
        this.callbacks.onTerrainRightClick?.(null, 0, 0);
      }
    } else {
      // Right-clicked on empty space — signal close (null entityId = dismiss)
      this.callbacks.onTokenRightClick?.(null, 0, 0);
      this.callbacks.onTerrainRightClick?.(null, 0, 0);
    }
  };
}
