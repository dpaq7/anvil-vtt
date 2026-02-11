import { useState, useCallback } from 'react';
import { Input } from '@anvil/ui';
import { useNotesStore } from '../../stores/notesStore.js';

interface NoteEditorTitleProps {
  noteId: string;
  campaignId: string;
  initialTitle: string;
}

export function NoteEditorTitle({ noteId, campaignId, initialTitle }: NoteEditorTitleProps) {
  const [title, setTitle] = useState(initialTitle);
  const { updateNote } = useNotesStore();

  const handleSave = useCallback(async () => {
    const trimmed = title.trim();
    if (trimmed && trimmed !== initialTitle) {
      try {
        await updateNote(campaignId, noteId, { title: trimmed });
      } catch {
        // Auto-save error; editor handles display
      }
    }
  }, [title, initialTitle, campaignId, noteId, updateNote]);

  return (
    <div className="border-b border-zinc-800 px-4 py-2">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={handleSave}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.currentTarget.blur();
          }
        }}
        className="border-none bg-transparent px-0 text-xl font-semibold text-zinc-100 shadow-none focus-visible:ring-0"
        placeholder="Untitled"
      />
    </div>
  );
}
