/**
 * authApi — HTTP client for the Luki Play authentication service.
 *
 * Contract-based auth flow (no OTP):
 *   1. first-access: verify contract + cédula → needsPasswordSetup
 *   2. activate: set password → JWT tokens
 *   3. contract-login: contract + password → JWT tokens
 *   4. reset-password: contract + cédula + new password
 */

const API_BASE_URL = 'http://localhost:3000';

// ─── Request types ───────────────────────────────────────

export interface ContractLoginRequest {
  contractNumber: string;
  password: string;
  deviceId: string;
}

export interface FirstAccessRequest {
  idNumber: string;
}

export interface ActivateRequest {
  customerId: string;
  otpCode: string;
  password: string;
  email?: string;
}

export interface SwitchContractRequest {
  contractId: string;
}

export interface ContractResetPasswordRequest {
  contractNumber: string;
  idNumber: string;
  newPassword: string;
}

// ─── Response types ──────────────────────────────────────

export interface AuthTokensResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    plan: string;
  };
}

export interface FirstAccessResponse {
  customerId: string;
  nombre: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  canAccessOtt: boolean;
  restrictionMessage: string | null;
}

export interface UserProfileResponse {
  id: string;
  contractNumber: string | null;
  email: string;
  role: string;
  status: string;
  accountId: string | null;
  contractType: string | null;
  serviceStatus: string | null;
  canAccessOtt: boolean;
  restrictionMessage: string | null;
  permissions: string[];
  entitlements: string[];
}

// ─── API functions ───────────────────────────────────────

/** Login with contract number + password → JWT tokens (no OTP). */
export async function contractLogin(req: ContractLoginRequest): Promise<AuthTokensResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/app/contract-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Credenciales inválidas');
  }
  return data as AuthTokensResponse;
}

/** First access: find account by cédula and send OTP to registered email. */
export async function firstAccess(req: FirstAccessRequest): Promise<FirstAccessResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/app/first-access`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'No se pudo verificar el contrato');
  }
  return data as FirstAccessResponse;
}

/** Activate account: set password (and optional email) → JWT tokens. */
export async function activate(req: ActivateRequest): Promise<AuthTokensResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/app/activate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'No se pudo activar la cuenta');
  }
  return data as AuthTokensResponse;
}

/** Switch to a different contract (requires auth). */
export async function switchContract(accessToken: string, req: SwitchContractRequest): Promise<AuthTokensResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/app/switch-contract`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(req),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'No se pudo cambiar el contrato');
  }
  return data as AuthTokensResponse;
}

/** Reset password via contract + cédula verification. */
export async function resetPassword(req: ContractResetPasswordRequest): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE_URL}/auth/app/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'No se pudo restablecer la contraseña');
  }
  return data as { message: string };
}

/** Rotates the refresh token and returns a new token pair. */
export async function refreshTokens(refreshToken: string): Promise<RefreshTokenResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Sesión expirada');
  }
  return data as RefreshTokenResponse;
}

/** Revokes the current session on the backend. */
export async function logout(accessToken: string, refreshToken: string): Promise<void> {
  await fetch(`${API_BASE_URL}/auth/logout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ refreshToken }),
  });
}

/** Returns the current user's profile, account, and OTT access flags. */
export async function getMe(accessToken: string): Promise<UserProfileResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'No autenticado');
  }
  return data as UserProfileResponse;
}

/** Login with cédula de identidad + password → JWT tokens. */
export async function idNumberLogin(req: { idNumber: string; password: string; deviceId: string }): Promise<AuthTokensResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/app/id-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Credenciales inválidas');
  }
  return data as AuthTokensResponse;
}

/** Request OTP for password recovery via cédula. Anti-enumeration: always 200. */
export async function requestPasswordResetOtp(idNumber: string): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE_URL}/auth/app/request-password-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idNumber }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Error al solicitar el código');
  }
  return data as { message: string };
}

/** Reset password using OTP code + cédula. */
export async function resetPasswordWithOtp(req: { idNumber: string; otpCode: string; newPassword: string }): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE_URL}/auth/app/reset-with-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'No se pudo restablecer la contraseña');
  }
  return data as { message: string };
}
