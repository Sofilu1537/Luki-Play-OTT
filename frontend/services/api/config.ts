/**
 * API configuration — single source of truth for the backend base URL.
 *
 * In production the frontend is served from the same server as the backend,
 * so we use the same origin (nginx proxies /auth/, /admin/, /public/ to backend).
 * In development we fall back to localhost:3000.
 */
export const API_BASE_URL =
  typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? `${window.location.protocol}//${window.location.host}`
    : 'http://localhost:3000';

/**
 * Controls whether API functions fall back to in-memory mock data when a
 * request fails. Enabled only in local development (localhost) so that mock
 * fallbacks never silently mask real backend errors in production.
 */
export const USE_MOCK_FALLBACK =
  typeof window !== 'undefined' && window.location.hostname === 'localhost';

/**
 * Resolves a channel logo URL to an absolute URL suitable for rendering.
 *
 * Handles three cases:
 *  - Already absolute (http/https) — returned as-is (legacy records uploaded before this fix)
 *  - Relative path (/uploads/logos/...) — prepended with API_BASE_URL
 *  - Empty/null — returns empty string
 */
export function resolveLogoUrl(logoUrl: string | null | undefined): string {
  if (!logoUrl) return '';
  if (logoUrl.startsWith('http://') || logoUrl.startsWith('https://')) return logoUrl;
  return `${API_BASE_URL}${logoUrl}`;
}
