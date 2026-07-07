import { useMemo } from 'react';
import { AbilityLogic, GeometryLogic } from '@anvil/data';
import type { EntityData } from '../types/protocol.js';

/**
 * Shared targeting resolution used by both the desktop canvas overlay and the
 * phone target picker. Given a source entity, the current entities, and an
 * ability's raw distance string, it returns which targets are in range plus the
 * position-based flanking / high-ground advisories. Pure and memoized.
 */
export interface TargetingResolution {
  parsedDistance: AbilityLogic.ParsedDistance;
  /** Reach in squares from the caster (origin range for placed-area templates). */
  reach: number;
  /** IDs of entities within reach of the source. */
  validTargetIds: string[];
  /** Whether each id is in range (for quick lookup / greying out). */
  inRangeById: Record<string, boolean>;
  /** Squares within reach of the source footprint (for a range ring). */
  rangeSquares: GeometryLogic.GridPoint[];
  /** Position-only flanking, per enemy target id. */
  flankingByTargetId: Record<string, boolean>;
  /** High ground (attacker elevation > target), per enemy target id. */
  highGroundByTargetId: Record<string, boolean>;
}

function entitySize(entity: EntityData): number {
  const size = (entity as { size?: unknown }).size;
  if (typeof size === 'number') return Math.max(1, Math.floor(size));
  const numeric = Number(size);
  return Number.isFinite(numeric) && numeric >= 1 ? Math.floor(numeric) : 1;
}

function footprintOf(entity: EntityData): GeometryLogic.TokenFootprint {
  return GeometryLogic.makeFootprint(entity.x, entity.y, entitySize(entity));
}

function elevationOf(entity: EntityData): number {
  const elevation = (entity as { elevation?: unknown }).elevation;
  return typeof elevation === 'number' ? elevation : 0;
}

const EMPTY: TargetingResolution = {
  parsedDistance: { type: 'special', baseValue: 0 },
  reach: 0,
  validTargetIds: [],
  inRangeById: {},
  rangeSquares: [],
  flankingByTargetId: {},
  highGroundByTargetId: {},
};

export function useTargetingResolution(params: {
  sourceEntity: EntityData | null | undefined;
  entities: EntityData[];
  /** Raw ability distance string, e.g. "Ranged 5", "2 cube within 10". */
  distance: string | null | undefined;
}): TargetingResolution {
  const { sourceEntity, entities, distance } = params;

  return useMemo(() => {
    if (!sourceEntity || !distance) return EMPTY;

    const parsed = AbilityLogic.parseDistance(distance);
    const reach = AbilityLogic.getReach(parsed);
    const sourceFp = footprintOf(sourceEntity);
    const sourceElevation = elevationOf(sourceEntity);

    const allyFootprints = entities
      .filter((e) => e.type === sourceEntity.type && e.id !== sourceEntity.id)
      .map(footprintOf);

    const validTargetIds: string[] = [];
    const inRangeById: Record<string, boolean> = {};
    const flankingByTargetId: Record<string, boolean> = {};
    const highGroundByTargetId: Record<string, boolean> = {};

    for (const entity of entities) {
      if (entity.id === sourceEntity.id) continue;
      const targetFp = footprintOf(entity);
      const gridDistance = GeometryLogic.distanceBetweenFootprints(sourceFp, targetFp);
      const inRange = AbilityLogic.isInRangeAny(parsed, gridDistance);
      inRangeById[entity.id] = inRange;
      if (inRange) validTargetIds.push(entity.id);

      // Flanking / high ground are only meaningful against the opposing side.
      if (entity.type !== sourceEntity.type) {
        flankingByTargetId[entity.id] = GeometryLogic.isFlanked(sourceFp, targetFp, allyFootprints);
        highGroundByTargetId[entity.id] = GeometryLogic.hasHighGround(
          sourceElevation,
          elevationOf(entity),
        );
      }
    }

    return {
      parsedDistance: parsed,
      reach,
      validTargetIds,
      inRangeById,
      rangeSquares: GeometryLogic.getSquaresInRangeOfFootprint(sourceFp, reach),
      flankingByTargetId,
      highGroundByTargetId,
    };
  }, [sourceEntity, entities, distance]);
}
