import { cn } from '@anvil/ui';
import type { ParticipantInfo } from '../../types/protocol.js';
import type { ConnectionStatus } from '../../hooks/useSessionSocket.js';

interface ParticipantStatusBarProps {
  participants: ParticipantInfo[];
  connectionStatus: ConnectionStatus;
}

const CONN_DOT: Record<ConnectionStatus, string> = {
  connected: 'bg-emerald-400',
  connecting: 'bg-amber-400',
  reconnecting: 'bg-amber-400',
  disconnected: 'bg-red-400',
};

const CONN_LABEL: Record<ConnectionStatus, string> = {
  connected: 'Connected',
  connecting: 'Connecting...',
  reconnecting: 'Reconnecting...',
  disconnected: 'Disconnected',
};

/**
 * Minimalist horizontal bar showing connection status + player avatars with
 * connected/disconnected indicators. Sits below the main canvas.
 */
export function ParticipantStatusBar({ participants, connectionStatus }: ParticipantStatusBarProps) {
  const directors = participants.filter((p) => p.role === 'director');
  const players = participants.filter((p) => p.role === 'player');
  const connectedCount = players.filter((p) => p.connected).length;

  return (
    <div className="flex h-full items-center gap-3 text-xs">
      {/* Connection status */}
      <span className="flex items-center gap-1.5 text-zinc-500">
        <span className={cn('inline-block h-1.5 w-1.5 rounded-full', CONN_DOT[connectionStatus])} />
        {CONN_LABEL[connectionStatus]}
      </span>

      <div className="h-3 w-px bg-zinc-800" />

      {/* Director chip(s) */}
      {directors.map((d) => (
        <div key={d.userId} className="flex items-center gap-1" title={`${d.username} (Director)`}>
          <span
            className={cn(
              'inline-block h-1.5 w-1.5 rounded-full',
              d.connected ? 'bg-amber-400' : 'bg-zinc-600',
            )}
          />
          <span className={cn('text-xs font-medium', d.connected ? 'text-amber-300' : 'text-zinc-600')}>
            {d.username}
          </span>
          <span className="rounded bg-amber-500/15 px-1 text-[9px] uppercase tracking-wide text-amber-400/90">
            Director
          </span>
        </div>
      ))}

      {directors.length > 0 && <div className="h-3 w-px bg-zinc-800" />}

      {/* Player chips */}
      <div className="flex items-center gap-2">
        {players.map((p) => (
          <div key={p.userId} className="flex items-center gap-1" title={p.username}>
            <span
              className={cn(
                'inline-block h-1.5 w-1.5 rounded-full',
                p.connected ? 'bg-emerald-400' : 'bg-zinc-600',
              )}
            />
            <span className={cn('text-xs', p.connected ? 'text-zinc-300' : 'text-zinc-600')}>
              {p.username}
            </span>
          </div>
        ))}
        {players.length === 0 && (
          <span className="text-zinc-600">No players connected</span>
        )}
      </div>

      <div className="flex-1" />

      {/* Summary */}
      <span className="text-zinc-600">
        {connectedCount}/{players.length} players
      </span>
    </div>
  );
}
