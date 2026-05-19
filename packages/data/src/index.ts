/**
 * @anvil/data
 *
 * Draw Steel compendium data for Anvil VTT.
 * Contains abilities, monsters, ancestries, and other game data.
 *
 * Attribution:
 * The Steel Compendium is an independent product published under the
 * DRAW STEEL Creator License and is not affiliated with MCDM Productions, LLC.
 * DRAW STEEL (c) 2024 MCDM Productions, LLC.
 */

// Logic Layer - pure functions for game calculations
// Usage: import { RollLogic, HeroLogic, WizardLogic, KitLogic, MontageLogic } from '@anvil/data';
export {
  Collections,
  EntityGuards,
  DiceLogic,
  RollLogic,
  ConditionLogic,
  HeroLogic,
  WizardLogic,
  KitLogic,
  // Scene Logic
  MontageLogic,
  NegotiationLogic,
  RespiteLogic,
  BattleLogic,
  EncounterLogic,
  // Factory Logic
  FactoryLogic,
  UniversalActions,
  // Phase 6: Core Gaps
  AbilityLogic,
  EntityStatusLogic,
  // Phase 7: Director Support
  FormatLogic,
  MonsterLogic,
  SessionLogic,
  // Presentation System
  PresentationLogic,
  // Update Logic
  HeroUpdateLogic,
  SceneUpdateLogic,
  CampaignUpdateLogic,
  updateAll,
  needsUpdate,
} from './logic/index.js';

export {
  BEASTHEART_COMPANION_COMBAT_RULES,
  BEASTHEART_COMPANION_OPTIONS,
  BEASTHEART_RAMPAGE_THRESHOLDS,
  getBeastheartCompanionOption,
} from './rules/classes/beastheart/companions.js';

export type {
  BeastheartCompanionOption,
  BeastheartRampageThreshold,
} from './rules/classes/beastheart/companions.js';

// Logic Layer types
export type {
  // Dice Logic
  DiceRollSource,
  DiceRollResult,
  ParsedNotation,
  // Roll Logic
  Tier,
  TestDifficulty,
  TestOutcome,
  PowerRollResult,
  // Condition Logic
  ConditionEffect,
  ConditionEndTrigger,
  // Hero Logic
  Echelon,
  HeroicResourceType,
  HealthStatus,
  Characteristics,
  CharacteristicName,
  LevelAdvancementChoice,
  LevelAdvancementChoices,
  // Wizard Logic
  CharacterInProgress,
  CultureSelection,
  Complication,
  Title,
  DerivedStats,
  GrantedItem,
  GrantedItems,
  StepValidationResult,
  LevelUpChoice,
  LevelUpFeatureChoiceOption,
  LevelUpFeatureView,
  StepStatus,
  WizardStepDefinition,
  AbilityChoiceSlot,
  ClassSkillChoiceSlot,
  CompanionChoiceOption,
  SummonerMinionChoiceOption,
  PerkChoiceSlot,
  // Kit Logic
  KitType,
  KitBonuses,
  KitEquipment,
  KitInfo,
  // Montage Logic
  MontageOutcome,
  UnlockType,
  ChallengeUnlock,
  ChallengeSummary,
  MontageStateSummary,
  MontageTestResult,
  AssistResult,
  // Negotiation Logic
  NegotiationPhase,
  NPCAttitude,
  InterestChangeResult,
  PatienceChangeResult,
  ArgumentResult,
  // Respite Logic
  RespiteActivityType,
  ProjectSummary,
  RecoverySummary,
  ProjectRollResult,
  RespiteCompletionResult,
  // Battle Logic
  ActionType,
  TurnActionState,
  CombatSide,
  DamageType,
  DamageRollResult,
  // Encounter Logic
  SceneDifficulty,
  EVBudgetResult,
  CreatureEVEntry,
  ParsedEV,
  EncounterRatingResult,
  CreatureRole,
  // Factory Logic
  FactoryCultureSelection,
  FactoryComplication,
  FactoryTitle,
  FactoryCharacterInProgress,
  FactoryDerivedStats,
  HeroInsertData,
  CreateSceneOptions,
  TokenPosition,
  // Ability Logic
  DistanceType,
  ParsedDistance,
  CharacteristicShorthand,
  AbilityCharacteristicName,
  ParsedDamage,
  DamageResult,
  KitDamageBonus,
  CoverLevel,
  AbilityKeyword,
  AbilityCategory,
  // Entity Status Logic
  EntityHealthStatus,
  StaminaColor,
  StaminaColorVar,
  EntityType,
  EntityTypeColor,
  PipDisplay,
  EntityDisplayInfo,
  ConditionSeverity,
  // Update Logic
  HeroLike,
  SceneLike,
  UpdateSceneType,
  BattleStateLike,
  MontageStateLike,
  NegotiationStateLike,
  RespiteStateLike,
  StoryStateLike,
  CampaignLike,
  CampaignSettingsLike,
  ModuleLike,
  SessionLike,
  // Format Logic
  FormatCharacteristicName,
  FormatTier,
  AbilityDistance,
  FormatPowerRollResult,
  // Monster Logic
  MonsterRoleType,
  MonsterOrganization,
  MonsterCharacteristic,
  MovementMode,
  DamageModifier,
  StatModifier,
  MonsterRoleInfo,
  MonsterCombatState,
  MonsterLike,
  MonsterGroup,
  MonsterHealthStatus,
  // Session Logic
  SessionSceneType,
  GridPosition,
  ConditionInstance,
  HeroBattleState,
  MonsterBattleState,
  SessionHeroLike,
  SessionMonsterLike,
  Party,
  EncounterSlot,
  SceneOutcome,
  BattleSceneTemplate,
  MontageSceneTemplate,
  NegotiationSceneTemplate,
  RespiteSceneTemplate,
  StorySceneTemplate,
  SceneTemplate,
  BattleSceneInstance,
  MontageSceneInstance,
  NegotiationSceneInstance,
  RespiteSceneInstance,
  StorySceneInstance,
  SceneInstance,
  BattleInstanceState,
  MontageInstanceState,
  NegotiationInstanceState,
  RespiteInstanceState,
  StoryInstanceState,
  StartBattleOptions,
  StartMontageOptions,
  StartSceneOptions,
} from './logic/index.js';

