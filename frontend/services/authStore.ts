import { create } from 'zustand';
import * as authApi from './api/authApi';

// Stable device ID for development
const DEV_DEVICE_ID = 'luki-web-dev-device-001';

// ─── Simple cross-platform storage ───────────────────────────────────────────
// Uses localStorage on web; falls back to an in-memory map on native until
// @react-native-async-storage/async-storage is added.
const memoryFallback = new Map<string, string>();
const storage = {
  get: (key: string): string | null => {
    if (typeof localStorage !== 'undefined') return localStorage.getItem(key);
    return memoryFallback.get(key) ?? null;
  },
  set: (key: string, value: string): void => {
    if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
    else memoryFallback.set(key, value);
  },
  remove: (key: string): void => {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
    else memoryFallback.delete(key);
  },
};

const STORAGE_KEYS = {
  accessToken: 'luki_access_token',
  refreshToken: 'luki_refresh_token',
  canAccessOtt: 'luki_can_access_ott',
  restrictionMessage: 'luki_restriction_message',
} as const;

/**
 * Represents an authenticated user.
 *
 * @property id    - Unique user identifier (UUID).
 * @property email - User email address.
 * @property role  - User role (cliente, soporte, superadmin).
 */
export interface User {
  id: string;
  email: string;
  role: string;
}

/**
 * Shape of the authentication Zustand store.
 *
 * @property user               - Currently authenticated user, or null if not logged in.
 * @property isLoading          - Whether an auth request is in progress.
 * @property loginToken         - Temporary token returned after phase-1 login.
 * @property accessToken        - JWT access token obtained after OTP verification.
 * @property refreshToken       - JWT refresh token obtained after OTP verification.
 * @property canAccessOtt       - Whether the user can access OTT content.
 * @property restrictionMessage - Message to display when OTT access is restricted.
 * @property otpRequired        - Whether OTP verification is pending.
 * @property login              - Phase-1 login with contractNumber + password.
 * @property verifyOtp          - Phase-2 OTP verification.
 * @property logout             - Clears all auth state and revokes the backend session.
 * @property restoreSession     - Restores a persisted session on app startup.
 */
interface AuthState {
  user: User | null;
  isLoading: boolean;
  loginToken: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  canAccessOtt: boolean;
  restrictionMessage: string | null;
  otpRequired: boolean;
  login: (contractNumber: string, password: string) => Promise<void>;
  verifyOtp: (code: string) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
}

/**
 * Global authentication store (Zustand).
 *
 * Implements a two-phase authentication flow:
 *   Phase 1 — POST /auth/app/login      → receives loginToken + otpRequired flag
 *   Phase 2 — POST /auth/app/verify-otp → receives accessToken + refreshToken
 */
