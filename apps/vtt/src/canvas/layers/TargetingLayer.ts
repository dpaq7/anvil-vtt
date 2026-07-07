import { Container, Graphics, Text } from 'pixi.js';

/** A grid cell in integer grid coordinates. */
export interface GridCell {
  x: number;
  y: number;
}

/** A token footprint: top-left cell + edge length in squares. */
export interface FootprintRect {
  x: number;
  y: number;
  size: number;
}

const AMBER = 0xfbbf24;
const RED = 0xef4444;
const EMERALD = 0x34d399;
const SKY = 0x38bdf8;
const SLATE = 0x94a3b8;

/** A candidate target's footprint plus its advisory targeting state. */
export interface TargetHighlight {
  footprint: FootprintRect;
  /** In reach of the caster. Out-of-range targets stay selectable (advisory). */
  inRange: boolean;
  /** Position-based flanking edge against this target. */
  flanking?: boolean;
  /** Attacker has high ground over this target. */
  highGround?: boolean;
}

/**
 * Overlay layer for battle targeting affordances, drawn in world space (a grid
 * cell (gx,gy) sits at pixel gx*cellSize). Renders the movement path with live
 * cost, range rings, AoE templates, valid-target highlights, a measure ruler,
 * and opportunity-attack warnings. All rendering is advisory and transient.
 */
export class TargetingLayer extends Container {
  private cellSize = 64;

  private readonly rangeG = new Graphics();
  private readonly aoeG = new Graphics();
  private readonly highlightG = new Graphics();
  private readonly oaG = new Graphics();
  private readonly movementG = new Graphics();
  private readonly rulerG = new Graphics();
  private movementLabel: Container | null = null;
  private rulerLabel: Container | null = null;

  constructor() {
    super();
    // Draw order within the layer: fills first, then strokes, then labels on top.
    this.addChild(this.rangeG);
    this.addChild(this.aoeG);
    this.addChild(this.highlightG);
    this.addChild(this.oaG);
    this.addChild(this.movementG);
    this.addChild(this.rulerG);
  }

  setCellSize(size: number): void {
    this.cellSize = size;
  }

  // -------------------------------------------------------------------------
  // Range ring & AoE template
  // -------------------------------------------------------------------------

  /** Tint every square within reach of the caster (a range ring). */
  showRangeSquares(cells: GridCell[]): void {
    this.rangeG.clear();
    const cs = this.cellSize;
    for (const cell of cells) {
      this.rangeG.rect(cell.x * cs, cell.y * cs, cs, cs);
    }
    this.rangeG.fill({ color: SKY, alpha: 0.13 });
    this.rangeG.stroke({ width: 1, color: SKY, alpha: 0.5 });
  }

  /** Tint the squares an AoE template covers (green when placeable, amber when not). */
  showAoETemplate(cells: GridCell[], valid: boolean): void {
    this.aoeG.clear();
    const cs = this.cellSize;
    const color = valid ? EMERALD : AMBER;
    for (const cell of cells) {
      this.aoeG.rect(cell.x * cs, cell.y * cs, cs, cs);
    }
    this.aoeG.fill({ color, alpha: 0.22 });
    this.aoeG.stroke({ width: 1.5, color, alpha: 0.7 });
  }

  /**
   * Outline candidate target footprints. In-range targets get a solid emerald
   * outline; out-of-range targets a fainter slate outline (still selectable —
   * advisory). Flanking and high-ground advantages are marked with corner pips
   * (emerald = flanking, sky = high ground), sized relative to the footprint so
   * they stay legible at any zoom.
   */
  highlightTargets(targets: TargetHighlight[]): void {
    this.highlightG.clear();
    const cs = this.cellSize;

    // Outlines first, grouped by range state so each stroke color batches.
    for (const t of targets.filter((t) => t.inRange)) {
      const fp = t.footprint;
      this.highlightG.rect(fp.x * cs, fp.y * cs, fp.size * cs, fp.size * cs);
    }
    this.highlightG.stroke({ width: 2.5, color: EMERALD, alpha: 0.9 });

    for (const t of targets.filter((t) => !t.inRange)) {
      const fp = t.footprint;
      this.highlightG.rect(fp.x * cs, fp.y * cs, fp.size * cs, fp.size * cs);
    }
    this.highlightG.stroke({ width: 1.5, color: SLATE, alpha: 0.55 });

    // Advantage pips, drawn on top. Batch fills by color: flanking (emerald,
    // top-left) then high ground (sky, top-right).
    const pipR = Math.max(3, cs * 0.11);
    const inset = pipR + 2;
    for (const t of targets) {
      if (!t.flanking) continue;
      const fp = t.footprint;
      this.highlightG.circle(fp.x * cs + inset, fp.y * cs + inset, pipR);
    }
    this.highlightG.fill({ color: EMERALD, alpha: 0.95 });
    for (const t of targets) {
      if (!t.highGround) continue;
      const fp = t.footprint;
      this.highlightG.circle((fp.x + fp.size) * cs - inset, fp.y * cs + inset, pipR);
    }
    this.highlightG.fill({ color: SKY, alpha: 0.95 });
  }

  clearTargeting(): void {
    this.rangeG.clear();
    this.aoeG.clear();
    this.highlightG.clear();
  }

  // -------------------------------------------------------------------------
  // Movement path
  // -------------------------------------------------------------------------

