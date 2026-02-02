import type { ViewportSystem } from './ViewportSystem.js';
import type { TokenLayer } from '../layers/TokenLayer.js';
import { Quadtree } from './Quadtree.js';

export interface InteractionCallbacks {
  onTokenSelect: (entityId: string | null) => void;
  onTokenMove: (entityId: string, gridX: number, gridY: number) => void;
}

export class InteractionManager {
  private quadtree: Quadtree<string>;
  private selectedId: string | null = null;
  private dragging = false;
  private dragEntityId: string | null = null;
  private isDirector: boolean;

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

  private bindEvents(): void {
    this.canvas.addEventListener('pointerdown', this.onPointerDown);
    this.canvas.addEventListener('pointermove', this.onPointerMove);
    this.canvas.addEventListener('pointerup', this.onPointerUp);
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  destroy(): void {
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    this.canvas.removeEventListener('pointermove', this.onPointerMove);
    this.canvas.removeEventListener('pointerup', this.onPointerUp);
  }

  rebuildIndex(): void {
    this.tokenLayer.buildIndex(this.quadtree);
  }

  private onPointerDown = (e: PointerEvent): void => {
    if (e.button !== 0) return; // Left click only
    const { gridX, gridY } = this.viewport.screenToGrid(e.clientX, e.clientY, this.cellSize);
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
  };

  private onPointerMove = (e: PointerEvent): void => {
    if (!this.dragging || !this.dragEntityId) return;
    const { gridX, gridY } = this.viewport.screenToGrid(e.clientX, e.clientY, this.cellSize);
    this.tokenLayer.moveToken(this.dragEntityId, gridX, gridY);
  };

  private onPointerUp = (e: PointerEvent): void => {
    if (!this.dragging || !this.dragEntityId) return;
    const { gridX, gridY } = this.viewport.screenToGrid(e.clientX, e.clientY, this.cellSize);
    this.callbacks.onTokenMove(this.dragEntityId, gridX, gridY);
    this.dragging = false;
    this.dragEntityId = null;
    this.rebuildIndex();
  };
}
