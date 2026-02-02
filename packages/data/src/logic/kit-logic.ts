/**
 * Kit Logic
 *
 * Pure functions for kit bonus calculations.
 * Kits provide equipment, bonuses, and signature abilities.
 *
 * Reference: rules-md/Kits/
 */

import { GameData } from '../game-data/index.js';
import * as HeroLogic from './hero-logic.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Kit bonuses summary.
 */
export interface KitBonuses {
  /** Stamina bonus per echelon */
  staminaPerEchelon: number;
  /** Speed bonus */
  speedBonus: number;
  /** Stability bonus */
  stabilityBonus: number;
  /** Melee damage bonus (tier string, e.g., "+2/+2/+2") */
  meleeDamageBonus: string | null;
  /** Ranged damage bonus (tier string) */
  rangedDamageBonus: string | null;
  /** Melee distance bonus */
  meleeDistanceBonus: number;
  /** Ranged distance bonus */
  rangedDistanceBonus: number;
  /** Disengage bonus */
  disengageBonus: number;
}

/**
 * Kit equipment summary.
 */
export interface KitEquipment {
  armor: string;
  weapons: string[];
}

/**
 * Signature ability structure.
 */
export interface KitSignatureAbility {
  name: string;
  type: string;
  keywords: string[];
  distance?: string;
  target?: string;
  description: string;
  effect?: string;
  tier1?: string;
  tier2?: string;
  tier3?: string;
}

/**
 * Complete kit information.
 */
export interface KitInfo {
  id: string;
  name: string;
  description: string;
  equipment: KitEquipment;
  bonuses: KitBonuses;
  signatureAbility: KitSignatureAbility | null;
}

// For backwards compatibility
export type KitType = 'Martial' | 'Caster';

// ---------------------------------------------------------------------------
// Kit Lookup
// ---------------------------------------------------------------------------

/**
 * Get complete kit information by ID.
 *
 * @param kitId - The kit ID
 * @returns Kit info or null if not found
 */
export function getKitInfo(kitId: string): KitInfo | null {
  const kit = GameData.getKit(kitId);
  if (!kit) return null;

  return {
    id: kit.id,
    name: kit.name,
    description: kit.description || '',
    equipment: {
      armor: kit.armor || '',
      weapons: kit.weapons || [],
    },
    bonuses: {
      staminaPerEchelon: kit.staminaPerEchelon ?? 0,
      speedBonus: kit.speedBonus ?? 0,
      stabilityBonus: kit.stabilityBonus ?? 0,
      meleeDamageBonus: kit.meleeDamageBonus || null,
      rangedDamageBonus: kit.rangedDamageBonus || null,
      meleeDistanceBonus: kit.meleeDistanceBonus ?? 0,
      rangedDistanceBonus: kit.rangedDistanceBonus ?? 0,
      disengageBonus: kit.disengageBonus ?? 0,
    },
    signatureAbility: kit.signatureAbility || null,
  };
}

/**
 * Get kit bonuses only.
 *
 * @param kitId - The kit ID
 * @returns Kit bonuses or default (all zeros) if not found
 */
export function getKitBonuses(kitId: string): KitBonuses {
  const kit = GameData.getKit(kitId);

  if (!kit) {
    return {
      staminaPerEchelon: 0,
      speedBonus: 0,
      stabilityBonus: 0,
      meleeDamageBonus: null,
      rangedDamageBonus: null,
      meleeDistanceBonus: 0,
      rangedDistanceBonus: 0,
      disengageBonus: 0,
    };
  }

  return {
    staminaPerEchelon: kit.staminaPerEchelon ?? 0,
    speedBonus: kit.speedBonus ?? 0,
    stabilityBonus: kit.stabilityBonus ?? 0,
    meleeDamageBonus: kit.meleeDamageBonus || null,
    rangedDamageBonus: kit.rangedDamageBonus || null,
    meleeDistanceBonus: kit.meleeDistanceBonus ?? 0,
    rangedDistanceBonus: kit.rangedDistanceBonus ?? 0,
    disengageBonus: kit.disengageBonus ?? 0,
  };
}

/**
 * Get kit equipment only.
 *
 * @param kitId - The kit ID
 * @returns Kit equipment or defaults if not found
 */
export function getKitEquipment(kitId: string): KitEquipment {
  const kit = GameData.getKit(kitId);

  return {
    armor: kit?.armor || '',
    weapons: kit?.weapons || [],
  };
}

/**
 * Get kit signature ability.
 *
 * @param kitId - The kit ID
 * @returns Signature ability or null if not found
 */
export function getKitSignatureAbility(kitId: string): KitSignatureAbility | null {
  const kit = GameData.getKit(kitId);
  return kit?.signatureAbility || null;
}

// ---------------------------------------------------------------------------
// Kit Bonus Calculations
// ---------------------------------------------------------------------------

/**
 * Calculate stamina bonus from kit at a given level.
 * Kit stamina is per echelon, so scales with level.
 *
 * @param kitId - The kit ID
 * @param level - Character level (1-10)
 * @returns Stamina bonus from kit
 */
export function getKitStaminaBonus(kitId: string, level: number): number {
  const kit = GameData.getKit(kitId);
  if (!kit) return 0;

  const staminaPerEchelon = kit.staminaPerEchelon ?? 0;
  const echelon = HeroLogic.getEchelon(level);

  return staminaPerEchelon * echelon;
}

/**
 * Calculate speed bonus from kit.
 *
 * @param kitId - The kit ID
 * @returns Speed bonus from kit
 */
export function getKitSpeedBonus(kitId: string): number {
  const kit = GameData.getKit(kitId);
  return kit?.speedBonus ?? 0;
}

/**
 * Calculate stability bonus from kit.
 *
 * @param kitId - The kit ID
 * @returns Stability bonus from kit
 */
