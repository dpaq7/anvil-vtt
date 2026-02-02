/**
 * Theme Type Definitions
 * Class-based and special themes for the character manager
 */

import type { HeroClass } from './hero.js';

// Theme IDs for class-based themes
export type ClassThemeId =
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

// Special themes
export type SpecialThemeId = 'mcdm';

// All theme IDs
export type ThemeId = ClassThemeId | SpecialThemeId;

export interface ThemeDefinition {
  id: ThemeId;
  name: string; // Display name (class name or "MCDM")
  description: string;
  previewColors: {
    bg: string;
    primary: string;
    secondary: string;
  };
  cssVariables: Record<string, string>;
  defaultForClass?: HeroClass; // Which class this is default for
  isCreatorTheme?: boolean; // True only for MCDM theme
}

export interface ThemeContextType {
  currentTheme: ThemeId;
  setTheme: (themeId: ThemeId) => void;
  themes: ThemeDefinition[];
  applyThemeForHero: (heroId: string, heroClass: HeroClass) => void;
  applyCreatorTheme: () => void;
}
