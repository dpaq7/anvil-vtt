/**
 * Feature Types for Draw Steel
 *
 * Ported from Forgesteel (https://github.com/andyaiken/forgesteel)
 * Original work Copyright (c) Andy Aiken
 * Licensed under GPL-3.0
 *
 * Features are the building blocks of game mechanics - they represent
 * bonuses, abilities, choices, and other effects that characters,
 * items, complications, and titles can grant.
 */

import type { Ability, PowerRoll } from './abilities.js';
import type { Characteristic, DamageType, ConditionId } from './common.js';

// ---------------------------------------------------------------------------
// Feature Type Discriminator
// ---------------------------------------------------------------------------

/**
 * Feature types - determines what kind of effect the feature provides
 */
export type FeatureType =
  | 'text'                  // Simple text description
  | 'ability'               // Grants an ability
  | 'bonus'                 // Numeric bonus to a field
  | 'choice'                // Player chooses from options
  | 'skill-choice'          // Choose skills
  | 'language-choice'       // Choose languages
  | 'kit-choice'            // Choose a kit
  | 'perk-choice'           // Choose perks
  | 'item-choice'           // Choose items
  | 'domain-choice'         // Conduit domain choice
  | 'class-ability'         // Class ability selection
  | 'damage-modifier'       // Resistance/immunity/weakness
  | 'condition-immunity'    // Immune to conditions
  | 'size'                  // Size modifier
  | 'speed'                 // Speed modifier
  | 'heroic-resource'       // Heroic resource definition
  | 'multiple';             // Contains multiple sub-features

/**
 * Fields that can receive bonuses
 */
export type FeatureField =
  | 'stamina'
  | 'recoveries'
  | 'recovery-value'
  | 'speed'
  | 'stability'
  | 'damage'
  | 'distance'
  | 'reach'
  | 'area';

/**
 * Damage modifier types
 */
export type DamageModifierType = 'immunity' | 'resistance' | 'weakness';

// ---------------------------------------------------------------------------
// Feature Data Types
// ---------------------------------------------------------------------------

/**
 * Data for text features (simple descriptions)
 */
export interface FeatureTextData {
  // No additional data - description is in the base Feature
}

/**
 * Data for ability features
 */
export interface FeatureAbilityData {
  ability: Ability;
}

/**
 * Data for bonus features
 */
export interface FeatureBonusData {
  field: FeatureField;
  value: number;
  /** Per level bonus multiplier */
  valuePerLevel?: number;
  /** Per echelon bonus multiplier */
  valuePerEchelon?: number;
}

/**
 * Data for choice features
 */
export interface FeatureChoiceData {
  options: { feature: Feature; value: number }[];
  count: number;
  selected: Feature[];
}

/**
 * Data for skill choice features
 */
export interface FeatureSkillChoiceData {
  options: string[];
  listOptions?: string[]; // Skill list categories
  count: number;
  selected: string[];
}

/**
 * Data for language choice features
 */
export interface FeatureLanguageChoiceData {
  options: string[];
  count: number;
  selected: string[];
}

/**
 * Data for kit choice features
 */
export interface FeatureKitChoiceData {
  types: string[]; // Kit type restrictions
  count: number;
  selectedIds: string[];
}

/**
 * Data for perk choice features
 */
export interface FeaturePerkChoiceData {
  lists: string[]; // Perk list categories
  count: number;
  selectedIds: string[];
}

/**
 * Data for item choice features
 */
export interface FeatureItemChoiceData {
  types: string[]; // Item type restrictions (e.g., 'Trinket1st', 'Artifact')
  count: number;
  selectedIds: string[];
}

/**
 * Data for domain choice features (Conduit)
 */
export interface FeatureDomainChoiceData {
  characteristic: Characteristic;
  levels: number[];
  count: number;
  selectedIds: string[];
}

/**
 * Data for class ability selection
 */
export interface FeatureClassAbilityData {
  classId?: string;
  cost: number | 'signature';
  minLevel: number;
  count: number;
  selectedIds: string[];
}

/**
 * A single damage modifier entry
 */
export interface DamageModifier {
  damageType: DamageType;
  modifierType: DamageModifierType;
  value: number;
}

/**
 * Data for damage modifier features
 */
export interface FeatureDamageModifierData {
  modifiers: DamageModifier[];
}

/**
 * Data for condition immunity features
 */
export interface FeatureConditionImmunityData {
  conditions: ConditionId[];
}

/**
 * Data for size features
 */
export interface FeatureSizeData {
  value: number; // Size tier (1T, 1S, 1M, 1L = 1, 2, 3, 4, etc.)
  modifier?: string; // e.g., "or 1L (your choice)"
}

/**
 * Data for speed features
 */
export interface FeatureSpeedData {
  value: number;
  mode?: string; // 'walk', 'fly', 'burrow', 'swim', 'climb'
}

/**
 * Data for heroic resource features
 */
export interface FeatureHeroicResourceData {
  resourceType: 'heroic' | 'epic';
  gains: { tag: string; trigger: string; value: string }[];
  details: string;
  canBeNegative: boolean;
  currentValue: number;
}

