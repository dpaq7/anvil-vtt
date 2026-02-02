import { Container, Graphics } from 'pixi.js';
import type { Point } from '../vision/VisibilityCalculator.js';

export class FogLayer extends Container {
  private fog: Graphics;
  private mapWidth = 0;
  private mapHeight = 0;

  constructor() {
    super();
    this.fog = new Graphics();
    this.addChild(this.fog);
  }

  setMapSize(width: number, height: number): void {
    this.mapWidth = width;
    this.mapHeight = height;
  }

  /** Draw fog with visibility polygon cutout */
  drawFog(visibilityPolygon: Point[] | null): void {
    this.fog.clear();

    if (!visibilityPolygon || visibilityPolygon.length < 3) {
      // Full fog
      this.fog.rect(0, 0, this.mapWidth, this.mapHeight);
      this.fog.fill({ color: 0x000000, alpha: 0.7 });
      return;
    }

    // Draw fog everywhere
    this.fog.rect(0, 0, this.mapWidth, this.mapHeight);
    this.fog.fill({ color: 0x000000, alpha: 0.7 });

    // Cut out visible area using a Graphics mask
    const mask = new Graphics();
    const first = visibilityPolygon[0]!;
    mask.moveTo(first.x, first.y);
    for (let i = 1; i < visibilityPolygon.length; i++) {
      mask.lineTo(visibilityPolygon[i]!.x, visibilityPolygon[i]!.y);
    }
    mask.closePath();
    mask.fill({ color: 0xffffff });

    // Use mask to create hole — in PixiJS v8 we use the mask property
    this.mask = mask;
    // Actually we want inverted: fog everywhere EXCEPT the polygon.
    // A simpler approach: don't mask fog, instead draw the visible area as a bright overlay.
    this.mask = null;

    // Simpler approach: draw semi-transparent black, then draw clear polygon
    this.fog.clear();

    // Draw dark overlay
    this.fog.rect(0, 0, this.mapWidth, this.mapHeight);
    this.fog.fill({ color: 0x000000, alpha: 0.7 });

    // Punch out visible area by drawing it as fully transparent
    this.fog.moveTo(first.x, first.y);
    for (let i = 1; i < visibilityPolygon.length; i++) {
      this.fog.lineTo(visibilityPolygon[i]!.x, visibilityPolygon[i]!.y);
    }
    this.fog.closePath();
    // Cut via blend mode
    this.fog.cut();
  }

  /** Hide fog entirely (director mode) */
  hideFog(): void {
    this.fog.clear();
    this.visible = false;
  }

  showFog(): void {
    this.visible = true;
  }
}
