import type { ReactNode } from 'react';
import type { ParticipantInfo } from '../../types/protocol.js';
import type { ConnectionStatus } from '../../hooks/useSessionSocket.js';
import { StatusBar } from './StatusBar.js';

interface ParticipantStatusBarProps {
  participants: ParticipantInfo[];
  connectionStatus: ConnectionStatus;
  /** Whose shell this is: their own side of the table is named first. */
  viewerRole?: 'director' | 'player';
  actions?: ReactNode;
}

/**
 * The session status bar with who is at the table: "Dev Director, Director", each player,
 * then "n/m players". Someone away reads "(away)", never by colour alone.
 */
export function ParticipantStatusBar({
  participants,
  connectionStatus,
  viewerRole = 'director',
  actions,
}: ParticipantStatusBarProps) {
  const directors = participants.filter((p) => p.role === 'director');
  const players = participants.filter((p) => p.role === 'player');
  const connectedCount = players.filter((p) => p.connected).length;

  const directorItems = directors.map((d) => (
    <Who key={d.userId} name={`${d.username}, Director`} connected={d.connected} />
  ));
  const playerItems = players.map((p) => (
    <Who key={p.userId} name={p.username} connected={p.connected} />
  ));

  return (
    <StatusBar connectionStatus={connectionStatus} actions={actions}>
      {viewerRole === 'director' ? directorItems : playerItems}
      {viewerRole === 'director' ? playerItems : directorItems}
      {players.length === 0 ? (
        <span className="sb-status__off">No players yet</span>
      ) : (
        <span>
          {connectedCount}/{players.length} players
        </span>
      )}
    </StatusBar>
  );
}

function Who({ name, connected }: { name: string; connected: boolean }) {
  return (
    <span className={connected ? undefined : 'sb-status__off'} title={connected ? name : `${name} (away)`}>
      {name}
      {!connected && ' (away)'}
    </span>
  );
}
