// Unified Level Progression Display Types
// Used for displaying what a hero has gained at each level across all classes

import { type HeroClass } from './hero.js';

// What type of progression item is this?
export type ProgressionItemType =
  | 'feature'           // Class/subclass feature
  | 'perk'              // Perk slot gained
  | 'skill'             // Skill slot gained
  | 'ability-unlock'    // New ability tier unlocked (e.g., "7-Ferocity abilities")
  | 'ability-choice'    // Specific ability chosen
  | 'stat-increase'     // Characteristic increase
  | 'resource-upgrade'  // Resource gain improvement
  | 'subclass-feature'  // Subclass-specific feature
  | 'kit-upgrade'       // Kit improvement
  | 'epic-resource';    // Level 10 epic resource

export interface ProgressionDisplayItem {
  id: string;
  type: ProgressionItemType;
  name: string;
  description: string;
  level: number;

  // Optional metadata
  isSubclassSpecific?: boolean;
  subclassId?: string;
  isChoice?: boolean;        // Was this a player choice?
  chosenOptionId?: string;   // If choice, what was selected?
  chosenOptionName?: string; // Display name of chosen option
}

export interface LevelProgressionSummary {
  level: number;
  items: ProgressionDisplayItem[];
}

// Configuration for displaying each progression type
export interface ProgressionTypeConfig {
  icon: string;
  colorVar: string;
  label: string;
}

// Helper to get display icon/color by type
export const progressionTypeConfig: Record<ProgressionItemType, ProgressionTypeConfig> = {
  'feature': { icon: '✦', colorVar: '--accent-primary', label: 'Feature' },
  'perk': { icon: '◆', colorVar: '--color-warning', label: 'Perk' },
  'skill': { icon: '📚', colorVar: '--color-info', label: 'Skill' },
  'ability-unlock': { icon: '⚔', colorVar: '--color-essence', label: 'Abilities' },
  'ability-choice': { icon: '★', colorVar: '--color-essence', label: 'Ability' },
  'stat-increase': { icon: '↑', colorVar: '--color-success', label: 'Stats' },
  'resource-upgrade': { icon: '⚡', colorVar: '--accent-bright', label: 'Resource' },
  'subclass-feature': { icon: '◈', colorVar: '--accent-secondary', label: 'Subclass' },
  'kit-upgrade': { icon: '🛡', colorVar: '--text-bone', label: 'Kit' },
  'epic-resource': { icon: '👑', colorVar: '--color-legendary', label: 'Epic' },
};

// Level 1 starting features by class
export interface ClassStartingFeatures {
  heroClass: HeroClass;
  features: Omit<ProgressionDisplayItem, 'level'>[];
}
