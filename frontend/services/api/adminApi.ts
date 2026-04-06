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
  status: 'active' | 'inactive' | 'suspended' | 'pending';
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

export type AdminSliderPayload = Omit<AdminSlider, 'id' | 'orden'> & {
  orden?: number;
};

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

// ---------------------------------------------------------------------------
// Persistencia local (localStorage) — mock sin base de datos
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'lukiplay_mock_users';

function loadMockUsers(): AdminUser[] {
  if (typeof window === 'undefined') return buildMockUsers();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as AdminUser[];
  } catch { /* corrupted cache — rebuild */ }
  const fresh = buildMockUsers();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
  return fresh;
}

function saveMockUsers(): void {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(mockUsersStore)); } catch { /* quota exceeded — ignore */ }
}

let mockUsersStore: AdminUser[] = loadMockUsers();

function buildMockUsers(): AdminUser[] {
  function mapStatus(s: string): AdminUser['status'] {
    const u = s.toUpperCase();
    if (u === 'ACTIVO') return 'active';
    if (u === 'SUSPENDIDO') return 'suspended';
    return 'inactive'; // CORTADO, ANULADO, etc.
  }

  const rawUsers = [
    // ── Usuarios internos ──────────────────────────────────────────────────
    { nombre: 'Admin Principal', firstName: 'Admin', lastName: 'Principal', email: 'admin@lukiplay.com', telefono: null, contrato: null, plan: 'Usuario CMS', planId: null, role: 'superadmin' as const, status: 'active' as const, maxDevices: 3, sessionDurationDays: 7, sessionLimitPolicy: 'block_new' as const, fechaInicio: '', fechaFin: '', isCmsUser: true },
    { nombre: 'Agente Soporte', firstName: 'Agente', lastName: 'Soporte', email: 'soporte@lukiplay.com', telefono: null, contrato: null, plan: 'Usuario CMS', planId: null, role: 'soporte' as const, status: 'active' as const, maxDevices: 3, sessionDurationDays: 7, sessionLimitPolicy: 'block_new' as const, fechaInicio: '', fechaFin: '', isCmsUser: true },
    // ── Abonados desde Excel (report-contract.xlsx) ────────────────────────
    { nombre: 'CASTRO DANIEL',                         firstName: 'CASTRO',      lastName: 'DANIEL',      email: '',                               telefono: '0987284494',        contrato: '000000000', plan: 'PLAN BASICO',           planId: null, role: 'cliente' as const, status: mapStatus('ANULADO'),    maxDevices: 2, sessionDurationDays: 30, sessionLimitPolicy: 'block_new' as const, fechaInicio: '2020-09-14', fechaFin: '',           isCmsUser: false },
    { nombre: 'DOICELA NEGRETE JEFFERSON XAVIER',       firstName: 'DOICELA',     lastName: 'NEGRETE',     email: 'facturacion@luki.ec',            telefono: '0939246460',        contrato: '000000002', plan: 'PLAN BASICO',           planId: null, role: 'cliente' as const, status: mapStatus('SUSPENDIDO'), maxDevices: 2, sessionDurationDays: 30, sessionLimitPolicy: 'block_new' as const, fechaInicio: '2020-08-27', fechaFin: '2022-12-01', isCmsUser: false },
    { nombre: 'PASTUNA CHUSIN MANUEL',                  firstName: 'PASTUNA',     lastName: 'CHUSIN',      email: 'manuelpastunachusin@gmail.com',  telefono: '0939218464',        contrato: '000000003', plan: 'PLAN BASICO',           planId: null, role: 'cliente' as const, status: mapStatus('ACTIVO'),    maxDevices: 2, sessionDurationDays: 30, sessionLimitPolicy: 'block_new' as const, fechaInicio: '2020-08-28', fechaFin: '2025-10-17', isCmsUser: false },
    { nombre: 'CATOTA YUGSI JENNY GUADALUPE',           firstName: 'CATOTA',      lastName: 'YUGSI',       email: 'facturacion@luki.ec',            telefono: '0988062117',        contrato: '000000004', plan: 'PLAN BASICO',           planId: null, role: 'cliente' as const, status: mapStatus('ACTIVO'),    maxDevices: 2, sessionDurationDays: 30, sessionLimitPolicy: 'block_new' as const, fechaInicio: '2020-08-28', fechaFin: '2026-03-11', isCmsUser: false },
    { nombre: 'GUAINALLA CASILLAS TANIA SOLEDAD',       firstName: 'GUAINALLA',   lastName: 'CASILLAS',    email: 'taniaguainalla03@gmail.com',     telefono: '0979361442',        contrato: '000000005', plan: 'PLAN BASICO',           planId: null, role: 'cliente' as const, status: mapStatus('SUSPENDIDO'), maxDevices: 2, sessionDurationDays: 30, sessionLimitPolicy: 'block_new' as const, fechaInicio: '2020-08-31', fechaFin: '2022-11-25', isCmsUser: false },
    { nombre: 'DE LA CRUZ QUIROZ VERONICA VIVIANA',     firstName: 'DE LA CRUZ',  lastName: 'QUIROZ',      email: 'Vq346299@gmail.com',             telefono: '0983535889',        contrato: '000000006', plan: 'PLAN BASICO',           planId: null, role: 'cliente' as const, status: mapStatus('CORTADO'),   maxDevices: 2, sessionDurationDays: 30, sessionLimitPolicy: 'block_new' as const, fechaInicio: '2020-08-31', fechaFin: '2023-03-16', isCmsUser: false },
    { nombre: 'AYALA USUNO JOSE NEPTALI',               firstName: 'AYALA',       lastName: 'USUNO',       email: 'ayala.r.alex20@gmail.com',       telefono: '0995366940',        contrato: '000000007', plan: 'PLAN HOGAR SUPER',      planId: null, role: 'cliente' as const, status: mapStatus('ACTIVO'),    maxDevices: 4, sessionDurationDays: 30, sessionLimitPolicy: 'block_new' as const, fechaInicio: '2020-08-31', fechaFin: '2026-03-11', isCmsUser: false },
    { nombre: 'TOASA QUISHPE MARIA TERESA',             firstName: 'TOASA',       lastName: 'QUISHPE',     email: 'facturacion@luki.ec',            telefono: '0984921659',        contrato: '000000009', plan: 'PLAN HOGAR SUPER PLUS', planId: null, role: 'cliente' as const, status: mapStatus('ACTIVO'),    maxDevices: 5, sessionDurationDays: 30, sessionLimitPolicy: 'block_new' as const, fechaInicio: '2020-08-31', fechaFin: '',           isCmsUser: false },
    { nombre: 'GANCINO JAILACA MARIA NARCISA',          firstName: 'GANCINO',     lastName: 'JAILACA',     email: 'aguaizaerika61@gmail.com',       telefono: '0984134246',        contrato: '000000010', plan: 'PLAN PRO',              planId: null, role: 'cliente' as const, status: mapStatus('ACTIVO'),    maxDevices: 3, sessionDurationDays: 30, sessionLimitPolicy: 'block_new' as const, fechaInicio: '2020-09-01', fechaFin: '2024-04-17', isCmsUser: false },
    { nombre: 'TAMAY GUARACA JOSE DOMINGO',             firstName: 'TAMAY',       lastName: 'GUARACA',     email: 'facturacion@luki.ec',            telefono: '0993214258',        contrato: '000000011', plan: 'PLAN BASICO',           planId: null, role: 'cliente' as const, status: mapStatus('SUSPENDIDO'), maxDevices: 2, sessionDurationDays: 30, sessionLimitPolicy: 'block_new' as const, fechaInicio: '2020-09-01', fechaFin: '2023-08-14', isCmsUser: false },
    { nombre: 'SANCHEZ LLANO SILVIA ADRIANA',           firstName: 'SANCHEZ',     lastName: 'LLANO',       email: 'mauriciosasnalema@gmail.com',    telefono: '0983881636',        contrato: '000000012', plan: 'PLAN HOGAR IDEAL PLUS', planId: null, role: 'cliente' as const, status: mapStatus('ACTIVO'),    maxDevices: 4, sessionDurationDays: 30, sessionLimitPolicy: 'block_new' as const, fechaInicio: '2020-09-01', fechaFin: '2024-12-17', isCmsUser: false },
    { nombre: 'YUPANGUI YUPANGUI ANA LUCIA',            firstName: 'YUPANGUI',    lastName: 'YUPANGUI',    email: 'facturacion@luki.ec',            telefono: '0994193126',        contrato: '000000013', plan: 'PLAN HOGAR SUPER',      planId: null, role: 'cliente' as const, status: mapStatus('ACTIVO'),    maxDevices: 4, sessionDurationDays: 30, sessionLimitPolicy: 'block_new' as const, fechaInicio: '2020-09-01', fechaFin: '2026-03-11', isCmsUser: false },
    { nombre: 'VEGA TIGASI JOSE PABLO',                 firstName: 'VEGA',        lastName: 'TIGASI',      email: 'jovetigaci@gmail.com',           telefono: '0968013569',        contrato: '000000014', plan: 'PLAN HOGAR SUPER PLUS', planId: null, role: 'cliente' as const, status: mapStatus('ACTIVO'),    maxDevices: 5, sessionDurationDays: 30, sessionLimitPolicy: 'block_new' as const, fechaInicio: '2020-09-01', fechaFin: '2026-02-11', isCmsUser: false },
    { nombre: 'PALLO ALAJO SEGUNDO JUAN',               firstName: 'PALLO',       lastName: 'ALAJO',       email: 'juanpallo05@gmail.com',          telefono: '0959550924',        contrato: '000000015', plan: 'PLAN HOGAR IDEAL PLUS', planId: null, role: 'cliente' as const, status: mapStatus('ACTIVO'),    maxDevices: 4, sessionDurationDays: 30, sessionLimitPolicy: 'block_new' as const, fechaInicio: '2020-09-02', fechaFin: '2025-12-12', isCmsUser: false },
    { nombre: 'LLAMUCA IZA BLANCA BEATRIZ',             firstName: 'LLAMUCA',     lastName: 'IZA',         email: 'facturacion@luki.ec',            telefono: '0994531033',        contrato: '000000016', plan: 'PLAN BASICO',           planId: null, role: 'cliente' as const, status: mapStatus('SUSPENDIDO'), maxDevices: 2, sessionDurationDays: 30, sessionLimitPolicy: 'block_new' as const, fechaInicio: '2020-09-02', fechaFin: '2022-03-24', isCmsUser: false },
    { nombre: 'VILLAR ALLAUCA AGUSTIN',                 firstName: 'VILLAR',      lastName: 'ALLAUCA',     email: 'facturacion@luki.ec',            telefono: '0981704691',        contrato: '000000017', plan: 'PLAN PREMIUM',          planId: null, role: 'cliente' as const, status: mapStatus('CORTADO'),   maxDevices: 3, sessionDurationDays: 30, sessionLimitPolicy: 'block_new' as const, fechaInicio: '2020-09-02', fechaFin: '2023-01-18', isCmsUser: false },
    { nombre: 'VELASCO ROSERO LIZBETH ALEJANDRA',       firstName: 'VELASCO',     lastName: 'ROSERO',      email: 'facturacion@luki.ec',            telefono: '0980716767',        contrato: '000000018', plan: 'PLAN BASICO',           planId: null, role: 'cliente' as const, status: mapStatus('SUSPENDIDO'), maxDevices: 2, sessionDurationDays: 30, sessionLimitPolicy: 'block_new' as const, fechaInicio: '2020-09-02', fechaFin: '2022-08-01', isCmsUser: false },
    { nombre: 'PALAQUINBAY CAMPOS ANGEL NICOLAS',       firstName: 'PALAQUINBAY', lastName: 'CAMPOS',      email: 'angelpalaquibay69@gmail.com',    telefono: '0998482585',        contrato: '000000019', plan: 'PLAN HOGAR IDEAL PLUS', planId: null, role: 'cliente' as const, status: mapStatus('ACTIVO'),    maxDevices: 4, sessionDurationDays: 30, sessionLimitPolicy: 'block_new' as const, fechaInicio: '2020-09-02', fechaFin: '2026-02-11', isCmsUser: false },
    { nombre: 'PERDOMO JAMI JOSE RODRIGO',              firstName: 'PERDOMO',     lastName: 'JAMI',        email: 'facturacion@luki.ec',            telefono: '0985084080',        contrato: '000000020', plan: 'PLAN HOGAR SUPER PLUS', planId: null, role: 'cliente' as const, status: mapStatus('ACTIVO'),    maxDevices: 5, sessionDurationDays: 30, sessionLimitPolicy: 'block_new' as const, fechaInicio: '2020-09-02', fechaFin: '2026-02-11', isCmsUser: false },
    { nombre: 'QUISHPE ANTE OLIMPIA',                   firstName: 'QUISHPE',     lastName: 'ANTE',        email: 'facturacion@luki.ec',            telefono: '0995726023',        contrato: '000000021', plan: 'PLAN HOGAR IDEAL PLUS', planId: null, role: 'cliente' as const, status: mapStatus('ACTIVO'),    maxDevices: 4, sessionDurationDays: 30, sessionLimitPolicy: 'block_new' as const, fechaInicio: '2020-09-02', fechaFin: '2025-06-12', isCmsUser: false },
    { nombre: 'GUANOQUIZA LOGRO CESARIO',               firstName: 'GUANOQUIZA',  lastName: 'LOGRO',       email: 'facturacion@luki.ec',            telefono: '0993069762',        contrato: '000000022', plan: 'PLAN BASICO',           planId: null, role: 'cliente' as const, status: mapStatus('SUSPENDIDO'), maxDevices: 2, sessionDurationDays: 30, sessionLimitPolicy: 'block_new' as const, fechaInicio: '2020-09-02', fechaFin: '2024-06-24', isCmsUser: false },
    { nombre: 'CHONGA CACHUPUD JOSE MANUEL',            firstName: 'CHONGA',      lastName: 'CACHUPUD',    email: 'facturacion@luki.ec',            telefono: '0998310674',        contrato: '000000023', plan: 'PLAN BASICO',           planId: null, role: 'cliente' as const, status: mapStatus('SUSPENDIDO'), maxDevices: 2, sessionDurationDays: 30, sessionLimitPolicy: 'block_new' as const, fechaInicio: '2020-09-02', fechaFin: '2023-11-17', isCmsUser: false },
    { nombre: 'TAMAMI QUINATOA DAYSI MARIBEL',          firstName: 'TAMAMI',      lastName: 'QUINATOA',    email: 'facturacion@luki.ec',            telefono: '0998876463',        contrato: '000000024', plan: 'PLAN BASICO',           planId: null, role: 'cliente' as const, status: mapStatus('SUSPENDIDO'), maxDevices: 2, sessionDurationDays: 30, sessionLimitPolicy: 'block_new' as const, fechaInicio: '2020-09-02', fechaFin: '2022-08-01', isCmsUser: false },
    { nombre: 'RAMON CABRERA CARMEN SONIA',             firstName: 'RAMON',       lastName: 'CABRERA',     email: 'mary180betty@gmail.com',         telefono: '0994922196',        contrato: '000000025', plan: 'PACK BASICO',           planId: null, role: 'cliente' as const, status: mapStatus('CORTADO'),   maxDevices: 2, sessionDurationDays: 30, sessionLimitPolicy: 'block_new' as const, fechaInicio: '2020-09-02', fechaFin: '2023-12-26', isCmsUser: false },
    { nombre: 'LOPEZ LLANGA NORMA ELIZABETH',           firstName: 'LOPEZ',       lastName: 'LLANGA',      email: 'Soldamarcelo90@gmail.com',       telefono: '0989590010',        contrato: '000000026', plan: 'PLAN BASICO',           planId: null, role: 'cliente' as const, status: mapStatus('SUSPENDIDO'), maxDevices: 2, sessionDurationDays: 30, sessionLimitPolicy: 'block_new' as const, fechaInicio: '2020-09-02', fechaFin: '2022-12-27', isCmsUser: false },
    { nombre: 'QUISHPE VILLAR MARIA DOLORES',           firstName: 'QUISHPE',     lastName: 'VILLAR',      email: 'facturacion@luki.ec',            telefono: '0959744564',        contrato: '000000027', plan: 'PLAN BASICO',           planId: null, role: 'cliente' as const, status: mapStatus('SUSPENDIDO'), maxDevices: 2, sessionDurationDays: 30, sessionLimitPolicy: 'block_new' as const, fechaInicio: '2020-09-03', fechaFin: '2021-10-28', isCmsUser: false },
    { nombre: 'SALAZAR NARANJO OSCAR ROLANDO',          firstName: 'SALAZAR',     lastName: 'NARANJO',     email: 'facturacion@luki.ec',            telefono: '0981061497',        contrato: '000000028', plan: 'PLAN BASICO',           planId: null, role: 'cliente' as const, status: mapStatus('ACTIVO'),    maxDevices: 2, sessionDurationDays: 30, sessionLimitPolicy: 'block_new' as const, fechaInicio: '2020-09-03', fechaFin: '2025-06-16', isCmsUser: false },
    { nombre: 'ORDONEZ SINCHIRE LUISA LILY',            firstName: 'ORDONEZ',     lastName: 'SINCHIRE',    email: '1940@outlook.com',               telefono: '0995400720',        contrato: '000000029', plan: 'PLAN HOGAR SUPER',      planId: null, role: 'cliente' as const, status: mapStatus('ACTIVO'),    maxDevices: 4, sessionDurationDays: 30, sessionLimitPolicy: 'block_new' as const, fechaInicio: '2020-09-03', fechaFin: '',           isCmsUser: false },
    { nombre: 'BORJA BORJA JULIO RAMIRO',               firstName: 'BORJA',       lastName: 'BORJA',       email: 'facturacion@luki.ec',            telefono: '0995295389',        contrato: '000000031', plan: 'PLAN BASICO',           planId: null, role: 'cliente' as const, status: mapStatus('SUSPENDIDO'), maxDevices: 2, sessionDurationDays: 30, sessionLimitPolicy: 'block_new' as const, fechaInicio: '2020-09-03', fechaFin: '2022-01-19', isCmsUser: false },
    { nombre: 'PAZOS OROSCO GABRIELA BRIGITE',          firstName: 'PAZOS',       lastName: 'OROSCO',      email: 'facturacion@luki.ec',            telefono: '0987229463',        contrato: '000000032', plan: 'PLAN BASICO',           planId: null, role: 'cliente' as const, status: mapStatus('SUSPENDIDO'), maxDevices: 2, sessionDurationDays: 30, sessionLimitPolicy: 'block_new' as const, fechaInicio: '2020-09-03', fechaFin: '2024-12-13', isCmsUser: false },
    { nombre: 'TOTASIG CAILLAGUA NELSON JAVIER',        firstName: 'TOTASIG',     lastName: 'CAILLAGUA',   email: 'facturacion@luki.ec',            telefono: '0959847430',        contrato: '000000033', plan: 'PLAN BASICO',           planId: null, role: 'cliente' as const, status: mapStatus('SUSPENDIDO'), maxDevices: 2, sessionDurationDays: 30, sessionLimitPolicy: 'block_new' as const, fechaInicio: '2020-09-03', fechaFin: '2021-12-01', isCmsUser: false },
    { nombre: 'CAVA QUISHPE JUAN CARLOS',               firstName: 'CAVA',        lastName: 'QUISHPE',     email: 'facturacion@luki.ec',            telefono: '0993815854',        contrato: '000000034', plan: 'PLAN BASICO',           planId: null, role: 'cliente' as const, status: mapStatus('SUSPENDIDO'), maxDevices: 2, sessionDurationDays: 30, sessionLimitPolicy: 'block_new' as const, fechaInicio: '2020-09-03', fechaFin: '2021-11-18', isCmsUser: false },
    { nombre: 'MUNOZ GUAMAN LUIS MIGUEL',               firstName: 'MUNOZ',       lastName: 'GUAMAN',      email: 'miguicho-593@hotmail.com',       telefono: '0994206701',        contrato: '000000035', plan: 'PLAN BASICO',           planId: null, role: 'cliente' as const, status: mapStatus('ACTIVO'),    maxDevices: 2, sessionDurationDays: 30, sessionLimitPolicy: 'block_new' as const, fechaInicio: '2020-09-04', fechaFin: '2025-09-11', isCmsUser: false },
    { nombre: 'TOAQUIZA VEGA LUIS',                     firstName: 'TOAQUIZA',    lastName: 'VEGA',        email: 'luistoaquizavega2410@gmail.com', telefono: '0989800810',        contrato: '000000036', plan: 'PLAN HOGAR SUPER PLUS', planId: null, role: 'cliente' as const, status: mapStatus('ACTIVO'),    maxDevices: 5, sessionDurationDays: 30, sessionLimitPolicy: 'block_new' as const, fechaInicio: '2020-09-04', fechaFin: '2026-02-11', isCmsUser: false },
    { nombre: 'LUCINA OYOS CLERIDA GRENEIMI',           firstName: 'LUCINA',      lastName: 'OYOS',        email: 'robertocastillolucina@gamil.com',telefono: '0962698199',        contrato: '000000038', plan: 'ESPECIAL',              planId: null, role: 'cliente' as const, status: mapStatus('ACTIVO'),    maxDevices: 4, sessionDurationDays: 30, sessionLimitPolicy: 'block_new' as const, fechaInicio: '2020-09-04', fechaFin: '2026-03-11', isCmsUser: false },
    { nombre: 'TENELEMA GUALA ELVIA JOHANNA',           firstName: 'TENELEMA',    lastName: 'GUALA',       email: 'elviatenelema281@gmail.com',     telefono: '0981060962',        contrato: '000000039', plan: 'PLAN HOGAR SUPER PLUS', planId: null, role: 'cliente' as const, status: mapStatus('ACTIVO'),    maxDevices: 5, sessionDurationDays: 30, sessionLimitPolicy: 'block_new' as const, fechaInicio: '2020-09-04', fechaFin: '',           isCmsUser: false },
    { nombre: 'SHULCA JACOME CARMEN MARLENE',           firstName: 'SHULCA',      lastName: 'JACOME',      email: 'facturacion@luki.ec',            telefono: '0939699558',        contrato: '000000040', plan: 'PACK BASICO',           planId: null, role: 'cliente' as const, status: mapStatus('SUSPENDIDO'), maxDevices: 2, sessionDurationDays: 30, sessionLimitPolicy: 'block_new' as const, fechaInicio: '2020-09-04', fechaFin: '2023-04-12', isCmsUser: false },
    { nombre: 'LEMA PAGUAY PATRICIA',                   firstName: 'LEMA',        lastName: 'PAGUAY',      email: 'lemluis90@gmail.com',            telefono: '0999821489',        contrato: '000000041', plan: 'PLAN BASICO',           planId: null, role: 'cliente' as const, status: mapStatus('ACTIVO'),    maxDevices: 2, sessionDurationDays: 30, sessionLimitPolicy: 'block_new' as const, fechaInicio: '2020-09-04', fechaFin: '2024-09-18', isCmsUser: false },
    { nombre: 'MONAR AVEROS EDGAR VINICIO',             firstName: 'MONAR',       lastName: 'AVEROS',      email: 'edgarmonar02@gmail.com',         telefono: '0961818075',        contrato: '000000042', plan: 'PLAN BASICO',           planId: null, role: 'cliente' as const, status: mapStatus('ACTIVO'),    maxDevices: 2, sessionDurationDays: 30, sessionLimitPolicy: 'block_new' as const, fechaInicio: '2020-09-04', fechaFin: '2026-01-13', isCmsUser: false },
    { nombre: 'CRIOLLO CRIOLLO NELSON PATRICIO',        firstName: 'CRIOLLO',     lastName: 'CRIOLLO',     email: 'facturacion@luki.ec',            telefono: '0995437322',        contrato: '000000043', plan: 'PLAN BASICO',           planId: null, role: 'cliente' as const, status: mapStatus('SUSPENDIDO'), maxDevices: 2, sessionDurationDays: 30, sessionLimitPolicy: 'block_new' as const, fechaInicio: '2020-09-04', fechaFin: '2023-08-14', isCmsUser: false },
    { nombre: 'MIRANDA ROMERO MARIA ELENA',             firstName: 'MIRANDA',     lastName: 'ROMERO',      email: 'facturacion@luki.ec',            telefono: '0998472165',        contrato: '000000044', plan: 'PLAN HOGAR IDEAL PLUS', planId: null, role: 'cliente' as const, status: mapStatus('ACTIVO'),    maxDevices: 4, sessionDurationDays: 30, sessionLimitPolicy: 'block_new' as const, fechaInicio: '2020-09-04', fechaFin: '2025-11-13', isCmsUser: false },
    { nombre: 'LISINTUNA GAVILANES MARIA TERESA',       firstName: 'LISINTUNA',   lastName: 'GAVILANES',   email: 'facturacion@luki.ec',            telefono: '0967690616',        contrato: '000000045', plan: 'PLAN BASICO',           planId: null, role: 'cliente' as const, status: mapStatus('SUSPENDIDO'), maxDevices: 2, sessionDurationDays: 30, sessionLimitPolicy: 'block_new' as const, fechaInicio: '2020-09-04', fechaFin: '2024-02-22', isCmsUser: false },
    { nombre: 'TAPIA MARIA BEATRIZ',                    firstName: 'TAPIA',       lastName: 'MARIA',       email: 'facturacion@luki.ec',            telefono: '0992825924',        contrato: '000000046', plan: 'ESPECIAL',              planId: null, role: 'cliente' as const, status: mapStatus('ACTIVO'),    maxDevices: 4, sessionDurationDays: 30, sessionLimitPolicy: 'block_new' as const, fechaInicio: '2020-09-04', fechaFin: '2026-02-11', isCmsUser: false },
    { nombre: 'BORJA PAZOS NELSON RODRIGO',             firstName: 'BORJA',       lastName: 'PAZOS',       email: 'facturacion@luki.ec',            telefono: '0991884152',        contrato: '000000047', plan: 'PLAN BASICO',           planId: null, role: 'cliente' as const, status: mapStatus('SUSPENDIDO'), maxDevices: 2, sessionDurationDays: 30, sessionLimitPolicy: 'block_new' as const, fechaInicio: '2020-09-05', fechaFin: '2021-09-29', isCmsUser: false },
    { nombre: 'FLORES SANTAMARIA LORENA MIRELLA',       firstName: 'FLORES',      lastName: 'SANTAMARIA',  email: 'jusbeck11@gmail.com',            telefono: '0985715903',        contrato: '000000048', plan: 'PLAN BASICO',           planId: null, role: 'cliente' as const, status: mapStatus('SUSPENDIDO'), maxDevices: 2, sessionDurationDays: 30, sessionLimitPolicy: 'block_new' as const, fechaInicio: '2020-09-05', fechaFin: '2022-11-25', isCmsUser: false },
    { nombre: 'SANTI SATAN MARIA DEL CARMEN',           firstName: 'SANTI',       lastName: 'SATAN',       email: 'facturacion@luki.ec',            telefono: '0995217820',        contrato: '000000049', plan: 'PLAN BASICO',           planId: null, role: 'cliente' as const, status: mapStatus('SUSPENDIDO'), maxDevices: 2, sessionDurationDays: 30, sessionLimitPolicy: 'block_new' as const, fechaInicio: '2020-09-05', fechaFin: '2022-09-26', isCmsUser: false },
    { nombre: 'TOCTE VELASQUE WILLAN ANIBAL',           firstName: 'TOCTE',       lastName: 'VELASQUE',    email: 'facturacion@luki.ec',            telefono: '0999734512',        contrato: '000000050', plan: 'PLAN BASICO',           planId: null, role: 'cliente' as const, status: mapStatus('SUSPENDIDO'), maxDevices: 2, sessionDurationDays: 30, sessionLimitPolicy: 'block_new' as const, fechaInicio: '2020-09-06', fechaFin: '2021-09-21', isCmsUser: false },
  ];

  return rawUsers.map((u, i) => ({
      id: `usr-${String(i + 1).padStart(3, '0')}`,
      nombre: u.nombre,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      telefono: u.telefono,
      plan: u.plan,
      planId: u.planId,
      fechaInicio: u.fechaInicio || new Date(Date.now() - (15 + i) * 86400000).toISOString().slice(0, 10),
      fechaFin: u.fechaFin || '',
      sesiones: i < 2 ? 1 : 0,
      contrato: u.contrato,
      status: u.status,
      role: u.role,
      mustChangePassword: u.role !== 'cliente',
      mfaEnabled: u.role !== 'cliente' && i === 0,
      isLocked: false,
      lockedUntil: null,
      lastLoginAt: i < 2 ? new Date(Date.now() - (i + 1) * 3600000).toISOString() : null,
      maxDevices: u.maxDevices,
      sessionDurationDays: u.sessionDurationDays,
      sessionLimitPolicy: u.sessionLimitPolicy,
      isCmsUser: u.isCmsUser,
      isSubscriber: !u.isCmsUser,
    }));
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

export async function adminListUsers(_accessToken: string): Promise<AdminUser[]> {
  // TODO: descomentar cuando la API esté lista
  // try {
  //   return await apiFetch<AdminUser[]>('/admin/users', accessToken);
  // } catch {
  //   syncAllMockUsersWithPlans();
  //   return mockUsersStore.map((user) => ({ ...user }));
  // }
  syncAllMockUsersWithPlans();
  return mockUsersStore.map((user) => ({ ...user }));
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
      status: data.status ?? (role === 'cliente' ? 'active' : 'pending'),
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
    saveMockUsers();
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
    saveMockUsers();
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
    saveMockUsers();
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
        saveMockUsers();
      }
    }
    return { message: 'Contraseña actualizada y sesiones revocadas.' };
  }
}

