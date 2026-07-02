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
  private leftClickPanEnabled = false;
  private activePointerId: number | null = null;
  /** Active touch pointers, used to detect two-finger pinch/pan gestures. */
  private touchPoints = new Map<number, { x: number; y: number }>();
  private pinchActive = false;
  private pinchLastDist = 0;
  private pinchLastMid = { x: 0, y: 0 };

  /** Optional callback invoked whenever zoom changes (for React state sync). */
  onZoomChange: ((zoom: number) => void) | null = null;

  /** Invoked when a two-finger gesture begins so other systems can cancel in-progress interactions. */
  onPinchStart: (() => void) | null = null;

  constructor(
    private world: Container,
    private canvas: HTMLCanvasElement,
    config?: Partial<ViewportConfig>,
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.bindEvents();
  }

  private bindEvents(): void {
    this.canvas.style.touchAction = 'none';
    this.canvas.addEventListener('wheel', this.onWheel, { passive: false });
    this.canvas.addEventListener('pointerdown', this.onPointerDown);
    this.canvas.addEventListener('pointermove', this.onPointerMove);
    this.canvas.addEventListener('pointerup', this.onPointerUp);
    this.canvas.addEventListener('pointerleave', this.onPointerUp);
    this.canvas.addEventListener('pointercancel', this.onPointerCancel);
  }

  destroy(): void {
    this.releasePointerCapture();
    this.canvas.removeEventListener('wheel', this.onWheel);
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    this.canvas.removeEventListener('pointermove', this.onPointerMove);
    this.canvas.removeEventListener('pointerup', this.onPointerUp);
    this.canvas.removeEventListener('pointerleave', this.onPointerUp);
    this.canvas.removeEventListener('pointercancel', this.onPointerCancel);
  }

  private capturePointer(pointerId: number): void {
    try {
      this.canvas.setPointerCapture(pointerId);
    } catch {
      /* Pointer capture can fail on detached canvases; panning still degrades gracefully. */
    }
    this.activePointerId = pointerId;
  }

  private releasePointerCapture(): void {
    const pointerId = this.activePointerId;
    if (pointerId === null) return;

    try {
      if (this.canvas.hasPointerCapture(pointerId)) {
        this.canvas.releasePointerCapture(pointerId);
      }
    } catch {
      /* Pointer capture may already have been released by the browser. */
    }

    this.activePointerId = null;
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
    this.onZoomChange?.(this.zoom);
  };

  /** Whether a two-finger pinch/pan gesture is currently in progress. */
  isPinching(): boolean {
    return this.pinchActive;
  }

  private beginPinch(): void {
    const points = [...this.touchPoints.values()];
    const [a, b] = points;
    if (!a || !b) return;
    this.pinchActive = true;
    this.pinchLastDist = Math.hypot(b.x - a.x, b.y - a.y);
    this.pinchLastMid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    // A pinch supersedes any single-pointer pan in progress.
    this.isPanning = false;
    this.releasePointerCapture();
    this.onPinchStart?.();
  }

  private updatePinch(): void {
    const points = [...this.touchPoints.values()];
    const [a, b] = points;
    if (!a || !b) return;
    const dist = Math.hypot(b.x - a.x, b.y - a.y);
    const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };

    const scale = this.pinchLastDist > 0 ? dist / this.pinchLastDist : 1;
    const newZoom = Math.max(this.config.minZoom, Math.min(this.config.maxZoom, this.zoom * scale));

    // Pin the world point that was under the previous midpoint to the new
    // midpoint — this covers both zooming about the pinch and two-finger panning.
    const rect = this.canvas.getBoundingClientRect();
    const worldX = (this.pinchLastMid.x - rect.left - this.panX) / this.zoom;
    const worldY = (this.pinchLastMid.y - rect.top - this.panY) / this.zoom;
    this.zoom = newZoom;
    this.panX = mid.x - rect.left - worldX * this.zoom;
    this.panY = mid.y - rect.top - worldY * this.zoom;

    this.pinchLastDist = dist;
    this.pinchLastMid = mid;
    this.apply();
    this.onZoomChange?.(this.zoom);
  }

  private onPointerDown = (e: PointerEvent): void => {
    if (e.pointerType === 'touch') {
      this.touchPoints.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (this.touchPoints.size === 2) {
        this.beginPinch();
        e.preventDefault();
        return;
      }
    }
    if (this.activePointerId !== null) return;
    // Middle mouse or right mouse for panning
    if (e.button === 1 || e.button === 2) {
      this.isPanning = true;
      this.capturePointer(e.pointerId);
      this.lastPointerX = e.clientX;
      this.lastPointerY = e.clientY;
      e.preventDefault();
    }
    // Left click pan when enabled (pan tool / Space key)
    if (e.button === 0 && this.leftClickPanEnabled) {
      this.isPanning = true;
      this.capturePointer(e.pointerId);
      this.lastPointerX = e.clientX;
      this.lastPointerY = e.clientY;
      e.preventDefault();
    }
  };

  private onPointerMove = (e: PointerEvent): void => {
    if (e.pointerType === 'touch' && this.touchPoints.has(e.pointerId)) {
      this.touchPoints.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (this.pinchActive) {
        if (this.touchPoints.size >= 2) {
          e.preventDefault();
          this.updatePinch();
        }
        return;
      }
    }
    if (!this.isPanning) return;
    if (this.activePointerId !== null && e.pointerId !== this.activePointerId) return;
    e.preventDefault();
    const dx = e.clientX - this.lastPointerX;
    const dy = e.clientY - this.lastPointerY;
    this.lastPointerX = e.clientX;
    this.lastPointerY = e.clientY;
    this.panX += dx;
    this.panY += dy;
    this.apply();
  };

  private onPointerUp = (e: PointerEvent): void => {
    this.dropTouchPoint(e);
    if (this.activePointerId !== null && e.pointerId !== this.activePointerId) return;
    this.isPanning = false;
    this.releasePointerCapture();
  };

  private onPointerCancel = (e: PointerEvent): void => {
    this.dropTouchPoint(e);
    if (this.activePointerId !== null && e.pointerId !== this.activePointerId) return;
    this.isPanning = false;
    this.releasePointerCapture();
  };

  private dropTouchPoint(e: PointerEvent): void {
    if (e.pointerType !== 'touch') return;
    this.touchPoints.delete(e.pointerId);
    if (this.pinchActive && this.touchPoints.size < 2) {
      this.pinchActive = false;
    }
  }

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

  getPan(): { x: number; y: number } {
    return { x: this.panX, y: this.panY };
  }

  /** Set zoom level programmatically, clamped to [minZoom, maxZoom]. */
  setZoom(zoom: number): void {
    const clamped = Math.max(this.config.minZoom, Math.min(this.config.maxZoom, zoom));
    // Zoom toward canvas center
    const rect = this.canvas.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const worldX = (cx - this.panX) / this.zoom;
    const worldY = (cy - this.panY) / this.zoom;
    this.zoom = clamped;
    this.panX = cx - worldX * this.zoom;
    this.panY = cy - worldY * this.zoom;
    this.apply();
    this.onZoomChange?.(this.zoom);
  }

  /** Center the viewport on a grid coordinate, optionally forcing a zoom level. */
  centerOnGrid(gridX: number, gridY: number, cellSize: number, zoom = this.zoom): void {
    const rect = this.canvas.getBoundingClientRect();
    this.zoom = Math.max(this.config.minZoom, Math.min(this.config.maxZoom, zoom));
    const worldX = gridX * cellSize;
    const worldY = gridY * cellSize;
    this.panX = rect.width / 2 - worldX * this.zoom;
    this.panY = rect.height / 2 - worldY * this.zoom;
    this.apply();
    this.onZoomChange?.(this.zoom);
  }

  /** Zoom in by one step (0.25). */
  zoomIn(): void {
    this.setZoom(this.zoom + 0.25);
  }

  /** Zoom out by one step (0.25). */
  zoomOut(): void {
    this.setZoom(this.zoom - 0.25);
  }

  /** Fit a world-space rectangle into the viewport, centered. */
  fitToRect(worldWidth: number, worldHeight: number): void {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = rect.width / worldWidth;
    const scaleY = rect.height / worldHeight;
    const zoom = Math.max(this.config.minZoom, Math.min(this.config.maxZoom, Math.min(scaleX, scaleY) * 0.95));
    this.zoom = zoom;
    this.panX = (rect.width - worldWidth * zoom) / 2;
    this.panY = (rect.height - worldHeight * zoom) / 2;
    this.apply();
    this.onZoomChange?.(this.zoom);
  }

  /** Convert grid coords to screen coords (for positioning DOM overlays). */
  gridToScreen(gridX: number, gridY: number, cellSize: number): { screenX: number; screenY: number } {
    const rect = this.canvas.getBoundingClientRect();
    const worldX = gridX * cellSize;
    const worldY = gridY * cellSize;
    return {
      screenX: worldX * this.zoom + this.panX + rect.left,
      screenY: worldY * this.zoom + this.panY + rect.top,
    };
  }

  /** Set pan position directly. */
  setPan(x: number, y: number): void {
    this.panX = x;
    this.panY = y;
    this.apply();
  }

  /** Enable or disable left-click (button 0) panning. */
  setLeftClickPanEnabled(enabled: boolean): void {
    this.leftClickPanEnabled = enabled;
  }
}
