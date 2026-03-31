import { create } from 'zustand';
import { cmsApi, CmsUser, CmsAccount, CmsSession, CmsStatsResponse } from './api/cmsApi';

const CMS_DEVICE_ID = 'luki-cms-web-001';

interface CmsAdminUser {
  id: string;
  email: string;
  role: string;
}

interface CmsState {
  /** Currently logged-in CMS admin user */
  admin: CmsAdminUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;

  /** Cached CMS data */
  stats: CmsStatsResponse | null;
  users: CmsUser[];
  accounts: CmsAccount[];
  sessions: CmsSession[];

  /** Actions */
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  fetchStats: () => Promise<void>;
  fetchUsers: () => Promise<void>;
  fetchAccounts: () => Promise<void>;
  fetchSessions: () => Promise<void>;
  revokeSession: (sessionId: string) => Promise<void>;
  clearError: () => void;
}

export const useCmsStore = create<CmsState>((set, get) => ({
  admin: null,
  accessToken: null,
  refreshToken: null,
  isLoading: false,
  error: null,
  stats: null,
  users: [],
  accounts: [],
  sessions: [],

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const tokens = await cmsApi.login(email, password, CMS_DEVICE_ID);
      const profile = await cmsApi.me(tokens.accessToken);
      set({
        isLoading: false,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        admin: { id: profile.id, email: profile.email, role: profile.role },
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error al iniciar sesión';
      set({ isLoading: false, error: message });
      throw e;
    }
  },

  logout: () => {
    const { accessToken, refreshToken } = get();
    if (accessToken && refreshToken) {
      cmsApi.logout(accessToken, refreshToken).catch(() => {
        // Ignore errors — always clear local state
      });
    }
    set({
      admin: null,
      accessToken: null,
      refreshToken: null,
      stats: null,
      users: [],
      accounts: [],
      sessions: [],
      error: null,
    });
  },

  fetchStats: async () => {
    const { accessToken } = get();
    if (!accessToken) return;
    set({ isLoading: true, error: null });
    try {
      const stats = await cmsApi.getStats(accessToken);
      set({ isLoading: false, stats });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error al cargar estadísticas';
      set({ isLoading: false, error: message });
    }
  },

  fetchUsers: async () => {
    const { accessToken } = get();
    if (!accessToken) return;
    set({ isLoading: true, error: null });
    try {
      const users = await cmsApi.listUsers(accessToken);
      set({ isLoading: false, users });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error al cargar usuarios';
      set({ isLoading: false, error: message });
    }
  },

  fetchAccounts: async () => {
    const { accessToken } = get();
    if (!accessToken) return;
    set({ isLoading: true, error: null });
    try {
      const accounts = await cmsApi.listAccounts(accessToken);
      set({ isLoading: false, accounts });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error al cargar contratos';
      set({ isLoading: false, error: message });
    }
  },

  fetchSessions: async () => {
    const { accessToken } = get();
    if (!accessToken) return;
    set({ isLoading: true, error: null });
    try {
      const sessions = await cmsApi.listSessions(accessToken);
      set({ isLoading: false, sessions });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error al cargar sesiones';
      set({ isLoading: false, error: message });
    }
  },

  revokeSession: async (sessionId: string) => {
    const { accessToken } = get();
    if (!accessToken) return;
    try {
      await cmsApi.revokeSession(accessToken, sessionId);
      set((state) => ({
        sessions: state.sessions.filter((s) => s.id !== sessionId),
      }));
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error al revocar sesión';
      set({ error: message });
    }
  },

  clearError: () => set({ error: null }),
}));
