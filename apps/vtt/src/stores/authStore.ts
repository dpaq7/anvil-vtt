import { create } from 'zustand';
import { csrfHeaders, setCsrfToken } from '../lib/csrf.js';

type UserRole = 'director' | 'player';

interface AuthUser {
  id: string;
  discordId: string;
  username: string;
  avatarUrl: string | null;
  role: UserRole;
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
  setRole: (role: UserRole) => Promise<void>;
}

const API_BASE = import.meta.env['VITE_API_BASE'] || '';

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  error: null,

  checkAuth: async () => {
    try {
      set({ loading: true, error: null });
      const res = await fetch(`${API_BASE}/api/auth/me`, { credentials: 'include' });
      if (res.ok) {
        const data = (await res.json()) as { user: AuthUser; csrfToken?: string };
        setCsrfToken(data.csrfToken ?? null);
        set({ user: data.user, loading: false });
      } else {
        setCsrfToken(null);
        set({ user: null, loading: false });
      }
    } catch {
      setCsrfToken(null);
      set({ user: null, loading: false, error: 'Failed to check auth' });
    }
  },

  logout: async () => {
    try {
      await fetch(`${API_BASE}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: csrfHeaders('POST'),
      });
    } finally {
      setCsrfToken(null);
      set({ user: null });
    }
  },

  setRole: async (role: UserRole) => {
    const res = await fetch(`${API_BASE}/api/auth/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...csrfHeaders('PATCH') },
      credentials: 'include',
      body: JSON.stringify({ role }),
    });
    if (res.ok) {
      set((state) => ({ user: state.user ? { ...state.user, role } : null }));
    }
  },
}));
