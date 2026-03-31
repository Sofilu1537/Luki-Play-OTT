/**
 * CMS Store — Zustand store for internal admin/support panel.
 *
 * Manages CMS authentication state and provides mock data for tables.
 * Completely separate from the client-facing `authStore`.
 */

import { create } from 'zustand';
import { cmsLoginRequest, cmsLogoutRequest } from './api/cmsApi';

// ─── Mock data ────────────────────────────────────────────────────────────────

export interface MockUser {
  id: string;
  email: string | null;
  role: 'CLIENT' | 'SUPPORT' | 'SUPERADMIN';
  phone: string | null;
  createdAt: string;
}

export interface MockAccount {
  id: string;
  contractNumber: string;
  contractType: 'ISP' | 'OTT_ONLY';
  serviceStatus: 'ACTIVO' | 'CORTESIA' | 'PENDIENTE' | 'SUSPENDIDO' | 'ANULADO' | 'CORTADO';
  canAccessOtt: boolean;
  userId: string;
}

export interface MockSession {
  id: string;
  userId: string;
  deviceId: string;
  createdAt: string;
  expiresAt: string;
  revoked: boolean;
}

export const mockUsers: MockUser[] = [
  { id: 'uuid-1', email: 'cliente1@gmail.com', role: 'CLIENT', phone: '+57 300 123 4567', createdAt: '2026-01-15' },
  { id: 'uuid-2', email: 'cliente2@gmail.com', role: 'CLIENT', phone: '+57 301 234 5678', createdAt: '2026-02-20' },
  { id: 'uuid-3', email: 'soporte@lukiplay.com', role: 'SUPPORT', phone: null, createdAt: '2025-12-01' },
  { id: 'uuid-4', email: 'admin@lukiplay.com', role: 'SUPERADMIN', phone: null, createdAt: '2025-11-15' },
  { id: 'uuid-5', email: null, role: 'CLIENT', phone: '+57 302 345 6789', createdAt: '2026-03-10' },
];

export const mockAccounts: MockAccount[] = [
  { id: 'acc-1', contractNumber: 'CONTRACT-001', contractType: 'ISP', serviceStatus: 'ACTIVO', canAccessOtt: true, userId: 'uuid-1' },
  { id: 'acc-2', contractNumber: 'CONTRACT-002', contractType: 'ISP', serviceStatus: 'SUSPENDIDO', canAccessOtt: false, userId: 'uuid-2' },
  { id: 'acc-3', contractNumber: 'OTT-00001', contractType: 'OTT_ONLY', serviceStatus: 'ACTIVO', canAccessOtt: true, userId: 'uuid-5' },
  { id: 'acc-4', contractNumber: 'CONTRACT-003', contractType: 'ISP', serviceStatus: 'CORTESIA', canAccessOtt: true, userId: 'uuid-1' },
  { id: 'acc-5', contractNumber: 'CONTRACT-004', contractType: 'ISP', serviceStatus: 'CORTADO', canAccessOtt: false, userId: 'uuid-2' },
];

export const mockSessions: MockSession[] = [
  { id: 'ses-1', userId: 'uuid-1', deviceId: 'web-chrome-001', createdAt: '2026-03-27 10:00', expiresAt: '2026-04-03 10:00', revoked: false },
  { id: 'ses-2', userId: 'uuid-2', deviceId: 'mobile-android-001', createdAt: '2026-03-26 15:30', expiresAt: '2026-04-02 15:30', revoked: false },
  { id: 'ses-3', userId: 'uuid-5', deviceId: 'smart-tv-001', createdAt: '2026-03-25 20:00', expiresAt: '2026-04-01 20:00', revoked: true },
];

// ─── Store types ──────────────────────────────────────────────────────────────

/** Authenticated CMS user. */
export interface CmsUser {
  id: string;
  email: string;
  role: 'SUPPORT' | 'SUPERADMIN';
}

interface CmsState {
  cmsUser: CmsUser | null;
  cmsAccessToken: string | null;
  cmsRefreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Sessions mock state (allows optimistic revoke)
  sessions: MockSession[];

  cmsLogin: (email: string, password: string) => Promise<void>;
  cmsLogout: () => Promise<void>;
  cmsRestoreSession: () => void;
  revokeSession: (sessionId: string) => void;
  clearError: () => void;
}

// ─── Device ID for CMS ───────────────────────────────────────────────────────

