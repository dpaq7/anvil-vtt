import type { ReactNode } from 'react';
import { CircleDot, Unplug } from 'lucide-react';
import type { ConnectionStatus } from '../../hooks/useSessionSocket.js';
import { useSessionConnection } from './shell/connection-context.js';

interface StatusBarProps {
  connectionStatus: ConnectionStatus;
  /** Who is at the table, between the connection and the actions. */
  children?: ReactNode;
  /** Quiet actions on the right: theme, Display, Fullscreen, Revert… */
  actions?: ReactNode;
}

/*
 * The status bar on the ground under the shell (demo `battle-director`, `sb-status`).
 * Connected reads as a dot and a word. A drop turns it into the yellow reconnect chip
 * with how long the table has been away (demo `states`, `st-link`).
 */
export function StatusBar({ connectionStatus, children, actions }: StatusBarProps) {
  const { dropSeconds } = useSessionConnection();
  return (
    <footer className="sb-status" aria-label="Session status">
      <ConnectionLink status={connectionStatus} seconds={dropSeconds} />
      {children}
      {actions && <div className="sb-status__acts">{actions}</div>}
    </footer>
  );
}

function ConnectionLink({ status, seconds }: { status: ConnectionStatus; seconds: number }) {
  if (status === 'connected') {
    return (
      <span>
        <CircleDot size={13} strokeWidth={3} aria-hidden="true" />
        Connected
      </span>
    );
  }
  const label =
    status === 'disconnected'
      ? 'Disconnected'
      : `${status === 'connecting' ? 'Connecting' : 'Reconnecting'}, ${seconds} s`;
  return (
    <span className="st-link" role="status">
      <Unplug size={13} strokeWidth={3} aria-hidden="true" />
      {label}
    </span>
  );
}
