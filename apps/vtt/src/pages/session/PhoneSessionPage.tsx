import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useSessionSocket } from '../../hooks/useSessionSocket.js';
import { useAuthStore } from '../../stores/authStore.js';
import { SessionConnectionProvider } from '../../components/session/shell/connection.js';
import { LockedPhone, PhoneLoading } from './phone/PhoneFrame.js';
import { PhonePlayerView } from './phone/PhonePlayerView.js';
import { PhoneDirectorView } from './phone/PhoneDirectorView.js';

/** The in-session phone. States from the states sheet: Phone locked, Phone short drop, Phone loading. */
export function PhoneSessionPage() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const { state, status, error, send, phoneAnchorConnected } = useSessionSocket(id ?? null, { clientKind: 'phone' });

  const me = useMemo(
    () => state?.participants.find((participant) => participant.userId === user?.id) ?? null,
    [state?.participants, user?.id],
  );
  const isDirector = me?.role === 'director';
  const hero = useMemo(() => {
    if (!state) return null;
    return (
      state.entities.find((entity) => entity.id === me?.heroId) ??
      state.entities.find((entity) => entity.type === 'hero' && entity['ownerUserId'] === user?.id) ??
      null
    );
  }, [me?.heroId, state, user?.id]);
  const canMutate = status === 'connected' && phoneAnchorConnected === true;
  // A drop: the sheet stays readable and the docked action waits, saying so.
  const waiting = Boolean(state) && status !== 'connected';

  // Hard gate: the phone companion only operates while the same account has a
  // desktop/tablet client connected to this session (the "anchor"). The server
  // enforces this for mutations; the client locks the whole UI for clarity.
  if (phoneAnchorConnected === false) return <LockedPhone />;

  if (!state) {
    return <PhoneLoading label={phoneAnchorConnected === null ? 'Checking your laptop…' : isDirector ? 'Loading the table…' : 'Loading your hero…'} error={error} />;
  }

  return (
    <SessionConnectionProvider status={status}>
      {isDirector ? (
        <PhoneDirectorView state={state} send={send} canMutate={canMutate} waiting={waiting} />
      ) : (
        <PhonePlayerView state={state} hero={hero} send={send} canMutate={canMutate} waiting={waiting} />
      )}
    </SessionConnectionProvider>
  );
}
