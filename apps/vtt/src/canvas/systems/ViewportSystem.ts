import type { Container } from 'pixi.js';

export interface ViewportConfig {
  minZoom: number;
  maxZoom: number;
}

const DEFAULT_CONFIG: ViewportConfig = {
  minZoom: 0.25,
  maxZoom: 3,
};

export class ViewportSystem {
  private zoom = 1;
  private panX = 0;
  private panY = 0;
  private isPanning = false;
  private lastPointerX = 0;
  private lastPointerY = 0;
  private config: ViewportConfig;

  constructor(
    private world: Container,
    private canvas: HTMLCanvasElement,
    config?: Partial<ViewportConfig>,
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.bindEvents();
  }

  private bindEvents(): void {
    this.canvas.addEventListener('wheel', this.onWheel, { passive: false });
    this.canvas.addEventListener('pointerdown', this.onPointerDown);
    this.canvas.addEventListener('pointermove', this.onPointerMove);
    this.canvas.addEventListener('pointerup', this.onPointerUp);
    this.canvas.addEventListener('pointerleave', this.onPointerUp);
  }

  destroy(): void {
    this.canvas.removeEventListener('wheel', this.onWheel);
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    this.canvas.removeEventListener('pointermove', this.onPointerMove);
    this.canvas.removeEventListener('pointerup', this.onPointerUp);
    this.canvas.removeEventListener('pointerleave', this.onPointerUp);
  }

  private onWheel = (e: WheelEvent): void => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(this.config.minZoom, Math.min(this.config.maxZoom, this.zoom * delta));

    // Zoom toward cursor
    const rect = this.canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;

    const worldX = (cx - this.panX) / this.zoom;
    const worldY = (cy - this.panY) / this.zoom;

    this.zoom = newZoom;
    this.panX = cx - worldX * this.zoom;
    this.panY = cy - worldY * this.zoom;
    this.apply();
  };

  private onPointerDown = (e: PointerEvent): void => {
    // Middle mouse or right mouse for panning
    if (e.button === 1 || e.button === 2) {
      this.isPanning = true;
      this.lastPointerX = e.clientX;
      this.lastPointerY = e.clientY;
      e.preventDefault();
    }
  };

  private onPointerMove = (e: PointerEvent): void => {
    if (!this.isPanning) return;
    const dx = e.clientX - this.lastPointerX;
    const dy = e.clientY - this.lastPointerY;
    this.lastPointerX = e.clientX;
    this.lastPointerY = e.clientY;
    this.panX += dx;
    this.panY += dy;
    this.apply();
  };

  private onPointerUp = (): void => {
    this.isPanning = false;
  };

  private apply(): void {
    this.world.scale.set(this.zoom);
    this.world.x = this.panX;
    this.world.y = this.panY;
  }

  /** Convert screen coords to grid coords */
  screenToGrid(screenX: number, screenY: number, cellSize: number): { gridX: number; gridY: number } {
    const rect = this.canvas.getBoundingClientRect();
    const worldX = (screenX - rect.left - this.panX) / this.zoom;
    const worldY = (screenY - rect.top - this.panY) / this.zoom;
    return {
      gridX: Math.floor(worldX / cellSize),
      gridY: Math.floor(worldY / cellSize),
    };
  }

  getZoom(): number {
    return this.zoom;
  }
}
