import type { CombatState, EntityData } from '../../types/protocol.js';
import { staminaState } from '../../lib/faces.js';
import { useRollingNumber } from './battle/hooks.js';
import { buildUnitRows } from './battle/unit-rows.js';
import './battle/battle.css';

interface BattleTurnTrackerProps {
  combat: CombatState | null;
  /** What this viewer may see: counts drop hidden creatures. */
  entities: EntityData[];
  className?: string;
}

/**
 * The corner tracker (`sb-side`): hangs from the screen's top-right corner. Round, Heroes (count
 * and one dot per hero), Director (count). The side now acting takes the soft fill.
 */
export function BattleTurnTracker({ combat, entities, className }: BattleTurnTrackerProps) {
  if (!combat) return null;
  const entityMap = new Map(entities.map((entity) => [entity.id, entity]));
  const heroes = combat.heroEntities.flatMap((id) => entityMap.get(id) ?? []);
  const heroesActed = heroes.filter((h) => combat.actedThisRound.includes(h.id)).length;
  const units = buildUnitRows(combat, entityMap, false);
  const unitsActed = units.filter((u) => u.members.every((m) => combat.actedThisRound.includes(m.id))).length;
  const pending = combat.initiativeRoll === null || combat.firstSide === null || combat.activeSide === null;
  const initiative = pending
    ? 'Waiting for initiative'
    : `Initiative ${combat.initiativeRoll}. ${combat.firstSide === 'heroes' ? 'Heroes' : 'Director'} first.`;
  return (
    <div className={`sb-side ${className ?? ''}`} data-map-panel>
      <div title={initiative}><b>Round {combat.round}</b></div>
      <div data-on={combat.activeSide === 'heroes' || undefined}>
        <b>Heroes</b>
        <Count value={heroesActed} total={heroes.length} />
        <i aria-hidden="true">
          {heroes.map((h) => (
            <u
              key={h.id}
              data-s={
                combat.activeEntityId === h.id
                  ? 'active'
                  : combat.actedThisRound.includes(h.id)
                    ? 'done'
                    : staminaState(h, 'hero') === 'dying'
                      ? 'dying'
                      : undefined
              }
            />
          ))}
        </i>
      </div>
      <div data-on={combat.activeSide === 'villains' || undefined}>
        <b>Director</b>
        <Count value={unitsActed} total={units.length} />
      </div>
    </div>
  );
}

function Count({ value, total }: { value: number; total: number }) {
  const shown = useRollingNumber(value);
  return <span>{shown}/{total}</span>;
}
