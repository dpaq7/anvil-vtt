// Project and Inventory type definitions

import type { Characteristic } from './common';

export type ProjectType = 'research' | 'crafting' | 'other';

export type ProjectStatus = 'not_started' | 'in_progress' | 'completed';

export interface ProjectTemplate {
  id: string;
  name: string;
  type: ProjectType;
  description: string;
  goalRange?: { min: number; max: number }; // Variable goal based on tier/level
  fixedGoal?: number; // Fixed goal amount
  applicableSkills: string[]; // Skills that grant +2 bonus
  prerequisites?: string; // Description of required items/sources
  outcome: string; // What completing the project grants
  characteristic?: Characteristic | Characteristic[]; // Which characteristic to roll
  variableGoalFormula?: string; // e.g., "50 x creature level" for Find a Cure
}

export interface ActiveProject {
  id: string;
  templateId: string;
  name: string;
  type: ProjectType;
  goal: number; // The specific goal for this instance
  currentPoints: number;
  status: ProjectStatus;
  notes: string;
  rollHistory: ProjectRoll[];
  createdAt: number;
  completedAt?: number;
  customName?: string; // User-defined name override
  selectedCharacteristic?: Characteristic; // For multi-characteristic projects
}

export interface AppliedModifier {
  type: 'skill' | 'edge' | 'doubleEdge' | 'bane' | 'doubleBane' | 'languageBarrier';
  name: string;
  value: number;
}

export interface ProjectRoll {
  timestamp: number;
  baseRoll: number;
  modifier: number;
  total: number;
  isBreakthrough: boolean; // Natural 19 or 20
  bonusRollTotal?: number; // If breakthrough, the second roll
  appliedModifiers?: AppliedModifier[]; // Track what contributed to modifier
}

// Inventory types
export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'legendary';

// ItemCategory for inventory items (distinct from equipment ItemCategory)
export type InventoryItemCategory = 'weapon' | 'armor' | 'implement' | 'consumable' | 'treasure' | 'material' | 'misc';

export interface InventoryItem {
  id: string;
  name: string;
  category: InventoryItemCategory;
  rarity: ItemRarity;
  quantity: number;
  description: string;
  level?: number; // For leveled treasures
  enhancements?: ItemEnhancement[];
  notes?: string;
}

export interface ItemEnhancement {
  level: number; // 1, 5, or 9
  name: string;
  description: string;
}

// Lore discovery tiers
export type LoreTier = 'common' | 'obscure' | 'lost' | 'forbidden';

export const LORE_GOALS: Record<LoreTier, number> = {
  common: 15,
  obscure: 45,
  lost: 120,
  forbidden: 240,
};

// Enhancement project goals by level
export const ENHANCEMENT_GOALS: Record<number, number> = {
  1: 150,
  5: 300,
  9: 450,
};
