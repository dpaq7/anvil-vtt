/**
 * Class Resource Configuration
 * Maps each hero class to their unique heroic resource
 */

import { type HeroClass } from '../types/hero.js';

export interface HeroicResourceConfig {
  name: string;           // Display name: "Ferocity", "Clarity", etc.
  abbreviation: string;   // Short form: "FER", "CLR", etc.
  color: string;          // CSS variable for theme color
  minValue: number;       // Minimum (usually 0, but Talent can go negative)
  characteristic?: string; // Associated characteristic for potency
}

export const CLASS_RESOURCE_CONFIG: Record<HeroClass, HeroicResourceConfig> = {
  fury: {
    name: 'Ferocity',
    abbreviation: 'FER',
    color: 'var(--color-fury, #ff5722)',
    minValue: 0,
    characteristic: 'might',
  },
  talent: {
    name: 'Clarity',
    abbreviation: 'CLR',
    color: 'var(--color-talent, #7c4dff)',
    minValue: -10, // Can go negative (Strained)
    characteristic: 'reason',
  },
  null: {
    name: 'Discipline',
    abbreviation: 'DIS',
    color: 'var(--color-null, #00bcd4)',
    minValue: 0,
    characteristic: 'intuition',
  },
  summoner: {
    name: 'Essence',
    abbreviation: 'ESS',
    color: 'var(--essence, #a87de8)',
    minValue: 0,
    characteristic: 'reason',
  },
  elementalist: {
    name: 'Essence',
    abbreviation: 'ESS',
    color: 'var(--essence, #a87de8)',
    minValue: 0,
    characteristic: 'reason',
  },
  censor: {
    name: 'Wrath',
    abbreviation: 'WRA',
    color: 'var(--color-censor, #ffc107)',
    minValue: 0,
    characteristic: 'presence',
  },
  conduit: {
    name: 'Piety',
    abbreviation: 'PIE',
    color: 'var(--color-conduit, #4caf50)',
    minValue: 0,
    characteristic: 'intuition',
  },
  tactician: {
    name: 'Focus',
    abbreviation: 'FOC',
    color: 'var(--color-tactician, #2196f3)',
    minValue: 0,
    characteristic: 'reason',
  },
  shadow: {
    name: 'Insight',
    abbreviation: 'INS',
    color: 'var(--color-shadow, #9c27b0)',
    minValue: 0,
    characteristic: 'agility',
  },
  troubadour: {
    name: 'Drama',
    abbreviation: 'DRA',
    color: 'var(--color-troubadour, #e91e63)',
    minValue: 0,
    characteristic: 'presence',
  },
};

export function getResourceConfig(heroClass: HeroClass): HeroicResourceConfig {
  return CLASS_RESOURCE_CONFIG[heroClass] ?? CLASS_RESOURCE_CONFIG.summoner;
}

export function getResourceName(heroClass: HeroClass): string {
  return getResourceConfig(heroClass).name;
}
