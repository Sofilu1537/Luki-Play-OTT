import { create } from 'zustand';
import { cmsLoginRequest, cmsLogoutRequest } from './api/cmsApi';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CmsRole = 'SUPPORT' | 'SUPERADMIN';

export interface CmsUser {
  id: string;
  email: string;
  role: CmsRole;
}

// ---------------------------------------------------------------------------
// Mock data — replace with real API calls when endpoints are available
// ---------------------------------------------------------------------------

export type UserRole = 'CLIENT' | 'SUPPORT' | 'SUPERADMIN';

export interface MockUser {
  id: string;
  email: string;
  role: UserRole;
  phone: string | null;
  createdAt: string;
}

export type ServiceStatus =
  | 'ACTIVO'
  | 'CORTESIA'
  | 'PENDIENTE'
  | 'SUSPENDIDO'
  | 'ANULADO'
  | 'CORTADO';

export type ContractType = 'ISP' | 'OTT_ONLY';

export interface MockAccount {
  id: string;
  contractNumber: string;
  contractType: ContractType;
  serviceStatus: ServiceStatus;
  canAccessOtt: boolean;
  associatedEmail: string | null;
}

export interface MockSession {
  id: string;
  userEmail: string;
  deviceId: string;
  createdAt: string;
  expiresAt: string;
  status: 'ACTIVE' | 'REVOKED';
}

export const MOCK_USERS: MockUser[] = [
  { id: 'u-001', email: 'cliente1@gmail.com',     role: 'CLIENT',     phone: '+5491100000001', createdAt: '2025-01-10' },
  { id: 'u-002', email: 'cliente2@hotmail.com',   role: 'CLIENT',     phone: '+5491100000002', createdAt: '2025-02-14' },
  { id: 'u-003', email: 'cliente3@gmail.com',     role: 'CLIENT',     phone: null,             createdAt: '2025-03-01' },
  { id: 'u-004', email: 'cliente4@yahoo.com',     role: 'CLIENT',     phone: '+5491100000004', createdAt: '2025-03-12' },
  { id: 'u-005', email: 'cliente5@gmail.com',     role: 'CLIENT',     phone: '+5491100000005', createdAt: '2025-03-20' },
  { id: 'u-006', email: 'soporte@lukiplay.com',   role: 'SUPPORT',    phone: '+5491100000006', createdAt: '2024-12-01' },
  { id: 'u-007', email: 'admin@lukiplay.com',     role: 'SUPERADMIN', phone: '+5491100000007', createdAt: '2024-11-15' },
];

export const MOCK_ACCOUNTS: MockAccount[] = [
  { id: 'a-001', contractNumber: 'CONTRACT-001', contractType: 'ISP',      serviceStatus: 'ACTIVO',     canAccessOtt: true,  associatedEmail: 'cliente1@gmail.com'   },
  { id: 'a-002', contractNumber: 'CONTRACT-002', contractType: 'ISP',      serviceStatus: 'SUSPENDIDO', canAccessOtt: false, associatedEmail: 'cliente2@hotmail.com' },
  { id: 'a-003', contractNumber: 'CONTRACT-003', contractType: 'ISP',      serviceStatus: 'CORTESIA',   canAccessOtt: true,  associatedEmail: 'cliente3@gmail.com'   },
  { id: 'a-004', contractNumber: 'CONTRACT-004', contractType: 'ISP',      serviceStatus: 'PENDIENTE',  canAccessOtt: false, associatedEmail: null                   },
  { id: 'a-005', contractNumber: 'CONTRACT-005', contractType: 'ISP',      serviceStatus: 'CORTADO',    canAccessOtt: false, associatedEmail: 'cliente4@yahoo.com'   },
  { id: 'a-006', contractNumber: 'OTT-00001',    contractType: 'OTT_ONLY', serviceStatus: 'ACTIVO',     canAccessOtt: true,  associatedEmail: 'cliente5@gmail.com'   },
  { id: 'a-007', contractNumber: 'OTT-00002',    contractType: 'OTT_ONLY', serviceStatus: 'ANULADO',    canAccessOtt: false, associatedEmail: null                   },
];

