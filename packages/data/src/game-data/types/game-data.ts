/**
 * @fileoverview Draw Steel Game Data Types
 *
 * Comprehensive TypeScript interfaces for all Draw Steel game data.
 * These types represent the authoritative source of truth for game mechanics.
 *
 * Data Sources:
 * - JSON: src/data/source/game-json/ (abilities, features, monsters)
 * - Markdown: src/data/source/rules-md/ (ancestries, careers, kits, rules)
 *
 * @see https://mcdm.gg/DrawSteel for official rules
 */

// ============================================
// CORE ENUMS & UNIONS
// ============================================

/**
 * The five characteristics that define a creature's capabilities.
 * Each characteristic has a score that determines bonuses to rolls.
 *
 * @see rules-md/Chapters/The Basics.md
 */
export type Characteristic = 'might' | 'agility' | 'reason' | 'intuition' | 'presence';

/**
 * All playable hero classes in Draw Steel.
 * Each class has unique abilities, a heroic resource, and subclasses.
 *
 * @see rules-md/Classes/
 */
export type HeroClass =
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

/**
 * Heroic resources fuel class abilities.
 * Each class has one primary resource that builds during combat.
 *
 * @see rules-md/Classes/ (each class file)
 */
export type HeroicResource =
  | 'wrath'      // Censor - builds through damage and divine judgment
  | 'piety'      // Conduit - builds through healing and support
  | 'essence'    // Elementalist, Summoner - builds through elemental/minion actions
  | 'ferocity'   // Fury - builds through taking/dealing damage
  | 'discipline' // Null - builds through psionics and control
  | 'insight'    // Shadow - builds through positioning and stealth
  | 'focus'      // Tactician - builds through commands and tactics
  | 'clarity'    // Talent - builds through psychic powers
  | 'drama';     // Troubadour - builds through performance and allies

/**
 * Action types for abilities.
 * Determines when and how often an ability can be used.
 *
 * @see rules-md/Chapters/Combat.md
 */
export type ActionType =
  | 'Main action'
  | 'Maneuver'
  | 'Move action'
  | 'Triggered action'
  | 'Free triggered action'
  | 'Free maneuver'
  | '-'; // No action cost (villain actions, etc.)

/**
 * Keywords that categorize abilities and determine interactions.
 * Multiple keywords can apply to a single ability.
 *
 * @see rules-md/Chapters/Combat.md
 */
export type Keyword =
  // Ability types
  | 'Area'
  | 'Charge'
  | 'Magic'
  | 'Melee'
  | 'Psionic'
  | 'Ranged'
  | 'Resistance'
  | 'Strike'
  | 'Weapon'
  // Damage types (also used as keywords)
  | 'Acid'
  | 'Cold'
  | 'Corruption'
  | 'Fire'
  | 'Holy'
  | 'Lightning'
  | 'Poison'
  | 'Sonic'
  | 'Void'
  | '-'; // No keywords

/**
 * Size notation for creatures and objects.
 * Size 1 creatures are further subdivided by T/S/M/L.
 *
 * @see rules-md/Chapters/Combat.md lines 30-52
 */
export type Size = '1T' | '1S' | '1M' | '1L' | '2' | '3' | '4' | '5' | string;

/**
 * Monster roles that define combat behavior and encounter building.
 *
 * @see rules-md/Chapters/For the Director.md
 */
export type MonsterRole =
  | 'Ambusher'
  | 'Artillery'
  | 'Boss'
  | 'Brute'
  | 'Controller'
  | 'Defender'
  | 'Harrier'
  | 'Hexer'
  | 'Leader'
  | 'Minion'
  | 'Mount'
  | 'Solo'
  | 'Support';

/**
 * Standard condition names in Draw Steel.
 * Conditions modify creature capabilities and can stack.
 *
 * @see rules-md/Conditions/
 */
export type ConditionName =
  | 'bleeding'
  | 'dazed'
  | 'frightened'
  | 'grabbed'
  | 'prone'
  | 'restrained'
  | 'slowed'
  | 'taunted'
  | 'weakened';

