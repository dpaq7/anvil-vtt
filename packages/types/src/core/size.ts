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
 * Numeric size in squares for calculations
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
