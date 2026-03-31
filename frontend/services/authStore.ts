import { create } from 'zustand';
import { authApi } from './api/authApi';

const API_BASE_URL = 'http://localhost:3000';

// Stable device ID for development
const DEV_DEVICE_ID = 'luki-web-dev-device-001';

// LocalStorage key for persisting auth state (web only)
const STORAGE_KEY = 'luki_auth_state';

/**
 * Represents an authenticated user.
 *
 * @property id      - Unique user identifier.
 * @property name    - Display name.
 * @property email   - User email address.
 * @property avatar  - Optional avatar image URL.
 * @property plan    - Subscription tier: 'free' or 'premium'.
 */
export interface User {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    plan: 'free' | 'premium';
}

/**
 * Shape of the authentication Zustand store.
 *
 * @property user              - Currently authenticated user, or null if not logged in.
 * @property isLoading         - Whether an auth request is in progress.
 * @property loginToken        - Temporary token returned after phase-1 login (used for OTP verification).
 * @property accessToken       - JWT access token obtained after successful OTP verification.
 * @property refreshToken      - JWT refresh token obtained after successful OTP verification.
 * @property otpRequired       - Whether OTP verification is required after login.
 * @property canAccessOtt      - Whether the authenticated user can access OTT content.
 * @property restrictionMessage - Message shown when OTT access is restricted.
 * @property login             - Phase-1 login with contractNumber + password.
 * @property verifyOtp         - Phase-2 OTP verification using the stored loginToken.
 * @property logout            - Clears all auth state and calls the logout endpoint.
 * @property restoreSession    - Attempts to restore a previously persisted session.
 */
interface AuthState {
    user: User | null;
    isLoading: boolean;
    loginToken: string | null;
    accessToken: string | null;
    refreshToken: string | null;
    otpRequired: boolean;
    canAccessOtt: boolean;
    restrictionMessage: string | null;
    login: (contractNumber: string, password: string) => Promise<void>;
    verifyOtp: (code: string) => Promise<void>;
    logout: () => void;
    restoreSession: () => Promise<void>;
}

/** Persists auth tokens to localStorage (web). No-op on native. */
function persistTokens(accessToken: string, refreshToken: string): void {
    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ accessToken, refreshToken }));
        }
    } catch {
        // Storage may be unavailable (e.g. private browsing with strict settings)
    }
}

/** Clears persisted auth tokens from localStorage. */
function clearPersistedTokens(): void {
    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.removeItem(STORAGE_KEY);
        }
    } catch {}
}

/** Reads persisted tokens from localStorage. Returns null if unavailable. */
function readPersistedTokens(): { accessToken: string; refreshToken: string } | null {
    try {
        if (typeof localStorage !== 'undefined') {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) return JSON.parse(raw);
        }
    } catch {}
    return null;
}

/**
 * Global authentication store (Zustand).
 *
 * Implements a two-phase authentication flow:
 *   Phase 1 — POST /auth/app/login   → receives loginToken + otpRequired flag
 *   Phase 2 — POST /auth/app/verify-otp → receives accessToken + refreshToken
 */
export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    isLoading: false,
    loginToken: null,
    accessToken: null,
    refreshToken: null,
    otpRequired: false,
    canAccessOtt: true,
    restrictionMessage: null,

    /**
     * Phase-1 login: sends contractNumber + password to the backend.
     * On success sets loginToken and otpRequired flag.
     *
     * @param contractNumber - Customer contract number.
     * @param password       - User's plaintext password.
     * @throws {Error} When credentials are rejected by the backend.
     */
    login: async (contractNumber: string, password: string) => {
        set({ isLoading: true });
        try {
            const data = await authApi.appLogin(contractNumber, password, DEV_DEVICE_ID);
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
     * On success sets accessToken, refreshToken, and user.
     *
     * @param code - 6-digit OTP code entered by the user.
     * @throws {Error} When the code is invalid or the token has expired.
     */
    verifyOtp: async (code: string) => {
        const { loginToken } = get();
        if (!loginToken) {
            throw new Error('No hay sesión de login activa. Vuelve a iniciar sesión.');
        }

        set({ isLoading: true });
        try {
            const data = await authApi.verifyOtp(loginToken, code);

            // Fetch full user profile
            let user: User = {
                id: 'unknown',
                name: 'Luki User',
                email: '',
                plan: 'premium',
            };
            try {
                const profile = await authApi.me(data.accessToken);
                user = {
                    id: profile.id,
                    name: profile.contractNumber ?? profile.email ?? 'Luki User',
                    email: profile.email ?? '',
                    plan: 'premium',
                };
            } catch {
                // Profile fetch is non-critical — continue with tokens
            }

            persistTokens(data.accessToken, data.refreshToken);
            set({
                isLoading: false,
                accessToken: data.accessToken ?? null,
                refreshToken: data.refreshToken ?? null,
                canAccessOtt: data.canAccessOtt ?? true,
                restrictionMessage: data.restrictionMessage ?? null,
                loginToken: null,
                user,
            });
        } catch (e) {
            set({ isLoading: false });
            throw e;
        }
    },

    /**
     * Logs out the current user: calls the logout endpoint and clears all state.
     */
    logout: () => {
        const { accessToken, refreshToken } = get();
        if (accessToken && refreshToken) {
            authApi.logout(accessToken, refreshToken).catch(() => {
                // Ignore logout endpoint errors — always clear local state
            });
        }
        clearPersistedTokens();
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

    /**
     * Attempts to restore a previously persisted session using stored tokens.
     * Tries the access token first; if expired, attempts refresh.
     * Clears persisted state if restoration fails.
     */
    restoreSession: async () => {
        const persisted = readPersistedTokens();
        if (!persisted) return;

        set({ isLoading: true });
        try {
            // Try to fetch profile with existing access token
            const profile = await authApi.me(persisted.accessToken);
            const user: User = {
                id: profile.id,
                name: profile.contractNumber ?? profile.email ?? 'Luki User',
                email: profile.email ?? '',
                plan: 'premium',
            };
            set({
                isLoading: false,
                accessToken: persisted.accessToken,
                refreshToken: persisted.refreshToken,
                canAccessOtt: profile.canAccessOtt ?? true,
                restrictionMessage: profile.restrictionMessage ?? null,
                user,
            });
        } catch {
            // Access token likely expired — attempt refresh
            try {
                const refreshed = await authApi.refresh(persisted.refreshToken);
                const profile = await authApi.me(refreshed.accessToken);
                const user: User = {
                    id: profile.id,
                    name: profile.contractNumber ?? profile.email ?? 'Luki User',
                    email: profile.email ?? '',
                    plan: 'premium',
                };
                persistTokens(refreshed.accessToken, refreshed.refreshToken);
                set({
                    isLoading: false,
                    accessToken: refreshed.accessToken,
                    refreshToken: refreshed.refreshToken,
                    canAccessOtt: refreshed.canAccessOtt ?? true,
                    restrictionMessage: refreshed.restrictionMessage ?? null,
                    user,
                });
            } catch {
                // Refresh also failed — clear persisted tokens
                clearPersistedTokens();
                set({ isLoading: false });
            }
        }
    },
}));