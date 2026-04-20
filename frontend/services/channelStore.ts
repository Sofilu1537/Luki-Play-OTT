/**
 * channelStore — Single source of truth for CMS channels.
 *
 * Syncs from the backend API (Prisma) and caches locally.
 * Optimistic updates: updates local state immediately, API persists in background.
 */
import { create } from 'zustand';
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

function genId() {
  return `ch-local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function autoSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ChannelState {
  channels: AdminCanal[];
  syncFromApi: (data: AdminCanal[]) => void;
  createChannel: (payload: AdminCanalPayload) => AdminCanal;
  updateChannel: (id: string, patch: Partial<AdminCanalPayload>) => void;
  toggleChannelStatus: (id: string) => void;
  deleteChannel: (id: string) => void;
  updateCategoryName: (categoryId: string, newName: string) => void;
  deassignCategory: (categoryId: string) => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useChannelStore = create<ChannelState>((set, get) => ({
  channels: load(),

  syncFromApi(data) {
    if (!Array.isArray(data) || data.length === 0) return;
    set({ channels: persist(data) });
  },

  createChannel(payload) {
    const current = get().channels;
    const nombre = payload.nombre.trim();
    if (!nombre) throw new Error('El nombre del canal es requerido.');
    const dup = current.find((c) => c.nombre.toLowerCase() === nombre.toLowerCase());
    if (dup) throw new Error(`Ya existe un canal con el nombre "${nombre}".`);
    if (!payload.categoryId?.trim()) throw new Error('Debes seleccionar una categoría para el canal.');
    const now = new Date().toISOString();
    const record: AdminCanal = {
      id: genId(),
      nombre,
      slug: payload.slug || autoSlug(nombre),
      streamUrl: payload.streamUrl?.trim() ?? '',
      backupUrl: payload.backupUrl?.trim(),
      logoUrl: payload.logoUrl?.trim(),
      categoryId: payload.categoryId.trim(),
      epgSourceId: payload.epgSourceId,
      status: payload.status ?? 'ACTIVE',
      isLive: false,
      healthStatus: 'OFFLINE',
      uptimePercent: 0,
      streamProtocol: payload.streamProtocol ?? 'HLS',
      resolution: payload.resolution ?? '1080p',
      bitrateKbps: payload.bitrateKbps ?? 5000,
      isDrmProtected: payload.isDrmProtected ?? false,
      geoRestriction: payload.geoRestriction,
      sortOrder: payload.sortOrder ?? 99,
      planIds: payload.planIds ?? [],
      requiereControlParental: payload.requiereControlParental ?? false,
      viewerCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    set({ channels: persist([record, ...current]) });
    return record;
  },

  updateChannel(id, patch) {
    const current = get().channels;
    if (patch.nombre !== undefined) {
      const nombre = patch.nombre.trim();
      const dup = current.find((c) => c.id !== id && c.nombre.toLowerCase() === nombre.toLowerCase());
      if (dup) throw new Error(`Ya existe un canal con el nombre "${nombre}".`);
    }
    const next = current.map((c) =>
      c.id === id
        ? {
            ...c,
            ...patch,
            nombre: patch.nombre?.trim() ?? c.nombre,
            streamUrl: patch.streamUrl?.trim() ?? c.streamUrl,
            categoryId: patch.categoryId?.trim() || c.categoryId,
            updatedAt: new Date().toISOString(),
          }
        : c,
    );
    set({ channels: persist(next) });
  },

  toggleChannelStatus(id) {
    const next = get().channels.map((c) =>
      c.id === id
        ? {
            ...c,
            status: c.status === 'ACTIVE' ? ('INACTIVE' as const) : ('ACTIVE' as const),
            updatedAt: new Date().toISOString(),
          }
        : c,
    );
    set({ channels: persist(next) });
  },

  deleteChannel(id) {
    set({ channels: persist(get().channels.filter((c) => c.id !== id)) });
  },

  updateCategoryName(categoryId, newName) {
    const next = get().channels.map((c) =>
      c.categoryId === categoryId
        ? { ...c, updatedAt: new Date().toISOString() }
        : c,
    );
    set({ channels: persist(next) });
  },

  deassignCategory(categoryId) {
    const next = get().channels.map((c) =>
      c.categoryId === categoryId
        ? { ...c, categoryId: '', updatedAt: new Date().toISOString() }
        : c,
    );
    set({ channels: persist(next) });
  },
}));
