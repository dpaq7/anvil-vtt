/**
 * Asset Helper Calculation Tests
 *
 * Tests for montage logic and respite logic functions used by
 * the Director Assets UI components.
 */

import { describe, it, expect } from 'vitest';
import * as MontageLogic from './montage-logic.js';
import * as RespiteLogic from './respite-logic.js';

// ---------------------------------------------------------------------------
// MontageLogic — Outcome Calculation
// ---------------------------------------------------------------------------

describe('MontageLogic.calculateOutcome', () => {
  it('returns "pending" when neither limit is reached', () => {
    expect(MontageLogic.calculateOutcome(2, 1, 6, 3)).toBe('pending');
  });

  it('returns "total_success" when successes reach target', () => {
    expect(MontageLogic.calculateOutcome(6, 1, 6, 3)).toBe('total_success');
  });

  it('returns "total_success" when successes exceed target', () => {
    expect(MontageLogic.calculateOutcome(8, 2, 6, 3)).toBe('total_success');
  });

  it('returns "total_failure" when failures reach max', () => {
    expect(MontageLogic.calculateOutcome(2, 3, 6, 3)).toBe('total_failure');
  });

  it('returns "total_failure" when failures exceed max', () => {
    expect(MontageLogic.calculateOutcome(0, 5, 6, 3)).toBe('total_failure');
  });

  it('returns "partial_success" when both limits hit simultaneously', () => {
    expect(MontageLogic.calculateOutcome(6, 3, 6, 3)).toBe('partial_success');
  });

  it('returns "partial_success" when both exceeded simultaneously', () => {
    expect(MontageLogic.calculateOutcome(7, 4, 6, 3)).toBe('partial_success');
  });

  it('handles zero limits as immediate completion', () => {
    expect(MontageLogic.calculateOutcome(0, 0, 0, 0)).toBe('partial_success');
  });
});

describe('MontageLogic.isMontageComplete', () => {
  it('returns false for pending', () => {
    expect(MontageLogic.isMontageComplete('pending')).toBe(false);
  });

  it('returns true for total_success', () => {
    expect(MontageLogic.isMontageComplete('total_success')).toBe(true);
  });

  it('returns true for total_failure', () => {
    expect(MontageLogic.isMontageComplete('total_failure')).toBe(true);
  });

  it('returns true for partial_success', () => {
    expect(MontageLogic.isMontageComplete('partial_success')).toBe(true);
  });
});

describe('MontageLogic.getOutcomeDescription', () => {
  it('returns human-readable labels', () => {
    expect(MontageLogic.getOutcomeDescription('total_success')).toBe('Total Success');
    expect(MontageLogic.getOutcomeDescription('partial_success')).toBe('Partial Success');
    expect(MontageLogic.getOutcomeDescription('total_failure')).toBe('Total Failure');
    expect(MontageLogic.getOutcomeDescription('pending')).toBe('In Progress');
  });
});

// ---------------------------------------------------------------------------
// MontageLogic — Effective Limits (Hero Count Scaling)
// ---------------------------------------------------------------------------

describe('MontageLogic.getEffectiveSuccessLimit', () => {
  const baseState = {
    baseSuccessLimit: 6,
    baseFailureLimit: 3,
    heroCountAdjustment: true,
    currentSuccesses: 0,
    currentFailures: 0,
  };

  it('returns base limit when heroCountAdjustment is false', () => {
    const state = { ...baseState, heroCountAdjustment: false };
    expect(MontageLogic.getEffectiveSuccessLimit(state, 4)).toBe(6);
    expect(MontageLogic.getEffectiveSuccessLimit(state, 8)).toBe(6);
  });

  it('returns base limit for standard party of 5', () => {
    expect(MontageLogic.getEffectiveSuccessLimit(baseState, 5)).toBe(6);
  });

  it('decreases limit for smaller parties', () => {
    expect(MontageLogic.getEffectiveSuccessLimit(baseState, 4)).toBe(5);
    expect(MontageLogic.getEffectiveSuccessLimit(baseState, 3)).toBe(4);
  });

  it('increases limit for larger parties', () => {
    expect(MontageLogic.getEffectiveSuccessLimit(baseState, 6)).toBe(7);
    expect(MontageLogic.getEffectiveSuccessLimit(baseState, 8)).toBe(9);
  });

  it('enforces minimum of 2', () => {
    expect(MontageLogic.getEffectiveSuccessLimit(baseState, 1)).toBe(2);
  });
});

