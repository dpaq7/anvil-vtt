/**
 * Montage Logic
 *
 * Pure functions for montage scene calculations.
 * Handles success/failure limits, outcomes, and challenge unlocks.
 *
 * Reference: Draw Steel Montage rules
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Montage outcome states.
 */
export type MontageOutcome = 'pending' | 'total_success' | 'partial_success' | 'total_failure';

/**
 * Challenge unlock condition types.
 */
export type UnlockType = 'none' | 'any_of' | 'all_of';

/**
 * Challenge unlock condition.
 */
export interface ChallengeUnlock {
  type: UnlockType;
  challengeIds?: string[];
}

/**
 * Runtime challenge info for unlock checking.
 */
export interface ChallengeSummary {
  id: string;
  completed: boolean;
  unlock: ChallengeUnlock;
}

/**
 * Montage state summary for calculations.
 */
export interface MontageStateSummary {
  baseSuccessLimit: number;
  baseFailureLimit: number;
  heroCountAdjustment: boolean;
  currentSuccesses: number;
  currentFailures: number;
}

/**
 * Montage test result.
 */
export type MontageTestResult =
  | 'success'
  | 'success_consequence'
  | 'success_reward'
  | 'failure'
  | 'failure_consequence';

/**
 * Assist roll result.
 */
export type AssistResult = 'bane' | 'edge' | 'double_edge';

// ---------------------------------------------------------------------------
// Limit Calculations
// ---------------------------------------------------------------------------

/**
 * Calculate effective success limit based on hero count.
 * When heroCountAdjustment is enabled, limits scale with party size.
 *
 * Formula: base + (heroCount - 5), minimum 2
 *
 * @param state - Montage state summary
 * @param heroCount - Number of heroes in montage
 * @returns Effective success limit
 */
export function getEffectiveSuccessLimit(
  state: MontageStateSummary,
  heroCount: number
): number {
  if (!state.heroCountAdjustment) {
    return state.baseSuccessLimit;
  }

  return Math.max(2, state.baseSuccessLimit + (heroCount - 5));
}

/**
 * Calculate effective failure limit based on hero count.
 * When heroCountAdjustment is enabled, limits scale with party size.
 *
 * Formula: base + (heroCount - 5), minimum 2
 *
 * @param state - Montage state summary
 * @param heroCount - Number of heroes in montage
 * @returns Effective failure limit
 */
export function getEffectiveFailureLimit(
  state: MontageStateSummary,
  heroCount: number
): number {
  if (!state.heroCountAdjustment) {
    return state.baseFailureLimit;
  }

  return Math.max(2, state.baseFailureLimit + (heroCount - 5));
}

// ---------------------------------------------------------------------------
// Outcome Calculation
// ---------------------------------------------------------------------------

/**
 * Calculate montage outcome based on current progress.
 *
 * - Total success: successes >= successLimit
 * - Total failure: failures >= failureLimit
 * - Partial success: both limits reached simultaneously
 * - Pending: neither limit reached
 *
 * @param successes - Current successes
 * @param failures - Current failures
 * @param successLimit - Required successes for total success
 * @param failureLimit - Allowed failures before total failure
 * @returns Montage outcome
 */
export function calculateOutcome(
  successes: number,
  failures: number,
  successLimit: number,
  failureLimit: number
): MontageOutcome {
  const hitSuccess = successes >= successLimit;
  const hitFailure = failures >= failureLimit;

  // Partial success: achieved goal but also hit failure limit
  if (hitSuccess && hitFailure) return 'partial_success';
  if (hitSuccess) return 'total_success';
  if (hitFailure) return 'total_failure';
  return 'pending';
}

/**
 * Check if montage is complete (any outcome reached).
 *
 * @param outcome - Current outcome
 * @returns True if montage is complete
 */
export function isMontageComplete(outcome: MontageOutcome): boolean {
  return outcome !== 'pending';
}

/**
 * Get outcome description.
 *
 * @param outcome - Montage outcome
 * @returns Human-readable outcome description
 */
export function getOutcomeDescription(outcome: MontageOutcome): string {
  switch (outcome) {
    case 'total_success':
      return 'Total Success';
    case 'partial_success':
      return 'Partial Success';
    case 'total_failure':
      return 'Total Failure';
    case 'pending':
      return 'In Progress';
  }
}

// ---------------------------------------------------------------------------
// Challenge Unlock Logic
// ---------------------------------------------------------------------------

/**
 * Check if a challenge is unlocked based on prerequisites.
 *
 * - 'none': Always unlocked
 * - 'any_of': Unlocked if any prerequisite is completed
 * - 'all_of': Unlocked if all prerequisites are completed
 *
 * @param challenge - Challenge to check
 * @param allChallenges - All challenges for prereq lookup
 * @returns True if challenge is unlocked
 */
