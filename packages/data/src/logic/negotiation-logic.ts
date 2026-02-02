/**
 * Negotiation Logic
 *
 * Pure functions for negotiation scene calculations.
 * Handles interest/patience changes, outcome determination, and motivation effects.
 *
 * Reference: Draw Steel Negotiation rules
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Negotiation phase states.
 */
export type NegotiationPhase = 'active' | 'success' | 'failure';

/**
 * NPC starting attitude.
 */
export type NPCAttitude = 'hostile' | 'unfriendly' | 'neutral' | 'friendly' | 'helpful';

/**
 * Roll tier (1, 2, or 3).
 */
export type Tier = 1 | 2 | 3;

/**
 * Interest change result.
 */
export interface InterestChangeResult {
  delta: number;
  reason: string;
}

/**
 * Patience change result.
 */
export interface PatienceChangeResult {
  delta: number;
  reason: string;
}

/**
 * Argument result summary.
 */
export interface ArgumentResult {
  interestChange: number;
  patienceChange: number;
  tier: Tier;
  usedMotivation: boolean;
  hitPitfall: boolean;
}

// ---------------------------------------------------------------------------
// Tier Calculation
// ---------------------------------------------------------------------------

/**
 * Get tier from roll total.
 *
 * - Tier 1: ≤11
 * - Tier 2: 12-16
 * - Tier 3: 17+
 *
 * @param total - Roll total (2d10 + characteristic)
 * @returns Tier
 */
export function getTier(total: number): Tier {
  if (total >= 17) return 3;
  if (total >= 12) return 2;
  return 1;
}

// ---------------------------------------------------------------------------
// Interest Calculations
// ---------------------------------------------------------------------------

/**
 * Calculate interest change from an argument.
 *
 * Draw Steel rules:
 * - Tier 1: No interest change
 * - Tier 2: +1 interest
 * - Tier 3: +2 interest
 * - Using motivation: +1 additional interest
 *
 * @param tier - Roll tier
 * @param usedMotivation - Whether argument appealed to a motivation
 * @returns Interest change
 */
export function getInterestChange(tier: Tier, usedMotivation: boolean): number {
  let change = 0;

  switch (tier) {
    case 3:
      change = 2;
      break;
    case 2:
      change = 1;
      break;
    case 1:
      change = 0;
      break;
  }

  // Motivation bonus
  if (usedMotivation && tier >= 2) {
    change += 1;
  }

  return change;
}

/**
 * Get interest change with detailed reason.
 *
 * @param tier - Roll tier
 * @param usedMotivation - Whether argument appealed to a motivation
 * @returns Interest change result
 */
export function getInterestChangeResult(
  tier: Tier,
  usedMotivation: boolean
): InterestChangeResult {
  const delta = getInterestChange(tier, usedMotivation);

  let reason = '';
  if (tier === 3) {
    reason = 'Tier 3 result (+2)';
  } else if (tier === 2) {
    reason = 'Tier 2 result (+1)';
  } else {
    reason = 'Tier 1 result (no change)';
  }

  if (usedMotivation && tier >= 2) {
    reason += ', appealed to motivation (+1)';
  }

  return { delta, reason };
}

// ---------------------------------------------------------------------------
// Patience Calculations
// ---------------------------------------------------------------------------

/**
 * Calculate patience change from an argument.
 *
 * Draw Steel rules:
 * - Tier 1: -1 patience
 * - Tier 2+: No patience change
 * - Hitting pitfall: Additional patience loss (default -1)
 *
 * @param tier - Roll tier
 * @param hitPitfall - Whether argument triggered a pitfall
 * @param pitfallLoss - Patience loss from pitfall (default 1)
 * @returns Patience change (negative or zero)
 */
export function getPatienceChange(
  tier: Tier,
  hitPitfall: boolean,
  pitfallLoss = 1
): number {
  let change = 0;

  // Tier 1 loses patience
  if (tier === 1) {
    change = -1;
  }

  // Pitfall damage
  if (hitPitfall) {
    change -= pitfallLoss;
  }

  return change;
}

