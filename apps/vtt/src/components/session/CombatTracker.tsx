import { Button } from '@anvil/ui';
import type { CombatState, EntityData } from '../../types/protocol.js';

interface CombatTrackerProps {
  combat: CombatState;
  entities: EntityData[];
  isDirector: boolean;
  onNextTurn: () => void;
  onEndCombat: () => void;
}

export function CombatTracker({
  combat,
  entities,
  isDirector,
  onNextTurn,
  onEndCombat,
}: CombatTrackerProps) {
  const entityMap = new Map(entities.map((e) => [e.id, e]));

  return (
    <div className="flex flex-col gap-3">
      {/* Round counter */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase text-zinc-500">Combat</span>
        <span className="text-xs text-zinc-400">Round {combat.round}</span>
      </div>

      {/* Initiative order */}
      <div className="flex flex-col gap-1">
        {combat.turnOrder.map((entityId, idx) => {
          const entity = entityMap.get(entityId);
          const isCurrent = idx === combat.currentTurnIndex;
          return (
            <div
              key={entityId}
              className={`flex items-center gap-2 rounded px-2 py-1.5 text-xs ${
                isCurrent
                  ? 'bg-amber-500/20 text-amber-200'
                  : 'text-zinc-400'
              }`}
            >
              <span className="w-4 text-center text-zinc-600">{idx + 1}</span>
              <span className={isCurrent ? 'font-medium' : ''}>
                {entity?.name ?? entityId}
              </span>
              {isCurrent && (
                <span className="ml-auto text-[10px] uppercase text-amber-400">Current</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Director controls */}
      {isDirector && (
        <div className="flex gap-2">
          <Button size="sm" onClick={onNextTurn} className="flex-1">
            Next Turn
          </Button>
          <Button size="sm" variant="ghost" onClick={onEndCombat}>
            End
          </Button>
        </div>
      )}
    </div>
  );
}
