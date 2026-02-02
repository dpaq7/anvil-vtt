// Character Progression Types - SRD Section 6

import type { Characteristic } from './common.js';
import type { SummonerCircle } from './summoner';

export interface FeatureChoice {
  id: string;
  name: string;
  description: string;
  // For abilities that have mechanical effects
  effect?: string;
}

export interface LevelFeature {
  id: string;
  name: string;
  description: string;
  type: 'automatic' | 'choice';
  // For choice features
  choices?: FeatureChoice[];
  // Category for grouping (e.g., 'ward', '7-essence', 'circle-upgrade')
  category?: string;
}

export interface StatChanges {
  // Shared stat changes
  allStats?: number; // Add to all characteristics (max 4)

  // Summoner-specific
  reason?: number; // Set Reason to this value
  minionCap?: number; // Add to minion cap
  essencePerTurn?: number; // Set essence per turn to this value
  freeSummonCount?: number; // Add to free summon count per turn
  signatureStaminaBonus?: number; // Add to signature minion stamina (L4, L7, L10)
  threeEssenceStaminaBonus?: number; // Add to 3-cost minion stamina (L4, L7, L10)
  fiveEssenceStaminaBonus?: number; // Add to 5-cost minion stamina (L4, L7, L10)
  sevenEssenceStaminaBonus?: number; // Add to 7-cost minion stamina (L7, L10)

  // Fury-specific
  might?: number; // Set Might to this value
  agility?: number; // Set Agility to this value
}

export interface LevelProgression {
  level: number;
  features: LevelFeature[];
  statChanges?: StatChanges;
}

// Ward types for Kit upgrades (Level 3 and 9)
export type WardType = 'conjured' | 'emergency' | 'howling' | 'snare';

export interface Ward {
  id: WardType;
  name: string;
  description: string;
}

// 7-Essence ability choices (Level 3)
export interface SevenEssenceAbility {
  id: string;
  name: string;
  description: string;
  cost: 7;
}

// 9-Essence ability choices (Level 6) - Champion abilities
export interface NineEssenceAbility {
  id: string;
  name: string;
  description: string;
  cost: 9;
}

// 11-Essence ability choices (Level 9)
export interface ElevenEssenceAbility {
  id: string;
  name: string;
  description: string;
  cost: 11;
}

// Circle-specific upgrades (Level 5)
export interface CircleUpgrade {
  id: string;
  circle: SummonerCircle;
  name: string;
  description: string;
}

// Feature categories for organizing level-up choices
export type FeatureCategory =
  // Summoner categories
  | 'ward'
  | 'second-ward'
  | '7-essence'
  | '9-essence'
  | '11-essence'
  | 'circle-upgrade'
  | 'stat-boost'
  // Fury categories
  | 'aspect-feature'
  | '7-ferocity'
  | '9-ferocity'
  | '11-ferocity'
  | 'aspect-5-ferocity'
  | 'aspect-9-ferocity'
  | 'aspect-11-ferocity';

// Stored character progression choices
export interface ProgressionChoices {
  // ===================
  // Summoner choices
  // ===================
  // Level 3 choices
  ward?: WardType;
  sevenEssenceAbility?: string;

  // Level 4 choice
  statBoost?: Characteristic;

  // Level 5 choice
  circleUpgrade?: string;

  // Level 6 choice
  nineEssenceAbility?: string;

  // Level 9 choices
  secondWard?: WardType;
  elevenEssenceAbility?: string;

  // ===================
  // Fury choices
  // ===================
  // Level 3: 7-Ferocity ability
  sevenFerocityAbility?: string;

  // Level 5: 9-Ferocity ability
  nineFerocityAbility?: string;

  // Level 8: 11-Ferocity ability
  elevenFerocityAbility?: string;

  // Level 2: Aspect-specific 5-Ferocity ability
  aspectFiveFerocity?: string;

  // Level 6: Aspect-specific 9-Ferocity ability
  aspectNineFerocity?: string;

  // Level 9: Aspect-specific 11-Ferocity ability
  aspectElevenFerocity?: string;
}
