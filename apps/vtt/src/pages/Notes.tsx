import { useEffect, useState, useCallback, useMemo } from 'react';
import { StickyNote, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@anvil/ui';
import { api } from '../lib/api.js';
import { useAuthStore } from '../stores/authStore.js';
import { PERSONAL_NOTEBOOK_ID, useNotesStore } from '../stores/notesStore.js';
import { NoteTreeSidebar } from '../components/notes/NoteTreeSidebar.js';
import { NoteEditor } from '../components/notes/NoteEditor.js';

interface Campaign {
  id: string;
  name: string;
}

const PERSONAL_NOTEBOOK: Campaign = { id: PERSONAL_NOTEBOOK_ID, name: 'Personal Notes' };

export function Notes() {
  const userRole = useAuthStore((s) => s.user?.role ?? 'director');
  // ── Campaign selection ──
  const [campaigns, setCampaigns] = useState<Campaign[]>([PERSONAL_NOTEBOOK]);
  const [campaignId, setCampaignId] = useState<string>(PERSONAL_NOTEBOOK_ID);

  useEffect(() => {
    api
      .get<{ directed: Campaign[]; joined: Campaign[] }>('/api/campaigns')
      .then((data) => {
        const sourceCampaigns =
          userRole === 'player' ? data.joined : [...data.directed, ...data.joined];

        // Combine available campaigns (deduplicated)
        const seen = new Set<string>([PERSONAL_NOTEBOOK.id]);
        const all: Campaign[] = [PERSONAL_NOTEBOOK];
        for (const c of sourceCampaigns) {
          if (!seen.has(c.id)) {
            seen.add(c.id);
            all.push(c);
          }
        }
        setCampaigns(all);
        setCampaignId((current) =>
          current && all.some((campaign) => campaign.id === current)
            ? current
            : PERSONAL_NOTEBOOK_ID,
        );
      })
      .catch(() => {
        setCampaigns([PERSONAL_NOTEBOOK]);
        setCampaignId(PERSONAL_NOTEBOOK_ID);
      });
  }, [userRole]);

  // ── Notes store ──
  const { notes, loading, error, selectedNoteId, clearError, loadAll, reset } = useNotesStore();

  // Load notes when campaign changes
  useEffect(() => {
    loadAll(campaignId);
  }, [campaignId, loadAll]);

  const handleCampaignChange = useCallback(
    (id: string) => {
      setCampaignId(id);
      reset();
    },
    [reset],
  );

  // Derive selected note
  const selectedNote = useMemo(
    () => notes.find((n) => n.id === selectedNoteId) ?? null,
    [notes, selectedNoteId],
  );

  return (
    <div className="flex h-full">
      {/* Tree sidebar */}
      <NoteTreeSidebar
        campaigns={campaigns}
        selectedCampaignId={campaignId}
        onCampaignChange={handleCampaignChange}
      />

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Error banner */}
        {error && (
          <div className="flex items-center gap-2 border-b border-red-900/50 bg-red-950/30 px-4 py-2 text-sm text-red-400">
            <AlertCircle className="size-4 shrink-0" />
            <span className="flex-1">{error}</span>
            <Button variant="ghost" size="sm" onClick={clearError} className="text-red-400">
              Dismiss
            </Button>
          </div>
        )}

        {/* Content area */}
        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="size-6 animate-spin text-zinc-500" />
          </div>
        ) : selectedNote ? (
          <NoteEditor note={selectedNote} campaignId={campaignId} />
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <StickyNote className="mx-auto mb-3 size-12 text-zinc-700" />
              <h2 className="text-lg font-semibold text-zinc-300">Select a Note</h2>
              <p className="mt-1 text-sm text-zinc-500">
                Choose a note from the sidebar, or create a new one.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