/**
 * Get patience change with detailed reason.
 *
 * @param tier - Roll tier
 * @param hitPitfall - Whether argument triggered a pitfall
 * @param pitfallLoss - Patience loss from pitfall
 * @returns Patience change result
 */
export function getPatienceChangeResult(
  tier: Tier,
  hitPitfall: boolean,
  pitfallLoss = 1
): PatienceChangeResult {
  const delta = getPatienceChange(tier, hitPitfall, pitfallLoss);

  const reasons: string[] = [];
  if (tier === 1) {
    reasons.push('Tier 1 result (-1)');
  }
  if (hitPitfall) {
    reasons.push(`Triggered pitfall (-${pitfallLoss})`);
  }

  const reason = reasons.length > 0 ? reasons.join(', ') : 'No patience change';
  return { delta, reason };
}

// ---------------------------------------------------------------------------
// Phase Determination
// ---------------------------------------------------------------------------

/**
 * Determine negotiation phase based on current state.
 *
 * - Success: Interest >= target interest
 * - Failure: Patience <= 0
 * - Active: Neither condition met
 *
 * @param interest - Current interest level
 * @param patience - Current patience level
 * @param targetInterest - Interest needed for success
 * @returns Negotiation phase
 */
export function getPhase(
  interest: number,
  patience: number,
  targetInterest: number
): NegotiationPhase {
  if (interest >= targetInterest) return 'success';
  if (patience <= 0) return 'failure';
  return 'active';
}

/**
 * Check if negotiation is complete.
 *
 * @param phase - Current phase
 * @returns True if negotiation is complete
 */
export function isNegotiationComplete(phase: NegotiationPhase): boolean {
  return phase !== 'active';
}

// ---------------------------------------------------------------------------
// Motivation and Edge
// ---------------------------------------------------------------------------

/**
 * Check if using a skill that appeals to a motivation grants an edge.
 *
 * @param motivationType - The motivation type
 * @param skill - Skill being used
 * @returns True if motivation grants edge
 */
export function motivationGivesEdge(
  motivationType: string,
  skill: string
): boolean {
  // In Draw Steel, appealing to a motivation grants an edge on the roll
  // The specific skill doesn't matter - it's about how you frame the argument
  // This function exists for future refinement if specific skills match motivations
  return true;
}

/**
 * Get impression modifier based on NPC attitude.
 *
 * Starting impression affects the negotiation:
 * - Hostile: -2
 * - Unfriendly: -1
 * - Neutral: 0
 * - Friendly: +1
 * - Helpful: +2
 *
 * @param attitude - NPC starting attitude
 * @returns Impression modifier
 */
export function getImpressionModifier(attitude: NPCAttitude): number {
  switch (attitude) {
    case 'hostile':
      return -2;
    case 'unfriendly':
      return -1;
    case 'neutral':
      return 0;
    case 'friendly':
      return 1;
    case 'helpful':
      return 2;
  }
}

/**
 * Get starting interest based on NPC attitude.
 *
 * - Hostile: 0
 * - Unfriendly: 0
 * - Neutral: 0
 * - Friendly: 1
 * - Helpful: 2
 *
 * @param attitude - NPC starting attitude
 * @returns Starting interest
 */
export function getStartingInterest(attitude: NPCAttitude): number {
  switch (attitude) {
    case 'helpful':
      return 2;
    case 'friendly':
      return 1;
    default:
      return 0;
  }
}

/**
 * Get starting patience based on NPC attitude.
 *
 * - Hostile: 3
 * - Unfriendly: 4
 * - Neutral: 5
 * - Friendly: 6
 * - Helpful: 7
 *
 * @param attitude - NPC starting attitude
 * @returns Starting patience
 */