/**
 * Data for multiple features
 */
export interface FeatureMultipleData {
  features: Feature[];
}

// ---------------------------------------------------------------------------
// Feature Union Type
// ---------------------------------------------------------------------------

/**
 * Base feature interface - the minimal shape for simple features
 * This is backward compatible with existing data that uses { id, name, description }
 */
export interface Feature {
  id: string;
  name: string;
  description: string;
  levelRequired?: number;
  /** Feature type discriminator - present only for typed features */
  type?: FeatureType;
  /** Feature data - present only for typed features */
  data?: unknown;
}

/**
 * Simple/legacy feature format - the base Feature interface
 * Used by existing data that doesn't need the rich feature system
 */
export type SimpleFeature = Feature;

/**
 * Type helper for creating typed feature types
 */
type TypedFeatureOf<Type extends FeatureType, Data = null> = Feature & {
  type: Type;
  data: Data;
};

// Individual typed feature type definitions
export type TextFeature = TypedFeatureOf<'text', FeatureTextData | null>;
export type AbilityFeature = TypedFeatureOf<'ability', FeatureAbilityData>;
export type BonusFeature = TypedFeatureOf<'bonus', FeatureBonusData>;
export type ChoiceFeature = TypedFeatureOf<'choice', FeatureChoiceData>;
export type SkillChoiceFeature = TypedFeatureOf<'skill-choice', FeatureSkillChoiceData>;
export type LanguageChoiceFeature = TypedFeatureOf<'language-choice', FeatureLanguageChoiceData>;
export type KitChoiceFeature = TypedFeatureOf<'kit-choice', FeatureKitChoiceData>;
export type PerkChoiceFeature = TypedFeatureOf<'perk-choice', FeaturePerkChoiceData>;
export type ItemChoiceFeature = TypedFeatureOf<'item-choice', FeatureItemChoiceData>;
export type DomainChoiceFeature = TypedFeatureOf<'domain-choice', FeatureDomainChoiceData>;
export type ClassAbilityFeature = TypedFeatureOf<'class-ability', FeatureClassAbilityData>;
export type DamageModifierFeature = TypedFeatureOf<'damage-modifier', FeatureDamageModifierData>;
export type ConditionImmunityFeature = TypedFeatureOf<'condition-immunity', FeatureConditionImmunityData>;
export type SizeFeature = TypedFeatureOf<'size', FeatureSizeData>;
export type SpeedFeature = TypedFeatureOf<'speed', FeatureSpeedData>;
export type HeroicResourceFeature = TypedFeatureOf<'heroic-resource', FeatureHeroicResourceData>;
export type MultipleFeature = TypedFeatureOf<'multiple', FeatureMultipleData>;

/**
 * Union of all typed feature types (for new rich features)
 */
export type TypedFeature =
  | TextFeature
  | AbilityFeature
  | BonusFeature
  | ChoiceFeature
  | SkillChoiceFeature
  | LanguageChoiceFeature
  | KitChoiceFeature
  | PerkChoiceFeature
  | ItemChoiceFeature
  | DomainChoiceFeature
  | ClassAbilityFeature
  | DamageModifierFeature
  | ConditionImmunityFeature
  | SizeFeature
  | SpeedFeature
  | HeroicResourceFeature
  | MultipleFeature;

/**
 * Helper type for feature data based on feature type
 */
export type FeatureDataFor<T extends FeatureType> = Extract<TypedFeature, { type: T }>['data'];

// ---------------------------------------------------------------------------
// Type Guards
// ---------------------------------------------------------------------------

/**
 * Check if a feature is a simple/legacy feature (no type discriminator)
 */
export function isSimpleFeature(feature: Feature): boolean {
  return feature.type === undefined;
}

/**
 * Check if a feature is a typed feature (has type discriminator)
 */
export function isTypedFeature(feature: Feature): feature is TypedFeature {
  return feature.type !== undefined;
}

export function isTextFeature(feature: Feature): feature is TextFeature {
  return feature.type === 'text';
}

export function isAbilityFeature(feature: Feature): feature is AbilityFeature {
  return feature.type === 'ability';
}

export function isBonusFeature(feature: Feature): feature is BonusFeature {
  return feature.type === 'bonus';
}

export function isChoiceFeature(feature: Feature): feature is ChoiceFeature {
  return feature.type === 'choice';
}

export function isDamageModifierFeature(feature: Feature): feature is DamageModifierFeature {
  return feature.type === 'damage-modifier';
}

export function isConditionImmunityFeature(feature: Feature): feature is ConditionImmunityFeature {
  return feature.type === 'condition-immunity';
}

export function isMultipleFeature(feature: Feature): feature is MultipleFeature {
  return feature.type === 'multiple';
}

// ---------------------------------------------------------------------------
// Legacy Support
// ---------------------------------------------------------------------------

/**
 * Convert a simple feature to the typed text feature format
 */
export function toTypedFeature(simple: SimpleFeature): TextFeature {
  return {
    id: simple.id,
    name: simple.name,
    description: simple.description,
    levelRequired: simple.levelRequired,
    type: 'text',
    data: null,
  };
}
