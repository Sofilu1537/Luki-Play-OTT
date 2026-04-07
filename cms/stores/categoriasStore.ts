'use client';
import { create } from 'zustand';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AdminCategoria {
  id: string;
  nombre: string;
  descripcion: string;
  icono: string;
  activo: boolean;
  creadoEn: string;
  actualizadoEn: string;
}

const STORAGE_KEY = 'luki_cms_categorias';

const SEED_CATEGORIAS: AdminCategoria[] = [
  { id: 'cat-001', nombre: 'Noticias',  descripcion: 'Canales de noticias',          icono: 'newspaper-o', activo: true, creadoEn: '2026-01-01T00:00:00.000Z', actualizadoEn: '2026-01-01T00:00:00.000Z' },
  { id: 'cat-002', nombre: 'Deportes',  descripcion: 'Fútbol y más',                 icono: 'futbol-o',    activo: true, creadoEn: '2026-01-01T00:00:00.000Z', actualizadoEn: '2026-01-01T00:00:00.000Z' },
  { id: 'cat-003', nombre: 'Cine',      descripcion: 'Películas y series',            icono: 'film',        activo: true, creadoEn: '2026-01-01T00:00:00.000Z', actualizadoEn: '2026-01-01T00:00:00.000Z' },
  { id: 'cat-004', nombre: 'Infantil',  descripcion: 'Contenido para niños',          icono: 'child',       activo: true, creadoEn: '2026-01-01T00:00:00.000Z', actualizadoEn: '2026-01-01T00:00:00.000Z' },
  { id: 'cat-005', nombre: 'Música',    descripcion: 'Canales de música',             icono: 'music',       activo: true, creadoEn: '2026-01-01T00:00:00.000Z', actualizadoEn: '2026-01-01T00:00:00.000Z' },
  { id: 'cat-006', nombre: 'General',   descripcion: 'Contenido general',             icono: 'th-large',    activo: true, creadoEn: '2026-01-01T00:00:00.000Z', actualizadoEn: '2026-01-01T00:00:00.000Z' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function loadFromStorage(): AdminCategoria[] {
  if (typeof window === 'undefined') return SEED_CATEGORIAS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED_CATEGORIAS;
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) && parsed.length > 0
      ? (parsed as AdminCategoria[])
      : SEED_CATEGORIAS;
  } catch {
    return SEED_CATEGORIAS;
  }
}

function saveToStorage(categorias: AdminCategoria[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(categorias));
  } catch {
    // quota exceeded — silently ignore
  }
}

function generateId(): string {
  return `cat-${Math.random().toString(36).slice(2, 10)}`;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

interface CategoriasState {
  categorias: AdminCategoria[];

  // Sync store with backend response (called after API fetch)
  syncFromApi: (data: AdminCategoria[]) => void;

  // Local-only CRUD (used as fallback or before API confirms)
  localCreate: (payload: { nombre: string; descripcion?: string; icono?: string }) => AdminCategoria;
  localUpdate: (id: string, patch: Partial<Omit<AdminCategoria, 'id' | 'creadoEn'>>) => void;
  localToggle: (id: string) => void;
  localDelete: (id: string) => void;

  // Selectors
  getActive: () => AdminCategoria[];
  findByNombre: (nombre: string) => AdminCategoria | undefined;
}

export const useCategoriasStore = create<CategoriasState>((set, get) => ({
  categorias: loadFromStorage(),

  syncFromApi(data) {
    const list = data.length > 0 ? data : SEED_CATEGORIAS;
    set({ categorias: list });
    saveToStorage(list);
  },

  localCreate(payload) {
    const current = get().categorias;
    const normalizedName = payload.nombre.trim();

    const duplicate = current.find(
      (c) => c.nombre.toLowerCase() === normalizedName.toLowerCase(),
    );
    if (duplicate) {
      throw new Error(`La categoría "${normalizedName}" ya existe.`);
    }
    if (!normalizedName) {
      throw new Error('El nombre de la categoría es requerido.');
    }

    const now = new Date().toISOString();
    const record: AdminCategoria = {
      id: generateId(),
      nombre: normalizedName,
      descripcion: payload.descripcion?.trim() ?? '',
      icono: payload.icono?.trim() ?? '',
      activo: true,
      creadoEn: now,
      actualizadoEn: now,
    };

    const next = [...current, record];
    set({ categorias: next });
    saveToStorage(next);
    return record;
  },

  localUpdate(id, patch) {
    const current = get().categorias;

    if (patch.nombre !== undefined) {
      const normalizedName = patch.nombre.trim();
      const duplicate = current.find(
        (c) => c.id !== id && c.nombre.toLowerCase() === normalizedName.toLowerCase(),
      );
      if (duplicate) {
        throw new Error(`La categoría "${normalizedName}" ya existe.`);
      }
    }

    const next = current.map((c) =>
      c.id === id
        ? { ...c, ...patch, nombre: patch.nombre?.trim() ?? c.nombre, actualizadoEn: new Date().toISOString() }
        : c,
    );
    set({ categorias: next });
    saveToStorage(next);
  },

  localToggle(id) {
    const next = get().categorias.map((c) =>
      c.id === id ? { ...c, activo: !c.activo, actualizadoEn: new Date().toISOString() } : c,
    );
    set({ categorias: next });
    saveToStorage(next);
  },

  localDelete(id) {
    const next = get().categorias.filter((c) => c.id !== id);
    set({ categorias: next });
    saveToStorage(next);
  },

  getActive() {
    return get().categorias.filter((c) => c.activo);
  },

  findByNombre(nombre) {
    return get().categorias.find((c) => c.nombre.toLowerCase() === nombre.toLowerCase());
  },
}));
