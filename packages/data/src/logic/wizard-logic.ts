/**
 * Wizard Logic
 *
 * Pure functions for character creation wizard calculations.
 * Works with CharacterInProgress (partial hero state during creation).
 *
 * Reference: Character Creation rules from rules-md/
 */

import { GameData } from '../game-data/index.js';
import * as HeroLogic from './hero-logic.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Culture selection during character creation.
 */
export interface CultureSelection {
  environment: string | null;
  organization: string | null;
  upbringing: string | null;
}

/**
 * Complication selection during character creation.
 */
export interface Complication {
  id: string;
  name: string;
  description?: string;
}

/**
 * Title selection during character creation.
 */
export interface Title {
  id: string;
  name: string;
  description?: string;
  effect?: string;
}

/**
 * Character in progress during wizard steps.
 * Contains nullable fields as selections are made step by step.
 */
export interface CharacterInProgress {
  // Step 1: Ancestry
  ancestry: string | null;
  ancestryTraits: string[];

  // Step 2: Culture
  culture: CultureSelection;

  // Step 3: Career
  career: string | null;
  incitingIncident: string | null;

  // Step 4: Class
  heroClass: HeroLogic.HeroClass | null;

  // Step 5: Subclass
  subclass: string | string[] | null;

  // Step 6: Complications
  complication: Complication | null;

  // Step 7: Characteristics
  characteristics: HeroLogic.Characteristics | null;

  // Step 8: Kit
  kit: string | null;

  // Step 9: Skills
  selectedSkills: string[];

  // Step 10: Languages
  selectedLanguages: string[];

  // Step 11: Perks
  selectedPerks: string[];

  // Step 12: Titles
  selectedTitles: Title[];

  // Step 13: Abilities
  selectedAbilities: string[];

  // Step 14: Personal Details
  name: string;
  pronouns: string;
  backstory: string;
  appearance: string;
  portraitUrl: string | null;
}

/**
 * Derived stats calculated from character choices.
 */
export interface DerivedStats {
  stamina: number;
  speed: number;
  stability: number;
  size: string;
  recoveries: number;
}

/**
 * Granted item from a source (ancestry, career, etc.).
 */
export interface GrantedItem {
  id: string;
  name: string;
  source: string;
}

/**
 * All granted items from character selections.
 */
export interface GrantedItems {
  skills: GrantedItem[];
  languages: GrantedItem[];
}

/**
 * Validation result for a wizard step.
 */
export interface StepValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// ---------------------------------------------------------------------------
// Derived Stats Calculation
// ---------------------------------------------------------------------------

/**
 * Default derived stats when required selections are missing.
 */
const DEFAULT_DERIVED_STATS: DerivedStats = {
  stamina: 18,
  speed: 5,
  stability: 0,
  size: '1M',
  recoveries: 8,
};

/**
 * Calculate derived stats from character choices.
 * Returns default values if required choices haven't been made.
 *
 * @param character - The character in progress
 * @returns Derived combat stats
 */
export function calculateDerivedStats(character: CharacterInProgress): DerivedStats {
  // Need heroClass to calculate stamina
  if (!character.heroClass) {
    return { ...DEFAULT_DERIVED_STATS };
  }

  // Get ancestry data for speed and size
  const ancestry = character.ancestry
    ? GameData.getAncestry(character.ancestry)
    : null;

  // Get kit data for bonuses
  const kit = character.kit
    ? GameData.getKit(character.kit)
    : null;

  // Calculate base stamina from class (level 1)
  const baseStamina = HeroLogic.getMaxStaminaForClass(character.heroClass, 1);

  // Add kit stamina bonus (kit stamina is per echelon, level 1 is echelon 1 = 1x)
  const kitStaminaBonus = kit?.staminaPerEchelon ?? 0;

  // Get recoveries from class
  const recoveries = HeroLogic.getMaxRecoveries(character.heroClass);

  // Calculate speed: ancestry base + kit bonus
  const baseSpeed = ancestry?.speed ?? 5;
  const speedBonus = kit?.speedBonus ?? 0;

  // Get stability from kit
  const stability = kit?.stabilityBonus ?? 0;

  // Get size from ancestry
  const size = ancestry?.size ?? '1M';

  return {
    stamina: baseStamina + kitStaminaBonus,
    speed: baseSpeed + speedBonus,
    stability,
    size,
    recoveries,
  };
}

/**
 * Check if derived stats can be calculated (has required selections).
 *
 * @param character - The character in progress
 * @returns True if required selections are made
 */
export function canCalculateDerivedStats(character: CharacterInProgress): boolean {
  return character.heroClass !== null;
}

// ---------------------------------------------------------------------------
// Granted Items Calculation
// ---------------------------------------------------------------------------

/**
 * Calculate skills and languages granted by character selections.
 *
 * @param character - The character in progress
 * @returns Granted skills and languages
 */
