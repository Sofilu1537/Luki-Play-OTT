/**
 * channelStore — Single source of truth for CMS channels.
 *
 * Strategy:
 *  - localStorage is used as a fast startup cache (shows data instantly on load)
 *  - The backend (Prisma/PostgreSQL) is the authoritative source of truth
 *  - On mount: loadChannels() fetches from API and overwrites the cache
 *  - On mutations: API call first → on success, update store + cache
 *  - On API failure: error is thrown to the caller for UI feedback
 */
import { create } from 'zustand';
import {
  adminListCanales,
  adminCreateCanal,
  adminUpdateCanal,
  adminToggleCanal,
  adminDeleteCanal,
} from './api/adminApi';
import type { AdminCanal, AdminCanalPayload } from './api/adminApi';

export const CHANNEL_STORAGE_KEY = 'luki_channels';

// ---------------------------------------------------------------------------
// Storage helpers
// ---------------------------------------------------------------------------

function load(): AdminCanal[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CHANNEL_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as AdminCanal[]) : [];
  } catch {
    return [];
  }
}

function persist(list: AdminCanal[]): AdminCanal[] {
  if (typeof window !== 'undefined') {
    try { localStorage.setItem(CHANNEL_STORAGE_KEY, JSON.stringify(list)); } catch { /* quota */ }
  }
  return list;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ChannelState {
  channels: AdminCanal[];
  isLoading: boolean;

  // ── API-backed actions (persist to PostgreSQL via NestJS) ──────────────
  loadChannels: (accessToken: string) => Promise<void>;
  createChannelApi: (accessToken: string, payload: AdminCanalPayload) => Promise<AdminCanal>;
  updateChannelApi: (accessToken: string, id: string, patch: Partial<AdminCanalPayload>) => Promise<void>;
  deleteChannelApi: (accessToken: string, id: string) => Promise<void>;
  toggleChannelStatusApi: (accessToken: string, id: string) => Promise<void>;

  // ── Sync helper (used by categoriasStore cascade) ──────────────────────
  syncFromApi: (data: AdminCanal[]) => void;

  // ── Category cascade helpers (called from categoriasStore) ────────────
  updateCategoryName: (categoryId: string, newName: string) => void;
  deassignCategory: (categoryId: string) => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useChannelStore = create<ChannelState>((set, get) => ({
  channels: load(),
  isLoading: false,

  // ── Load all channels from the backend and refresh the local cache ──────
  async loadChannels(accessToken) {
    set({ isLoading: true });
    try {
      const data = await adminListCanales(accessToken);
      if (Array.isArray(data) && data.length > 0) {
        set({ channels: persist(data) });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  // ── Create a channel in the DB; replace the local cache entry on success ─
  async createChannelApi(accessToken, payload) {
    const record = await adminCreateCanal(accessToken, payload);
    set({ channels: persist([record, ...get().channels]) });
    return record;
  },

  // ── Update a channel in the DB; merge the response into local cache ──────
  async updateChannelApi(accessToken, id, patch) {
    const updated = await adminUpdateCanal(accessToken, id, patch);
    const next = get().channels.map((c) => (c.id === id ? updated : c));
    set({ channels: persist(next) });
  },

  // ── Delete a channel (soft-delete on the DB); remove from local cache ───
  async deleteChannelApi(accessToken, id) {
    await adminDeleteCanal(accessToken, id);
    set({ channels: persist(get().channels.filter((c) => c.id !== id)) });
  },

  // ── Toggle channel status in the DB; update local cache with response ───
  async toggleChannelStatusApi(accessToken, id) {
    const updated = await adminToggleCanal(accessToken, id);
    const next = get().channels.map((c) => (c.id === id ? updated : c));
    set({ channels: persist(next) });
  },

  // ── Sync helper (overwrites cache from an external data source) ──────────
  syncFromApi(data) {
    if (!Array.isArray(data) || data.length === 0) return;
    set({ channels: persist(data) });
  },

  // ── Cascade: called by categoriasStore when a category is renamed ────────
  updateCategoryName(categoryId, newName) {
    const next = get().channels.map((c) =>
      c.categoryId === categoryId
        ? { ...c, category: c.category ? { ...c.category, nombre: newName } : c.category, updatedAt: new Date().toISOString() }
        : c,
    );
    set({ channels: persist(next) });
  },

  // ── Cascade: called by categoriasStore when a category is deleted ─────────
  deassignCategory(categoryId) {
    const next = get().channels.map((c) =>
      c.categoryId === categoryId
        ? { ...c, categoryId: '', updatedAt: new Date().toISOString() }
        : c,
    );
    set({ channels: persist(next) });
  },
}));
