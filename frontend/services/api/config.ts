/**
 * API configuration — single source of truth for the backend base URL.
 *
 * In production the frontend is served from the same server as the backend,
 * so we use a relative URL.  In development we fall back to localhost:3000.
 */
export const API_BASE_URL =
  typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? window.location.origin
    : 'http://localhost:3000';
