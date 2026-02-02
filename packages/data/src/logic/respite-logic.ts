/**
 * Respite Logic
 *
 * Pure functions for respite scene calculations.
 * Handles project progress, victory conversion, and recovery tracking.
 *
 * Reference: Draw Steel Respite rules
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Respite activity types.
 */
export type RespiteActivityType =
  | 'recover'
  | 'craft'
  | 'research'
  | 'socialize'
  | 'change_kit'
  | 'project'
  | 'custom';

/**
 * Project progress summary.
 */
export interface ProjectSummary {
  id: string;
  goalPoints: number;
  currentPoints: number;
}

/**
 * Hero recovery status.
 */
export interface RecoverySummary {
  currentStamina: number;
  maxStamina: number;
  currentRecoveries: number;
  maxRecoveries: number;
  victories: number;
  activityComplete: boolean;
}

/**
 * Project roll result.
 */
export interface ProjectRollResult {
  points: number;
  newTotal: number;
  isComplete: boolean;
  progressPercent: number;
}

/**
 * Respite completion result.
 */
export interface RespiteCompletionResult {
  staminaRestored: number;
  recoveriesRestored: number;
  xpGained: number;
}

// ---------------------------------------------------------------------------
// Project Progress
// ---------------------------------------------------------------------------

/**
 * Calculate project points from a roll.
 * In Draw Steel, the roll total (minimum 1) becomes project points.
 *
 * @param rollTotal - Roll total (2d10 + characteristic)
 * @returns Project points (minimum 1)
 */
export function calculateProjectPoints(rollTotal: number): number {
  return Math.max(1, rollTotal);
}

/**
 * Apply project progress and return result.
 *
 * @param project - Project summary
 * @param rollTotal - Roll total
 * @returns Project roll result
 */
export function applyProjectProgress(
  project: ProjectSummary,
  rollTotal: number
): ProjectRollResult {
  const points = calculateProjectPoints(rollTotal);
  const newTotal = Math.min(project.goalPoints, project.currentPoints + points);
  const isComplete = newTotal >= project.goalPoints;
  const progressPercent = Math.round((newTotal / project.goalPoints) * 100);

  return {
    points,
    newTotal,
    isComplete,
    progressPercent,
  };
}

/**
 * Get project progress percentage.
 *
 * @param currentPoints - Current accumulated points
 * @param goalPoints - Points needed to complete
 * @returns Progress percentage (0-100)
 */
export function getProjectProgress(currentPoints: number, goalPoints: number): number {
  if (goalPoints <= 0) return 100;
  return Math.min(100, Math.round((currentPoints / goalPoints) * 100));
}

/**
 * Get remaining points needed to complete a project.
 *
 * @param currentPoints - Current accumulated points
 * @param goalPoints - Points needed to complete
 * @returns Remaining points needed
 */
export function getRemainingProjectPoints(
  currentPoints: number,
  goalPoints: number
): number {
  return Math.max(0, goalPoints - currentPoints);
}

/**
 * Check if project is complete.
 *
 * @param currentPoints - Current accumulated points
 * @param goalPoints - Points needed to complete
 * @returns True if project is complete
 */
export function isProjectComplete(currentPoints: number, goalPoints: number): boolean {
  return currentPoints >= goalPoints;
}

// ---------------------------------------------------------------------------
// Victory Conversion
// ---------------------------------------------------------------------------

/**
 * Convert victories to XP at end of respite.
 * In Draw Steel, 1 Victory = 1 XP during respite.
 *
 * @param victories - Current victories
 * @returns XP gained
 */
export function victoriesToXP(victories: number): number {
  return Math.max(0, victories);
}

/**
 * Calculate XP needed for next level.
 * Draw Steel uses a flat 10 XP per level.
 *
 * @param currentLevel - Current hero level
 * @returns XP needed for next level
 */
export function getXPForNextLevel(_currentLevel: number): number {
  // Draw Steel: 10 XP per level
  return 10;
}

/**
 * Calculate progress toward next level.
 *
 * @param currentXP - Current XP
 * @param xpNeeded - XP needed for level
 * @returns Progress percentage (0-100)
 */
export function getLevelProgress(currentXP: number, xpNeeded: number): number {
  if (xpNeeded <= 0) return 100;
  return Math.min(100, Math.round((currentXP / xpNeeded) * 100));
}

