import { useParams } from 'react-router-dom';
import { TooltipProvider } from '@anvil/ui';
import { useSessionSocket } from '../../hooks/useSessionSocket.js';
import { useAuthStore } from '../../stores/authStore.js';
import { ErrorBoundary } from '../../components/ErrorBoundary.js';
import { ReconnectOverlay } from '../../components/ReconnectOverlay.js';
import { LoadingSkeleton } from '../../components/LoadingSkeleton.js';
import { DirectorView } from './DirectorView.js';
import { PlayerView } from './PlayerView.js';

export function SessionPage() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const { state, status, error, send, combatLog } = useSessionSocket(id ?? null);

  if (error && !state) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950" role="alert">
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm text-red-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded bg-zinc-700 px-4 py-1.5 text-sm text-zinc-200 transition hover:bg-zinc-600"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  if (!state) {
    return <LoadingSkeleton variant="page" />;
  }

  // Determine role from participants list
  const me = state.participants.find((p) => p.userId === user?.id);
  const isDirector = me?.role === 'director';

  return (
    <TooltipProvider delayDuration={0}>
      <ErrorBoundary label="session">
        {/* Reconnect overlay shown over the active session */}
        {status !== 'connected' && (
          <ReconnectOverlay status={status} error={error} />
        )}
        {isDirector ? (
          <DirectorView sessionState={state} connectionStatus={status} send={send} combatLog={combatLog} />
        ) : (
          <PlayerView sessionState={state} connectionStatus={status} send={send} combatLog={combatLog} />
        )}
      </ErrorBoundary>
    </TooltipProvider>
  );
}
