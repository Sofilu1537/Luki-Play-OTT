/**
 * CMS API — low-level HTTP functions for the internal CMS panel.
 *
 * All functions talk to the NestJS auth-service at API_BASE_URL.
 * Errors are thrown as `Error` instances with a human-readable message.
 */

import { API_BASE_URL } from './config';

/** Stable device ID used for CMS browser sessions in development. */
const CMS_DEVICE_ID = 'luki-cms-browser-001';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CmsLoginPayload {
  email: string;
  password: string;
}

export interface CmsAuthResponse {
  accessToken: string;
  refreshToken: string;
  canAccessOtt: boolean;
  restrictionMessage: string | null;
}

export interface CmsUserProfile {
  id: string;
  firstName: string | null;
  lastName: string | null;
  idNumber: string | null;
  email: string;
  role: string;
  status: string;
  contractNumber: string | null;
  accountId: string | null;
  contractType: string | null;
  serviceStatus: string | null;
  canAccessOtt: boolean;
  restrictionMessage: string | null;
  lastLoginAt: string | null;
  permissions: string[];
  entitlements: string[];
  mustChangePassword?: boolean;
}

export interface CmsSession {
  id: string;
  deviceId: string;
  audience: string;
  createdAt: string;
  expiresAt: string;
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

/**
 * POST /auth/cms/login
 * Authenticates a CMS user (SUPPORT or SUPERADMIN) using email + password.
 * Does NOT require OTP.
 */
export async function cmsLogin(payload: CmsLoginPayload): Promise<CmsAuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/cms/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, deviceId: CMS_DEVICE_ID }),
  });

  const data: unknown = await response.json();

  if (!response.ok) {
    const msg =
      data && typeof data === 'object' && 'message' in data
        ? String((data as Record<string, unknown>).message)
        : 'Credenciales inválidas';
    throw new Error(msg);
  }

  return data as CmsAuthResponse;
}

/**
 * GET /auth/me
 * Returns the profile of the currently authenticated CMS user.
 */
export async function cmsGetMe(accessToken: string): Promise<CmsUserProfile> {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const data: unknown = await response.json();

  if (!response.ok) {
    const msg =
      data && typeof data === 'object' && 'message' in data
        ? String((data as Record<string, unknown>).message)
        : 'No se pudo obtener el perfil';
    throw new Error(msg);
  }

  return data as CmsUserProfile;
}

/**
 * GET /auth/sessions
 * Lists all active sessions for the authenticated user.
 */
export async function cmsListSessions(accessToken: string): Promise<CmsSession[]> {
  const response = await fetch(`${API_BASE_URL}/auth/sessions`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const data: unknown = await response.json();

  if (!response.ok) {
    const msg =
      data && typeof data === 'object' && 'message' in data
        ? String((data as Record<string, unknown>).message)
        : 'No se pudieron obtener las sesiones';
    throw new Error(msg);
  }

  return Array.isArray(data) ? (data as CmsSession[]) : [];
}

/**
 * DELETE /auth/sessions/:id
 * Revokes a specific session by ID.
 */
export async function cmsRevokeSession(
  accessToken: string,
  sessionId: string,
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/auth/sessions/${sessionId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const data: unknown = await response.json().catch(() => null);
    const msg =
      data && typeof data === 'object' && 'message' in data
        ? String((data as Record<string, unknown>).message)
        : 'No se pudo revocar la sesión';
    throw new Error(msg);
  }
}

/**
 * POST /auth/logout
 * Logs out the current CMS session.
 */
export async function cmsLogout(accessToken: string): Promise<void> {
  await fetch(`${API_BASE_URL}/auth/logout`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  }).catch(() => {
    // Ignore network errors — always clear local state
  });
}

// ---------------------------------------------------------------------------
// Token Refresh
// ---------------------------------------------------------------------------

/**
 * POST /auth/refresh
 * Exchanges a valid refresh token for a new access + refresh token pair.
 * Ported from the standalone cms/ app (Next.js HTTP-only cookie flow).
 */
