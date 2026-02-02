// Action Types
export type ActionType =
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

// Characteristic used for power roll
export type Characteristic = 'might' | 'agility' | 'reason' | 'intuition' | 'presence';

// Power Roll Tier Results
export interface TierResult {
  tier: 1 | 2 | 3;
  threshold: string;  // e.g., "11 or lower", "12-16", "17+"
  effect: string;
}

// Power Roll definition
export interface PowerRoll {
  characteristic: Characteristic;
  bonus?: number;
  tiers: TierResult[];
}

// Main Action Interface
export interface Action {
  id: string;
  name: string;
  type: ActionType;
  tags: ActionTag[];

  // Cost
  cost: number | string;  // number or "0+" or "1+" etc.
  costType?: 'essence' | 'recovery' | 'surge' | 'other';

  // Targeting
  target?: string;
  distance?: string;
  area?: string;

  // Power Roll (optional - not all actions have one)
  powerRoll?: PowerRoll;

  // Effects
  effect?: string;
  trigger?: string;  // For triggered actions

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
