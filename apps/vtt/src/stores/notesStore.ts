import { create } from 'zustand';
import { api } from '../lib/api.js';
import type {
  NoteFolder,
  Note,
  NoteScope,
  CreateNoteFolderInput,
  UpdateNoteFolderInput,
  CreateNoteInput,
  UpdateNoteInput,
  ReorderNotesInput,
} from '@anvil/types';

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
  loadAll: (campaignId: string, scope?: NoteScope) => Promise<void>;

  // Actions — folders
  createFolder: (campaignId: string, input: CreateNoteFolderInput) => Promise<NoteFolder>;
  updateFolder: (campaignId: string, folderId: string, input: UpdateNoteFolderInput) => Promise<void>;
  deleteFolder: (campaignId: string, folderId: string) => Promise<void>;

  // Actions — notes
  createNote: (campaignId: string, input: CreateNoteInput) => Promise<Note>;
  updateNote: (campaignId: string, noteId: string, input: UpdateNoteInput) => Promise<void>;
  deleteNote: (campaignId: string, noteId: string) => Promise<void>;

  // Actions — reorder
  reorderItems: (campaignId: string, input: ReorderNotesInput) => Promise<void>;

  // Actions — search
  searchNotes: (campaignId: string, query: string, scope?: NoteScope) => Promise<void>;
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

  loadAll: async (campaignId, scope) => {
    set({ loading: true, error: null });
    try {
      const scopeQuery = scope ? `?scope=${scope}` : '';
      const [foldersRes, notesRes] = await Promise.all([
        api.get<{ folders: NoteFolder[] }>(`/api/campaigns/${campaignId}/note-folders${scopeQuery}`),
        api.get<{ notes: Note[] }>(`/api/campaigns/${campaignId}/notes${scopeQuery}`),
      ]);
      set({ folders: foldersRes.folders, notes: notesRes.notes, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  // ── Folders ──

  createFolder: async (campaignId, input) => {
    set({ loading: true, error: null });
    try {
      const { folder } = await api.post<{ folder: NoteFolder }>(
        `/api/campaigns/${campaignId}/note-folders`,
        input,
      );
      set((s) => ({ folders: [...s.folders, folder], loading: false }));
      return folder;
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
      throw e;
    }
  },

  updateFolder: async (campaignId, folderId, input) => {
    try {
      const { folder } = await api.patch<{ folder: NoteFolder }>(
        `/api/campaigns/${campaignId}/note-folders/${folderId}`,
        input,
      );
      set((s) => ({ folders: s.folders.map((f) => (f.id === folderId ? folder : f)) }));
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  deleteFolder: async (campaignId, folderId) => {
    try {
      await api.delete(`/api/campaigns/${campaignId}/note-folders/${folderId}`);
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

  createNote: async (campaignId, input) => {
    set({ loading: true, error: null });
    try {
      const { note } = await api.post<{ note: Note }>(
        `/api/campaigns/${campaignId}/notes`,
        input,
      );
      set((s) => ({ notes: [...s.notes, note], loading: false, selectedNoteId: note.id }));
      return note;
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
      throw e;
    }
  },

  updateNote: async (campaignId, noteId, input) => {
    // No loading toggle — called frequently by auto-save
    // Errors bubble to the editor's auto-save handler (no global error set)
    const { note } = await api.patch<{ note: Note }>(
      `/api/campaigns/${campaignId}/notes/${noteId}`,
      input,
    );
    set((s) => ({ notes: s.notes.map((n) => (n.id === noteId ? note : n)) }));
  },

  deleteNote: async (campaignId, noteId) => {
    try {
      await api.delete(`/api/campaigns/${campaignId}/notes/${noteId}`);
      set((s) => ({
        notes: s.notes.filter((n) => n.id !== noteId),
        selectedNoteId: s.selectedNoteId === noteId ? null : s.selectedNoteId,
      }));
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  // ── Reorder ──

  reorderItems: async (campaignId, input) => {
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
      await api.put(`/api/campaigns/${campaignId}/notes/reorder`, input);
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  // ── Search ──

  searchNotes: async (campaignId, query, scope) => {
    set({ searchQuery: query });
    if (!query.trim()) {
      set({ searchResults: null });
      return;
    }
    try {
      const params = new URLSearchParams({ q: query });
      if (scope) params.set('scope', scope);
      const { notes } = await api.get<{ notes: Note[] }>(
        `/api/campaigns/${campaignId}/notes/search?${params.toString()}`,
      );
      set({ searchResults: notes });
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  clearSearch: () => set({ searchQuery: '', searchResults: null }),
}));
