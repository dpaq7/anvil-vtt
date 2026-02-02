/**
 * Title Types for Draw Steel
 *
 * Enhanced with feature system ported from Forgesteel
 * (https://github.com/andyaiken/forgesteel)
 * Original work Copyright (c) Andy Aiken, Licensed under GPL-3.0
 *
 * Titles are earned achievements that provide lasting benefits.
 * They are organized into four echelons of increasing power.
 */

import type { Feature } from './feature.js';

/**
 * The four echelons of titles, representing tiers of achievement
 */
export type TitleEchelon = '1st' | '2nd' | '3rd' | '4th';

/**
 * A single effect granted by a title
 */
export interface TitleEffect {
  /** Name of the effect (for titles with choices) */
  name: string;

  /** Description of what the effect does */
  description: string;
}

/**
 * A title that can be earned by heroes
 */
export interface Title {
  /** Unique identifier (kebab-case) */
  id: string;

  /** Display name */
  name: string;

  /** Which echelon this title belongs to (1st, 2nd, 3rd, 4th) */
  echelon: TitleEchelon;

  /** Optional italic flavor text */
  flavorText?: string;

  /** What must be accomplished to earn this title */
  prerequisite: string;

  /**
   * Rich feature system for complex titles
   * Contains benefits, choices, and effects as structured features
   */
  features?: Feature[];

  /**
   * Effects granted by this title (if no choices)
   * @deprecated Use features array for new titles
   */
  effects?: TitleEffect[];

  /**
   * Optional choices - hero picks one of these effects
   * @deprecated Use features array with choice-type features
   */
  choices?: TitleEffect[];

  /** ID of the selected feature if the title offers choices */
  selectedFeatureId?: string;
}

/**
 * A title earned by a hero
 */
export interface EarnedTitle {
  /** The title ID */
  titleId: string;

  /** If the title had choices, which choice was made */
  choiceMade?: string;

  /** When this title was earned (for display) */
  earnedAt?: string;

  /** Optional notes about how this title was earned */
  notes?: string;
}

/**
 * Titles grouped by echelon for easy access
 */
export type TitlesByEchelon = Record<TitleEchelon, Title[]>;
