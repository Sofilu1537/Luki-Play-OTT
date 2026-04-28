import { create } from 'zustand';
import { API_BASE_URL } from './api/config';
import type { PublicSlider } from './api/adminApi';

const CACHE_KEY = 'luki_sliders_cache';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

// ---------------------------------------------------------------------------
// Cache helpers
// ---------------------------------------------------------------------------

interface CacheEntry {
  data: PublicSlider[];
  fetchedAt: number;
}

function loadCache(): PublicSlider[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return [];
    const entry = JSON.parse(raw) as CacheEntry;
    if (Date.now() - entry.fetchedAt > CACHE_TTL_MS) return [];
    return Array.isArray(entry.data) ? entry.data : [];
  } catch {
    return [];
  }
}

function saveCache(data: PublicSlider[]) {
  if (typeof window === 'undefined') return;
  try {
    const entry: CacheEntry = { data, fetchedAt: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch { /* quota */ }
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export interface SliderState {
  sliders: PublicSlider[];
  loading: boolean;
  error: string | null;
  fetchSliders: (planId?: string) => Promise<void>;
  invalidateCache: () => void;
}

export const useSliderStore = create<SliderState>((set, get) => ({
  sliders: loadCache(),
  loading: false,
  error: null,

  fetchSliders: async (planId?: string) => {
    if (get().loading) return;
    set({ loading: true, error: null });
    try {
      const url = planId
        ? `${API_BASE_URL}/public/sliders?planId=${encodeURIComponent(planId)}`
        : `${API_BASE_URL}/public/sliders`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: PublicSlider[] = await res.json();
      saveCache(data);
      set({ sliders: data, loading: false });
    } catch (e: any) {
      // Mantener datos del cache si el fetch falla — no romper el UI
      set({ loading: false, error: e?.message ?? 'Error al cargar banners' });
    }
  },

  invalidateCache: () => {
    if (typeof window !== 'undefined') localStorage.removeItem(CACHE_KEY);
    set({ sliders: [] });
  },
}));
