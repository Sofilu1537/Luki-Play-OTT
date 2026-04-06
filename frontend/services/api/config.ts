/**
 * API configuration — single source of truth for the backend base URL.
 *
 * Resolution order:
 * - `EXPO_PUBLIC_API_BASE_URL` when explicitly configured.
 * - Production web: same origin, assuming nginx proxies `/auth`, `/admin`, `/public`.
 * - Development web/native: same hostname as the current browser/device, backend on port 3000.
 */
const explicitApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();

export const API_BASE_URL = (() => {
  if (explicitApiBaseUrl) return explicitApiBaseUrl;

  if (typeof window === 'undefined') {
    return 'http://localhost:3000';
  }

  if (process.env.NODE_ENV === 'production') {
    return `${window.location.protocol}//${window.location.host}`;
  }

  return `${window.location.protocol}//${window.location.hostname}:3000`;
})();
