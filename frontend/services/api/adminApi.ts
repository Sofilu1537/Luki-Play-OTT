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
  plan: string;
  planId: string | null;
  fechaInicio: string;
  fechaFin: string;
  sesiones: number;
  contrato: string | null;
  status: 'active' | 'inactive' | 'suspended';
  role: 'superadmin' | 'soporte' | 'cliente';
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
}

export interface AdminUserPayload {
  nombre?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  telefono?: string;
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

export interface AdminCanal {
  id: string;
  nombre: string;
  logo: string;
  streamUrl: string;
  detalle: string;
  categoria: string;
  tipo: 'live';
  requiereControlParental: boolean;
  activo: boolean;
  creadoEn: string;
  actualizadoEn: string;
}

export type AdminCanalPayload = Omit<AdminCanal, 'id' | 'creadoEn' | 'actualizadoEn'>;

export interface AdminCategoria {
  id: string;
  nombre: string;
  descripcion: string;
  icono: string;
  activo: boolean;
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

  // If backend returns 401/404 or any non-ok, fall through to mock
  if (!res.ok) {
    const data: unknown = await res.json().catch(() => null);
    const msg =
      data && typeof data === 'object' && 'message' in data
        ? String((data as Record<string, unknown>).message)
        : `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

let mockUsersStore: AdminUser[] = buildMockUsers();

function buildMockUsers(): AdminUser[] {
  const rawUsers = [
    { nombre: 'Admin Principal', firstName: 'Admin', lastName: 'Principal', email: 'admin@lukiplay.com', telefono: null, contrato: null, plan: 'Usuario CMS', planId: null, role: 'superadmin' as const, status: 'active' as const, maxDevices: 3, sessionDurationDays: 7, sessionLimitPolicy: 'block_new' as const },
    { nombre: 'Agente Soporte', firstName: 'Agente', lastName: 'Soporte', email: 'soporte@lukiplay.com', telefono: null, contrato: null, plan: 'Usuario CMS', planId: null, role: 'soporte' as const, status: 'active' as const, maxDevices: 3, sessionDurationDays: 7, sessionLimitPolicy: 'block_new' as const },
    { nombre: 'JOSE MORA', firstName: 'Jose', lastName: 'Mora', email: 'josemoral1984g@gmail.com', telefono: null, contrato: 'CONTRACT-001', plan: 'Basic', planId: 'plan-basic', role: 'cliente' as const, status: 'active' as const, maxDevices: 2, sessionDurationDays: 15, sessionLimitPolicy: 'block_new' as const },
    { nombre: 'NEGRETE MONICA', firstName: 'Monica', lastName: 'Negrete', email: 'negretemonika489@gmail.com', telefono: '6647673852', contrato: 'CONTRACT-002', plan: 'Premium', planId: 'plan-premium', role: 'cliente' as const, status: 'active' as const, maxDevices: 5, sessionDurationDays: 30, sessionLimitPolicy: 'replace_oldest' as const },
    { nombre: 'RODRIGUEZ CARLOS', firstName: 'Carlos', lastName: 'Rodriguez', email: 'carlos.rod@hotmail.com', telefono: '3001234567', contrato: 'CONTRACT-003', plan: 'Familiar', planId: 'plan-family', role: 'cliente' as const, status: 'suspended' as const, maxDevices: 8, sessionDurationDays: 30, sessionLimitPolicy: 'replace_oldest' as const },
    { nombre: 'PEDRO RAMIREZ', firstName: 'Pedro', lastName: 'Ramirez', email: 'pedro@example.com', telefono: '+57300999000', contrato: 'OTT-000001', plan: 'OTT Básico', planId: 'plan-ott-basic', role: 'cliente' as const, status: 'active' as const, maxDevices: 3, sessionDurationDays: 20, sessionLimitPolicy: 'block_new' as const },
  ];

  const now = new Date();
  return rawUsers.map((u, i) => {
    const start = new Date(now);
    start.setDate(start.getDate() - 15 - i);
    const end = new Date(start);
    end.setDate(end.getDate() + 30);
    return {
      id: `usr-${String(i + 1).padStart(3, '0')}`,
      nombre: u.nombre,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      telefono: u.telefono,
      plan: u.plan,
      planId: u.planId,
      fechaInicio: start.toISOString().slice(0, 10),
      fechaFin: end.toISOString().slice(0, 10),
      sesiones: i < 2 ? 1 : Math.min(3, u.maxDevices),
      contrato: u.contrato,
      status: u.status,
      role: u.role,
      mustChangePassword: u.role !== 'cliente',
      mfaEnabled: u.role !== 'cliente' && i === 0,
      isLocked: i === 4,
      lockedUntil: i === 4 ? new Date(Date.now() + 30 * 60000).toISOString() : null,
      lastLoginAt: new Date(Date.now() - (i + 1) * 3600000).toISOString(),
      maxDevices: u.maxDevices,
      sessionDurationDays: u.sessionDurationDays,
      sessionLimitPolicy: u.sessionLimitPolicy,
      isCmsUser: u.role !== 'cliente',
      isSubscriber: u.role === 'cliente',
    };
  });
}

let mockUserSessionsStore: Record<string, AdminUserSession[]> = {
  'usr-001': [{ id: 'ses-001', deviceId: 'cms-admin-web', audience: 'cms', createdAt: new Date(Date.now() - 3600000).toISOString(), expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(), revokedAt: null, status: 'active' }],
  'usr-002': [{ id: 'ses-002', deviceId: 'cms-soporte-web', audience: 'cms', createdAt: new Date(Date.now() - 7200000).toISOString(), expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(), revokedAt: null, status: 'active' }],
  'usr-003': [
    { id: 'ses-003a', deviceId: 'Televisor LG', audience: 'tv', createdAt: new Date(Date.now() - 3 * 3600000).toISOString(), expiresAt: new Date(Date.now() + 6 * 86400000).toISOString(), revokedAt: null, status: 'active' },
    { id: 'ses-003b', deviceId: 'Celular', audience: 'mobile', createdAt: new Date(Date.now() - 26 * 3600000).toISOString(), expiresAt: new Date(Date.now() + 5 * 86400000).toISOString(), revokedAt: null, status: 'active' },
    { id: 'ses-003c', deviceId: 'Computador', audience: 'web', createdAt: new Date(Date.now() - 9 * 3600000).toISOString(), expiresAt: new Date(Date.now() + 5 * 86400000).toISOString(), revokedAt: null, status: 'active' },
  ],
};

export async function adminListUsers(accessToken: string): Promise<AdminUser[]> {
  try {
    return await apiFetch<AdminUser[]>('/admin/users', accessToken);
  } catch {
    // Backend not yet wired → return mock data
    syncAllMockUsersWithPlans();
    return mockUsersStore.map((user) => ({ ...user }));
  }
}

export async function adminGetUser(accessToken: string, id: string): Promise<AdminUser> {
  try {
    return await apiFetch<AdminUser>(`/admin/users/${id}`, accessToken);
  } catch {
    const user = mockUsersStore.find((item) => item.id === id);
    if (!user) throw new Error('Usuario no encontrado');
    return { ...syncUserPlanLink(user) };
  }
}

export async function adminCreateUser(
  accessToken: string,
  data: AdminUserPayload,
): Promise<AdminUser> {
  try {
    return await apiFetch<AdminUser>('/admin/users', accessToken, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  } catch {
    const now = new Date();
    const end = new Date(now);
    end.setDate(end.getDate() + 30);
    const role = data.role ?? 'cliente';
    const fullName = data.nombre?.trim() || `${data.firstName ?? ''} ${data.lastName ?? ''}`.trim() || data.email.split('@')[0];
    const selectedPlan = role === 'cliente' ? findCatalogPlan(data.planId, data.plan) ?? getDefaultSubscriberPlan() : null;
    const newUser: AdminUser = {
      id: `usr-${Date.now()}`,
      nombre: role === 'cliente' ? fullName.toUpperCase() : fullName,
      firstName: data.firstName ?? null,
      lastName: data.lastName ?? null,
      email: data.email,
      telefono: data.telefono || null,
      plan: role === 'cliente' ? selectedPlan?.nombre ?? 'Sin plan' : 'Usuario CMS',
      planId: role === 'cliente' ? selectedPlan?.id ?? null : null,
      fechaInicio: now.toISOString().slice(0, 10),
      fechaFin: end.toISOString().slice(0, 10),
      sesiones: 0,
      contrato: role === 'cliente' ? data.contrato || `OTT-${Date.now()}` : null,
      status: data.status ?? 'active',
      role,
      mustChangePassword: role !== 'cliente',
      mfaEnabled: false,
      isLocked: false,
      lockedUntil: null,
      lastLoginAt: null,
      maxDevices: role === 'cliente' ? data.maxDevices ?? selectedPlan?.maxDevices ?? 3 : 3,
      sessionDurationDays: data.sessionDurationDays ?? (role === 'cliente' ? 30 : 7),
      sessionLimitPolicy: data.sessionLimitPolicy ?? 'block_new',
      isCmsUser: role !== 'cliente',
      isSubscriber: role === 'cliente',
    };
    mockUsersStore = [syncUserPlanLink(newUser), ...mockUsersStore];
    return { ...mockUsersStore[0] };
  }
}

export async function adminUpdateUser(
  accessToken: string,
  id: string,
  data: AdminUserPayload,
): Promise<AdminUser> {
  try {
    return await apiFetch<AdminUser>(`/admin/users/${id}`, accessToken, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  } catch {
    const index = mockUsersStore.findIndex((user) => user.id === id);
    if (index === -1) throw new Error('Usuario no encontrado');
    const current = mockUsersStore[index];
    const nextRole = data.role ?? current.role;
    const isSubscriber = nextRole === 'cliente';
    const fullName = data.nombre?.trim() || `${data.firstName ?? current.firstName ?? ''} ${data.lastName ?? current.lastName ?? ''}`.trim() || current.nombre;
    const selectedPlan = isSubscriber
      ? findCatalogPlan(data.planId ?? current.planId, data.plan ?? current.plan) ?? getDefaultSubscriberPlan()
      : null;
    const updated: AdminUser = {
      ...current,
      nombre: isSubscriber ? fullName.toUpperCase() : fullName,
      firstName: data.firstName ?? current.firstName,
      lastName: data.lastName ?? current.lastName,
      email: data.email ?? current.email,
      telefono: data.telefono ?? current.telefono,
      plan: isSubscriber ? selectedPlan?.nombre ?? current.plan : 'Usuario CMS',
      planId: isSubscriber ? selectedPlan?.id ?? null : null,
      contrato: isSubscriber ? data.contrato ?? current.contrato : null,
      status: data.status ?? current.status,
      role: nextRole,
      maxDevices: isSubscriber ? data.maxDevices ?? current.maxDevices ?? selectedPlan?.maxDevices ?? 3 : 3,
      sessionDurationDays: data.sessionDurationDays ?? current.sessionDurationDays,
      sessionLimitPolicy: data.sessionLimitPolicy ?? current.sessionLimitPolicy,
      isCmsUser: !isSubscriber,
      isSubscriber,
    };
    mockUsersStore[index] = syncUserPlanLink(updated);
    return { ...mockUsersStore[index] };
  }
}

export async function adminUpdateUserStatus(accessToken: string, id: string, status: AdminUser['status']): Promise<AdminUser> {
  try {
    return await apiFetch<AdminUser>(`/admin/users/${id}/status`, accessToken, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  } catch {
    const index = mockUsersStore.findIndex((user) => user.id === id);
    if (index === -1) throw new Error('Usuario no encontrado');
    mockUsersStore[index] = { ...mockUsersStore[index], status };
    return { ...mockUsersStore[index] };
  }
}

export async function adminSetUserPassword(accessToken: string, id: string, newPassword: string, revokeSessions = true): Promise<{ message: string }> {
  try {
    return await apiFetch<{ message: string }>(`/admin/users/${id}/password`, accessToken, {
      method: 'POST',
      body: JSON.stringify({ newPassword, revokeSessions }),
    });
  } catch {
    if (revokeSessions) {
      mockUserSessionsStore[id] = [];
      const index = mockUsersStore.findIndex((user) => user.id === id);
      if (index >= 0) {
        mockUsersStore[index] = { ...mockUsersStore[index], sesiones: 0, mustChangePassword: true };
      }
    }
    return { message: 'Contraseña actualizada y sesiones revocadas.' };
  }
}

export async function adminListUserSessions(accessToken: string, id: string): Promise<AdminUserSession[]> {
  try {
    return await apiFetch<AdminUserSession[]>(`/admin/users/${id}/sessions`, accessToken);
  } catch {
    return [...(mockUserSessionsStore[id] ?? [])];
  }
}

export async function adminRevokeUserSession(accessToken: string, id: string, sessionId: string): Promise<{ message: string }> {
  try {
    return await apiFetch<{ message: string }>(`/admin/users/${id}/sessions/${sessionId}`, accessToken, { method: 'DELETE' });
  } catch {
    mockUserSessionsStore[id] = (mockUserSessionsStore[id] ?? []).map((session) => session.id === sessionId ? { ...session, revokedAt: new Date().toISOString(), status: 'revoked' } : session);
    const activeCount = (mockUserSessionsStore[id] ?? []).filter((session) => session.status === 'active').length;
    mockUsersStore = mockUsersStore.map((user) => user.id === id ? { ...user, sesiones: activeCount } : user);
    return { message: 'Sesión revocada.' };
  }
}

export async function adminRevokeAllUserSessions(accessToken: string, id: string): Promise<{ message: string }> {
  try {
    return await apiFetch<{ message: string }>(`/admin/users/${id}/sessions`, accessToken, { method: 'DELETE' });
  } catch {
    mockUserSessionsStore[id] = (mockUserSessionsStore[id] ?? []).map((session) => ({ ...session, revokedAt: new Date().toISOString(), status: 'revoked' }));
    mockUsersStore = mockUsersStore.map((user) => user.id === id ? { ...user, sesiones: 0 } : user);
    return { message: 'Todas las sesiones fueron revocadas.' };
  }
}

export async function adminGetUserPlan(accessToken: string, id: string): Promise<AdminUserPlan> {
  try {
    return await apiFetch<AdminUserPlan>(`/admin/users/${id}/plan`, accessToken);
  } catch {
    const user = mockUsersStore.find((item) => item.id === id);
    const syncedUser = user ? syncUserPlanLink(user) : null;
    const plan = findCatalogPlan(syncedUser?.planId, syncedUser?.plan) ?? getDefaultSubscriberPlan();
    if (!plan) throw new Error('Plan no encontrado');
    return {
      id: plan.id,
      nombre: plan.nombre,
      descripcion: plan.descripcion,
      duracionDias: plan.duracionDias,
      maxDevices: syncedUser?.maxDevices ?? plan.maxDevices,
      maxConcurrentStreams: plan.maxConcurrentStreams,
      maxProfiles: plan.maxProfiles,
      videoQuality: plan.videoQuality,
      allowDownloads: plan.allowDownloads,
      allowCasting: plan.allowCasting,
      hasAds: plan.hasAds,
      trialDays: plan.trialDays,
      gracePeriodDays: plan.gracePeriodDays,
      entitlements: [...plan.entitlements],
      allowedComponentIds: [...plan.allowedComponentIds],
      allowedCategoryIds: [...plan.allowedCategoryIds],
    };
  }
}

export async function adminDeleteUser(accessToken: string, id: string): Promise<void> {
  try {
    await apiFetch<void>(`/admin/users/${id}`, accessToken, { method: 'DELETE' });
  } catch {
    mockUsersStore = mockUsersStore.map((u) => (u.id === id ? { ...u, status: 'inactive' } : u));
  }
}

// ---------------------------------------------------------------------------
// Plans
// ---------------------------------------------------------------------------

let mockPlansStore: AdminPlan[] = [
  {
    id: 'plan-basic',
    nombre: 'Basic',
    descripcion: 'Acceso básico a TV en vivo y VOD esencial.',
    grupoUsuarios: 'INDIVIDUAL',
    precio: 9.99,
    moneda: 'USD',
    duracionDias: 30,
    activo: true,
    maxDevices: 2,
    maxConcurrentStreams: 1,
    maxProfiles: 2,
    videoQuality: 'HD',
    allowDownloads: false,
    allowCasting: true,
    hasAds: true,
    trialDays: 0,
    gracePeriodDays: 2,
    entitlements: ['live-tv', 'vod-basic'],
    allowedComponentIds: ['comp-001', 'comp-003'],
    allowedCategoryIds: ['cat-001', 'cat-003'],
  },
  {
    id: 'plan-premium',
    nombre: 'Premium',
    descripcion: 'Experiencia premium con 4K, descargas y catálogo ampliado.',
    grupoUsuarios: 'FAMILIAR',
    precio: 29.99,
    moneda: 'USD',
    duracionDias: 30,
    activo: true,
    maxDevices: 5,
    maxConcurrentStreams: 4,
    maxProfiles: 6,
    videoQuality: '4K',
    allowDownloads: true,
    allowCasting: true,
    hasAds: false,
    trialDays: 7,
    gracePeriodDays: 5,
    entitlements: ['live-tv', 'vod-basic', 'vod-premium', 'series', 'kids', 'sports', '4k', 'downloads'],
    allowedComponentIds: ['comp-001', 'comp-002', 'comp-003', 'comp-004', 'comp-007', 'comp-008'],
    allowedCategoryIds: ['cat-001', 'cat-002', 'cat-003', 'cat-004'],
  },
  {
    id: 'plan-family',
    nombre: 'Familiar',
    descripcion: 'Plan multiusuario con perfiles ampliados para el hogar.',
    grupoUsuarios: 'FAMILIAR',
    precio: 19.99,
    moneda: 'USD',
    duracionDias: 30,
    activo: true,
    maxDevices: 8,
    maxConcurrentStreams: 3,
    maxProfiles: 7,
    videoQuality: 'FHD',
    allowDownloads: true,
    allowCasting: true,
    hasAds: false,
    trialDays: 3,
    gracePeriodDays: 3,
    entitlements: ['live-tv', 'vod-basic', 'vod-premium', 'series', 'kids'],
    allowedComponentIds: ['comp-001', 'comp-003', 'comp-004', 'comp-007'],
    allowedCategoryIds: ['cat-003', 'cat-004'],
  },
  {
    id: 'plan-ott-basic',
    nombre: 'OTT Básico',
    descripcion: 'Acceso OTT standalone para clientes sin bundle ISP.',
    grupoUsuarios: 'ISP_BUNDLE',
    precio: 0,
    moneda: 'USD',
    duracionDias: 30,
    activo: true,
    maxDevices: 3,
    maxConcurrentStreams: 1,
    maxProfiles: 3,
    videoQuality: 'HD',
    allowDownloads: false,
    allowCasting: true,
    hasAds: false,
    trialDays: 0,
    gracePeriodDays: 0,
    entitlements: ['live-tv', 'vod-basic'],
    allowedComponentIds: ['comp-001', 'comp-003'],
    allowedCategoryIds: ['cat-001', 'cat-003'],
  },
];

function getDefaultSubscriberPlan() {
  return mockPlansStore.find((plan) => plan.activo) ?? mockPlansStore[0] ?? null;
}

function findCatalogPlan(planId?: string | null, planName?: string | null) {
  if (planId) {
    const byId = mockPlansStore.find((plan) => plan.id === planId);
    if (byId) return byId;
  }

  if (planName?.trim()) {
    const normalizedName = planName.trim().toLowerCase();
    const byName = mockPlansStore.find((plan) => plan.nombre.trim().toLowerCase() === normalizedName);
    if (byName) return byName;

    const byDerivedId = mockPlansStore.find((plan) => plan.id === buildPlanId(planName));
    if (byDerivedId) return byDerivedId;
  }

  return null;
}

function syncUserPlanLink(user: AdminUser): AdminUser {
  const isSubscriber = user.role === 'cliente';

  if (!isSubscriber) {
    return {
      ...user,
      plan: 'Usuario CMS',
      planId: null,
      isCmsUser: true,
      isSubscriber: false,
    };
  }

  const linkedPlan = findCatalogPlan(user.planId, user.plan) ?? getDefaultSubscriberPlan();

  return {
    ...user,
    plan: linkedPlan?.nombre ?? user.plan,
    planId: linkedPlan?.id ?? null,
    isCmsUser: false,
    isSubscriber: true,
  };
}

function syncAllMockUsersWithPlans() {
  mockUsersStore = mockUsersStore.map((user) => syncUserPlanLink(user));
}

function clonePlan(plan: AdminPlan): AdminPlan {
  return {
    ...plan,
    entitlements: [...plan.entitlements],
    allowedComponentIds: [...plan.allowedComponentIds],
    allowedCategoryIds: [...plan.allowedCategoryIds],
  };
}

function buildPlanId(nombre: string) {
  const normalized = nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return normalized.startsWith('plan-') ? normalized : `plan-${normalized}`;
}

function ensureUniquePlanId(baseId: string) {
  if (!mockPlansStore.some((plan) => plan.id === baseId)) return baseId;
  let suffix = 2;
  while (mockPlansStore.some((plan) => plan.id === `${baseId}-${suffix}`)) {
    suffix += 1;
  }
  return `${baseId}-${suffix}`;
}

export async function adminListPlans(accessToken: string): Promise<AdminPlan[]> {
  try { return await apiFetch<AdminPlan[]>('/admin/planes', accessToken); }
  catch {
    syncAllMockUsersWithPlans();
    return mockPlansStore.map(clonePlan);
  }
}

export async function adminCreatePlan(accessToken: string, data: AdminPlanPayload): Promise<AdminPlan> {
  try {
    return await apiFetch<AdminPlan>('/admin/planes', accessToken, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  } catch {
    const newPlan: AdminPlan = {
      ...data,
      id: ensureUniquePlanId(buildPlanId(data.nombre)),
      entitlements: [...data.entitlements],
      allowedComponentIds: [...data.allowedComponentIds],
      allowedCategoryIds: [...data.allowedCategoryIds],
    };
    mockPlansStore = [newPlan, ...mockPlansStore];
    syncAllMockUsersWithPlans();
    return clonePlan(newPlan);
  }
}

export async function adminUpdatePlan(accessToken: string, id: string, data: Partial<AdminPlanPayload>): Promise<AdminPlan> {
  try {
    return await apiFetch<AdminPlan>(`/admin/planes/${id}`, accessToken, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  } catch {
    const index = mockPlansStore.findIndex((plan) => plan.id === id);
    if (index === -1) throw new Error('Plan no encontrado');
    const updated: AdminPlan = {
      ...mockPlansStore[index],
      ...data,
      entitlements: data.entitlements ? [...data.entitlements] : [...mockPlansStore[index].entitlements],
      allowedComponentIds: data.allowedComponentIds ? [...data.allowedComponentIds] : [...mockPlansStore[index].allowedComponentIds],
      allowedCategoryIds: data.allowedCategoryIds ? [...data.allowedCategoryIds] : [...mockPlansStore[index].allowedCategoryIds],
    };
    mockPlansStore[index] = updated;
    syncAllMockUsersWithPlans();
    return clonePlan(updated);
  }
}

export async function adminTogglePlan(accessToken: string, id: string): Promise<AdminPlan> {
  try {
    return await apiFetch<AdminPlan>(`/admin/planes/${id}/toggle`, accessToken, { method: 'POST' });
  } catch {
    const index = mockPlansStore.findIndex((plan) => plan.id === id);
    if (index === -1) throw new Error('Plan no encontrado');
    mockPlansStore[index] = { ...mockPlansStore[index], activo: !mockPlansStore[index].activo };
    syncAllMockUsersWithPlans();
    return clonePlan(mockPlansStore[index]);
  }
}

export async function adminDeletePlan(accessToken: string, id: string): Promise<void> {
  try {
    await apiFetch<void>(`/admin/planes/${id}`, accessToken, { method: 'DELETE' });
  } catch {
    mockPlansStore = mockPlansStore.filter((plan) => plan.id !== id);
    syncAllMockUsersWithPlans();
  }
}

// ---------------------------------------------------------------------------
// Sliders
// ---------------------------------------------------------------------------

const mockSliders: AdminSlider[] = [
  { id: 'sl-001', titulo: 'Bienvenido a Luki Play', subtitulo: 'Tu entretenimiento sin límites', imagen: 'https://placehold.co/1200x400/5B5BD6/white?text=Slider+1', orden: 1, activo: true },
  { id: 'sl-002', titulo: 'Contenido 4K',          subtitulo: 'La mejor calidad de imagen',      imagen: 'https://placehold.co/1200x400/0EA5E9/white?text=Slider+2', orden: 2, activo: true },
  { id: 'sl-003', titulo: 'Deportes en Vivo',       subtitulo: 'No te pierdas ningún partido',   imagen: 'https://placehold.co/1200x400/10B981/white?text=Slider+3', orden: 3, activo: false },
];

export async function adminListSliders(accessToken: string): Promise<AdminSlider[]> {
  try { return await apiFetch<AdminSlider[]>('/admin/sliders', accessToken); }
  catch { return [...mockSliders]; }
}

// ---------------------------------------------------------------------------
// Channels
// ---------------------------------------------------------------------------

let mockCanalesStore: AdminCanal[] = [
  {
    id: 'ch-001',
    nombre: 'Noticias 24',
    logo: '',
    streamUrl: 'https://stream.example.com/noticias24',
    detalle: 'Canal de noticias nacionales e internacionales en vivo las 24 horas.',
    categoria: 'Noticias',
    tipo: 'live',
    requiereControlParental: false,
    activo: true,
    creadoEn: '2026-04-01T08:00:00.000Z',
    actualizadoEn: '2026-04-01T08:00:00.000Z',
  },
  {
    id: 'ch-002',
    nombre: 'Deportes HD',
    logo: '',
    streamUrl: 'https://stream.example.com/deportes',
    detalle: 'Futbol, basketball, tenis y eventos deportivos en alta definicion.',
    categoria: 'Deportes',
    tipo: 'live',
    requiereControlParental: false,
    activo: true,
    creadoEn: '2026-04-01T09:00:00.000Z',
    actualizadoEn: '2026-04-01T09:00:00.000Z',
  },
  {
    id: 'ch-003',
    nombre: 'Cine Clasico',
    logo: '',
    streamUrl: 'https://stream.example.com/cine',
    detalle: 'Peliculas clasicas del cine de oro, drama, comedia y accion.',
    categoria: 'Cine',
    tipo: 'live',
    requiereControlParental: false,
    activo: true,
    creadoEn: '2026-04-01T10:00:00.000Z',
    actualizadoEn: '2026-04-01T10:00:00.000Z',
  },
  {
    id: 'ch-004',
    nombre: 'Infantil TV',
    logo: '',
    streamUrl: 'https://stream.example.com/infantil',
    detalle: 'Programacion infantil segura con controles parentales activados.',
    categoria: 'Infantil',
    tipo: 'live',
    requiereControlParental: true,
    activo: false,
    creadoEn: '2026-04-01T11:00:00.000Z',
    actualizadoEn: '2026-04-01T11:00:00.000Z',
  },
  {
    id: 'ch-005',
    nombre: 'Musica Live',
    logo: '',
    streamUrl: 'https://stream.example.com/musica',
    detalle: 'Conciertos y listas de reproduccion en vivo.',
    categoria: 'Música',
    tipo: 'live',
    requiereControlParental: false,
    activo: true,
    creadoEn: '2026-04-01T12:00:00.000Z',
    actualizadoEn: '2026-04-01T12:00:00.000Z',
  },
];

export async function adminListCanales(accessToken: string): Promise<AdminCanal[]> {
  try { return await apiFetch<AdminCanal[]>('/admin/canales', accessToken); }
  catch { return mockCanalesStore.map((canal) => ({ ...canal })); }
}

export async function adminCreateCanal(accessToken: string, data: AdminCanalPayload): Promise<AdminCanal> {
  try {
    return await apiFetch<AdminCanal>('/admin/canales', accessToken, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  } catch {
    const now = new Date().toISOString();
    const created: AdminCanal = {
      ...data,
      id: `ch-${Date.now()}`,
      creadoEn: now,
      actualizadoEn: now,
    };
    mockCanalesStore = [created, ...mockCanalesStore];
    return { ...created };
  }
}

export async function adminUpdateCanal(accessToken: string, id: string, data: Partial<AdminCanalPayload>): Promise<AdminCanal> {
  try {
    return await apiFetch<AdminCanal>(`/admin/canales/${id}`, accessToken, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  } catch {
    const index = mockCanalesStore.findIndex((canal) => canal.id === id);
    if (index === -1) throw new Error('Canal no encontrado');
    const updated: AdminCanal = {
      ...mockCanalesStore[index],
      ...data,
      tipo: 'live',
      actualizadoEn: new Date().toISOString(),
    };
    mockCanalesStore[index] = updated;
    return { ...updated };
  }
}

export async function adminToggleCanal(accessToken: string, id: string): Promise<AdminCanal> {
  try {
    return await apiFetch<AdminCanal>(`/admin/canales/${id}/toggle`, accessToken, { method: 'POST' });
  } catch {
    const index = mockCanalesStore.findIndex((canal) => canal.id === id);
    if (index === -1) throw new Error('Canal no encontrado');
    const updated = {
      ...mockCanalesStore[index],
      activo: !mockCanalesStore[index].activo,
      actualizadoEn: new Date().toISOString(),
    };
    mockCanalesStore[index] = updated;
    return { ...updated };
  }
}

export async function adminDeleteCanal(accessToken: string, id: string): Promise<void> {
  try {
    await apiFetch<void>(`/admin/canales/${id}`, accessToken, { method: 'DELETE' });
  } catch {
    mockCanalesStore = mockCanalesStore.filter((canal) => canal.id !== id);
  }
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

const mockCategorias: AdminCategoria[] = [
  { id: 'cat-001', nombre: 'Noticias',   descripcion: 'Canales de noticias nacionales e internacionales', icono: 'newspaper-o', activo: true },
  { id: 'cat-002', nombre: 'Deportes',   descripcion: 'Fútbol, baseball, tenis y más',                   icono: 'futbol-o',    activo: true },
  { id: 'cat-003', nombre: 'Cine',       descripcion: 'Películas y series de todos los géneros',          icono: 'film',        activo: true },
  { id: 'cat-004', nombre: 'Infantil',   descripcion: 'Contenido seguro para niños',                      icono: 'child',       activo: true },
  { id: 'cat-005', nombre: 'Música',     descripcion: 'Canales y listas de música',                       icono: 'music',       activo: true },
  { id: 'cat-006', nombre: 'Documental', descripcion: 'Documentales y naturaleza',                        icono: 'globe',       activo: false },
];

export async function adminListCategorias(accessToken: string): Promise<AdminCategoria[]> {
  try { return await apiFetch<AdminCategoria[]>('/admin/categorias', accessToken); }
  catch { return [...mockCategorias]; }
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
  try { return await apiFetch<MonitorStats>('/admin/monitor', accessToken); }
  catch {
    return {
      totalUsuarios: mockUsersStore.length,
      usuariosActivos: mockUsersStore.filter((u) => u.status === 'active').length,
      sesionesActivas: 12,
      contratosActivos: mockUsersStore.filter((u) => u.contrato).length,
      ingresosMes: 4820.50,
      cargaServidor: 34,
    };
  }
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

export async function publicListActiveComponentes(): Promise<AdminComponente[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/public/componentes`);
    if (!res.ok) throw new Error('Failed');
    return res.json() as Promise<AdminComponente[]>;
  } catch {
    return mockComponentes.filter((c) => c.activo);
  }
}