export function getKitStabilityBonus(kitId: string): number {
  const kit = GameData.getKit(kitId);
  return kit?.stabilityBonus ?? 0;
}

/**
 * Get melee distance bonus from kit.
 *
 * @param kitId - The kit ID
 * @returns Melee distance bonus
 */
export function getMeleeDistanceBonus(kitId: string): number {
  const kit = GameData.getKit(kitId);
  return kit?.meleeDistanceBonus ?? 0;
}

/**
 * Get ranged distance bonus from kit.
 *
 * @param kitId - The kit ID
 * @returns Ranged distance bonus
 */
export function getRangedDistanceBonus(kitId: string): number {
  const kit = GameData.getKit(kitId);
  return kit?.rangedDistanceBonus ?? 0;
}

/**
 * Get disengage bonus from kit.
 *
 * @param kitId - The kit ID
 * @returns Disengage bonus
 */
export function getDisengageBonus(kitId: string): number {
  const kit = GameData.getKit(kitId);
  return kit?.disengageBonus ?? 0;
}

// ---------------------------------------------------------------------------
// Damage Tier Calculations
// ---------------------------------------------------------------------------

/**
 * Parse a damage tier string (e.g., "+2/+2/+2" for tier 1/2/3 damage).
 *
 * @param damageTier - The damage tier string
 * @param tier - The tier to get (1, 2, or 3)
 * @returns Damage value for that tier
 */
export function parseDamageTier(
  damageTier: string | null,
  tier: 1 | 2 | 3
): number {
  if (!damageTier) return 0;

  // Remove '+' signs and split
  const cleaned = damageTier.replace(/\+/g, '');
  const parts = cleaned.split('/').map((s) => parseInt(s.trim(), 10));

  // Handle single value (same for all tiers)
  if (parts.length === 1) {
    return parts[0] || 0;
  }

  // Handle tier-specific values
  const index = tier - 1;
  return parts[index] ?? parts[parts.length - 1] ?? 0;
}

/**
 * Get melee damage bonus for a tier.
 *
 * @param kitId - The kit ID
 * @param tier - The damage tier (1, 2, or 3)
 * @returns Melee damage bonus
 */
export function getMeleeDamageBonus(kitId: string, tier: 1 | 2 | 3): number {
  const kit = GameData.getKit(kitId);
  return parseDamageTier(kit?.meleeDamageBonus || null, tier);
}

/**
 * Get ranged damage bonus for a tier.
 *
 * @param kitId - The kit ID
 * @param tier - The damage tier (1, 2, or 3)
 * @returns Ranged damage bonus
 */
export function getRangedDamageBonus(kitId: string, tier: 1 | 2 | 3): number {
  const kit = GameData.getKit(kitId);
  return parseDamageTier(kit?.rangedDamageBonus || null, tier);
}

// ---------------------------------------------------------------------------
// Kit Validation
// ---------------------------------------------------------------------------

/**
 * Check if a kit exists.
 *
 * @param kitId - The kit ID
 * @returns True if kit exists
 */
export function isValidKit(kitId: string): boolean {
  return GameData.getKit(kitId) !== undefined;
}

/**
 * Get kit display name.
 *
 * @param kitId - The kit ID
 * @returns Kit name or 'Unknown Kit' if not found
 */
export function getKitName(kitId: string): string {
  const kit = GameData.getKit(kitId);
  return kit?.name ?? 'Unknown Kit';
}

/**
 * Get kit description.
 *
 * @param kitId - The kit ID
 * @returns Kit description or empty string if not found
 */
export function getKitDescription(kitId: string): string {
  const kit = GameData.getKit(kitId);
  return kit?.description ?? '';
}

// ---------------------------------------------------------------------------
// Combined Stats Calculation
// ---------------------------------------------------------------------------

/**
 * Calculate total speed with kit bonus.
 *
 * @param baseSpeed - Base speed from ancestry
 * @param kitId - The kit ID (optional)
 * @returns Total speed
 */
export function calculateTotalSpeed(baseSpeed: number, kitId: string | null): number {
  const kitBonus = kitId ? getKitSpeedBonus(kitId) : 0;
  return baseSpeed + kitBonus;
}

/**
 * Calculate total stability with kit bonus.
 *
 * @param baseStability - Base stability (usually 0)
 * @param kitId - The kit ID (optional)
 * @returns Total stability
 */
export function calculateTotalStability(
  baseStability: number,
  kitId: string | null
): number {
  const kitBonus = kitId ? getKitStabilityBonus(kitId) : 0;
  return baseStability + kitBonus;
}

/**
 * Calculate total stamina with kit bonus.
 *
 * @param heroClass - The hero's class
 * @param level - Character level
 * @param kitId - The kit ID (optional)
 * @returns Total stamina
 */
export function calculateTotalStamina(
  heroClass: HeroLogic.HeroClass,
  level: number,
  kitId: string | null
): number {
  const baseStamina = HeroLogic.getMaxStaminaForClass(heroClass, level);
  const kitBonus = kitId ? getKitStaminaBonus(kitId, level) : 0;
  return baseStamina + kitBonus;
}

// ---------------------------------------------------------------------------
// Kit Listing
// ---------------------------------------------------------------------------

/**
 * Get all kit IDs.
 *
 * @returns Array of all kit IDs
 */
export function getAllKitIds(): string[] {
  return GameData.getAllKits().map((k) => k.id);
}

/**
 * Get all kits as KitInfo objects.
 *
 * @returns Array of all kit info objects
 */
export function getAllKits(): KitInfo[] {
  return GameData.getAllKits()
    .map((k) => getKitInfo(k.id))
    .filter((k): k is KitInfo => k !== null);
}
