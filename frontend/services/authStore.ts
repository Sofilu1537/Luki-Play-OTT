import { create } from 'zustand';

const API_BASE_URL =
  typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.hostname}:3000`
    : 'http://localhost:3000';

const DEV_DEVICE_ID = 'luki-web-dev-device-001';

/**
 * Represents an authenticated user.
 */
export interface User {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    plan: string;
}

/**
 * Pending activation state after first-access verification.
 */
interface PendingActivation {
    customerId: string;
    contractNumber: string;
    nombre: string;
}

/**
 * Shape of the authentication Zustand store.
 *
 * Contract-based auth flow (no OTP):
 *   1. firstAccess(contractNumber, idNumber) → pendingActivation
 *   2. activate(password, email?) → user + tokens
 *   -- OR --
 *   1. login(contractNumber, password) → user + tokens
 */
interface AuthState {
    user: User | null;
    isLoading: boolean;
    accessToken: string | null;
    refreshToken: string | null;
    pendingActivation: PendingActivation | null;
    login: (contractNumber: string, password: string) => Promise<void>;
    firstAccess: (contractNumber: string, idNumber: string) => Promise<void>;
    activate: (password: string, email?: string) => Promise<void>;
    resetPassword: (contractNumber: string, idNumber: string, newPassword: string) => Promise<void>;
    logout: () => void;
    restoreSession: () => Promise<void>;
}

/**
 * Global authentication store (Zustand).
 *
 * Implements contract-based authentication:
 *   Login   — POST /auth/app/contract-login → JWT tokens directly
 *   First   — POST /auth/app/first-access   → verify identity
 *   Activate— POST /auth/app/activate        → set password + JWT
 *   Reset   — POST /auth/app/reset-password  → new password via cédula
 */
export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    isLoading: false,
    accessToken: null,
    refreshToken: null,
    pendingActivation: null,

    restoreSession: async () => {
        // No persistent session in this version — nothing to restore
    },

    /**
     * Login with contract number + password.
     * Returns JWT tokens directly (no OTP step).
     */
    login: async (contractNumber: string, password: string) => {
        set({ isLoading: true });
        try {
            const response = await fetch(`${API_BASE_URL}/auth/app/contract-login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contractNumber, password, deviceId: DEV_DEVICE_ID }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Credenciales inválidas');
            }

            set({
                isLoading: false,
                accessToken: data.accessToken,
                refreshToken: data.refreshToken,
                user: {
                    id: data.user?.id ?? 'unknown',
                    name: data.user?.name ?? 'Luki User',
                    email: data.user?.email ?? '',
                    plan: data.user?.plan ?? 'lukiplay',
                },
                pendingActivation: null,
            });
        } catch (e) {
            set({ isLoading: false });
            throw e;
        }
    },

    /**
     * First-access: verify contract + cédula.
     * Sets pendingActivation if identity is confirmed.
     */
    firstAccess: async (contractNumber: string, idNumber: string) => {
        set({ isLoading: true });
        try {
            const response = await fetch(`${API_BASE_URL}/auth/app/first-access`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contractNumber, idNumber }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'No se pudo verificar el contrato');
            }

            set({
                isLoading: false,
                pendingActivation: {
                    customerId: data.customerId,
                    contractNumber: data.contractNumber,
                    nombre: data.nombre,
                },
            });
        } catch (e) {
            set({ isLoading: false });
            throw e;
        }
    },

    /**
     * Activate account: set password after first-access verification.
     * Optionally set email for marketing/notifications.
     */
    activate: async (password: string, email?: string) => {
        const { pendingActivation } = get();
        if (!pendingActivation) {
            throw new Error('No hay activación pendiente. Verifica tu contrato primero.');
        }

        set({ isLoading: true });
        try {
            const response = await fetch(`${API_BASE_URL}/auth/app/activate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerId: pendingActivation.customerId,
                    password,
                    ...(email ? { email } : {}),
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'No se pudo activar la cuenta');
            }

            set({
                isLoading: false,
                accessToken: data.accessToken,
                refreshToken: data.refreshToken,
                user: {
                    id: data.user?.id ?? 'unknown',
                    name: data.user?.name ?? pendingActivation.nombre,
                    email: data.user?.email ?? email ?? '',
                    plan: data.user?.plan ?? 'lukiplay',
                },
                pendingActivation: null,
            });
        } catch (e) {
            set({ isLoading: false });
            throw e;
        }
    },

    /**
     * Reset password using contract number + cédula verification.
     */
    resetPassword: async (contractNumber: string, idNumber: string, newPassword: string) => {
        set({ isLoading: true });
        try {
            const response = await fetch(`${API_BASE_URL}/auth/app/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contractNumber, idNumber, newPassword }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'No se pudo restablecer la contraseña');
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
            }).catch(() => {});
        }
        set({
            user: null,
            accessToken: null,
            refreshToken: null,
            pendingActivation: null,
        });
    },
}));