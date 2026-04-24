import { create } from 'zustand';
import { API_BASE_URL } from './api/config';

const DEV_DEVICE_ID = 'luki-web-dev-device-001';

export interface User {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    plan: string;
}

interface PendingActivation {
    customerId: string;
    contractNumber: string;
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
    firstAccess: (contractNumber: string, idNumber: string) => Promise<void>;
    requestActivationCode: (customerId: string, email?: string) => Promise<{ sent: boolean; needsSupportCode?: boolean }>;
    verifyActivationCode: (customerId: string, code: string) => Promise<void>;
    activate: (customerId: string, code: string, password: string, email?: string) => Promise<void>;
    resetPassword: (contractNumber: string, idNumber: string, newPassword: string) => Promise<void>;
    submitRegistrationRequest: (data: RegistrationRequestPayload) => Promise<void>;
    logout: () => void;
    restoreSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    isLoading: false,
    accessToken: null,
    refreshToken: null,
    pendingActivation: null,
    codeVerified: false,

    restoreSession: async () => {},

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

    firstAccess: async (contractNumber, idNumber) => {
        set({ isLoading: true });
        try {
            const res = await fetch(`${API_BASE_URL}/auth/app/first-access`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contractNumber, idNumber }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'No se pudo verificar el contrato');
            set({
                isLoading: false,
                pendingActivation: {
                    customerId: data.customerId,
                    contractNumber: data.contractNumber,
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

    activate: async (customerId, code, password, email) => {
        set({ isLoading: true });
        try {
            const res = await fetch(`${API_BASE_URL}/auth/app/activate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerId,
                    code: code.toUpperCase(),
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
        const { accessToken } = get();
        if (accessToken) {
            fetch(`${API_BASE_URL}/auth/logout`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${accessToken}` },
            }).catch(() => {});
        }
        set({ user: null, accessToken: null, refreshToken: null, pendingActivation: null, codeVerified: false });
    },
}));
