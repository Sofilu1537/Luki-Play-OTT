import { create } from 'zustand';
import type { AdminPlan } from './api/adminApi';

const STORAGE_KEY = 'lukiplay_cms_planes';

const SEED: AdminPlan[] = [
  {
    id: 'plan-isp-std-001',
    nombre: 'Plan Estándar LukiPlay',
    descripcion: 'Streaming OTT incluido con tu servicio de internet LukiPlay. Acceso a canales en vivo, contenido básico bajo demanda y entretenimiento sin límites para toda la familia.',
    grupoUsuarios: 'ISP_BUNDLE',
    precio: 0,
    moneda: 'USD',
    duracionDias: 30,
    activo: true,
    maxDevices: 3,
    maxConcurrentStreams: 2,
    maxProfiles: 3,
    videoQuality: 'HD',
    allowDownloads: false,
    allowCasting: true,
    hasAds: true,
    trialDays: 0,
    gracePeriodDays: 5,
    entitlements: ['live-tv', 'vod-basic', 'sports'],
    allowedComponentIds: [],
    allowedCategoryIds: [],
    allowedChannelIds: [],
  },
];

function load(): AdminPlan[] {
  if (typeof window === 'undefined') return SEED;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return save(SEED);
    const parsed = JSON.parse(raw) as AdminPlan[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : save(SEED);
  } catch {
    return save(SEED);
  }
}

function save(list: AdminPlan[]): AdminPlan[] {
  if (typeof window !== 'undefined') {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch { /* quota */ }
  }
  return list;
}

function genId(): string {
  return `plan-local-${Math.random().toString(36).slice(2, 9)}`;
}

interface PlanesState {
  planes: AdminPlan[];
  syncFromApi: (data: AdminPlan[]) => void;
  add: (plan: Omit<AdminPlan, 'id'>) => AdminPlan;
  update: (id: string, patch: Partial<Omit<AdminPlan, 'id'>>) => void;
  toggle: (id: string) => void;
  remove: (id: string) => void;
  getActive: () => AdminPlan[];
}

export const usePlanesStore = create<PlanesState>((set, get) => ({
  planes: load(),

  syncFromApi(data) {
    if (data.length === 0) return;
    set({ planes: save(data) });
  },

  add(payload) {
    const record: AdminPlan = { id: genId(), ...payload };
    const next = [record, ...get().planes];
    set({ planes: save(next) });

    // Cascade: add this plan to selected channels
    if (payload.allowedChannelIds && payload.allowedChannelIds.length > 0) {
      const { useChannelStore } = require('./channelStore');
      useChannelStore.getState().syncPlanChannels(record.id, [], payload.allowedChannelIds);
    }

    return record;
  },

  update(id, patch) {
    const current = get().planes;
    const existing = current.find((p) => p.id === id);
    if (!existing) return;

    const next = current.map((p) => p.id === id ? { ...p, ...patch } : p);
    set({ planes: save(next) });

    // Cascade: sync channel planIds when allowedChannelIds changes
    if (patch.allowedChannelIds !== undefined) {
      const { useChannelStore } = require('./channelStore');
      useChannelStore.getState().syncPlanChannels(
        id,
        existing.allowedChannelIds ?? [],
        patch.allowedChannelIds,
      );
    }
  },

  toggle(id) {
    set({ planes: save(get().planes.map((p) => p.id === id ? { ...p, activo: !p.activo } : p)) });
  },

  remove(id) {
    const existing = get().planes.find((p) => p.id === id);
    set({ planes: save(get().planes.filter((p) => p.id !== id)) });

    // Cascade: remove this plan from all channels it was assigned to
    if (existing && existing.allowedChannelIds && existing.allowedChannelIds.length > 0) {
      const { useChannelStore } = require('./channelStore');
      useChannelStore.getState().syncPlanChannels(id, existing.allowedChannelIds, []);
    }
  },

  getActive() {
    return get().planes.filter((p) => p.activo);
  },
}));
