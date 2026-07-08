import { Clapperboard, Dices, Swords } from 'lucide-react';
import { Button, cn } from '@anvil/ui';
import type { CombatState, EntityData } from '../../types/protocol.js';
import { getVillainDisplayGroups } from '../../lib/combat-groups.js';

interface BattleTurnTrackerProps {
  combat: CombatState | null;
  entities: EntityData[];
  onRollInitiative?: () => void;
  className?: string;
}

type CombatSide = 'heroes' | 'villains';

const SIDE_CONFIG: Record<CombatSide, {
  label: string;
  Icon: typeof Swords;
  activeClass: string;
  readyClass: string;
  actedClass: string;
}> = {
  heroes: {
    label: 'Heroes',
    Icon: Swords,
    activeClass: 'border-blue-400/70 bg-blue-500/15 text-blue-200',
    readyClass: 'bg-blue-400',
    actedClass: 'bg-blue-950 text-blue-300 ring-blue-700/70',
  },
  villains: {
    label: 'Director',
    Icon: Clapperboard,
    activeClass: 'border-red-400/70 bg-red-500/15 text-red-200',
    readyClass: 'bg-red-400',
    actedClass: 'bg-red-950 text-red-300 ring-red-700/70',
  },
};

export function BattleTurnTracker({ combat, entities, onRollInitiative, className }: BattleTurnTrackerProps) {
  if (!combat) return null;

  const entityMap = new Map(entities.map((entity) => [entity.id, entity]));
  const initiativePending = combat.initiativeRoll === null || combat.firstSide === null || combat.activeSide === null;
  const sideOrder: CombatSide[] = combat.firstSide
    ? [combat.firstSide, combat.firstSide === 'heroes' ? 'villains' : 'heroes']
    : ['heroes', 'villains'];

  return (
    <div
      className={cn(
        'flex h-9 shrink-0 items-center gap-2 rounded-md border border-zinc-800 bg-zinc-950/70 px-2 text-xs',
        className,
      )}
    >
      <div className="flex shrink-0 items-center gap-1.5">
        <span className="flex size-6 items-center justify-center rounded-md bg-zinc-800 text-zinc-300">
          <Dices className="size-3.5" />
        </span>
        <div className="leading-tight">
          <p className="font-semibold text-zinc-200">Round {combat.round}</p>
          <p className="text-[10px] text-zinc-500">
            {initiativePending ? 'Initiative pending' : `d10 ${combat.initiativeRoll}`}
          </p>
        </div>
      </div>

      <div className="h-5 w-px shrink-0 bg-zinc-800" />

      {initiativePending ? (
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-[11px] text-zinc-400">Roll 6+ for heroes</span>
          {onRollInitiative && (
            <Button type="button" variant="secondary" size="sm" className="h-7 shrink-0 px-2 text-xs" onClick={onRollInitiative}>
              Roll d10
            </Button>
          )}
        </div>
      ) : (
        <div className="flex min-w-0 items-center gap-1.5">
          {sideOrder.map((side, index) => (
            <SideSegment
              key={side}
              side={side}
              order={index + 1}
              combat={combat}
              entityMap={entityMap}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SideSegment({
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
  const statusDots = usesGroups
    ? villainGroups.slice(0, 6).map((group) => ({
        id: group.id,
        title: `${group.name}: ${group.entityIds.filter((id) => combat.actedThisRound.includes(id)).length}/${group.entityIds.length}`,
        hasActed: group.entityIds.every((id) => combat.actedThisRound.includes(id)),
        isEntityActive: Boolean(combat.activeEntityId && group.entityIds.includes(combat.activeEntityId)),
      }))
    : ids.slice(0, 6).map((id) => {
        const entity = entityMap.get(id);
        return {
          id,
          title: entity?.name ?? id,
          hasActed: combat.actedThisRound.includes(id),
          isEntityActive: combat.activeEntityId === id,
        };
      });

  return (
    <div
      className={cn(
        'flex h-7 min-w-0 items-center gap-1.5 rounded border border-zinc-800 px-1.5 text-zinc-400',
        isActive && config.activeClass,
      )}
      title={usesGroups
        ? `${config.label}: ${acted}/${total} groups complete; ${ids.filter((id) => combat.actedThisRound.includes(id)).length}/${ids.length} creatures acted`
        : `${config.label}: ${acted}/${total} acted`}
    >
      <span className="text-[9px] font-semibold tabular-nums text-zinc-500">{order}</span>
      <Icon className="size-3 shrink-0" />
      <span className="max-w-16 truncate font-medium">{config.label}</span>
      <span className="text-[10px] tabular-nums text-zinc-500">{acted}/{total}</span>
      <div className="ml-0.5 flex max-w-16 items-center gap-0.5 overflow-hidden">
        {statusDots.map((dot) => {
          return (
            <span
              key={dot.id}
              className={cn(
                'size-1.5 shrink-0 rounded-full',
                dot.isEntityActive
                  ? 'bg-amber-400 ring-2 ring-amber-400/40'
                  : dot.hasActed
                    ? cn('ring-1', config.actedClass)
                    : config.readyClass,
              )}
              title={dot.title}
            />
          );
        })}
        {total > 6 && <span className="text-[9px] text-zinc-600">+{total - 6}</span>}
      </div>
    </div>
  );
}