export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: false,
  loginToken: null,
  accessToken: null,
  refreshToken: null,
  canAccessOtt: true,
  restrictionMessage: null,
  otpRequired: false,

  /**
   * Phase-1 login: validates contractNumber + password, triggers OTP delivery.
   * On success stores the loginToken and sets otpRequired.
   */
  login: async (contractNumber: string, password: string) => {
    set({ isLoading: true });
    try {
      const data = await authApi.appLogin({
        contractNumber,
        password,
        deviceId: DEV_DEVICE_ID,
      });
      set({
        isLoading: false,
        loginToken: data.loginToken ?? null,
        otpRequired: data.otpRequired ?? false,
        canAccessOtt: data.canAccessOtt ?? true,
        restrictionMessage: data.restrictionMessage ?? null,
      });
    } catch (e) {
      set({ isLoading: false });
      throw e;
    }
  },

  /**
   * Phase-2 OTP verification: sends the 6-digit code + stored loginToken.
   * On success persists accessToken/refreshToken and loads the user profile.
   */
  verifyOtp: async (code: string) => {
    const { loginToken } = get();
    if (!loginToken) {
      throw new Error('No hay sesión de login activa. Vuelve a iniciar sesión.');
    }

    set({ isLoading: true });
    try {
      const data = await authApi.verifyOtp({ loginToken, code });

      // Persist tokens so session survives page reloads
      storage.set(STORAGE_KEYS.accessToken, data.accessToken);
      storage.set(STORAGE_KEYS.refreshToken, data.refreshToken);
      storage.set(STORAGE_KEYS.canAccessOtt, String(data.canAccessOtt));
      if (data.restrictionMessage) {
        storage.set(STORAGE_KEYS.restrictionMessage, data.restrictionMessage);
      } else {
        storage.remove(STORAGE_KEYS.restrictionMessage);
      }

      // Load full profile
      let user: User | null = null;
      try {
        const profile = await authApi.getMe(data.accessToken);
        user = { id: profile.id, email: profile.email, role: profile.role };
      } catch {
        // Profile fetch is best-effort; tokens are still valid
      }

      set({
        isLoading: false,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        loginToken: null,
        canAccessOtt: data.canAccessOtt ?? true,
        restrictionMessage: data.restrictionMessage ?? null,
        user,
      });
    } catch (e) {
      set({ isLoading: false });
      throw e;
    }
  },

  /**
   * Restores a persisted session from storage on app startup.
   * Validates the stored accessToken against /auth/me. If expired, attempts
   * refresh-token rotation before giving up and redirecting to login.
   */
  restoreSession: async () => {
    const storedAccess = storage.get(STORAGE_KEYS.accessToken);
    const storedRefresh = storage.get(STORAGE_KEYS.refreshToken);

    if (!storedAccess || !storedRefresh) return;

    set({ isLoading: true });
    try {
      // Try the stored access token first
      let accessToken = storedAccess;
      let refreshToken = storedRefresh;
      let canAccessOtt = storage.get(STORAGE_KEYS.canAccessOtt) !== 'false';
      let restrictionMessage = storage.get(STORAGE_KEYS.restrictionMessage);

      let profile: authApi.UserProfileResponse | null = null;
      try {
        profile = await authApi.getMe(accessToken);
        canAccessOtt = profile.canAccessOtt;
        restrictionMessage = profile.restrictionMessage;
      } catch {
        // Access token likely expired — try refresh rotation
        try {
          const refreshed = await authApi.refreshTokens(storedRefresh);
          accessToken = refreshed.accessToken;
          refreshToken = refreshed.refreshToken;
          canAccessOtt = refreshed.canAccessOtt ?? canAccessOtt;
          restrictionMessage = refreshed.restrictionMessage ?? restrictionMessage;

          // Persist rotated tokens
          storage.set(STORAGE_KEYS.accessToken, accessToken);
          storage.set(STORAGE_KEYS.refreshToken, refreshToken);
          storage.set(STORAGE_KEYS.canAccessOtt, String(canAccessOtt));
          if (restrictionMessage) {
            storage.set(STORAGE_KEYS.restrictionMessage, restrictionMessage);
          } else {
            storage.remove(STORAGE_KEYS.restrictionMessage);
          }

          profile = await authApi.getMe(accessToken);
          canAccessOtt = profile.canAccessOtt;
          restrictionMessage = profile.restrictionMessage;
        } catch {
          // Both tokens invalid — clear persisted state
          storage.remove(STORAGE_KEYS.accessToken);
          storage.remove(STORAGE_KEYS.refreshToken);
          storage.remove(STORAGE_KEYS.canAccessOtt);
          storage.remove(STORAGE_KEYS.restrictionMessage);
          set({ isLoading: false });
          return;
        }
      }

      if (!profile) {
        set({ isLoading: false });
        return;
      }

      set({
        isLoading: false,
        accessToken,
        refreshToken,
        canAccessOtt,
        restrictionMessage: restrictionMessage ?? null,
        user: { id: profile.id, email: profile.email, role: profile.role },
      });
    } catch {
      set({ isLoading: false });
    }
  },

  /**
   * Logs out: revokes the backend session and clears all local state.
   * Backend errors are logged but do not prevent local state from being cleared.
   */
  logout: async () => {
    const { accessToken, refreshToken } = get();
    if (accessToken && refreshToken) {
      try {
        await authApi.logout(accessToken, refreshToken);
      } catch (e) {
        console.warn('[AuthStore] Logout endpoint error (session cleared locally):', e);
      }
    }
    storage.remove(STORAGE_KEYS.accessToken);
    storage.remove(STORAGE_KEYS.refreshToken);
    storage.remove(STORAGE_KEYS.canAccessOtt);
    storage.remove(STORAGE_KEYS.restrictionMessage);
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      loginToken: null,
      otpRequired: false,
      canAccessOtt: true,
      restrictionMessage: null,
    });
  },
}));
