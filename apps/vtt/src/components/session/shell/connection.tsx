import { useEffect, useState, type ReactNode } from 'react';
import type { ConnectionStatus } from '../../../hooks/useSessionSocket.js';
import { SessionConnectionContext } from './connection-context.js';

export function SessionConnectionProvider({
  status,
  children,
}: {
  status: ConnectionStatus;
  children: ReactNode;
}) {
  const dropSeconds = useDropSeconds(status);
  const paused = status !== 'connected';
  return (
    <SessionConnectionContext.Provider value={{ status, paused, dropSeconds }}>
      {children}
    </SessionConnectionContext.Provider>
  );
}

/** Counts the seconds since the status last left "connected". */
function useDropSeconds(status: ConnectionStatus): number {
  const [since, setSince] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const connected = status === 'connected';

  useEffect(() => {
    if (connected) {
      setSince(null);
      return;
    }
    setSince((prev) => prev ?? Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [connected]);

  if (since === null) return 0;
  return Math.max(0, Math.round((now - since) / 1000));
}
