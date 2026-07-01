import { Circle, Crown, UserRound, Users } from 'lucide-react';
import type { EntityData, ParticipantInfo } from '../../types/protocol.js';

interface ActivePlayersPanelProps {
  participants: ParticipantInfo[];
  entities: EntityData[];
  currentUserId?: string | null;
}

export function ActivePlayersPanel({ participants, entities, currentUserId }: ActivePlayersPanelProps) {
  const entityNames = new Map(entities.map((entity) => [entity.id, entity.name]));
  const sortedParticipants = [...participants].sort((a, b) => {
    if (a.connected !== b.connected) return a.connected ? -1 : 1;
    if (a.role !== b.role) return a.role === 'director' ? -1 : 1;
    return a.username.localeCompare(b.username);
  });

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="size-4 text-zinc-500" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Active Players</h2>
        </div>
        <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-500">
          {sortedParticipants.filter((participant) => participant.connected).length}/{sortedParticipants.length}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {sortedParticipants.length === 0 ? (
          <p className="rounded border border-zinc-800 bg-zinc-900/60 p-3 text-xs text-zinc-500">
            No players have joined yet.
          </p>
        ) : (
          sortedParticipants.map((participant) => {
            const heroName = participant.heroId ? entityNames.get(participant.heroId) : null;
            return (
              <article
                key={participant.userId}
                className="flex items-center gap-2 rounded border border-zinc-800 bg-zinc-900/60 px-3 py-2"
              >
                <span className="relative flex size-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-semibold text-zinc-300">
                  {participant.avatarUrl ? (
                    <img src={participant.avatarUrl} alt="" className="size-full rounded-full object-cover" />
                  ) : (
                    initials(participant.username)
                  )}
                  <Circle
                    className={`absolute -bottom-0.5 -right-0.5 size-3 rounded-full ${
                      participant.connected ? 'fill-emerald-400 text-emerald-400' : 'fill-zinc-600 text-zinc-600'
                    }`}
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-sm font-medium text-zinc-200">
                      {participant.username}
                      {participant.userId === currentUserId ? ' (you)' : ''}
                    </p>
                    {participant.role === 'director' ? (
                      <Crown className="size-3 shrink-0 text-amber-400" />
                    ) : (
                      <UserRound className="size-3 shrink-0 text-zinc-500" />
                    )}
                  </div>
                  <p className="truncate text-[11px] text-zinc-500">
                    {participant.role === 'director' ? 'Director' : heroName ?? 'No hero selected'}
                  </p>
                </div>
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] ${
                    participant.ready ? 'bg-emerald-500/10 text-emerald-300' : 'bg-zinc-800 text-zinc-500'
                  }`}
                >
                  {participant.ready ? 'Ready' : 'Not ready'}
                </span>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?';
}
