import { Clapperboard, Dices, Shield, Swords } from 'lucide-react';
import { Button, cn } from '@anvil/ui';
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
  onRollInitiative?: () => void;
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
  onRollInitiative,
}: CombatTrackerProps) {
  const entityMap = new Map(entities.map((e) => [e.id, e]));
  const initiativePending = combat.initiativeRoll === null || combat.firstSide === null || combat.activeSide === null;
  const heroPosition = combat.firstSide === null
    ? 'pending'
    : combat.firstSide === 'heroes'
      ? 'first'
      : 'second';

  const canClaimTurn =
    !initiativePending &&
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

      {initiativePending ? (
        <div className="rounded border border-amber-500/30 bg-amber-950/20 p-2">
          <div className="flex items-center gap-2">
            <Dices className="size-4 text-amber-300" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-amber-100">Initiative d10</p>
              <p className="text-[11px] text-amber-200/70">6+ heroes act first. 5 or less puts the Director first.</p>
            </div>
          </div>
          {onRollInitiative && (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="mt-2 w-full"
              onClick={onRollInitiative}
            >
              Roll d10
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded bg-zinc-800/50 px-2 py-1.5 text-center text-[10px] text-zinc-400">
          Initiative: {combat.initiativeRoll} - Heroes are {heroPosition}
          {combat.initiativeRollerName ? ` (${combat.initiativeRollerName})` : ''}
        </div>
      )}

      <InitiativeOrder combat={combat} />

      {/* Active side indicator */}
      <div className={cn(
        'rounded px-2 py-1.5 text-center text-xs font-medium',
        initiativePending
          ? 'bg-zinc-800/70 text-zinc-400'
          : combat.activeSide === 'heroes'
            ? 'bg-blue-500/20 text-blue-300'
            : 'bg-red-500/20 text-red-300',
      )}>
        {initiativePending
          ? 'Waiting for initiative'
          : combat.activeSide === 'heroes'
            ? 'Heroes Turn'
            : 'Director Turn'}
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

function InitiativeOrder({ combat }: { combat: CombatState }) {
  const sides: Array<'heroes' | 'villains'> = combat.firstSide
    ? [combat.firstSide, combat.firstSide === 'heroes' ? 'villains' : 'heroes']
    : ['heroes', 'villains'];

  return (
    <div className="grid grid-cols-2 gap-1.5">
      {sides.map((side, index) => {
        const isActive = combat.activeSide === side;
        const Icon = side === 'heroes' ? Swords : Clapperboard;
        return (
          <div
            key={side}
            className={cn(
              'rounded border px-2 py-1.5',
              isActive
                ? side === 'heroes'
                  ? 'border-blue-500/60 bg-blue-500/10'
                  : 'border-red-500/60 bg-red-500/10'
                : 'border-zinc-800 bg-zinc-900/50',
            )}
          >
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-semibold tabular-nums text-zinc-500">{index + 1}</span>
              <Icon className={cn('size-3.5', side === 'heroes' ? 'text-blue-300' : 'text-red-300')} />
              <span className="min-w-0 flex-1 truncate text-xs font-medium text-zinc-200">
                {side === 'heroes' ? 'Heroes' : 'Director'}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
