/**
 * Logic Layer
 *
 * Pure functions for game calculations.
 * UI is "dumb" - components render, hooks orchestrate, Logic calculates.
 *
 * @example
 * import { RollLogic, HeroLogic, WizardLogic, KitLogic, MontageLogic } from '@anvil/data';
 *
 * const tier = RollLogic.getTier(14);
 * const stamina = HeroLogic.getMaxStaminaForClass('fury', 1);
 * const stats = WizardLogic.calculateDerivedStats(character);
 * const kitBonus = KitLogic.getKitStaminaBonus('shining-armor', 1);
 * const successLimit = MontageLogic.getEffectiveSuccessLimit(state, 4);
 */

// Namespace exports - use as RollLogic.getTier(), HeroLogic.getMaxStamina(), etc.
export * as Collections from './collections.js';
export * as EntityGuards from './entity-guards.js';
export * as DiceLogic from './dice-logic.js';
export * as RollLogic from './roll-logic.js';
export * as ConditionLogic from './condition-logic.js';
export * as HeroLogic from './hero-logic.js';
export * as WizardLogic from './wizard-logic.js';
export * as KitLogic from './kit-logic.js';

// Scene Logic - mode-specific calculations
export * as MontageLogic from './montage-logic.js';
export * as NegotiationLogic from './negotiation-logic.js';
export * as RespiteLogic from './respite-logic.js';
export * as BattleLogic from './battle-logic.js';
export * as EncounterLogic from './encounter-logic.js';

// Factory Logic - object creation
export * as FactoryLogic from './factory-logic.js';

// Universal Combat Actions
export * as UniversalActions from './universal-actions.js';

// Phase 6: Core Gaps
export * as AbilityLogic from './ability-logic.js';
export * as EntityStatusLogic from './entity-status-logic.js';

// Battle spatial rules — grid geometry, targeting templates, movement budgets
export * as GeometryLogic from './geometry-logic.js';
export * as MovementLogic from './movement-logic.js';
export * as OpportunityAttackLogic from './opportunity-attack-logic.js';
export * as ForcedMovementLogic from './forced-movement-logic.js';

// Phase 7: Director Support
export * as FormatLogic from './format-logic.js';
export * as MonsterLogic from './monster-logic.js';
export * as SessionLogic from './session-logic.js';

// Presentation System (Go Live)
export * as PresentationLogic from './presentation-logic.js';

// Update Logic - schema migration
export {
  HeroUpdateLogic,
  SceneUpdateLogic,
  CampaignUpdateLogic,
  updateAll,
  needsUpdate,
} from './update/index.js';

// Re-export types for convenience

// Dice Logic types
export type { DiceRollSource, DiceRollResult, ParsedNotation } from './dice-logic.js';

// Roll Logic types
export type {
  Tier,
  TierColor,
  TestDifficulty,
  TestOutcome,
  PowerRollResult,
} from './roll-logic.js';

// Condition Logic types
export type { ConditionEffect, ConditionEndTrigger } from './condition-logic.js';

// Hero Logic types
export type {
  HeroClass,
  Echelon,
  HeroicResourceType,
  HealthStatus,
  Characteristics,
  CharacteristicName,
  LevelAdvancementChoice,
  LevelAdvancementChoices,
} from './hero-logic.js';

// Wizard Logic types
export type {
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
} from './wizard-logic.js';

// Kit Logic types
export type {
  KitType,
  KitBonuses,
  KitEquipment,
  KitSignatureAbility,
  KitInfo,
} from './kit-logic.js';

// Montage Logic types
export type {
  MontageOutcome,
  UnlockType,
  ChallengeUnlock,
  ChallengeSummary,
  MontageStateSummary,
  MontageTestResult,
  AssistResult,
} from './montage-logic.js';

// Negotiation Logic types
export type {
  NegotiationPhase,
  NPCAttitude,
  NegotiationColor,
  InterestChangeResult,
  PatienceChangeResult,
  ArgumentResult,
} from './negotiation-logic.js';

// Respite Logic types
export type {
  RespiteActivityType,
  ProjectSummary,
  RecoverySummary,
  ProjectRollResult,
  RespiteCompletionResult,
} from './respite-logic.js';