/** Fixed device ID for the CMS web client (not dynamically generated). */
const DEFAULT_CMS_DEVICE_ID = 'luki-cms-web-001';

// ─── Session persistence keys ─────────────────────────────────────────────────

const STORAGE_KEY_ACCESS = 'cms_access_token';
const STORAGE_KEY_REFRESH = 'cms_refresh_token';
const STORAGE_KEY_USER = 'cms_user';

function saveSession(user: CmsUser, accessToken: string, refreshToken: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_ACCESS, accessToken);
      localStorage.setItem(STORAGE_KEY_REFRESH, refreshToken);
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    }
  } catch {
    // localStorage not available (e.g. SSR)
  }
}

function clearSession(): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY_ACCESS);
      localStorage.removeItem(STORAGE_KEY_REFRESH);
      localStorage.removeItem(STORAGE_KEY_USER);
    }
  } catch {
    // ignore
  }
}

function loadSession(): { user: CmsUser; accessToken: string; refreshToken: string } | null {
  try {
    if (typeof localStorage !== 'undefined') {
      const accessToken = localStorage.getItem(STORAGE_KEY_ACCESS);
      const refreshToken = localStorage.getItem(STORAGE_KEY_REFRESH);
      const userRaw = localStorage.getItem(STORAGE_KEY_USER);
      if (accessToken && refreshToken && userRaw) {
        const user = JSON.parse(userRaw) as CmsUser;
        return { user, accessToken, refreshToken };
      }
    }
  } catch {
    // ignore
  }
  return null;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useCmsStore = create<CmsState>((set, get) => ({
  cmsUser: null,
  cmsAccessToken: null,
  cmsRefreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  sessions: mockSessions,

  /**
   * Authenticate a CMS user (SUPPORT or SUPERADMIN) via email + password.
   * Calls POST /auth/cms/login and persists the session to localStorage.
   */
  cmsLogin: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await cmsLoginRequest(email, password, DEFAULT_CMS_DEVICE_ID);

      // Determine role from response or derive from mock credentials
      const role = deriveRole(email, data);

      if (role !== 'SUPPORT' && role !== 'SUPERADMIN') {
        throw new Error('Acceso denegado: solo usuarios internos pueden acceder al CMS');
      }

      const cmsUser: CmsUser = {
        id: data.user?.id ?? 'unknown',
        email: data.user?.email ?? email,
        role,
      };

      saveSession(cmsUser, data.accessToken, data.refreshToken);

      set({
        isLoading: false,
        cmsUser,
        cmsAccessToken: data.accessToken,
        cmsRefreshToken: data.refreshToken,
        isAuthenticated: true,
        error: null,
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error al iniciar sesión';
      set({ isLoading: false, error: message });
      throw e;
    }
  },

  /**
   * Log out the current CMS user.
   * Calls POST /auth/logout and clears all local session data.
   */
  cmsLogout: async () => {
    const { cmsAccessToken } = get();
    if (cmsAccessToken) {
      await cmsLogoutRequest(cmsAccessToken);
    }
    clearSession();
    set({
      cmsUser: null,
      cmsAccessToken: null,
      cmsRefreshToken: null,
      isAuthenticated: false,
      error: null,
    });
  },

  /**
   * Restore a previously saved CMS session from localStorage.
   * Called on app mount to maintain authentication across page reloads.
   */
  cmsRestoreSession: () => {
    const saved = loadSession();
    if (saved) {
      set({
        cmsUser: saved.user,
        cmsAccessToken: saved.accessToken,
        cmsRefreshToken: saved.refreshToken,
        isAuthenticated: true,
      });
    }
  },

  /**
   * Optimistically revoke a session in the mock data.
   * TODO: call DELETE /cms/sessions/:id when backend endpoint is ready.
   */
  revokeSession: (sessionId: string) => {
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId ? { ...s, revoked: true } : s,
      ),
    }));
  },

  clearError: () => set({ error: null }),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Derive the CMS role from the login response or fallback to known test credentials.
 * When the backend returns a role, use it directly.
 */
function deriveRole(
  email: string,
  data: { user?: { role?: string } },
): 'SUPPORT' | 'SUPERADMIN' | string {
  if (data.user?.role) return data.user.role;
  // Fallback for test credentials
  if (email === 'admin@lukiplay.com') return 'SUPERADMIN';
  if (email === 'soporte@lukiplay.com') return 'SUPPORT';
  return 'UNKNOWN';
}
