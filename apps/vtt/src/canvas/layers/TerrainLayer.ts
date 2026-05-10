import { Container, Graphics, Text } from 'pixi.js';

export interface TerrainZoneData {
  id: string;
  terrainId: string;
  name: string;
  x: number; // grid x
  y: number; // grid y
  w: number; // grid width
  h: number; // grid height
  color?: number;
}

/** Terrain zone colors by category */
const TERRAIN_COLORS: Record<string, number> = {
  difficult: 0xf59e0b,
  hazardous: 0xef4444,
  impassable: 0x6b7280,
  concealing: 0x22c55e,
  elevated: 0x8b5cf6,
  default: 0x3b82f6,
};

export class TerrainLayer extends Container {
  private zones = new Map<string, { container: Container; zone: TerrainZoneData }>();
  private preview: Graphics | null = null;
  private cellSize = 64;

  setCellSize(size: number): void {
    if (this.cellSize === size) return;
    const zones = [...this.zones.values()].map((entry) => entry.zone);
    this.cellSize = size;
    if (zones.length > 0) {
      for (const [, entry] of this.zones) {
        this.removeChild(entry.container);
        entry.container.destroy({ children: true });
      }
      this.zones.clear();
      this.sync(zones);
    }
  }

  /** Replace all terrain zones with the given array */
  sync(zones: TerrainZoneData[]): void {
    const newIds = new Set(zones.map((z) => z.id));

    // Remove stale
    for (const [id, entry] of this.zones) {
      if (!newIds.has(id)) {
        this.removeChild(entry.container);
        entry.container.destroy({ children: true });
        this.zones.delete(id);
      }
    }

    for (const zone of zones) {
      const existing = this.zones.get(zone.id);
      if (!existing || this.zoneChanged(existing.zone, zone)) {
        if (existing) {
          this.removeChild(existing.container);
          existing.container.destroy({ children: true });
        }
        const container = this.renderZone(zone);
        this.addChild(container);
        this.zones.set(zone.id, { container, zone });
      }
    }
  }


  private zoneChanged(a: TerrainZoneData, b: TerrainZoneData): boolean {
    return a.terrainId !== b.terrainId ||
      a.name !== b.name ||
      a.x !== b.x ||
      a.y !== b.y ||
      a.w !== b.w ||
      a.h !== b.h ||
      a.color !== b.color;
  }

  private renderZone(zone: TerrainZoneData): Container {
    const container = new Container();
    const color = zone.color ?? this.inferColor(zone.terrainId);
    const px = zone.x * this.cellSize;
    const py = zone.y * this.cellSize;
    const pw = zone.w * this.cellSize;
    const ph = zone.h * this.cellSize;

    // Background fill
    const bg = new Graphics();
    bg.rect(0, 0, pw, ph);
    bg.fill({ color, alpha: 0.2 });
    bg.rect(0, 0, pw, ph);
    bg.stroke({ width: 2, color, alpha: 0.6 });
    container.addChild(bg);

    // Label
    const label = new Text({
      text: zone.name,
      style: {
        fontFamily: 'sans-serif',
        fontSize: Math.min(14, this.cellSize * 0.3),
        fill: 0xffffff,
        fontWeight: 'bold',
      },
    });
    label.x = 4;
    label.y = 2;
    label.alpha = 0.8;
    container.addChild(label);

    container.x = px;
    container.y = py;
    container.eventMode = 'static';
    container.cursor = 'pointer';

    return container;
  }

  private inferColor(terrainId: string): number {
    const lower = terrainId.toLowerCase();
    for (const [key, color] of Object.entries(TERRAIN_COLORS)) {
      if (lower.includes(key)) return color;
    }
    return TERRAIN_COLORS['default']!;
  }

  /** Remove a single terrain zone */
  remove(id: string): void {
    const entry = this.zones.get(id);
    if (entry) {
      this.removeChild(entry.container);
      entry.container.destroy({ children: true });
      this.zones.delete(id);
    }
  }

  /** Hit-test: return the terrain zone id at the given grid coordinate */
  getZoneAt(gridX: number, gridY: number): string | null {
    // Search in reverse so top-most zone wins
    const entries = [...this.zones.entries()].reverse();
    for (const [id, entry] of entries) {
      const { zone } = entry;
      const zoneX = zone.x;
      const zoneY = zone.y;
      const zoneW = zone.w;
      const zoneH = zone.h;
      if (gridX >= zoneX && gridX < zoneX + zoneW && gridY >= zoneY && gridY < zoneY + zoneH) {
        return id;
      }
    }
    return null;
  }

  clear(): void {
    for (const [, entry] of this.zones) {
      this.removeChild(entry.container);
      entry.container.destroy({ children: true });
    }
    this.zones.clear();
    this.clearPreview();
  }

  previewZone(gridX: number, gridY: number, w: number, h: number, color: number = TERRAIN_COLORS['default']!): void {
    if (!this.preview) {
      this.preview = new Graphics();
      this.addChild(this.preview);
    }
    this.preview.clear();
    this.preview.rect(gridX * this.cellSize, gridY * this.cellSize, w * this.cellSize, h * this.cellSize);
    this.preview.fill({ color, alpha: 0.18 });
    this.preview.stroke({ width: 2, color, alpha: 0.85 });
  }

  clearPreview(): void {
    if (this.preview) {
      this.removeChild(this.preview);
      this.preview.destroy();
      this.preview = null;
    }
  }
}
