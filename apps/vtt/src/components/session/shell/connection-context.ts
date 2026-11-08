import { createContext, useContext } from 'react';
import type { ConnectionStatus } from '../../../hooks/useSessionSocket.js';

/*
 * Pause actions on a drop (DESIGN.md section 9, Gate 4). While the socket is away the
 * table stays readable; anything that needs the server reads `paused` and waits.
 * Nothing is queued: the socket's own send still refuses while it is closed.
 */
export interface SessionConnection {
  status: ConnectionStatus;
  /** True while actions that need the server must wait. */
  paused: boolean;
  /** Whole seconds since the table was last in sync, or 0 while connected. */
  dropSeconds: number;
}

export const SessionConnectionContext = createContext<SessionConnection>({
  status: 'connected',
  paused: false,
  dropSeconds: 0,
});

export function useSessionConnection(): SessionConnection {
  return useContext(SessionConnectionContext);
}
