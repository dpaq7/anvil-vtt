/**
 * Entity Status Logic
 *
 * Pure functions for entity stamina display, health status, and visual presentation.
 * Consolidates duplicate calculations from StaminaBar, EntityCard, PartyMemberCard, ResourceTracker.
 *
 * Reference: Draw Steel stamina rules and Anvil UI patterns.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Health status based on stamina thresholds.
 * - healthy: current > winded threshold
 * - injured: current <= max but > winded
 * - winded: current <= floor(max/2)
 * - dying: current <= 0
 * - dead: current <= negative winded threshold
 */
export type HealthStatus = 'healthy' | 'injured' | 'winded' | 'dying' | 'dead';

/**
 * Stamina bar color for visual display.
 */
export type StaminaColor = 'green' | 'yellow' | 'orange' | 'red' | 'black';

/**
 * CSS color variable names for stamina states.
 */
export type StaminaColorVar =
  | 'var(--status-success)'
  | 'var(--status-warning)'
  | 'var(--status-caution)'
  | 'var(--status-danger)'
  | 'var(--status-critical)';

/**
 * Entity type for display purposes.
 */
export type EntityType = 'hero' | 'monster' | 'companion' | 'minion' | 'npc' | 'object' | 'terrain';

/**
 * Color associated with entity type.
 */
export type EntityTypeColor = 'blue' | 'red' | 'purple' | 'green' | 'yellow' | 'gray';

/**
 * Pip display calculation result.
 */
export interface PipDisplay {
  filled: number;
  empty: number;
  overflow: number;
  displayLimit: number;
  hasOverflow: boolean;
}

/**
 * Entity display info for cards/lists.
 */
export interface EntityDisplayInfo {
  title: string;
  subtitle: string;
  typeLabel: string;
  typeColor: EntityTypeColor;
}

// ---------------------------------------------------------------------------
// Stamina Display
// ---------------------------------------------------------------------------

/**
 * Calculate stamina as percentage (0-100).
 * Clamps to valid range and handles edge cases.
 *
 * @param current - Current stamina value
 * @param max - Maximum stamina value
 * @returns Percentage (0-100)
 */
export function getStaminaPercentage(current: number, max: number): number {
  if (max <= 0) return 0;
  if (current <= 0) return 0;
  if (current >= max) return 100;
  return Math.round((current / max) * 100);
}

/**
 * Get winded threshold (floor of max/2).
 * Draw Steel rule: winded when stamina <= half max.
 *
 * @param max - Maximum stamina
 * @returns Winded threshold
 */
export function getWindedThreshold(max: number): number {
  return Math.floor(max / 2);
}

/**
 * Get death threshold (negative winded value).
 * Draw Steel rule: dead when stamina <= negative winded threshold.
 *
 * @param max - Maximum stamina
 * @returns Death threshold (negative number)
 */
export function getDeathThreshold(max: number): number {
  return -getWindedThreshold(max);
}

/**
 * Check if entity is winded.
 *
 * @param current - Current stamina
 * @param max - Maximum stamina
 * @returns True if winded (current <= max/2)
 */
export function isWinded(current: number, max: number): boolean {
  return current <= getWindedThreshold(max);
}

/**
 * Check if entity is dying.
 *
 * @param current - Current stamina
 * @returns True if dying (current <= 0)
 */
export function isDying(current: number): boolean {
  return current <= 0;
}

/**
 * Check if entity is dead.
 *
 * @param current - Current stamina
 * @param max - Maximum stamina
 * @returns True if dead (current <= negative winded threshold)
 */
export function isDead(current: number, max: number): boolean {
  return current <= getDeathThreshold(max);
}

/**
 * Get health status based on stamina.
 *
 * @param current - Current stamina
 * @param max - Maximum stamina
 * @returns Health status
 */
export function getHealthStatus(current: number, max: number): HealthStatus {
  if (current <= getDeathThreshold(max)) return 'dead';
  if (current <= 0) return 'dying';
  if (current <= getWindedThreshold(max)) return 'winded';
  if (current < max) return 'injured';
  return 'healthy';
}

/**
 * Get human-readable label for health status.
 *
 * @param status - Health status
 * @returns Display label
 */
export function getHealthStatusLabel(status: HealthStatus): string {
  switch (status) {
    case 'healthy':
      return 'Healthy';
    case 'injured':
      return 'Injured';
    case 'winded':
      return 'Winded';
    case 'dying':
      return 'Dying';
    case 'dead':
      return 'Dead';
  }
}

/**
 * Get color for stamina bar based on current/max.
 *
 * @param current - Current stamina
 * @param max - Maximum stamina
 * @returns Stamina color name
 */
