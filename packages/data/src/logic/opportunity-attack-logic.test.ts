/**
 * Opportunity Attack Logic tests.
 */

import { describe, it, expect } from 'vitest';
import { detectOpportunityAttacks, type MoverInfo } from './opportunity-attack-logic.js';
import type { ThreatSource } from '@anvil/types';
import type { GridPoint } from './geometry-logic.js';

const mover: MoverInfo = { entityId: 'hero1', name: 'Rogue', side: 'heroes', size: 1 };

const threat = (over: Partial<ThreatSource> = {}): ThreatSource => ({
  entityId: 'goblin1',
  name: 'Goblin',
  gridX: 5,
  gridY: 5,
  side: 'enemies',
  reach: 1,
  canMakeOA: true,
  size: 1,
  ...over,
});

// Path that starts adjacent to the goblin at (5,5) and walks east out of reach.
const leavingPath: GridPoint[] = [
  { x: 4, y: 5 }, // adjacent (in reach)
  { x: 3, y: 5 }, // 2 away (out of reach) → trigger here
  { x: 2, y: 5 },
];

describe('detectOpportunityAttacks', () => {
  it('triggers when the mover leaves an enemy reach on an advance', () => {
    const result = detectOpportunityAttacks(leavingPath, mover, 'advance', [threat()]);
    expect(result.triggersOA).toBe(true);
    expect(result.triggers).toHaveLength(1);
    expect(result.triggers[0]).toMatchObject({
      attackerId: 'goblin1',
      targetId: 'hero1',
      triggerGridX: 4,
      destinationGridX: 3,
    });
    expect(result.firstTriggerIndex).toBe(1);
  });

  it('never triggers when disengaging (shift)', () => {
    const result = detectOpportunityAttacks(leavingPath, mover, 'disengage', [threat()]);
    expect(result.triggersOA).toBe(false);
  });

  it('does not trigger while staying within reach the whole path', () => {
    const stayingPath: GridPoint[] = [
      { x: 4, y: 5 },
      { x: 4, y: 6 },
      { x: 5, y: 6 }, // still adjacent to (5,5)
    ];
    expect(detectOpportunityAttacks(stayingPath, mover, 'advance', [threat()]).triggersOA).toBe(
      false
    );
  });

  it('ignores same-side and non-OA threats', () => {
    const ally = threat({ entityId: 'ally1', side: 'heroes' });
    const dazed = threat({ entityId: 'goblin2', canMakeOA: false });
    expect(detectOpportunityAttacks(leavingPath, mover, 'advance', [ally, dazed]).triggersOA).toBe(
      false
    );
  });

  it('emits one trigger per distinct threat', () => {
    const a = threat({ entityId: 'g1', gridX: 5, gridY: 5 });
    const b = threat({ entityId: 'g2', gridX: 5, gridY: 4 });
    const result = detectOpportunityAttacks(leavingPath, mover, 'advance', [a, b]);
    expect(result.triggers.map((t) => t.attackerId).sort()).toEqual(['g1', 'g2']);
  });

  it('respects extended reach', () => {
    // With reach 2, the goblin still threatens (3,5), so leaving happens later.
    const reachy = threat({ reach: 2 });
    const result = detectOpportunityAttacks(leavingPath, mover, 'advance', [reachy]);
    expect(result.triggers[0]).toMatchObject({ triggerGridX: 3, destinationGridX: 2 });
  });
});