describe('MontageLogic.getEffectiveFailureLimit', () => {
  const baseState = {
    baseSuccessLimit: 6,
    baseFailureLimit: 3,
    heroCountAdjustment: true,
    currentSuccesses: 0,
    currentFailures: 0,
  };

  it('returns base limit for standard party of 5', () => {
    expect(MontageLogic.getEffectiveFailureLimit(baseState, 5)).toBe(3);
  });

  it('decreases limit for smaller parties', () => {
    expect(MontageLogic.getEffectiveFailureLimit(baseState, 4)).toBe(2);
  });

  it('increases limit for larger parties', () => {
    expect(MontageLogic.getEffectiveFailureLimit(baseState, 6)).toBe(4);
  });

  it('enforces minimum of 2', () => {
    expect(MontageLogic.getEffectiveFailureLimit(baseState, 1)).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// MontageLogic — Progress Calculations
// ---------------------------------------------------------------------------

describe('MontageLogic.getSuccessProgress', () => {
  it('returns 0% at start', () => {
    expect(MontageLogic.getSuccessProgress(0, 6)).toBe(0);
  });

  it('returns 50% at half', () => {
    expect(MontageLogic.getSuccessProgress(3, 6)).toBe(50);
  });

  it('returns 100% when complete', () => {
    expect(MontageLogic.getSuccessProgress(6, 6)).toBe(100);
  });

  it('caps at 100% when over limit', () => {
    expect(MontageLogic.getSuccessProgress(10, 6)).toBe(100);
  });

  it('returns 100% for zero limit', () => {
    expect(MontageLogic.getSuccessProgress(0, 0)).toBe(100);
  });
});

describe('MontageLogic.getRemainingSuccesses', () => {
  it('returns full count at start', () => {
    expect(MontageLogic.getRemainingSuccesses(0, 6)).toBe(6);
  });

  it('returns partial count midway', () => {
    expect(MontageLogic.getRemainingSuccesses(4, 6)).toBe(2);
  });

  it('returns 0 when complete', () => {
    expect(MontageLogic.getRemainingSuccesses(6, 6)).toBe(0);
  });

  it('returns 0 when over limit', () => {
    expect(MontageLogic.getRemainingSuccesses(10, 6)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// RespiteLogic — Project Progress
// ---------------------------------------------------------------------------

describe('RespiteLogic.calculateProjectPoints', () => {
  it('returns roll total as points', () => {
    expect(RespiteLogic.calculateProjectPoints(14)).toBe(14);
  });

  it('returns minimum of 1', () => {
    expect(RespiteLogic.calculateProjectPoints(0)).toBe(1);
    expect(RespiteLogic.calculateProjectPoints(-5)).toBe(1);
  });
});

describe('RespiteLogic.getProjectProgress', () => {
  it('returns 0% at start', () => {
    expect(RespiteLogic.getProjectProgress(0, 30)).toBe(0);
  });

  it('returns correct percentage', () => {
    expect(RespiteLogic.getProjectProgress(12, 30)).toBe(40);
  });

  it('returns 100% when complete', () => {
    expect(RespiteLogic.getProjectProgress(30, 30)).toBe(100);
  });

  it('caps at 100%', () => {
    expect(RespiteLogic.getProjectProgress(50, 30)).toBe(100);
  });

  it('returns 100% for zero goal (no division by zero)', () => {
    expect(RespiteLogic.getProjectProgress(0, 0)).toBe(100);
  });

  it('returns 100% for negative goal (no division by zero)', () => {
    expect(RespiteLogic.getProjectProgress(0, -10)).toBe(100);
  });
});

describe('RespiteLogic.isProjectComplete', () => {
  it('returns false when points < goal', () => {
    expect(RespiteLogic.isProjectComplete(12, 30)).toBe(false);
  });

  it('returns true when points == goal', () => {
    expect(RespiteLogic.isProjectComplete(30, 30)).toBe(true);
  });

  it('returns true when points > goal', () => {
    expect(RespiteLogic.isProjectComplete(35, 30)).toBe(true);
  });
});

describe('RespiteLogic.applyProjectProgress', () => {
  it('adds project points correctly', () => {
    const result = RespiteLogic.applyProjectProgress(
      { id: 'p1', goalPoints: 30, currentPoints: 10 },
      8,
    );
    expect(result.points).toBe(8);
    expect(result.newTotal).toBe(18);
    expect(result.isComplete).toBe(false);
    expect(result.progressPercent).toBe(60);
  });

  it('caps at goal points', () => {
    const result = RespiteLogic.applyProjectProgress(
      { id: 'p1', goalPoints: 30, currentPoints: 25 },
      10,
    );
    expect(result.newTotal).toBe(30);
    expect(result.isComplete).toBe(true);
    expect(result.progressPercent).toBe(100);
  });

  it('handles minimum 1 point from roll of 0', () => {
    const result = RespiteLogic.applyProjectProgress(
      { id: 'p1', goalPoints: 30, currentPoints: 5 },
      0,
    );
    expect(result.points).toBe(1);
    expect(result.newTotal).toBe(6);
  });
});

// ---------------------------------------------------------------------------
// RespiteLogic — Standard Activities
// ---------------------------------------------------------------------------

describe('RespiteLogic.getStandardActivities', () => {
  it('returns 5 standard activity types', () => {
    const activities = RespiteLogic.getStandardActivities();
    expect(activities).toHaveLength(5);
    expect(activities).toContain('recover');
    expect(activities).toContain('craft');
    expect(activities).toContain('research');
    expect(activities).toContain('socialize');
    expect(activities).toContain('change_kit');
  });

  it('does not include project or custom', () => {
    const activities = RespiteLogic.getStandardActivities();
    expect(activities).not.toContain('project');
    expect(activities).not.toContain('custom');
  });
});

// ---------------------------------------------------------------------------
// RespiteLogic — Victory Conversion
// ---------------------------------------------------------------------------

describe('RespiteLogic.victoriesToXP', () => {
  it('converts victories 1:1', () => {
    expect(RespiteLogic.victoriesToXP(3)).toBe(3);
  });

  it('handles zero victories', () => {
    expect(RespiteLogic.victoriesToXP(0)).toBe(0);
  });

  it('handles negative victories (clamps to 0)', () => {
    expect(RespiteLogic.victoriesToXP(-1)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// RespiteLogic — Recovery
// ---------------------------------------------------------------------------

describe('RespiteLogic.canUseRecoverActivity', () => {
  it('returns true when stamina < max and recoveries available', () => {
    expect(RespiteLogic.canUseRecoverActivity(10, 30, 3)).toBe(true);
  });

  it('returns false when at max stamina', () => {
    expect(RespiteLogic.canUseRecoverActivity(30, 30, 3)).toBe(false);
  });

  it('returns false when no recoveries', () => {
    expect(RespiteLogic.canUseRecoverActivity(10, 30, 0)).toBe(false);
  });
});

describe('RespiteLogic.calculateRecoverStamina', () => {
  it('restores recovery value worth of stamina', () => {
    expect(RespiteLogic.calculateRecoverStamina(10, 30, 10, 3)).toBe(10);
  });

  it('caps at max stamina', () => {
    expect(RespiteLogic.calculateRecoverStamina(25, 30, 10, 3)).toBe(5);
  });

  it('returns 0 when no recoveries', () => {
    expect(RespiteLogic.calculateRecoverStamina(10, 30, 10, 0)).toBe(0);
  });

  it('returns 0 when already at max', () => {
    expect(RespiteLogic.calculateRecoverStamina(30, 30, 10, 3)).toBe(0);
  });
});
