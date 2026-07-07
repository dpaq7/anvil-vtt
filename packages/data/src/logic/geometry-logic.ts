/**
 * Geometry Logic
 *
 * Pure grid geometry for the Battle scene: Chebyshev distance, multi-cell token
 * footprints, area-of-effect templates (burst/cube/line/wall/aura), and the
 * position-based combat modifiers flanking and high ground.
 *
 * Draw Steel uses Chebyshev distance on the grid — "there's no Pythagorean
 * theorem on the grid" — so a diagonal step costs the same as an orthogonal one.
 *
 * These functions are deterministic and dependency-free (no Pixi/React/network),
 * so both the client (targeting preview) and the server (authoritative range
 * checks) call the same code. Difficult terrain and wall line-of-effect are
 * intentionally out of scope here.
 */

import type { ParsedDistance } from './ability-logic.js';

/** A single grid cell / point, in integer grid coordinates. */
export interface GridPoint {
  x: number;
  y: number;
}

/**
 * A token's footprint on the grid: its top-left cell (`x`, `y`) and its edge
 * length in whole squares (`size`; 1 for all size-1 creatures, 2/3/4 for larger).
 * The footprint occupies cells `[x, x+size-1] × [y, y+size-1]`.
 */
export interface TokenFootprint {
  x: number;
  y: number;
  size: number;
}

/** Bounds of the active battle grid, in cells. */
export interface GridBounds {
  cols: number;
  rows: number;
}

/** Options for {@link getAffectedSquares}. */
export interface AffectedSquaresOptions {
  /** Emanating creature's footprint (for burst/aura, which radiate from the caster). */
  casterFootprint?: TokenFootprint;
  /** Facing for line/wall templates (any vector; reduced to an 8-way direction). */
  direction?: GridPoint;
  /** When provided, results are clamped to these grid bounds. */
  bounds?: GridBounds;
}

// ---------------------------------------------------------------------------
// Footprints & distance
// ---------------------------------------------------------------------------

/** Build a footprint from a token's top-left cell and edge length. */
export function makeFootprint(x: number, y: number, size = 1): TokenFootprint {
  return { x, y, size: Math.max(1, Math.floor(size)) };
}

/** All grid cells a footprint occupies. */
export function footprintCells(fp: TokenFootprint): GridPoint[] {
  const cells: GridPoint[] = [];
  for (let dx = 0; dx < fp.size; dx++) {
    for (let dy = 0; dy < fp.size; dy++) {
      cells.push({ x: fp.x + dx, y: fp.y + dy });
    }
  }
  return cells;
}

/** Geometric center of a footprint (may be a half-cell for even sizes). */
export function footprintCenter(fp: TokenFootprint): GridPoint {
  return { x: fp.x + (fp.size - 1) / 2, y: fp.y + (fp.size - 1) / 2 };
}

/**
 * Chebyshev distance between two points: `max(|dx|, |dy|)`.
 * This is the canonical Draw Steel grid distance (diagonal == orthogonal).
 */
export function chebyshevDistance(a: GridPoint, b: GridPoint): number {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}

/**
 * Minimum Chebyshev distance from any occupied square of a (possibly multi-cell)
 * token to a point. Returns 0 if the point is inside the footprint. Large tokens
 * measure range from their nearest square, not their corner or center.
 */
export function distanceFromFootprint(fp: TokenFootprint, point: GridPoint): number {
  const dx = Math.max(fp.x - point.x, point.x - (fp.x + fp.size - 1), 0);
  const dy = Math.max(fp.y - point.y, point.y - (fp.y + fp.size - 1), 0);
  return Math.max(dx, dy);
}

/** Minimum Chebyshev distance between two footprints (0 if they overlap). */
export function distanceBetweenFootprints(a: TokenFootprint, b: TokenFootprint): number {
  const dx = Math.max(a.x - (b.x + b.size - 1), b.x - (a.x + a.size - 1), 0);
  const dy = Math.max(a.y - (b.y + b.size - 1), b.y - (a.y + a.size - 1), 0);
  return Math.max(dx, dy);
}

