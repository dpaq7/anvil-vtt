import { Container, Graphics, Text } from 'pixi.js';
import { CANVAS_FONT, getCanvasTheme } from '../theme.js';

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
    const palette = getCanvasTheme();
    this.rangeG.fill({ color: palette.targetRange, alpha: palette.targetRangeFillAlpha });
    this.rangeG.stroke({ width: 1, color: palette.targetRange, alpha: palette.targetRangeEdgeAlpha });
  }

  /** Tint the squares an AoE template covers (hazard when placeable, ink when not). */
  showAoETemplate(cells: GridCell[], valid: boolean): void {
    this.aoeG.clear();
    const cs = this.cellSize;
    const palette = getCanvasTheme();
    const color = valid ? palette.aoeValid : palette.aoeInvalid;
    const drawCells = () => {
      for (const cell of cells) this.aoeG.rect(cell.x * cs, cell.y * cs, cs, cs);
    };
    drawCells();
    this.aoeG.fill({ color, alpha: valid ? 0.32 : 0.22 });
    if (valid) {
      // Hazard reads on any map only with its ink edge under it.
      drawCells();
      this.aoeG.stroke({ width: 3.5, color: palette.targetingEdge, alpha: 1 });
      drawCells();
      this.aoeG.stroke({ width: 1.5, color, alpha: 1 });
    } else {
      drawCells();
      this.aoeG.stroke({ width: 1.5, color, alpha: 0.7 });
    }
  }

  /**
   * Outline candidate target footprints. In-range targets get a solid hazard
   * outline; out-of-range targets a fainter ink outline (still selectable —
   * advisory). Flanking and high-ground advantages are marked with corner pips
   * (blue = flanking, top-left; ink = high ground, top-right), sized relative to
   * the footprint so they stay legible at any zoom.
   */
  highlightTargets(targets: TargetHighlight[]): void {
    this.highlightG.clear();
    const cs = this.cellSize;
    const palette = getCanvasTheme();

    // Outlines first, grouped by range state so each stroke color batches.
    // In range: a 2.5 px hazard ring with 1.5 px of ink outside it (DESIGN.md 11).
    const inRange = targets.filter((t) => t.inRange);
    const drawInRange = (grow: number) => {
      for (const t of inRange) {
        const fp = t.footprint;
        this.highlightG.rect(fp.x * cs - grow, fp.y * cs - grow, fp.size * cs + grow * 2, fp.size * cs + grow * 2);
      }
    };
    // Pixi re-styles the last shape when a fill or stroke has no path of its own, which painted
    // every target solid. So each batch runs only when it has shapes.
    if (inRange.length > 0) {
      drawInRange(0.75);
      this.highlightG.stroke({ width: 4, color: palette.targetingEdge, alpha: 1 });
      drawInRange(0);
      this.highlightG.stroke({ width: 2.5, color: palette.targeting, alpha: 1 });
    }

    const outOfRange = targets.filter((t) => !t.inRange);
    for (const t of outOfRange) {
      const fp = t.footprint;
      this.highlightG.rect(fp.x * cs, fp.y * cs, fp.size * cs, fp.size * cs);
    }
    if (outOfRange.length > 0) {
      this.highlightG.stroke({ width: 1.5, color: palette.targetInvalid, alpha: palette.targetInvalidAlpha });
    }

    // Advantage pips, drawn on top. Batch fills by color: flanking (top-left)
    // then high ground (top-right).
    const pipR = Math.max(3, cs * 0.11);
    const inset = pipR + 2;
    const flanking = targets.filter((t) => t.flanking);
    for (const t of flanking) {
      const fp = t.footprint;
      this.highlightG.circle(fp.x * cs + inset, fp.y * cs + inset, pipR);
    }
    if (flanking.length > 0) this.highlightG.fill({ color: palette.targetFlankPip, alpha: 0.95 });
    const highGround = targets.filter((t) => t.highGround);
    for (const t of highGround) {
      const fp = t.footprint;
      this.highlightG.circle((fp.x + fp.size) * cs - inset, fp.y * cs + inset, pipR);
    }
    if (highGround.length > 0) this.highlightG.fill({ color: palette.targetHighGroundPip, alpha: 0.95 });
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
   * Chebyshev unit steps, with a cost pill. Blue within budget, hazard when the
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
    const palette = getCanvasTheme();
    const color = overBudget ? palette.warning : palette.moveTrail;
    const center = (c: GridCell) => ({ x: c.x * cs + cs / 2, y: c.y * cs + cs / 2 });

    // Polyline through step centers. Over budget, the hazard line sits on an ink edge.
    const drawPath = () => {
      const start = center(cells[0]!);
      this.movementG.moveTo(start.x, start.y);
      for (let i = 1; i < cells.length; i++) {
        const p = center(cells[i]!);
        this.movementG.lineTo(p.x, p.y);
      }
    };
    if (overBudget) {
      drawPath();
      this.movementG.stroke({ width: 6, color: palette.warningEdge, alpha: 1, cap: 'round', join: 'round' });
    }
    drawPath();
    this.movementG.stroke({ width: 3, color, alpha: overBudget ? 1 : 0.85, cap: 'round', join: 'round' });

    // Dots at each step.
    for (const c of cells) {
      const p = center(c);
      this.movementG.circle(p.x, p.y, 3);
    }
    this.movementG.fill({ color, alpha: overBudget ? 1 : 0.9 });
    if (overBudget) {
      for (const c of cells) {
        const p = center(c);
        this.movementG.circle(p.x, p.y, 3);
      }
      this.movementG.stroke({ width: 1.5, color: palette.warningEdge, alpha: 1 });
    }

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
    const palette = getCanvasTheme();
    this.rulerG.stroke({ width: 2, color: palette.ruler, alpha: 0.9 });
    this.rulerG.circle(a.x, a.y, 4);
    this.rulerG.circle(b.x, b.y, 4);
    this.rulerG.fill({ color: palette.ruler, alpha: 0.9 });

    if (this.rulerLabel) this.removeChild(this.rulerLabel);
    this.rulerLabel = buildPill(`${squares} sq / ${squares * 5} ft`, palette.ruler);
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
    const palette = getCanvasTheme();
    // 2 px hazard ring with an ink edge (DESIGN.md 11).
    const drawRings = () => {
      for (const cell of cells) {
        const cx = cell.x * cs + cs / 2;
        const cy = cell.y * cs + cs / 2;
        this.oaG.circle(cx, cy, cs * 0.32);
      }
    };
    drawRings();
    this.oaG.stroke({ width: 4, color: palette.warningEdge, alpha: 1 });
    drawRings();
    this.oaG.stroke({ width: 2, color: palette.warning, alpha: 1 });
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

/** Build a label pill centered at (0,0): a map label plate with a coloured edge. */
function buildPill(label: string, color: number): Container {
  const palette = getCanvasTheme();
  const container = new Container();
  const text = new Text({
    text: label,
    style: {
      fontFamily: CANVAS_FONT,
      fontSize: 13,
      fill: palette.labelText,
      fontWeight: 'bold',
    },
  });
  text.anchor.set(0.5);
  const pad = 6;
  const bg = new Graphics();
  bg.roundRect(-text.width / 2 - pad, -text.height / 2 - pad / 2, text.width + pad * 2, text.height + pad, 4);
  bg.fill({ color: palette.labelPlate, alpha: 1 });
  bg.stroke({ width: 1.5, color: color === palette.warning ? palette.labelKeyline : color, alpha: 1 });
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
