/**
 * GameData - Draw Steel Game Data Access Layer
 *
 * Single source of truth for all game data access.
 *
 * @example
 * import { GameData } from '@anvil/data';
 *
 * const ancestry = GameData.getAncestry('human');
 * const tier = GameData.getTierForRoll(14);
 * const abilities = GameData.getAbilitiesByClass('fury');
 */

// Export the GameData API
export { GameData } from './lib/game-rules.js';

// Export class definition utilities for wizard/character sheets
export {
  getClassDefinition,
  getAllClassDefinitions,
  getClassRoleColor,
  getSubclassOptions,
  getSubclassTypeName,
  getSubclassTypeNamePlural,
  getSubclassSelectCount,
  requiresMultipleSubclasses,
  getSubclassById,
  type ClassDefinition,
  type SubclassOption,
} from './data/classes/class-definitions.js';

// Export condition parser utilities
export {
  parseTierEffect,
  parseConditionClause,
  extractConditions,
  hasCondition,
  checkPotency,
  type ParsedCondition,
  type TierEffectParseResult,
  type PotencyKeyword,
  type PotencyThreshold,
  type DrawSteelEndType,
} from './lib/condition-parser.js';

// Re-export commonly used types from game-data.ts
export type {
  // Core types
  Characteristic,
  HeroClass,
  HeroicResource,
  Tier,
  TestDifficulty,
  ConditionName,
  SkillGroup,
  PerkCategory,
  ClassRole,

  // Entity types
  Feature,
  Ability,
  Trait,
  AncestryDefinition,
  AncestryTrait,
  CareerDefinition,
  CultureBenefit,
  KitDefinition,
  KitSignatureAbility,
  SkillDefinition,
  ConditionDefinition,
  PerkDefinition,
  LanguageDefinition,
  HeroClassDefinition,
  SubclassDefinition,
  MonsterStatblock,
  TrapStatblock,

  // Data container
  DrawSteelData,
} from './types/game-data.js';

// Re-export type guards
export {
  isHeroClass,
  isCharacteristic,
  isConditionName,
  isAbility,
  isTrait,
} from './types/game-data.js';
