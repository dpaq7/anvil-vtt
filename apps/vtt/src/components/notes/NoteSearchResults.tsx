import type { Note, NoteFolder } from '@anvil/types';
import { FileText } from 'lucide-react';
import { cn } from '@anvil/ui';

interface NoteSearchResultsProps {
  results: Note[];
  folders: NoteFolder[];
  selectedNoteId: string | null;
  searchQuery: string;
  onSelect: (noteId: string) => void;
}

export function NoteSearchResults({
  results,
  folders,
  selectedNoteId,
  searchQuery,
  onSelect,
}: NoteSearchResultsProps) {
  if (results.length === 0) {
    return (
      <div className="px-3 py-6 text-center text-sm text-zinc-500">
        No notes matching &ldquo;{searchQuery}&rdquo;
      </div>
    );
  }

  const folderMap = new Map(folders.map((f) => [f.id, f]));

  function getFolderPath(folderId: string): string {
    const parts: string[] = [];
    let current = folderMap.get(folderId);
    while (current) {
      parts.unshift(current.name);
      current = current.parentFolderId ? folderMap.get(current.parentFolderId) : undefined;
    }
    return parts.join(' / ');
  }

  return (
    <div className="flex flex-col gap-0.5">
      {results.map((note) => (
        <button
          key={note.id}
          type="button"
          onClick={() => onSelect(note.id)}
          className={cn(
            'flex w-full flex-col gap-0.5 rounded-md px-3 py-2 text-left text-sm transition-colors',
            'hover:bg-zinc-800/50',
            selectedNoteId === note.id && 'bg-zinc-800 text-zinc-100',
            selectedNoteId !== note.id && 'text-zinc-400',
          )}
        >
          <div className="flex items-center gap-2">
            <FileText className="size-3.5 shrink-0" />
            <span className="truncate font-medium">{note.title}</span>
          </div>
          <span className="truncate pl-5.5 text-xs text-zinc-600">
            {getFolderPath(note.folderId)}
          </span>
        </button>
      ))}
    </div>
  );
}
