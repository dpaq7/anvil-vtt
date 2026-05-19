import { create } from 'zustand';
import { api } from '../lib/api.js';
import type {
  NoteFolder,
  Note,
  CreateNoteFolderInput,
  UpdateNoteFolderInput,
  CreateNoteInput,
  UpdateNoteInput,
  ReorderNotesInput,
} from '@anvil/types';

export const PERSONAL_NOTEBOOK_ID = 'personal';

function notebookApiBase(notebookId: string): string {
  return notebookId === PERSONAL_NOTEBOOK_ID
    ? '/api/notes/personal'
    : `/api/campaigns/${notebookId}`;
}

interface NotesState {
  // Data
  folders: NoteFolder[];
  notes: Note[];

  // UI state
  selectedNoteId: string | null;
  selectedFolderId: string | null;
  searchQuery: string;
  searchResults: Note[] | null;
  loading: boolean;
  error: string | null;

  // Actions — data fetching
  loadAll: (notebookId: string) => Promise<void>;

  // Actions — folders
  createFolder: (notebookId: string, input: CreateNoteFolderInput) => Promise<NoteFolder>;
  updateFolder: (notebookId: string, folderId: string, input: UpdateNoteFolderInput) => Promise<void>;
  deleteFolder: (notebookId: string, folderId: string) => Promise<void>;

  // Actions — notes
  createNote: (notebookId: string, input: CreateNoteInput) => Promise<Note>;
  updateNote: (notebookId: string, noteId: string, input: UpdateNoteInput) => Promise<void>;
  deleteNote: (notebookId: string, noteId: string) => Promise<void>;

  // Actions — reorder
  reorderItems: (notebookId: string, input: ReorderNotesInput) => Promise<void>;

  // Actions — search
  searchNotes: (notebookId: string, query: string) => Promise<void>;
  clearSearch: () => void;

  // Actions — navigation
  setSelectedNoteId: (id: string | null) => void;
  setSelectedFolderId: (id: string | null) => void;
  clearError: () => void;
  reset: () => void;
}

