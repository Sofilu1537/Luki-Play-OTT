import { create } from 'zustand';
import type { AdminCategoria } from './api/adminApi';
import {
  adminListCategorias,
  adminCreateCategoria,
  adminUpdateCategoria,
  adminToggleCategoria,
  adminDeleteCategoria,
  adminAssociateCategoriaChannels,
} from './api/adminApi';

interface CategoriasState {
  categorias: AdminCategoria[];
  isLoading: boolean;
  error: string | null;

  fetchFromApi: (accessToken: string) => Promise<void>;
  syncFromApi: (data: AdminCategoria[]) => void;
  add: (accessToken: string, payload: { nombre: string; descripcion?: string; icono?: string; accentColor?: string; displayOrder?: number; channelIds?: string[] }) => Promise<AdminCategoria>;
  update: (accessToken: string, id: string, patch: Partial<Omit<AdminCategoria, 'id'>>) => Promise<void>;
  toggle: (accessToken: string, id: string) => Promise<void>;
  remove: (accessToken: string, id: string) => Promise<void>;
  syncChannels: (accessToken: string, categoryId: string, channelIds: string[]) => Promise<void>;
  getActive: () => AdminCategoria[];
}

export const useCategoriasStore = create<CategoriasState>((set, get) => ({
  categorias: [],
  isLoading: false,
  error: null,

  async fetchFromApi(accessToken) {
    set({ isLoading: true, error: null });
    try {
      const data = await adminListCategorias(accessToken);
      set({ categorias: data, isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: err instanceof Error ? err.message : 'Error cargando categorías' });
    }
  },

  syncFromApi(data) {
    if (data.length === 0) return;
    set({ categorias: data });
  },

  async add(accessToken, payload) {
    const record = await adminCreateCategoria(accessToken, payload);
    set((s) => ({ categorias: [...s.categorias, record] }));
    return record;
  },

  async update(accessToken, id, patch) {
    const updated = await adminUpdateCategoria(accessToken, id, patch);
    set((s) => ({ categorias: s.categorias.map((c) => (c.id === id ? updated : c)) }));
  },

  async toggle(accessToken, id) {
    const updated = await adminToggleCategoria(accessToken, id);
    set((s) => ({ categorias: s.categorias.map((c) => (c.id === id ? updated : c)) }));
  },

  async remove(accessToken, id) {
    await adminDeleteCategoria(accessToken, id);
    set((s) => ({ categorias: s.categorias.filter((c) => c.id !== id) }));
  },

  async syncChannels(accessToken, categoryId, channelIds) {
    await adminAssociateCategoriaChannels(accessToken, categoryId, channelIds);
    // Refresh the category to get updated channel list
    const updated = await adminListCategorias(accessToken);
    set({ categorias: updated });
  },

  getActive() {
    return get().categorias.filter((c) => c.activo);
  },
}));

