/**
 * Draw Steel Sizes
 * Token sizes for creatures and objects
 */

/**
 * Token sizes in Draw Steel
 * - 1T: Tiny - 1/4 square
 * - 1S: Small - 1/2 square
 * - 1M: Medium - 1 square
 * - 1L: Large - 1 square (bigger than medium)
 * - 2: 2x2 squares
 * - 3: 3x3 squares
 * - 4: 4x4 squares
 */
export type Size = '1T' | '1S' | '1M' | '1L' | '2' | '3' | '4';

/**
 * Numeric size in squares (area) for calculations.
 */
export function sizeToSquares(size: Size): number {
  switch (size) {
    case '1T': return 0.25;
    case '1S': return 0.5;
    case '1M': return 1;
    case '1L': return 1;
    case '2': return 4;
    case '3': return 9;
    case '4': return 16;
  }
}

/**
 * Edge length of a token's footprint in whole grid squares (the N in an NxN
 * space). All size-1 creatures (1T/1S/1M/1L) occupy a single square minimum
 * per the combat rules, so they return 1; larger sizes return their side length.
 *
 * Use this (not {@link sizeToSquares}, which returns area) when building a
 * grid footprint for range, movement, or forced-movement math.
 */
export function sizeToEdgeLength(size: Size): number {
  switch (size) {
    case '1T':
    case '1S':
    case '1M':
    case '1L':
      return 1;
    case '2': return 2;
    case '3': return 3;
    case '4': return 4;
  }
}

/**
 * Compare two sizes by their combat "size category" ordering
 * (1T &lt; 1S &lt; 1M &lt; 1L &lt; 2 &lt; 3 &lt; 4). Returns a negative number if `a` is
 * smaller, positive if larger, 0 if the same category.
 */
export function compareSize(a: Size, b: Size): number {
  const order: Size[] = ['1T', '1S', '1M', '1L', '2', '3', '4'];
  return order.indexOf(a) - order.indexOf(b);
}
