import { API_BASE_URL } from './api/config';

const BASE = `${API_BASE_URL}/api/favorites`;

function headers(token: string) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

/** Returns a fresh access token, refreshing if the current one is expired. */
async function getValidToken(token: string): Promise<string> {
  try {
    const [, payload] = token.split('.');
    const { exp } = JSON.parse(atob(payload)) as { exp?: number };
    if (exp && exp * 1000 < Date.now() + 30_000) {
      const { useAuthStore } = await import('./authStore');
      const ok = await useAuthStore.getState().refreshSession();
      if (ok) return useAuthStore.getState().accessToken ?? token;
    }
  } catch { /* use original token */ }
  return token;
}

/**
 * Returns the list of favorite channel IDs for the given device+profile.
 * Returns null (not []) on any network or HTTP error so callers can
 * distinguish "server returned empty list" from "request failed".
 */
export async function fetchFavorites(
  token: string,
  deviceId: string,
  profileId = '__default__',
): Promise<string[] | null> {
  try {
    const t = await getValidToken(token);
    const params = new URLSearchParams({ deviceId, profileId });
    const res = await fetch(`${BASE}?${params}`, { headers: headers(t) });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function addFavorite(
  token: string,
  channelId: string,
  deviceId: string,
  profileId = '__default__',
): Promise<void> {
  try {
    const t = await getValidToken(token);
    await fetch(`${BASE}/${channelId}`, {
      method: 'POST',
      headers: headers(t),
      body: JSON.stringify({ deviceId, profileId }),
    });
  } catch {}
}

export async function removeFavorite(
  token: string,
  channelId: string,
  deviceId: string,
  profileId = '__default__',
): Promise<void> {
  try {
    const t = await getValidToken(token);
    const params = new URLSearchParams({ deviceId, profileId });
    await fetch(`${BASE}/${channelId}?${params}`, {
      method: 'DELETE',
      headers: headers(t),
    });
  } catch {}
}
