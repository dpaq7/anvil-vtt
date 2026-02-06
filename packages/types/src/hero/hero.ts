// Generalized Hero type for all Draw Steel classes
// Supports all 10 classes via discriminated unions

import type { Ancestry, Career, Culture, Kit, Item, Characteristics, ActiveCondition } from './common.js';
import type { Ability } from './abilities.js';
import type { Feature } from './feature.js';
import type { HeroAncestry } from './ancestry.js';
import type { Portfolio, Squad, Fixture, Champion } from './minion.js';
import type { ChampionState, OutOfCombatState } from './combat.js';
import type { ProgressionChoices } from './progression.js';
import type { ActiveProject, InventoryItem } from './projects.js';
import type { EquippedItem } from './equipment.js';
import type { SelectedPerk } from './perk.js';

// All 11 Draw Steel hero classes
export type HeroClass =
  | 'beastheart'
  | 'censor'
  | 'conduit'
  | 'elementalist'
  | 'fury'
  | 'null'
  | 'shadow'
  | 'summoner'
  | 'tactician'
  | 'talent'
  | 'troubadour';

// Heroic resource types per class
export type HeroicResourceType =
  | 'wrath'      // Censor
  | 'piety'      // Conduit
  | 'essence'    // Elementalist, Summoner
  | 'ferocity'   // Fury
  | 'discipline' // Null
  | 'insight'    // Shadow
  | 'focus'      // Tactician
  | 'clarity'    // Talent
  | 'drama'      // Troubadour
  | 'rage';      // Beastheart

// Shared stamina pool interface
export interface StaminaPool {
  current: number;
  max: number;
  winded: number;
  temporary?: number; // Temporary stamina (lost first, used in VTT combat)
}

// Shared recovery pool interface
export interface RecoveryPool {
  current: number;
  max: number;
  value: number;
}

// Base heroic resource interface
export interface HeroicResource<T extends HeroicResourceType = HeroicResourceType> {
  type: T;
  current: number;
}

// Extended heroic resource for Elementalist (has persistent reduction)
export interface ElementalistResource extends HeroicResource<'essence'> {
  persistent: number; // Essence locked by persistent abilities
}

// Extended heroic resource for Summoner (has max per turn)
export interface SummonerResource extends HeroicResource<'essence'> {
  maxPerTurn: number;
}

// Extended heroic resource for Talent (can go negative)
export interface TalentResource extends HeroicResource<'clarity'> {
  minimum: number; // Can go to -(1+Reason)
}

// =================================================================
// SUBCLASS TYPES PER CLASS
// =================================================================

// Censor Orders (subclass) - Draw Steel SRD
export type CensorOrder = 'exorcist' | 'oracle' | 'paragon';

// Conduit Domains (can choose 2)
export type ConduitDomain =
  | 'creation'
  | 'death'
  | 'fate'
  | 'knowledge'
  | 'life'
  | 'love'
  | 'nature'
  | 'protection'
  | 'storm'
  | 'sun'
  | 'trickery'
  | 'war';

// Elementalist Elements
export type ElementalistElement = 'earth' | 'fire' | 'green' | 'void';

// Fury Aspects (subclasses)
export type FuryAspect = 'berserker' | 'reaver' | 'stormwight';

// Stormwight Kits (sub-subclass for Stormwight only)
export type StormwightKit = 'boren' | 'corven' | 'raden' | 'vuken';

// Primordial Storm damage types per kit
export type PrimordialStormType = 'cold' | 'fire' | 'corruption' | 'lightning';

// Fury form state (for Stormwight)
export type FuryForm = 'humanoid' | 'animal' | 'hybrid';

// Null Traditions (corrected from Draw Steel rules)
export type NullTradition = 'chronokinetic' | 'cryokinetic' | 'metakinetic';

// Psionic Augmentation choices
export type PsionicAugmentation = 'density' | 'force' | 'speed';

// Null Field enhancement options
export type NullFieldEnhancement = 'graviticDisruption' | 'inertialAnchor' | 'synapticBreak';

// Shadow Colleges - Draw Steel SRD
export type ShadowCollege =
  | 'black-ash'
  | 'caustic-alchemy'
  | 'harlequin-mask';

// Summoner Circles (already defined, re-export for consistency)
export type SummonerCircle = 'blight' | 'graves' | 'spring' | 'storms';

// Tactician Doctrines
export type TacticianDoctrine = 'insurgent' | 'mastermind' | 'vanguard';

// Talent Traditions - Draw Steel SRD
export type TalentTradition = 'chronopathy' | 'telekinesis' | 'telepathy';

// Troubadour Class Acts (subclass)
export type TroubadourClass = 'auteur' | 'duelist' | 'virtuoso';

// =================================================================
// UNIFIED SUBCLASS TYPE
// =================================================================

// Union of all subclass types for generic handling
export type Subclass =
  | CensorOrder
  | ConduitDomain
  | ElementalistElement
  | FuryAspect
  | NullTradition
  | ShadowCollege
  | SummonerCircle
  | TacticianDoctrine
  | TalentTradition
  | TroubadourClass;