export async function cmsRefreshToken(refreshToken: string): Promise<CmsAuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  const data: unknown = await response.json();

  if (!response.ok) {
    const msg =
      data && typeof data === 'object' && 'message' in data
        ? String((data as Record<string, unknown>).message)
        : 'No se pudo renovar la sesión';
    throw new Error(msg);
  }

  return data as CmsAuthResponse;
}

// ---------------------------------------------------------------------------
// First Access & Account Activation (ported from standalone cms/)
// ---------------------------------------------------------------------------

/**
 * POST /auth/cms/first-access
 * Sets the initial password for a newly created admin account.
 * Called when an admin clicks the first-access link from their email.
 */
export async function cmsFirstAccess(payload: {
  token: string;
  password: string;
}): Promise<CmsAuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/cms/first-access`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, deviceId: CMS_DEVICE_ID }),
  });

  const data: unknown = await response.json();

  if (!response.ok) {
    const msg =
      data && typeof data === 'object' && 'message' in data
        ? String((data as Record<string, unknown>).message)
        : 'No se pudo completar el primer acceso';
    throw new Error(msg);
  }

  return data as CmsAuthResponse;
}

/**
 * POST /auth/validate-activation-code
 * Validates the activation code before allowing the user to set their password.
 */
export async function cmsValidateActivationCode(payload: {
  email: string;
  code: string;
}): Promise<{ valid: boolean }> {
  const response = await fetch(`${API_BASE_URL}/auth/validate-activation-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data: unknown = await response.json();

  if (!response.ok) {
    const msg =
      data && typeof data === 'object' && 'message' in data
        ? String((data as Record<string, unknown>).message)
        : 'Código de activación inválido';
    throw new Error(msg);
  }

  return data as { valid: boolean };
}

/**
 * POST /auth/activate-account
 * Completes account activation: sets password after code validation.
 */
export async function cmsActivateAccount(payload: {
  email: string;
  code: string;
  password: string;
}): Promise<CmsAuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/activate-account`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, deviceId: CMS_DEVICE_ID }),
  });

  const data: unknown = await response.json();

  if (!response.ok) {
    const msg =
      data && typeof data === 'object' && 'message' in data
        ? String((data as Record<string, unknown>).message)
        : 'No se pudo activar la cuenta';
    throw new Error(msg);
  }

  return data as CmsAuthResponse;
}

// ---------------------------------------------------------------------------
// Password Recovery
// ---------------------------------------------------------------------------

/**
 * POST /auth/cms/send-recovery-code
 * Sends a recovery code to a CMS internal user's email.
 * Only works for SUPERADMIN/SOPORTE roles — rejects external users.
 */
export async function cmsSendRecoveryCode(email: string): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE_URL}/auth/cms/send-recovery-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  const data: unknown = await response.json();

  if (!response.ok) {
    const msg =
      data && typeof data === 'object' && 'message' in data
        ? String((data as Record<string, unknown>).message)
        : 'No se pudo enviar el código de recuperación';
    throw new Error(msg);
  }

  return data as { message: string };
}

/**
 * POST /auth/app/reset-with-code
 * Validates the recovery code and sets a new password.
 */
export async function cmsResetWithCode(
  email: string,
  code: string,
  newPassword: string,
  confirmPassword: string,
): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE_URL}/auth/app/reset-with-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code, newPassword, confirmPassword }),
  });

  const data: unknown = await response.json();

  if (!response.ok) {
    const msg =
      data && typeof data === 'object' && 'message' in data
        ? String((data as Record<string, unknown>).message)
        : 'No se pudo restablecer la contraseña';
    throw new Error(msg);
  }

  return data as { message: string };
}

// ---------------------------------------------------------------------------
// Forced Password Change
// ---------------------------------------------------------------------------

/**
 * POST /auth/change-password
 * Changes the current user's password. Requires the current password.
 * On success, all active sessions are revoked by the backend.
 */
export async function cmsChangePassword(
  accessToken: string,
  currentPassword: string,
  newPassword: string,
): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ currentPassword, newPassword }),
  });

  const data: unknown = await response.json();

  if (!response.ok) {
    const msg =
      data && typeof data === 'object' && 'message' in data
        ? String((data as Record<string, unknown>).message)
        : 'No se pudo cambiar la contraseña';
    throw new Error(msg);
  }

  return data as { message: string };
}
