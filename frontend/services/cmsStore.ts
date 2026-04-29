import { create } from 'zustand';
import {
  cmsLogin,
  cmsGetMe,
  cmsLogout,
  cmsRefreshToken,
  CmsUserProfile,
  CmsLoginPayload,
} from './api/cmsApi';
import {
  saveTokens,
  getAccessToken,
  getRefreshToken,
  clearTokens,
} from './tokenStorage';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Shape of the CMS Zustand store.
 *
 * @property profile      - Authenticated CMS user profile, or null.
 * @property accessToken  - JWT access token (memory-only on web), or null.
 * @property isLoading    - Whether an auth request is in progress.
 * @property login        - Authenticate with email + password (no OTP).
 * @property logout       - Clear state and call the logout endpoint.
 * @property restoreSession - Re-hydrate user profile from a stored token.
 */
interface CmsState {
  profile: CmsUserProfile | null;
  accessToken: string | null;
  isLoading: boolean;
  isRestoring: boolean;
  hasRestored: boolean;
  login: (payload: CmsLoginPayload) => Promise<{ mustChangePassword: boolean }>;
  logout: () => void;
  bootstrapSession: () => Promise<void>;
  restoreSession: (token: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshAccessToken: () => Promise<string | null>;
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
 *   gestion@lukiplay.com / password123  (ADMIN)
 *   admin@lukiplay.com   / password123  (SUPERADMIN)
 */
export const useCmsStore = create<CmsState>((set, get) => ({
  profile: null,
  accessToken: null,
  isLoading: false,
  isRestoring: false,
  hasRestored: false,

  /**
   * Authenticate a CMS user with email + password.
   * On success, fetches the full user profile and persists tokens securely.
   *
   * @throws {Error} When credentials are invalid or the backend is unreachable.
   */
  login: async (payload: CmsLoginPayload) => {
    set({ isLoading: true });
    try {
      const tokens = await cmsLogin(payload);
      const profile = await cmsGetMe(tokens.accessToken);
      await saveTokens(tokens.accessToken, tokens.refreshToken);
      set({
        accessToken: tokens.accessToken,
        profile,
        isLoading: false,
        hasRestored: true,
      });
      return { mustChangePassword: profile.mustChangePassword ?? false };
    } catch (e) {
      set({ isLoading: false });
      throw e;
    }
  },

  /**
   * Log out the current CMS user.
   * Calls the logout endpoint (best-effort), clears all stored tokens,
   * and resets hasRestored so the layout bootstraps cleanly on re-entry.
   */
  logout: () => {
    const { accessToken } = get();
    if (accessToken) {
      cmsLogout(accessToken);
    }
    clearTokens();
    set({ profile: null, accessToken: null, hasRestored: false });
  },

  /**
   * Restore the CMS session automatically from secure storage.
   * On native reads from encrypted keychain; on web tries refresh token
   * from sessionStorage to obtain a fresh access token.
   */
  bootstrapSession: async () => {
    const { hasRestored, isRestoring } = get();
    if (hasRestored || isRestoring) return;

    set({ isRestoring: true });

    try {
      // Native: try stored access token first
      const storedAccessToken = await getAccessToken();
      if (storedAccessToken) {
        try {
          const profile = await cmsGetMe(storedAccessToken);
          set({
            profile,
            accessToken: storedAccessToken,
            isRestoring: false,
            hasRestored: true,
          });
          return;
        } catch {
          // Access token expired — fall through to refresh
        }
      }

      // Try refresh token (sessionStorage on web, SecureStore on native)
      const storedRefreshToken = await getRefreshToken();
      if (storedRefreshToken) {
        try {
          const tokens = await cmsRefreshToken(storedRefreshToken);
          const profile = await cmsGetMe(tokens.accessToken);
          await saveTokens(tokens.accessToken, tokens.refreshToken);
          set({
            profile,
            accessToken: tokens.accessToken,
            isRestoring: false,
            hasRestored: true,
          });
          return;
        } catch {
          // Refresh also failed — clear everything
        }
      }

      await clearTokens();
      set({ profile: null, accessToken: null, isRestoring: false, hasRestored: true });
    } catch {
      await clearTokens();
      set({ profile: null, accessToken: null, isRestoring: false, hasRestored: true });
    }
  },

  /**
   * Re-hydrate the CMS store from a previously obtained access token.
   *
   * @param token - Existing JWT access token.
   */
  restoreSession: async (token: string) => {
    set({ isLoading: true, isRestoring: true });
    try {
      const profile = await cmsGetMe(token);
      const refreshToken = await getRefreshToken();
      await saveTokens(token, refreshToken);
      set({ accessToken: token, profile, isLoading: false, isRestoring: false, hasRestored: true });
    } catch {
      await clearTokens();
      set({ profile: null, accessToken: null, isLoading: false, isRestoring: false, hasRestored: true });
    }
  },

  refreshProfile: async () => {
    const { accessToken } = get();
    if (!accessToken) return;
    const profile = await cmsGetMe(accessToken);
    set({ profile });
  },

  /**
   * Use the stored refresh token to obtain a fresh access token.
   * Updates the store and storage on success.
   * Returns the new access token or null if refresh fails.
   */
  refreshAccessToken: async (): Promise<string | null> => {
    try {
      const storedRefreshToken = await getRefreshToken();
      if (!storedRefreshToken) return null;
      const tokens = await cmsRefreshToken(storedRefreshToken);
      await saveTokens(tokens.accessToken, tokens.refreshToken);
      set({ accessToken: tokens.accessToken });
      return tokens.accessToken;
    } catch {
      return null;
    }
  },
}));
