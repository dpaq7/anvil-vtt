/**
 * Ability Logic
 *
 * Pure functions for ability resolution, distance parsing, and damage calculation.
 * Centralizes attack flow calculations from useAttackFlow.ts.
 *
 * Reference: Forge Steel src/logic/ability-logic.ts
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Ability distance types (Draw Steel distance keywords).
 */
export type DistanceType =
  | 'melee'     // Adjacent targets
  | 'ranged'    // Distance in squares
  | 'aura'      // Emanates from caster, moves with them
  | 'burst'     // Area around a point
  | 'cube'      // Cube-shaped area (distinct from burst)
  | 'line'      // Line from caster
  | 'wall'      // Wall formation
  | 'self'      // Self-targeting only
  | 'within'    // Within distance (typically for allies)
  | 'special';  // Special/variable distance

/**
 * Parsed distance from ability text.
 */
export interface ParsedDistance {
  type: DistanceType;
  baseValue: number;
  reach?: number;
  qualifier?: string;
  width?: number; // For line/wall (e.g., "10 x 1 line")
  /**
   * Origin range for area templates: how far from the caster the template can be
   * placed (the "within N" clause of "2 cube within 10", "10 x 1 line within 5").
   * Distinct from baseValue, which is the template's own size/length.
   */
  origin?: number;
  /**
   * Alternate distances when an ability lists several (e.g. "Melee 1 or Ranged 5").
   * The primary parse is returned at the top level; the remaining options here.
   */
  alternates?: ParsedDistance[];
}

/**
 * Characteristic shorthand (Draw Steel uses single letters).
 */
export type CharacteristicShorthand = 'M' | 'A' | 'R' | 'I' | 'P';

/**
 * Characteristic names.
 */
export type CharacteristicName = 'might' | 'agility' | 'reason' | 'intuition' | 'presence';

/**
 * Parsed damage formula components.
 */
export interface ParsedDamage {
  dice: { count: number; sides: number } | null;
  flatModifier: number;
  characteristicModifier: CharacteristicName | null;
  characteristicMultiplier: number;
  damageType: string | null;
  formula: string;
}

/**
 * Damage calculation result.
 */
export interface DamageResult {
  total: number;
  breakdown: string;
  components: {
    flat: number;
    characteristic: number;
    kitBonus: number;
    dice?: number;
  };
}

/**
 * Kit damage bonuses per tier.
 */
export interface KitDamageBonus {
  tier1: number;
  tier2: number;
  tier3: number;
}

/**
 * Cover levels for ranged attacks.
 */
export type CoverLevel = 'none' | 'half' | 'three-quarters' | 'full';

/**
 * Ability keyword from Draw Steel.
 * Categories: Attack types, elements, class-specific, item types, combat keywords
 */
export type AbilityKeyword =
  // Attack & targeting keywords
  | 'melee'
  | 'ranged'
  | 'magic'
  | 'weapon'
  | 'strike'
  | 'area'
  | 'charge'

  // Elemental keywords (damage types are separate from keywords)
  | 'air'
  | 'earth'
  | 'fire'
  | 'green'
  | 'void'
  | 'water'

  // Psionic keywords
  | 'psionic'
  | 'animapathy'
  | 'chronopathy'
  | 'metamorphosis'
  | 'psychokinesis'
  | 'resopathy'
  | 'telekinesis'
  | 'telepathy'

  // Class-specific keywords
  | 'animalistic'      // Beastheart
  | 'beast'            // Beastheart
  | 'beastheart'       // Class keyword
  | 'censor'           // Class keyword
  | 'conduit'          // Class keyword
  | 'domain'           // Conduit domains
  | 'elementalist'     // Class keyword
  | 'fury'             // Class keyword
  | 'null'             // Class keyword
  | 'routine'          // Troubadour
  | 'shadow'           // Class keyword
  | 'summoner'         // Class keyword
  | 'tactician'        // Class keyword
  | 'talent'           // Class keyword
  | 'troubadour'       // Class keyword

  // Combat keywords
  | 'persistent'
  | 'resistance'

  // Item slot keywords
  | 'armor'
  | 'shield'
  | 'implement'
  | 'light-weapon'
  | 'medium-weapon'
  | 'heavy-weapon'
  | 'whip'
  | 'polearm'
  | 'unarmed'

  // Ancestry/culture keywords
  | 'devil'
  | 'dwarf'
  | 'elf'
  | 'hakaan'
  | 'human'
  | 'memonek'
  | 'orc'
  | 'polder'
  | 'revenant'
  | 'time-raider'
  | 'wode-elf';

