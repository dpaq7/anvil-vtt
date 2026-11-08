import { RefreshCw, WifiOff } from 'lucide-react';
import type { ConnectionStatus } from '../hooks/useSessionSocket.js';
import { RECONNECT_GIVE_UP_SECONDS } from '../lib/reconnect.js';
import { StateMessage, type StateAction } from './StateMessage.js';
import './session/shell/session-shell.css';

/*
 * Reconnect (DESIGN.md sections 4 and 9; demo `states`: A short drop, Connection lost).
 * A short drop never hides the table: a hazard strip hangs from the screen's top-left and
 * says how old the table is. After the give-up window the table is covered by one message
 * with a way forward.
 */

/** The hazard strip for a short drop. `fixed` pins it to the viewport instead of the screen. */
export function DropStrip({ seconds, fixed = false }: { seconds: number; fixed?: boolean }) {
  const age = seconds <= 1 ? 'a moment ago' : `${seconds} seconds ago`;
  return (
    <div className={fixed ? 'st-drop st-drop--fixed' : 'st-drop'} role="status">
      <i aria-hidden="true">
        <WifiOff size={18} strokeWidth={2.6} />
      </i>
      <b>Reconnecting…</b>
      <span>The table is as it was {age}. You can keep reading it.</span>
    </div>
  );
}

/** After the give-up window: "Can't reach the table", over a scrim, with Try again. */
export function ConnectionLost({ onRetry, back }: { onRetry: () => void; back?: StateAction }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[var(--art-scrim)] p-6">
      <div className="w-full max-w-[440px] border-[3px] border-art-ink bg-surface px-6 py-7 shadow-[var(--shape-hard-shadow-large)_var(--art-ink)]">
        <StateMessage
          icon={<WifiOff size={30} strokeWidth={2.4} />}
          title="Can’t reach the table"
          body={`Anvil tried for ${RECONNECT_GIVE_UP_SECONDS} seconds. Everything up to the drop is saved.`}
          go={{
            label: (
              <>
                <RefreshCw size={16} strokeWidth={3} aria-hidden="true" />
                Try again
              </>
            ),
            onClick: onRetry,
          }}
          alt={back}
        />
      </div>
    </div>
  );
}

interface ReconnectOverlayProps {
  status: ConnectionStatus;
  error: string | null;
  /** Seconds since the table was last in sync. */
  seconds?: number;
  onRetry?: () => void;
  back?: StateAction;
}

/**
 * Viewport-level reconnect notice for surfaces without the session shell (the Display).
 * The session shell draws the strip inside its own screen instead.
 */
export function ReconnectOverlay({ status, error, seconds = 0, onRetry, back }: ReconnectOverlayProps) {
  if (status === 'connected') return null;
  if (status === 'disconnected' && error) {
    return <ConnectionLost onRetry={onRetry ?? (() => window.location.reload())} back={back} />;
  }
  return <DropStrip seconds={seconds} fixed />;
}