/**
 * Test difficulty levels.
 * Determines the outcome thresholds for power rolls.
 *
 * @see rules-md/Chapters/Tests.md lines 78-93
 */
export type TestDifficulty = 'easy' | 'medium' | 'hard';

/**
 * Power roll result tier (1-3).
 * Tier 1: ≤11, Tier 2: 12-16, Tier 3: 17+
 *
 * @see rules-md/Chapters/Tests.md
 */
export type Tier = 1 | 2 | 3;

/**
 * Skill group categories.
 * Each skill belongs to exactly one group.
 *
 * @see rules-md/Skills/
 */
export type SkillGroup = 'crafting' | 'exploration' | 'interpersonal' | 'intrigue' | 'lore';

/**
 * Perk categories matching skill groups plus supernatural.
 *
 * @see rules-md/Perks/
 */
export type PerkCategory = SkillGroup | 'supernatural';

// ============================================
// METADATA (shared across all feature types)
// ============================================

/**
 * Semantic content codes for cross-referencing between JSON and MD.
 * These codes uniquely identify each piece of game content.
 *
 * Format: "source:type:id"
 * Example: "mcdm.heroes.v1:feature.ability.fury.1st-level-feature:to-the-death"
 */
export interface FeatureMetadata {
  /**
   * Semantic content code - primary identifier for cross-referencing.
   * Array because some features have multiple applicable codes.
   */
  scc: string[];

  /**
   * Semantic document code - references source document location.
   * Format: "version:chapter.section:index"
   */
  scdc: string[];

  /** Source identifier, e.g., "mcdm.heroes.v1" */
  source: string;

  /**
   * Type path describing the content hierarchy.
   * Example: "feature/ability/fury/1st-level-feature"
   */
  type: string;

  /** Unique item identifier in kebab-case, e.g., "to-the-death" */
  item_id: string;

  /** Display name of the item */
  item_name: string;

  /** Index within source document (string or number) */
  item_index: string | number;

  /** Original file basename without extension */
  file_basename: string;

  /** File directory path within source */
  file_dpath: string;

  // === Optional context ===

  /** Class this feature belongs to, if applicable */
  class?: string;

  /** Subclass this feature belongs to, if applicable */
  subclass?: string;

  /** Level at which this feature is gained */
  level?: number;

  /** Ability type classification (e.g., "Signature") */
  ability_type?: string;

  /** Action type for abilities (duplicated for convenience) */
  action_type?: ActionType | 'feature';

  // === Cost parsing (when cost is present) ===

  /** Raw cost string, e.g., "9 Wrath" */
  cost?: string;

  /** Parsed numeric cost amount */
  cost_amount?: number;

  /** Parsed resource type */
  cost_resource?: string;

  // === Ability details (duplicated from parent for convenience) ===

  /** Keywords for this ability */
  keywords?: string[];

  /** Distance/range of the ability */
  distance?: string;

  /** Target specification */
  target?: string;

  /** Flavor text */
  flavor?: string;
}

// ============================================
// EFFECTS (the core of abilities)
// ============================================

/**
 * Simple effect with just descriptive text.
 * Most basic effect type for traits and simple abilities.
 */
export interface PlainEffect {
  /** The effect description text */
  effect: string;
}

/**
 * Named effect with a label (e.g., "Effect:", "Spend 1 Ferocity:").
 * Used when effects need clear categorization.
 */
export interface NamedEffect {
  /** Label for the effect (e.g., "Effect", "Spend 1 Ferocity") */
  name: string;
  /** The effect description text */
  effect: string;
}

/**
 * Power roll result with tier-based outcomes.
 * The core mechanic for most active abilities.
 *
 * @see rules-md/Chapters/Tests.md
 */
