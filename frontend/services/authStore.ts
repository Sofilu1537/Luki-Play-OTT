import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const API_BASE_URL =
  typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? `${window.location.protocol}//${window.location.host}`
    : 'http://localhost:3000';

export const DEV_DEVICE_ID = 'luki-web-dev-device-001';

export interface User {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    plan: string;
}

interface PendingActivation {
    customerId: string;
    nombre: string;
}

interface RegistrationRequestPayload {
    nombres: string;
    apellidos: string;
    idNumber: string;
    telefono: string;
    email?: string;
    direccion?: string;
}

interface AuthState {
    user: User | null;
    isLoading: boolean;
    accessToken: string | null;
    refreshToken: string | null;
    pendingActivation: PendingActivation | null;
    codeVerified: boolean;

    login: (contractNumber: string, password: string) => Promise<void>;
    loginWithId: (idNumber: string, password: string) => Promise<void>;
    firstAccess: (idNumber: string) => Promise<void>;
    requestActivationCode: (customerId: string, email?: string) => Promise<{ sent: boolean; needsSupportCode?: boolean }>;
    verifyActivationCode: (customerId: string, code: string) => Promise<void>;
    activate: (customerId: string, otpCode: string, password: string, email?: string) => Promise<void>;
    resetPassword: (contractNumber: string, idNumber: string, newPassword: string) => Promise<void>;
    requestPasswordOtp: (idNumber: string) => Promise<void>;
    resetWithOtp: (idNumber: string, otpCode: string, newPassword: string) => Promise<void>;
    submitRegistrationRequest: (data: RegistrationRequestPayload) => Promise<void>;
    logout: () => void;
    refreshSession: () => Promise<boolean>;
    restoreSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
    user: null,
    isLoading: false,
    accessToken: null,
    refreshToken: null,
    pendingActivation: null,
    codeVerified: false,

    refreshSession: async (): Promise<boolean> => {
        const { refreshToken } = get();
        if (!refreshToken) return false;
        try {
            const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken }),
            });
            if (!res.ok) {
                get().logout();
                return false;
            }
            const data = await res.json();
            set({
                accessToken: data.accessToken,
                refreshToken: data.refreshToken ?? refreshToken,
            });
            return true;
        } catch {
            return false;
        }
    },

    restoreSession: async () => {
        const { accessToken, refreshToken } = get();
        if (!accessToken || !refreshToken) return;
        try {
            const [, payload] = accessToken.split('.');
            const { exp } = JSON.parse(atob(payload)) as { exp?: number };
            // Refresh if expired or expiring within the next 60 seconds
            if (exp && exp * 1000 < Date.now() + 60_000) {
                await get().refreshSession();
            }
        } catch {
            await get().refreshSession();
        }
    },

    login: async (contractNumber, password) => {
        set({ isLoading: true });
        try {
            const res = await fetch(`${API_BASE_URL}/auth/app/contract-login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contractNumber, password, deviceId: DEV_DEVICE_ID }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Credenciales inválidas');
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
                codeVerified: false,
            });
        } catch (e) {
            set({ isLoading: false });
            throw e;
        }
    },

    loginWithId: async (idNumber, password) => {
        set({ isLoading: true });
        try {
            const res = await fetch(`${API_BASE_URL}/auth/app/id-login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idNumber, password, deviceId: DEV_DEVICE_ID }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Credenciales inválidas');
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
                codeVerified: false,
            });
        } catch (e) {
            set({ isLoading: false });
            throw e;
        }
    },

    firstAccess: async (idNumber) => {
        set({ isLoading: true });
        try {
            const res = await fetch(`${API_BASE_URL}/auth/app/first-access`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idNumber }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'No se pudo verificar la cédula');
            set({
                isLoading: false,
                pendingActivation: {
                    customerId: data.customerId,
                    nombre: data.nombre,
                },
                codeVerified: false,
            });
        } catch (e) {
            set({ isLoading: false });
            throw e;
        }
    },

    requestActivationCode: async (customerId, email) => {
        set({ isLoading: true });
        try {
            const res = await fetch(`${API_BASE_URL}/auth/app/request-activation-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ customerId, ...(email ? { email } : {}) }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Error al solicitar el código');
            set({ isLoading: false });
            return { sent: data.sent ?? false, needsSupportCode: data.needsSupportCode };
        } catch (e) {
            set({ isLoading: false });
            throw e;
        }
    },

    verifyActivationCode: async (customerId, code) => {
        set({ isLoading: true });
        try {
            const res = await fetch(`${API_BASE_URL}/auth/app/verify-activation-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ customerId, code: code.toUpperCase() }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Código inválido o expirado');
            set({ isLoading: false, codeVerified: true });
        } catch (e) {
            set({ isLoading: false });
            throw e;
        }
    },

    activate: async (customerId, otpCode, password, email) => {
        set({ isLoading: true });
        try {
            const res = await fetch(`${API_BASE_URL}/auth/app/activate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerId,
                    otpCode,
                    password,
                    ...(email ? { email } : {}),
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'No se pudo activar la cuenta');
            set({
                isLoading: false,
                accessToken: data.accessToken,
                refreshToken: data.refreshToken,
                user: {
                    id: data.user?.id ?? 'unknown',
                    name: data.user?.name ?? '',
                    email: data.user?.email ?? email ?? '',
                    plan: data.user?.plan ?? 'lukiplay',
                },
                pendingActivation: null,
                codeVerified: false,
            });
        } catch (e) {
            set({ isLoading: false });
            throw e;
        }
    },

    resetPassword: async (contractNumber, idNumber, newPassword) => {
        set({ isLoading: true });
        try {
            const res = await fetch(`${API_BASE_URL}/auth/app/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contractNumber, idNumber, newPassword }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'No se pudo restablecer la contraseña');
            set({ isLoading: false });
        } catch (e) {
            set({ isLoading: false });
            throw e;
        }
    },

    requestPasswordOtp: async (idNumber) => {
        set({ isLoading: true });
        try {
            const res = await fetch(`${API_BASE_URL}/auth/app/request-password-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idNumber }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Error al solicitar el código');
            set({ isLoading: false });
        } catch (e) {
            set({ isLoading: false });
            throw e;
        }
    },

    resetWithOtp: async (idNumber, otpCode, newPassword) => {
        set({ isLoading: true });
        try {
            const res = await fetch(`${API_BASE_URL}/auth/app/reset-with-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idNumber, otpCode, newPassword }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'No se pudo restablecer la contraseña');
            set({ isLoading: false });
        } catch (e) {
            set({ isLoading: false });
            throw e;
        }
    },

    submitRegistrationRequest: async (payload) => {
        set({ isLoading: true });
        try {
            const res = await fetch(`${API_BASE_URL}/auth/app/registration-request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'No se pudo enviar la solicitud');
            set({ isLoading: false });
        } catch (e) {
            set({ isLoading: false });
            throw e;
        }
    },

    logout: () => {
        const { accessToken, refreshToken } = get();
        if (accessToken && refreshToken) {
            fetch(`${API_BASE_URL}/auth/logout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
                body: JSON.stringify({ refreshToken }),
            }).catch(() => {});
        }
        set({ user: null, accessToken: null, refreshToken: null, pendingActivation: null, codeVerified: false });
    },
    }),
    {
      name: 'luki-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
    },
  )
);
