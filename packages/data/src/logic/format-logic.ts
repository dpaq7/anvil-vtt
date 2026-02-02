/**
 * Format Logic
 *
 * Pure functions for consistent text formatting across the application.
 * Provides number formatting, characteristic display, distance/damage display,
 * and general text utilities.
 *
 * Reference: Forge Steel src/logic/format-logic.ts
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Characteristic names.
 */
export type CharacteristicName = 'might' | 'agility' | 'reason' | 'intuition' | 'presence';

/**
 * Power roll tier.
 */
export type Tier = 'tier1' | 'tier2' | 'tier3' | 1 | 2 | 3;

/**
 * Ability distance structure.
 */
export interface AbilityDistance {
  type: 'melee' | 'ranged' | 'aura' | 'burst' | 'line' | 'special';
  value?: number;
  reach?: number;
  length?: number;
  width?: number;
  description?: string;
}

/**
 * Power roll result structure.
 */
export interface PowerRollResult {
  dice: number[];
  modifier: number;
  total: number;
  tier: Tier;
}

// ---------------------------------------------------------------------------
// Number Formatting
// ---------------------------------------------------------------------------

/**
 * Format number with sign: +2, -1, +0
 *
 * @param value - Number to format
 * @returns Signed string
 */
export function getSignedNumber(value: number): string {
  if (value >= 0) {
    return `+${value}`;
  }
  return `${value}`;
}

/**
 * Format modifier for display: "+2", "-1", "±0"
 *
 * @param value - Modifier value
 * @returns Formatted modifier
 */
export function getModifier(value: number): string {
  if (value === 0) return '±0';
  return getSignedNumber(value);
}

/**
 * Format large numbers with commas: 1,234,567
 *
 * @param value - Number to format
 * @returns Formatted string
 */
export function formatNumber(value: number): string {
  return value.toLocaleString();
}

/**
 * Format as ordinal: 1st, 2nd, 3rd, 4th
 *
 * @param n - Number to format
 * @returns Ordinal string
 */
export function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/**
 * Format percentage: 75%
 *
 * @param value - Decimal value (0-1) or percentage (0-100)
 * @param isDecimal - Whether value is decimal
 * @returns Formatted percentage
 */
export function formatPercentage(value: number, isDecimal = false): string {
  const pct = isDecimal ? value * 100 : value;
  return `${Math.round(pct)}%`;
}

// ---------------------------------------------------------------------------
// Characteristic Formatting
// ---------------------------------------------------------------------------

/**
 * Characteristic abbreviations.
 */
const CHARACTERISTIC_ABBREV: Record<CharacteristicName, string> = {
  might: 'M',
  agility: 'A',
  reason: 'R',
  intuition: 'I',
  presence: 'P',
};

/**
 * Get characteristic abbreviation: M, A, R, I, P
 *
 * @param characteristic - Full characteristic name
 * @returns Single letter abbreviation
 */
export function getCharacteristicAbbreviation(characteristic: CharacteristicName): string {
  return CHARACTERISTIC_ABBREV[characteristic] ?? characteristic.charAt(0).toUpperCase();
}

/**
 * Format characteristic with value: "Might +3"
 *
 * @param characteristic - Characteristic name
 * @param value - Characteristic value
 * @returns Formatted string
 */
export function formatCharacteristic(characteristic: CharacteristicName, value: number): string {
  const name = capitalize(characteristic);
  return `${name} ${getSignedNumber(value)}`;
}

/**
 * Format characteristic for power roll: "M" or "M or A"
 *
 * @param characteristics - Array of characteristic options
 * @returns Formatted string
 */
export function formatPowerRollCharacteristics(characteristics: CharacteristicName[]): string {
  if (characteristics.length === 0) return '—';
  if (characteristics.length === 5) return 'Highest';

  return characteristics.map((c) => getCharacteristicAbbreviation(c)).join(' or ');
}

// ---------------------------------------------------------------------------
// Distance Formatting
// ---------------------------------------------------------------------------

/**
 * Format distance for display.
 *
 * - "Melee" or "Melee 2"
 * - "Ranged 5"
 * - "5-cube aura"
 * - "Line 5 × 1"
 *
 * @param distance - Distance object
 * @returns Formatted string
 */