export interface PowerRollEffect {
  /** Roll formula, e.g., "Power Roll + Might" */
  roll: string;
  /** Result for Tier 1 (≤11) */
  tier1: string;
  /** Result for Tier 2 (12-16) */
  tier2: string;
  /** Result for Tier 3 (17+) */
  tier3: string;
}

/**
 * Effect with an associated resource cost.
 * Used for optional enhancements to abilities.
 */
export interface CostEffect {
  /** Cost to activate, e.g., "3 Malice", "Spend 1 Ferocity" */
  cost: string;
  /** The effect when cost is paid */
  effect: string;
}

/**
 * Effect that grants nested features/abilities.
 * Used when one feature unlocks access to others.
 */
export interface NestedFeatureEffect {
  /** Description of how/when nested features apply */
  effect: string;
  /** Features granted by this effect */
  features: Feature[];
}

/**
 * Effect with optional trigger and tier outcomes.
 * Used for triggered actions and conditional effects.
 */
export interface TriggerEffect {
  /** Optional label for the effect */
  name?: string;
  /** The effect description */
  effect: string;
  /** Optional Tier 1 outcome */
  tier1?: string;
  /** Optional Tier 2 outcome */
  tier2?: string;
  /** Optional Tier 3 outcome */
  tier3?: string;
}

/**
 * Union of all possible effect types.
 * Use type guards to narrow to specific effect types.
 */
export type Effect =
  | PlainEffect
  | NamedEffect
  | PowerRollEffect
  | CostEffect
  | NestedFeatureEffect
  | TriggerEffect;

// ============================================
// FEATURES (abilities, traits, etc.)
// ============================================

/**
 * Base interface for all features (abilities and traits).
 */
export interface BaseFeature {
  /** Discriminator: always "feature" for features */
  type: 'feature';
  /** Display name of the feature */
  name: string;
  /** Metadata for cross-referencing and categorization */
  metadata: FeatureMetadata;
  /** Array of effects this feature provides */
  effects: Effect[];
}

/**
 * Active ability with usage, distance, and target.
 * Abilities are actively used during play.
 *
 * @see game-json/Heroes/Abilities/
 */
export interface Ability extends BaseFeature {
  /** Discriminator: "ability" for active abilities */
  feature_type: 'ability';
  /** Optional flavor text describing the ability thematically */
  flavor?: string;
  /** Keywords that apply to this ability */
  keywords: string[];
  /** Action type required to use the ability */
  usage: ActionType;
  /** Range or area of the ability, e.g., "Melee 1", "Ranged 10" */
  distance: string;
  /** What the ability targets, e.g., "One creature", "Each enemy in area" */
  target: string;
  /** Resource cost to use, if any */
  cost?: string;
  /** Trigger condition for triggered actions */
  trigger?: string;
  /** Special ability type (e.g., "Signature Ability", "Villain Action 1") */
  ability_type?: string;
  /** Optional icon for display */
  icon?: string;
}

/**
 * Passive trait that provides ongoing benefits.
 * Traits are always active unless specified otherwise.
 *
 * @see game-json/Heroes/Features/
 */
export interface Trait extends BaseFeature {
  /** Discriminator: "trait" for passive traits */
  feature_type: 'trait';
  /** Optional icon for display */
  icon?: string;
  /** Some traits have activation costs */
  cost?: string;
}

/**
 * Union type for all feature types.
 * Use `feature.feature_type` to discriminate.
 */
export type Feature = Ability | Trait;

// ============================================
// FEATURE BLOCKS (grouped features)
// ============================================

/**
 * Block of related features (e.g., Malice features for monsters).
 * Used to group thematically connected abilities.
 *
 * @see game-json/Monsters/
 */
export interface FeatureBlock {
  /** Discriminator: "featureblock" for grouped features */
  type: 'featureblock';
  /** Type of feature block, e.g., "Malice Features" */
  featureblock_type: string;
  /** Display name of the feature block */
  name: string;
  /** Optional flavor text */
  flavor?: string;
  /** Features contained in this block */
  features: Feature[];
}

// ============================================
// MONSTER STATBLOCKS
// ============================================

