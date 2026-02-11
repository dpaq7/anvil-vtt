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
  private zones = new Map<string, Container>();
  private cellSize = 64;

  setCellSize(size: number): void {
    this.cellSize = size;
  }

  /** Replace all terrain zones with the given array */
  sync(zones: TerrainZoneData[]): void {
    const newIds = new Set(zones.map((z) => z.id));

    // Remove stale
    for (const [id, container] of this.zones) {
      if (!newIds.has(id)) {
        this.removeChild(container);
        container.destroy({ children: true });
        this.zones.delete(id);
      }
    }

    // Add new (don't re-render existing — positions don't change after placement)
    for (const zone of zones) {
      if (!this.zones.has(zone.id)) {
        const container = this.renderZone(zone);
        this.addChild(container);
        this.zones.set(zone.id, container);
      }
    }
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
    const container = this.zones.get(id);
    if (container) {
      this.removeChild(container);
      container.destroy({ children: true });
      this.zones.delete(id);
    }
  }

  /** Hit-test: return the terrain zone id at the given grid coordinate */
  getZoneAt(gridX: number, gridY: number): string | null {
    // Search in reverse so top-most zone wins
    const entries = [...this.zones.entries()].reverse();
    for (const [id, container] of entries) {
      const zoneX = container.x / this.cellSize;
      const zoneY = container.y / this.cellSize;
      const zoneW = container.width / this.cellSize;
      const zoneH = container.height / this.cellSize;
      if (gridX >= zoneX && gridX < zoneX + zoneW && gridY >= zoneY && gridY < zoneY + zoneH) {
        return id;
      }
    }
    return null;
  }

  clear(): void {
    for (const [, container] of this.zones) {
      this.removeChild(container);
      container.destroy({ children: true });
    }
    this.zones.clear();
  }
}