export function getStaminaColor(current: number, max: number): StaminaColor {
  if (current <= getDeathThreshold(max)) return 'black';
  if (current <= 0) return 'red';
  const percentage = getStaminaPercentage(current, max);
  if (percentage <= 25) return 'orange';
  if (percentage <= 50) return 'yellow';
  return 'green';
}

/**
 * Get CSS variable for stamina color.
 * Maps to theme variables used in Anvil UI.
 *
 * @param current - Current stamina
 * @param max - Maximum stamina
 * @returns CSS variable string
 */
export function getStaminaColorVar(current: number, max: number): StaminaColorVar {
  const color = getStaminaColor(current, max);
  switch (color) {
    case 'green':
      return 'var(--status-success)';
    case 'yellow':
      return 'var(--status-warning)';
    case 'orange':
      return 'var(--status-caution)';
    case 'red':
      return 'var(--status-danger)';
    case 'black':
      return 'var(--status-critical)';
  }
}

/**
 * Get Tailwind classes for stamina color.
 *
 * @param current - Current stamina
 * @param max - Maximum stamina
 * @returns Tailwind color classes
 */
export function getStaminaColorClass(current: number, max: number): string {
  const color = getStaminaColor(current, max);
  switch (color) {
    case 'green':
      return 'text-emerald-500 bg-emerald-500';
    case 'yellow':
      return 'text-amber-500 bg-amber-500';
    case 'orange':
      return 'text-orange-500 bg-orange-500';
    case 'red':
      return 'text-red-500 bg-red-500';
    case 'black':
      return 'text-neutral-900 bg-neutral-900';
  }
}

/**
 * Format stamina for display.
 *
 * @param current - Current stamina
 * @param max - Maximum stamina
 * @param temp - Temporary stamina (optional)
 * @returns Formatted string (e.g., "15/30" or "15/30 (+5)")
 */
export function formatStamina(current: number, max: number, temp?: number): string {
  const base = `${current}/${max}`;
  if (temp && temp > 0) {
    return `${base} (+${temp})`;
  }
  return base;
}

// ---------------------------------------------------------------------------
// Entity Display
// ---------------------------------------------------------------------------

/**
 * Get color associated with entity type.
 *
 * @param entityType - Type of entity
 * @returns Color name
 */
export function getEntityTypeColor(entityType: EntityType): EntityTypeColor {
  switch (entityType) {
    case 'hero':
      return 'blue';
    case 'monster':
      return 'red';
    case 'companion':
      return 'purple';
    case 'minion':
      return 'green';
    case 'npc':
      return 'yellow';
    case 'object':
    case 'terrain':
      return 'gray';
    default:
      return 'gray';
  }
}

/**
 * Get Tailwind classes for entity type color.
 *
 * @param entityType - Type of entity
 * @returns Tailwind color classes
 */
export function getEntityTypeColorClass(entityType: EntityType): string {
  const color = getEntityTypeColor(entityType);
  switch (color) {
    case 'blue':
      return 'text-blue-500 bg-blue-500/10 border-blue-500/30';
    case 'red':
      return 'text-red-500 bg-red-500/10 border-red-500/30';
    case 'purple':
      return 'text-purple-500 bg-purple-500/10 border-purple-500/30';
    case 'green':
      return 'text-green-500 bg-green-500/10 border-green-500/30';
    case 'yellow':
      return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30';
    case 'gray':
      return 'text-neutral-400 bg-neutral-500/10 border-neutral-500/30';
  }
}

/**
 * Get human-readable label for entity type.
 *
 * @param entityType - Type of entity
 * @returns Display label
 */
export function getEntityTypeLabel(entityType: EntityType): string {
  switch (entityType) {
    case 'hero':
      return 'Hero';
    case 'monster':
      return 'Monster';
    case 'companion':
      return 'Companion';
    case 'minion':
      return 'Minion';
    case 'npc':
      return 'NPC';
    case 'object':
      return 'Object';
    case 'terrain':
      return 'Terrain';
    default:
      return 'Unknown';
  }
}

/**
 * Generate subtitle for hero display.
 * Format: "Level N Ancestry Class"
 *
 * @param level - Hero level
 * @param ancestry - Ancestry name
 * @param heroClass - Class name
 * @returns Formatted subtitle
 */
export function getHeroSubtitle(
  level: number,
  ancestry?: string | null,
  heroClass?: string | null
): string {
  const parts = [`Level ${level}`];
  if (ancestry) parts.push(ancestry);
  if (heroClass) parts.push(heroClass);
  return parts.join(' ');
}

/**
 * Generate subtitle for monster display.
 * Format: "Level N Role"
 *
 * @param level - Monster level
 * @param role - Monster role (Brute, Support, etc.)
 * @returns Formatted subtitle
 */
