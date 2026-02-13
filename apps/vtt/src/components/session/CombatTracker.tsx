import { Swords, Shield } from 'lucide-react';
import { Button } from '@anvil/ui';
import type { CombatState, EntityData } from '../../types/protocol.js';

interface CombatTrackerProps {
  combat: CombatState;
  entities: EntityData[];
  isDirector: boolean;
  currentHeroEntityId: string | null;
  onClaimTurn: (entityId: string) => void;
  onSelectTurn: (entityId: string) => void;
  onEndTurn: () => void;
  onEndCombat: () => void;
  onAdjustMalice: (delta: number) => void;
}

export function CombatTracker({
  combat,
  entities,
  isDirector,
  currentHeroEntityId,
  onClaimTurn,
  onSelectTurn,
  onEndTurn,
  onEndCombat,
  onAdjustMalice,
}: CombatTrackerProps) {
  const entityMap = new Map(entities.map((e) => [e.id, e]));

  const canClaimTurn =
    combat.activeSide === 'heroes' &&
    !combat.activeEntityId &&
    currentHeroEntityId &&
    !combat.actedThisRound.includes(currentHeroEntityId);

  const isMyTurn = combat.activeEntityId === currentHeroEntityId;

  return (
    <div className="flex flex-col gap-3">
      {/* Round & Initiative */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase text-zinc-500">Combat</span>
        <span className="text-xs text-zinc-400">Round {combat.round}</span>
      </div>

      {/* Initiative result */}
      <div className="rounded bg-zinc-800/50 px-2 py-1 text-center text-[10px] text-zinc-400">
        Initiative: {combat.initiativeRoll} — {combat.firstSide === 'heroes' ? 'Heroes' : 'Villains'} go first
      </div>

      {/* Active side indicator */}
      <div className={`rounded px-2 py-1.5 text-center text-xs font-medium ${
        combat.activeSide === 'heroes'
          ? 'bg-blue-500/20 text-blue-300'
          : 'bg-red-500/20 text-red-300'
      }`}>
        {combat.activeSide === 'heroes' ? '⚔️ Heroes\' Turn' : '💀 Villains\' Turn'}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-2 gap-2">
        {/* Heroes column */}
        <div>
          <div className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-blue-400">
            <Swords className="size-3" />
            Heroes
          </div>
          <div className="flex flex-col gap-0.5">
            {combat.heroEntities.map((id) => {
              const entity = entityMap.get(id);
              const acted = combat.actedThisRound.includes(id);
              const isActive = combat.activeEntityId === id;
              return (
                <div
                  key={id}
                  className={`flex items-center gap-1 rounded px-1.5 py-1 text-xs ${
                    isActive
                      ? 'bg-blue-500/20 text-blue-200 font-medium'
                      : acted
                        ? 'text-zinc-600 line-through'
                        : 'text-zinc-300'
                  }`}
                >
                  <span className="truncate">{entity?.name ?? id}</span>
                  {isActive && <span className="ml-auto text-[9px] text-blue-400">ACTIVE</span>}
                  {acted && !isActive && <span className="ml-auto text-[9px]">✓</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Villains column */}
        <div>
          <div className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-red-400">
            <Shield className="size-3" />
            Villains
          </div>
          <div className="flex flex-col gap-0.5">
            {combat.villainEntities.map((id) => {
              const entity = entityMap.get(id);
              const acted = combat.actedThisRound.includes(id);
              const isActive = combat.activeEntityId === id;
              return (
                <div
                  key={id}
                  className={`flex items-center gap-1 rounded px-1.5 py-1 text-xs cursor-pointer hover:bg-zinc-800/50 ${
                    isActive
                      ? 'bg-red-500/20 text-red-200 font-medium'
                      : acted
                        ? 'text-zinc-600 line-through'
                        : 'text-zinc-300'
                  }`}
                  onClick={() => {
                    if (isDirector && combat.activeSide === 'villains' && !combat.activeEntityId && !acted) {
                      onSelectTurn(id);
                    }
                  }}
                >
                  <span className="truncate">{entity?.name ?? id}</span>
                  {isActive && <span className="ml-auto text-[9px] text-red-400">ACTIVE</span>}
                  {acted && !isActive && <span className="ml-auto text-[9px]">✓</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Malice */}
      <div className="flex items-center justify-between rounded bg-zinc-800/50 px-2 py-1.5">
        <span className="text-xs text-zinc-400">Malice</span>
        <div className="flex items-center gap-1">
          {isDirector && (
            <Button
              size="icon"
              variant="ghost"
              className="size-5"
              onClick={() => onAdjustMalice(-1)}
            >
              <span className="text-xs">−</span>
            </Button>
          )}
          <span className="min-w-[20px] text-center text-sm font-bold text-purple-400">
            {combat.malice}
          </span>
          {isDirector && (
            <Button
              size="icon"
              variant="ghost"
              className="size-5"
              onClick={() => onAdjustMalice(1)}
            >
              <span className="text-xs">+</span>
            </Button>
          )}
        </div>
      </div>

      {/* Turn controls */}
      {canClaimTurn && !isDirector && (
        <Button
          size="sm"
          className="bg-blue-600 hover:bg-blue-700"
          onClick={() => onClaimTurn(currentHeroEntityId)}
        >
          Take My Turn
        </Button>
      )}

      {isMyTurn && !isDirector && (
        <Button size="sm" variant="outline" onClick={onEndTurn}>
          End My Turn
        </Button>
      )}

      {isDirector && combat.activeEntityId && (
        <Button size="sm" variant="outline" onClick={onEndTurn}>
          End Turn
        </Button>
      )}

      {isDirector && (
        <Button size="sm" variant="ghost" onClick={onEndCombat} className="text-zinc-500">
          End Combat
        </Button>
      )}
    </div>
  );
}
