import { create } from 'zustand';
import {
  cmsLogin,
  cmsGetMe,
  cmsLogout,
  CmsUserProfile,
  CmsLoginPayload,
} from './api/cmsApi';

const CMS_ACCESS_TOKEN_KEY = 'luki.cms.accessToken';
const CMS_REFRESH_TOKEN_KEY = 'luki.cms.refreshToken';

function canUseBrowserStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readStoredToken(key: string) {
  if (!canUseBrowserStorage()) return null;
  return window.localStorage.getItem(key);
}

function writeStoredSession(accessToken: string, refreshToken: string | null) {
  if (!canUseBrowserStorage()) return;
  window.localStorage.setItem(CMS_ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) {
    window.localStorage.setItem(CMS_REFRESH_TOKEN_KEY, refreshToken);
  } else {
    window.localStorage.removeItem(CMS_REFRESH_TOKEN_KEY);
  }
}

function clearStoredSession() {
  if (!canUseBrowserStorage()) return;
  window.localStorage.removeItem(CMS_ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(CMS_REFRESH_TOKEN_KEY);
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Shape of the CMS Zustand store.
 *
 * @property profile      - Authenticated CMS user profile, or null.
 * @property accessToken  - JWT access token, or null.
 * @property refreshToken - JWT refresh token, or null.
 * @property isLoading    - Whether an auth request is in progress.
 * @property login        - Authenticate with email + password (no OTP).
 * @property logout       - Clear state and call the logout endpoint.
 * @property restoreSession - Re-hydrate user profile from a stored token.
 */
interface CmsState {
  profile: CmsUserProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isRestoring: boolean;
  hasRestored: boolean;
  login: (payload: CmsLoginPayload) => Promise<void>;
  logout: () => void;
  bootstrapSession: () => Promise<void>;
  restoreSession: (token: string) => Promise<void>;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

/**
 * Global CMS authentication store (Zustand).
 *
 * Implements a single-phase authentication flow for internal users:
 *   POST /auth/cms/login → receives accessToken + refreshToken
 *   GET  /auth/me        → receives full user profile
 *
 * Credentials:
 *   soporte@lukiplay.com / password123  (SUPPORT)
 *   admin@lukiplay.com   / password123  (SUPERADMIN)
 */
export const useCmsStore = create<CmsState>((set, get) => ({
  profile: null,
  accessToken: null,
  refreshToken: null,
  isLoading: false,
  isRestoring: false,
  hasRestored: false,

  /**
   * Authenticate a CMS user with email + password.
   * On success, fetches the full user profile and stores all tokens.
   *
   * @throws {Error} When credentials are invalid or the backend is unreachable.
   */
  login: async (payload: CmsLoginPayload) => {
    set({ isLoading: true });
    try {
      const tokens = await cmsLogin(payload);
      const profile = await cmsGetMe(tokens.accessToken);
      writeStoredSession(tokens.accessToken, tokens.refreshToken);
      set({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        profile,
        isLoading: false,
        hasRestored: true,
      });
    } catch (e) {
      set({ isLoading: false });
      throw e;
    }
  },

  /**
   * Log out the current CMS user.
   * Calls the logout endpoint (best-effort) and clears all local state.
   */
  logout: () => {
    const { accessToken } = get();
    if (accessToken) {
      cmsLogout(accessToken);
    }
    clearStoredSession();
    set({ profile: null, accessToken: null, refreshToken: null });
  },

  /**
   * Restore the CMS session automatically from browser storage.
   * Keeps deep-linked CMS pages accessible after a hard refresh.
   */
  bootstrapSession: async () => {
    const storedAccessToken = readStoredToken(CMS_ACCESS_TOKEN_KEY);
    const storedRefreshToken = readStoredToken(CMS_REFRESH_TOKEN_KEY);

    if (!storedAccessToken) {
      set({ hasRestored: true, isRestoring: false, profile: null, accessToken: null, refreshToken: null });
      return;
    }

    set({ isRestoring: true });
    try {
      const profile = await cmsGetMe(storedAccessToken);
      set({
        profile,
        accessToken: storedAccessToken,
        refreshToken: storedRefreshToken,
        isRestoring: false,
        hasRestored: true,
      });
    } catch {
      clearStoredSession();
      set({
        profile: null,
        accessToken: null,
        refreshToken: null,
        isRestoring: false,
        hasRestored: true,
      });
    }
  },

  /**
   * Re-hydrate the CMS store from a previously stored access token.
   * Useful after a page reload when the token is persisted externally.
   *
   * @param token - Existing JWT access token.
   */
  restoreSession: async (token: string) => {
    set({ isLoading: true, isRestoring: true });
    try {
      const profile = await cmsGetMe(token);
      writeStoredSession(token, get().refreshToken);
      set({ accessToken: token, profile, isLoading: false, isRestoring: false, hasRestored: true });
    } catch {
      clearStoredSession();
      set({ profile: null, accessToken: null, refreshToken: null, isLoading: false, isRestoring: false, hasRestored: true });
    }
  },
}));