  /**
   * Draw the movement path from `origin` to `dest` as a polyline through the
   * Chebyshev unit steps, with a cost pill. Amber within budget, red when the
   * cost exceeds `remaining` (advisory — the move is still allowed).
   */
  showMovementPath(
    origin: GridCell,
    dest: GridCell,
    remaining: number,
  ): void {
    const cs = this.cellSize;
    const cells = chebyshevLine(origin, dest);
    const cost = cells.length - 1;
    this.movementG.clear();
    if (cost <= 0) {
      this.clearMovementLabel();
      return;
    }
    const overBudget = cost > remaining;
    const color = overBudget ? RED : AMBER;
    const center = (c: GridCell) => ({ x: c.x * cs + cs / 2, y: c.y * cs + cs / 2 });

    // Polyline through step centers.
    const start = center(cells[0]!);
    this.movementG.moveTo(start.x, start.y);
    for (let i = 1; i < cells.length; i++) {
      const p = center(cells[i]!);
      this.movementG.lineTo(p.x, p.y);
    }
    this.movementG.stroke({ width: 3, color, alpha: 0.85 });

    // Dots at each step.
    for (const c of cells) {
      const p = center(c);
      this.movementG.circle(p.x, p.y, 3);
    }
    this.movementG.fill({ color, alpha: 0.9 });

    this.drawMovementLabel(dest, `${cost} sq / ${cost * 5} ft${overBudget ? ' • over speed' : ''}`, color);
  }

  private drawMovementLabel(cell: GridCell, text: string, color: number): void {
    const cs = this.cellSize;
    if (this.movementLabel) this.removeChild(this.movementLabel);
    this.movementLabel = buildPill(text, color);
    this.movementLabel.x = cell.x * cs + cs / 2;
    this.movementLabel.y = cell.y * cs + cs + 18;
    this.addChild(this.movementLabel);
  }

  private clearMovementLabel(): void {
    if (this.movementLabel) {
      this.removeChild(this.movementLabel);
      this.movementLabel.destroy({ children: true });
      this.movementLabel = null;
    }
  }

  clearMovement(): void {
    this.movementG.clear();
    this.clearMovementLabel();
  }

  // -------------------------------------------------------------------------
  // Measure ruler
  // -------------------------------------------------------------------------

  showRuler(from: GridCell, to: GridCell): void {
    const cs = this.cellSize;
    const squares = Math.max(Math.abs(to.x - from.x), Math.abs(to.y - from.y));
    this.rulerG.clear();
    const a = { x: from.x * cs + cs / 2, y: from.y * cs + cs / 2 };
    const b = { x: to.x * cs + cs / 2, y: to.y * cs + cs / 2 };
    this.rulerG.moveTo(a.x, a.y);
    this.rulerG.lineTo(b.x, b.y);
    this.rulerG.stroke({ width: 2, color: SKY, alpha: 0.9 });
    this.rulerG.circle(a.x, a.y, 4);
    this.rulerG.circle(b.x, b.y, 4);
    this.rulerG.fill({ color: SKY, alpha: 0.9 });

    if (this.rulerLabel) this.removeChild(this.rulerLabel);
    this.rulerLabel = buildPill(`${squares} sq / ${squares * 5} ft`, SKY);
    this.rulerLabel.x = b.x;
    this.rulerLabel.y = b.y - 20;
    this.addChild(this.rulerLabel);
  }

  clearRuler(): void {
    this.rulerG.clear();
    if (this.rulerLabel) {
      this.removeChild(this.rulerLabel);
      this.rulerLabel.destroy({ children: true });
      this.rulerLabel = null;
    }
  }

  // -------------------------------------------------------------------------
  // Opportunity-attack warnings
  // -------------------------------------------------------------------------

  /** Mark squares where a move would provoke an opportunity attack. */
  showOAWarning(cells: GridCell[]): void {
    this.oaG.clear();
    const cs = this.cellSize;
    for (const cell of cells) {
      const cx = cell.x * cs + cs / 2;
      const cy = cell.y * cs + cs / 2;
      this.oaG.circle(cx, cy, cs * 0.32);
    }
    this.oaG.stroke({ width: 2, color: RED, alpha: 0.8 });
  }

  clearOA(): void {
    this.oaG.clear();
  }

  clearAll(): void {
    this.clearTargeting();
    this.clearMovement();
    this.clearRuler();
    this.clearOA();
  }

  override destroy(options?: Parameters<Container['destroy']>[0]): void {
    this.clearMovementLabel();
    if (this.rulerLabel) this.rulerLabel.destroy({ children: true });
    super.destroy(options);
  }
}

/** Build a rounded label pill centered at (0,0). */
function buildPill(label: string, color: number): Container {
  const container = new Container();
  const text = new Text({
    text: label,
    style: {
      fontFamily: 'system-ui, sans-serif',
      fontSize: 12,
      fill: 0xffffff,
      fontWeight: 'bold',
    },
  });
  text.anchor.set(0.5);
  const pad = 6;
  const bg = new Graphics();
  bg.roundRect(-text.width / 2 - pad, -text.height / 2 - pad / 2, text.width + pad * 2, text.height + pad, 4);
  bg.fill({ color: 0x000000, alpha: 0.8 });
  bg.stroke({ width: 1, color, alpha: 0.8 });
  container.addChild(bg);
  container.addChild(text);
  return container;
}

/** Expand a straight drag into Chebyshev unit steps (inclusive of both ends). */
function chebyshevLine(a: GridCell, b: GridCell): GridCell[] {
  const cells: GridCell[] = [{ x: a.x, y: a.y }];
  let cx = a.x;
  let cy = a.y;
  let guard = 0;
  while ((cx !== b.x || cy !== b.y) && guard++ < 500) {
    cx += Math.sign(b.x - cx);
    cy += Math.sign(b.y - cy);
    cells.push({ x: cx, y: cy });
  }
  return cells;
}
