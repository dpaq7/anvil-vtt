// Ability and Feature types for Draw Steel

import type { Characteristic } from './common.js';

export type ActionType =
  | 'action'
  | 'main'             // Alias for 'action' (VTT uses this)
  | 'maneuver'
  | 'freeManeuver'
  | 'free-maneuver'    // Alias for 'freeManeuver' (VTT uses this)
  | 'triggered'
  | 'freeTriggered'
  | 'free-triggered'   // Alias for 'freeTriggered' (VTT uses this)
  | 'move'
  | 'noAction';

export interface PowerRoll {
  characteristic: Characteristic;
  // Alternative characteristics that can be used (e.g., "Power Roll + Might or Agility")
  alternativeCharacteristics?: Characteristic[];
  tier1: string; // "R damage"
  tier2: string; // "2 + R damage"
  tier3: string; // "4 + R damage"
}

// All heroic resource types used for ability costs
export type HeroicResourceName =
  | 'Wrath'      // Censor
  | 'Piety'      // Conduit
  | 'Essence'    // Elementalist, Summoner
  | 'Ferocity'   // Beastheart, Fury
  | 'Discipline' // Null
  | 'Insight'    // Shadow
  | 'Focus'      // Tactician
  | 'Clarity'    // Talent
  | 'Drama';     // Troubadour

// Flexible ability cost that supports all resource types
export interface AbilityCost {
  resource: HeroicResourceName;
  amount: number;
  isVariable?: boolean; // For "1+" style costs where you can spend more
}

// Additional effect with its own cost (for abilities with multiple optional effects)
export interface AdditionalEffect {
  cost?: string;      // "Spend 1 Essence", "Spend 2+ Piety" - kept as string for flexibility
  description: string;
}

export interface Ability {
  id: string;
  name: string;
  flavorText?: string;

  // Action economy
  actionType: ActionType;

  // Resource cost - flexible system supporting all heroic resources
  cost?: AbilityCost;
  /** @deprecated Use `cost` instead. Kept for backward compatibility. */
  essenceCost?: number;

  // Keywords
  keywords: string[]; // 'Magic', 'Ranged', 'Strike', 'Melee', 'Weapon', etc.

  // Targeting
  distance: string; // 'Melee 3', 'Ranged 10', 'Self', 'Summoner's Range', etc.
  target: string; // 'One creature', 'All allies in burst 3', etc.

  // Power roll (if applicable)
  powerRoll?: PowerRoll;

  // Effect text
  effect: string;

  // Additional effects with their own costs
  additionalEffects?: AdditionalEffect[];

  // Special costs/triggers
  trigger?: string; // For triggered actions
  /** @deprecated Use `additionalEffects` instead. Kept for backward compatibility. */
  spendEssence?: string; // "Spend 1 Essence: ..."
}

/**
 * Simple feature interface for backward compatibility
 * Note: The rich Feature type is in './feature.js'
 * @deprecated Use Feature from './feature.js' for new code
 */
export interface LegacyFeature {
  id: string;
  name: string;
  description: string;
  levelRequired?: number;
}

export interface MinionTrait {
  name: string;
  description: string;
}

export interface FixtureTrait {
  name: string;
  description: string;
}
