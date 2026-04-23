/**
 * Admin API — endpoints for the CMS admin panel.
 * Talks to the NestJS backend's /admin/* routes.
 */

import { API_BASE_URL } from './config';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AdminUser {
  id: string;
  nombre: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  telefono: string | null;
  idNumber: string | null;
  address: string | null;
  plan: string;
  planId: string | null;
  fechaInicio: string;
  fechaFin: string;
  sesiones: number;
  contrato: string | null;
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  role: 'superadmin' | 'admin' | 'soporte' | 'cliente';
  mustChangePassword: boolean;
  mfaEnabled: boolean;
  isLocked: boolean;
  lockedUntil: string | null;
  lastLoginAt: string | null;
  maxDevices: number;
  sessionDurationDays: number;
  sessionLimitPolicy: 'block_new' | 'replace_oldest';
  isCmsUser: boolean;
  isSubscriber: boolean;
  permissions: string[];
}

export interface AdminUserPayload {
  nombre?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  telefono?: string;
  idNumber?: string;
  address?: string;
  plan?: string;
  planId?: string;
  contrato?: string;
  role?: AdminUser['role'];
  status?: AdminUser['status'];
  maxDevices?: number;
  sessionDurationDays?: number;
  sessionLimitPolicy?: AdminUser['sessionLimitPolicy'];
}

export interface AdminUserSession {
  id: string;
  deviceId: string;
  audience: string;
  createdAt: string;
  expiresAt: string;
  revokedAt: string | null;
  status: 'active' | 'expired' | 'revoked';
}

export interface AdminUserPlan {
  id: string;
  nombre: string;
  descripcion: string;
  duracionDias: number;
  maxDevices: number;
  maxConcurrentStreams: number;
  maxProfiles: number;
  videoQuality: AdminPlan['videoQuality'];
  allowDownloads: boolean;
  allowCasting: boolean;
  hasAds: boolean;
  trialDays: number;
  gracePeriodDays: number;
  entitlements: AdminPlan['entitlements'];
  allowedComponentIds: string[];
  allowedCategoryIds: string[];
}

export interface AdminPlan {
  id: string;
  nombre: string;
  descripcion: string;
  grupoUsuarios: 'INDIVIDUAL' | 'FAMILIAR' | 'ISP_BUNDLE' | 'EMPRESARIAL' | 'PROMOCIONAL';
  precio: number;
  moneda: string;
  duracionDias: number;
  activo: boolean;
  maxDevices: number;
  maxConcurrentStreams: number;
  maxProfiles: number;
  videoQuality: 'SD' | 'HD' | 'FHD' | '4K';
  allowDownloads: boolean;
  allowCasting: boolean;
  hasAds: boolean;
  trialDays: number;
  gracePeriodDays: number;
  entitlements: Array<'live-tv' | 'vod-basic' | 'vod-premium' | 'series' | 'kids' | 'sports' | 'radio' | '4k' | 'downloads' | 'ppv'>;
  allowedComponentIds: string[];
  allowedCategoryIds: string[];
  allowedChannelIds: string[];
}

export type AdminPlanPayload = Omit<AdminPlan, 'id'>;

export interface AdminSlider {
  id: string;
  titulo: string;
  subtitulo: string;
  imagen: string;
  orden: number;
  activo: boolean;
}

export type AdminSliderPayload = Omit<AdminSlider, 'id' | 'orden'> & {
  orden?: number;
};

export interface AdminCanal {
  id: string;
  nombre: string;
  slug: string;
  // Stream
  streamUrl: string;
  backupUrl?: string;
  // Metadata
  logoUrl?: string;
  categoryId: string;
  category?: { id: string; nombre: string };
  epgSourceId?: string;
  // Status
  status: 'ACTIVE' | 'SCHEDULED' | 'MAINTENANCE' | 'INACTIVE';
  isLive: boolean;
  healthStatus: 'HEALTHY' | 'DEGRADED' | 'OFFLINE' | 'MAINTENANCE';
  uptimePercent: number;
  // Stream config
  streamProtocol: 'HLS' | 'DASH' | 'HLS_DASH';
  resolution: '480p' | '720p' | '1080p' | '4K';
  bitrateKbps: number;
  isDrmProtected: boolean;
  // Access control
  geoRestriction?: string;
  sortOrder: number;
  planIds: string[];
  requiereControlParental: boolean;
  // Analytics
  viewerCount: number;
  // Audit
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  lastHealthCheckAt?: string | null;
}

