import type { ConnectionStatus } from '../hooks/useSessionSocket.js';

interface ReconnectOverlayProps {
  status: ConnectionStatus;
  error: string | null;
}

export function ReconnectOverlay({ status, error }: ReconnectOverlayProps) {
  if (status === 'connected') return null;

  return (
    <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900 px-8 py-6">
        {status === 'reconnecting' && (
          <>
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-600 border-t-zinc-200" />
            <p className="text-sm text-zinc-300">Reconnecting...</p>
            <p className="text-xs text-zinc-500">Your session data is preserved.</p>
          </>
        )}
        {status === 'disconnected' && error && (
          <>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10">
              <span className="text-lg text-red-400">!</span>
            </div>
            <p className="text-sm font-medium text-red-400">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-1 rounded bg-zinc-700 px-4 py-1.5 text-sm text-zinc-200 transition hover:bg-zinc-600"
            >
              Refresh Page
            </button>
          </>
        )}
        {status === 'connecting' && (
          <>
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-600 border-t-zinc-200" />
            <p className="text-sm text-zinc-300">Connecting...</p>
          </>
        )}
      </div>
    </div>
  );
}
