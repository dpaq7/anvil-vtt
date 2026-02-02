// Minion, Portfolio, and Squad types

import { type Characteristics, type Condition, type GridPosition, type Size, type Immunity, type Weakness } from './common.js';
import { type Ability, type MinionTrait, type FixtureTrait, type Feature } from './abilities.js';

export type PortfolioType = 'demon' | 'elemental' | 'fey' | 'undead';

export type MinionRole =
  | 'artillery'
  | 'ambusher'
  | 'brute'
  | 'controller'
  | 'defender'
  | 'harrier'
  | 'hexer'
  | 'support';

export interface MinionTemplate {
  id: string;
  name: string;
  essenceCost: number; // 1, 3, 5, 7, or 9
  minionsPerSummon: number; // How many appear per Call Forth

  // Minion stats
  size: Size;
  speed: number;
  stamina: number | number[]; // Single value or array for multiple minions
  stability: number;
  freeStrike: number;

  // Characteristics
  characteristics: Characteristics;

  // Combat info
  role: MinionRole;
  keywords: string[]; // 'Abyssal', 'Demon', 'Fey', 'Elemental', 'Undead', etc.
  immunities: Immunity[];
  weaknesses: Weakness[];
  movementModes: string[]; // 'Fly', 'Hover', 'Climb', 'Swim', 'Burrow', 'Teleport'
  freeStrikeDamageType: string;

  // Abilities & traits
  traits: MinionTrait[];
  signatureAbility?: Ability; // For minions with signature strikes
}

export interface Minion {
  id: string;
  templateId: string;
  isAlive: boolean; // SRD: Minions die when pool damage equals their max HP
  maxStamina: number; // Individual minion's max HP (for death threshold calculation)
  conditions: Condition[];
  position?: GridPosition; // Optional for tactical tracking

  // Action tracking for sacrifice restrictions
  // SRD: Can't sacrifice minions that used main action or maneuver this turn
  hasActedThisTurn?: boolean;
  hasMovedThisTurn?: boolean;
}

export interface Squad {
  id: string;
  templateId: string; // Reference to MinionTemplate
  members: Minion[];

  // SRD: Squad shares a single Stamina pool
  currentStamina: number;
  maxStamina: number;

  // Squad-level state
  hasMoved: boolean;
  hasActed: boolean;
}

export interface FixtureTemplate {
  id: string;
  name: string;
  portfolioType: PortfolioType;
  role: string; // 'Relic Artillery', 'Hazard Support', 'Hazard Ambusher', 'Fortification Defender'
  flavorText?: string; // Optional flavor text from SRD

  baseStamina: number; // 20 (actual stamina = 20 + level)
  size: number; // Base size 2, becomes 3 at level 9

  // Fixture traits (always active when summoned)
  traits: FixtureTrait[];

  // Level advancement features
  level5Feature: Feature;
  // Level 9 always includes Size Increase + unique ability
  level9Features: Feature[];
}

export interface Fixture {
  templateId: string;
  currentStamina: number;
  position?: GridPosition;
  isActive: boolean;
}

/**
 * Champion Template - Portfolio-specific champion (Level 8+ feature)
 * Summoner v1.0 SRD:
 * - Only 1 champion instance at a time
 * - Does NOT count toward 2-squad limit
 * - Different stamina rules (can regain, can gain temp)
 * - Uses summoner's recoveries
 * - Can take Heal and Defend actions
 * - Must earn a Victory to resummon after death
 */
export interface ChampionTemplate {
  id: string;
  name: string;
  portfolioType: PortfolioType;
  description: string;

  // Champion stats (similar to MinionTemplate but standalone)
  size: Size;
  speed: number;
  stamina: number;
  stability: number;
  freeStrike: number;

  // Characteristics
  characteristics: Characteristics;

  // Combat info
  role: MinionRole;
  keywords: string[]; // Should include 'Champion'
  immunities: Immunity[];
  weaknesses: Weakness[];
  movementModes: string[];
  freeStrikeDamageType: string;

  // Abilities & traits
  traits: MinionTrait[];
  signatureAbility?: Ability;

  // Essence cost to summon
  essenceCost: number; // Typically 9
}

/**
 * Active Champion instance
 * Unlike regular minions, champions:
 * - Track their own stamina (not pooled)
 * - Can regain stamina and gain temporary stamina
 * - Have their own action economy
 */
export interface Champion {
  templateId: string;
  isAlive: boolean;

  // Stamina tracking (different from minion squads)
  currentStamina: number;
  maxStamina: number;
  temporaryStamina: number;

  // Conditions
  conditions: Condition[];
  position?: GridPosition;

  // Action tracking
  hasMoved: boolean;
  hasActed: boolean;
  hasUsedManeuver: boolean;
}

export interface Portfolio {
  type: PortfolioType;
  signatureMinions: MinionTemplate[]; // 2 chosen at creation, 1 essence each
  unlockedMinions: MinionTemplate[]; // 3-essence, 5-essence, 7-essence, 9-essence tiers
  fixture: FixtureTemplate; // Portfolio-specific fixture
  champion: ChampionTemplate | null; // Level 8+ feature
}

// Squad operations interface
export interface SquadActions {
  moveSquad(squadId: string, destination: GridPosition): void;
  squadFreeStrike(squadId: string, targetId: string): void;
  squadSignatureAbility(squadId: string, targetId: string): void;
  addMinionToSquad(squadId: string, minion: Minion): void;
  removeMinionFromSquad(squadId: string, minionId: string): void;
  mergeSquads(sourceSquadId: string, targetSquadId: string): void;
}
