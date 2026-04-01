/**
 * authApi — HTTP client for the Luki Play authentication service.
 *
 * Separates all network calls from store/UI logic.
 * Every function throws an {@link Error} with a user-readable message on failure.
 */

const API_BASE_URL = 'http://localhost:3000';

export interface AppLoginRequest {
  contractNumber: string;
  password: string;
  deviceId: string;
}

export interface AppLoginResponse {
  otpRequired: boolean;
  loginToken: string;
  message: string;
  canAccessOtt: boolean;
  restrictionMessage: string | null;
}

export interface VerifyOtpRequest {
  loginToken: string;
  code: string;
}

export interface VerifyOtpResponse {
  accessToken: string;
  refreshToken: string;
  canAccessOtt: boolean;
  restrictionMessage: string | null;
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

/** Phase 1 of app login: validates contractNumber + password, sends OTP. */
export async function appLogin(req: AppLoginRequest): Promise<AppLoginResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/app/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Credenciales inválidas');
  }
  return data as AppLoginResponse;
}

/** Phase 2 of app login: verifies OTP and issues JWT tokens. */
export async function verifyOtp(req: VerifyOtpRequest): Promise<VerifyOtpResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/app/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Código OTP inválido o expirado');
  }
  return data as VerifyOtpResponse;
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
  // Ignore backend errors — always clear local state regardless of outcome
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
