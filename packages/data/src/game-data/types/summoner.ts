/**
 * @deprecated Legacy Summoner types - Use types from './hero.ts.js' instead
 *
 * This file is kept for backward compatibility with stored character data.
 * New code should import from './hero.ts.js':
 * - SummonerHeroV2 (replaces SummonerHero)
 * - SummonerCircle, Formation, QuickCommand (now in hero.ts)
 * - Use 'subclass' field instead of 'circle' for consistency across all classes
 */

import { type Ancestry, type Career, type Culture, type Kit, type Item, type Characteristics, type ActiveCondition } from './common.js';
import { type Ability, type Feature } from './abilities.js';
import { type Portfolio, type Squad, type Fixture } from './minion.js';
import { type ProgressionChoices } from './progression.js';
import { type ActiveProject, type InventoryItem } from './projects.js';
import { type EquippedItem } from './equipment.js';

export type SummonerCircle = 'blight' | 'graves' | 'spring' | 'storms';

export type Formation = 'horde' | 'platoon' | 'elite' | 'leader';

export interface QuickCommand {
  id: string;
  name: string;
  description: string;
  formation: Formation; // Which formation grants this command
}

export interface StaminaPool {
  current: number;
  max: number;
  winded: number; // Half of max, rounded down
}

export interface RecoveryPool {
  current: number;
  max: number;
  value: number; // 1/3 of max stamina, rounded down
}

export interface EssencePool {
  current: number;
  maxPerTurn: number;
}

/** @deprecated Use SummonerHeroV2 from './hero.ts.js' instead */
export interface SummonerHero {
  id: string;
  name: string;
  level: number; // 1-10
  ancestry: Ancestry;
  culture: Culture;
  career: Career;

  // Summoner-specific
  circle: SummonerCircle; // 'blight' | 'graves' | 'spring' | 'storms'
  formation: Formation; // 'horde' | 'platoon' | 'elite' | 'leader'
  quickCommand: QuickCommand;

  // Core stats
  characteristics: Characteristics;

  // Combat stats (derived)
  stamina: StaminaPool;
  recoveries: RecoveryPool;
  speed: number;
  stability: number;

  // Resources
  essence: EssencePool;
  surges: number;
  heroTokens: number;
  victories: number; // Tracks current victories - converted to XP during respite
  xp: number; // Experience points - accumulated from victories during respite
  wealth: number; // Wealth tier (1-6+)
  gold: number; // Gold pieces (0-99999)
  renown: number; // Renown score (0-12)

  // Portfolio
  portfolio: Portfolio;

  // Active minions in play
  activeSquads: Squad[];
  fixture: Fixture | null;

  // Abilities & features
  abilities: Ability[];
  features: Feature[];

  // Skills (selected during character creation from culture and career)
  skills: string[]; // Array of skill IDs

  // Languages (all heroes know Caelian + selected languages from career)
  languages: string[]; // Array of language IDs

  // Inventory & misc
  kit: Kit;
  items: Item[];
  notes: string;
  portraitUrl: string | null; // Character portrait image (base64)
  minionPortraits: Record<string, string | null>; // Minion ID -> portrait image (base64)
  fixturePortrait: string | null; // Fixture portrait image (base64)
  inactiveMinions: string[]; // IDs of signature minions that are inactive/not available for summoning

  // Active conditions affecting the hero
  activeConditions: ActiveCondition[];

  // Level-up choices made during progression
  progressionChoices: ProgressionChoices;

  // Projects & Inventory tracking
  activeProjects: ActiveProject[];
  inventory: InventoryItem[];

  // Equipped magic items
  equippedItems: EquippedItem[];
}

// Circle to Portfolio mapping
export const circleToPortfolio: Record<SummonerCircle, 'demon' | 'elemental' | 'fey' | 'undead'> = {
  blight: 'demon',
  graves: 'undead',
  spring: 'fey',
  storms: 'elemental',
};
