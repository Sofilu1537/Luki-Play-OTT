/**
 * useChannels — Singleton live channel store for Luki-CMS OTT
 *
 * Fetches from GET /public/canales on the CMS backend.
 * Favorites are persisted per-device per-profile via the /favorites API.
 * Module-level cache ensures the request runs only once per session.
 */
import { useEffect, useState } from 'react';
import { Channel, getCurrentProgram, getProgressPercent } from './channelTypes';
import { API_BASE_URL } from './api/config';
import { fetchFavorites, addFavorite, removeFavorite } from './favoritesApi';

export type { Channel };
export { getCurrentProgram, getProgressPercent };

// ─────────────────────────────────────────────
// Backend shape from GET /public/canales
// ─────────────────────────────────────────────
interface BackendCanal {
  id: string;
  nombre: string;
  logo?: string;
  categoria?: string;
  tipo?: string;
  detalle?: string;
}

const BACKEND_BASE = API_BASE_URL;

function toChannel(c: BackendCanal, index: number, favSet: Set<string>): Channel {
  return {
    id: c.id,
    number: index + 1,
    name: c.nombre,
    logo: c.logo || '📺',
    streamUrl: '',          // fetched on demand via fetchStreamUrl()
    category: c.categoria || 'General',
    isFavorite: favSet.has(c.id),
    epg: [],
  };
}

// ─────────────────────────────────────────────
// Module-level singleton cache
// ─────────────────────────────────────────────
type StoreState = {
  channels: Channel[];
  loading: boolean;
  error: string | null;
  isFromBackend: boolean;
};

let _store: StoreState = {
  channels: [],
  loading: true,
  error: null,
  isFromBackend: false,
};
let _fetched = false;
const _listeners = new Set<() => void>();

function notify() {
  _listeners.forEach((fn) => fn());
}

async function fetchChannels() {
  if (_fetched) return;
  _fetched = true;
  try {
    // Load channels and favorites concurrently
    const channelsPromise = fetch(`${BACKEND_BASE}/public/canales`, {
      headers: { 'Content-Type': 'application/json' },
    });

    // Lazy-import authStore to avoid circular deps at module load time
    const { useAuthStore, DEV_DEVICE_ID } = await import('./authStore');
    const { accessToken } = useAuthStore.getState();

    const [res, favIds] = await Promise.all([
      channelsPromise,
      accessToken
        ? fetchFavorites(accessToken, DEV_DEVICE_ID)
        : Promise.resolve(null),   // null = no token, preserve existing state
    ]);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: BackendCanal[] = await res.json();

    // If no token: keep current isFavorite flags instead of resetting to false
    const inMemoryFavs = new Set(_store.channels.filter(c => c.isFavorite).map(c => c.id));
    const favSet = favIds !== null ? new Set(favIds) : inMemoryFavs;

    if (data.length > 0) {
      _store = {
        channels: data.map((c, idx) => toChannel(c, idx, favSet)),
        loading: false,
        error: null,
        isFromBackend: true,
      };
    } else {
      _store = { channels: [], loading: false, error: null, isFromBackend: false };
    }
  } catch {
    _store = { channels: [], loading: false, error: 'No se pudo conectar al servidor.', isFromBackend: false };
  }
  notify();
}

// Start fetch immediately on module load (only once)
fetchChannels();

// Re-fetch channels (with favorites) when the user logs in mid-session
import('./authStore').then(({ useAuthStore }) => {
  let prevToken: string | null = null;
  useAuthStore.subscribe((state) => {
    const token = state.accessToken;
    if (token && token !== prevToken) {
      // Token became available — reload to hydrate favorites from API
      prevToken = token;
      _fetched = false;
      fetchChannels();
    }
  });
});

// ─────────────────────────────────────────────
// Toggle favorite with API persistence
// ─────────────────────────────────────────────
export async function toggleFavorite(
  channelId: string,
  nowFavorite: boolean,
  token: string,
  deviceId: string,
  profileId = '__default__',
): Promise<void> {
  // Optimistic UI update
  _store = {
    ..._store,
    channels: _store.channels.map((ch) =>
      ch.id === channelId ? { ...ch, isFavorite: nowFavorite } : ch,
    ),
  };
  notify();

  // Persist to backend
  if (nowFavorite) {
    await addFavorite(token, channelId, deviceId, profileId);
  } else {
    await removeFavorite(token, channelId, deviceId, profileId);
  }

  // Sync from server — only apply if request succeeded (null = network/API error → keep optimistic state)
  const freshIds = await fetchFavorites(token, deviceId, profileId);
  if (freshIds !== null) {
    const freshSet = new Set(freshIds);
    _store = {
      ..._store,
      channels: _store.channels.map((ch) => ({ ...ch, isFavorite: freshSet.has(ch.id) })),
    };
    notify();
  }
}

// ─────────────────────────────────────────────
// React hook — subscribes to singleton
// ─────────────────────────────────────────────
export function useChannels() {
  const [state, setState] = useState<StoreState>(() => _store);

  useEffect(() => {
    const listener = () => setState({ ..._store });
    _listeners.add(listener);
    if (!_store.loading) setState({ ..._store });
    return () => { _listeners.delete(listener); };
  }, []);

  const setChannels = (channels: Channel[]) => {
    _store = { ..._store, channels };  // always use latest _store, never stale closure
    notify();
  };

  const reload = (silent = false) => {
    _fetched = false;
    if (!silent) {
      _store = { channels: [], loading: true, error: null, isFromBackend: false };
      notify();
    }
    fetchChannels();
  };

  return { ...state, setChannels, reload };
}

/**
 * Fetches the stream URL for a channel from the authenticated endpoint.
 * Returns null if the request fails (expired token, network error, etc).
 */
export async function fetchStreamUrl(channelId: string, token: string): Promise<string | null> {
  try {
    const res = await fetch(`${BACKEND_BASE}/public/canales/${channelId}/stream`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.streamUrl ?? null;
  } catch {
    return null;
  }
}
