import { Container, Graphics } from 'pixi.js';

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
    this.cellSize = size;
  }

  /** Set whether the director is viewing (50% opacity) or a player (100% opaque) */
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

    const alpha = this.directorMode ? 0.5 : 1.0;

    for (const zone of this.zones) {
      const px = zone.x * this.cellSize;
      const py = zone.y * this.cellSize;
      const pw = zone.w * this.cellSize;
      const ph = zone.h * this.cellSize;
      this.fog.rect(px, py, pw, ph);
    }
    this.fog.fill({ color: 0x000000, alpha });
  }

  /**
   * Live preview of a fog zone being drawn (drag in progress).
   * Renders a dashed-outline rectangle at 30% opacity.
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
    this.preview.fill({ color: 0x000000, alpha: 0.3 });
    this.preview.stroke({ width: 2, color: 0xffffff, alpha: 0.5 });
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
