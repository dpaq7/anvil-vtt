/**
 * Complication Types for Draw Steel
 *
 * Enhanced with feature system ported from Forgesteel
 * (https://github.com/andyaiken/forgesteel)
 * Original work Copyright (c) Andy Aiken, Licensed under GPL-3.0
 *
 * Complications are optional backstory elements that give heroes
 * both benefits and drawbacks, adding depth to character creation.
 */

import type { Feature } from './feature.js';

/**
 * A character complication with benefit and drawback
 */
export interface Complication {
  /** Unique identifier (kebab-case) */
  id: string;

  /** Display name */
  name: string;

  /** Flavor text describing the complication */
  description: string;

  /**
   * Rich feature system for complex complications
   * Contains both benefits and drawbacks as structured features
   */
  features?: Feature[];

  /**
   * The positive effect granted by this complication
   * @deprecated Use features array for new complications
   */
  benefit?: string;

  /**
   * The negative effect imposed by this complication
   * @deprecated Use features array for new complications
   */
  drawback?: string;

  /** d100 roll number for random selection (1-100) */
  rollNumber?: number;
}

/**
 * A complication selected by a hero
 */
export interface SelectedComplication {
  /** The complication ID */
  complicationId: string;

  /** Optional notes about how this complication manifests */
  notes?: string;
}
