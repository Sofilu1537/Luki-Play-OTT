/**
 * CMS API — HTTP calls for the internal admin/support panel.
 *
 * All functions are pure HTTP helpers with no side-effects on global state.
 * State management is handled separately in `cmsStore.ts`.
 */

const API_BASE_URL = 'http://localhost:3000';

// ─── Response types ──────────────────────────────────────────────────────────

export interface CmsLoginResponse {
  accessToken: string;
  refreshToken: string;
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export interface CmsLogoutResponse {
  message: string;
}

// ─── Request helpers ─────────────────────────────────────────────────────────

/**
 * POST /auth/cms/login
 * Authenticates a CMS user (SUPPORT or SUPERADMIN) using email + password.
 *
 * @param email    - CMS user email address.
 * @param password - Plaintext password.
 * @param deviceId - Unique device identifier for session tracking.
 */
export async function cmsLoginRequest(
  email: string,
  password: string,
  deviceId: string,
): Promise<CmsLoginResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/cms/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, deviceId }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Credenciales inválidas');
  }

  return data as CmsLoginResponse;
}

/**
 * POST /auth/logout
 * Revokes the current CMS session.
 *
 * @param accessToken - Bearer token of the active session.
 */
export async function cmsLogoutRequest(accessToken: string): Promise<void> {
  await fetch(`${API_BASE_URL}/auth/logout`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  }).catch(() => {
    // Ignore logout endpoint errors — always clear local state
  });
}

// ─── Future API endpoints (prepared for real data) ───────────────────────────

/**
 * GET /cms/users
 * Fetch all users (requires SUPPORT or SUPERADMIN role).
 *
 * TODO: implement when backend exposes this endpoint.
 */
export async function getUsersRequest(_accessToken: string): Promise<unknown[]> {
  // TODO: replace with real API call
  return [];
}

/**
 * GET /cms/accounts
 * Fetch all accounts/contracts.
 *
 * TODO: implement when backend exposes this endpoint.
 */
export async function getAccountsRequest(_accessToken: string): Promise<unknown[]> {
  // TODO: replace with real API call
  return [];
}

/**
 * GET /cms/sessions
 * Fetch all active sessions.
 *
 * TODO: implement when backend exposes this endpoint.
 */
export async function getSessionsRequest(_accessToken: string): Promise<unknown[]> {
  // TODO: replace with real API call
  return [];
}

/**
 * DELETE /cms/sessions/:id
 * Revoke a specific user session.
 *
 * TODO: implement when backend exposes this endpoint.
 */
export async function revokeSessionRequest(
  _accessToken: string,
  _sessionId: string,
): Promise<void> {
  // TODO: replace with real API call
}
