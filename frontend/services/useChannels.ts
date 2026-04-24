/**
 * useChannels — Singleton live channel store for Luki-CMS OTT
 *
 * Fetches from GET /public/canales on the CMS backend (port 3000).
 * Module-level cache ensures the request runs only once, regardless of
 * how many components subscribe. Falls back to static channels when the
 * backend has no channels configured yet.
 *
 * Port alignment: CMS backend runs on localhost:3000 (not 8100 as in the
 * standalone Luki-Play-Player). This hook is the CMS-specific adaptation.
 */
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { Channel, STATIC_CHANNELS, getCurrentProgram, getProgressPercent } from './channelTypes';
import { API_BASE_URL, resolveLogoUrl } from './api/config';

export type { Channel };
export { getCurrentProgram, getProgressPercent };

// ─────────────────────────────────────────────
// Backend shape from GET /public/canales
// ─────────────────────────────────────────────
interface BackendCanal {
  id: string;
  nombre: string;
  logo?: string;
  streamUrl: string;
  categoria?: string;
  tipo?: string;
  detalle?: string;
}

// Use unified config
const BACKEND_BASE = API_BASE_URL;

// ─────────────────────────────────────────────
// Favorites persistence (web: localStorage, native: in-memory only)
// ─────────────────────────────────────────────
const FAV_KEY = 'luki_channel_favs';

function loadStoredFavs(): Set<string> {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(FAV_KEY);
      return new Set(raw ? (JSON.parse(raw) as string[]) : []);
    }
  } catch {}
  return new Set();
}

function saveFavs(ids: string[]) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(FAV_KEY, JSON.stringify(ids));
    }
  } catch {}
}

function toChannel(c: BackendCanal, index: number, prevFavs: Set<string>): Channel {
  return {
    id: c.id,
    number: index + 1,
    name: c.nombre,
    logo: resolveLogoUrl(c.logo) || '📺',
    streamUrl: c.streamUrl,
    category: c.categoria || 'General',
    isFavorite: prevFavs.has(c.id),
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
    const res = await fetch(`${BACKEND_BASE}/public/canales`, {
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: BackendCanal[] = await res.json();
    // Merge in-memory favs + persisted favs so neither is lost
    const inMemoryFavs = new Set(_store.channels.filter(ch => ch.isFavorite).map(ch => ch.id));
    const storedFavs = loadStoredFavs();
    const oldFavs = new Set([...inMemoryFavs, ...storedFavs]);

    if (data.length > 0) {
      _store = {
        channels: data.map((c, idx) => toChannel(c, idx, oldFavs)),
        loading: false,
        error: null,
        isFromBackend: true,
      };
    } else {
      // Backend has no channels yet — use static fallback
      _store = {
        channels: STATIC_CHANNELS.map(ch => ({ ...ch, isFavorite: oldFavs.has(ch.id) })),
        loading: false,
        error: null,
        isFromBackend: false,
      };
    }
  } catch (error) {
    console.error("fetchChannels failed:", error);
    const storedFavs = loadStoredFavs();
    _store = {
      channels: STATIC_CHANNELS.map(ch => ({ ...ch, isFavorite: storedFavs.has(ch.id) })),
      loading: false,
      error: 'No se pudo conectar al servidor. Mostrando canales demo.',
      isFromBackend: false,
    };
  }
  notify();
}

// Start fetch immediately on module load (only once)
fetchChannels();

// ─────────────────────────────────────────────
// React hook — subscribes to singleton
// ─────────────────────────────────────────────
export function useChannels() {
  const [state, setState] = useState<StoreState>(() => _store);

  useEffect(() => {
    // Subscribe to future updates
    const listener = () => setState({ ..._store });
    _listeners.add(listener);

    // In case fetch completed before this component mounted
    if (!_store.loading) setState({ ..._store });

    return () => { _listeners.delete(listener); };
  }, []);

  const setChannels = (channels: Channel[]) => {
    _store = { ..._store, channels };
    saveFavs(channels.filter(c => c.isFavorite).map(c => c.id));
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