export const MOCK_SESSIONS: MockSession[] = [
  { id: 's-001', userEmail: 'cliente1@gmail.com',   deviceId: 'luki-web-dev-device-001',   createdAt: '2026-03-31T06:00:00Z', expiresAt: '2026-04-07T06:00:00Z', status: 'ACTIVE'  },
  { id: 's-002', userEmail: 'cliente3@gmail.com',   deviceId: 'luki-web-dev-device-002',   createdAt: '2026-03-31T07:00:00Z', expiresAt: '2026-04-07T07:00:00Z', status: 'ACTIVE'  },
  { id: 's-003', userEmail: 'cliente5@gmail.com',   deviceId: 'luki-web-dev-device-003',   createdAt: '2026-03-30T12:00:00Z', expiresAt: '2026-04-06T12:00:00Z', status: 'ACTIVE'  },
  { id: 's-004', userEmail: 'cliente2@hotmail.com', deviceId: 'luki-mobile-device-abc',    createdAt: '2026-03-29T08:00:00Z', expiresAt: '2026-04-05T08:00:00Z', status: 'REVOKED' },
  { id: 's-005', userEmail: 'soporte@lukiplay.com', deviceId: 'luki-cms-web-device-001',   createdAt: '2026-03-31T07:09:00Z', expiresAt: '2026-04-07T07:09:00Z', status: 'ACTIVE'  },
];

// ---------------------------------------------------------------------------
// Store shape
// ---------------------------------------------------------------------------

interface CmsState {
  /** Currently authenticated CMS user, or null if not logged in. */
  cmsUser: CmsUser | null;
  /** Bearer access token for API calls. */
  cmsAccessToken: string | null;
  /** Refresh token (stored for future rotation). */
  cmsRefreshToken: string | null;
  /** Whether the user is authenticated. */
  isAuthenticated: boolean;
  /** Whether a network request is in progress. */
  isLoading: boolean;

  // --- Mock data for tables (replaced by real API calls when ready) ---
  mockUsers: MockUser[];
  mockAccounts: MockAccount[];
  mockSessions: MockSession[];

  // --- Actions ---
  cmsLogin: (email: string, password: string) => Promise<void>;
  cmsLogout: () => void;
  revokeSession: (sessionId: string) => void;
}

// ---------------------------------------------------------------------------
// Store implementation
// ---------------------------------------------------------------------------

/**
 * Zustand store for the CMS panel.
 *
 * Kept strictly separate from `useAuthStore` (client app auth) and
 * `useAdminStore` (channel management).
 */
export const useCmsStore = create<CmsState>()((set, get) => ({
  cmsUser: null,
  cmsAccessToken: null,
  cmsRefreshToken: null,
  isAuthenticated: false,
  isLoading: false,

  mockUsers: MOCK_USERS,
  mockAccounts: MOCK_ACCOUNTS,
  mockSessions: MOCK_SESSIONS,

  /**
   * Authenticates a CMS user via POST /auth/cms/login.
   * Only SUPPORT and SUPERADMIN roles are accepted.
   *
   * @throws {Error} On invalid credentials or insufficient role.
   */
  cmsLogin: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const data = await cmsLoginRequest(email, password);

      if (data.user.role !== 'SUPPORT' && data.user.role !== 'SUPERADMIN') {
        throw new Error('Acceso denegado: rol no autorizado para el panel CMS.');
      }

      set({
        cmsUser: { id: data.user.id, email: data.user.email, role: data.user.role },
        cmsAccessToken: data.accessToken,
        cmsRefreshToken: data.refreshToken,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (e) {
      set({ isLoading: false });
      throw e;
    }
  },

  /** Logs out the CMS user and invalidates the server session. */
  cmsLogout: () => {
    const { cmsAccessToken } = get();
    if (cmsAccessToken) {
      cmsLogoutRequest(cmsAccessToken);
    }
    set({
      cmsUser: null,
      cmsAccessToken: null,
      cmsRefreshToken: null,
      isAuthenticated: false,
    });
  },

  /**
   * Marks a session as REVOKED in the mock data.
   * TODO: Replace with real API call (DELETE /sessions/:id or PATCH /sessions/:id).
   */
  revokeSession: (sessionId: string) => {
    set((state) => ({
      mockSessions: state.mockSessions.map((s) =>
        s.id === sessionId ? { ...s, status: 'REVOKED' as const } : s,
      ),
    }));
  },
}));
