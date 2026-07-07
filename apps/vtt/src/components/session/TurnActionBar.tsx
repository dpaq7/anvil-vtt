import { Swords, Shield, Footprints, Zap, Heart, Wind } from 'lucide-react';
import { Button, Badge } from '@anvil/ui';
import { MovementLogic } from '@anvil/data';
import type { ConditionName } from '@anvil/types';
import type { TurnActionState } from '../../types/protocol.js';

interface TurnActionBarProps {
  /** Current turn action state from combat */
  turnActions: TurnActionState | null;
  /** Whether it's this player's active turn */
  isMyTurn: boolean;
  /** The entity's base speed */
  baseSpeed: number;
  /** Heroic resource current value */
  heroicResource: number;
  /** Heroic resource name (e.g., "Ferocity", "Clarity") */
  resourceName: string;
  /** Current conditions on the hero */
  conditions: string[];
  /** Callbacks */
  onCatchBreath: () => void;
  onDefend: () => void;
  onEndTurn: () => void;
}

export function TurnActionBar({
  turnActions,
  isMyTurn,
  baseSpeed,
  heroicResource,
  resourceName,
  conditions,
  onCatchBreath,
  onDefend,
  onEndTurn,
}: TurnActionBarProps) {
  if (!isMyTurn || !turnActions) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3">
        <span className="text-xs text-zinc-500">
          {isMyTurn ? 'Loading turn state...' : 'Waiting for your turn...'}
        </span>
      </div>
    );
  }

  const mainAvailable = !turnActions.mainActionUsed && turnActions.mainConvertedTo === null;
  const maneuverAvailable = !turnActions.maneuverUsed ||
    (turnActions.mainConvertedTo === 'maneuver' && !turnActions.mainActionUsed);

  // Condition-adjusted movement (slowed caps at 2, grabbed/restrained to 0).
  const budget = MovementLogic.getMovementBudget(
    baseSpeed,
    turnActions,
    conditions as ConditionName[],
  );
  const moveNote = budget.isImmobilized
    ? 'immobilized'
    : budget.mustCrawl
      ? 'crawl'
      : budget.totalSpeed < baseSpeed
        ? 'slowed'
        : null;

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
      {/* Action economy indicators */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-400">
          Your Turn
        </span>
        <div className="flex items-center gap-1.5">
          {heroicResource > 0 && (
            <Badge variant="secondary" className="px-1.5 py-0 text-[10px] text-yellow-400">
              {resourceName}: {heroicResource}
            </Badge>
          )}
        </div>
      </div>

      {/* Action slots */}
      <div className="grid grid-cols-4 gap-1.5">
        {/* Main Action */}
        <div className={`flex flex-col items-center gap-0.5 rounded p-1.5 ${
          mainAvailable ? 'bg-blue-500/10 text-blue-300' : 'bg-zinc-800/50 text-zinc-600'
        }`}>
          <Swords className="size-3.5" />
          <span className="text-[9px] font-medium">Main</span>
          <span className="text-[8px]">{mainAvailable ? 'Ready' : 'Used'}</span>
        </div>

        {/* Maneuver */}
        <div className={`flex flex-col items-center gap-0.5 rounded p-1.5 ${
          maneuverAvailable ? 'bg-amber-500/10 text-amber-300' : 'bg-zinc-800/50 text-zinc-600'
        }`}>
          <Shield className="size-3.5" />
          <span className="text-[9px] font-medium">Maneuver</span>
          <span className="text-[8px]">{maneuverAvailable ? 'Ready' : 'Used'}</span>
        </div>

        {/* Move */}
        <div className={`flex flex-col items-center gap-0.5 rounded p-1.5 ${
          budget.remaining > 0 ? 'bg-emerald-500/10 text-emerald-300' : 'bg-zinc-800/50 text-zinc-600'
        }`}>
          <Footprints className="size-3.5" />
          <span className="text-[9px] font-medium">Move</span>
          <span className="text-[8px]">{budget.remaining}/{budget.totalSpeed}</span>
          {moveNote && <span className="text-[7px] text-amber-400">{moveNote}</span>}
        </div>

        {/* Triggered */}
        <div className={`flex flex-col items-center gap-0.5 rounded p-1.5 ${
          !turnActions.triggeredUsedThisRound ? 'bg-purple-500/10 text-purple-300' : 'bg-zinc-800/50 text-zinc-600'
        }`}>
          <Zap className="size-3.5" />
          <span className="text-[9px] font-medium">Triggered</span>
          <span className="text-[8px]">{!turnActions.triggeredUsedThisRound ? 'Ready' : 'Used'}</span>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex items-center gap-1.5">
        {mainAvailable && (
          <>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 gap-1 text-[10px]"
              onClick={onCatchBreath}
              title="Spend a recovery to regain stamina"
            >
              <Heart className="size-3 text-emerald-400" />
              Catch Breath
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 gap-1 text-[10px]"
              onClick={onDefend}
              title="Attacks against you have a bane until your next turn"
            >
              <Wind className="size-3 text-blue-400" />
              Defend
            </Button>
          </>
        )}
        <div className="flex-1" />
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-[10px]"
          onClick={onEndTurn}
        >
          End Turn
        </Button>
      </div>

      {/* Conditions */}
      {conditions.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {conditions.map((c) => (
            <Badge key={c} variant="destructive" className="px-1.5 py-0 text-[9px]">
              {c}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