export function isChallengeUnlocked(
  challenge: ChallengeSummary,
  allChallenges: ChallengeSummary[]
): boolean {
  const { unlock } = challenge;

  // No unlock condition - always available
  if (unlock.type === 'none') return true;

  // Check prerequisites
  const prereqIds = unlock.challengeIds || [];
  if (prereqIds.length === 0) return true;

  const prereqs = allChallenges.filter((c) => prereqIds.includes(c.id));

  if (unlock.type === 'any_of') {
    return prereqs.some((c) => c.completed);
  }

  if (unlock.type === 'all_of') {
    return prereqs.every((c) => c.completed);
  }

  return true;
}

/**
 * Get unlocked challenges from a list.
 *
 * @param challenges - All challenges
 * @returns Unlocked, incomplete challenges
 */
export function getUnlockedChallenges<T extends ChallengeSummary>(
  challenges: T[]
): T[] {
  return challenges.filter(
    (c) => isChallengeUnlocked(c, challenges) && !c.completed
  );
}

/**
 * Get locked challenges from a list.
 *
 * @param challenges - All challenges
 * @returns Locked challenges
 */
export function getLockedChallenges<T extends ChallengeSummary>(
  challenges: T[]
): T[] {
  return challenges.filter((c) => !isChallengeUnlocked(c, challenges));
}

/**
 * Get completed challenges from a list.
 *
 * @param challenges - All challenges
 * @returns Completed challenges
 */
export function getCompletedChallenges<T extends ChallengeSummary>(
  challenges: T[]
): T[] {
  return challenges.filter((c) => c.completed);
}

// ---------------------------------------------------------------------------
// Test Result Calculations
// ---------------------------------------------------------------------------

/**
 * Determine test result based on roll total.
 *
 * Draw Steel tiers:
 * - Tier 1 (≤11): Failure
 * - Tier 2 (12-16): Success
 * - Tier 3 (17+): Success with reward
 *
 * @param total - Roll total (2d10 + characteristic)
 * @param hasConsequence - Whether this roll has a consequence attached
 * @returns Test result
 */
export function getTestResult(
  total: number,
  hasConsequence = false
): MontageTestResult {
  if (total >= 17) {
    return hasConsequence ? 'success_consequence' : 'success_reward';
  }
  if (total >= 12) {
    return hasConsequence ? 'success_consequence' : 'success';
  }
  return hasConsequence ? 'failure_consequence' : 'failure';
}

/**
 * Check if a test result is a success.
 *
 * @param result - Test result
 * @returns True if result is a success variant
 */
export function isTestSuccess(result: MontageTestResult): boolean {
  return result.startsWith('success');
}

/**
 * Determine assist result based on roll total.
 *
 * - Tier 1 (≤11): Bane
 * - Tier 2 (12-16): Edge
 * - Tier 3 (17+): Double edge
 *
 * @param total - Roll total
 * @returns Assist result
 */
export function getAssistResult(total: number): AssistResult {
  if (total >= 17) return 'double_edge';
  if (total >= 12) return 'edge';
  return 'bane';
}

// ---------------------------------------------------------------------------
// Hero Availability
// ---------------------------------------------------------------------------

/**
 * Get available heroes for the current round.
 * Heroes can only test once per round.
 *
 * @param heroIds - All hero IDs
 * @param testedHeroIds - Heroes who have tested this round
 * @returns Available hero IDs
 */
export function getAvailableHeroIds(
  heroIds: string[],
  testedHeroIds: string[]
): string[] {
  const testedSet = new Set(testedHeroIds);
  return heroIds.filter((id) => !testedSet.has(id));
}

/**
 * Get heroes available for the current round with details.
 *
 * @param heroes - All heroes with id and name
 * @param testedHeroIds - Heroes who have tested this round
 * @returns Available heroes
 */
export function getAvailableHeroes<T extends { id: string }>(
  heroes: T[],
  testedHeroIds: string[]
): T[] {
  const testedSet = new Set(testedHeroIds);
  return heroes.filter((h) => !testedSet.has(h.id));
}

// ---------------------------------------------------------------------------
// Progress Calculation
// ---------------------------------------------------------------------------

/**
 * Calculate progress percentage toward success.
 *
 * @param successes - Current successes
 * @param successLimit - Required successes
 * @returns Progress percentage (0-100)
 */
export function getSuccessProgress(successes: number, successLimit: number): number {
  if (successLimit <= 0) return 100;
  return Math.min(100, Math.round((successes / successLimit) * 100));
}

/**
 * Calculate "danger" percentage toward failure.
 *
 * @param failures - Current failures
 * @param failureLimit - Allowed failures
 * @returns Danger percentage (0-100)
 */
export function getFailureProgress(failures: number, failureLimit: number): number {
  if (failureLimit <= 0) return 100;
  return Math.min(100, Math.round((failures / failureLimit) * 100));
}

/**
 * Get remaining successes needed.
 *
 * @param successes - Current successes
 * @param successLimit - Required successes
 * @returns Remaining successes needed
 */
export function getRemainingSuccesses(successes: number, successLimit: number): number {
  return Math.max(0, successLimit - successes);
}

/**
 * Get remaining failures allowed.
 *
 * @param failures - Current failures
 * @param failureLimit - Allowed failures
 * @returns Remaining failures allowed
 */
export function getRemainingFailures(failures: number, failureLimit: number): number {
  return Math.max(0, failureLimit - failures);
}
