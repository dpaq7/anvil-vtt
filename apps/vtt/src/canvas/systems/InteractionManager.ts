import type { ViewportSystem } from './ViewportSystem.js';
import type { TokenLayer } from '../layers/TokenLayer.js';
import type { DrawingLayer } from '../layers/DrawingLayer.js';
import type { TerrainLayer } from '../layers/TerrainLayer.js';
import type { FogLayer } from '../layers/FogLayer.js';
import { Quadtree } from './Quadtree.js';

export type ActiveTool = 'select' | 'draw' | 'fog' | 'terrain' | 'eraser' | 'pan';

export interface InteractionCallbacks {
  onTokenSelect: (entityId: string | null) => void;
  onTokenMove: (entityId: string, gridX: number, gridY: number) => void;
  onDrawingAdd?: (points: number[], color: string, width: number) => void;
  onDrawingRemove?: (drawingId: string) => void;
  onTerrainAdd?: (gridX: number, gridY: number, w: number, h: number) => void;
  onTerrainRemove?: (terrainId: string) => void;
  onFogAdd?: (gridX: number, gridY: number, w: number, h: number) => void;
  onFogRemove?: (fogId: string) => void;
  onTokenHover?: (entityId: string | null, screenX: number, screenY: number) => void;
  onTokenRightClick?: (entityId: string, screenX: number, screenY: number) => void;
}

export class InteractionManager {
  private quadtree: Quadtree<string>;
  private selectedId: string | null = null;
  private dragging = false;
  private dragEntityId: string | null = null;
  private isDirector: boolean;
  private _activeTool: ActiveTool = 'select';

  // Drawing state
  private isDrawing = false;
  private drawPoints: number[] = [];
  private drawColor = '#ef4444';
  private drawWidth = 2;

  // Terrain placement state
  private terrainStart: { gridX: number; gridY: number } | null = null;