/**
 * Custom stat entry for creatures with special properties.
 * Used for traps, mechanisms, and unique creatures.
 */
export interface CustomStat {
  /** Name of the stat */
  name: string;
  /** Value or description */
  value: string;
}

/**
 * Complete monster statblock with all combat statistics.
 *
 * @see game-json/Monsters/Monsters/
 */
export interface MonsterStatblock {
  /** Discriminator: "statblock" for monster stat blocks */
  type: 'statblock';
  /** Monster name */
  name: string;
  /** Challenge level (1-10+) */
  level: number;
  /** Combat roles for encounter building */
  roles: MonsterRole[];
  /** Monster ancestry/type (e.g., ["Giant", "Humanoid"]) */
  ancestry?: string[];
  /** Encounter value for balance calculations */
  ev: string;
  /** Total stamina points */
  stamina: string;
  /** Movement speed in squares */
  speed: number;
  /** Size notation */
  size: Size;
  /** Stability score */
  stability: number;
  /** Free strike damage value */
  free_strike: number;
  /** Might characteristic score */
  might: number;
  /** Agility characteristic score */
  agility: number;
  /** Reason characteristic score */
  reason: number;
  /** Intuition characteristic score */
  intuition: number;
  /** Presence characteristic score */
  presence: number;
  /** All features (traits and abilities) for this monster */
  features: Feature[];
  /** Custom stats for special creatures */
  stats?: CustomStat[];
  /** Optional flavor text */
  flavor?: string;
}

/**
 * Trap or mechanism statblock (simpler than full monsters).
 *
 * @see game-json/Monsters/Dynamic Terrain/
 */
export interface TrapStatblock {
  /** Discriminator: "featureblock" for traps */
  type: 'featureblock';
  /** Type classification, e.g., "Trap Ambusher" */
  featureblock_type: string;
  /** Trap name */
  name: string;
  /** Challenge level */
  level: number;
  /** Encounter value */
  ev: string;
  /** Optional flavor text */
  flavor?: string;
  /** Stamina if destructible */
  stamina?: string;
  /** Size if applicable */
  size?: Size;
  /** Custom properties */
  stats?: CustomStat[];
  /** Trap features and abilities */
  features: Feature[];
}

// ============================================
// HEROES DATA (from JSON abilities/features files)
// ============================================

/**
 * Root structure of abilities.json file.
 *
 * @see game-json/Heroes/Features/abilities.json
 */
export interface AbilitiesFile {
  features: Feature[];
}

/**
 * Root structure of features.json file.
 *
 * @see game-json/Heroes/Features/features.json
 */
export interface FeaturesFile {
  features: Feature[];
}

// ============================================
// CHARACTER CREATION (parsed from MD)
// ============================================

/**
 * Ancestry trait (signature or purchased).
 * Each ancestry has one signature trait and several purchasable traits.
 *
 * @see rules-md/Ancestries/
 */
export interface AncestryTrait {
  /** Unique identifier for the trait */
  id: string;
  /** Display name */
  name: string;
  /** Ancestry point cost (undefined for signature traits) */
  pointCost?: number;
  /** Full effect description */
  effect: string;
  /** Raw markdown source for reference */
  rawMarkdown?: string;
}

/**
 * Complete ancestry definition with all traits.
 *
 * @see rules-md/Ancestries/
 */
export interface AncestryDefinition {
  /** Unique identifier derived from scc code */
  id: string;
  /** Display name */
  name: string;
  /** Size notation (most are "1M") */
  size: Size;
  /** Base speed in squares */
  speed: number;
  /** The single signature trait every member has */
  signatureTrait: AncestryTrait;
  /** Purchasable traits with point costs */
  purchasedTraits: AncestryTrait[];
  /** Total ancestry points available */
  totalPoints: number;
  /** Raw markdown source for reference */
  rawMarkdown?: string;
}

/**
 * Career definition providing starting benefits.
 *
 * @see rules-md/Careers/
 */