export const useNotesStore = create<NotesState>((set, _get) => ({
  // Initial state
  folders: [],
  notes: [],
  selectedNoteId: null,
  selectedFolderId: null,
  searchQuery: '',
  searchResults: null,
  loading: false,
  error: null,

  // ── Navigation ──

  setSelectedNoteId: (id) => set({ selectedNoteId: id }),
  setSelectedFolderId: (id) => set({ selectedFolderId: id }),
  clearError: () => set({ error: null }),
  reset: () =>
    set({
      folders: [],
      notes: [],
      selectedNoteId: null,
      selectedFolderId: null,
      searchQuery: '',
      searchResults: null,
      loading: false,
      error: null,
    }),

  // ── Data Fetching ──

  loadAll: async (notebookId) => {
    set({ loading: true, error: null });
    try {
      const base = notebookApiBase(notebookId);
      const [foldersRes, notesRes] = await Promise.all([
        api.get<{ folders: NoteFolder[] }>(`${base}/note-folders`),
        api.get<{ notes: Note[] }>(`${base}/notes`),
      ]);
      set({ folders: foldersRes.folders, notes: notesRes.notes, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  // ── Folders ──

  createFolder: async (notebookId, input) => {
    set({ loading: true, error: null });
    try {
      const base = notebookApiBase(notebookId);
      const { folder } = await api.post<{ folder: NoteFolder }>(
        `${base}/note-folders`,
        input,
      );
      set((s) => ({ folders: [...s.folders, folder], loading: false }));
      return folder;
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
      throw e;
    }
  },

  updateFolder: async (notebookId, folderId, input) => {
    try {
      const base = notebookApiBase(notebookId);
      const { folder } = await api.patch<{ folder: NoteFolder }>(
        `${base}/note-folders/${folderId}`,
        input,
      );
      set((s) => ({ folders: s.folders.map((f) => (f.id === folderId ? folder : f)) }));
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  deleteFolder: async (notebookId, folderId) => {
    try {
      const base = notebookApiBase(notebookId);
      await api.delete(`${base}/note-folders/${folderId}`);
      set((s) => ({
        folders: s.folders.filter((f) => f.id !== folderId && f.parentFolderId !== folderId),
        notes: s.notes.filter((n) => n.folderId !== folderId),
        selectedNoteId:
          s.notes.some((n) => n.folderId === folderId && n.id === s.selectedNoteId)
            ? null
            : s.selectedNoteId,
        selectedFolderId: s.selectedFolderId === folderId ? null : s.selectedFolderId,
      }));
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  // ── Notes ──

  createNote: async (notebookId, input) => {
    set({ loading: true, error: null });
    try {
      const base = notebookApiBase(notebookId);
      const { note } = await api.post<{ note: Note }>(
        `${base}/notes`,
        input,
      );
      set((s) => ({ notes: [...s.notes, note], loading: false, selectedNoteId: note.id }));
      return note;
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
      throw e;
    }
  },

  updateNote: async (notebookId, noteId, input) => {
    // No loading toggle — called frequently by auto-save
    // Errors bubble to the editor's auto-save handler (no global error set)
    const base = notebookApiBase(notebookId);
    const { note } = await api.patch<{ note: Note }>(
      `${base}/notes/${noteId}`,
      input,
    );
    set((s) => ({ notes: s.notes.map((n) => (n.id === noteId ? note : n)) }));
  },

  deleteNote: async (notebookId, noteId) => {
    try {
      const base = notebookApiBase(notebookId);
      await api.delete(`${base}/notes/${noteId}`);
      set((s) => ({
        notes: s.notes.filter((n) => n.id !== noteId),
        selectedNoteId: s.selectedNoteId === noteId ? null : s.selectedNoteId,
      }));
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  // ── Reorder ──

  reorderItems: async (notebookId, input) => {
    // Optimistic: update local sort orders immediately
    set((s) => {
      const folderUpdates = new Map<string, { sortOrder: number; parentFolderId?: string | null }>();
      const noteUpdates = new Map<string, { sortOrder: number; folderId?: string }>();

      for (const item of input.items) {
        if (item.folderId !== undefined) {
          noteUpdates.set(item.id, { sortOrder: item.sortOrder, folderId: item.folderId });
        } else if (item.parentFolderId !== undefined) {
          folderUpdates.set(item.id, { sortOrder: item.sortOrder, parentFolderId: item.parentFolderId });
        } else {
          // Could be either — try both
          noteUpdates.set(item.id, { sortOrder: item.sortOrder });
          folderUpdates.set(item.id, { sortOrder: item.sortOrder });
        }
      }

      return {
        folders: s.folders.map((f) => {
          const update = folderUpdates.get(f.id);
          if (!update) return f;
          return {
            ...f,
            sortOrder: update.sortOrder,
            ...(update.parentFolderId !== undefined ? { parentFolderId: update.parentFolderId } : {}),
          };
        }),
        notes: s.notes.map((n) => {
          const update = noteUpdates.get(n.id);
          if (!update) return n;
          return {
            ...n,
            sortOrder: update.sortOrder,
            ...(update.folderId !== undefined ? { folderId: update.folderId } : {}),
          };
        }),
      };
    });

    try {
      const base = notebookApiBase(notebookId);
      await api.put(`${base}/notes/reorder`, input);
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  // ── Search ──

  searchNotes: async (notebookId, query) => {
    set({ searchQuery: query });
    if (!query.trim()) {
      set({ searchResults: null });
      return;
    }
    try {
      const base = notebookApiBase(notebookId);
      const { notes } = await api.get<{ notes: Note[] }>(
        `${base}/notes/search?q=${encodeURIComponent(query)}`,
      );
      set({ searchResults: notes });
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  clearSearch: () => set({ searchQuery: '', searchResults: null }),
}));
