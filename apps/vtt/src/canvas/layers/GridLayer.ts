import { Container, Graphics } from 'pixi.js';

export interface GridConfig {
  cellSize: number;
  cols: number;
  rows: number;
  lineColor?: number;
  lineAlpha?: number;
  showLabels?: boolean;
}

export class GridLayer extends Container {
  private grid: Graphics;

  constructor() {
    super();
    this.grid = new Graphics();
    this.addChild(this.grid);
  }

  draw(config: GridConfig): void {
    const {
      cellSize,
      cols,
      rows,
      lineColor = 0x444444,
      lineAlpha = 0.4,
    } = config;

    this.grid.clear();

    const width = cols * cellSize;
    const height = rows * cellSize;

    // Vertical lines
    for (let x = 0; x <= cols; x++) {
      this.grid.moveTo(x * cellSize, 0);
      this.grid.lineTo(x * cellSize, height);
    }

    // Horizontal lines
    for (let y = 0; y <= rows; y++) {
      this.grid.moveTo(0, y * cellSize);
      this.grid.lineTo(width, y * cellSize);
    }

    this.grid.stroke({ width: 1, color: lineColor, alpha: lineAlpha });
  }
}
