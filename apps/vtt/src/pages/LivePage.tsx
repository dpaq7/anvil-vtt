import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@anvil/ui';
import { api } from '../lib/api.js';
import { useAuthStore } from '../stores/authStore.js';
import { CampaignCard } from '../components/sessions/CampaignCard.js';
import { SessionLauncher } from '../components/sessions/SessionLauncher.js';
import type { CampaignData, LiveSession } from '../components/sessions/types.js';

const POLL_INTERVAL_MS = 30_000;

export function LivePage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isDirector = user?.role === 'director';

  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await api.get<{ campaigns: CampaignData[] }>('/api/game-sessions');
      setCampaigns(data.campaigns);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount + poll every 30s
  useEffect(() => {
    load();
    intervalRef.current = setInterval(load, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [load]);

  /** Find the live session (lobby or active) for a campaign. */
  const getLiveSession = (campaign: CampaignData): LiveSession | null => {
    const live = campaign.sessions.find(
      (s) => s.status === 'lobby' || s.status === 'active',
    );
    if (!live) return null;
    return { id: live.id, name: live.name, status: live.status, room_code: live.room_code };
  };

  /** Director: Go Live on a session. */
  const handleGoLive = async (sessionId: string, sceneId: string | null) => {
    try {
      await api.put(`/api/sessions/${sessionId}/go-live`, { sceneId });
      navigate(`/app/session/${sessionId}/lobby`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to go live');
    }
  };

  /** Director: Rejoin a live session. */
  const handleRejoin = (sessionId: string) => {
    const session = campaigns
      .flatMap((c) => c.sessions)
      .find((s) => s.id === sessionId);
    if (session?.status === 'lobby') {
      navigate(`/app/session/${sessionId}/lobby`);
    } else {
      navigate(`/app/session/${sessionId}`);
    }
  };

  /** Director: End an active or lobby session (via DO to save snapshots). */
  const handleEndSession = async (sessionId: string) => {
    try {
      await api.post(`/api/sessions/${sessionId}/end`, {});
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to end session');
    }
  };

  /** Player: Join a live session with their campaign hero. */
  const handlePlayerJoin = async (sessionId: string) => {
    // Find the campaign this session belongs to so we can get the player's hero_id
    const campaign = campaigns.find((c) =>
      c.sessions.some((s) => s.id === sessionId),
    );
    const heroId = campaign?.my_hero?.id ?? null;

    try {
      await api.post(`/api/sessions/${sessionId}/join`, { hero_id: heroId });
      // Check if session is in lobby or active
      const session = campaign?.sessions.find((s) => s.id === sessionId);
      if (session?.status === 'lobby') {
        navigate(`/app/session/${sessionId}/lobby`);
      } else {
        navigate(`/app/session/${sessionId}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to join session');
    }
  };

  // Split campaigns by role for directors who may also be players in other campaigns
  const directedCampaigns = campaigns.filter((c) => c.role === 'director');
  const joinedCampaigns = campaigns.filter((c) => c.role === 'player');
  const visibleCampaigns = isDirector ? campaigns : joinedCampaigns;

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-zinc-500">
        Loading...
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Live</h1>
        <Link to="/app/join">
          <Button variant="outline" size="sm">
            Join by Code
          </Button>
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded bg-red-900/30 px-4 py-2 text-sm text-red-400">
          {error}
        </div>
      )}

      {visibleCampaigns.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <p className="text-zinc-500">No campaigns yet.</p>
          {isDirector ? (
            <Link to="/app/campaigns">
              <Button variant="outline">Create a Campaign</Button>
            </Link>
          ) : (
            <p className="text-sm text-zinc-600">
              Ask your Director for an invite link to join a campaign.
            </p>
          )}
        </div>
      )}

      {/* Director's campaigns */}
      {isDirector && directedCampaigns.length > 0 && (
        <section className="mb-8">
          {joinedCampaigns.length > 0 && (
            <h2 className="mb-4 text-lg font-semibold text-zinc-300">
              My Campaigns
            </h2>
          )}
          <div className="flex flex-col gap-4">
            {directedCampaigns.map((campaign) => {
              const liveSession = getLiveSession(campaign);
              return (
                <div key={campaign.id} className="flex flex-col gap-2">
                  <CampaignCard
                    campaign={campaign}
                    liveSession={liveSession}
                    isDirector={true}
                    onJoinSession={handleRejoin}
                    onEndSession={handleEndSession}
                  />
                  <SessionLauncher
                    modules={campaign.modules}
                    sessions={campaign.sessions}
                    scenes={campaign.scenes}
                    onGoLive={handleGoLive}
                    onRejoin={handleRejoin}
                  />
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Campaigns joined as player */}
      {joinedCampaigns.length > 0 && (
        <section>
          {directedCampaigns.length > 0 && (
            <h2 className="mb-4 text-lg font-semibold text-zinc-300">
              Joined Campaigns
            </h2>
          )}
          <div className="flex flex-col gap-4">
            {joinedCampaigns.map((campaign) => {
              const liveSession = getLiveSession(campaign);
              return (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  liveSession={liveSession}
                  isDirector={false}
                  onJoinSession={handlePlayerJoin}
                />
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
