/**
 * Zod Schemas for Compendium Data Validation
 *
 * Runtime validation for compendium data loaded from JSON files.
 * Ensures data integrity and provides helpful error messages.
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Base Schemas
// ---------------------------------------------------------------------------

/**
 * Schema for base compendium item fields
 */
export const CompendiumItemBaseSchema = z.object({
  _id: z.string().min(1, 'Item ID is required'),
  _category: z.enum(['heroes', 'monsters']),
  _filename: z.string(),
  _subcategory: z.string().optional(),
  _isArray: z.boolean().optional(),
  name: z.string().optional(),
  type: z.string().optional(),
  level: z.number().int().optional(),
});

/**
 * Schema for compendium metadata (full compendium)
 */
export const CompendiumMetaSchema = z.object({
  description: z.string(),
  usage: z.string(),
  generatedAt: z.string(),
  sourceDirectory: z.string(),
  totalItems: z.number().int().nonnegative(),
  categories: z.record(z.string(), z.number()),
  errors: z.array(z.string()),
});

/**
 * Schema for category-specific metadata
 */
export const CompendiumCategoryMetaSchema = z.object({
  description: z.string(),
  category: z.string(),
  totalItems: z.number().int().nonnegative(),
  generatedAt: z.string(),
});

/**
 * Schema for full compendium data structure
 */
export const CompendiumDataSchema = z.object({
  _meta: z.union([CompendiumMetaSchema, CompendiumCategoryMetaSchema]),
  items: z.array(CompendiumItemBaseSchema),
});

// ---------------------------------------------------------------------------
// Monster Schemas
// ---------------------------------------------------------------------------

/**
 * Schema for monster feature effects
 */
export const MonsterEffectSchema = z.object({
  name: z.string().optional(),
  effect: z.string().optional(),
  damage: z.string().optional(),
  tier: z.string().optional(),
  tier1: z.string().optional(),
  tier2: z.string().optional(),
  tier3: z.string().optional(),
}).passthrough(); // Allow additional fields

/**
 * Schema for monster features
 */
export const MonsterFeatureSchema = z.object({
  name: z.string(),
  feature_type: z.string().optional(),
  usage: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  effects: z.array(MonsterEffectSchema).optional(),
}).passthrough();

/**
 * Schema for compendium monster
 */
export const CompendiumMonsterSchema = CompendiumItemBaseSchema.extend({
  type: z.literal('statblock').optional(),
  ancestry: z.array(z.string()).optional(),
  roles: z.array(z.string()).optional(),
  ev: z.number().optional(),
  stamina: z.string().optional(),
  speed: z.number().optional(),
  stability: z.number().optional(),
  size: z.string().optional(),
  immunities: z.array(z.string()).optional(),
  weaknesses: z.array(z.string()).optional(),
  features: z.array(MonsterFeatureSchema).optional(),
  flavor: z.string().optional(),
  might: z.number().optional(),
  agility: z.number().optional(),
  reason: z.number().optional(),
  intuition: z.number().optional(),
  presence: z.number().optional(),
}).passthrough();

// ---------------------------------------------------------------------------
// Ability Schemas
// ---------------------------------------------------------------------------

/**
 * Schema for ability metadata
 */
export const AbilityMetadataSchema = z.object({
  class: z.string().optional(),
  ability_type: z.string().optional(),
  cost_amount: z.number().optional(),
  distance: z.string().optional(),
  target: z.string().optional(),
}).passthrough();

/**
 * Schema for ability effects
 */
export const AbilityEffectSchema = z.object({
  name: z.string().optional(),
  effect: z.string().optional(),
  tier: z.string().optional(),
}).passthrough();

/**
 * Schema for compendium ability
 */
export const CompendiumAbilitySchema = CompendiumItemBaseSchema.extend({
  type: z.literal('feature').optional(),
  feature_type: z.string().optional(),
  usage: z.string().optional(),
  cost: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  distance: z.string().optional(),
  target: z.string().optional(),
  effects: z.array(AbilityEffectSchema).optional(),
  metadata: AbilityMetadataSchema.optional(),
}).passthrough();

// ---------------------------------------------------------------------------
// Typed Compendium Data Schemas
// ---------------------------------------------------------------------------

/**
 * Schema for monster compendium data
 */
export const MonsterCompendiumDataSchema = z.object({
  _meta: z.union([CompendiumMetaSchema, CompendiumCategoryMetaSchema]),
  items: z.array(CompendiumMonsterSchema),
});

/**
 * Schema for ability compendium data
 */
export const AbilityCompendiumDataSchema = z.object({
  _meta: z.union([CompendiumMetaSchema, CompendiumCategoryMetaSchema]),
  items: z.array(CompendiumAbilitySchema),
});

// ---------------------------------------------------------------------------
// Validation Functions
// ---------------------------------------------------------------------------

/**
 * Validate compendium data with detailed error messages
 */
export function validateCompendiumData<T extends z.ZodSchema>(
  data: unknown,
  schema: T
): z.infer<T> {
  const result = schema.safeParse(data);

  if (!result.success) {
    const issues = result.error.issues.map((issue) => {
      const path = issue.path.join('.');
      return `${path}: ${issue.message}`;
    });

    throw new Error(
      `Compendium data validation failed:\n${issues.join('\n')}`
    );
  }

  return result.data;
}

/**
 * Safely parse compendium data, returning null on failure
 */
export function safeParseCompendiumData<T extends z.ZodSchema>(
  data: unknown,
  schema: T
): z.infer<T> | null {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.warn('Compendium data validation failed:', result.error.issues);
    return null;
  }
  return result.data;
}

// ---------------------------------------------------------------------------
// Type Exports
// ---------------------------------------------------------------------------

export type ValidatedCompendiumData = z.infer<typeof CompendiumDataSchema>;
export type ValidatedMonsterData = z.infer<typeof CompendiumMonsterSchema>;
export type ValidatedAbilityData = z.infer<typeof CompendiumAbilitySchema>;
