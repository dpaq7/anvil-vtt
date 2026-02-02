/**
 * Schema Exports
 *
 * Zod schemas for runtime validation of compendium data.
 */

export {
  // Base schemas
  CompendiumItemBaseSchema,
  CompendiumMetaSchema,
  CompendiumCategoryMetaSchema,
  CompendiumDataSchema,
  // Monster schemas
  MonsterEffectSchema,
  MonsterFeatureSchema,
  CompendiumMonsterSchema,
  MonsterCompendiumDataSchema,
  // Ability schemas
  AbilityMetadataSchema,
  AbilityEffectSchema,
  CompendiumAbilitySchema,
  AbilityCompendiumDataSchema,
  // Validation functions
  validateCompendiumData,
  safeParseCompendiumData,
  // Types
  type ValidatedCompendiumData,
  type ValidatedMonsterData,
  type ValidatedAbilityData,
} from './compendium.js';
