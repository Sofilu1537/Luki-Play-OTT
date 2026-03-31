/**
 * Separated HTTP layer for CMS admin endpoints.
 * All endpoints require a Bearer token from a CMS user (SOPORTE or SUPERADMIN role).
 */

const API_BASE_URL = 'http://localhost:3000';

export interface CmsStatsResponse {
  totalUsers: number;
  totalClients: number;
  totalCmsUsers: number;
  totalAccounts: number;
  totalIspAccounts: number;
  totalOttAccounts: number;
  totalActiveSessions: number;
}

export interface CmsUser {
  id: string;
  email: string;
  contractNumber: string | null;
  role: string;
  status: string;
  accountId: string | null;
  phone: string | null;
  createdAt: string;
}

export interface CmsAccount {
  id: string;
  contractNumber: string;
  contractType: string;
  isIspCustomer: boolean;
  planId: string;
  subscriptionStatus: string;
  serviceStatus: string | null;
  maxDevices: number;
  canAccessOtt: boolean;
  restrictionMessage: string | null;
}

export interface CmsSession {
  id: string;
  deviceId: string;
  audience: string;
  createdAt: string;
  expiresAt: string;
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || `HTTP ${res.status}`);
  }
  return data as T;
}

function authHeaders(token: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export const cmsApi = {
  /** Login for CMS users (email + password, no OTP) */
  login(email: string, password: string, deviceId: string) {
    return fetch(`${API_BASE_URL}/auth/cms/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, deviceId }),
    }).then((res) =>
      handleResponse<{ accessToken: string; refreshToken: string }>(res),
    );
  },

  /** Get dashboard statistics */
  getStats(token: string) {
    return fetch(`${API_BASE_URL}/cms/stats`, {
      headers: authHeaders(token),
    }).then((res) => handleResponse<CmsStatsResponse>(res));
  },

  /** List all users */
  listUsers(token: string) {
    return fetch(`${API_BASE_URL}/cms/users`, {
      headers: authHeaders(token),
    }).then((res) => handleResponse<CmsUser[]>(res));
  },

  /** List all accounts/contracts */
  listAccounts(token: string) {
    return fetch(`${API_BASE_URL}/cms/accounts`, {
      headers: authHeaders(token),
    }).then((res) => handleResponse<CmsAccount[]>(res));
  },

  /** List all active sessions */
  listSessions(token: string) {
    return fetch(`${API_BASE_URL}/cms/sessions`, {
      headers: authHeaders(token),
    }).then((res) => handleResponse<CmsSession[]>(res));
  },

  /** Revoke a session (superadmin only) */
  revokeSession(token: string, sessionId: string) {
    return fetch(`${API_BASE_URL}/cms/sessions/${sessionId}`, {
      method: 'DELETE',
      headers: authHeaders(token),
    }).then((res) => handleResponse<{ message: string }>(res));
  },

  /** Get current CMS user profile */
  me(token: string) {
    return fetch(`${API_BASE_URL}/auth/me`, {
      headers: authHeaders(token),
    }).then((res) => handleResponse<{ id: string; email: string; role: string }>(res));
  },

  /** Logout CMS session */
  logout(accessToken: string, refreshToken: string) {
    return fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: authHeaders(accessToken),
      body: JSON.stringify({ refreshToken }),
    }).then((res) => handleResponse<{ message: string }>(res));
  },
};
