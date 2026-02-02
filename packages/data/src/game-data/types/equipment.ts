// Equipment and Inventory types for magic items

import type { EquipmentSlot, ItemCategory } from '../data/magicItems.js';

export type BonusStat =
  | 'stamina'
  | 'stability'
  | 'speed'
  | 'damage'
  | 'might'
  | 'agility'
  | 'reason'
  | 'intuition'
  | 'presence'
  | 'savingThrow'
  | 'rangeDistance';

export interface StatBonus {
  stat: BonusStat;
  value: number;
  conditional?: string; // e.g., "vs winded targets", "when flying"
}

export interface EquippedItem {
  itemId: string;
  name: string;
  slot: EquipmentSlot;
  category: ItemCategory;
  effect: string;
  bonuses: StatBonus[];
  equippedAt: number;
  currentEnhancementLevel?: number; // For leveled items, tracks which enhancement tier (1, 5, or 9)
}

// All available equipment slots
export const EQUIPMENT_SLOTS: EquipmentSlot[] = [
  'head',
  'neck',
  'armor',
  'arms',
  'hands',
  'waist',
  'feet',
  'ring',
  'weapon',
  'implement',
  'held',
  'mount',
];

// Slot display labels
export const SLOT_LABELS: Record<EquipmentSlot, string> = {
  head: 'Head',
  neck: 'Neck',
  armor: 'Armor',
  arms: 'Arms',
  hands: 'Hands',
  waist: 'Waist',
  feet: 'Feet',
  ring: 'Ring',
  weapon: 'Weapon',
  implement: 'Implement',
  held: 'Held',
  mount: 'Mount',
};

// Slot icons for visual display
export const SLOT_ICONS: Record<EquipmentSlot, string> = {
  head: '👑',
  neck: '📿',
  armor: '🛡️',
  arms: '💪',
  hands: '🧤',
  waist: '🎗️',
  feet: '👢',
  ring: '💍',
  weapon: '⚔️',
  implement: '🔮',
  held: '✋',
  mount: '🐎',
};