/**
 * Ability category based on keywords.
 */
export type AbilityCategory = 'melee' | 'ranged' | 'magic' | 'other';

// ---------------------------------------------------------------------------
// Characteristic Mapping
// ---------------------------------------------------------------------------

const CHARACTERISTIC_MAP: Record<CharacteristicShorthand, CharacteristicName> = {
  M: 'might',
  A: 'agility',
  R: 'reason',
  I: 'intuition',
  P: 'presence',
};

const CHARACTERISTIC_SHORTHAND: Record<CharacteristicName, CharacteristicShorthand> = {
  might: 'M',
  agility: 'A',
  reason: 'R',
  intuition: 'I',
  presence: 'P',
};

// ---------------------------------------------------------------------------
// Distance Parsing
// ---------------------------------------------------------------------------

/**
 * Parse a distance string into a {@link ParsedDistance}.
 *
 * Handles the real compendium grammar, including compound forms:
 * - "Melee 1", "Melee 1 or Ranged 5" (alternates)
 * - "Ranged 5", "Self"
 * - "5 burst"
 * - "2 cube within 10", "2 cube of unoccupied space within 10"
 * - "10 x 1 line within 5"
 * - "5 wall within 10"
 * - "3 aura"
 * - "Within 10" (standalone ally targeting)
 *
 * @param distanceString - The distance string to parse
 * @returns Parsed distance object (first option at top level, rest in `alternates`)
 */
export function parseDistance(distanceString: string): ParsedDistance {
  if (!distanceString || typeof distanceString !== 'string') {
    return { type: 'special', baseValue: 0 };
  }

  // Compound "A or B" / "A, or B" — parse each option, keep the first as primary.
  const options = distanceString.split(/\s*,?\s+or\s+/i).map((s) => s.trim());
  if (options.length > 1) {
    const parsed = options.map((opt) => parseSingleDistance(opt));
    return { ...parsed[0]!, alternates: parsed.slice(1) };
  }

  return parseSingleDistance(distanceString);
}

/**
 * Parse a single (non-compound) distance clause. Callers should use
 * {@link parseDistance}, which also handles "A or B" alternates.
 */
