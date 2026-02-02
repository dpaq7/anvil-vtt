/**
 * Mettle Action Types
 * For action execution and power roll tracking in the character manager
 */

import type { Characteristic } from './common.js';

// UI Action Types (different from combat ActionType)
export type UIActionType =
  | 'main'
  | 'maneuver'
  | 'triggered'
  | 'free'
  | 'heroic'
  | 'signature'
  | 'villain'
  | 'utility';

// Action Category Tags
export type ActionTag = 'freeStrike' | 'signature' | 'heroic' | 'other';

// Power Roll Tier Results
export interface TierResult {
  tier: 1 | 2 | 3;
  threshold: string; // e.g., "11 or lower", "12-16", "17+"
  effect: string;
}

// Power Roll definition for actions
export interface ActionPowerRoll {
  characteristic: Characteristic;
  bonus?: number;
  tiers: TierResult[];
}

// Main Action Interface (for Mettle UI)
export interface UIAction {
  id: string;
  name: string;
  type: UIActionType;
  tags: ActionTag[];

  // Cost
  cost: number | string; // number or "0+" or "1+" etc.
  costType?: 'essence' | 'recovery' | 'surge' | 'other';

  // Targeting
  target?: string;
  distance?: string;
  area?: string;

  // Power Roll (optional - not all actions have one)
  powerRoll?: ActionPowerRoll;

  // Effects
  effect?: string;
  trigger?: string; // For triggered actions

  // Keywords
  keywords: string[];

  // Additional
  notes?: string;
}

// Action Roll Result
export interface ActionRollResult {
  type: 'power';
  dice: [number, number];
  characteristic: Characteristic;
  characteristicBonus: number;
  additionalBonus: number;
  total: number;
  tier: 1 | 2 | 3;
  tierEffect?: string;
  actionName: string;
  timestamp: number;
}
