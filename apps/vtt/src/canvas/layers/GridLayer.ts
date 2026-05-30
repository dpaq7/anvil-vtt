import { Container, Graphics } from 'pixi.js';

export interface GridConfig {
  cellSize: number;
  stageCellSize?: number;
  cols: number;
  rows: number;
  lineColor?: number;
  lineAlpha?: number;
  offsetX?: number;
  offsetY?: number;
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
      stageCellSize = cellSize,
      cols,
      rows,
      lineColor = 0x444444,
      lineAlpha = 0.4,
      offsetX = 0,
      offsetY = 0,
    } = config;

    this.grid.clear();

    const width = cols * stageCellSize;
    const height = rows * stageCellSize;

    const normalizeOffset = (value: number) => {
      const wrapped = value % cellSize;
      return wrapped < 0 ? wrapped + cellSize : wrapped;
    };
    const xOffset = normalizeOffset(offsetX);
    const yOffset = normalizeOffset(offsetY);

    // Vertical lines. Start one cell before the map when offset so shifted grids
    // still cover the full stage bounds.
    for (let x = xOffset === 0 ? 0 : xOffset - cellSize; x <= width; x += cellSize) {
      this.grid.moveTo(x, 0);
      this.grid.lineTo(x, height);
    }

    // Horizontal lines
    for (let y = yOffset === 0 ? 0 : yOffset - cellSize; y <= height; y += cellSize) {
      this.grid.moveTo(0, y);
      this.grid.lineTo(width, y);
    }

    this.grid.stroke({ width: 1, color: lineColor, alpha: lineAlpha });
  }
}
