import { create } from 'zustand';
import {
  cmsLogin,
  cmsGetMe,
  cmsLogout,
  CmsUserProfile,
  CmsLoginPayload,
} from './api/cmsApi';

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
  login: (payload: CmsLoginPayload) => Promise<void>;
  logout: () => void;
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
      set({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        profile,
        isLoading: false,
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
    set({ profile: null, accessToken: null, refreshToken: null });
  },

  /**
   * Re-hydrate the CMS store from a previously stored access token.
   * Useful after a page reload when the token is persisted externally.
   *
   * @param token - Existing JWT access token.
   */
  restoreSession: async (token: string) => {
    set({ isLoading: true });
    try {
      const profile = await cmsGetMe(token);
      set({ accessToken: token, profile, isLoading: false });
    } catch {
      set({ profile: null, accessToken: null, refreshToken: null, isLoading: false });
    }
  },
}));
