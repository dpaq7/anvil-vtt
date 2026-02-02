/**
 * Level-Up Wizard Type Definitions
 * Supports multi-step wizard flow for character advancement
 */

import { HeroClass } from './hero.js';
import { LevelFeature } from './progression.js';

/**
 * Possible steps in the level-up wizard
 */
export type LevelUpStep =
  | 'overview'
  | 'skill'
  | 'ability'
  | 'perk'
  | 'subclass'
  | 'confirmation';

/**
 * A choice made during level-up
 */
export interface LevelUpChoice {
  type: 'skill' | 'ability' | 'perk' | 'subclass-feature' | 'stat-boost' | 'ward' | 'circle-upgrade';
  id: string;
  name: string;
  /** For display in confirmation */
  description?: string;
  /** Optional: the category for the choice (e.g., '7-essence', 'stat-boost') */
  category?: string;
}

/**
 * State of the level-up wizard
 */
export interface LevelUpState {
  targetLevel: number;
  currentStep: LevelUpStep;
  /** Steps this level-up requires (computed from class progression) */
  requiredSteps: LevelUpStep[];
  /** Choices made so far */
  choices: LevelUpChoice[];
  /** Features automatically granted (no choice needed) */
  automaticFeatures: AutomaticFeature[];
}

/**
 * An automatic feature granted at this level
 */
export interface AutomaticFeature {
  id: string;
  name: string;
  description: string;
  type?: string;
}

/**
 * Stat changes preview for level-up
 */
export interface StatChangesPreview {
  stamina?: { from: number; to: number };
  characteristics?: { stat: string; from: number; to: number }[];
  minionCap?: number;
  essencePerTurn?: number;
  allStats?: number;
}

/**
 * Labels for progress indicator
 */
export const STEP_LABELS: Record<LevelUpStep, string> = {
  overview: 'Overview',
  skill: 'Skill',
  ability: 'Ability',
  perk: 'Perk',
  subclass: 'Subclass',
  confirmation: 'Confirm',
};

/**
 * Icons for step types (using emoji for simplicity)
 */
export const STEP_ICONS: Record<LevelUpStep, string> = {
  overview: '📋',
  skill: '📚',
  ability: '⚔️',
  perk: '✨',
  subclass: '🎭',
  confirmation: '✓',
};
