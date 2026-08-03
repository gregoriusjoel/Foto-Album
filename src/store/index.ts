'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '@/types';

// ── Admin Auth Store ───────────────────────────────────────────
interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  isAuthenticated: boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (user, token) => {
        set({ user, token, isAuthenticated: true });
        if (typeof window !== 'undefined') {
          localStorage.setItem('admin_token', token);
        }
      },

      clearAuth: () => {
        set({ user: null, token: null, isAuthenticated: false });
        if (typeof window !== 'undefined') {
          localStorage.removeItem('admin_token');
        }
      },
    }),
    {
      name: 'memly-auth',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? localStorage : sessionStorage
      ),
      partialize: (s) => ({ user: s.user, token: s.token, isAuthenticated: s.isAuthenticated }),
    }
  )
);

// ── Guest Participant Store (session-scoped) ────────────────────
interface ParticipantState {
  name: string | null;
  token: string | null;
  eventSlug: string | null;
  setParticipant: (name: string, token: string, slug: string) => void;
  clearParticipant: () => void;
  isJoined: (slug: string) => boolean;
}

export const useParticipantStore = create<ParticipantState>()((set, get) => ({
  name: typeof window !== 'undefined' ? localStorage.getItem('participant_name') : null,
  token: typeof window !== 'undefined' ? localStorage.getItem('participant_token') : null,
  eventSlug: typeof window !== 'undefined' ? localStorage.getItem('participant_slug') : null,

  setParticipant: (name, token, slug) => {
    set({ name, token, eventSlug: slug });
    if (typeof window !== 'undefined') {
      localStorage.setItem('participant_name', name);
      localStorage.setItem('participant_token', token);
      localStorage.setItem('participant_slug', slug);
    }
  },

  clearParticipant: () => {
    set({ name: null, token: null, eventSlug: null });
    if (typeof window !== 'undefined') {
      localStorage.removeItem('participant_name');
      localStorage.removeItem('participant_token');
      localStorage.removeItem('participant_slug');
    }
  },

  isJoined: (slug) => {
    const s = get();
    return s.eventSlug === slug && !!s.token;
  },
}));
