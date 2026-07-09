import type { MouseEvent } from 'react';
import { Clapperboard, Dices, Shield, Swords } from 'lucide-react';
import { Button, cn } from '@anvil/ui';
import type { CombatState, EntityData } from '../../types/protocol.js';
import {
  getVillainDisplayGroups,
  type CombatDisplayGroup,
} from '../../lib/combat-groups.js';

interface CombatTrackerProps {
  combat: CombatState;
  entities: EntityData[];
  selectedEntityIds?: string[];
  isDirector: boolean;
  currentHeroEntityId: string | null;
  onClaimTurn: (entityId: string) => void;
  onSelectEntities?: (entityIds: string[]) => void;
  onSelectTurn: (entityId: string) => void;
  onFocusEntity?: (entityId: string) => void;
  onEndTurn: () => void;
  onEndCombat: () => void;
  onAdjustMalice: (delta: number) => void;
  onRollInitiative?: () => void;
}

type CombatSide = 'heroes' | 'villains';

const SIDE_CONFIG: Record<CombatSide, {
  label: string;
  Icon: typeof Swords;
  accent: string;
  border: string;
  active: string;
}> = {
  heroes: {
    label: 'Heroes',
    Icon: Swords,
    accent: 'text-blue-300',
    border: 'border-blue-500/40',
    active: 'bg-blue-500/15 text-blue-100',
  },
  villains: {
    label: 'Director',
    Icon: Clapperboard,
    accent: 'text-red-300',
    border: 'border-red-500/40',
    active: 'bg-red-500/15 text-red-100',
  },
};
type SideConfig = (typeof SIDE_CONFIG)[CombatSide];