/** True if two footprints are adjacent (touching, Chebyshev distance 1). */
export function areAdjacent(a: TokenFootprint, b: TokenFootprint): boolean {
  return distanceBetweenFootprints(a, b) === 1;
}

// ---------------------------------------------------------------------------
// Range & area templates
// ---------------------------------------------------------------------------

function inBounds(p: GridPoint, bounds?: GridBounds): boolean {
  if (!bounds) return true;
  return p.x >= 0 && p.y >= 0 && p.x < bounds.cols && p.y < bounds.rows;
}

function dedupe(cells: GridPoint[]): GridPoint[] {
  const seen = new Set<string>();
  const out: GridPoint[] = [];
  for (const c of cells) {
    const key = `${c.x},${c.y}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push(c);
    }
  }
  return out;
}

/**
 * All cells within `range` (Chebyshev) of an origin point, optionally clamped to
 * the grid. Used for melee/ranged reach rings.
 */
export function getSquaresInRange(
  origin: GridPoint,
  range: number,
  bounds?: GridBounds
): GridPoint[] {
  const cells: GridPoint[] = [];
  for (let dx = -range; dx <= range; dx++) {
    for (let dy = -range; dy <= range; dy++) {
      const p = { x: origin.x + dx, y: origin.y + dy };
      if (inBounds(p, bounds)) cells.push(p);
    }
  }
  return cells;
}

/** Squares within `range` of any square of a footprint (for a multi-cell caster). */
export function getSquaresInRangeOfFootprint(
  fp: TokenFootprint,
  range: number,
  bounds?: GridBounds
): GridPoint[] {
  const cells: GridPoint[] = [];
  for (let x = fp.x - range; x < fp.x + fp.size + range; x++) {
    for (let y = fp.y - range; y < fp.y + fp.size + range; y++) {
      const p = { x, y };
      if (distanceFromFootprint(fp, p) <= range && inBounds(p, bounds)) cells.push(p);
    }
  }
  return cells;
}

/**
 * "N burst" — a filled `(2N+1)×(2N+1)` block of squares centered on the origin
 * (the emanating creature's space).
 */
export function getBurstSquares(origin: GridPoint, radius: number): GridPoint[] {
  return getSquaresInRange(origin, radius);
}

/**
 * "N cube" — an `N×N` block anchored with its minimum corner at `origin`.
 * The caller offsets `origin` so the cursor sits where the user expects
 * (e.g. under the near corner).
 */
export function getCubeSquares(origin: GridPoint, size: number): GridPoint[] {
  const cells: GridPoint[] = [];
  for (let dx = 0; dx < size; dx++) {
    for (let dy = 0; dy < size; dy++) {
      cells.push({ x: origin.x + dx, y: origin.y + dy });
    }
  }
  return cells;
}

/**
 * "N aura" — every square within `radius` of the caster's footprint, including
 * the footprint itself. Auras move with their creature, so recompute this each
 * time the caster moves rather than caching it.
 */
export function getAuraSquares(caster: TokenFootprint, radius: number): GridPoint[] {
  return getSquaresInRangeOfFootprint(caster, radius);
}

/** Reduce an arbitrary vector to one of the 8 grid directions (defaults to +x). */
export function normalizeDirection(d: GridPoint): GridPoint {
  // `|| 0` also collapses -0 to 0 so callers get clean {-1,0,1} components.
  const nx = Math.sign(d.x) || 0;
  const ny = Math.sign(d.y) || 0;
  if (nx === 0 && ny === 0) return { x: 1, y: 0 };
  return { x: nx, y: ny };
}

/**
 * "L x W line" — a line `length` squares long in `direction`, `width` squares
 * wide (centered on the line), starting at `origin`.
 */
export function getLineSquares(
  origin: GridPoint,
  direction: GridPoint,
  length: number,
  width = 1
): GridPoint[] {
  const dir = normalizeDirection(direction);
  const perp = { x: -dir.y, y: dir.x };
  const halfLow = Math.floor((width - 1) / 2);
  const cells: GridPoint[] = [];
  for (let i = 0; i < length; i++) {
    for (let w = -halfLow; w <= width - 1 - halfLow; w++) {
      cells.push({
        x: origin.x + dir.x * i + perp.x * w,
        y: origin.y + dir.y * i + perp.y * w,
      });
    }
  }
  return dedupe(cells);
}

/** "L wall" — geometrically identical to a line; width defaults to 1. */
export function getWallSquares(
  origin: GridPoint,
  direction: GridPoint,
  length: number,
  width = 1
): GridPoint[] {
  return getLineSquares(origin, direction, length, width);
}

/**
 * Resolve the set of grid squares an ability's area covers, dispatched on the
 * parsed distance `type`. Non-area distances (melee/ranged/self/within/special)
 * return an empty set — the UI highlights the individual target instead.
 *
 * `origin` is the template's anchor: the placement point for cube/line/wall, and
 * the emanating creature's position for burst/aura (pass `casterFootprint` too).
 */
export function getAffectedSquares(
  parsed: ParsedDistance,
  origin: GridPoint,
  opts: AffectedSquaresOptions = {}
): GridPoint[] {
  const caster = opts.casterFootprint ?? makeFootprint(origin.x, origin.y, 1);
  const dir = opts.direction ?? { x: 1, y: 0 };
  let cells: GridPoint[];

  switch (parsed.type) {
    case 'burst':
      cells = getSquaresInRangeOfFootprint(caster, parsed.baseValue);
      break;
    case 'aura':
      cells = getAuraSquares(caster, parsed.baseValue);
      break;
    case 'cube':
      cells = getCubeSquares(origin, parsed.baseValue);
      break;
    case 'line':
      cells = getLineSquares(origin, dir, parsed.baseValue, parsed.width ?? 1);
      break;
    case 'wall':
      cells = getWallSquares(origin, dir, parsed.baseValue, parsed.width ?? 1);
      break;
    default:
      // melee / ranged / self / within / special have no area template.
      cells = [];
  }

  return opts.bounds ? cells.filter((c) => inBounds(c, opts.bounds)) : cells;
}

// ---------------------------------------------------------------------------
// Position-based combat modifiers
// ---------------------------------------------------------------------------

/**
 * Position-only flanking: true if an ally of the attacker is adjacent to the
 * target on the directly opposite side (or corner) from the attacker, who must
 * also be adjacent. Per Draw Steel, a line through the target's center from the
 * attacker to the ally means the target is flanked and melee strikes gain an edge.
 *
 * NOTE: this does not check line of effect (walls are out of scope), so callers
 * should present the result as advisory.
 */
export function isFlanked(
  attacker: TokenFootprint,
  target: TokenFootprint,
  allies: TokenFootprint[]
): boolean {
  if (!areAdjacent(attacker, target)) return false;

  const tc = footprintCenter(target);
  const ac = footprintCenter(attacker);
  const aDir = { x: Math.sign(ac.x - tc.x), y: Math.sign(ac.y - tc.y) };
  if (aDir.x === 0 && aDir.y === 0) return false;

  return allies.some((ally) => {
    if (!areAdjacent(ally, target)) return false;
    const lc = footprintCenter(ally);
    const bDir = { x: Math.sign(lc.x - tc.x), y: Math.sign(lc.y - tc.y) };
    return bDir.x === -aDir.x && bDir.y === -aDir.y && (bDir.x !== 0 || bDir.y !== 0);
  });
}

/**
 * High ground: an attacker higher than their target gains an edge. Elevation is
 * measured in squares; any positive difference qualifies.
 */
export function hasHighGround(attackerElevation: number, targetElevation: number): boolean {
  return attackerElevation > targetElevation;
}
