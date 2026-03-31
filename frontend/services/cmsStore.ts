import { create } from 'zustand';
import {
  cmsLogin,
  cmsLogout,
  fetchCmsMe,
  getMockUsers,
  getMockAccounts,
  getMockSessions,
  type CmsUser,
  type CmsAccount,
  type CmsSession,
  type UserRole,
} from './api/cmsApi';

// ─── State shape ──────────────────────────────────────────────────────────────

interface CmsAuthUser {
  id: string;
  email: string;
  role: UserRole;
}

interface CmsState {
  /** Authenticated CMS user, or null when not logged in. */
  user: CmsAuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;

  /** In-memory lists (loaded from mock / future real API). */
  users: CmsUser[];
  accounts: CmsAccount[];
  sessions: CmsSession[];

  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadData: () => void;
  revokeSession: (sessionId: string) => void;
  clearError: () => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

/**
 * Global Zustand store for the CMS panel.
 *
 * Authentication:  calls the real backend via `cmsApi`.
 * List data:       uses mock helpers until the backend exposes CMS list endpoints.
 * Session revoke:  optimistic local removal (no backend endpoint yet).
 */
export const useCmsStore = create<CmsState>()((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: false,
  error: null,

  users: [],
  accounts: [],
  sessions: [],

  // ── Auth ──────────────────────────────────────────────────────────────────

  login: async (email, password) => {
    set({ isLoading: true, error: null });

    try {
      const tokens = await cmsLogin({ email, password });

      // Fetch the user profile to get role and display name
      const profile = await fetchCmsMe(tokens.accessToken);

      set({
        isLoading: false,
        user: { id: profile.id, email: profile.email, role: profile.role },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Error de autenticación';
      set({ isLoading: false, error: message });
      throw err;
    }
  },

  logout: async () => {
    const { accessToken, refreshToken } = get();
    if (accessToken && refreshToken) {
      await cmsLogout(accessToken, refreshToken);
    }
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      users: [],
      accounts: [],
      sessions: [],
    });
  },

  // ── Data ──────────────────────────────────────────────────────────────────

  /**
   * Loads list data from mock helpers.
   * Replace with real API calls once backend exposes CMS list endpoints.
   */
  loadData: () => {
    set({
      users: getMockUsers(),
      accounts: getMockAccounts(),
      sessions: getMockSessions(),
    });
  },

  /**
   * Optimistically removes a session from the local list.
   * TODO: call DELETE /auth/sessions/:id on the real backend.
   */
  revokeSession: (sessionId) => {
    set((state) => ({
      sessions: state.sessions.filter((s) => s.id !== sessionId),
    }));
  },

  clearError: () => set({ error: null }),
}));