export function formatDistance(distance: AbilityDistance): string {
  switch (distance.type) {
    case 'melee':
      return distance.reach && distance.reach > 1 ? `Melee ${distance.reach}` : 'Melee';
    case 'ranged':
      return `Ranged ${distance.value ?? 5}`;
    case 'aura':
      return `${distance.value ?? 1}-cube aura`;
    case 'burst':
      return `${distance.value ?? 1} burst`;
    case 'line':
      return `Line ${distance.length ?? 5} × ${distance.width ?? 1}`;
    case 'special':
      return distance.description ?? 'Special';
    default:
      return 'Unknown';
  }
}

/**
 * Format multiple distances.
 *
 * @param distances - Array of distance objects
 * @returns Formatted string joined by "or"
 */
export function formatDistances(distances: AbilityDistance[]): string {
  return distances.map((d) => formatDistance(d)).join(' or ');
}

// ---------------------------------------------------------------------------
// Damage Formatting
// ---------------------------------------------------------------------------

/**
 * Format damage amount: "5", "10 fire"
 *
 * @param amount - Damage amount
 * @param damageType - Optional damage type
 * @returns Formatted string
 */
export function formatDamage(amount: number, damageType?: string): string {
  if (damageType) {
    return `${amount} ${damageType}`;
  }
  return `${amount}`;
}

/**
 * Format dice expression: "2d6", "1d8 + 3"
 *
 * @param count - Number of dice
 * @param sides - Die sides
 * @param modifier - Optional flat modifier
 * @returns Formatted string
 */
export function formatDice(count: number, sides: number, modifier?: number): string {
  let str = `${count}d${sides}`;
  if (modifier && modifier !== 0) {
    str += ` ${getSignedNumber(modifier)}`;
  }
  return str;
}

// ---------------------------------------------------------------------------
// Roll Result Formatting
// ---------------------------------------------------------------------------

/**
 * Normalize tier to numeric form.
 *
 * @param tier - Tier in string or numeric form
 * @returns Numeric tier (1, 2, or 3)
 */
export function normalizeTier(tier: Tier): 1 | 2 | 3 {
  if (typeof tier === 'number') return tier as 1 | 2 | 3;
  return tier === 'tier1' ? 1 : tier === 'tier2' ? 2 : 3;
}

/**
 * Format tier result: "Tier 1", "Tier 2", "Tier 3"
 *
 * @param tier - Roll tier
 * @returns Formatted string
 */
export function formatTier(tier: Tier): string {
  const tierNum = normalizeTier(tier);
  return `Tier ${tierNum}`;
}

/**
 * Format power roll result for display.
 *
 * @param result - Power roll result
 * @returns Formatted string
 */
export function formatPowerRollResult(result: PowerRollResult): string {
  const parts: string[] = [];

  // Dice results
  parts.push(`[${result.dice.join(', ')}]`);

  // Modifier
  if (result.modifier !== 0) {
    parts.push(getSignedNumber(result.modifier));
  }

  // Total
  parts.push(`= ${result.total}`);

  // Tier
  parts.push(`(${formatTier(result.tier)})`);

  return parts.join(' ');
}

/**
 * Format edges/banes: "2 edges", "1 bane", "1 edge, 2 banes"
 *
 * @param edges - Number of edges
 * @param banes - Number of banes
 * @returns Formatted string
 */
export function formatEdgesBanes(edges: number, banes: number): string {
  const parts: string[] = [];

  if (edges > 0) {
    parts.push(`${edges} ${edges === 1 ? 'edge' : 'edges'}`);
  }
  if (banes > 0) {
    parts.push(`${banes} ${banes === 1 ? 'bane' : 'banes'}`);
  }

  return parts.length > 0 ? parts.join(', ') : 'No modifiers';
}

// ---------------------------------------------------------------------------
// Time & Duration Formatting
// ---------------------------------------------------------------------------

/**
 * Format duration in rounds: "1 round", "3 rounds"
 *
 * @param rounds - Number of rounds
 * @returns Formatted string
 */
export function formatRounds(rounds: number): string {
  return rounds === 1 ? '1 round' : `${rounds} rounds`;
}

/**
 * Format relative time: "2 minutes ago", "1 hour ago"
 *
 * @param date - Date to format
 * @returns Relative time string
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
}

/**
 * Format duration in human-readable form.
 *
 * @param minutes - Duration in minutes
 * @returns Formatted string
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours} hr`;
  }
  return `${hours} hr ${mins} min`;
}

// ---------------------------------------------------------------------------
// Text Formatting Utilities
// ---------------------------------------------------------------------------

/**
 * Capitalize first letter: "hello" → "Hello"
 *
 * @param str - String to capitalize
 * @returns Capitalized string
 */
