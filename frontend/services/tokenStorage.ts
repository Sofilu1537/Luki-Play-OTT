/**
 * Secure cross-platform token storage for CMS authentication.
 *
 * - **Native (iOS/Android)**: uses `expo-secure-store` (encrypted, sandboxed).
 * - **Web**: access token kept only in Zustand memory; refresh token in
 *   `sessionStorage` (cleared when the tab closes — significant improvement
 *   over `localStorage` which persists indefinitely and is XSS-reachable).
 *
 * Ported from the standalone `cms/` Next.js app which used HTTP-only cookies.
 * Since Expo uses `output: "static"` we cannot set HTTP-only cookies directly,
 * so this is the best-effort secure alternative for client-side storage.
 */

import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACCESS_KEY = 'luki.cms.accessToken';
const REFRESH_KEY = 'luki.cms.refreshToken';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Persist tokens after a successful login or refresh.
 *
 * On **native** both tokens go into the encrypted keychain / keystore.
 * On **web** the refresh token goes into `sessionStorage`; the access
 * token is *not* persisted here — it lives only in Zustand memory.
 */
export async function saveTokens(
  accessToken: string,
  refreshToken: string | null,
): Promise<void> {
  if (Platform.OS === 'web') {
    // Access token: memory only (handled by Zustand, NOT stored here)
    // Refresh token: sessionStorage (cleared on tab close)
    if (typeof sessionStorage !== 'undefined') {
      if (refreshToken) {
        sessionStorage.setItem(REFRESH_KEY, refreshToken);
      } else {
        sessionStorage.removeItem(REFRESH_KEY);
      }
    }
    return;
  }

  // Native: encrypted storage
  await SecureStore.setItemAsync(ACCESS_KEY, accessToken);
  if (refreshToken) {
    await SecureStore.setItemAsync(REFRESH_KEY, refreshToken);
  } else {
    await SecureStore.deleteItemAsync(REFRESH_KEY);
  }
}

/**
 * Read the stored access token.
 *
 * On **web** returns `null` (access token is memory-only).
 * On **native** reads from encrypted storage for session restore.
 */
export async function getAccessToken(): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  return SecureStore.getItemAsync(ACCESS_KEY);
}

/**
 * Read the stored refresh token.
 *
 * On **web** reads from `sessionStorage`.
 * On **native** reads from encrypted storage.
 */
export async function getRefreshToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    if (typeof sessionStorage === 'undefined') return null;
    return sessionStorage.getItem(REFRESH_KEY);
  }
  return SecureStore.getItemAsync(REFRESH_KEY);
}

/**
 * Wipe all stored tokens (logout).
 */
export async function clearTokens(): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(REFRESH_KEY);
    }
    // Also clean up legacy localStorage keys left by the old implementation
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('luki.cms.accessToken');
      localStorage.removeItem('luki.cms.refreshToken');
    }
    return;
  }

  await SecureStore.deleteItemAsync(ACCESS_KEY);
  await SecureStore.deleteItemAsync(REFRESH_KEY);
}
