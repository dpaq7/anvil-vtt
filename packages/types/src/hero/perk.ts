/**
 * Perk type definitions for Draw Steel TTRPG
 * Perks are special abilities gained at specific levels
 */

/**
 * The 6 perk categories in Draw Steel
 */
export type PerkCategory =
  | 'crafting'
  | 'exploration'
  | 'interpersonal'
  | 'intrigue'
  | 'lore'
  | 'supernatural';

/**
 * Individual perk definition
 */
export interface Perk {
  id: string;
  name: string;
  category: PerkCategory;
  description: string;
  /** Optional prerequisite (skill, level, or other perk) */
  prerequisite?: string;
  /** Source reference (e.g., "Chapter 7: Perks") */
  source?: string;
}

/**
 * Class-specific perk category restrictions by level
 * - 'any' means all 6 categories are available
 * - Array of categories means only those are available
 */
export type PerkRestriction = 'any' | PerkCategory[];

/**
 * Configuration for which levels grant perks and their restrictions
 */
export interface ClassPerkProgression {
  /** Levels at which this class gains perk choices */
  perkLevels: number[];
  /** Per-level restrictions (keyed by level number) */
  restrictions: Record<number, PerkRestriction>;
}

/**
 * A selected perk stored on the hero
 */
export interface SelectedPerk {
  perkId: string;
  /** Level at which this perk was selected */
  selectedAtLevel: number;
  /** Source of the perk grant (class, career, ancestry, etc.) */
  source: 'class' | 'career' | 'ancestry' | 'other';
}
