import {
  Activity,
  Circle,
  HeartPulse,
  Medal,
  Trophy,
  UserRound,
  Zap,
} from 'lucide-react';
import type { ReactNode } from 'react';
import type { EntityData, ParticipantInfo } from '../../types/protocol.js';

interface PlayerCharactersPanelProps {
  participants: ParticipantInfo[];
  entities: EntityData[];
}

interface PlayerCharacterRow {
  participant: ParticipantInfo;
  hero: EntityData | null;
}

export function getJoinedPlayerCharacters(
  participants: ParticipantInfo[],
  entities: EntityData[],
): PlayerCharacterRow[] {
  const entityById = new Map(entities.map((entity) => [entity.id, entity]));
  return participants
    .filter(
      (participant) => participant.role === 'player' && participant.heroId,
    )
    .map((participant) => ({
      participant,
      hero: entityById.get(participant.heroId ?? '') ?? null,
    }))
    .sort((a, b) => {
      if (a.participant.connected !== b.participant.connected) {
        return a.participant.connected ? -1 : 1;
      }
      const aName = a.hero?.name ?? a.participant.username;
      const bName = b.hero?.name ?? b.participant.username;
      return aName.localeCompare(bName);
    });
}

export function PlayerCharactersPanel({
  participants,
  entities,
}: PlayerCharactersPanelProps) {
  const players = getJoinedPlayerCharacters(participants, entities);

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-zinc-800 px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <UserRound className="size-4 shrink-0 text-cyan-300" />
          <h2 className="truncate text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Player Characters
          </h2>
        </div>
        <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-500">
          {players.filter(({ participant }) => participant.connected).length}/
          {players.length}
        </span>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
        {players.length === 0 ? (
          <p className="rounded border border-zinc-800 bg-zinc-900/60 p-3 text-xs text-zinc-500">
            No player characters have joined this live game yet.
          </p>
        ) : (
          players.map(({ participant, hero }) => (
            <PlayerCharacterCard
              key={participant.userId}
              hero={hero}
              participant={participant}
            />
          ))
        )}
      </div>
    </section>
  );
}

function PlayerCharacterCard({
  hero,
  participant,
}: {
  hero: EntityData | null;
  participant: ParticipantInfo;
}) {
  const name = hero?.name ?? 'Unassigned hero';
  const level = getNumber(hero, 'level', 1);
  const currentStamina = getNumber(hero, 'currentStamina', 0);
  const maxStamina = getNumber(hero, 'maxStamina', currentStamina);
  const recoveriesCurrent = getNumber(hero, 'recoveriesCurrent', 0);
  const recoveriesMax = getNumber(hero, 'recoveriesMax', recoveriesCurrent);
  const heroicEssence = getNumber(hero, 'heroicResource', 0);
  const victories = getNumber(hero, 'victories', 0);
  const xp = getNumber(hero, 'xp', 0);

  return (
    <article className="rounded-md border border-zinc-800 bg-zinc-900/70 p-3 shadow-sm">
      <div className="flex items-start gap-2">
        <span className="relative flex size-9 shrink-0 items-center justify-center rounded-md border border-cyan-800/60 bg-cyan-950/20 text-sm font-black text-cyan-100">
          {hero ? (name[0]?.toUpperCase() ?? '?') : '?'}
          <Circle
            className={`absolute -bottom-1 -right-1 size-3.5 rounded-full ${participant.connected ? 'fill-emerald-400 text-emerald-400' : 'fill-zinc-600 text-zinc-600'}`}
          />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="break-words text-sm font-semibold leading-snug text-zinc-100">
                {name}
              </p>
              <p className="mt-0.5 truncate text-[11px] text-zinc-500">
                {participant.username}
              </p>
            </div>
            <span className="shrink-0 rounded border border-zinc-700 bg-zinc-950 px-1.5 py-0.5 text-[10px] font-semibold text-violet-200">
              L{level}
            </span>
          </div>
          {!hero && (
            <p className="mt-2 rounded border border-amber-500/30 bg-amber-950/20 px-2 py-1 text-[11px] text-amber-200">
              Hero data is not currently in the scene state.
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <VitalStat
          icon={<HeartPulse className="size-3.5" />}
          label="Stamina"
          value={`${currentStamina}/${maxStamina}`}
          tone="text-rose-300"
        />
        <VitalStat
          icon={<Activity className="size-3.5" />}
          label="Recoveries"
          value={`${recoveriesCurrent}/${recoveriesMax}`}
          tone="text-emerald-300"
        />
        <VitalStat
          icon={<Zap className="size-3.5" />}
          label="Heroic Essence"
          value={String(heroicEssence)}
          tone="text-amber-300"
        />
        <VitalStat
          icon={<Trophy className="size-3.5" />}
          label="Victories"
          value={xp > 0 ? `${victories}/${xp}` : String(victories)}
          tone="text-cyan-300"
        />
        <VitalStat
          icon={<Medal className="size-3.5" />}
          label="Level"
          value={`L${level}`}
          tone="text-violet-300"
          className="col-span-2"
        />
      </div>
    </article>
  );
}

function VitalStat({
  className,
  icon,
  label,
  tone,
  value,
}: {
  className?: string;
  icon: ReactNode;
  label: string;
  tone: string;
  value: string;
}) {
  return (
    <div
      className={`rounded border border-zinc-800 bg-zinc-950/50 p-2 ${className ?? ''}`}
    >
      <div className={`mb-1 flex items-center gap-1.5 ${tone}`}>
        {icon}
        <span className="min-w-0 truncate text-[10px] font-semibold uppercase tracking-wide">
          {label}
        </span>
      </div>
      <p className="text-sm font-semibold text-zinc-100">{value}</p>
    </div>
  );
}

function getNumber(
  hero: EntityData | null | undefined,
  key: string,
  fallback: number,
): number {
  const value = hero?.[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}
