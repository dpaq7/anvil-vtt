// Enhanced item types for comprehensive stat modifiers
// Extends existing equipment.ts types with structured stat bonuses

import { type HeroClass } from './hero.js';
import { type DamageType } from './common.js';

// Re-export for convenience
export type { DamageType };

// All stat modifier types that equipment can affect
export type StatModifierType =
  | 'stamina'           // Max stamina bonus
  | 'speed'             // Speed bonus
  | 'stability'         // Stability bonus
  | 'meleeDamage'       // Melee damage bonus
  | 'rangedDamage'      // Ranged damage bonus
  | 'magicDamage'       // Magic/psionic damage bonus
  | 'allDamage'         // All damage types
  | 'reach'             // Melee reach
  | 'rangedDistance'    // Ranged attack distance
  | 'magicDistance'     // Magic ability distance
  | 'summonerRange'     // Summoner's Range
  | 'recoveries'        // Max recoveries
  | 'savingThrows'      // Saving throw bonus
  | 'resistPotency'     // Resist potency bonus
  | 'renown'            // Renown bonus
  | 'pushDistance'      // Push/Pull/Slide distance
  | 'teleportDistance'  // Teleport distance
  | 'nullFieldArea';    // Null Field area bonus (Null only)

// A single stat modifier from equipment
export interface StatModifier {
  type: StatModifierType;
  value: number;
  condition?: string;         // Optional condition (e.g., "while flying", "vs winded")
  damageType?: DamageType;    // For damage-specific bonuses
}

// Damage immunity entry
export interface DamageImmunity {
  type: DamageType;
  value: number;              // Base immunity amount
  scaling?: 'level' | 'characteristic'; // How it scales (if at all)
  characteristicId?: 'might' | 'agility' | 'reason' | 'intuition' | 'presence';
}

// Level scaling for leveled treasures
export interface LevelScaling {
  level1: number;
  level5: number;
  level9: number;
}

// Scaled modifier for leveled items
export interface ScaledModifier {
  type: StatModifierType;
  scaling: LevelScaling;
  damageType?: DamageType;
}

// Equipment slot type (matches existing EquipmentSlot from magicItems.ts)
export type EquipmentSlotId =
  | 'head'
  | 'neck'
  | 'arms'
  | 'hands'
  | 'waist'
  | 'feet'
  | 'ring'    // Can equip 2 rings
  | 'held'    // Can be in mainHand or offHand
  | 'mount'
  | 'armor'
  | 'weapon'
  | 'implement';

// Comprehensive equipment bonuses aggregated from all items
export interface EquipmentBonuses {
  // Combat stats
  stamina: number;
  speed: number;
  stability: number;

  // Damage bonuses
  meleeDamage: number;
  rangedDamage: number;
  magicDamage: number;

  // Distance bonuses
  reach: number;
  rangedDistance: number;
  magicDistance: number;
  summonerRange: number;
  pushDistance: number;
  teleportDistance: number;

  // Characteristic bonuses (from equipment)
  might: number;
  agility: number;
  reason: number;
  intuition: number;
  presence: number;

  // Other
  recoveries: number;
  savingThrows: number;
  resistPotency: number;
  renown: number;

  // Class-specific
  nullFieldArea: number;

  // Damage immunities by type
  immunities: Record<DamageType, number>;
}

// Default empty bonuses for initialization
export const DEFAULT_EQUIPMENT_BONUSES: EquipmentBonuses = {
  stamina: 0,
  speed: 0,
  stability: 0,
  meleeDamage: 0,
  rangedDamage: 0,
  magicDamage: 0,
  reach: 0,
  rangedDistance: 0,
  magicDistance: 0,
  summonerRange: 0,
  pushDistance: 0,
  teleportDistance: 0,
  might: 0,
  agility: 0,
  reason: 0,
  intuition: 0,
  presence: 0,
  recoveries: 0,
  savingThrows: 0,
  resistPotency: 0,
  renown: 0,
  nullFieldArea: 0,
  immunities: {
    corruption: 0,
    fire: 0,
    cold: 0,
    lightning: 0,
    sonic: 0,
    acid: 0,
    poison: 0,
    psychic: 0,
    holy: 0,
    radiant: 0,
    untyped: 0,
    varies: 0,
  },
};

// Derived stats calculated from class + kit + equipment
export interface DerivedStats {
  // Combat stats
  maxStamina: number;
  windedThreshold: number;
  recoveryValue: number;
  maxRecoveries: number;
  speed: number;
  stability: number;

  // Damage bonuses
  meleeDamage: number;
  rangedDamage: number;
  magicDamage: number;

  // Distance
  reach: number;
  rangedDistance: number;
  magicDistance: number;

  // Effective characteristics (base + equipment bonuses)
  effectiveCharacteristics: {
    might: number;
    agility: number;
    reason: number;
    intuition: number;
    presence: number;
  };

  // Class-specific
  summonerRange?: number;
  nullFieldArea?: number;

  // Misc
  savingThrowBonus: number;
  resistPotencyBonus: number;
  renown: number;

  // Breakdown for UI
  equipmentBonuses: EquipmentBonuses;

  // Source tracking (for tooltips)
  staminaSources: StatSource[];
  speedSources: StatSource[];
  stabilitySources: StatSource[];
}

// Track where a stat bonus comes from
export interface StatSource {
  source: string;       // e.g., "Kit: Shining Armor", "Equipment: Bastion Belt"
  value: number;
  isEquipment: boolean;
}

// Item structure with stat modifiers (for enhanced magicItems data)
export interface ItemStatModifiers {
  // Static modifiers (always active)
  staticModifiers?: StatModifier[];

  // Level-scaled modifiers (for leveled treasures)
  scaledModifiers?: ScaledModifier[];

  // Damage immunities
  immunities?: DamageImmunity[];

  // Class restrictions
  classRestriction?: HeroClass[];
}

// Map item IDs to their stat modifiers
export type ItemModifierMap = Record<string, ItemStatModifiers>;
