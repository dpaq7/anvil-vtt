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

const CAREER_SKILL_GROUP_NAMES = new Set(['crafting', 'exploration', 'interpersonal', 'intrigue', 'lore']);

export function isCareerSkillChoice(skillName: string): boolean {
  return skillName.includes('/') || CAREER_SKILL_GROUP_NAMES.has(skillName.toLowerCase());
}

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
 * A single choice made during level-up.
 */
export interface LevelUpChoice {
  featureId: string;
  choiceId: string;
  category?: string;
}

/**
 * Character in progress during wizard steps.
 * Contains nullable fields as selections are made step by step.
 */
export interface CharacterInProgress {
  // Step 0: Level Selection (1-10)
  level: number;

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
  // Skills selected from culture sources (environment, organization, upbringing)
  cultureSkills?: {
    environment?: string;
    organization?: string;
    upbringing?: string;
  };
  // Skills selected from career choice options (e.g., "Crafting/Exploration")
  careerSkillChoices?: string[];

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

  // Level-up choices (for levels 2-10)
  levelUpChoices: Record<number, LevelUpChoice[]>;
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

/**
 * Status of a wizard step.
 */
export type StepStatus = 'complete' | 'incomplete' | 'not-begun';

/**
 * Definition of a wizard step.
 */
export interface WizardStepDefinition {
  id: string;
  label: string;
  required: boolean;
  /** For level-up steps, the level number (2-10) */
  levelUpLevel?: number;
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

  const level = character.level || 1;
  const echelon = HeroLogic.getEchelon(level);

  // Get ancestry data for speed and size
  const ancestry = character.ancestry
    ? GameData.getAncestry(character.ancestry)
    : null;

  // Get kit data for bonuses
  const kit = character.kit
    ? GameData.getKit(character.kit)
    : null;

  // Calculate base stamina from class at character's level
  const baseStamina = HeroLogic.getMaxStaminaForClass(character.heroClass, level);

