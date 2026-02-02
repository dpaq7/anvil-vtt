/**
 * Draw Steel Characteristics (VTT version)
 * The five attributes that define a creature's capabilities
 *
 * Note: Same structure as hero/common Characteristics.
 * Both exports are available - use whichever import path is convenient.
 */

// Re-export from hero/common to avoid duplication
// CharacteristicName is already exported from hero/common
export type { Characteristics } from './hero/common.js';