// Helper type to get subclass type for a given hero class
export type SubclassForHeroClass<T extends HeroClass> =
  T extends 'beastheart' ? never :
  T extends 'censor' ? CensorOrder :
  T extends 'conduit' ? ConduitDomain :
  T extends 'elementalist' ? ElementalistElement :
  T extends 'fury' ? FuryAspect :
  T extends 'null' ? NullTradition :
  T extends 'shadow' ? ShadowCollege :
  T extends 'summoner' ? SummonerCircle :
  T extends 'tactician' ? TacticianDoctrine :
  T extends 'talent' ? TalentTradition :
  T extends 'troubadour' ? TroubadourClass :
  never;

// =================================================================
// CLASS-SPECIFIC STATE TYPES
// =================================================================

// Censor judgment tracking
export interface JudgmentState {
  targetId: string | null;
  targetName: string | null;
}

// Conduit prayer tracking
export interface PrayState {
  hasPrayedThisTurn: boolean;
  lastPrayResult: 'piety' | 'domain' | 'damage' | null;
}

// Elementalist persistent abilities
export interface PersistentAbility {
  abilityId: string;
  abilityName: string;
  essenceLocked: number;
  activeSince: number;
}

// Growing Ferocity tier tracking (Fury)
export interface GrowingFerocityState {
  tookDamageThisRound: boolean;
  becameWindedThisEncounter: boolean;
  becameDyingThisEncounter: boolean;
}

// Fury-specific state
export interface FuryState {
  aspect: FuryAspect;
  stormwightKit?: StormwightKit; // Only if aspect is 'stormwight'
  primordialStorm?: PrimordialStormType; // Derived from kit
  currentForm: FuryForm; // Stormwight form tracking
  growingFerocity: GrowingFerocityState;
  primordialPower: number; // Epic resource (L10)
}

// Troubadour routines
export interface Routine {
  id: string;
  name: string;
  effect: string;
  auraDistance?: number | null;
  rangedDistance?: number;
}

// Troubadour scene partners (for negotiation)
export interface ScenePartner {
  id: string;
  name: string;
  bondedAt: number;
}

// Summoner formations (re-export)
export type Formation = 'horde' | 'platoon' | 'elite' | 'leader';

export interface QuickCommand {
  id: string;
  name: string;
  description: string;
  formation: Formation;
}

// =================================================================
// BASE HERO INTERFACE (shared by all classes)
// =================================================================

export interface HeroBase {
  id: string;
  name: string;
  title?: string; // Optional character title (e.g., "The Bold", "Dragonslayer")
  level: number; // 1-10
  heroClass: HeroClass;

  // Background
  ancestry: Ancestry;
  ancestrySelection?: HeroAncestry; // New: point-buy ancestry trait selection
  culture: Culture;
  career: Career;

  // Core characteristics
  characteristics: Characteristics;

  // Combat stats
  stamina: StaminaPool;
  recoveries: RecoveryPool;
  speed: number;
  stability: number;

  // Universal resources
  surges: number;
  heroTokens: number;
  victories: number;
  xp: number;
  wealth: number;
  gold: number;
  renown: number;

  // Abilities & features
  abilities: Ability[];
  features: Feature[];

  // Skills & languages
  skills: string[];
  languages: string[];

  // Equipment
  kit: Kit;
  items: Item[];
  equippedItems: EquippedItem[];
  inventory: InventoryItem[];

  // Status
  activeConditions: ActiveCondition[];
  notes: string;
  portraitUrl: string | null;

  // Progression tracking
  progressionChoices: ProgressionChoices;
  activeProjects: ActiveProject[];

  // Perks selected during character creation and level-up
  selectedPerks?: SelectedPerk[];
}

// =================================================================
// CLASS-SPECIFIC HERO INTERFACES
// =================================================================

export interface CensorHero extends HeroBase {
  heroClass: 'censor';
  heroicResource: HeroicResource<'wrath'>;
  judgment: JudgmentState;
  subclass?: CensorOrder;
}

export interface ConduitHero extends HeroBase {
  heroClass: 'conduit';
  heroicResource: HeroicResource<'piety'>;
  subclass?: ConduitDomain;      // Primary domain (for display/legacy)
  domains?: ConduitDomain[];     // Both chosen domains (Conduit selects 2)
  prayState: PrayState;
}

export interface ElementalistHero extends HeroBase {
  heroClass: 'elementalist';
  heroicResource: ElementalistResource;
  subclass?: ElementalistElement;
  mantleActive: boolean;
  persistentAbilities: PersistentAbility[];
}

export interface FuryHero extends HeroBase {
  heroClass: 'fury';
  heroicResource: HeroicResource<'ferocity'>;
  furyState: FuryState;
  subclass?: FuryAspect;
}

// Null Field state tracking
export interface NullFieldState {
  isActive: boolean;
  baseSize: number; // Always 1
  bonusSize: number; // From Order spending at combat start
  currentEnhancement: NullFieldEnhancement | null;
  enhancementUsedThisTurn: boolean;
}

// Inertial Shield usage tracking
export interface InertialShieldState {
  usedThisRound: boolean;
  disciplineSpentOnPotencyReduction: number;
  traditionBonusUsed: boolean;
}