export function CombatTracker({
  combat,
  entities,
  selectedEntityIds = [],
  isDirector,
  currentHeroEntityId,
  onClaimTurn,
  onSelectEntities,
  onSelectTurn,
  onFocusEntity,
  onEndTurn,
  onEndCombat,
  onAdjustMalice,
  onRollInitiative,
}: CombatTrackerProps) {
  const entityMap = new Map(entities.map((e) => [e.id, e]));
  const selectedSet = new Set(selectedEntityIds);
  const initiativePending = combat.initiativeRoll === null || combat.firstSide === null || combat.activeSide === null;
  const heroPosition = combat.firstSide === null
    ? 'pending'
    : combat.firstSide === 'heroes'
      ? 'first'
      : 'second';

  const sideOrder: CombatSide[] = combat.firstSide
    ? [combat.firstSide, combat.firstSide === 'heroes' ? 'villains' : 'heroes']
    : ['heroes', 'villains'];

  const canClaimTurn =
    !initiativePending &&
    combat.activeSide === 'heroes' &&
    !combat.activeEntityId &&
    currentHeroEntityId &&
    !combat.actedThisRound.includes(currentHeroEntityId);

  const isMyTurn = combat.activeEntityId === currentHeroEntityId;

  const selectEntity = (event: MouseEvent, entityId: string) => {
    const additive = event.ctrlKey || event.metaKey || event.shiftKey;
    const next = additive
      ? toggleSelection(selectedSet, entityId)
      : [entityId];
    onSelectEntities?.(next);
  };

  const maybeSelectVillainTurn = (entityId: string) => {
    if (
      isDirector &&
      combat.activeSide === 'villains' &&
      !combat.activeEntityId &&
      !combat.actedThisRound.includes(entityId)
    ) {
      onSelectTurn(entityId);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase text-zinc-500">Combat</span>
        <span className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400">
          Round {combat.round}
        </span>
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

      <div className="grid grid-cols-2 gap-1.5">
        {sideOrder.map((side, index) => (
          <SidePill
            key={side}
            side={side}
            order={index + 1}
            combat={combat}
            entityMap={entityMap}
          />
        ))}
      </div>

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

      <div className="flex flex-col gap-2">
        <InitiativeGroup
          side="heroes"
          combat={combat}
          entityMap={entityMap}
          selectedSet={selectedSet}
          onEntityClick={selectEntity}
          onEntityDoubleClick={onFocusEntity}
        />
        <InitiativeGroup
          side="villains"
          combat={combat}
          entityMap={entityMap}
          selectedSet={selectedSet}
          onEntityClick={(event, entityId) => {
            selectEntity(event, entityId);
            if (!(event.ctrlKey || event.metaKey || event.shiftKey)) maybeSelectVillainTurn(entityId);
          }}
          onEntityDoubleClick={onFocusEntity}
        />
      </div>

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
              <span className="text-xs">-</span>
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

      {canClaimTurn && !isDirector && (
        <Button
          size="sm"
          className="bg-blue-600 hover:bg-blue-700"
          onClick={() => {
            if (currentHeroEntityId) onClaimTurn(currentHeroEntityId);
          }}
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

function toggleSelection(selectedSet: Set<string>, entityId: string): string[] {
  const next = new Set(selectedSet);
  if (next.has(entityId)) next.delete(entityId);
  else next.add(entityId);
  return [...next];
}

function SidePill({
  side,
  order,
  combat,
  entityMap,
}: {
  side: CombatSide;
  order: number;
  combat: CombatState;
  entityMap: Map<string, EntityData>;
}) {
  const config = SIDE_CONFIG[side];
  const ids = side === 'heroes' ? combat.heroEntities : combat.villainEntities;
  const villainGroups = side === 'villains' ? getVillainDisplayGroups(combat, entityMap) : [];
  const usesGroups = villainGroups.some((group) => group.isGroup);
  const acted = usesGroups
    ? villainGroups.filter((group) => group.entityIds.every((id) => combat.actedThisRound.includes(id))).length
    : ids.filter((id) => combat.actedThisRound.includes(id)).length;
  const total = usesGroups ? villainGroups.length : ids.length;
  const isActive = combat.activeSide === side;
  const Icon = config.Icon;

  return (
    <div
      className={cn(
        'rounded border px-2 py-1.5',
        isActive ? cn(config.border, config.active) : 'border-zinc-800 bg-zinc-900/50 text-zinc-400',
      )}
      title={usesGroups
        ? `${config.label}: ${acted}/${total} groups complete; ${ids.filter((id) => combat.actedThisRound.includes(id)).length}/${ids.length} creatures acted`
        : `${config.label}: ${acted}/${total} acted`}
    >
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-semibold tabular-nums text-zinc-500">{order}</span>
        <Icon className={cn('size-3.5', config.accent)} />
        <span className="min-w-0 flex-1 truncate text-xs font-medium">{config.label}</span>
        <span className="text-[10px] tabular-nums text-zinc-500">{acted}/{total}</span>
      </div>
    </div>
  );
}

function InitiativeGroup({
  side,
  combat,
  entityMap,
  selectedSet,
  onEntityClick,
  onEntityDoubleClick,
}: {
  side: CombatSide;
  combat: CombatState;
  entityMap: Map<string, EntityData>;
  selectedSet: Set<string>;
  onEntityClick: (event: MouseEvent, entityId: string) => void;
  onEntityDoubleClick?: (entityId: string) => void;
}) {
  const config = SIDE_CONFIG[side];
  const ids = side === 'heroes' ? combat.heroEntities : combat.villainEntities;
  const Icon = side === 'heroes' ? Swords : Shield;
  const villainGroups = side === 'villains' ? getVillainDisplayGroups(combat, entityMap) : [];
  const showVillainGroups = side === 'villains' && villainGroups.some((group) => group.isGroup);

  return (
    <section className={cn('rounded border bg-zinc-950/25', config.border)}>
      <div className="flex items-center gap-1.5 border-b border-zinc-800/70 px-2 py-1.5">
        <Icon className={cn('size-3.5', config.accent)} />
        <span className={cn('text-[10px] font-semibold uppercase tracking-wider', config.accent)}>
          {side === 'heroes' ? 'Heroes' : 'Villains'}
        </span>
      </div>
      <div className="max-h-52 overflow-y-auto p-1">
        {ids.length === 0 ? (
          <p className="px-2 py-2 text-xs text-zinc-600">None</p>
        ) : showVillainGroups ? (
          <div className="flex flex-col gap-1">
            {villainGroups.map((group) => (
              group.isGroup ? (
                <VillainDisplayGroup
                  key={group.id}
                  group={group}
                  combat={combat}
                  entityMap={entityMap}
                  selectedSet={selectedSet}
                  config={config}
                  onEntityClick={onEntityClick}
                  onEntityDoubleClick={onEntityDoubleClick}
                />
              ) : (
                <CombatantRow
                  key={group.entityIds[0]}
                  entityId={group.entityIds[0]!}
                  combat={combat}
                  entityMap={entityMap}
                  selectedSet={selectedSet}
                  config={config}
                  onEntityClick={onEntityClick}
                  onEntityDoubleClick={onEntityDoubleClick}
                />
              )
            ))}
          </div>
        ) : (
          ids.map((id) => (
            <CombatantRow
              key={id}
              entityId={id}
              combat={combat}
              entityMap={entityMap}
              selectedSet={selectedSet}
              config={config}
              onEntityClick={onEntityClick}
              onEntityDoubleClick={onEntityDoubleClick}
            />
          ))
        )}
      </div>
    </section>
  );
}

function VillainDisplayGroup({
  group,
  combat,
  entityMap,
  selectedSet,
  config,
  onEntityClick,
  onEntityDoubleClick,
}: {
  group: CombatDisplayGroup;
  combat: CombatState;
  entityMap: Map<string, EntityData>;
  selectedSet: Set<string>;
  config: SideConfig;
  onEntityClick: (event: MouseEvent, entityId: string) => void;
  onEntityDoubleClick?: (entityId: string) => void;
}) {
  const acted = group.entityIds.filter((id) => combat.actedThisRound.includes(id)).length;
  const isActive = Boolean(combat.activeEntityId && group.entityIds.includes(combat.activeEntityId));
  const isComplete = acted === group.entityIds.length;

  return (
    <div className={cn(
      'rounded border bg-zinc-950/30',
      isActive ? config.border : 'border-zinc-800/80',
    )}>
      <div className={cn(
        'flex items-center gap-2 border-b border-zinc-800/70 px-2 py-1.5 text-xs',
        isActive ? config.active : 'text-zinc-400',
      )}>
        <Shield className={cn('size-3.5 shrink-0', config.accent)} />
        <span className="min-w-0 flex-1 truncate font-medium">{group.name}</span>
        <span className={cn(
          'text-[10px] tabular-nums',
          isComplete ? 'text-zinc-500' : 'text-zinc-300',
        )}>
          {acted}/{group.entityIds.length}
        </span>
      </div>
      <div className="px-1 py-1">
        {group.entityIds.map((id) => (
          <CombatantRow
            key={id}
            entityId={id}
            combat={combat}
            entityMap={entityMap}
            selectedSet={selectedSet}
            config={config}
            onEntityClick={onEntityClick}
            onEntityDoubleClick={onEntityDoubleClick}
          />
        ))}
      </div>
    </div>
  );
}

function CombatantRow({
  entityId,
  combat,
  entityMap,
  selectedSet,
  config,
  onEntityClick,
  onEntityDoubleClick,
}: {
  entityId: string;
  combat: CombatState;
  entityMap: Map<string, EntityData>;
  selectedSet: Set<string>;
  config: SideConfig;
  onEntityClick: (event: MouseEvent, entityId: string) => void;
  onEntityDoubleClick?: (entityId: string) => void;
}) {
  const entity = entityMap.get(entityId);
  const acted = combat.actedThisRound.includes(entityId);
  const isActive = combat.activeEntityId === entityId;
  const isSelected = selectedSet.has(entityId);

  return (
    <button
      type="button"
      className={cn(
        'flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs transition',
        isSelected && 'bg-sky-500/15 ring-1 ring-sky-400/60',
        isActive
          ? cn(config.active, 'font-medium')
          : acted
            ? 'text-zinc-600 line-through hover:bg-zinc-800/40'
            : 'text-zinc-300 hover:bg-zinc-800/60',
      )}
      onClick={(event) => onEntityClick(event, entityId)}
      onDoubleClick={() => onEntityDoubleClick?.(entityId)}
    >
      <span className={cn('size-1.5 shrink-0 rounded-full', isActive ? 'bg-amber-400' : acted ? 'bg-zinc-700' : 'bg-zinc-400')} />
      <span className="min-w-0 flex-1 truncate">{entity?.name ?? entityId}</span>
      {isActive && <span className="text-[9px] uppercase text-zinc-300">Active</span>}
      {acted && !isActive && <span className="text-[10px] text-zinc-600">Done</span>}
    </button>
  );
}