export type AdminCanalPayload = {
  nombre: string;
  slug?: string;
  streamUrl: string;
  backupUrl?: string;
  logoUrl?: string;
  categoryId: string;
  epgSourceId?: string;
  status?: 'ACTIVE' | 'SCHEDULED' | 'MAINTENANCE' | 'INACTIVE';
  streamProtocol?: 'HLS' | 'DASH' | 'HLS_DASH';
  resolution?: '480p' | '720p' | '1080p' | '4K';
  bitrateKbps?: number;
  isDrmProtected?: boolean;
  geoRestriction?: string;
  sortOrder?: number;
  planIds?: string[];
  requiereControlParental?: boolean;
};

export interface AdminCategoria {
  id: string;
  nombre: string;
  slug?: string;
  descripcion: string;
  icono: string;
  accentColor?: string;
  displayOrder?: number;
  activo: boolean;
  esContenidoAdulto?: boolean;
  channelCategories?: Array<{ channel: { id: string; nombre: string; status: string } }>;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminBlogPost {
  id: string;
  titulo: string;
  contenido: string;
  autor: string;
  publicadoEn: string;
  activo: boolean;
}

export interface AdminImpuesto {
  id: string;
  nombre: string;
  porcentaje: number;
  aplicaA: string;
  activo: boolean;
}

export interface MonitorStats {
  totalUsuarios: number;
  usuariosActivos: number;
  sesionesActivas: number;
  contratosActivos: number;
  ingresosMes: number;
  cargaServidor: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function apiFetch<T>(
  path: string,
  accessToken: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...(options.headers ?? {}),
    },
  });

  // Throw on non-ok responses
  if (!res.ok) {
    const data: unknown = await res.json().catch(() => null);
    const msg =
      data && typeof data === 'object' && 'message' in data
        ? String((data as Record<string, unknown>).message)
        : `HTTP ${res.status}`;
    throw new Error(msg);
  }

  // 204 No Content or empty body — return undefined without parsing
  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export async function adminListUsers(accessToken: string): Promise<AdminUser[]> {
  return apiFetch<AdminUser[]>('/admin/users', accessToken);
}

export async function adminGetUser(accessToken: string, id: string): Promise<AdminUser> {
  return apiFetch<AdminUser>(`/admin/users/${id}`, accessToken);
}