export function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Title case: "hello world" → "Hello World"
 *
 * @param str - String to title case
 * @returns Title-cased string
 */
export function titleCase(str: string): string {
  return str.split(' ').map(capitalize).join(' ');
}

/**
 * Pluralize word: (1, "goblin") → "goblin", (3, "goblin") → "goblins"
 *
 * @param count - Item count
 * @param singular - Singular form
 * @param plural - Optional plural form (defaults to singular + 's')
 * @returns Pluralized string
 */
export function pluralize(count: number, singular: string, plural?: string): string {
  if (count === 1) return singular;
  return plural ?? `${singular}s`;
}

/**
 * Format count with label: (3, "goblin") → "3 goblins"
 *
 * @param count - Item count
 * @param singular - Singular form
 * @param plural - Optional plural form
 * @returns Formatted string
 */
export function formatCount(count: number, singular: string, plural?: string): string {
  return `${count} ${pluralize(count, singular, plural)}`;
}

/**
 * Join list with "and": ["a", "b", "c"] → "a, b, and c"
 *
 * @param items - Items to join
 * @returns Joined string with Oxford comma
 */
export function joinWithAnd(items: string[]): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0]!;
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

/**
 * Join list with "or": ["a", "b", "c"] → "a, b, or c"
 *
 * @param items - Items to join
 * @returns Joined string
 */
export function joinWithOr(items: string[]): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0]!;
  if (items.length === 2) return `${items[0]} or ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, or ${items[items.length - 1]}`;
}

/**
 * Truncate with ellipsis: "Hello world" → "Hello wo..."
 *
 * @param str - String to truncate
 * @param maxLength - Maximum length
 * @returns Truncated string
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

/**
 * Convert kebab-case to Title Case: "some-value" → "Some Value"
 *
 * @param str - Kebab-case string
 * @returns Title-cased string
 */
export function kebabToTitle(str: string): string {
  return str
    .split('-')
    .map(capitalize)
    .join(' ');
}

/**
 * Convert camelCase to Title Case: "someValue" → "Some Value"
 *
 * @param str - CamelCase string
 * @returns Title-cased string
 */
export function camelToTitle(str: string): string {
  return str
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

// ---------------------------------------------------------------------------
// Stamina/Resource Display
// ---------------------------------------------------------------------------

/**
 * Format stamina display: "15/30" or "15/30 (+5)"
 *
 * @param current - Current stamina
 * @param max - Maximum stamina
 * @param temp - Temporary stamina
 * @returns Formatted string
 */
export function formatStamina(current: number, max: number, temp = 0): string {
  let str = `${current}/${max}`;
  if (temp > 0) {
    str += ` (+${temp})`;
  }
  return str;
}

/**
 * Format resource display: "●●●○○" (3/5)
 *
 * @param current - Current value
 * @param max - Maximum value
 * @param filledChar - Character for filled
 * @param emptyChar - Character for empty
 * @returns Formatted string
 */
export function formatResourcePips(
  current: number,
  max: number,
  filledChar = '●',
  emptyChar = '○'
): string {
  const filled = Math.max(0, Math.min(current, max));
  const empty = max - filled;
  return filledChar.repeat(filled) + emptyChar.repeat(empty);
}

// ---------------------------------------------------------------------------
// Entity Display
// ---------------------------------------------------------------------------

/**
 * Format entity level: "Lvl 5" or "Level 5"
 *
 * @param level - Entity level
 * @param abbreviated - Use "Lvl" instead of "Level"
 * @returns Formatted string
 */
export function formatLevel(level: number, abbreviated = true): string {
  return abbreviated ? `Lvl ${level}` : `Level ${level}`;
}

/**
 * Format monster type label: "Lvl 5 Brute" or "Lvl 1 Minion Harrier"
 *
 * @param level - Monster level
 * @param organization - Organization (minion, band, troop, leader, solo)
 * @param role - Role (ambusher, artillery, brute, etc.)
 * @returns Formatted string
 */
export function formatMonsterType(
  level: number,
  organization?: string,
  role?: string
): string {
  const parts: string[] = [formatLevel(level)];

  if (organization === 'solo') {
    parts.push('Solo');
  } else {
    if (organization && organization !== 'troop') {
      parts.push(capitalize(organization));
    }
    if (role) {
      parts.push(capitalize(role));
    }
  }

  return parts.join(' ');
}