// ---------------------------------------------------------------------------
// Recovery Calculations
// ---------------------------------------------------------------------------

/**
 * Calculate respite completion benefits for a hero.
 *
 * At end of respite:
 * - Stamina restored to max
 * - All recoveries restored
 * - Victories converted to XP
 *
 * @param recovery - Hero recovery status
 * @returns Respite completion result
 */
export function calculateRespiteCompletion(
  recovery: RecoverySummary
): RespiteCompletionResult {
  return {
    staminaRestored: recovery.maxStamina - recovery.currentStamina,
    recoveriesRestored: recovery.maxRecoveries - recovery.currentRecoveries,
    xpGained: victoriesToXP(recovery.victories),
  };
}

/**
 * Check if all heroes have completed their activities.
 *
 * @param heroes - Array of hero recovery statuses
 * @returns True if all activities are complete
 */
export function areAllActivitiesComplete(heroes: RecoverySummary[]): boolean {
  return heroes.every((h) => h.activityComplete);
}

/**
 * Count heroes who have completed their activities.
 *
 * @param heroes - Array of hero recovery statuses
 * @returns Number of completed activities
 */
export function getCompletedActivityCount(heroes: RecoverySummary[]): number {
  return heroes.filter((h) => h.activityComplete).length;
}

/**
 * Get respite progress percentage.
 *
 * @param heroes - Array of hero recovery statuses
 * @returns Progress percentage (0-100)
 */
export function getRespiteProgress(heroes: RecoverySummary[]): number {
  if (heroes.length === 0) return 100;
  return Math.round((getCompletedActivityCount(heroes) / heroes.length) * 100);
}

// ---------------------------------------------------------------------------
// Activity Validation
// ---------------------------------------------------------------------------

/**
 * Check if a hero can select an activity.
 *
 * @param activityComplete - Whether hero has completed an activity
 * @returns True if hero can select
 */
export function canSelectActivity(activityComplete: boolean): boolean {
  // In Draw Steel, each hero can only do one activity per respite
  return !activityComplete;
}

/**
 * Get available activity types for a hero.
 * Standard activities are always available.
 *
 * @returns List of standard activity types
 */
export function getStandardActivities(): RespiteActivityType[] {
  return ['recover', 'craft', 'research', 'socialize', 'change_kit'];
}

// ---------------------------------------------------------------------------
// Stamina Recovery
// ---------------------------------------------------------------------------

/**
 * Calculate stamina restored by the Recover activity.
 * Uses one recovery to restore stamina.
 *
 * @param currentStamina - Current stamina
 * @param maxStamina - Maximum stamina
 * @param recoveryValue - Recovery value (floor(maxStamina/3))
 * @param currentRecoveries - Current recoveries available
 * @returns Amount of stamina restored (0 if no recoveries)
 */
export function calculateRecoverStamina(
  currentStamina: number,
  maxStamina: number,
  recoveryValue: number,
  currentRecoveries: number
): number {
  if (currentRecoveries <= 0) return 0;
  if (currentStamina >= maxStamina) return 0;

  const restored = Math.min(recoveryValue, maxStamina - currentStamina);
  return restored;
}

/**
 * Check if hero can use the Recover activity.
 *
 * @param currentStamina - Current stamina
 * @param maxStamina - Maximum stamina
 * @param currentRecoveries - Current recoveries
 * @returns True if hero can recover
 */
export function canUseRecoverActivity(
  currentStamina: number,
  maxStamina: number,
  currentRecoveries: number
): boolean {
  return currentRecoveries > 0 && currentStamina < maxStamina;
}

// ---------------------------------------------------------------------------
// Total XP Calculation
// ---------------------------------------------------------------------------

/**
 * Calculate total XP gained across all heroes.
 *
 * @param heroes - Array of hero recovery statuses
 * @returns Total XP gained from victories
 */
export function getTotalXPGained(heroes: RecoverySummary[]): number {
  return heroes.reduce((sum, h) => sum + victoriesToXP(h.victories), 0);
}

/**
 * Calculate total victories across all heroes.
 *
 * @param heroes - Array of hero recovery statuses
 * @returns Total victories
 */
export function getTotalVictories(heroes: RecoverySummary[]): number {
  return heroes.reduce((sum, h) => sum + h.victories, 0);
}
