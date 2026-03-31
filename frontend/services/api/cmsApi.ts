const API_BASE_URL = 'http://localhost:3000';
const CMS_DEVICE_ID = 'luki-cms-web-001';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CmsLoginPayload {
  email: string;
  password: string;
}

export interface CmsAuthTokens {
  accessToken: string;
  refreshToken: string;
}

export type UserRole = 'CLIENT' | 'SUPPORT' | 'SUPERADMIN';

export interface CmsUser {
  id: string;
  email: string | null;
  role: UserRole;
  status: string;
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

export interface CmsAccount {
  id: string;
  userId: string;
  contractNumber: string;
  contractType: ContractType;
  serviceStatus: ServiceStatus;
  canAccessOtt: boolean;
  restrictionMessage: string | null;
}

export interface CmsSession {
  id: string;
  userId: string;
  deviceId: string;
  audience: string;
  expiresAt: string;
  createdAt: string;
  revokedAt: string | null;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

/**
 * Authenticates a CMS user (SUPPORT or SUPERADMIN) against the backend.
 * Does NOT require OTP — tokens are issued directly.
 */
export async function cmsLogin(payload: CmsLoginPayload): Promise<CmsAuthTokens> {
  const response = await fetch(`${API_BASE_URL}/auth/cms/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, deviceId: CMS_DEVICE_ID }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      (data as { message?: string }).message ?? 'Credenciales inválidas',
    );
  }

  return {
    accessToken: (data as CmsAuthTokens).accessToken,
    refreshToken: (data as CmsAuthTokens).refreshToken,
  };
}

/**
 * Fetches the current CMS user profile.
 */
export async function fetchCmsMe(
  accessToken: string,
): Promise<{ id: string; email: string; role: UserRole }> {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error('No se pudo obtener el perfil del usuario');
  }

  return data as { id: string; email: string; role: UserRole };
}

/**
 * Calls the backend logout endpoint to revoke the active CMS session.
 */
export async function cmsLogout(
  accessToken: string,
  refreshToken: string,
): Promise<void> {
  await fetch(`${API_BASE_URL}/auth/logout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ refreshToken }),
  }).catch(() => {
    // Ignore network errors on logout — always clear local state
  });
}

// ─── Mock data helpers ────────────────────────────────────────────────────────
// The backend does not expose CMS-specific list endpoints yet.
// These helpers return realistic seed data that mirrors the backend in-memory store.

export function getMockUsers(): CmsUser[] {
  return [
    {
      id: 'u-001',
      email: 'juan.perez@gmail.com',
      role: 'CLIENT',
      status: 'ACTIVE',
      createdAt: '2024-01-15T08:00:00Z',
    },
    {
      id: 'u-002',
      email: 'maria.gomez@hotmail.com',
      role: 'CLIENT',
      status: 'ACTIVE',
      createdAt: '2024-02-20T10:30:00Z',
    },
    {
      id: 'u-003',
      email: 'carlos.ramirez@gmail.com',
      role: 'CLIENT',
      status: 'ACTIVE',
      createdAt: '2024-03-05T14:00:00Z',
    },
    {
      id: 'u-004',
      email: 'ana.torres@lukiplay.com',
      role: 'CLIENT',
      status: 'ACTIVE',
      createdAt: '2024-03-10T09:00:00Z',
    },
    {
      id: 'u-005',
      email: 'soporte@lukiplay.com',
      role: 'SUPPORT',
      status: 'ACTIVE',
      createdAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 'u-006',
      email: 'admin@lukiplay.com',
      role: 'SUPERADMIN',
      status: 'ACTIVE',
      createdAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 'u-007',
      email: 'pedro.silva@gmail.com',
      role: 'CLIENT',
      status: 'INACTIVE',
      createdAt: '2024-04-01T11:00:00Z',
    },
  ];
}

export function getMockAccounts(): CmsAccount[] {
  return [
    {
      id: 'a-001',
      userId: 'u-001',
      contractNumber: 'CONTRACT-001',
      contractType: 'ISP',
      serviceStatus: 'ACTIVO',
      canAccessOtt: true,
      restrictionMessage: null,
    },
    {
      id: 'a-002',
      userId: 'u-002',
      contractNumber: 'CONTRACT-002',
      contractType: 'ISP',
      serviceStatus: 'SUSPENDIDO',
      canAccessOtt: false,
      restrictionMessage: 'Servicio suspendido por falta de pago',
    },
    {
      id: 'a-003',
      userId: 'u-003',
      contractNumber: 'OTT-00001',
      contractType: 'OTT_ONLY',
      serviceStatus: 'ACTIVO',
      canAccessOtt: true,
      restrictionMessage: null,
    },
    {
      id: 'a-004',
      userId: 'u-004',
      contractNumber: 'CONTRACT-003',
      contractType: 'ISP',
      serviceStatus: 'CORTESIA',
      canAccessOtt: true,
      restrictionMessage: null,
    },
    {
      id: 'a-005',
      userId: 'u-007',
      contractNumber: 'CONTRACT-004',
      contractType: 'ISP',
      serviceStatus: 'CORTADO',
      canAccessOtt: false,
      restrictionMessage: 'Servicio cortado. Contacte a soporte.',
    },
  ];
}

export function getMockSessions(): CmsSession[] {
  const now = new Date();
  const inOneDay = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  return [
    {
      id: 's-001',
      userId: 'u-001',
      deviceId: 'luki-web-dev-device-001',
      audience: 'APP',
      expiresAt: inOneDay.toISOString(),
      createdAt: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
      revokedAt: null,
    },
    {
      id: 's-002',
      userId: 'u-003',
      deviceId: 'luki-web-dev-device-001',
      audience: 'APP',
      expiresAt: inOneDay.toISOString(),
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      revokedAt: null,
    },
    {
      id: 's-003',
      userId: 'u-005',
      deviceId: 'luki-cms-web-001',
      audience: 'CMS',
      expiresAt: inOneDay.toISOString(),
      createdAt: new Date(now.getTime() - 10 * 60 * 1000).toISOString(),
      revokedAt: null,
    },
    {
      id: 's-004',
      userId: 'u-006',
      deviceId: 'luki-cms-web-001',
      audience: 'CMS',
      expiresAt: inOneDay.toISOString(),
      createdAt: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
      revokedAt: null,
    },
  ];
}