export function getStartingPatience(attitude: NPCAttitude): number {
  switch (attitude) {
    case 'hostile':
      return 3;
    case 'unfriendly':
      return 4;
    case 'neutral':
      return 5;
    case 'friendly':
      return 6;
    case 'helpful':
      return 7;
  }
}

// ---------------------------------------------------------------------------
// Argument Resolution
// ---------------------------------------------------------------------------

/**
 * Process a complete argument and return all changes.
 *
 * @param rollTotal - Roll total (2d10 + characteristic + modifiers)
 * @param usedMotivation - Whether argument appealed to motivation
 * @param hitPitfall - Whether argument triggered a pitfall
 * @param pitfallLoss - Patience loss from pitfall
 * @returns Argument result
 */
export function resolveArgument(
  rollTotal: number,
  usedMotivation: boolean,
  hitPitfall: boolean,
  pitfallLoss = 1
): ArgumentResult {
  const tier = getTier(rollTotal);
  const interestChange = getInterestChange(tier, usedMotivation);
  const patienceChange = getPatienceChange(tier, hitPitfall, pitfallLoss);

  return {
    interestChange,
    patienceChange,
    tier,
    usedMotivation,
    hitPitfall,
  };
}

// ---------------------------------------------------------------------------
// Response Lookup
// ---------------------------------------------------------------------------

/**
 * Get interest level response key.
 *
 * Interest levels map to response types:
 * - 0: "No, and..." (most negative)
 * - 1: "No."
 * - 2: "No, but..."
 * - 3: "Yes, but..."
 * - 4: "Yes."
 * - 5: "Yes, and..." (most positive)
 *
 * @param interest - Current interest level (0-5)
 * @returns Response key
 */
export function getInterestResponseKey(
  interest: number
): 'interest0' | 'interest1' | 'interest2' | 'interest3' | 'interest4' | 'interest5' {
  const clamped = Math.max(0, Math.min(5, interest));
  return `interest${clamped}` as ReturnType<typeof getInterestResponseKey>;
}

/**
 * Get interest level description.
 *
 * @param interest - Current interest level (0-5)
 * @returns Human-readable response type
 */
export function getInterestDescription(interest: number): string {
  const clamped = Math.max(0, Math.min(5, interest));
  const descriptions = [
    'No, and...',
    'No.',
    'No, but...',
    'Yes, but...',
    'Yes.',
    'Yes, and...',
  ];
  return descriptions[clamped] ?? 'Unknown';
}

// ---------------------------------------------------------------------------
// Progress Calculation
// ---------------------------------------------------------------------------

/**
 * Calculate progress toward target interest.
 *
 * @param interest - Current interest
 * @param targetInterest - Target interest
 * @returns Progress percentage (0-100)
 */
export function getInterestProgress(interest: number, targetInterest: number): number {
  if (targetInterest <= 0) return 100;
  return Math.min(100, Math.round((interest / targetInterest) * 100));
}

/**
 * Calculate patience remaining percentage.
 *
 * @param patience - Current patience
 * @param maxPatience - Maximum patience
 * @returns Patience percentage (0-100)
 */
export function getPatienceProgress(patience: number, maxPatience: number): number {
  if (maxPatience <= 0) return 0;
  return Math.max(0, Math.round((patience / maxPatience) * 100));
}

/**
 * Clamp interest to valid range.
 *
 * @param interest - Interest value
 * @param maxInterest - Maximum interest (default 5)
 * @returns Clamped interest
 */
export function clampInterest(interest: number, maxInterest = 5): number {
  return Math.max(0, Math.min(maxInterest, interest));
}

/**
 * Clamp patience to valid range.
 *
 * @param patience - Patience value
 * @param maxPatience - Maximum patience (default 5)
 * @returns Clamped patience
 */
export function clampPatience(patience: number, maxPatience = 5): number {
  return Math.max(0, Math.min(maxPatience, patience));
}