  // Fog placement state
  private fogStart: { gridX: number; gridY: number } | null = null;

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
    isDirector: boolean,
  ) {
    this.isDirector = isDirector;
    this.quadtree = new Quadtree({ x: 0, y: 0, width: 10000, height: 10000 });
    this.bindEvents();
  }

  /** Attach optional layers for builder mode */
  setBuilderLayers(drawing: DrawingLayer | null, terrain: TerrainLayer | null, fog: FogLayer | null = null): void {
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
  }

  /** Update cell size (e.g. when background image changes aspect ratio). */
  setCellSize(size: number): void {
    this.cellSize = size;
  }

  /** Update callbacks to avoid stale closures (called on every render). */
  setCallbacks(callbacks: InteractionCallbacks): void {
    this.callbacks = callbacks;
  }

  setDrawConfig(color: string, width: number): void {
    this.drawColor = color;
    this.drawWidth = width;
  }

  private cancelCurrentInteraction(): void {
    this.dragging = false;
    this.dragEntityId = null;
    this.isDrawing = false;
    this.drawPoints = [];
    this.terrainStart = null;
    this.fogStart = null;
    // Clean up any in-progress previews
    this.drawingLayer?.clearPreview();
    this.fogLayer?.clearPreview();
  }

  private bindEvents(): void {
    this.canvas.addEventListener('pointerdown', this.onPointerDown);
    this.canvas.addEventListener('pointermove', this.onPointerMove);
    this.canvas.addEventListener('pointerup', this.onPointerUp);
    this.canvas.addEventListener('contextmenu', this.onContextMenu);
  }

  destroy(): void {
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    this.canvas.removeEventListener('pointermove', this.onPointerMove);
    this.canvas.removeEventListener('pointerup', this.onPointerUp);
    this.canvas.removeEventListener('contextmenu', this.onContextMenu);
  }

  rebuildIndex(): void {
    this.tokenLayer.buildIndex(this.quadtree);
  }

  private screenToWorld(clientX: number, clientY: number): { worldX: number; worldY: number } {
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
    const { gridX, gridY } = this.viewport.screenToGrid(e.clientX, e.clientY, this.cellSize);

    switch (this._activeTool) {
      case 'select':
        this.handleSelectDown(gridX, gridY);
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
    switch (this._activeTool) {
      case 'select':
        this.handleSelectMove(e);
        break;
      case 'draw':
        this.handleDrawMove(e);
        break;
      case 'fog':
        this.handleFogMove(e);
        break;
    }
  };

  private onPointerUp = (e: PointerEvent): void => {
    if (this._activeTool === 'pan') return;
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
  };

  // --- Select tool ---

  private handleSelectDown(gridX: number, gridY: number): void {
    const entityId = this.tokenLayer.getTokenAt(gridX, gridY);
    if (entityId) {
      this.selectedId = entityId;
      this.callbacks.onTokenSelect(entityId);
      if (this.isDirector) {
        this.dragging = true;
        this.dragEntityId = entityId;
      }
    } else {
      this.selectedId = null;
      this.callbacks.onTokenSelect(null);
    }
  }

  private handleSelectMove(e: PointerEvent): void {
    if (this.dragging && this.dragEntityId) {
      const { gridX, gridY } = this.viewport.screenToGrid(e.clientX, e.clientY, this.cellSize);
      this.tokenLayer.moveToken(this.dragEntityId, gridX, gridY);
      return;
    }

    // Hover detection — check for token under cursor
    const { gridX, gridY } = this.viewport.screenToGrid(e.clientX, e.clientY, this.cellSize);
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
    if (!this.dragging || !this.dragEntityId) return;
    const { gridX, gridY } = this.viewport.screenToGrid(e.clientX, e.clientY, this.cellSize);
    this.callbacks.onTokenMove(this.dragEntityId, gridX, gridY);
    this.dragging = false;
    this.dragEntityId = null;
    this.rebuildIndex();
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
    this.drawingLayer?.previewStroke(this.drawPoints, this.drawColor, this.drawWidth);
  }

  private handleDrawUp(): void {
    if (!this.isDrawing) return;
    this.isDrawing = false;
    // Remove the preview before committing the final stroke
    this.drawingLayer?.clearPreview();
    if (this.drawPoints.length >= 4) {
      this.callbacks.onDrawingAdd?.(this.drawPoints, this.drawColor, this.drawWidth);
    }
    this.drawPoints = [];
  }

  // --- Eraser tool ---

  private handleEraserDown(e: PointerEvent, gridX: number, gridY: number): void {
    // Try drawings first, then terrain, then fog
    if (this.drawingLayer) {
      const { worldX, worldY } = this.screenToWorld(e.clientX, e.clientY);
      const drawingId = this.drawingLayer.getDrawingAt(worldX, worldY);
      if (drawingId) {
        this.callbacks.onDrawingRemove?.(drawingId);
        return;
      }
    }
    if (this.terrainLayer) {
      const terrainId = this.terrainLayer.getZoneAt(gridX, gridY);
      if (terrainId) {
        this.callbacks.onTerrainRemove?.(terrainId);
        return;
      }
    }
    if (this.fogLayer) {
      const fogId = this.fogLayer.getZoneAt(gridX, gridY);
      if (fogId) {
        this.callbacks.onFogRemove?.(fogId);
      }
    }
  }

  // --- Terrain tool ---

  private handleTerrainDown(gridX: number, gridY: number): void {
    this.terrainStart = { gridX, gridY };
  }

  private handleTerrainUp(e: PointerEvent): void {
    if (!this.terrainStart) return;
    const { gridX, gridY } = this.viewport.screenToGrid(e.clientX, e.clientY, this.cellSize);
    const x = Math.min(this.terrainStart.gridX, gridX);
    const y = Math.min(this.terrainStart.gridY, gridY);
    const w = Math.abs(gridX - this.terrainStart.gridX) + 1;
    const h = Math.abs(gridY - this.terrainStart.gridY) + 1;
    this.callbacks.onTerrainAdd?.(x, y, w, h);
    this.terrainStart = null;
  }

  // --- Fog tool ---

  private handleFogDown(gridX: number, gridY: number): void {
    this.fogStart = { gridX, gridY };
  }

  private handleFogMove(e: PointerEvent): void {
    if (!this.fogStart) return;
    const { gridX, gridY } = this.viewport.screenToGrid(e.clientX, e.clientY, this.cellSize);
    const x = Math.min(this.fogStart.gridX, gridX);
    const y = Math.min(this.fogStart.gridY, gridY);
    const w = Math.abs(gridX - this.fogStart.gridX) + 1;
    const h = Math.abs(gridY - this.fogStart.gridY) + 1;
    this.fogLayer?.previewZone(x, y, w, h);
  }

  private handleFogUp(e: PointerEvent): void {
    if (!this.fogStart) return;
    const { gridX, gridY } = this.viewport.screenToGrid(e.clientX, e.clientY, this.cellSize);
    const x = Math.min(this.fogStart.gridX, gridX);
    const y = Math.min(this.fogStart.gridY, gridY);
    const w = Math.abs(gridX - this.fogStart.gridX) + 1;
    const h = Math.abs(gridY - this.fogStart.gridY) + 1;
    this.fogLayer?.clearPreview();
    this.callbacks.onFogAdd?.(x, y, w, h);
    this.fogStart = null;
  }

  // --- Context menu (right-click) ---

  private onContextMenu = (e: MouseEvent): void => {
    e.preventDefault();
    const { gridX, gridY } = this.viewport.screenToGrid(e.clientX, e.clientY, this.cellSize);
    const entityId = this.tokenLayer.getTokenAt(gridX, gridY);
    if (entityId) {
      // Position the context menu at the token's right edge (gridX + 1) for consistent placement
      const { screenX, screenY } = this.viewport.gridToScreen(gridX + 1, gridY, this.cellSize);
      this.callbacks.onTokenRightClick?.(entityId, screenX, screenY);
    }
  };
}