export function calculateGrantedItems(character: CharacterInProgress): GrantedItems {
  const skills: GrantedItem[] = [];
  const languages: GrantedItem[] = [];

  // Default language - all heroes know Caelian
  languages.push({
    id: 'caelian',
    name: 'Caelian',
    source: 'Default',
  });

  // From Career - careers grant specific skills
  if (character.career) {
    const career = GameData.getCareer(character.career);
    if (career) {
      for (const skillName of career.skills) {
        // Handle skill options (e.g., "Crafting/Exploration") - these are choices
        if (!skillName.includes('/')) {
          skills.push({
            id: skillName.toLowerCase().replace(/\s+/g, '-'),
            name: skillName,
            source: `Career: ${career.name}`,
          });
        }
      }
    }
  }

  // Remove duplicates by id
  const uniqueSkills = skills.filter(
    (skill, index, self) => index === self.findIndex((s) => s.id === skill.id)
  );

  const uniqueLanguages = languages.filter(
    (lang, index, self) => index === self.findIndex((l) => l.id === lang.id)
  );

  return {
    skills: uniqueSkills,
    languages: uniqueLanguages,
  };
}

/**
 * Calculate number of additional skill selections needed.
 *
 * @param character - The character in progress
 * @returns Number of skill selections required
 */
export function getSkillSelectionsNeeded(character: CharacterInProgress): number {
  // Base: 2 skills from culture (1 from each of 2 skill groups)
  let selections = 2;

  if (character.career) {
    const career = GameData.getCareer(character.career);
    if (career) {
      // Count skills with "/" which are choices
      const choiceSkills = career.skills.filter((s) => s.includes('/'));
      selections += choiceSkills.length;
    }
  }

  return selections;
}

/**
 * Calculate number of additional language selections needed.
 *
 * @param character - The character in progress
 * @returns Number of language selections required
 */
export function getLanguageSelectionsNeeded(character: CharacterInProgress): number {
  let selections = 0;

  if (character.career) {
    const career = GameData.getCareer(character.career);
    if (career?.languages) {
      for (const langGrant of career.languages) {
        // Parse "1 Language" or "2 Languages"
        const match = langGrant.match(/^(\d+)\s+Languages?$/i);
        if (match && match[1]) {
          selections += parseInt(match[1], 10);
        }
      }
    }
  }

  return selections;
}

// ---------------------------------------------------------------------------
// Step Validation
// ---------------------------------------------------------------------------

/**
 * Wizard step numbers for reference.
 */
export const WIZARD_STEPS = {
  ANCESTRY: 1,
  CULTURE: 2,
  CAREER: 3,
  CLASS: 4,
  SUBCLASS: 5,
  COMPLICATIONS: 6,
  CHARACTERISTICS: 7,
  KIT: 8,
  SKILLS: 9,
  LANGUAGES: 10,
  PERKS: 11,
  TITLES: 12,
  ABILITIES: 13,
  PERSONAL: 14,
  REVIEW: 15,
} as const;

/**
 * Validate a specific wizard step.
 *
 * @param character - The character in progress
 * @param step - The step number to validate
 * @returns Validation result
 */