function parseSingleDistance(distanceString: string): ParsedDistance {
  const raw = distanceString.trim();
  if (!raw) {
    return { type: 'special', baseValue: 0 };
  }
  const normalized = raw.toLowerCase();

  // Self
  if (normalized === 'self' || normalized.startsWith('self')) {
    const qualifier = normalized.replace('self', '').replace(/[()]/g, '').trim();
    return { type: 'self', baseValue: 0, qualifier: qualifier || undefined };
  }

  // Melee (default reach 1)
  if (normalized === 'melee') {
    return { type: 'melee', baseValue: 1, reach: 1 };
  }

  // Melee N
  const meleeMatch = normalized.match(/^melee\s*(\d+)?$/);
  if (meleeMatch) {
    const reach = meleeMatch[1] ? parseInt(meleeMatch[1], 10) : 1;
    return { type: 'melee', baseValue: reach, reach };
  }

  // Ranged N
  const rangedMatch = normalized.match(/^ranged\s*(\d+)$/);
  if (rangedMatch) {
    return { type: 'ranged', baseValue: parseInt(rangedMatch[1]!, 10) };
  }

  // "L x W line [within N]" (e.g. "10 x 1 line within 5")
  const lineMatch = normalized.match(/^(\d+)\s*x\s*(\d+)\s*line(?:\s+within\s*(\d+))?$/);
  if (lineMatch) {
    return {
      type: 'line',
      baseValue: parseInt(lineMatch[1]!, 10),
      width: parseInt(lineMatch[2]!, 10),
      origin: lineMatch[3] ? parseInt(lineMatch[3], 10) : undefined,
    };
  }

  // "L wall [within N]" or "L x W wall [within N]"
  const wallMatch = normalized.match(/^(\d+)\s*(?:x\s*(\d+)\s*)?wall(?:\s+within\s*(\d+))?$/);
  if (wallMatch) {
    return {
      type: 'wall',
      baseValue: parseInt(wallMatch[1]!, 10),
      width: wallMatch[2] ? parseInt(wallMatch[2], 10) : 1,
      origin: wallMatch[3] ? parseInt(wallMatch[3], 10) : undefined,
    };
  }

  // "N cube [of ...] [within N]" (e.g. "2 cube within 10", "2 cube of unoccupied space within 10")
  const cubeMatch = normalized.match(/^(\d+)\s*cube(\s+of\s+[^]*?)?(?:\s+within\s*(\d+))?$/);
  if (cubeMatch) {
    const qualifier = cubeMatch[2]?.trim();
    return {
      type: 'cube',
      baseValue: parseInt(cubeMatch[1]!, 10),
      origin: cubeMatch[3] ? parseInt(cubeMatch[3], 10) : undefined,
      qualifier: qualifier || undefined,
    };
  }

  // "N burst [within N]" (burst usually emanates from the caster; within is rare but tolerated)
  const burstMatch = normalized.match(/^(\d+)\s*burst(?:\s+within\s*(\d+))?$/);
  if (burstMatch) {
    return {
      type: 'burst',
      baseValue: parseInt(burstMatch[1]!, 10),
      origin: burstMatch[2] ? parseInt(burstMatch[2], 10) : undefined,
    };
  }

  // "N aura" / "aura N"
  const auraMatch = normalized.match(/^(?:aura\s*(\d+)|(\d+)\s*aura)$/);
  if (auraMatch) {
    return { type: 'aura', baseValue: parseInt((auraMatch[1] ?? auraMatch[2])!, 10) };
  }

  // Standalone "Within N" (ally targeting, no area shape)
  const withinMatch = normalized.match(/^within\s*(\d+)$/);
  if (withinMatch) {
    return { type: 'within', baseValue: parseInt(withinMatch[1]!, 10) };
  }

  // Just a number (assume ranged)
  const numberMatch = normalized.match(/^(\d+)$/);
  if (numberMatch) {
    return { type: 'ranged', baseValue: parseInt(numberMatch[1]!, 10) };
  }

  // Special/unknown — preserve original casing in the qualifier
  return { type: 'special', baseValue: 0, qualifier: raw };
}

/**
 * The maximum distance from the caster that matters for a simple reachability
 * check. For placed-area templates (cube/line/wall) this is the "within N"
 * origin range; for melee/ranged/burst/aura it is the base value.
 *
 * @param distance - Parsed distance
 * @returns Reach in squares from the caster
 */
export function getReach(distance: ParsedDistance): number {
  switch (distance.type) {
    case 'self':
      return 0;
    case 'cube':
    case 'line':
    case 'wall':
      return distance.origin ?? distance.baseValue;
    default:
      return distance.baseValue;
  }
}

/**
 * Calculate effective distance after bonuses.
 *
 * @param baseDistance - Base distance value
 * @param distanceBonus - Bonus from kit/features
 * @returns Effective distance
 */
export function getEffectiveDistance(baseDistance: number, distanceBonus: number): number {
  return Math.max(0, baseDistance + distanceBonus);
}

/**
 * Format a parsed distance for display.
 *
 * @param distance - Parsed distance object
 * @returns Formatted string
 */
export function formatDistance(distance: ParsedDistance): string {
  switch (distance.type) {
    case 'self':
      return distance.qualifier ? `Self (${distance.qualifier})` : 'Self';
    case 'melee':
      return distance.baseValue === 1 ? 'Melee' : `Melee ${distance.baseValue}`;
    case 'ranged':
      return `Ranged ${distance.baseValue}`;
    case 'burst':
      return `${distance.baseValue} burst`;
    case 'cube':
      return `${distance.baseValue} cube`;
    case 'aura':
      return `${distance.baseValue} aura`;
    case 'within':
      return `Within ${distance.baseValue}`;
    case 'line':
      return distance.width && distance.width > 1
        ? `Line ${distance.baseValue}×${distance.width}`
        : `Line ${distance.baseValue}`;
    case 'wall':
      return distance.width && distance.width > 1
        ? `Wall ${distance.baseValue}×${distance.width}`
        : `Wall ${distance.baseValue}`;
    case 'special':
      return distance.qualifier || 'Special';
  }
}