// Battle Logic types
export type {
  ActionType,
  TurnActionState,
  CombatSide,
  DamageType,
  DamageRollResult,
  MaliceLevel,
  MaliceColor,
} from './battle-logic.js';

// Universal Actions types
export type {
  UniversalAction,
  CatchBreathResult,
  GrabResult,
  KnockbackResult,
  HideResult,
} from './universal-actions.js';

// Encounter Logic types
export type {
  SceneDifficulty,
  EVBudgetResult,
  CreatureEVEntry,
  ParsedEV,
  EncounterRatingResult,
  CreatureRole,
} from './encounter-logic.js';

// Factory Logic types
export type {
  CultureSelection as FactoryCultureSelection,
  Complication as FactoryComplication,
  Title as FactoryTitle,
  CharacterInProgress as FactoryCharacterInProgress,
  DerivedStats as FactoryDerivedStats,
  HeroInsertData,
  CreateSceneOptions,
  TokenPosition,
} from './factory-logic.js';

// Ability Logic types
export type {
  DistanceType,
  ParsedDistance,
  CharacteristicShorthand,
  CharacteristicName as AbilityCharacteristicName,
  ParsedDamage,
  DamageResult,
  KitDamageBonus,
  CoverLevel,
  AbilityKeyword,
  AbilityCategory,
} from './ability-logic.js';

// Geometry Logic types
export type {
  GridPoint,
  TokenFootprint,
  GridBounds,
  AffectedSquaresOptions,
} from './geometry-logic.js';

// Movement Logic types
export type {
  MovementBudget,
  PathStep,
  MovementPath,
} from './movement-logic.js';

// Opportunity Attack Logic types
export type { MoverInfo } from './opportunity-attack-logic.js';

// Forced Movement Logic types
export type {
  OccupantFootprint,
  ForcedMovementType,
  ForcedMovementPlan,
} from './forced-movement-logic.js';

// Entity Status Logic types
export type {
  HealthStatus as EntityHealthStatus,
  StaminaColor,
  StaminaColorVar,
  EntityType,
  EntityTypeColor,
  PipDisplay,
  EntityDisplayInfo,
  ConditionSeverity,
} from './entity-status-logic.js';

// Update Logic types
export type {
  HeroLike,
  SceneLike,
  SceneType as UpdateSceneType,
  BattleStateLike,
  MontageStateLike,
  NegotiationStateLike,
  RespiteStateLike,
  StoryStateLike,
  CampaignLike,
  CampaignSettingsLike,
  ModuleLike,
  SessionLike,
} from './update/index.js';

// Format Logic types
export type {
  CharacteristicName as FormatCharacteristicName,
  Tier as FormatTier,
  AbilityDistance,
  PowerRollResult as FormatPowerRollResult,
} from './format-logic.js';

// Monster Logic types
export type {
  MonsterRoleType,
  MonsterOrganization,
  Characteristic as MonsterCharacteristic,
  MovementMode,
  DamageModifier,
  StatModifier,
  MonsterRoleInfo,
  MonsterCombatState,
  MonsterLike,
  MonsterGroup,
  HealthStatus as MonsterHealthStatus,
} from './monster-logic.js';

// Session Logic types
export type {
  SceneType as SessionSceneType,
  GridPosition,
  ConditionInstance,
  HeroBattleState,
  MonsterBattleState,
  HeroLike as SessionHeroLike,
  MonsterLike as SessionMonsterLike,
  Party,
  EncounterSlot,
  SceneOutcome,
  // Template types
  BattleSceneTemplate,
  MontageSceneTemplate,
  NegotiationSceneTemplate,
  RespiteSceneTemplate,
  StorySceneTemplate,
  SceneTemplate,
  // Instance types
  BattleSceneInstance,
  MontageSceneInstance,
  NegotiationSceneInstance,
  RespiteSceneInstance,
  StorySceneInstance,
  SceneInstance,
  // State types
  BattleInstanceState,
  MontageInstanceState,
  NegotiationInstanceState,
  RespiteInstanceState,
  StoryInstanceState,
  // Options
  StartBattleOptions,
  StartMontageOptions,
  StartSceneOptions,
} from './session-logic.js';
