// Common types used across the application

export type Characteristic = 'might' | 'agility' | 'reason' | 'intuition' | 'presence';

export interface Characteristics {
  might: number;
  agility: number;
  reason: number;
  intuition: number;
  presence: number;
}

export interface GridPosition {
  x: number;
  y: number;
}

export type ConditionId =
  | 'bleeding'
  | 'burning'
  | 'charmed'
  | 'dazed'
  | 'dying'
  | 'frightened'
  | 'grabbed'
  | 'invisible'
  | 'petrified'
  | 'prone'
  | 'restrained'
  | 'slowed'
  | 'taunted'
  | 'weakened';

/**
 * How a condition ends
 * - 'eot': Automatically ends at end of turn
 * - 'roll': Must roll 6+ on d10 at end of turn (save ends)
 * - 'manual': No automatic end, must be removed manually
 */
export type ConditionEndType = 'eot' | 'roll' | 'manual';

export interface ActiveCondition {
  conditionId: ConditionId;
  sourceId?: string; // ID of creature/effect that caused it (for frightened, taunted, grabbed)
  sourceName?: string; // Name for display
  duration?: number; // turns remaining, undefined means save ends
  appliedAt: number; // timestamp when applied
  endType: ConditionEndType; // How this condition ends
}

// Legacy interface for backward compatibility
export interface Condition {
  id: string;
  name: string;
  duration?: number;
  description: string;
}

// Draw Steel core concepts

export interface AncestryFeature {
  id: string;
  name: string;
  description: string;
  cost?: number; // Ancestry point cost for purchased traits
}

export interface Ancestry {
  id: string;
  name: string;
  description: string;
  size: Size;
  speed: number;
  signatureFeature: AncestryFeature;
  purchasedTraits: AncestryFeature[];
  ancestryPoints: number;
}

export type EnvironmentType = 'nomadic' | 'rural' | 'secluded' | 'urban' | 'wilderness';
export type OrganizationType = 'bureaucratic' | 'communal';
export type UpbringingType = 'academic' | 'creative' | 'labor' | 'lawless' | 'martial' | 'noble';

export interface CultureOption {
  type: EnvironmentType | OrganizationType | UpbringingType;
  name: string;
  skills: string[];
}

export interface Culture {
  id: string;
  name: string;
  description: string;
  environment: CultureOption;
  organization: CultureOption;
  upbringing: CultureOption;
  language: string;
}

export type PerkType = 'crafting' | 'exploration' | 'interpersonal' | 'intrigue' | 'lore' | 'supernatural';

export interface Career {
  id: string;
  name: string;
  description: string;
  skills: string[];
  languages: string[];
  renown: number;
  wealth: number;
  projectPoints: number;
  perkType: PerkType;
  incitingIncident: string;
}

export interface Language {
  id: string;
  name: string;
  relatedTo: string; // Related ancestry or use
  isDead?: boolean;
  isDefault?: boolean; // Caelian - all heroes know this
  researchFocus?: string; // For dead languages - what research they unlock
}

export type DamageBonus = `+${number}/+${number}/+${number}`;

export interface KitSignatureAbility {
  name: string;
  description: string;
  keywords: string[];
  type: string; // e.g., "Main action"
  distance: string; // e.g., "Melee 1", "Ranged 15", "Melee 1 or ranged 10"
  target: string; // e.g., "One creature", "Two creatures or objects"
  powerRoll: string; // e.g., "Might or Agility", "Might, Reason, Intuition, or Presence"
  tier1: string; // Effect for ≤11
  tier2: string; // Effect for 12-16
  tier3: string; // Effect for 17+
  effect?: string; // Additional effect text
}

export interface Kit {
  id: string;
  name: string;
  description: string;
  // Equipment
  armor: string; // e.g., "Heavy, shield", "Light", "None"
  weapons: string[]; // e.g., ["Medium"], ["Light", "Medium"], ["Bow"]
  // Bonuses (per echelon for stamina, flat for others)
  staminaPerEchelon: number; // 0, 3, 6, 9, or 12
  speedBonus: number; // 0, 1, 2, or 3
  stabilityBonus: number; // 0, 1, or 2
  meleeDamageBonus: DamageBonus | null; // e.g., "+2/+2/+2", "+0/+0/+4"
  rangedDamageBonus: DamageBonus | null;
  meleeDistanceBonus: number; // 0 or 1
  rangedDistanceBonus: number; // 0, 5, 7, or 10
  disengageBonus: number; // 0 or 1
  // Signature ability
  signatureAbility: KitSignatureAbility;
}

export interface Item {
  id: string;
  name: string;
  description: string;
  quantity: number;
}

export type Size = '1T' | '1S' | '1M' | '1L' | '2' | '3' | '4';

export type DamageType =
  | 'corruption'
  | 'fire'
  | 'cold'
  | 'lightning'
  | 'sonic'
  | 'acid'
  | 'poison'
  | 'psychic'
  | 'holy'
  | 'radiant'
  | 'untyped'
  | 'varies';

export interface Resistance {
  type: DamageType | 'all';
  value: number | 'R'; // R = Reason characteristic
}

export interface Immunity {
  type: 'damage' | DamageType;
  value?: number; // For damage immunity levels
}

export interface Weakness {
  type: DamageType;
  value: number;
}
