'use client';
import { create } from 'zustand';

interface AuthUser {
  id: string;
  email: string;
  role: 'superadmin' | 'soporte';
  firstName?: string | null;
  lastName?: string | null;
}

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  setSession: (accessToken: string, user: AuthUser) => void;
  clearSession: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  user: null,

  setSession: (accessToken, user) => set({ accessToken, user }),

  clearSession: () => set({ accessToken: null, user: null }),

  isAuthenticated: () => get().accessToken !== null,
}));

/** Parse JWT payload without verifying signature (client-side only) */
export function parseJwtPayload(token: string): AuthUser | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      id: payload.sub as string,
      email: payload.email as string ?? '',
      role: payload.role as 'superadmin' | 'soporte',
      firstName: payload.firstName as string ?? null,
      lastName: payload.lastName as string ?? null,
    };
  } catch {
    return null;
  }
}