export function validateStep(
  character: CharacterInProgress,
  step: number
): StepValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  switch (step) {
    case WIZARD_STEPS.ANCESTRY:
      if (!character.ancestry) {
        errors.push('Ancestry is required');
      }
      break;

    case WIZARD_STEPS.CULTURE:
      if (!character.culture.environment) {
        errors.push('Environment is required');
      }
      if (!character.culture.organization) {
        errors.push('Organization is required');
      }
      if (!character.culture.upbringing) {
        errors.push('Upbringing is required');
      }
      break;

    case WIZARD_STEPS.CAREER:
      if (!character.career) {
        errors.push('Career is required');
      }
      break;

    case WIZARD_STEPS.CLASS:
      if (!character.heroClass) {
        errors.push('Class is required');
      }
      break;

    case WIZARD_STEPS.SUBCLASS:
      if (!character.subclass) {
        errors.push('Subclass is required');
      } else if (character.heroClass) {
        const selectCount = GameData.getSubclassSelectCount(character.heroClass);
        const selectedCount = Array.isArray(character.subclass)
          ? character.subclass.length
          : 1;
        if (selectedCount < selectCount) {
          errors.push(`Select ${selectCount} subclass(es)`);
        }
      }
      break;

    case WIZARD_STEPS.CHARACTERISTICS:
      if (!character.characteristics) {
        errors.push('Characteristics are required');
      } else {
        const total = HeroLogic.getTotalCharacteristics(character.characteristics);
        // Standard point total is 2 (arrays sum to 2)
        if (total !== 2) {
          warnings.push(`Characteristics total ${total}, expected 2`);
        }
      }
      break;

    case WIZARD_STEPS.KIT:
      if (!character.kit) {
        errors.push('Kit is required');
      }
      break;

    case WIZARD_STEPS.SKILLS:
      const skillsNeeded = getSkillSelectionsNeeded(character);
      if (character.selectedSkills.length < skillsNeeded) {
        errors.push(`Select ${skillsNeeded} skills (have ${character.selectedSkills.length})`);
      }
      break;

    case WIZARD_STEPS.LANGUAGES:
      const langsNeeded = getLanguageSelectionsNeeded(character);
      if (character.selectedLanguages.length < langsNeeded) {
        errors.push(`Select ${langsNeeded} languages (have ${character.selectedLanguages.length})`);
      }
      break;

    case WIZARD_STEPS.PERSONAL:
      if (!character.name.trim()) {
        errors.push('Name is required');
      }
      break;

    // Optional steps don't fail validation
    case WIZARD_STEPS.COMPLICATIONS:
    case WIZARD_STEPS.PERKS:
    case WIZARD_STEPS.TITLES:
    case WIZARD_STEPS.ABILITIES:
    case WIZARD_STEPS.REVIEW:
      // These steps are optional or just review
      break;
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Check if a step is complete (valid).
 *
 * @param character - The character in progress
 * @param step - The step number
 * @returns True if step is complete
 */
export function isStepComplete(character: CharacterInProgress, step: number): boolean {
  return validateStep(character, step).valid;
}

/**
 * Check if all required steps are complete.
 *
 * @param character - The character in progress
 * @returns True if character is ready to be created
 */
export function isCharacterComplete(character: CharacterInProgress): boolean {
  const requiredSteps = [
    WIZARD_STEPS.ANCESTRY,
    WIZARD_STEPS.CULTURE,
    WIZARD_STEPS.CAREER,
    WIZARD_STEPS.CLASS,
    WIZARD_STEPS.SUBCLASS,
    WIZARD_STEPS.CHARACTERISTICS,
    WIZARD_STEPS.KIT,
    WIZARD_STEPS.SKILLS,
    WIZARD_STEPS.LANGUAGES,
    WIZARD_STEPS.PERSONAL,
  ];

  return requiredSteps.every((step) => isStepComplete(character, step));
}

/**
 * Get the first incomplete required step.
 *
 * @param character - The character in progress
 * @returns Step number of first incomplete step, or null if all complete
 */
export function getFirstIncompleteStep(character: CharacterInProgress): number | null {
  const requiredSteps = [
    WIZARD_STEPS.ANCESTRY,
    WIZARD_STEPS.CULTURE,
    WIZARD_STEPS.CAREER,
    WIZARD_STEPS.CLASS,
    WIZARD_STEPS.SUBCLASS,
    WIZARD_STEPS.CHARACTERISTICS,
    WIZARD_STEPS.KIT,
    WIZARD_STEPS.SKILLS,
    WIZARD_STEPS.LANGUAGES,
    WIZARD_STEPS.PERSONAL,
  ];

  for (const step of requiredSteps) {
    if (!isStepComplete(character, step)) {
      return step;
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Character Factory
// ---------------------------------------------------------------------------

/**
 * Create a new empty CharacterInProgress.
 *
 * @returns Fresh character in progress
 */
export function createEmptyCharacter(): CharacterInProgress {
  return {
    ancestry: null,
    ancestryTraits: [],
    culture: {
      environment: null,
      organization: null,
      upbringing: null,
    },
    career: null,
    incitingIncident: null,
    heroClass: null,
    subclass: null,
    complication: null,
    characteristics: null,
    kit: null,
    selectedSkills: [],
    selectedLanguages: [],
    selectedPerks: [],
    selectedTitles: [],
    selectedAbilities: [],
    name: '',
    pronouns: '',
    backstory: '',
    appearance: '',
    portraitUrl: null,
  };
}

/**
 * Create default characteristics (all zeros).
 *
 * @returns Default characteristics
 */
export function createDefaultCharacteristics(): HeroLogic.Characteristics {
  return {
    might: 0,
    agility: 0,
    reason: 0,
    intuition: 0,
    presence: 0,
  };
}

// ---------------------------------------------------------------------------
// Progress Calculation
// ---------------------------------------------------------------------------

/**
 * Calculate wizard progress percentage.
 *
 * @param character - The character in progress
 * @returns Progress percentage (0-100)
 */
export function getWizardProgress(character: CharacterInProgress): number {
  const requiredSteps = [
    WIZARD_STEPS.ANCESTRY,
    WIZARD_STEPS.CULTURE,
    WIZARD_STEPS.CAREER,
    WIZARD_STEPS.CLASS,
    WIZARD_STEPS.SUBCLASS,
    WIZARD_STEPS.CHARACTERISTICS,
    WIZARD_STEPS.KIT,
    WIZARD_STEPS.SKILLS,
    WIZARD_STEPS.LANGUAGES,
    WIZARD_STEPS.PERSONAL,
  ];

  const completedCount = requiredSteps.filter((step) =>
    isStepComplete(character, step)
  ).length;

  return Math.round((completedCount / requiredSteps.length) * 100);
}