// Rules data (ancestries, careers, cultures, kits, conditions, skills)
export * from './rules/index.js';

// Summoner portfolios
export * from './portfolios/index.js';

// Compendium search and utilities
export * from './compendium/index.js';

// Data types
export * from './types/index.js';

// Schemas
export * from './schemas/index.js';

// Pre-generated characters and scenes
export * from './pregen/index.js';

// Items (imbuements)
export * from './items/index.js';

// Magic and psionic treasures
export {
  CONSUMABLE_ITEMS,
  TRINKET_ITEMS,
  LEVELED_ITEMS,
  ARTIFACT_ITEMS,
  ALL_MAGIC_ITEMS,
  getItemsByCategory,
  getItemsByEchelon,
  getItemById,
  parseItemBonuses,
  getEnhancementTier,
} from './game-data/data/magicItems.js';
export type {
  MagicItem,
  ItemCategory as MagicItemCategory,
  EquipmentSlot as MagicEquipmentSlot,
  ItemEnhancement as MagicItemEnhancement,
  ParsedBonus as MagicItemParsedBonus,
} from './game-data/data/magicItems.js';

// Supplementary monsters (from Forgesteel)
export * from './monsters/index.js';

// Terrain system (from Forgesteel)
export * from './terrain/index.js';

// Scene objects (furniture, terrain, hazards, markers)
export * from './scene-objects/index.js';

// GameData access layer - single source of truth for all game data
export { GameData } from './game-data/index.js';

// Re-export class definition utilities (for wizard/character sheets)
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
} from './game-data/index.js';

// Re-export condition parser utilities
export {
  parseTierEffect,
  parseConditionClause,
  extractConditions,
  hasCondition,
  checkPotency,
} from './game-data/index.js';

// Re-export commonly used types (for character sheet display)
export type {
  HeroClass,
  AncestryDefinition,
  AncestryTrait,
  CareerDefinition,
  CultureBenefit,
  KitDefinition,
  KitSignatureAbility,
  SubclassDefinition,
} from './game-data/index.js';
// GameData types available via: import type { ... } from '@anvil/data/game-data'