export interface CareerDefinition {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Description of the career */
  description: string;
  /** Skills granted (as skill group references or specific skills) */
  skills: string[];
  /** Languages gained (e.g., ["1 Language", "Caelian"]) */
  languages: string[];
  /** Starting renown bonus */
  renown: number;
  /** Starting wealth bonus */
  wealth: number;
  /** Project points to start with */
  projectPoints: number;
  /** Perk category granted */
  perkType: PerkCategory;
  /** Sample inciting incident */
  incitingIncident: string;
}

/**
 * Culture benefit from environment, organization, or upbringing.
 *
 * @see rules-md/Cultures/
 */
export interface CultureBenefit {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Category of culture benefit */
  type: 'environment' | 'organization' | 'upbringing';
  /** Full effect description */
  effect: string;
  /** Skill granted, if any */
  skill?: string;
  /** Language granted, if any */
  language?: string;
  /** Raw markdown source for reference */
  rawMarkdown?: string;
}

/**
 * Kit bonuses parsed from markdown tables.
 * Kits provide stat bonuses based on equipment loadout.
 *
 * @see rules-md/Kits/
 */
/**
 * Kit signature ability with power roll tiers.
 */
export interface KitSignatureAbility {
  /** Ability name */
  name: string;
  /** Description text */
  description: string;
  /** Keywords for this ability */
  keywords: string[];
  /** Action type */
  type: string;
  /** Range/distance */
  distance: string;
  /** Target specification */
  target: string;
  /** Characteristic(s) for power roll */
  powerRoll: string;
  /** Tier 1 (≤11) effect */
  tier1: string;
  /** Tier 2 (12-16) effect */
  tier2: string;
  /** Tier 3 (17+) effect */
  tier3: string;
  /** Additional effect text */
  effect?: string;
}

/**
 * Complete kit definition with equipment and signature ability.
 *
 * @see rules-md/Kits/
 */
export interface KitDefinition {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Description of the kit */
  description: string;
  /** Armor type, e.g., "Light", "Heavy", "None" */
  armor: string;
  /** Weapon types available */
  weapons: string[];
  /** Stamina bonus per echelon (0, 3, 6, 9, or 12) */
  staminaPerEchelon: number;
  /** Speed bonus in squares */
  speedBonus: number;
  /** Stability bonus */
  stabilityBonus: number;
  /** Melee damage bonus by tier, e.g., "+2/+2/+2" */
  meleeDamageBonus: string | null;
  /** Ranged damage bonus by tier */
  rangedDamageBonus: string | null;
  /** Melee distance bonus */
  meleeDistanceBonus: number;
  /** Ranged distance bonus */
  rangedDistanceBonus: number;
  /** Disengage bonus */
  disengageBonus: number;
  /** The signature ability granted by this kit */
  signatureAbility: KitSignatureAbility;
}

/**
 * Skill definition with group categorization.
 *
 * @see rules-md/Skills/
 */
export interface SkillDefinition {
  /** Skill name (used as identifier) */
  name: string;
  /** Which skill group this belongs to */
  group: SkillGroup;
  /** Description of what this skill covers */
  description: string;
}

/**
 * Condition definition with mechanical effects.
 *
 * @see rules-md/Conditions/
 */
export interface ConditionDefinition {
  /** Unique identifier */
  id: ConditionName;
  /** Display name */
  name: string;
  /** Full mechanical effect description */
  effect: string;
  /** How this condition typically ends */
  endTrigger?: 'save' | 'action' | 'special';
  /** Raw markdown source for reference */
  rawMarkdown?: string;
}

/**
 * Perk definition with prerequisites and effects.
 *
 * @see rules-md/Perks/
 */
export interface PerkDefinition {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Which perk category */
  category: PerkCategory;
  /** Prerequisite (if any) */
  prerequisite?: string;
  /** Full effect description */
  effect: string;
  /** Raw markdown source for reference */
  rawMarkdown?: string;
}