/**
 * Check if a target is within ability range.
 *
 * @param abilityDistance - Parsed distance of the ability
 * @param targetDistance - Distance to the target in squares
 * @param distanceBonus - Bonus from kit/features
 * @returns True if target is in range
 */
export function isInRange(
  abilityDistance: ParsedDistance,
  targetDistance: number,
  distanceBonus = 0
): boolean {
  if (abilityDistance.type === 'self') {
    return targetDistance === 0;
  }
  if (abilityDistance.type === 'special') {
    return false;
  }

  const effectiveRange = getEffectiveDistance(getReach(abilityDistance), distanceBonus);
  return targetDistance <= effectiveRange;
}

/**
 * Check if a target is in range for a distance that may list alternates
 * (e.g. "Melee 1 or Ranged 5"): true if the primary OR any alternate reaches.
 *
 * @param abilityDistance - Parsed distance (possibly with `alternates`)
 * @param targetDistance - Distance to the target in squares
 * @param distanceBonus - Bonus from kit/features
 * @returns True if any listed distance reaches the target
 */
export function isInRangeAny(
  abilityDistance: ParsedDistance,
  targetDistance: number,
  distanceBonus = 0
): boolean {
  if (isInRange(abilityDistance, targetDistance, distanceBonus)) {
    return true;
  }
  return (abilityDistance.alternates ?? []).some((alt) =>
    isInRange(alt, targetDistance, distanceBonus)
  );
}

// ---------------------------------------------------------------------------
// Damage Parsing & Calculation
// ---------------------------------------------------------------------------

/**
 * Parse a damage formula like "2d6 + M", "5 + M", "8 + 2×M fire".
 *
 * @param formula - The damage formula string
 * @returns Parsed damage object
 */
export function parseDamageFormula(formula: string): ParsedDamage {
  if (!formula || typeof formula !== 'string') {
    return {
      dice: null,
      flatModifier: 0,
      characteristicModifier: null,
      characteristicMultiplier: 1,
      damageType: null,
      formula: formula || '',
    };
  }

  const normalized = formula.trim();
  let remaining = normalized;

  // Extract damage type (at the end: "fire", "psychic", etc.)
  let damageType: string | null = null;
  const damageTypes = ['fire', 'cold', 'lightning', 'psychic', 'poison', 'acid', 'sonic', 'holy', 'corruption'];
  for (const dt of damageTypes) {
    if (remaining.toLowerCase().endsWith(dt)) {
      damageType = dt;
      remaining = remaining.slice(0, -dt.length).trim();
      break;
    }
  }

  // Remove "damage" word if present
  remaining = remaining.replace(/\s*damage\s*$/i, '').trim();

  // Parse dice (NdM)
  let dice: { count: number; sides: number } | null = null;
  const diceMatch = remaining.match(/(\d+)d(\d+)/i);
  if (diceMatch) {
    dice = { count: parseInt(diceMatch[1]!, 10), sides: parseInt(diceMatch[2]!, 10) };
    remaining = remaining.replace(diceMatch[0], '').trim();
  }

  // Parse flat modifier
  let flatModifier = 0;
  const flatMatch = remaining.match(/(?:^|[+-])\s*(\d+)(?!\s*[×x*])/);
  if (flatMatch) {
    const sign = remaining.includes('-') && remaining.indexOf('-') < remaining.indexOf(flatMatch[1]!) ? -1 : 1;
    flatModifier = sign * parseInt(flatMatch[1]!, 10);
  }

  // Parse characteristic modifier with optional multiplier
  let characteristicModifier: CharacteristicName | null = null;
  let characteristicMultiplier = 1;

  // Pattern: "2×M", "2 × M", "2*M", "2 x M"
  const charMultMatch = remaining.match(/(\d+)\s*[×x*]\s*([MARIP])/i);
  if (charMultMatch) {
    characteristicMultiplier = parseInt(charMultMatch[1]!, 10);
    const shorthand = charMultMatch[2]!.toUpperCase() as CharacteristicShorthand;
    characteristicModifier = CHARACTERISTIC_MAP[shorthand] ?? null;
  } else {
    // Pattern: just "M", "A", etc.
    const charMatch = remaining.match(/(?:^|[+\-\s])([MARIP])(?:\s|$)/i);
    if (charMatch) {
      const shorthand = charMatch[1]!.toUpperCase() as CharacteristicShorthand;
      characteristicModifier = CHARACTERISTIC_MAP[shorthand] ?? null;
    }
  }

  return {
    dice,
    flatModifier,
    characteristicModifier,
    characteristicMultiplier,
    damageType,
    formula: normalized,
  };
}

