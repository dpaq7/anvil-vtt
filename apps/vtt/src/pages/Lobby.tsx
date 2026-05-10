import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, CardHeader, CardTitle, CardContent } from '@anvil/ui';
import { api } from '../lib/api.js';
import { useAuthStore } from '../stores/authStore.js';
import { useSessionSocket } from '../hooks/useSessionSocket.js';
import type { HeroSummary } from '@anvil/types';

interface SessionInfo {
  id: string;
  name: string;
  campaign_id: string;
  room_code: string;
  status: string;
  director_id?: string;
}

export function Lobby() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { state, send, sessionStarted } = useSessionSocket(id ?? null);
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [heroes, setHeroes] = useState<HeroSummary[]>([]);
  const [selectedHeroId, setSelectedHeroId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDirector = session && user && session.director_id === user.id;
  const participants = state?.participants ?? [];

  // Load session info (one-time for metadata like room_code)
  useEffect(() => {
    if (!id) return;
    api.get<{ session: SessionInfo }>(`/api/sessions/${id}`)
      .then((d) => setSession(d.session))
      .catch((e: Error) => setError(e.message));
  }, [id]);

  // Load heroes for player hero selection
  useEffect(() => {
    if (isDirector) return;
    api.get<HeroSummary[]>('/api/heroes').then(setHeroes).catch(() => {});
  }, [isDirector]);

  // Navigate to session when the lobby transitions to active.
  useEffect(() => {
    if ((sessionStarted || session?.status === 'active') && id) {
      navigate(`/app/session/${id}`);
    }
  }, [sessionStarted, session?.status, id, navigate]);

  // Toggle ready via WebSocket
  const toggleReady = () => {
    const newReady = !ready;
    setReady(newReady);
    send({ type: 'ready', ready: newReady });
  };

  // Select hero via WebSocket
  const handleHeroSelect = (heroId: string | null) => {
    setSelectedHeroId(heroId);
    if (heroId) send({ type: 'select_hero', heroId });
  };

  // Start session (director only)
  const startSession = async () => {
    if (!id) return;
    try {
      await api.post(`/api/sessions/${id}/start`);
      navigate(`/app/session/${id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start');
    }
  };

  const cancel = () => { navigate(-1); };

  const copyCode = () => {
    if (session?.room_code) navigator.clipboard.writeText(session.room_code);
  };

  if (error) return <div className="flex h-full items-center justify-center text-red-400">{error}</div>;
  if (!session) return <div className="flex h-full items-center justify-center text-zinc-500">Loading...</div>;

  return (
    <div className="flex h-full items-center justify-center">
      <Card className="w-[480px]">
        <CardHeader>
          <CardTitle>{session.name}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {/* Room code */}
          <div className="text-center">
            <p className="mb-1 text-xs uppercase text-zinc-500">Room Code</p>
            <button
              onClick={copyCode}
              className="rounded bg-zinc-800 px-6 py-3 font-mono text-3xl font-bold tracking-widest text-zinc-100 transition hover:bg-zinc-700"
              title="Click to copy"
            >
              {session.room_code}
            </button>
          </div>

          {/* Participants */}
          <div>
            <p className="mb-2 text-sm font-medium text-zinc-300">Participants</p>
            <div className="flex flex-col gap-2">
              {participants.length === 0 && (
                <p className="text-sm text-zinc-500">Waiting for players...</p>
              )}
              {participants.map((p) => (
                <div key={p.userId} className="flex items-center gap-3 rounded bg-zinc-800 px-3 py-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-700 text-xs text-zinc-300">
                    {p.username[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-zinc-200">{p.username}</p>
                    <p className="text-xs text-zinc-500">{p.role}</p>
                  </div>
                  {p.role === 'player' && (
                    <span className={`text-xs ${p.ready ? 'text-green-400' : 'text-zinc-500'}`}>
                      {p.ready ? 'Ready' : 'Not ready'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Player: hero select + ready */}
          {!isDirector && (
            <div className="flex flex-col gap-3">
              <div>
                <p className="mb-1 text-sm text-zinc-400">Select Hero</p>
                <select
                  className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
                  value={selectedHeroId ?? ''}
                  onChange={(e) => handleHeroSelect(e.target.value || null)}
                >
                  <option value="">Choose a hero...</option>
                  {heroes.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name} ({h.heroClass ?? 'No class'} Lv{h.level})
                    </option>
                  ))}
                </select>
              </div>
              <Button
                onClick={toggleReady}
                variant={ready ? 'default' : 'outline'}
                className="w-full"
                disabled={!selectedHeroId}
              >
                {ready ? 'Ready!' : 'Mark Ready'}
              </Button>
            </div>
          )}

          {/* Director: start / cancel */}
          {isDirector && (
            <div className="flex gap-3">
              <Button variant="ghost" onClick={cancel} className="flex-1">
                Cancel
              </Button>
              <Button onClick={startSession} className="flex-1">
                Start Session
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
