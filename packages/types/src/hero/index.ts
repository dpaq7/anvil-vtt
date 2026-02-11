/**
 * Hero Types for Draw Steel
 * Complete character type system from Mettle
 */

// Summary type for list/card views
export * from './summary.js';

// Core shared types
export * from './common.js';
export * from './abilities.js';
export * from './ancestry.js';
export * from './minion.js';
export * from './combat.js';
export * from './progression.js';
export * from './projects.js';
export * from './equipment.js';
export * from './perk.js';
export * from './items.js';
export * from './summoner.js';
export * from './complication.js';
export * from './title.js';

// Forgesteel-ported types
export * from './feature.js';
export * from './imbuement.js';

// Mettle-specific types (UI, level-up, theming)
export * from './action.js';
export * from './class-progression.js';
export * from './levelup.js';
export * from './portrait.js';
export * from './theme.js';

// Hero types - exported with proper type annotations
export type {
  // Hero classes
  HeroClass,
  HeroicResourceType,
  HeroicResource,
  ElementalistResource,
  SummonerResource,
  TalentResource,
  StaminaPool,
  RecoveryPool,

  // Subclass types
  CensorOrder,
  ConduitDomain,
  ElementalistElement,
  FuryAspect,
  StormwightKit,
  PrimordialStormType,
  FuryForm,
  NullTradition,
  PsionicAugmentation,
  NullFieldEnhancement,
  ShadowCollege,
  SummonerCircle,
  TacticianDoctrine,
  TalentTradition,
  TroubadourClass,
  Subclass,
  SubclassForHeroClass,

  // Class-specific state
  JudgmentState,
  PrayState,
  PersistentAbility,
  GrowingFerocityState,
  FuryState,
  Routine,
  ScenePartner,
  Formation,
  QuickCommand,
  NullFieldState,
  InertialShieldState,
  OrderState,

  // Hero interfaces
  HeroBase,
  CensorHero,
  ConduitHero,
  ElementalistHero,
  FuryHero,
  NullHero,
  ShadowHero,
  SummonerHeroV2,
  TacticianHero,
  TalentHero,
  TroubadourHero,
  Hero,

  // Utility types
  HeroicResourceForClass,
} from './hero.js';

// Value exports (type guards and constants)
export {
  isCensorHero,
  isConduitHero,
  isElementalistHero,
  isFuryHero,
  isNullHero,
  isShadowHero,
  isSummonerHero,
  isTacticianHero,
  isTalentHero,
  isTroubadourHero,
  subclassToPortfolio,
  circleToPortfolio,
} from './hero.js';
