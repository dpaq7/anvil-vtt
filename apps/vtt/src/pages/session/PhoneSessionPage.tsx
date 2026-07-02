import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useSessionSocket } from '../../hooks/useSessionSocket.js';
import { useAuthStore } from '../../stores/authStore.js';
import { LockedPhone, StatusBanner } from './phone/phone-shared.js';
import { PhonePlayerView } from './phone/PhonePlayerView.js';
import { PhoneDirectorView } from './phone/PhoneDirectorView.js';

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

  // Hard gate: the phone companion only operates while the same account has a
  // desktop/tablet client connected to this session (the "anchor"). The server
  // enforces this for mutations; the client locks the whole UI for clarity.
  if (phoneAnchorConnected === false) {
    return (
      <LockedPhone message="Open this same live session on a desktop or tablet with your account, then this phone companion will unlock automatically." />
    );
  }

  if (!state) {
    return (
      <main className="flex min-h-[100svh] items-center justify-center bg-zinc-950 p-6 text-center text-zinc-400">
        {phoneAnchorConnected === null ? 'Checking desktop sync...' : error ?? 'Loading session...'}
      </main>
    );
  }

  return (
    <main className="flex h-[100svh] flex-col overflow-hidden bg-zinc-950 text-zinc-100">
      <StatusBanner status={status} anchored={phoneAnchorConnected} error={error} />
      {isDirector ? (
        <PhoneDirectorView state={state} send={send} canMutate={canMutate} />
      ) : (
        <PhonePlayerView state={state} hero={hero} send={send} canMutate={canMutate} />
      )}
    </main>
  );
}
