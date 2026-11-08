import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LogIn, RefreshCw, Unplug, WifiOff } from 'lucide-react';
import { TooltipProvider } from '@anvil/ui';
import { useSessionSocket } from '../../hooks/useSessionSocket.js';
import { useAuthStore } from '../../stores/authStore.js';
import { ErrorBoundary } from '../../components/ErrorBoundary.js';
import { LoadingSkeleton } from '../../components/LoadingSkeleton.js';
import { StateMessage, StatePage } from '../../components/StateMessage.js';
import { SessionConnectionProvider } from '../../components/session/shell/connection.js';
import { RECONNECT_GIVE_UP_SECONDS, isBadSessionLink, isSignedOut } from '../../lib/reconnect.js';
import { DirectorView } from './DirectorView.js';
import { PlayerView } from './PlayerView.js';
import { PhoneSessionPage } from './PhoneSessionPage.js';
import { isPhoneCompanionViewport } from '../../lib/device.js';
import { useDiceRollToast } from '../../hooks/useDiceRollToast.js';

export function SessionPage() {
  const [usePhoneCompanion] = useState(isPhoneCompanionViewport);
  // Toast every resolved dice roll for all participants (not just the log).
  useDiceRollToast();
  return usePhoneCompanion ? <PhoneSessionPage /> : <DesktopSessionPage />;
}

function DesktopSessionPage() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);

  const { state, status, error, failureStatus, retry, send, combatLog } = useSessionSocket(id ?? null);

  const refused = isBadSessionLink(failureStatus) || isSignedOut(failureStatus);
  if ((error && !state) || (state && status === 'disconnected' && refused)) {
    return <SessionProblem failureStatus={failureStatus} error={error} onRetry={retry} />;
  }

  // Loading a session: the shell in outline with "Opening the table…" (demo `states`).
  if (!state) {
    return <LoadingSkeleton variant="page" />;
  }

  // Determine role from participants list
  const me = state.participants.find((p) => p.userId === user?.id);
  const isDirector = me?.role === 'director';
  // After the give-up window the shell covers the table with "Can't reach the table".
  const lost = status === 'disconnected';
  const viewProps = { sessionState: state, connectionStatus: status, send, combatLog, lost, onRetry: retry };

  return (
    <TooltipProvider delayDuration={0}>
      <ErrorBoundary label="session">
        <SessionConnectionProvider status={status}>
          {isDirector ? <DirectorView {...viewProps} /> : <PlayerView {...viewProps} />}
        </SessionConnectionProvider>
      </ErrorBoundary>
    </TooltipProvider>
  );
}

/*
 * Why the table could not open (DESIGN.md section 4, Error; demo `states`). A bad link or a
 * finished session gets "No live session at this link"; a server that cannot be reached gets
 * "Can't reach the table" with Try again.
 */
function SessionProblem({
  failureStatus,
  error,
  onRetry,
}: {
  failureStatus: number | null;
  error: string | null;
  onRetry: () => void;
}) {
  const navigate = useNavigate();
  const isPlayer = useAuthStore((s) => s.user?.role === 'player');
  const home = isPlayer
    ? { label: 'Your home', onClick: () => navigate('/app') }
    : { label: 'Your campaigns', onClick: () => navigate('/app/campaigns') };
  const roomCode = { label: 'Use a room code', onClick: () => navigate('/app/join') };

  // An expired login is not a bad link: the table is fine, and signing in is the way back.
  if (isSignedOut(failureStatus)) {
    return (
      <StatePage>
        <StateMessage
          icon={<LogIn size={30} strokeWidth={2.4} />}
          title="Sign in to get back to the table"
          body="Your login ended while the table was away. The session is saved on the server."
          go={{ label: 'Sign in', onClick: () => navigate('/auth') }}
        />
      </StatePage>
    );
  }

  if (!isBadSessionLink(failureStatus)) {
    return (
      <StatePage>
        <StateMessage
          icon={<WifiOff size={30} strokeWidth={2.4} />}
          title="Can’t reach the table"
          body={`Anvil tried for ${RECONNECT_GIVE_UP_SECONDS} seconds. Everything up to the drop is saved.`}
          go={{ label: <><RefreshCw size={16} strokeWidth={3} aria-hidden="true" />Try again</>, onClick: onRetry }}
          alt={home}
        />
      </StatePage>
    );
  }

  if (failureStatus === 403 && error && /room code/i.test(error)) {
    return (
      <StatePage>
        <StateMessage
          icon={<Unplug size={30} strokeWidth={2.4} />}
          title="This table needs its room code"
          body="Join from the Live page with the code your Director gave you."
          go={roomCode}
          alt={home}
        />
      </StatePage>
    );
  }

  return (
    <StatePage>
      <StateMessage
        icon={<Unplug size={30} strokeWidth={2.4} />}
        title="No live session at this link"
        body="It may have ended. Its campaign keeps everything that happened."
        go={home}
        alt={roomCode}
      />
    </StatePage>
  );
}