  // Add kit stamina bonus (kit stamina is per echelon)
  const kitStaminaBonus = (kit?.staminaPerEchelon ?? 0) * echelon;

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
        // Fixed named skills are granted; groups and slash-separated entries are player choices.
        if (!isCareerSkillChoice(skillName)) {
          skills.push({
            id: skillName.toLowerCase().replace(/\s+/g, '-'),
            name: skillName,
            source: `Career: ${career.name}`,
          });
        }
      }
    }
  }

  // From Class - some classes grant fixed starting skills
  if (character.heroClass) {
    const classDef = GameData.getClass(character.heroClass);
    if (classDef) {
      for (const skillName of classDef.fixedSkills) {
        skills.push({
          id: skillName.toLowerCase().replace(/\s+/g, '-'),
          name: skillName,
          source: `Class: ${classDef.name}`,
        });
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
  // 1 skill from each culture source: environment, organization, upbringing
  let selections = 0;
  if (character.culture.environment) selections++;
  if (character.culture.organization) selections++;
  if (character.culture.upbringing) selections++;

  if (character.career) {
    const career = GameData.getCareer(character.career);
    if (career) {
      const choiceSkills = career.skills.filter(isCareerSkillChoice);
      selections += choiceSkills.length;
    }
  }

  return selections;
}

/**
 * Count required player-made skill selections already chosen.
 *
 * @param character - The character in progress
 * @returns Number of culture/career choice selections made
 */
export function getSkillSelectionsMade(character: CharacterInProgress): number {
  let selections = 0;
  if (character.cultureSkills?.environment) selections++;
  if (character.cultureSkills?.organization) selections++;
  if (character.cultureSkills?.upbringing) selections++;

  if (character.career) {
    const career = GameData.getCareer(character.career);
    const choiceCount = career?.skills.filter(isCareerSkillChoice).length ?? 0;
    for (let i = 0; i < choiceCount; i++) {
      if (character.careerSkillChoices?.[i]) selections++;
    }
  }

  return selections;
}

/**
 * Resolve the final unique skill names to persist on the hero.
 * Includes automatic grants and player-selected culture/career choices.
 *
 * @param character - The character in progress
 * @returns Unique skill names in stable display order
 */
export function getSelectedSkillNames(character: CharacterInProgress): string[] {
  const names: string[] = [];
  const push = (skillName: string | null | undefined) => {
    if (skillName && !names.includes(skillName)) {
      names.push(skillName);
    }
  };

  for (const granted of calculateGrantedItems(character).skills) {
    push(granted.name);
  }

  push(character.cultureSkills?.environment);
  push(character.cultureSkills?.organization);
  push(character.cultureSkills?.upbringing);

  for (const choice of character.careerSkillChoices ?? []) {
    push(choice);
  }

  return names;
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
 * Wizard step IDs for the new breadcrumb-based wizard.
 */
export const WIZARD_STEP_IDS = {
  LEVEL: 'level',
  ANCESTRY: 'ancestry',
  CULTURE: 'culture',
  CAREER: 'career',
  CLASS: 'class',
  SUBCLASS: 'subclass',
  COMPLICATION: 'complication',
  CHARACTERISTICS: 'characteristics',
  KIT: 'kit',
  SKILLS: 'skills',
  LANGUAGES: 'languages',
  PERKS: 'perks',
  TITLES: 'titles',
  ABILITIES: 'abilities',
  PERSONAL: 'personal',
  REVIEW: 'review',
} as const;

/**
 * Base wizard steps (before level-up steps are added).
 */
export const BASE_WIZARD_STEPS: WizardStepDefinition[] = [
  { id: WIZARD_STEP_IDS.LEVEL, label: 'Level', required: true },
  { id: WIZARD_STEP_IDS.ANCESTRY, label: 'Ancestry', required: true },
  { id: WIZARD_STEP_IDS.CULTURE, label: 'Culture', required: true },
  { id: WIZARD_STEP_IDS.CAREER, label: 'Career', required: true },
  { id: WIZARD_STEP_IDS.CLASS, label: 'Class', required: true },
  { id: WIZARD_STEP_IDS.SUBCLASS, label: 'Subclass', required: true },
  { id: WIZARD_STEP_IDS.COMPLICATION, label: 'Complication', required: false },
  { id: WIZARD_STEP_IDS.CHARACTERISTICS, label: 'Characteristics', required: true },
  { id: WIZARD_STEP_IDS.KIT, label: 'Kit', required: true },
  { id: WIZARD_STEP_IDS.SKILLS, label: 'Skills', required: true },
  { id: WIZARD_STEP_IDS.LANGUAGES, label: 'Languages', required: true },
  { id: WIZARD_STEP_IDS.PERKS, label: 'Perks', required: false },
  { id: WIZARD_STEP_IDS.TITLES, label: 'Titles', required: false },
  { id: WIZARD_STEP_IDS.ABILITIES, label: 'Abilities', required: false },
  { id: WIZARD_STEP_IDS.PERSONAL, label: 'Personal', required: true },
];

/**
 * Generate wizard steps based on selected level.
 * For level > 1, adds level-up steps (L2, L3, ...) after the base steps.
 *
 * @param level - The character's level (1-10)
 * @returns Array of step definitions including level-up steps
 */
export function generateWizardSteps(level: number): WizardStepDefinition[] {
  const steps = [...BASE_WIZARD_STEPS];

  // Add level-up steps for levels 2 and above
  for (let lvl = 2; lvl <= level; lvl++) {
    steps.push({
      id: `level-${lvl}`,
      label: `L${lvl}`,
      required: true,
      levelUpLevel: lvl,
    });
  }

  // Always end with Review
  steps.push({ id: WIZARD_STEP_IDS.REVIEW, label: 'Review', required: false });

  return steps;
}

/**
 * Get the step status based on character state.
 *
 * @param character - The character in progress
 * @param stepId - The step ID to check
 * @returns Step status: 'complete', 'incomplete', or 'not-begun'
 */
export function getStepStatus(
  character: CharacterInProgress,
  stepId: string
): StepStatus {
  // Handle level-up steps
  if (stepId.startsWith('level-')) {
    const lvl = parseInt(stepId.replace('level-', ''), 10);
    const choices = character.levelUpChoices[lvl] || [];
    // Consider complete if at least one choice was made (simplified; can be enhanced)
    if (choices.length > 0) return 'complete';
    // Check if previous steps have started
    if (character.heroClass) return 'incomplete';
    return 'not-begun';
  }

  switch (stepId) {
    case WIZARD_STEP_IDS.LEVEL:
      return character.level >= 1 ? 'complete' : 'incomplete';

    case WIZARD_STEP_IDS.ANCESTRY:
      if (character.ancestry) return 'complete';
      if (character.level >= 1) return 'incomplete';
      return 'not-begun';

    case WIZARD_STEP_IDS.CULTURE:
      if (
        character.culture.environment &&
        character.culture.organization &&
        character.culture.upbringing
      ) {
        return 'complete';
      }
      if (character.ancestry) return 'incomplete';
      return 'not-begun';

    case WIZARD_STEP_IDS.CAREER:
      if (character.career) return 'complete';
      if (character.culture.environment) return 'incomplete';
      return 'not-begun';

    case WIZARD_STEP_IDS.CLASS:
      if (character.heroClass) return 'complete';
      if (character.career) return 'incomplete';
      return 'not-begun';

    case WIZARD_STEP_IDS.SUBCLASS:
      if (character.subclass) {
        if (character.heroClass) {
          const selectCount = GameData.getSubclassSelectCount(character.heroClass);
          const selectedCount = Array.isArray(character.subclass)
            ? character.subclass.length
            : 1;
          if (selectedCount >= selectCount) return 'complete';
        }
        return 'incomplete';
      }
      if (character.heroClass) return 'incomplete';
      return 'not-begun';

    case WIZARD_STEP_IDS.COMPLICATION:
      // Optional step - complete if visited or has content
      if (character.complication) return 'complete';
      if (character.subclass) return 'incomplete';
      return 'not-begun';

    case WIZARD_STEP_IDS.CHARACTERISTICS:
      if (character.characteristics) {
        const total = HeroLogic.getTotalCharacteristics(character.characteristics);
        if (total === 2) return 'complete';
        return 'incomplete';
      }
      if (character.subclass) return 'incomplete';
      return 'not-begun';

    case WIZARD_STEP_IDS.KIT:
      if (character.kit) return 'complete';
      if (character.characteristics) return 'incomplete';
      return 'not-begun';

    case WIZARD_STEP_IDS.SKILLS:
      const skillsNeeded = getSkillSelectionsNeeded(character);
      if (getSkillSelectionsMade(character) >= skillsNeeded) return 'complete';
      if (character.kit) return 'incomplete';
      return 'not-begun';

    case WIZARD_STEP_IDS.LANGUAGES:
      const langsNeeded = getLanguageSelectionsNeeded(character);
      if (character.selectedLanguages.length >= langsNeeded) return 'complete';
      if (character.selectedSkills.length > 0) return 'incomplete';
      return 'not-begun';

    case WIZARD_STEP_IDS.PERKS:
      // Optional step
      if (character.selectedPerks.length > 0) return 'complete';
      if (character.selectedLanguages.length > 0) return 'incomplete';
      return 'not-begun';

    case WIZARD_STEP_IDS.TITLES:
      // Optional step
      if (character.selectedTitles.length > 0) return 'complete';
      if (character.selectedLanguages.length > 0) return 'incomplete';
      return 'not-begun';

    case WIZARD_STEP_IDS.ABILITIES:
      // Optional step
      if (character.selectedAbilities.length > 0) return 'complete';
      if (character.selectedLanguages.length > 0) return 'incomplete';
      return 'not-begun';

    case WIZARD_STEP_IDS.PERSONAL:
      if (character.name.trim()) return 'complete';
      if (character.selectedLanguages.length > 0) return 'incomplete';
      return 'not-begun';

    case WIZARD_STEP_IDS.REVIEW:
      // Review is complete if character is complete
      return isCharacterComplete(character) ? 'complete' : 'incomplete';

    default:
      return 'not-begun';
  }
}

/**
 * Legacy wizard step numbers for reference.
 * @deprecated Use WIZARD_STEP_IDS and generateWizardSteps for the new wizard.
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
      const skillsMade = getSkillSelectionsMade(character);
      if (skillsMade < skillsNeeded) {
        errors.push(`Select ${skillsNeeded} skills (have ${skillsMade})`);
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
    level: 1,
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
    cultureSkills: {},
    careerSkillChoices: [],
    selectedLanguages: [],
    selectedPerks: [],
    selectedTitles: [],
    selectedAbilities: [],
    name: '',
    pronouns: '',
    backstory: '',
    appearance: '',
    portraitUrl: null,
    levelUpChoices: {},
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