export async function adminCreateUser(accessToken: string, data: AdminUserPayload): Promise<AdminUser> {
  return apiFetch<AdminUser>('/admin/users', accessToken, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function adminUpdateUser(accessToken: string, id: string, data: AdminUserPayload): Promise<AdminUser> {
  return apiFetch<AdminUser>(`/admin/users/${id}`, accessToken, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function adminUpdateUserStatus(accessToken: string, id: string, status: AdminUser['status']): Promise<AdminUser> {
  return apiFetch<AdminUser>(`/admin/users/${id}/status`, accessToken, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function adminSetUserPassword(accessToken: string, id: string, newPassword: string, revokeSessions = true): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/admin/users/${id}/password`, accessToken, {
    method: 'POST',
    body: JSON.stringify({ newPassword, revokeSessions }),
  });
}

export async function adminSendRecoveryCode(accessToken: string, id: string, email: string): Promise<{ message: string; code?: string }> {
  return apiFetch<{ message: string; code?: string }>(`/admin/users/${id}/recovery-code`, accessToken, {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function adminGenerateActivationCode(userId: string, email: string): Promise<{ message: string; code?: string }> {
  const res = await fetch(`${API_BASE_URL}/auth/generate-activation-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, email }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? 'Error al generar código de activación');
  }
  return res.json();
}

export async function adminListUserSessions(accessToken: string, id: string): Promise<AdminUserSession[]> {
  return apiFetch<AdminUserSession[]>(`/admin/users/${id}/sessions`, accessToken);
}

export async function adminRevokeUserSession(accessToken: string, id: string, sessionId: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/admin/users/${id}/sessions/${sessionId}`, accessToken, { method: 'DELETE' });
}

export async function adminRevokeAllUserSessions(accessToken: string, id: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/admin/users/${id}/sessions`, accessToken, { method: 'DELETE' });
}

export async function adminGetUserPlan(accessToken: string, id: string): Promise<AdminUserPlan> {
  return apiFetch<AdminUserPlan>(`/admin/users/${id}/plan`, accessToken);
}

export async function adminDeleteUser(accessToken: string, id: string): Promise<void> {
  await apiFetch<void>(`/admin/users/${id}`, accessToken, { method: 'DELETE' });
}

// ---------------------------------------------------------------------------
// CMS Users (roles module)
// ---------------------------------------------------------------------------

export interface CmsUserPayload {
  nombre: string;
  email: string;
  telefono?: string;
  role: 'admin' | 'soporte';
  permissions?: string[];
  password?: string;
}

export async function adminListCmsUsers(accessToken: string): Promise<AdminUser[]> {
  const all = await apiFetch<AdminUser[]>('/admin/users', accessToken);
  return all.filter((u) => u.isCmsUser);
}

export async function adminCreateCmsUser(
  accessToken: string,
  data: CmsUserPayload,
): Promise<AdminUser> {
  return apiFetch<AdminUser>('/admin/users', accessToken, {
    method: 'POST',
    body: JSON.stringify({
      nombre: data.nombre,
      email: data.email,
      telefono: data.telefono,
      role: data.role,
      permissions: data.permissions,
      password: data.password ?? 'TempPass2025!',
    }),
  });
}

export async function adminUpdateCmsUserPermissions(
  accessToken: string,
  userId: string,
  permissions: string[],
): Promise<AdminUser> {
  return apiFetch<AdminUser>(`/admin/users/${userId}`, accessToken, {
    method: 'PATCH',
    body: JSON.stringify({ permissions }),
  });
}

// ---------------------------------------------------------------------------
// Plans
// ---------------------------------------------------------------------------

export async function adminListPlans(accessToken: string): Promise<AdminPlan[]> {
  try {
    return await apiFetch<AdminPlan[]>('/admin/planes', accessToken);
  } catch {
    // Local store is the source of truth when API is unreachable
    const { usePlanesStore } = require('../planesStore');
    return usePlanesStore.getState().planes;
  }
}

export async function adminCreatePlan(accessToken: string, data: AdminPlanPayload): Promise<AdminPlan> {
  try {
    return await apiFetch<AdminPlan>('/admin/planes', accessToken, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  } catch {
    const { usePlanesStore } = require('../planesStore');
    return usePlanesStore.getState().add(data);
  }
}

export async function adminUpdatePlan(accessToken: string, id: string, data: Partial<AdminPlanPayload>): Promise<AdminPlan> {
  try {
    return await apiFetch<AdminPlan>(`/admin/planes/${id}`, accessToken, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  } catch {
    const { usePlanesStore } = require('../planesStore');
    usePlanesStore.getState().update(id, data);
    const updated = usePlanesStore.getState().planes.find((p: AdminPlan) => p.id === id);
    if (!updated) throw new Error('Plan no encontrado');
    return updated;
  }
}

export async function adminTogglePlan(accessToken: string, id: string): Promise<AdminPlan> {
  try {
    return await apiFetch<AdminPlan>(`/admin/planes/${id}/toggle`, accessToken, { method: 'POST' });
  } catch {
    const { usePlanesStore } = require('../planesStore');
    usePlanesStore.getState().toggle(id);
    const updated = usePlanesStore.getState().planes.find((p: AdminPlan) => p.id === id);
    if (!updated) throw new Error('Plan no encontrado');
    return updated;
  }
}

export async function adminDeletePlan(accessToken: string, id: string): Promise<void> {
  try {
    await apiFetch<void>(`/admin/planes/${id}`, accessToken, { method: 'DELETE' });
  } catch {
    const { usePlanesStore } = require('../planesStore');
    usePlanesStore.getState().remove(id);
  }
}

// ---------------------------------------------------------------------------
// Sliders
// ---------------------------------------------------------------------------

let mockSlidersStore: AdminSlider[] = [
  { id: 'sl-001', titulo: 'Bienvenido a Luki Play', subtitulo: 'Tu entretenimiento sin límites', imagen: 'https://placehold.co/1200x400/5B5BD6/white?text=Slider+1', orden: 1, activo: true },
  { id: 'sl-002', titulo: 'Contenido 4K',          subtitulo: 'La mejor calidad de imagen',      imagen: 'https://placehold.co/1200x400/0EA5E9/white?text=Slider+2', orden: 2, activo: true },
  { id: 'sl-003', titulo: 'Deportes en Vivo',       subtitulo: 'No te pierdas ningún partido',   imagen: 'https://placehold.co/1200x400/10B981/white?text=Slider+3', orden: 3, activo: false },
];

function normalizeSliderOrder(sliders: AdminSlider[]) {
  return sliders.map((slider, index) => ({ ...slider, orden: index + 1 }));
}

export async function adminListSliders(accessToken: string): Promise<AdminSlider[]> {
  try { return await apiFetch<AdminSlider[]>('/admin/sliders', accessToken); }
  catch { return mockSlidersStore.map((slider) => ({ ...slider })).sort((a, b) => a.orden - b.orden); }
}

export async function adminCreateSlider(accessToken: string, data: AdminSliderPayload): Promise<AdminSlider> {
  try {
    return await apiFetch<AdminSlider>('/admin/sliders', accessToken, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  } catch {
    const created: AdminSlider = {
      id: `sl-${Date.now()}`,
      titulo: data.titulo,
      subtitulo: data.subtitulo,
      imagen: data.imagen,
      activo: data.activo,
      orden: data.orden ?? mockSlidersStore.length + 1,
    };
    mockSlidersStore = normalizeSliderOrder([...mockSlidersStore, created]);
    return { ...created };
  }
}

export async function adminUpdateSlider(accessToken: string, id: string, data: Partial<AdminSliderPayload>): Promise<AdminSlider> {
  try {
    return await apiFetch<AdminSlider>(`/admin/sliders/${id}`, accessToken, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  } catch {
    const index = mockSlidersStore.findIndex((slider) => slider.id === id);
    if (index === -1) throw new Error('Slider no encontrado');
    mockSlidersStore[index] = {
      ...mockSlidersStore[index],
      ...data,
      orden: data.orden ?? mockSlidersStore[index].orden,
    };
    mockSlidersStore = normalizeSliderOrder([...mockSlidersStore].sort((a, b) => a.orden - b.orden));
    return { ...mockSlidersStore.find((slider) => slider.id === id)! };
  }
}

export async function adminToggleSlider(accessToken: string, id: string): Promise<AdminSlider> {
  try {
    return await apiFetch<AdminSlider>(`/admin/sliders/${id}/toggle`, accessToken, { method: 'POST' });
  } catch {
    const index = mockSlidersStore.findIndex((slider) => slider.id === id);
    if (index === -1) throw new Error('Slider no encontrado');
    mockSlidersStore[index] = { ...mockSlidersStore[index], activo: !mockSlidersStore[index].activo };
    return { ...mockSlidersStore[index] };
  }
}

export async function adminDeleteSlider(accessToken: string, id: string): Promise<void> {
  try {
    await apiFetch<void>(`/admin/sliders/${id}`, accessToken, { method: 'DELETE' });
  } catch {
    mockSlidersStore = normalizeSliderOrder(mockSlidersStore.filter((slider) => slider.id !== id));
  }
}

export async function adminReorderSliders(accessToken: string, orderedIds: string[]): Promise<AdminSlider[]> {
  try {
    return await apiFetch<AdminSlider[]>('/admin/sliders/reorder', accessToken, {
      method: 'POST',
      body: JSON.stringify({ orderedIds }),
    });
  } catch {
    const mapped = orderedIds
      .map((id) => mockSlidersStore.find((slider) => slider.id === id))
      .filter((slider): slider is AdminSlider => Boolean(slider));
    const untouched = mockSlidersStore.filter((slider) => !orderedIds.includes(slider.id));
    mockSlidersStore = normalizeSliderOrder([...mapped, ...untouched]);
    return mockSlidersStore.map((slider) => ({ ...slider }));
  }
}

// ---------------------------------------------------------------------------
// Channels — no mock data; state is owned by channelStore (localStorage)
// ---------------------------------------------------------------------------

export async function adminListCanales(accessToken: string): Promise<AdminCanal[]> {
  try { return await apiFetch<AdminCanal[]>('/admin/canales', accessToken); }
  catch { return []; }
}

export async function adminCreateCanal(accessToken: string, data: AdminCanalPayload): Promise<AdminCanal> {
  // Strip empty optional URL fields so backend @IsUrl validation is not triggered
  const payload = { ...data };
  if (!payload.backupUrl) delete (payload as Partial<AdminCanalPayload>).backupUrl;
  if (!payload.logoUrl) delete (payload as Partial<AdminCanalPayload>).logoUrl;
  return apiFetch<AdminCanal>('/admin/canales', accessToken, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function adminUpdateCanal(accessToken: string, id: string, data: Partial<AdminCanalPayload>): Promise<AdminCanal> {
  return apiFetch<AdminCanal>(`/admin/canales/${id}`, accessToken, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function adminToggleCanal(accessToken: string, id: string): Promise<AdminCanal> {
  return apiFetch<AdminCanal>(`/admin/canales/${id}/toggle`, accessToken, { method: 'POST' });
}

export async function adminDeleteCanal(accessToken: string, id: string): Promise<void> {
  return apiFetch<void>(`/admin/canales/${id}`, accessToken, { method: 'DELETE' });
}

// ---------------------------------------------------------------------------
// HLS stream validation
// ---------------------------------------------------------------------------

export type HlsStatus = 'VALID' | 'NO_SIGNAL' | 'INVALID';

export interface HlsValidationResult {
  status: HlsStatus;
  isReachable: boolean;
  hasPlaylist: boolean;
  hasSegments: boolean;
  segmentProbe?: { url: string; reachable: boolean };
  error?: string;
}

export async function adminValidateStream(
  accessToken: string,
  url: string,
): Promise<HlsValidationResult> {
  return apiFetch<HlsValidationResult>('/admin/canales/validate-stream', accessToken, {
    method: 'POST',
    body: JSON.stringify({ url }),
  });
}

export async function adminUploadChannelLogo(accessToken: string, file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE_URL}/admin/canales/upload-logo`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message ?? `Upload failed (${res.status})`);
  }
  const data = await res.json() as { url: string };
  // Return the relative path (/uploads/logos/...) so it is environment-agnostic
  // when stored in the DB. Use resolveLogoUrl() on the frontend to render it.
  return data.url;
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

const mockCategorias: AdminCategoria[] = [
  { id: 'cat-001', nombre: 'Películas',              descripcion: 'Largometrajes, estrenos, cine clásico y especiales para el player.',               icono: 'film',           activo: true },
  { id: 'cat-002', nombre: 'Series',                 descripcion: 'Series por temporadas, sagas y contenido episódico.',                             icono: 'list-alt',       activo: true },
  { id: 'cat-003', nombre: 'Documentales',           descripcion: 'Historia, naturaleza, ciencia y especiales documentales.',                        icono: 'globe',          activo: true },
  { id: 'cat-004', nombre: 'Infantil',               descripcion: 'Contenido para niños con curaduría y enfoque familiar.',                          icono: 'child',          activo: true },
  { id: 'cat-005', nombre: 'Deportes',               descripcion: 'Eventos deportivos, resúmenes, ligas y programación especializada.',              icono: 'futbol-o',       activo: true },
  { id: 'cat-006', nombre: 'Música y conciertos',    descripcion: 'Videoclips, conciertos, festivales y especiales musicales.',                     icono: 'music',          activo: true },
  { id: 'cat-007', nombre: 'Noticias y actualidad',  descripcion: 'Cobertura informativa, análisis y noticias en tiempo real.',                      icono: 'newspaper-o',    activo: true },
  { id: 'cat-008', nombre: 'Estilo de vida',         descripcion: 'Bienestar, moda, hogar, salud y entretenimiento lifestyle.',                      icono: 'heart-o',        activo: true },
  { id: 'cat-009', nombre: 'Educación',              descripcion: 'Aprendizaje, formación, cursos y contenido didáctico.',                           icono: 'graduation-cap', activo: true },
  { id: 'cat-010', nombre: 'Religioso / espiritual', descripcion: 'Programación de fe, reflexión y contenido espiritual.',                            icono: 'sun-o',          activo: true },
  { id: 'cat-011', nombre: 'Cocina',                 descripcion: 'Recetas, gastronomía, chefs y contenido culinario.',                              icono: 'cutlery',        activo: true },
  { id: 'cat-012', nombre: 'Viajes',                 descripcion: 'Destinos, turismo, aventura y cultura internacional.',                            icono: 'plane',          activo: true },
  { id: 'cat-013', nombre: 'Tecnología',             descripcion: 'Innovación, gadgets, software, ciencia aplicada y tendencias tech.',              icono: 'laptop',         activo: true },
  { id: 'cat-014', nombre: 'Gaming / esports',       descripcion: 'Videojuegos, torneos, streamers y escena competitiva.',                           icono: 'gamepad',        activo: true },
  { id: 'cat-015', nombre: 'Humor / comedia',        descripcion: 'Stand up, sketches, sitcoms y contenido de comedia.',                             icono: 'smile-o',        activo: true },
  { id: 'cat-016', nombre: 'Reality shows',          descripcion: 'Reality, concursos, formatos de convivencia y entretenimiento no guionado.',      icono: 'television',     activo: true },
];

export async function adminListCategorias(accessToken: string): Promise<AdminCategoria[]> {
  try { return await apiFetch<AdminCategoria[]>('/admin/categorias', accessToken); }
  catch { return [...mockCategorias]; }
}

export async function adminCreateCategoria(
  accessToken: string,
  payload: { nombre: string; descripcion?: string; icono?: string },
): Promise<AdminCategoria> {
  try {
    return await apiFetch<AdminCategoria>('/admin/categorias', accessToken, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch {
    // Local fallback
    const record: AdminCategoria = {
      id: `cat-local-${Math.random().toString(36).slice(2, 9)}`,
      nombre: payload.nombre.trim(),
      descripcion: payload.descripcion?.trim() ?? '',
      icono: payload.icono?.trim() ?? 'tag',
      activo: true,
    };
    mockCategorias.push(record);
    return { ...record };
  }
}

export async function adminUpdateCategoria(
  accessToken: string,
  id: string,
  patch: Partial<Omit<AdminCategoria, 'id'>>,
): Promise<AdminCategoria> {
  try {
    return await apiFetch<AdminCategoria>(`/admin/categorias/${id}`, accessToken, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
  } catch {
    const index = mockCategorias.findIndex((c) => c.id === id);
    if (index !== -1) {
      mockCategorias[index] = { ...mockCategorias[index], ...patch };
      return { ...mockCategorias[index] };
    }
    throw new Error(`Categoría ${id} no encontrada`);
  }
}

export async function adminToggleCategoria(accessToken: string, id: string): Promise<AdminCategoria> {
  try {
    return await apiFetch<AdminCategoria>(`/admin/categorias/${id}/toggle`, accessToken, { method: 'POST' });
  } catch {
    const index = mockCategorias.findIndex((c) => c.id === id);
    if (index !== -1) {
      mockCategorias[index] = { ...mockCategorias[index], activo: !mockCategorias[index].activo };
      return { ...mockCategorias[index] };
    }
    throw new Error(`Categoría ${id} no encontrada`);
  }
}

export async function adminDeleteCategoria(accessToken: string, id: string): Promise<void> {
  try {
    await apiFetch<void>(`/admin/categorias/${id}`, accessToken, { method: 'DELETE' });
  } catch {
    const index = mockCategorias.findIndex((c) => c.id === id);
    if (index !== -1) mockCategorias.splice(index, 1);
  }
}

export async function adminGetCategoria(accessToken: string, id: string): Promise<AdminCategoria> {
  return apiFetch<AdminCategoria>(`/admin/categorias/${id}`, accessToken);
}

export async function adminAssociateCategoriaChannels(
  accessToken: string,
  categoryId: string,
  channelIds: string[],
): Promise<void> {
  await apiFetch<void>(`/admin/categorias/${categoryId}/canales`, accessToken, {
    method: 'POST',
    body: JSON.stringify({ channelIds }),
  });
}

export async function adminRemoveCategoriaChannel(
  accessToken: string,
  categoryId: string,
  channelId: string,
): Promise<void> {
  await apiFetch<void>(`/admin/categorias/${categoryId}/canales/${channelId}`, accessToken, { method: 'DELETE' });
}

export async function adminBulkReorderCategorias(
  accessToken: string,
  items: { id: string; displayOrder: number }[],
): Promise<void> {
  await apiFetch<void>(`/admin/categorias/reorder/bulk`, accessToken, {
    method: 'PATCH',
    body: JSON.stringify({ items }),
  });
}

// ---------------------------------------------------------------------------
// Blog
// ---------------------------------------------------------------------------

const mockBlog: AdminBlogPost[] = [
  { id: 'blog-001', titulo: 'Luki Play llega a toda Colombia',  contenido: '', autor: 'admin@lukiplay.com', publicadoEn: '2026-03-01', activo: true },
  { id: 'blog-002', titulo: 'Nuevos canales de deportes',        contenido: '', autor: 'admin@lukiplay.com', publicadoEn: '2026-03-15', activo: true },
  { id: 'blog-003', titulo: 'Actualización de la app móvil',     contenido: '', autor: 'admin@lukiplay.com', publicadoEn: '2026-04-01', activo: true },
];

export async function adminListBlog(accessToken: string): Promise<AdminBlogPost[]> {
  try { return await apiFetch<AdminBlogPost[]>('/admin/blog', accessToken); }
  catch { return [...mockBlog]; }
}

// ---------------------------------------------------------------------------
// Monitor
// ---------------------------------------------------------------------------

export async function adminGetMonitorStats(accessToken: string): Promise<MonitorStats> {
  return apiFetch<MonitorStats>('/admin/monitor', accessToken);
}

// ---------------------------------------------------------------------------
// Impuestos
// ---------------------------------------------------------------------------

const mockImpuestos: AdminImpuesto[] = [
  { id: 'imp-001', nombre: 'IVA',     porcentaje: 19, aplicaA: 'Planes OTT',     activo: true },
  { id: 'imp-002', nombre: 'ICA',     porcentaje: 1,  aplicaA: 'Servicios',       activo: true },
  { id: 'imp-003', nombre: 'ReteICA', porcentaje: 0.5, aplicaA: 'Contratos ISP', activo: false },
];

export async function adminListImpuestos(accessToken: string): Promise<AdminImpuesto[]> {
  try { return await apiFetch<AdminImpuesto[]>('/admin/impuestos', accessToken); }
  catch { return [...mockImpuestos]; }
}


// ---------------------------------------------------------------------------
// Componentes (content types)
// ---------------------------------------------------------------------------

export interface AdminComponente {
  id: string;
  nombre: string;
  descripcion: string;
  icono: string;
  tipo: string;
  activo: boolean;
  orden: number;
  categories?: Array<{ id: string; nombre: string; icono: string; activo: boolean }>;
}

const mockComponentes: AdminComponente[] = [
  { id: 'comp-001', nombre: 'VOD',        descripcion: 'Video bajo demanda',                         icono: 'film',        tipo: 'VOD',        activo: true,  orden: 1 },
  { id: 'comp-002', nombre: 'Destacados', descripcion: 'Contenido destacado y recomendado',          icono: 'star',        tipo: 'DESTACADOS', activo: true,  orden: 2 },
  { id: 'comp-003', nombre: 'Live',       descripcion: 'Canales en vivo',                            icono: 'circle',      tipo: 'LIVE',       activo: true,  orden: 3 },
  { id: 'comp-004', nombre: 'Series',     descripcion: 'Series organizadas por temporadas',          icono: 'list',        tipo: 'SERIES',     activo: true,  orden: 4 },
  { id: 'comp-005', nombre: 'Radio',      descripcion: 'Estaciones de radio en línea',               icono: 'headphones',  tipo: 'RADIO',      activo: false, orden: 5 },
  { id: 'comp-006', nombre: 'PPV',        descripcion: 'Pay Per View — eventos premium',             icono: 'ticket',      tipo: 'PPV',        activo: false, orden: 6 },
  { id: 'comp-007', nombre: 'Kids',       descripcion: 'Contenido infantil',                         icono: 'child',       tipo: 'KIDS',       activo: true,  orden: 7 },
  { id: 'comp-008', nombre: 'Deportes',   descripcion: 'Canales y eventos deportivos',               icono: 'futbol-o',    tipo: 'DEPORTES',   activo: true,  orden: 8 },
  { id: 'comp-009', nombre: 'Música',     descripcion: 'Canales de música y videoclips',             icono: 'music',       tipo: 'MUSICA',     activo: false, orden: 9 },
  { id: 'comp-010', nombre: 'Noticias',   descripcion: 'Canales de noticias 24/7',                   icono: 'newspaper-o', tipo: 'NOTICIAS',   activo: true,  orden: 10 },
];

export async function adminListComponentes(accessToken: string): Promise<AdminComponente[]> {
  try { return await apiFetch<AdminComponente[]>('/admin/componentes', accessToken); }
  catch { return [...mockComponentes]; }
}

export async function adminToggleComponente(accessToken: string, id: string): Promise<AdminComponente> {
  try {
    return await apiFetch<AdminComponente>(`/admin/componentes/${id}/toggle`, accessToken, { method: 'POST' });
  } catch {
    const comp = mockComponentes.find((c) => c.id === id);
    if (comp) comp.activo = !comp.activo;
    return comp ? { ...comp } : mockComponentes[0];
  }
}

export async function adminReorderComponentes(
  accessToken: string,
  ids: string[],
): Promise<AdminComponente[]> {
  try {
    return await apiFetch<AdminComponente[]>('/admin/componentes/reorder', accessToken, {
      method: 'POST',
      body: JSON.stringify({ ids }),
    });
  } catch {
    // optimistic: return mock sorted by provided order
    return ids.map((id, i) => {
      const comp = mockComponentes.find((c) => c.id === id) ?? mockComponentes[0];
      return { ...comp, orden: i + 1 };
    });
  }
}

export interface CreateComponentePayload {
  nombre: string;
  descripcion?: string;
  icono?: string;
  tipo: string;
  activo?: boolean;
  orden?: number;
}

export async function adminCreateComponente(
  accessToken: string,
  data: CreateComponentePayload,
): Promise<AdminComponente> {
  return apiFetch<AdminComponente>('/admin/componentes', accessToken, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function adminUpdateComponente(
  accessToken: string,
  id: string,
  data: Partial<CreateComponentePayload>,
): Promise<AdminComponente> {
  return apiFetch<AdminComponente>(`/admin/componentes/${id}`, accessToken, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function adminDeleteComponente(
  accessToken: string,
  id: string,
): Promise<void> {
  await apiFetch<void>(`/admin/componentes/${id}`, accessToken, { method: 'DELETE' });
}

export async function adminSyncComponenteCategorias(
  accessToken: string,
  componentId: string,
  categoryIds: string[],
): Promise<void> {
  await apiFetch<void>(`/admin/componentes/${componentId}/categorias`, accessToken, {
    method: 'POST',
    body: JSON.stringify({ categoryIds }),
  });
}

export async function publicListActiveComponentes(): Promise<AdminComponente[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/public/componentes`);
    if (!res.ok) throw new Error('Failed');
    return res.json() as Promise<AdminComponente[]>;
  } catch {
    return mockComponentes.filter((c) => c.activo);
  }
}