/**
 * Calculate actual damage for a tier result.
 *
 * @param formula - The tier damage string (e.g., "5 + M damage")
 * @param characteristicValue - The hero's characteristic value
 * @param kitBonus - Optional damage bonus from kit
 * @param tier - The tier (1, 2, or 3) for kit bonus lookup
 * @returns Damage result with total and breakdown
 */
export function calculateTierDamage(
  formula: string,
  characteristicValue: number,
  kitBonus?: KitDamageBonus,
  tier?: 1 | 2 | 3
): DamageResult {
  const parsed = parseDamageFormula(formula);

  // Calculate components
  const flatDamage = parsed.flatModifier;
  const characteristicDamage = parsed.characteristicModifier
    ? characteristicValue * parsed.characteristicMultiplier
    : 0;
  const kitDamage = kitBonus && tier ? kitBonus[`tier${tier}`] : 0;

  // Note: Dice are not rolled here - this function calculates the formula value
  // Dice rolling should be done separately
  const dicePlaceholder = parsed.dice ? 0 : 0;

  const total = flatDamage + characteristicDamage + kitDamage + dicePlaceholder;

  // Build breakdown string
  const parts: string[] = [];
  if (parsed.dice) {
    parts.push(`${parsed.dice.count}d${parsed.dice.sides}`);
  }
  if (flatDamage !== 0) {
    parts.push(flatDamage.toString());
  }
  if (parsed.characteristicModifier) {
    const charPart = parsed.characteristicMultiplier > 1
      ? `${parsed.characteristicMultiplier}×${CHARACTERISTIC_SHORTHAND[parsed.characteristicModifier]} (${characteristicDamage})`
      : `${CHARACTERISTIC_SHORTHAND[parsed.characteristicModifier]} (${characteristicDamage})`;
    parts.push(charPart);
  }
  if (kitDamage > 0) {
    parts.push(`Kit (+${kitDamage})`);
  }

  const breakdown = parts.join(' + ') + ` = ${total}`;

  return {
    total,
    breakdown,
    components: {
      flat: flatDamage,
      characteristic: characteristicDamage,
      kitBonus: kitDamage,
      dice: parsed.dice ? 0 : undefined,
    },
  };
}

/**
 * Get characteristic name from shorthand.
 *
 * @param shorthand - Single letter shorthand (M, A, R, I, P)
 * @returns Full characteristic name or null
 */
export function getCharacteristicFromShorthand(shorthand: string): CharacteristicName | null {
  const upper = shorthand.toUpperCase() as CharacteristicShorthand;
  return CHARACTERISTIC_MAP[upper] ?? null;
}

/**
 * Get shorthand from characteristic name.
 *
 * @param name - Full characteristic name
 * @returns Single letter shorthand
 */
export function getCharacteristicShorthand(name: CharacteristicName): CharacteristicShorthand {
  return CHARACTERISTIC_SHORTHAND[name];
}

// ---------------------------------------------------------------------------
// Keyword Utilities
// ---------------------------------------------------------------------------

/**
 * Check if an ability has a specific keyword.
 *
 * @param keywords - Array of ability keywords
 * @param keyword - Keyword to check for
 * @returns True if ability has the keyword
 */
export function hasKeyword(keywords: string[], keyword: AbilityKeyword): boolean {
  return keywords.some((k) => k.toLowerCase() === keyword.toLowerCase());
}

