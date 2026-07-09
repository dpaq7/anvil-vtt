import { useEffect, useState } from 'react';
import type { HeroSummary, Note } from '@anvil/types';
import { api } from '../../lib/api.js';
import { useAuthStore } from '../../stores/authStore.js';
import { PERSONAL_NOTEBOOK_ID } from '../../stores/notesStore.js';
import type { CampaignData } from '../sessions/types.js';
import type { AssetItem, DashboardState } from './types.js';
import { toTimestamp } from './format.js';

const MAX_NOTE_CAMPAIGNS = 8;
const PERSONAL_NOTEBOOK_NAME = 'Personal Notes';

const INITIAL_DASHBOARD: DashboardState = {
  campaigns: [],
  heroes: [],
  notes: [],
  assets: [],
};

export function useDashboardData() {
  const user = useAuthStore((state) => state.user);
  const [data, setData] = useState<DashboardState>(INITIAL_DASHBOARD);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      if (!user) return;
      setLoading(true);
      setError(null);

      try {
        const [{ campaigns }, heroes, assetsResponse] = await Promise.all([
          api.get<{ campaigns: CampaignData[] }>('/api/game-sessions'),
          api.get<HeroSummary[]>('/api/heroes').catch(() => []),
          api.get<{ assets: AssetItem[] }>('/api/assets').catch(() => ({ assets: [] })),
        ]);

        const noteCampaigns = campaigns.slice(0, MAX_NOTE_CAMPAIGNS);
        const noteResults = await Promise.allSettled([
          api.get<{ notes: Note[] }>('/api/notes/personal/notes')
            .then(({ notes }) => notes.map((note) => ({
              ...note,
              campaignId: PERSONAL_NOTEBOOK_ID,
              campaignName: PERSONAL_NOTEBOOK_NAME,
            }))),
          ...noteCampaigns.map(async (campaign) => {
            const { notes } = await api.get<{ notes: Note[] }>(`/api/campaigns/${campaign.id}/notes`);
            return notes.map((note) => ({ ...note, campaignName: campaign.name }));
          }),
        ]);

        const notes = noteResults
          .flatMap((result) => (result.status === 'fulfilled' ? result.value : []))
          .sort((a, b) => toTimestamp(b.updatedAt) - toTimestamp(a.updatedAt));

        const assets = [...assetsResponse.assets].sort(
          (a, b) => toTimestamp(b.uploaded_at ?? b.created_at) - toTimestamp(a.uploaded_at ?? a.created_at),
        );

        if (!cancelled) {
          setData({
            campaigns,
            heroes,
            notes,
            assets,
          });
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load dashboard');
          setData(INITIAL_DASHBOARD);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadDashboard();
    return () => {
      cancelled = true;
    };
  }, [user]);

  return { data, loading, error };
}
