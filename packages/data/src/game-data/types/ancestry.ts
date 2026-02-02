// Draw Steel Ancestry Types
// Point-buy system for ancestry traits

export type AncestrySize = '1S' | '1M' | '1L';

export interface AncestrySignatureTrait {
  name: string;
  description: string;
}

export interface AncestryPurchasedTrait {
  id: string;
  name: string;
  cost: 1 | 2;
  description: string;
}

/**
 * Full ancestry definition from data
 * Used for reference data, not stored on hero
 */
export interface AncestryDefinition {
  id: string;
  name: string;
  description: string;
  size: AncestrySize | 'varies';
  speed: number;
  ancestryPoints: number;
  ancestryPointsNote?: string; // e.g., "3 ancestry points if your size is 1S"
  signatureTrait: AncestrySignatureTrait;
  purchasedTraits: AncestryPurchasedTrait[];
  quickBuild: string[];
  note?: string; // For incomplete data entries
}

/**
 * Character's ancestry selection (stored on Hero)
 * References ancestry by ID and stores selected purchased traits
 */
export interface HeroAncestry {
  ancestryId: string;
  selectedTraitIds: string[]; // IDs of purchased traits the player chose
  // For Revenant: track previous ancestry
  previousAncestryId?: string;
}