/**
 * Determine ability category based on keywords.
 *
 * @param keywords - Array of ability keywords
 * @returns Ability category
 */
export function getAbilityCategory(keywords: string[]): AbilityCategory {
  const lowerKeywords = keywords.map((k) => k.toLowerCase());

  if (lowerKeywords.includes('magic') || lowerKeywords.includes('psionic')) {
    return 'magic';
  }
  if (lowerKeywords.includes('ranged') && !lowerKeywords.includes('melee')) {
    return 'ranged';
  }
  if (lowerKeywords.includes('melee')) {
    return 'melee';
  }
  return 'other';
}

/**
 * Check if ability is a Strike (uses weapon damage).
 *
 * @param keywords - Array of ability keywords
 * @returns True if ability is a strike
 */
export function isStrike(keywords: string[]): boolean {
  return hasKeyword(keywords, 'strike') || hasKeyword(keywords, 'weapon');
}

// ---------------------------------------------------------------------------
// Attack Modifiers
// ---------------------------------------------------------------------------

/**
 * Get bane penalty for cover level.
 * - none: 0 banes
 * - half: 1 bane
 * - three-quarters: 2 banes
 * - full: cannot target (returns -1 as sentinel)
 *
 * @param coverLevel - Level of cover
 * @returns Number of banes (or -1 for full cover)
 */
export function getCoverBanes(coverLevel: CoverLevel): number {
  switch (coverLevel) {
    case 'none':
      return 0;
    case 'half':
      return 1;
    case 'three-quarters':
      return 2;
    case 'full':
      return -1; // Cannot target through full cover
  }
}

/**
 * Calculate total attack modifiers (edges and banes).
 *
 * @param options - Modifier calculation options
 * @returns Object with total edges and banes
 */
export function calculateAttackModifiers(options: {
  coverLevel?: CoverLevel;
  flanking?: boolean;
  highGround?: boolean;
  conditions?: string[];
}): { edges: number; banes: number } {
  let edges = 0;
  let banes = 0;

  // Cover
  if (options.coverLevel && options.coverLevel !== 'none') {
    const coverBanes = getCoverBanes(options.coverLevel);
    if (coverBanes > 0) {
      banes += coverBanes;
    }
  }

  // Flanking grants an edge
  if (options.flanking) {
    edges += 1;
  }

  // High ground grants an edge
  if (options.highGround) {
    edges += 1;
  }

  // Condition-based modifiers (simplified)
  const conditions = options.conditions ?? [];
  if (conditions.includes('prone')) {
    banes += 1;
  }
  if (conditions.includes('dazed')) {
    banes += 1;
  }

  return { edges, banes };
}

// ---------------------------------------------------------------------------
// Power Roll Characteristics
// ---------------------------------------------------------------------------

/**
 * Get the best characteristic value from a set of options.
 *
 * @param characteristics - All characteristic values
 * @param options - Which characteristics can be used
 * @returns Best characteristic name and value
 */
export function getBestCharacteristic(
  characteristics: Record<CharacteristicName, number>,
  options: CharacteristicName[]
): { characteristic: CharacteristicName; value: number } {
  if (options.length === 0) {
    return { characteristic: 'might', value: 0 };
  }

  let best: { characteristic: CharacteristicName; value: number } = {
    characteristic: options[0]!,
    value: characteristics[options[0]!] ?? 0,
  };

  for (const char of options) {
    const value = characteristics[char] ?? 0;
    if (value > best.value) {
      best = { characteristic: char, value };
    }
  }

  return best;
}

/**
 * Check if an ability uses "highest characteristic" (all 5 listed).
 *
 * @param powerRollCharacteristics - Characteristics listed for power roll
 * @returns True if ability uses highest of all characteristics
 */
export function usesHighestCharacteristic(powerRollCharacteristics: CharacteristicName[]): boolean {
  const ALL_CHARACTERISTICS: CharacteristicName[] = ['might', 'agility', 'reason', 'intuition', 'presence'];
  return (
    powerRollCharacteristics.length === 5 &&
    ALL_CHARACTERISTICS.every((c) => powerRollCharacteristics.includes(c))
  );
}
