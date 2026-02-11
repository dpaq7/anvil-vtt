import { useEffect, useState, useCallback, useMemo } from 'react';
import { StickyNote, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@anvil/ui';
import { api } from '../lib/api.js';
import { useNotesStore } from '../stores/notesStore.js';
import { NoteTreeSidebar } from '../components/notes/NoteTreeSidebar.js';
import { NoteEditor } from '../components/notes/NoteEditor.js';

interface Campaign {
  id: string;
  name: string;
}

export function Notes() {
  // ── Campaign selection ──
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignId, setCampaignId] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<{ directed: Campaign[]; joined: Campaign[] }>('/api/campaigns')
      .then((data) => {
        // Combine directed + joined campaigns (deduplicated)
        const seen = new Set<string>();
        const all: Campaign[] = [];
        for (const c of [...data.directed, ...data.joined]) {
          if (!seen.has(c.id)) {
            seen.add(c.id);
            all.push(c);
          }
        }
        setCampaigns(all);
        if (all.length > 0 && !campaignId) {
          setCampaignId(all[0]!.id);
        }
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Notes store ──
  const { notes, loading, error, selectedNoteId, clearError, loadAll, reset } = useNotesStore();

  // Load notes when campaign changes
  useEffect(() => {
    if (campaignId) {
      loadAll(campaignId);
    } else {
      reset();
    }
  }, [campaignId, loadAll, reset]);

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

  // ── No campaigns state ──
  if (campaigns.length === 0 && !loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <StickyNote className="mx-auto mb-3 size-12 text-zinc-700" />
          <h2 className="text-lg font-semibold text-zinc-300">No Campaigns</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Create or join a campaign to start taking notes.
          </p>
        </div>
      </div>
    );
  }

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
        ) : selectedNote && campaignId ? (
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
