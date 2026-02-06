/**
 * Condition Effect Syntax Parser
 * Parses Draw Steel tier effect strings to extract condition applications
 *
 * Syntax examples:
 * - "M < WEAK, slowed (save ends)"
 * - "9 + M damage; I < STRONG, dazed (save ends)"
 * - "P < 2 frightened (EoT)"
 * - "bleeding (save ends), or if M < STRONG, restrained (save ends)"
 */

import { type Characteristic, type ConditionId, type ConditionEndType } from '../types/common.js';

// Characteristic abbreviation mapping
const CHARACTERISTIC_MAP: Record<string, Characteristic> = {
  M: 'might',
  A: 'agility',
  R: 'reason',
  I: 'intuition',
  P: 'presence',
};

// Potency keywords used in hero abilities
export type PotencyKeyword = 'WEAK' | 'AVERAGE' | 'STRONG';

// Potency threshold type (can be keyword or numeric)
export type PotencyThreshold = PotencyKeyword | number;

// Condition end type in Draw Steel syntax
export type DrawSteelEndType = 'save_ends' | 'end_of_turn' | 'end_of_encounter' | 'manual';

// Parsed condition from tier effect string
export interface ParsedCondition {
  characteristic: Characteristic;
  operator: '<';
  threshold: PotencyThreshold;
  conditionName: string;
  endType: DrawSteelEndType;
  fullText: string; // Original text for complex conditions
}

// Result of parsing a tier effect string
export interface TierEffectParseResult {
  baseDamage?: string; // e.g., "9 + M damage"
  conditions: ParsedCondition[];
  additionalEffects: string[];
  hasConditional: boolean; // true if "or if" pattern found
  rawText: string;
}

// Known condition names in Draw Steel
const KNOWN_CONDITIONS: string[] = [
  'bleeding',
  'burning',
  'charmed',
  'dazed',
  'frightened',
  'grabbed',
  'invisible',
  'petrified',
  'prone',
  'restrained',
  'slowed',
  'taunted',
  'weakened',
  // Extended conditions
  'hexed',
  'illuminated',
  'banished',
  'stitched',
];

/**
 * Parse the end type from a condition string
 */
export function parseEndType(text: string): DrawSteelEndType {
  if (text.includes('(save ends)')) return 'save_ends';
  if (text.includes('(EoT)')) return 'end_of_turn';
  if (text.includes('until end of encounter') || text.includes('(until end of encounter)')) {
    return 'end_of_encounter';
  }
  return 'manual';
}

/**
 * Convert Draw Steel end type to Mettle ConditionEndType
 */
export function toMettleEndType(endType: DrawSteelEndType): ConditionEndType {
  switch (endType) {
    case 'save_ends':
      return 'roll';
    case 'end_of_turn':
      return 'eot';
    case 'end_of_encounter':
    case 'manual':
    default:
      return 'manual';
  }
}

/**
 * Parse a potency threshold (WEAK/AVERAGE/STRONG or numeric)
 */
export function parseThreshold(value: string): PotencyThreshold {
  const trimmed = value.trim().toUpperCase();
  if (trimmed === 'WEAK' || trimmed === 'AVERAGE' || trimmed === 'STRONG') {
    return trimmed as PotencyKeyword;
  }
  const num = parseInt(value, 10);
  if (!isNaN(num)) {
    return num;
  }
  return 'AVERAGE'; // Default fallback
}

/**
 * Extract condition name from text
 */
function extractConditionName(text: string): string | null {
  const lowerText = text.toLowerCase();
  for (const condition of KNOWN_CONDITIONS) {
    if (lowerText.includes(condition)) {
      return condition;
    }
  }
  // Check for compound conditions
  if (lowerText.includes("prone and can't stand")) {
    return 'prone';
  }
  return null;
}

/**
 * Parse a single condition clause from tier text
 *
 * Examples:
 * - "M < WEAK, slowed (save ends)"
 * - "I < 2 dazed (EoT)"
 * - "P < STRONG, frightened (save ends)"
 */
export function parseConditionClause(text: string): ParsedCondition | null {
  // Pattern: [Characteristic] < [Threshold], [condition] ([end type])
  // Also matches: [Characteristic] < [Threshold] [condition] ([end type]) - no comma
  const pattern = /([MAIRP])\s*<\s*(WEAK|AVERAGE|STRONG|\d+),?\s*(.+)/i;
  const match = text.match(pattern);

  if (!match) {
    return null;
  }

  const charAbbrev = match[1].toUpperCase();
  const characteristic = CHARACTERISTIC_MAP[charAbbrev];
  if (!characteristic) {
    return null;
  }

  const threshold = parseThreshold(match[2]);
  const conditionText = match[3];
  const conditionName = extractConditionName(conditionText);

  if (!conditionName) {
    // Still return with full text for custom conditions
    return {
      characteristic,
      operator: '<',
      threshold,
      conditionName: conditionText.split('(')[0].trim(),
      endType: parseEndType(conditionText),
      fullText: conditionText,
    };
  }

  return {
    characteristic,
    operator: '<',
    threshold,
    conditionName,
    endType: parseEndType(conditionText),
    fullText: conditionText,
  };
}

