import { API_BASE_URL } from './api/config';

const BASE = `${API_BASE_URL}/favorites`;

function headers(token: string) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
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
    const params = new URLSearchParams({ deviceId, profileId });
    const res = await fetch(`${BASE}?${params}`, { headers: headers(token) });
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
    await fetch(`${BASE}/${channelId}`, {
      method: 'POST',
      headers: headers(token),
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
    const params = new URLSearchParams({ deviceId, profileId });
    await fetch(`${BASE}/${channelId}?${params}`, {
      method: 'DELETE',
      headers: headers(token),
    });
  } catch {}
}
