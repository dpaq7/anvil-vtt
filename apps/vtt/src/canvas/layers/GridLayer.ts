import { Container, Graphics } from 'pixi.js';
import { getCanvasTheme } from '../theme.js';

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

/** Grid lines are dashed, 2 on and 6 off (`InkMap` in the demo). */
const DASH_ON = 2;
const DASH_OFF = 6;

export class GridLayer extends Container {
  private grid: Graphics;

  constructor() {
    super();
    this.grid = new Graphics();
    this.addChild(this.grid);
  }

  draw(config: GridConfig): void {
    const palette = getCanvasTheme();
    const {
      cellSize,
      stageCellSize = cellSize,
      cols,
      rows,
      lineColor = palette.grid,
      lineAlpha = palette.gridAlpha,
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
      for (let y = 0; y < height; y += DASH_ON + DASH_OFF) {
        this.grid.moveTo(x, y);
        this.grid.lineTo(x, Math.min(height, y + DASH_ON));
      }
    }

    // Horizontal lines
    for (let y = yOffset === 0 ? 0 : yOffset - cellSize; y <= height; y += cellSize) {
      for (let x = 0; x < width; x += DASH_ON + DASH_OFF) {
        this.grid.moveTo(x, y);
        this.grid.lineTo(Math.min(width, x + DASH_ON), y);
      }
    }

    this.grid.stroke({ width: 1.25, color: lineColor, alpha: lineAlpha });
  }
}
