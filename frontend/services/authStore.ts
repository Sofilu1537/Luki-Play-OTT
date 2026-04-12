import { create } from 'zustand';

const API_BASE_URL =
  typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.hostname}:3000`
    : 'http://localhost:3000';

// Stable device ID for development
const DEV_DEVICE_ID = 'luki-web-dev-device-001';

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
 * @property user           - Currently authenticated user, or null if not logged in.
 * @property isLoading      - Whether an auth request is in progress.
 * @property loginToken     - Temporary token returned after phase-1 login (used for OTP verification).
 * @property accessToken    - JWT access token obtained after successful OTP verification.
 * @property refreshToken   - JWT refresh token obtained after successful OTP verification.
 * @property otpRequired    - Whether OTP verification is required after login.
 * @property login          - Phase-1 login with contractNumber + password.
 * @property verifyOtp      - Phase-2 OTP verification using the stored loginToken.
 * @property logout         - Clears all auth state and calls the logout endpoint.
 */
interface AuthState {
    user: User | null;
    isLoading: boolean;
    loginToken: string | null;
    accessToken: string | null;
    refreshToken: string | null;
    otpRequired: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (nombre: string, email: string, password: string) => Promise<void>;
    forgotPassword: (email: string) => Promise<void>;
    verifyOtp: (code: string) => Promise<void>;
    logout: () => void;
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

    /**
     * Phase-1 login: sends contractNumber + password to the backend.
     * On success sets loginToken and otpRequired flag.
     *
     * @param contractNumber - Customer contract number.
     * @param password       - User's plaintext password.
     * @throws {Error} When credentials are rejected by the backend.
     */
    login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
            const response = await fetch(`${API_BASE_URL}/auth/app/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, deviceId: DEV_DEVICE_ID }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Credenciales inválidas');
            }

            set({
                isLoading: false,
                loginToken: data.loginToken ?? null,
                otpRequired: data.otpRequired ?? false,
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
            const response = await fetch(`${API_BASE_URL}/auth/app/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ loginToken, code }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Código OTP inválido o expirado');
            }

            set({
                isLoading: false,
                accessToken: data.accessToken ?? null,
                refreshToken: data.refreshToken ?? null,
                loginToken: null,
                user: {
                    id: data.userId ?? 'unknown',
                    name: data.name ?? 'Luki User',
                    email: data.email ?? '',
                    plan: 'premium',
                },
            });
        } catch (e) {
            set({ isLoading: false });
            throw e;
        }
    },

    /**
     * Register a new subscriber account by email.
     */
    register: async (nombre: string, email: string, password: string) => {
        set({ isLoading: true });
        try {
            const response = await fetch(`${API_BASE_URL}/auth/app/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre, email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'No se pudo crear la cuenta');
            }

            set({
                isLoading: false,
                loginToken: data.loginToken ?? null,
                otpRequired: data.otpRequired ?? false,
            });
        } catch (e) {
            set({ isLoading: false });
            throw e;
        }
    },

    /**
     * Request a password recovery code sent to the user's email.
     */
    forgotPassword: async (email: string) => {
        set({ isLoading: true });
        try {
            const response = await fetch(`${API_BASE_URL}/auth/send-recovery-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'No se pudo enviar el código de recuperación');
            }

            set({ isLoading: false });
        } catch (e) {
            set({ isLoading: false });
            throw e;
        }
    },

    /**
     * Logs out the current user: calls the logout endpoint and clears all state.
     */
    logout: () => {
        const { accessToken } = get();
        if (accessToken) {
            fetch(`${API_BASE_URL}/auth/logout`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${accessToken}` },
            }).catch(() => {
                // Ignore logout endpoint errors — always clear local state
            });
        }
        set({ user: null, accessToken: null, refreshToken: null, loginToken: null, otpRequired: false });
    },
}));