/**
 * useChannels — Singleton channel store
 *
 * Both HomeScreen and LivePlayerScreen share the SAME fetched data.
 * The fetch runs only once (module-level cache). Re-renders never
 * trigger a second request, and LivePlayerScreen never starts with
 * channels = [] which was causing the white-crash on Firefox.
 */
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { Channel, CHANNELS as STATIC_FALLBACK } from '../data/channels';

export type { Channel };

// ─────────────────────────────────────────────
// Backend shape from GET /public/canales
// ─────────────────────────────────────────────
interface BackendCanal {
  id: string;
  number?: number;
  nombre: string;
  logo?: string;
  streamUrl: string;
  categoria?: string;
  tipo?: string;
  detalle?: string;
}

const BACKEND_BASE =
  Platform.OS === 'web' ? 'http://localhost:8100' : 'http://127.0.0.1:8100';

// Convert backend canal → Player Channel
function toChannel(c: BackendCanal, index: number): Channel {
  return {
    id: c.id,
    number: c.number ?? index + 1,
    name: c.nombre,
    logo: c.logo || '📺',
    streamUrl: c.streamUrl,
    category: c.categoria || 'General',
    isFavorite: false,
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

function notify() { _listeners.forEach(fn => fn()); }

async function fetchChannels() {
  if (_fetched) return;
  _fetched = true;
  try {
    const res = await fetch(`${BACKEND_BASE}/public/canales`, {
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: BackendCanal[] = await res.json();
    if (data.length > 0) {
      _store = { channels: data.map(toChannel), loading: false, error: null, isFromBackend: true };
    } else {
      _store = {
        channels: [],
        loading: false,
        error: 'No hay canales activos en el CMS. Agrega uno en localhost:3001/canales',
        isFromBackend: false,
      };
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error de conexión';
    _store = {
      channels: STATIC_FALLBACK.slice(0, 1),
      loading: false,
      error: `Backend no disponible: ${msg}`,
      isFromBackend: false,
    };
  }
  notify();
}

// Kick off the fetch immediately when the module loads
void fetchChannels();

// ─────────────────────────────────────────────
// Hook — subscribes to the singleton
// ─────────────────────────────────────────────
export function useChannels() {
  const [state, setState] = useState<StoreState>(_store);

  useEffect(() => {
    const update = () => setState({ ..._store });
    _listeners.add(update);
    // Sync in case the fetch already completed before this component mounted
    if (!_store.loading || _fetched) setState({ ..._store });
    return () => { _listeners.delete(update); };
  }, []);

  const setChannels = (channels: Channel[]) => {
    _store = { ..._store, channels };
    notify();
  };

  return {
    channels: state.channels,
    loading: state.loading,
    error: state.error,
    isFromBackend: state.isFromBackend,
    setChannels,
    reload: () => { _fetched = false; void fetchChannels(); },
  };
}

// Re-export helpers
export { getCurrentProgram, getProgressPercent } from '../data/channels';
