import { create } from 'zustand';
import type { AdminCategoria } from './api/adminApi';

const STORAGE_KEY = 'lukiplay_cms_categorias';

const SEED: AdminCategoria[] = [
  { id: 'cat-001', nombre: 'Noticias',  descripcion: 'Canales de noticias',   icono: 'newspaper-o', activo: true },
  { id: 'cat-002', nombre: 'Deportes',  descripcion: 'Fútbol y más',          icono: 'futbol-o',    activo: true },
  { id: 'cat-003', nombre: 'Cine',      descripcion: 'Películas y series',     icono: 'film',        activo: true },
  { id: 'cat-004', nombre: 'Infantil',  descripcion: 'Contenido para niños',   icono: 'child',       activo: true },
  { id: 'cat-005', nombre: 'Música',    descripcion: 'Canales de música',      icono: 'music',       activo: true },
  { id: 'cat-006', nombre: 'General',   descripcion: 'Contenido general',      icono: 'th-large',    activo: true },
];

function load(): AdminCategoria[] {
  if (typeof window === 'undefined') return SEED;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return save(SEED);
    const parsed = JSON.parse(raw) as AdminCategoria[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : save(SEED);
  } catch {
    return save(SEED);
  }
}

function save(list: AdminCategoria[]): AdminCategoria[] {
  if (typeof window !== 'undefined') {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch { /* quota */ }
  }
  return list;
}

function genId() {
  return `cat-local-${Math.random().toString(36).slice(2, 9)}`;
}

interface CategoriasState {
  categorias: AdminCategoria[];
  syncFromApi: (data: AdminCategoria[]) => void;
  add: (payload: { nombre: string; descripcion?: string; icono?: string }) => AdminCategoria;
  update: (id: string, patch: Partial<Omit<AdminCategoria, 'id'>>) => void;
  toggle: (id: string) => void;
  remove: (id: string) => void;
  getActive: () => AdminCategoria[];
}

export const useCategoriasStore = create<CategoriasState>((set, get) => ({
  categorias: load(),

  syncFromApi(data) {
    if (data.length === 0) return;
    set({ categorias: save(data) });
  },

  add(payload) {
    const current = get().categorias;
    const nombre = payload.nombre.trim();
    if (!nombre) throw new Error('El nombre de la categoría es requerido.');
    const dup = current.find((c) => c.nombre.toLowerCase() === nombre.toLowerCase());
    if (dup) throw new Error(`La categoría "${nombre}" ya existe.`);
    const record: AdminCategoria = {
      id: genId(),
      nombre,
      descripcion: payload.descripcion?.trim() ?? '',
      icono: payload.icono?.trim() ?? 'tag',
      activo: true,
    };
    set({ categorias: save([...current, record]) });
    return record;
  },

  update(id, patch) {
    const current = get().categorias;
    if (patch.nombre !== undefined) {
      const nombre = patch.nombre.trim();
      const dup = current.find((c) => c.id !== id && c.nombre.toLowerCase() === nombre.toLowerCase());
      if (dup) throw new Error(`La categoría "${nombre}" ya existe.`);
    }
    const updated = current.map((c) =>
      c.id === id
        ? { ...c, ...patch, nombre: patch.nombre?.trim() ?? c.nombre }
        : c,
    );
    set({ categorias: save(updated) });

    // Cascade: propagate new name to all channels that reference this category
    if (patch.nombre !== undefined) {
      const newName = patch.nombre.trim();
      // Lazy require to avoid circular-reference at module init time
      const { useChannelStore } = require('./channelStore');
      useChannelStore.getState().updateCategoryName(id, newName);
    }
  },

  toggle(id) {
    set({ categorias: save(get().categorias.map((c) => c.id === id ? { ...c, activo: !c.activo } : c)) });
  },

  remove(id) {
    set({ categorias: save(get().categorias.filter((c) => c.id !== id)) });

    // Cascade: de-assign this category from any channels that reference it
    const { useChannelStore } = require('./channelStore');
    useChannelStore.getState().deassignCategory(id);
  },

  getActive() {
    return get().categorias.filter((c) => c.activo);
  },
}));
