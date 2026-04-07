/**
 * channelStore — Single source of truth for CMS channels.
 *
 * Architecture:
 *  - Channels start completely EMPTY on a fresh install.
 *  - Each channel stores BOTH categoryId (relational FK) AND categoria (denormalized name).
 *  - categoriasStore calls updateCategoryName / deassignCategory on category events.
 *  - All views (canales, monitor) subscribe here — no API polling required.
 *  - Designed to migrate to a real DB without breaking the contract:
 *    just swap the persist() stub for an API call.
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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ChannelState {
  channels: AdminCanal[];
  /** Sync from API response (no-op if empty — preserves local state). */
  syncFromApi: (data: AdminCanal[]) => void;
  createChannel: (payload: AdminCanalPayload) => AdminCanal;
  updateChannel: (id: string, patch: Partial<AdminCanalPayload>) => void;
  toggleChannelStatus: (id: string) => void;
  deleteChannel: (id: string) => void;
  /**
   * Called by categoriasStore when a category's name changes.
   * Updates the denormalized `categoria` field on all affected channels.
   */
  updateCategoryName: (categoryId: string, newName: string) => void;
  /**
   * Called by categoriasStore when a category is deleted.
   * Sets categoryId = '' and categoria = 'Sin categoría' on affected channels.
   */
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
      logo: payload.logo?.trim() ?? '',
      streamUrl: payload.streamUrl?.trim() ?? '',
      detalle: payload.detalle?.trim() ?? '',
      categoryId: payload.categoryId.trim(),
      categoria: payload.categoria?.trim() || 'General',
      tipo: 'live',
      requiereControlParental: payload.requiereControlParental ?? false,
      activo: payload.activo ?? true,
      creadoEn: now,
      actualizadoEn: now,
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
            detalle: patch.detalle?.trim() ?? c.detalle,
            categoryId: patch.categoryId?.trim() || c.categoryId,
            categoria: patch.categoria?.trim() || c.categoria,
            actualizadoEn: new Date().toISOString(),
          }
        : c,
    );
    set({ channels: persist(next) });
  },

  toggleChannelStatus(id) {
    const next = get().channels.map((c) =>
      c.id === id ? { ...c, activo: !c.activo, actualizadoEn: new Date().toISOString() } : c,
    );
    set({ channels: persist(next) });
  },

  deleteChannel(id) {
    set({ channels: persist(get().channels.filter((c) => c.id !== id)) });
  },

  updateCategoryName(categoryId, newName) {
    const next = get().channels.map((c) =>
      c.categoryId === categoryId
        ? { ...c, categoria: newName, actualizadoEn: new Date().toISOString() }
        : c,
    );
    set({ channels: persist(next) });
  },

  deassignCategory(categoryId) {
    const next = get().channels.map((c) =>
      c.categoryId === categoryId
        ? { ...c, categoryId: '', categoria: 'Sin categoría', actualizadoEn: new Date().toISOString() }
        : c,
    );
    set({ channels: persist(next) });
  },
}));