/**
 * Parse a complete tier effect string
 *
 * Examples:
 * - "9 + M damage; M < WEAK, slowed (save ends)"
 * - "3 + R damage; push 2; P < AVERAGE, frightened (save ends)"
 * - "The target's speed is halved (save ends), or if P < WEAK, slowed (save ends)"
 */
export function parseTierEffect(tierText: string): TierEffectParseResult {
  const result: TierEffectParseResult = {
    conditions: [],
    additionalEffects: [],
    hasConditional: false,
    rawText: tierText,
  };

  if (!tierText || tierText.trim() === '-') {
    return result;
  }

  // Check for "or if" conditional pattern
  result.hasConditional = tierText.toLowerCase().includes('or if');

  // Split by semicolons to separate effects
  const parts = tierText.split(';').map((p) => p.trim());

  for (const part of parts) {
    // Check if this part contains damage (ends with "damage")
    if (part.toLowerCase().includes('damage') && !part.toLowerCase().includes('takes')) {
      // This is likely a damage clause, possibly with condition
      const damageParts = part.split(';');
      result.baseDamage = damageParts[0].trim();

      // Check if there's a condition after the damage
      const conditionMatch = parseConditionClause(part);
      if (conditionMatch) {
        result.conditions.push(conditionMatch);
      }
    } else {
      // Check if this part contains a condition
      const conditionMatch = parseConditionClause(part);
      if (conditionMatch) {
        result.conditions.push(conditionMatch);
      } else if (part.length > 0) {
        // Check for standalone conditions without characteristic check
        const standaloneCondition = extractConditionName(part);
        if (standaloneCondition) {
          result.conditions.push({
            characteristic: 'presence', // Default, no check required
            operator: '<',
            threshold: 999, // Always applies
            conditionName: standaloneCondition,
            endType: parseEndType(part),
            fullText: part,
          });
        } else {
          result.additionalEffects.push(part);
        }
      }
    }
  }

  return result;
}

/**
 * Check if a target's characteristic passes the potency check
 *
 * @param targetValue - The target's characteristic value
 * @param threshold - The threshold to compare against
 * @param heroLevel - The hero's level (for resolving WEAK/AVERAGE/STRONG)
 * @returns true if the condition should apply
 */
export function checkPotency(
  targetValue: number,
  threshold: PotencyThreshold,
  heroLevel: number = 1
): boolean {
  let numericThreshold: number;

  if (typeof threshold === 'number') {
    numericThreshold = threshold;
  } else {
    // Convert keyword to numeric threshold based on standard Draw Steel rules
    // These values may need adjustment based on official rules
    switch (threshold) {
      case 'WEAK':
        numericThreshold = Math.floor(heroLevel / 3); // ~0-3 across levels 1-10
        break;
      case 'AVERAGE':
        numericThreshold = Math.floor(heroLevel / 2); // ~0-5 across levels 1-10
        break;
      case 'STRONG':
        numericThreshold = Math.floor((heroLevel * 2) / 3); // ~0-6 across levels 1-10
        break;
      default:
        numericThreshold = 0;
    }
  }

  return targetValue < numericThreshold;
}

/**
 * Extract all unique condition names from a tier effect string
 */
export function extractConditions(tierText: string): string[] {
  const result = parseTierEffect(tierText);
  return result.conditions.map((c) => c.conditionName);
}

/**
 * Check if a tier effect string contains a specific condition
 */
export function hasCondition(tierText: string, conditionName: string): boolean {
  const conditions = extractConditions(tierText);
  return conditions.some((c) => c.toLowerCase() === conditionName.toLowerCase());
}

/**
 * Map a parsed condition name to Mettle's ConditionId type
 */
export function toConditionId(conditionName: string): ConditionId | null {
  const normalized = conditionName.toLowerCase().trim();

  // Direct mapping
  const directMap: Record<string, ConditionId> = {
    bleeding: 'bleeding',
    dazed: 'dazed',
    frightened: 'frightened',
    grabbed: 'grabbed',
    prone: 'prone',
    restrained: 'restrained',
    slowed: 'slowed',
    taunted: 'taunted',
    weakened: 'weakened',
  };

  return directMap[normalized] || null;
}