export async function adminSendRecoveryCode(email: string): Promise<{ message: string; code?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/send-recovery-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { message?: string }).message ?? 'Error al enviar código de recuperación');
    }
    return res.json();
  } catch {
    // Mock: generar código localmente si backend no disponible
    const user = mockUsersStore.find((u) => u.email === email);
    if (!user) return { message: 'Si el correo está registrado, recibirás el código de recuperación.' };
    const code = Math.random().toString(36).slice(-8).toUpperCase();
    return { message: `Código de recuperación generado para ${email}`, code };
  }
}

export async function adminGenerateActivationCode(userId: string, email: string): Promise<{ message: string; code?: string }> {
  try {
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
  } catch {
    // Mock: generar código localmente
    const code = Math.random().toString(36).slice(-8).toUpperCase();
    const index = mockUsersStore.findIndex((u) => u.id === userId);
    if (index >= 0) {
      mockUsersStore[index] = { ...mockUsersStore[index], status: 'pending' };
      saveMockUsers();
    }
    return { message: `Código de activación generado para ${email}`, code };
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
    saveMockUsers();
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
// Channels
// ---------------------------------------------------------------------------

let mockCanalesStore: AdminCanal[] = [
  {
    id: 'ch-001',
    nombre: 'Noticias 24',
    logo: '',
    streamUrl: 'https://g2qd3e2ay7an-hls-live.5centscdn.com/channel35/d0dbe915091d400bd8ee7f27f0791303.sdp/playlist.m3u8',
    detalle: 'Canal piloto con streaming real para pruebas del videowall.',
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
    streamUrl: 'https://g2qd3e2ay7an-hls-live.5centscdn.com/channel35/d0dbe915091d400bd8ee7f27f0791303.sdp/playlist.m3u8',
    detalle: 'Señal deportiva enlazada al stream operativo para demo visual.',
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
    streamUrl: 'https://g2qd3e2ay7an-hls-live.5centscdn.com/channel35/d0dbe915091d400bd8ee7f27f0791303.sdp/playlist.m3u8',
    detalle: 'Canal de cine enlazado al stream de prueba para poblar el monitor.',
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
    streamUrl: 'https://g2qd3e2ay7an-hls-live.5centscdn.com/channel35/d0dbe915091d400bd8ee7f27f0791303.sdp/playlist.m3u8',
    detalle: 'Programacion infantil segura con controles parentales activos.',
    categoria: 'Infantil',
    tipo: 'live',
    requiereControlParental: true,
    activo: true,
    creadoEn: '2026-04-01T11:00:00.000Z',
    actualizadoEn: '2026-04-01T11:00:00.000Z',
  },
  {
    id: 'ch-005',
    nombre: 'Musica Live',
    logo: '',
    streamUrl: 'https://g2qd3e2ay7an-hls-live.5centscdn.com/channel35/d0dbe915091d400bd8ee7f27f0791303.sdp/playlist.m3u8',
    detalle: 'Conciertos y listas de reproduccion en vivo.',
    categoria: 'Música',
    tipo: 'live',
    requiereControlParental: false,
    activo: true,
    creadoEn: '2026-04-01T12:00:00.000Z',
    actualizadoEn: '2026-04-01T12:00:00.000Z',
  },
  {
    id: 'ch-006',
    nombre: 'Luki Noticias 2',
    logo: '',
    streamUrl: 'https://g2qd3e2ay7an-hls-live.5centscdn.com/channel35/d0dbe915091d400bd8ee7f27f0791303.sdp/playlist.m3u8',
    detalle: 'Segunda señal de prueba para completar el wall.',
    categoria: 'Noticias',
    tipo: 'live',
    requiereControlParental: false,
    activo: true,
    creadoEn: '2026-04-01T13:00:00.000Z',
    actualizadoEn: '2026-04-01T13:00:00.000Z',
  },
  {
    id: 'ch-007',
    nombre: 'Zona Deportes',
    logo: '',
    streamUrl: 'https://g2qd3e2ay7an-hls-live.5centscdn.com/channel35/d0dbe915091d400bd8ee7f27f0791303.sdp/playlist.m3u8',
    detalle: 'Señal espejo para pruebas operativas del monitor.',
    categoria: 'Deportes',
    tipo: 'live',
    requiereControlParental: false,
    activo: true,
    creadoEn: '2026-04-01T14:00:00.000Z',
    actualizadoEn: '2026-04-01T14:00:00.000Z',
  },
  {
    id: 'ch-008',
    nombre: 'Cine Premier',
    logo: '',
    streamUrl: 'https://g2qd3e2ay7an-hls-live.5centscdn.com/channel35/d0dbe915091d400bd8ee7f27f0791303.sdp/playlist.m3u8',
    detalle: 'Canal de demostración para poblar la fila inferior.',
    categoria: 'Cine',
    tipo: 'live',
    requiereControlParental: false,
    activo: true,
    creadoEn: '2026-04-01T15:00:00.000Z',
    actualizadoEn: '2026-04-01T15:00:00.000Z',
  },
  {
    id: 'ch-009',
    nombre: 'Kids Fun',
    logo: '',
    streamUrl: 'https://g2qd3e2ay7an-hls-live.5centscdn.com/channel35/d0dbe915091d400bd8ee7f27f0791303.sdp/playlist.m3u8',
    detalle: 'Canal infantil adicional para completar el mosaico 3x3.',
    categoria: 'Infantil',
    tipo: 'live',
    requiereControlParental: true,
    activo: true,
    creadoEn: '2026-04-01T16:00:00.000Z',
    actualizadoEn: '2026-04-01T16:00:00.000Z',
  },
];

export async function adminListCanales(accessToken: string): Promise<AdminCanal[]> {
  try {
    const canales = await apiFetch<AdminCanal[]>('/admin/canales', accessToken);
    return canales.length ? canales : mockCanalesStore.map((canal) => ({ ...canal }));
  }
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
  { id: 'cat-001', nombre: 'Películas',              descripcion: 'Largometrajes, estrenos, cine clásico y especiales para el player.',               icono: 'film',           activo: true },
  { id: 'cat-002', nombre: 'Series',                 descripcion: 'Series por temporadas, sagas y contenido episódico.',                             icono: 'list-alt',       activo: true },
  { id: 'cat-003', nombre: 'Documentales',           descripcion: 'Historia, naturaleza, ciencia y especiales documentales.',                        icono: 'globe',          activo: true },
  { id: 'cat-004', nombre: 'Infantil',               descripcion: 'Contenido para niños con curaduría y enfoque familiar.',                          icono: 'child',          activo: true },
  { id: 'cat-005', nombre: 'Deportes',               descripcion: 'Eventos deportivos, resúmenes, ligas y programación especializada.',              icono: 'futbol-o',       activo: true },
  { id: 'cat-006', nombre: 'Música y conciertos',    descripcion: 'Videoclips, conciertos, festivales y especiales musicales.',                     icono: 'music',          activo: true },
  { id: 'cat-007', nombre: 'Noticias y actualidad',  descripcion: 'Cobertura informativa, análisis y noticias en tiempo real.',                      icono: 'newspaper-o',    activo: true },
  { id: 'cat-008', nombre: 'Estilo de vida',         descripcion: 'Bienestar, moda, hogar, salud y entretenimiento lifestyle.',                      icono: 'heart-o',        activo: true },
  { id: 'cat-009', nombre: 'Educación',              descripcion: 'Aprendizaje, formación, cursos y contenido didáctico.',                           icono: 'graduation-cap', active: true },
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