/**
 * Language definition.
 *
 * @see rules-md/Character Options/Languages.md
 */
export interface LanguageDefinition {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Related ancestry or use case */
  relatedTo: string;
  /** Whether this is a dead language (for research only) */
  isDead?: boolean;
  /** Whether all heroes know this language (Caelian) */
  isDefault?: boolean;
  /** What research this dead language unlocks */
  researchFocus?: string;
}

// ============================================
// CLASS DEFINITIONS (combining JSON + MD)
// ============================================

/**
 * Starting stats for a class.
 *
 * @see rules-md/Classes/
 */
export interface ClassBaseStats {
  /** Fixed starting Might (if any) */
  startingMight?: number;
  /** Fixed starting Agility (if any) */
  startingAgility?: number;
  /** Fixed starting Reason (if any) */
  startingReason?: number;
  /** Fixed starting Intuition (if any) */
  startingIntuition?: number;
  /** Fixed starting Presence (if any) */
  startingPresence?: number;
  /** Available arrays for non-fixed characteristics */
  characteristicArrays: number[][];
  /** Stamina progression */
  stamina: {
    /** Starting stamina at level 1 */
    level1: number;
    /** Stamina gained per level after 1st */
    perLevel: number;
  };
  /** Number of recoveries */
  recoveries: number;
  /** Starting skills (references) */
  skills: string[];
}

/**
 * Potency calculations for a class.
 * Determines effectiveness of abilities at different power levels.
 *
 * @see rules-md/Classes/
 */
export interface Potency {
  /** Weak potency formula, e.g., "Might - 2" */
  weak: string;
  /** Average potency formula, e.g., "Might - 1" */
  average: string;
  /** Strong potency formula, e.g., "Might" */
  strong: string;
}

/**
 * Single level in class progression.
 *
 * @see rules-md/Classes/ (advancement tables)
 */
export interface LevelProgression {
  /** Character level (1-10) */
  level: number;
  /** Features gained at this level */
  features: string[];
  /** Abilities available, e.g., "Signature, 3, 5, 7" */
  abilities: string;
  /** Subclass-specific abilities, if any */
  aspectAbilities?: string;
}

/**
 * Subclass option within a hero class.
 *
 * @see rules-md/Classes/
 */
export interface SubclassDefinition {
  /** Subclass identifier */
  id: string;
  /** Display name */
  name: string;
  /** Description of the subclass */
  description?: string;
}

/**
 * Full heroic resource definition for a class.
 */
export interface HeroicResourceDefinition {
  /** Display name (e.g., "Wrath", "Piety") */
  name: string;
  /** Resource type identifier */
  type: HeroicResource;
  /** How starting amount is determined */
  startingAmount: 'victories' | string;
  /** Resource gained per turn (e.g., "2", "1d3") */
  gainPerTurn: string;
  /** Conditions that trigger resource gain */
  gainTrigger: string;
}

/**
 * Combat role for a hero class.
 */
export type ClassRole = 'Defender' | 'Controller' | 'Striker' | 'Support';

/**
 * Complete class definition combining all sources.
 *
 * @see rules-md/Classes/
 */
export interface HeroClassDefinition {
  /** Class identifier */
  id: HeroClass;
  /** Display name */
  name: string;
  /** Class description */
  description: string;
  /** Combat role */
  role: ClassRole;
  /** Whether this is a master class (e.g., Summoner) */
  masterClass: boolean;
  /** Primary heroic resource type */
  heroicResource: HeroicResource;
  /** Full heroic resource definition */
  heroicResourceDef: HeroicResourceDefinition;
  /** Primary characteristic for the class */
  primaryCharacteristic: Characteristic;
  /** The characteristic used for potency calculations */
  potencyCharacteristic: Characteristic;
  /** Starting statistics */
  baseStats: ClassBaseStats;
  /** Potency calculations */
  potency: Potency;
  /** Starting characteristic values (fixed by class) */
  startingCharacteristics: Partial<Record<Characteristic, number>>;
  /** Subclass term (e.g., "Circle", "Aspect", "Domain") */
  subclassName: string;
  /** Plural form of subclass term */
  subclassNamePlural?: string;
  /** How many subclasses to select (1 for most, 2 for Conduit) */
  subclassSelectCount: number;
  /** Available subclass options */
  subclasses: SubclassDefinition[];
  /** Level-by-level progression */
  levelProgression: LevelProgression[];
  /** Fixed skills granted by class */
  fixedSkills: string[];
  /** Skill group choices */
  skillGroupChoices: { groups: string[]; count: number }[];
  /** Raw markdown source for reference */
  rawMarkdown?: string;
}