// Order (L10 epic resource) state
export interface OrderState {
  current: number;
  spentAsDiscipline: number; // This encounter
  fieldSizeBonus: number; // From spending at combat start
}

export interface NullHero extends HeroBase {
  heroClass: 'null';
  heroicResource: HeroicResource<'discipline'>;

  // Subclass (tradition) and secondary choice (augmentation)
  subclass?: NullTradition;
  augmentation?: PsionicAugmentation;

  // Null Field state
  nullField: NullFieldState;

  // Combat tracking
  inertialShield: InertialShieldState;

  // L10 epic resource
  order?: OrderState;
}

export interface ShadowHero extends HeroBase {
  heroClass: 'shadow';
  heroicResource: HeroicResource<'insight'>;
  subclass?: ShadowCollege;
  isHidden: boolean;
}

export interface SummonerHeroV2 extends HeroBase {
  heroClass: 'summoner';
  heroicResource: SummonerResource;
  subclass?: SummonerCircle;
  formation: Formation;
  quickCommand: QuickCommand;
  portfolio: Portfolio;
  activeSquads: Squad[];
  fixture: Fixture | null;
  minionPortraits: Record<string, string | null>;
  fixturePortrait: string | null;
  inactiveMinions: string[];

  // Champion (Level 8+ feature) - Summoner v1.0 SRD
  activeChampion: Champion | null;
  championState: ChampionState;

  // Out-of-combat minion tracking - Summoner v1.0 SRD
  outOfCombatState: OutOfCombatState;
}

export interface TacticianHero extends HeroBase {
  heroClass: 'tactician';
  heroicResource: HeroicResource<'focus'>;
  markedTargets: string[];
  secondaryKit: Kit | null; // Field Arsenal allows two kits
  subclass?: TacticianDoctrine;
}

export interface TalentHero extends HeroBase {
  heroClass: 'talent';
  heroicResource: TalentResource;
  isStrained: boolean; // true when clarity < 0
  subclass?: TalentTradition;
}

export interface TroubadourHero extends HeroBase {
  heroClass: 'troubadour';
  heroicResource: HeroicResource<'drama'>;
  activeRoutine: Routine | null;
  secondaryRoutine: Routine | null; // For Medley (Virtuoso L5+)
  scenePartners: ScenePartner[];
  heroPartners: string[]; // Hero IDs bonded for Equal Billing
  subclass?: TroubadourClass;
}

// =================================================================
// UNION TYPE FOR ALL HEROES
// =================================================================

export type Hero =
  | CensorHero
  | ConduitHero
  | ElementalistHero
  | FuryHero
  | NullHero
  | ShadowHero
  | SummonerHeroV2
  | TacticianHero
  | TalentHero
  | TroubadourHero;

// =================================================================
// TYPE GUARDS
// =================================================================

export function isCensorHero(hero: Hero): hero is CensorHero {
  return hero.heroClass === 'censor';
}

export function isConduitHero(hero: Hero): hero is ConduitHero {
  return hero.heroClass === 'conduit';
}

export function isElementalistHero(hero: Hero): hero is ElementalistHero {
  return hero.heroClass === 'elementalist';
}

export function isFuryHero(hero: Hero): hero is FuryHero {
  return hero.heroClass === 'fury';
}

export function isNullHero(hero: Hero): hero is NullHero {
  return hero.heroClass === 'null';
}

export function isShadowHero(hero: Hero): hero is ShadowHero {
  return hero.heroClass === 'shadow';
}

export function isSummonerHero(hero: Hero): hero is SummonerHeroV2 {
  return hero.heroClass === 'summoner';
}

export function isTacticianHero(hero: Hero): hero is TacticianHero {
  return hero.heroClass === 'tactician';
}

export function isTalentHero(hero: Hero): hero is TalentHero {
  return hero.heroClass === 'talent';
}

export function isTroubadourHero(hero: Hero): hero is TroubadourHero {
  return hero.heroClass === 'troubadour';
}

// =================================================================
// UTILITY TYPES
// =================================================================

// Get heroic resource type for a class
export type HeroicResourceForClass<T extends HeroClass> =
  T extends 'beastheart' ? 'rage' :
  T extends 'censor' ? 'wrath' :
  T extends 'conduit' ? 'piety' :
  T extends 'elementalist' ? 'essence' :
  T extends 'fury' ? 'ferocity' :
  T extends 'null' ? 'discipline' :
  T extends 'shadow' ? 'insight' :
  T extends 'summoner' ? 'essence' :
  T extends 'tactician' ? 'focus' :
  T extends 'talent' ? 'clarity' :
  T extends 'troubadour' ? 'drama' :
  never;

// Summoner subclass to Portfolio mapping
export const subclassToPortfolio: Record<SummonerCircle, 'demon' | 'elemental' | 'fey' | 'undead'> = {
  blight: 'demon',
  graves: 'undead',
  spring: 'fey',
  storms: 'elemental',
};

// Backward compatibility alias
export const circleToPortfolio = subclassToPortfolio;