// ---------------------------------------------------------------------------
// Interest/Patience Colors
// ---------------------------------------------------------------------------

/**
 * Color names for negotiation display.
 */
export type NegotiationColor = 'red' | 'orange' | 'yellow' | 'green' | 'blue';

/**
 * Get color based on current interest level relative to target.
 *
 * - 100%+: blue (won/complete)
 * - 75%+: green (close to winning)
 * - 50%+: yellow (halfway)
 * - 25%+: orange (struggling)
 * - <25%: red (far from goal)
 *
 * @param current - Current interest value
 * @param target - Target interest to win negotiation
 * @returns Color name
 */
export function getInterestColor(current: number, target: number): NegotiationColor {
  if (target <= 0) return 'blue';
  const percentage = (current / target) * 100;

  if (percentage >= 100) return 'blue';
  if (percentage >= 75) return 'green';
  if (percentage >= 50) return 'yellow';
  if (percentage >= 25) return 'orange';
  return 'red';
}

/**
 * Get Tailwind classes for interest color.
 *
 * @param current - Current interest value
 * @param target - Target interest to win negotiation
 * @returns Tailwind color classes
 */
export function getInterestColorClass(current: number, target: number): string {
  const color = getInterestColor(current, target);
  const classes: Record<NegotiationColor, string> = {
    red: 'text-red-400 bg-red-900/50',
    orange: 'text-orange-400 bg-orange-900/50',
    yellow: 'text-amber-400 bg-amber-900/50',
    green: 'text-emerald-400 bg-emerald-900/50',
    blue: 'text-blue-400 bg-blue-900/50',
  };
  return classes[color];
}

/**
 * Get CSS variable for interest color.
 *
 * @param current - Current interest value
 * @param target - Target interest to win negotiation
 * @returns CSS variable string
 */
export function getInterestColorVar(current: number, target: number): string {
  const color = getInterestColor(current, target);
  const vars: Record<NegotiationColor, string> = {
    red: 'var(--status-danger)',
    orange: 'var(--status-caution)',
    yellow: 'var(--status-warning)',
    green: 'var(--status-success)',
    blue: 'var(--accent-primary)',
  };
  return vars[color];
}

/**
 * Get color based on remaining patience.
 *
 * - 75%+: green (plenty of patience)
 * - 50%+: yellow (getting impatient)
 * - 25%+: orange (running low)
 * - >0: red (almost out)
 * - 0: red (out of patience)
 *
 * @param current - Current patience value
 * @param max - Starting/max patience value
 * @returns Color name
 */
export function getPatienceColor(current: number, max: number): NegotiationColor {
  if (max <= 0) return 'red';
  const percentage = (current / max) * 100;

  if (percentage >= 75) return 'green';
  if (percentage >= 50) return 'yellow';
  if (percentage >= 25) return 'orange';
  return 'red';
}

/**
 * Get Tailwind classes for patience color.
 *
 * @param current - Current patience value
 * @param max - Starting/max patience value
 * @returns Tailwind color classes
 */
export function getPatienceColorClass(current: number, max: number): string {
  const color = getPatienceColor(current, max);
  const classes: Record<NegotiationColor, string> = {
    red: 'text-red-400',
    orange: 'text-orange-400',
    yellow: 'text-amber-400',
    green: 'text-emerald-400',
    blue: 'text-blue-400',
  };
  return classes[color];
}

/**
 * Get CSS variable for patience color.
 *
 * @param current - Current patience value
 * @param max - Starting/max patience value
 * @returns CSS variable string
 */
export function getPatienceColorVar(current: number, max: number): string {
  const color = getPatienceColor(current, max);
  const vars: Record<NegotiationColor, string> = {
    red: 'var(--status-danger)',
    orange: 'var(--status-caution)',
    yellow: 'var(--status-warning)',
    green: 'var(--status-success)',
    blue: 'var(--accent-primary)',
  };
  return vars[color];
}
