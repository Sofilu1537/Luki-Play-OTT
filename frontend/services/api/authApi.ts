/**
 * Separated HTTP layer for authentication endpoints.
 * Keeps network calls out of Zustand stores and UI components.
 */

const API_BASE_URL = 'http://localhost:3000';

export interface LoginChallengeResponse {
  otpRequired: boolean;
  loginToken: string;
  message: string;
  canAccessOtt: boolean;
  restrictionMessage: string | null;
}

export interface AuthTokensResponse {
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

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || `HTTP ${res.status}`);
  }
  return data as T;
}

export const authApi = {
  /** Phase 1: validate credentials and send OTP */
  appLogin(contractNumber: string, password: string, deviceId: string) {
    return fetch(`${API_BASE_URL}/auth/app/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contractNumber, password, deviceId }),
    }).then((res) => handleResponse<LoginChallengeResponse>(res));
  },

  /** Phase 2: verify OTP and receive tokens */
  verifyOtp(loginToken: string, code: string) {
    return fetch(`${API_BASE_URL}/auth/app/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loginToken, code }),
    }).then((res) => handleResponse<AuthTokensResponse>(res));
  },

  /** Refresh access token */
  refresh(refreshToken: string) {
    return fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    }).then((res) => handleResponse<AuthTokensResponse>(res));
  },

  /** Logout and revoke session */
  logout(accessToken: string, refreshToken: string) {
    return fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ refreshToken }),
    }).then((res) => handleResponse<{ message: string }>(res));
  },

  /** Get current user profile */
  me(accessToken: string) {
    return fetch(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    }).then((res) => handleResponse<UserProfileResponse>(res));
  },
};
