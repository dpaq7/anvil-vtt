import { Container, Graphics } from 'pixi.js';
import { getCanvasTheme } from '../theme.js';

/** A rectangular fog zone in grid coordinates */
export interface FogZoneData {
  id: string;
  /** Grid X (top-left cell) */
  x: number;
  /** Grid Y (top-left cell) */
  y: number;
  /** Width in cells */
  w: number;
  /** Height in cells */
  h: number;
}

export class FogLayer extends Container {
  private fog: Graphics;
  private preview: Graphics | null = null;
  private mapWidth = 0;
  private mapHeight = 0;
  private cellSize = 64;
  private zones: FogZoneData[] = [];
  private directorMode = false;

  constructor() {
    super();
    this.fog = new Graphics();
    this.addChild(this.fog);
  }

  setMapSize(width: number, height: number): void {
    this.mapWidth = width;
    this.mapHeight = height;
  }

  setCellSize(size: number): void {
    if (this.cellSize === size) return;
    this.cellSize = size;
    this.redraw();
  }

  /** Set whether the director is viewing (see-through preview) or a player (100% opaque) */
  setDirectorMode(isDirector: boolean): void {
    this.directorMode = isDirector;
    this.visible = true;
    this.redraw();
  }

  /** Sync fog zones from React state */
  sync(zones: FogZoneData[]): void {
    this.zones = zones;
    this.redraw();
  }

  /** Redraw all fog zones */
  private redraw(): void {
    this.fog.clear();
    if (this.zones.length === 0) return;

    const palette = getCanvasTheme();
    const color = this.directorMode ? palette.fogPreview : palette.fog;
    const alpha = this.directorMode ? palette.fogPreviewAlpha : palette.fogAlpha;

    // The client can hold one zone twice. Draw it once, or its hatching doubles.
    const seen = new Set<string>();
    const rects: Array<{ x: number; y: number; w: number; h: number }> = [];
    for (const zone of this.zones) {
      const key = `${zone.x},${zone.y},${zone.w},${zone.h}`;
      if (seen.has(key)) continue;
      seen.add(key);
      rects.push({
        x: zone.x * this.cellSize,
        y: zone.y * this.cellSize,
        w: zone.w * this.cellSize,
        h: zone.h * this.cellSize,
      });
    }

    for (const r of rects) this.fog.rect(r.x, r.y, r.w, r.h);
    this.fog.fill({ color, alpha });

    // The Director's preview is hatched: 3 px ink stripes, 12 px apart, at 45 degrees.
    if (this.directorMode) {
      const gap = 12 * Math.SQRT2;
      for (const r of rects) {
        const first = Math.ceil((r.x + r.y) / gap) * gap;
        for (let k = first; k < r.x + r.w + r.y + r.h; k += gap) {
          // The line x + y = k, clipped to this rectangle.
          const x0 = Math.max(r.x, k - (r.y + r.h));
          const x1 = Math.min(r.x + r.w, k - r.y);
          if (x1 <= x0) continue;
          this.fog.moveTo(x0, k - x0).lineTo(x1, k - x1);
        }
      }
      this.fog.stroke({ width: 3, color: palette.fogHatch });
    }

    // Every fog has a 3 px ink edge.
    for (const r of rects) this.fog.rect(r.x, r.y, r.w, r.h);
    this.fog.stroke({ width: 3, color: palette.fogEdge });
  }

  /**
   * Live preview of a fog zone being drawn (drag in progress).
   * Renders as the Director's fog preview, with an ink edge.
   */
  previewZone(gridX: number, gridY: number, w: number, h: number): void {
    if (!this.preview) {
      this.preview = new Graphics();
      this.addChild(this.preview);
    }

    this.preview.clear();
    const px = gridX * this.cellSize;
    const py = gridY * this.cellSize;
    const pw = w * this.cellSize;
    const ph = h * this.cellSize;

    // Semi-transparent fill preview
    this.preview.rect(px, py, pw, ph);
    const palette = getCanvasTheme();
    this.preview.fill({ color: palette.fogDraft, alpha: palette.fogDraftAlpha });
    this.preview.stroke({ width: 2, color: palette.fogDraftEdge, alpha: 1 });
  }

  /** Remove the preview zone */
  clearPreview(): void {
    if (this.preview) {
      this.removeChild(this.preview);
      this.preview.destroy();
      this.preview = null;
    }
  }

  /** Hit-test: return the fog zone at the given grid coordinate, or null */
  getZoneAt(gridX: number, gridY: number): string | null {
    // Search in reverse so the most recently added zone is found first
    for (let i = this.zones.length - 1; i >= 0; i--) {
      const z = this.zones[i]!;
      if (gridX >= z.x && gridX < z.x + z.w && gridY >= z.y && gridY < z.y + z.h) {
        return z.id;
      }
    }
    return null;
  }

  /** Hit-test all fog zones intersecting a rectangular brush in grid cells. */
  getZonesInRect(gridX: number, gridY: number, w: number, h: number): string[] {
    const ids: string[] = [];
    const right = gridX + w;
    const bottom = gridY + h;
    for (const z of this.zones) {
      const intersects = gridX < z.x + z.w && right > z.x && gridY < z.y + z.h && bottom > z.y;
      if (intersects) ids.push(z.id);
    }
    return ids;
  }

  /** Hide fog entirely */
  hideFog(): void {
    this.fog.clear();
    this.clearPreview();
    this.visible = false;
  }

  showFog(): void {
    this.visible = true;
    this.redraw();
  }

  clear(): void {
    this.zones = [];
    this.fog.clear();
    this.clearPreview();
  }
}