export function getMonsterSubtitle(level: number, role?: string | null): string {
  return role ? `Level ${level} ${role}` : `Level ${level}`;
}

/**
 * Generate subtitle for any entity type.
 *
 * @param entityType - Type of entity
 * @param data - Entity-specific data
 * @returns Formatted subtitle
 */
export function getEntitySubtitle(
  entityType: EntityType,
  data: {
    level?: number;
    ancestry?: string | null;
    heroClass?: string | null;
    role?: string | null;
  }
): string {
  const level = data.level ?? 1;

  switch (entityType) {
    case 'hero':
      return getHeroSubtitle(level, data.ancestry, data.heroClass);
    case 'monster':
      return getMonsterSubtitle(level, data.role);
    case 'companion':
      return `Level ${level} Companion`;
    case 'minion':
      return `Level ${level} Minion`;
    case 'npc':
      return 'NPC';
    default:
      return '';
  }
}

// ---------------------------------------------------------------------------
// Resource Display (Recoveries, Heroic Resource, etc.)
// ---------------------------------------------------------------------------

/**
 * Calculate pip display for resources with visual limit.
 * Handles overflow when resource exceeds display limit.
 *
 * @param current - Current resource value
 * @param max - Maximum resource value
 * @param displayLimit - Max pips to show (default 10)
 * @returns Pip display calculation
 */
export function calculatePipDisplay(
  current: number,
  max: number,
  displayLimit = 10
): PipDisplay {
  const effectiveMax = Math.min(max, displayLimit);
  const effectiveCurrent = Math.min(current, effectiveMax);
  const overflow = Math.max(0, current - displayLimit);

  return {
    filled: Math.max(0, effectiveCurrent),
    empty: Math.max(0, effectiveMax - effectiveCurrent),
    overflow,
    displayLimit,
    hasOverflow: overflow > 0,
  };
}

/**
 * Format resource as "X / Y" string.
 *
 * @param current - Current value
 * @param max - Maximum value
 * @returns Formatted string
 */
export function formatResource(current: number, max: number): string {
  return `${current} / ${max}`;
}

/**
 * Format resource as compact "X/Y" string.
 *
 * @param current - Current value
 * @param max - Maximum value
 * @returns Compact formatted string
 */
export function formatResourceCompact(current: number, max: number): string {
  return `${current}/${max}`;
}

// ---------------------------------------------------------------------------
// Condition Display
// ---------------------------------------------------------------------------

/**
 * Condition severity for sorting and display.
 */
export type ConditionSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Get severity of a condition.
 * Higher severity conditions should be displayed more prominently.
 *
 * @param conditionName - Name of the condition
 * @returns Severity level
 */
export function getConditionSeverity(conditionName: string): ConditionSeverity {
  const name = conditionName.toLowerCase();

  // Critical conditions
  if (['dying', 'dead', 'unconscious'].includes(name)) {
    return 'critical';
  }

  // High severity
  if (['bleeding', 'restrained', 'stunned', 'paralyzed'].includes(name)) {
    return 'high';
  }

  // Medium severity
  if (['dazed', 'frightened', 'grabbed', 'prone', 'slowed', 'weakened'].includes(name)) {
    return 'medium';
  }

  // Low severity
  return 'low';
}

/**
 * Get color for condition badge.
 *
 * @param conditionName - Name of the condition
 * @returns Tailwind color classes
 */
export function getConditionColorClass(conditionName: string): string {
  const severity = getConditionSeverity(conditionName);
  switch (severity) {
    case 'critical':
      return 'bg-red-600 text-white';
    case 'high':
      return 'bg-orange-500 text-white';
    case 'medium':
      return 'bg-amber-500 text-black';
    case 'low':
      return 'bg-neutral-500 text-white';
  }
}

/**
 * Sort conditions by severity (most severe first).
 *
 * @param conditions - Array of condition names
 * @returns Sorted array
 */
export function sortConditionsBySeverity(conditions: string[]): string[] {
  const severityOrder: Record<ConditionSeverity, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };

  return [...conditions].sort((a, b) => {
    return severityOrder[getConditionSeverity(a)] - severityOrder[getConditionSeverity(b)];
  });
}

/**
 * Get abbreviated condition list for compact display.
 *
 * @param conditions - Array of condition names
 * @param maxDisplay - Max conditions to show
 * @returns Summary string (e.g., "Bleeding, Dazed, +2 more")
 */
export function getConditionSummary(conditions: string[], maxDisplay = 2): string {
  if (conditions.length === 0) return '';

  const sorted = sortConditionsBySeverity(conditions);
  const shown = sorted.slice(0, maxDisplay);
  const remaining = conditions.length - maxDisplay;

  if (remaining > 0) {
    return `${shown.join(', ')}, +${remaining} more`;
  }
  return shown.join(', ');
}
