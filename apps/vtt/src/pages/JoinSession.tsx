import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, CardHeader, CardTitle, CardContent, Input } from '@anvil/ui';
import { api } from '../lib/api.js';
import { useAuthStore } from '../stores/authStore.js';
import type { HeroSummary } from '@anvil/types';

interface SessionLookup {
  id: string;
  name: string;
  campaign_id: string;
  campaign_name: string;
  status: string;
}

export function JoinSession() {
  const { code: paramCode } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);

  const [code, setCode] = useState(paramCode ?? '');
  const [session, setSession] = useState<SessionLookup | null>(null);
  const [heroes, setHeroes] = useState<HeroSummary[]>([]);
  const [selectedHeroId, setSelectedHeroId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  // If not authenticated, redirect to auth with returnTo
  useEffect(() => {
    if (!loading && !user) {
      const returnTo = paramCode ? `/app/join/${paramCode}` : '/app/join';
      navigate(`/auth?returnTo=${encodeURIComponent(returnTo)}`);
    }
  }, [user, loading, navigate, paramCode]);

  // Auto-lookup when code param present
  useEffect(() => {
    if (paramCode) lookup(paramCode);
  }, [paramCode]);

  // Load heroes
  useEffect(() => {
    api.get<HeroSummary[]>('/api/heroes').then(setHeroes).catch(() => {});
  }, []);

  const lookup = async (roomCode: string) => {
    setError(null);
    try {
      const data = await api.get<{ session: SessionLookup }>(`/api/sessions/by-code/${roomCode.toUpperCase()}`);
      setSession(data.session);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid room code');
      setSession(null);
    }
  };

  const join = async () => {
    if (!session) return;
    setJoining(true);
    try {
      await api.post(`/api/sessions/${session.id}/join`, { hero_id: selectedHeroId });
      navigate(session.status === 'lobby' ? `/app/session/${session.id}/lobby` : `/app/session/${session.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to join');
      setJoining(false);
    }
  };

  if (loading) {
    return <div className="flex h-full items-center justify-center text-zinc-500">Loading...</div>;
  }

  return (
    <div className="flex h-full items-center justify-center">
      <Card className="w-96">
        <CardHeader>
          <CardTitle>Join Session</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {!session && (
            <>
              <div>
                <p className="mb-1 text-sm text-zinc-400">Room Code</p>
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="Enter 6-character code"
                  maxLength={6}
                  className="font-mono text-lg tracking-widest"
                />
              </div>
              <Button onClick={() => lookup(code)} disabled={code.length < 6}>
                Find Session
              </Button>
            </>
          )}

          {session && (
            <>
              <div className="rounded bg-zinc-800 p-3">
                <p className="text-sm font-medium text-zinc-200">{session.name}</p>
                <p className="text-xs text-zinc-500">{session.campaign_name}</p>
              </div>

              <div>
                <p className="mb-1 text-sm text-zinc-400">Select Hero</p>
                <select
                  className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
                  value={selectedHeroId ?? ''}
                  onChange={(e) => setSelectedHeroId(e.target.value || null)}
                >
                  <option value="">Choose a hero...</option>
                  {heroes.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name} ({h.heroClass ?? 'No class'} Lv{h.level})
                    </option>
                  ))}
                </select>
              </div>

              <Button onClick={join} disabled={joining} className="w-full">
                {joining ? 'Joining...' : 'Join Session'}
              </Button>
            </>
          )}

          {error && <p className="text-sm text-red-400">{error}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