// ============================================
// ROOT DATA STRUCTURE
// ============================================

/**
 * Complete game data from all sources.
 * This is the master data structure loaded by GameData.
 */
export interface DrawSteelData {
  // === From JSON ===

  /** All abilities from abilities.json */
  abilities: Feature[];
  /** All features from features.json */
  features: Feature[];
  /** All monster statblocks */
  monsters: MonsterStatblock[];
  /** Dynamic terrain (traps, mechanisms) */
  traps: TrapStatblock[];

  // === From MD (parsed) ===

  /** All playable ancestries */
  ancestries: AncestryDefinition[];
  /** All career options */
  careers: CareerDefinition[];
  /** All culture benefits */
  cultures: CultureBenefit[];
  /** All equipment kits */
  kits: KitDefinition[];
  /** All skills by group */
  skills: SkillDefinition[];
  /** All condition definitions */
  conditions: ConditionDefinition[];
  /** All perk definitions */
  perks: PerkDefinition[];
  /** All languages */
  languages: LanguageDefinition[];
  /** All class definitions */
  classes: HeroClassDefinition[];

  // === Cross-reference indexes ===

  /** Index by scc code for fast lookup */
  byScc: Record<string, Feature | AncestryDefinition | CareerDefinition | KitDefinition>;
}

// ============================================
// TYPE GUARDS
// ============================================

/**
 * Type guard to check if a string is a valid HeroClass.
 */
export function isHeroClass(value: string): value is HeroClass {
  const validClasses: HeroClass[] = [
    'censor', 'conduit', 'elementalist', 'fury', 'null',
    'shadow', 'summoner', 'tactician', 'talent', 'troubadour'
  ];
  return validClasses.includes(value as HeroClass);
}

/**
 * Type guard to check if a string is a valid Characteristic.
 */
export function isCharacteristic(value: string): value is Characteristic {
  const validCharacteristics: Characteristic[] = [
    'might', 'agility', 'reason', 'intuition', 'presence'
  ];
  return validCharacteristics.includes(value as Characteristic);
}

/**
 * Type guard to check if a string is a valid ConditionName.
 */
export function isConditionName(value: string): value is ConditionName {
  const validConditions: ConditionName[] = [
    'bleeding', 'dazed', 'frightened', 'grabbed',
    'prone', 'restrained', 'slowed', 'taunted', 'weakened'
  ];
  return validConditions.includes(value as ConditionName);
}

/**
 * Type guard to check if a feature is an Ability (not a Trait).
 */
export function isAbility(feature: Feature): feature is Ability {
  return feature.feature_type === 'ability';
}

/**
 * Type guard to check if a feature is a Trait (not an Ability).
 */
export function isTrait(feature: Feature): feature is Trait {
  return feature.feature_type === 'trait';
}

/**
 * Type guard to check if an effect is a PowerRollEffect.
 */
export function isPowerRollEffect(effect: Effect): effect is PowerRollEffect {
  return 'roll' in effect && 'tier1' in effect && 'tier2' in effect && 'tier3' in effect;
}

/**
 * Type guard to check if an effect has nested features.
 */
export function hasNestedFeatures(effect: Effect): effect is NestedFeatureEffect {
  return 'features' in effect && Array.isArray((effect as NestedFeatureEffect).features);
}
