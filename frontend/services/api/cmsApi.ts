/**
 * CMS API — HTTP calls for CMS authentication.
 *
 * Kept separate from the CMS store so that network logic does not leak into
 * UI components or Zustand state management.
 */

const API_BASE_URL = 'http://localhost:3000';

/** Stable device ID used when making CMS login requests from the browser. */
const CMS_DEVICE_ID = 'luki-cms-web-device-001';

export interface CmsLoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    role: 'SUPPORT' | 'SUPERADMIN';
  };
}

/**
 * Sends email + password to POST /auth/cms/login.
 *
 * @throws {Error} When the server returns a non-2xx response.
 */
export async function cmsLoginRequest(
  email: string,
  password: string,
): Promise<CmsLoginResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/cms/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, deviceId: CMS_DEVICE_ID }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Credenciales inválidas');
  }

  return data as CmsLoginResponse;
}

/**
 * Calls POST /auth/logout to invalidate the current CMS session on the server.
 *
 * @param token - Bearer access token to revoke.
 */
export async function cmsLogoutRequest(token: string): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    // Ignore network errors — local state will be cleared regardless
  }
}
