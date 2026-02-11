import { Container, Graphics } from 'pixi.js';

export interface DrawingData {
  id: string;
  type: 'freehand' | 'line' | 'rect' | 'circle';
  points: number[]; // [x1, y1, x2, y2, ...] for freehand/line; [x, y, w, h] for rect; [cx, cy, r] for circle
  color: string;
  width: number;
}

export class DrawingLayer extends Container {
  private drawings = new Map<string, Graphics>();
  private preview: Graphics | null = null;

  /** Replace all drawings with the given array */
  sync(drawings: DrawingData[]): void {
    // Remove stale
    const newIds = new Set(drawings.map((d) => d.id));
    for (const [id, gfx] of this.drawings) {
      if (!newIds.has(id)) {
        this.removeChild(gfx);
        gfx.destroy();
        this.drawings.delete(id);
      }
    }

    // Add / update
    for (const d of drawings) {
      if (!this.drawings.has(d.id)) {
        const gfx = this.renderDrawing(d);
        this.addChild(gfx);
        this.drawings.set(d.id, gfx);
      }
    }
  }

  /** Render a single drawing into a Graphics object */
  private renderDrawing(d: DrawingData): Graphics {
    const gfx = new Graphics();
    const color = this.parseColor(d.color);

    switch (d.type) {
      case 'freehand': {
        if (d.points.length < 4) break;
        gfx.moveTo(d.points[0]!, d.points[1]!);
        for (let i = 2; i < d.points.length; i += 2) {
          gfx.lineTo(d.points[i]!, d.points[i + 1]!);
        }
        gfx.stroke({ width: d.width, color });
        break;
      }
      case 'line': {
        if (d.points.length < 4) break;
        gfx.moveTo(d.points[0]!, d.points[1]!);
        gfx.lineTo(d.points[2]!, d.points[3]!);
        gfx.stroke({ width: d.width, color });
        break;
      }
      case 'rect': {
        if (d.points.length < 4) break;
        const [x, y, w, h] = d.points as [number, number, number, number];
        gfx.rect(x, y, w, h);
        gfx.stroke({ width: d.width, color });
        gfx.fill({ color, alpha: 0.1 });
        break;
      }
      case 'circle': {
        if (d.points.length < 3) break;
        const [cx, cy, r] = d.points as [number, number, number];
        gfx.circle(cx, cy, r);
        gfx.stroke({ width: d.width, color });
        gfx.fill({ color, alpha: 0.1 });
        break;
      }
    }

    return gfx;
  }

  /** Convert CSS hex to numeric color */
  private parseColor(hex: string): number {
    if (hex === 'none') return 0x000000;
    return parseInt(hex.replace('#', ''), 16);
  }

  /** Remove a single drawing */
  remove(id: string): void {
    const gfx = this.drawings.get(id);
    if (gfx) {
      this.removeChild(gfx);
      gfx.destroy();
      this.drawings.delete(id);
    }
  }

  /** Hit-test: return the drawing id at the given world coordinate, or null */
  getDrawingAt(worldX: number, worldY: number, threshold: number = 8): string | null {
    // Simple proximity check against freehand/line segments
    for (const [id, _gfx] of this.drawings) {
      // For now, use bounding-box check via the Graphics bounds
      const bounds = _gfx.getBounds();
      if (
        worldX >= bounds.x - threshold &&
        worldX <= bounds.x + bounds.width + threshold &&
        worldY >= bounds.y - threshold &&
        worldY <= bounds.y + bounds.height + threshold
      ) {
        return id;
      }
    }
    return null;
  }

  clear(): void {
    for (const [, gfx] of this.drawings) {
      this.removeChild(gfx);
      gfx.destroy();
    }
    this.drawings.clear();
  }

  /**
   * Render a live preview of the stroke currently being drawn.
   * Called on every pointermove while the draw tool is active.
   * The preview Graphics is torn down and rebuilt each frame to
   * reflect the latest set of accumulated points.
   */
  previewStroke(points: number[], color: string, width: number): void {
    if (points.length < 4 || color === 'none') return;

    // Re-use or create the preview Graphics
    if (!this.preview) {
      this.preview = new Graphics();
      this.addChild(this.preview);
    }

    const gfx = this.preview;
    gfx.clear();
    const numericColor = this.parseColor(color);

    gfx.moveTo(points[0]!, points[1]!);
    for (let i = 2; i < points.length; i += 2) {
      gfx.lineTo(points[i]!, points[i + 1]!);
    }
    gfx.stroke({ width, color: numericColor });
  }

  /** Remove the live-draw preview stroke */
  clearPreview(): void {
    if (this.preview) {
      this.removeChild(this.preview);
      this.preview.destroy();
      this.preview = null;
    }
  }
}
