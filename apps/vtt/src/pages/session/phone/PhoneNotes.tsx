import { useEffect, useState } from 'react';
import { Button, cn } from '@anvil/ui';
import type { NoteScope } from '@anvil/types';
import { useNotesStore } from '../../../stores/notesStore.js';
import { api } from '../../../lib/api.js';

export function PhoneNotes({ campaignId, disabled }: { campaignId: string; disabled: boolean }) {
  const {
    folders,
    notes,
    selectedNoteId,
    loading,
    loadAll,
    createNote,
    updateNote,
    setSelectedNoteId,
  } = useNotesStore();
  const [scopes, setScopes] = useState<NoteScope[]>([]);
  const [scope, setScope] = useState<NoteScope>('player');
  const [draftTitle, setDraftTitle] = useState('');
  const [draftContent, setDraftContent] = useState('');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const selectedNote = notes.find((note) => note.id === selectedNoteId) ?? null;

  useEffect(() => {
    let cancelled = false;
    api
      .get<{ scopes: NoteScope[]; defaultScope: NoteScope }>(`/api/campaigns/${campaignId}/note-scopes`)
      .then((result) => {
        if (cancelled) return;
        setScopes(result.scopes);
        setScope(result.defaultScope);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [campaignId]);

  useEffect(() => {
    void loadAll(campaignId, scope);
  }, [campaignId, loadAll, scope]);

  useEffect(() => {
    setDraftTitle(selectedNote?.title ?? '');
    setDraftContent(selectedNote?.content ?? '');
    setSaveState('idle');
  }, [selectedNote?.id, selectedNote?.title, selectedNote?.content]);

  const handleCreate = async () => {
    if (disabled || folders.length === 0) return;
    const note = await createNote(campaignId, {
      title: 'New Phone Note',
      content: '',
      folderId: folders[0]!.id,
      scope,
    });
    setSelectedNoteId(note.id);
  };

  const handleSave = async () => {
    if (disabled || !selectedNote) return;
    setSaveState('saving');
    try {
      await updateNote(campaignId, selectedNote.id, {
        title: draftTitle.trim() || 'Untitled',
        content: draftContent,
      });
      setSaveState('saved');
    } catch {
      setSaveState('error');
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {scopes.length > 1 && (
        <div className="grid grid-cols-2 gap-1 border-b border-zinc-800 p-2">
          {scopes.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setSelectedNoteId(null);
                setScope(item);
              }}
              className={cn(
                'min-h-10 rounded text-sm font-medium capitalize',
                scope === item ? 'bg-zinc-100 text-zinc-950' : 'bg-zinc-900 text-zinc-400',
              )}
            >
              {item}
            </button>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between border-b border-zinc-800 px-3 py-2">
        <span className="text-xs text-zinc-500">{loading ? 'Loading notes...' : `${notes.length} notes`}</span>
        <Button size="sm" variant="secondary" disabled={disabled || folders.length === 0} onClick={handleCreate}>
          New
        </Button>
      </div>
      <div className="grid min-h-0 flex-1 grid-rows-[10rem_minmax(0,1fr)]">
        <div className="overflow-y-auto border-b border-zinc-800">
          {notes.map((note) => (
            <button
              key={note.id}
              type="button"
              onClick={() => setSelectedNoteId(note.id)}
              className={cn(
                'block w-full border-b border-zinc-900 px-4 py-3 text-left',
                note.id === selectedNoteId ? 'bg-zinc-800 text-zinc-50' : 'text-zinc-300',
              )}
            >
              <span className="block truncate text-sm font-medium">{note.title}</span>
              <span className="mt-1 block truncate text-xs text-zinc-500">{note.content || 'No content'}</span>
            </button>
          ))}
        </div>
        {selectedNote ? (
          <div className="flex min-h-0 flex-col gap-2 p-3">
            <input
              value={draftTitle}
              disabled={disabled}
              onChange={(event) => setDraftTitle(event.target.value)}
              className="h-11 rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm font-semibold text-zinc-100 outline-none"
            />
            <textarea
              value={draftContent}
              disabled={disabled}
              onChange={(event) => setDraftContent(event.target.value)}
              className="min-h-0 flex-1 resize-none rounded-md border border-zinc-700 bg-zinc-900 p-3 font-mono text-sm leading-6 text-zinc-200 outline-none"
              placeholder="Write notes..."
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500">{saveState}</span>
              <Button size="sm" disabled={disabled || saveState === 'saving'} onClick={handleSave}>
                Save
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center p-4 text-sm text-zinc-500">Select or create a note.</div>
        )}
      </div>
    </div>
  );
}
