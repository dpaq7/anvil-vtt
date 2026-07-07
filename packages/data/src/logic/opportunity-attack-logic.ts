/**
 * Opportunity Attack Logic
 *
 * Detects the Draw Steel opportunity-attack trigger along a movement path: an
 * enemy leaving a threatening creature's melee reach without shifting provokes a
 * melee free strike. Shifting (disengage) never provokes.
 *
 * Pure and deterministic — the client runs it live during a drag to preview OAs,
 * and the server re-runs it on commit to record them. Both use the same result.
 */

import type {
  MovementMode,
  ThreatSource,
  OpportunityAttackTrigger,
  OpportunityAttackResult,
} from '@anvil/types';
import type { GridPoint } from './geometry-logic.js';
import { makeFootprint, distanceBetweenFootprints } from './geometry-logic.js';

/** Identity of the creature whose movement is being checked. */
export interface MoverInfo {
  entityId: string;
  name: string;
  /** 'heroes' or 'enemies'; threats on the same side never provoke. */
  side: 'heroes' | 'enemies';
  /** Edge length in squares (default 1). */
  size?: number;
}

const NO_OA: OpportunityAttackResult = { triggersOA: false, triggers: [] };

/**
 * Detect opportunity attacks provoked by a movement path.
 *
 * @param path - Ordered squares the mover passes through (top-left cells);
 *   `path[0]` is the starting square.
 * @param mover - The moving creature.
 * @param mode - 'advance' can provoke; 'disengage' (shift) never does.
 * @param threats - All potential threatening creatures. Same-side threats and
 *   those with `canMakeOA === false` are ignored.
 * @returns The set of triggers, one per threat whose reach the mover leaves.
 */
export function detectOpportunityAttacks(
  path: readonly GridPoint[],
  mover: MoverInfo,
  mode: MovementMode,
  threats: readonly ThreatSource[]
): OpportunityAttackResult {
  if (mode === 'disengage' || path.length < 2) {
    return NO_OA;
  }

  const moverSize = mover.size ?? 1;
  const triggers: OpportunityAttackTrigger[] = [];
  let firstTriggerIndex: number | undefined;

  for (const threat of threats) {
    if (!threat.canMakeOA || threat.side === mover.side) continue;
    if (threat.entityId === mover.entityId) continue;

    const threatFp = makeFootprint(threat.gridX, threat.gridY, threat.size ?? 1);
    const reach = threat.reach ?? 1;
    const inReach = (p: GridPoint) =>
      distanceBetweenFootprints(makeFootprint(p.x, p.y, moverSize), threatFp) <= reach;

    // Find the first step that leaves this threat's reach (in-reach → out-of-reach).
    // One OA per threat per path, so we stop at the first such transition.
    for (let i = 1; i < path.length; i++) {
      if (inReach(path[i - 1]!) && !inReach(path[i]!)) {
        triggers.push({
          attackerId: threat.entityId,
          attackerName: threat.name ?? threat.entityId,
          targetId: mover.entityId,
          targetName: mover.name,
          triggerGridX: path[i - 1]!.x,
          triggerGridY: path[i - 1]!.y,
          destinationGridX: path[i]!.x,
          destinationGridY: path[i]!.y,
        });
        firstTriggerIndex =
          firstTriggerIndex === undefined ? i : Math.min(firstTriggerIndex, i);
        break;
      }
    }
  }

  if (triggers.length === 0) return NO_OA;
  return { triggersOA: true, triggers, firstTriggerIndex };
}
