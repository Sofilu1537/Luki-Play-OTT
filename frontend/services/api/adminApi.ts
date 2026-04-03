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
  email: string;
  telefono: string | null;
  plan: string;
  fechaInicio: string;
  fechaFin: string;
  sesiones: number;
  contrato: string | null;
  status: string;
  role: string;
}

export interface AdminPlan {
  id: string;
  nombre: string;
  precio: number;
  moneda: string;
  duracionDias: number;
  descripcion: string;
  activo: boolean;
}

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
  categoria: string;
  activo: boolean;
}

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
  const plans = ['Full', 'Basic', 'Premium', 'Full'];
  const statuses = ['ACTIVO', 'ACTIVO', 'ACTIVO', 'SUSPENDIDO', 'CORTADO'];
  const rawUsers = [
    { nombre: 'JOSE MORA',        email: 'josemoral1984g@gmail.com',  telefono: null,          contrato: 'CONTRACT-001' },
    { nombre: 'NEGRETE MONICA',   email: 'negretemonika489@gmail.com', telefono: '6647673852',  contrato: 'CONTRACT-002' },
    { nombre: 'RODRIGUEZ CARLOS', email: 'carlos.rod@hotmail.com',    telefono: '3001234567',  contrato: 'CONTRACT-003' },
    { nombre: 'GARCIA ANA',       email: 'ana.garcia@gmail.com',      telefono: '3109876543',  contrato: 'CONTRACT-004' },
    { nombre: 'LOPEZ PEDRO',      email: 'pedro.lopez@gmail.com',     telefono: null,          contrato: null },
    { nombre: 'MARTINEZ LUISA',   email: 'luisa.m@outlook.com',       telefono: '3204567890',  contrato: 'CONTRACT-005' },
    { nombre: 'HERNANDEZ JORGE',  email: 'jhernandez@gmail.com',      telefono: '3156789012',  contrato: 'CONTRACT-006' },
    { nombre: 'TORRES CAMILA',    email: 'camila.torres@gmail.com',   telefono: null,          contrato: 'CONTRACT-007' },
    { nombre: 'VARGAS DIANA',     email: 'dvargas2024@gmail.com',     telefono: '3012345678',  contrato: null },
    { nombre: 'SANCHEZ MIGUEL',   email: 'msanchez@hotmail.com',      telefono: '3189012345',  contrato: 'CONTRACT-008' },
    { nombre: 'RAMIREZ ANDREA',   email: 'andrea.ramirez@gmail.com',  telefono: '3024567890',  contrato: 'CONTRACT-009' },
    { nombre: 'CASTRO ROBERTO',   email: 'rcastro@yahoo.com',         telefono: null,          contrato: null },
    { nombre: 'ORTIZ NATALIA',    email: 'natalia.ortiz@gmail.com',   telefono: '3134567890',  contrato: 'CONTRACT-010' },
    { nombre: 'MORALES FELIPE',   email: 'fmorales@gmail.com',        telefono: '3167891234',  contrato: 'CONTRACT-011' },
    { nombre: 'PEREZ VALENTINA',  email: 'vperez@hotmail.com',        telefono: '3053456789',  contrato: 'CONTRACT-012' },
    { nombre: 'ROJAS ALEJANDRO',  email: 'arojas@gmail.com',          telefono: null,          contrato: 'CONTRACT-013' },
    { nombre: 'SILVA CAROLINA',   email: 'carolina.silva@gmail.com',  telefono: '3087654321',  contrato: null },
    { nombre: 'GOMEZ SERGIO',     email: 'sgomez@outlook.com',        telefono: '3221234567',  contrato: 'CONTRACT-014' },
    { nombre: 'DIAZ PAOLA',       email: 'paola.diaz@gmail.com',      telefono: '3145678901',  contrato: 'CONTRACT-015' },
    { nombre: 'LEON JUAN',        email: 'jleon2023@gmail.com',       telefono: null,          contrato: 'CONTRACT-016' },
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
      email: u.email,
      telefono: u.telefono,
      plan: plans[i % plans.length],
      fechaInicio: start.toISOString().slice(0, 10),
      fechaFin: end.toISOString().slice(0, 10),
      sesiones: Math.floor(Math.random() * 5) + 1,
      contrato: u.contrato,
      status: statuses[i % statuses.length],
      role: u.contrato ? 'CLIENTE' : 'CLIENTE',
    };
  });
}

export async function adminListUsers(accessToken: string): Promise<AdminUser[]> {
  try {
    return await apiFetch<AdminUser[]>('/admin/users', accessToken);
  } catch {
    // Backend not yet wired → return mock data
    return [...mockUsersStore];
  }
}

export async function adminCreateUser(
  accessToken: string,
  data: { nombre: string; email: string; telefono: string; plan: string; contrato: string },
): Promise<AdminUser> {
  try {
    return await apiFetch<AdminUser>('/admin/users', accessToken, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  } catch {
    // Fallback mock
    const now = new Date();
    const end = new Date(now);
    end.setDate(end.getDate() + 30);
    const newUser: AdminUser = {
      id: `usr-${Date.now()}`,
      nombre: data.nombre.toUpperCase(),
      email: data.email,
      telefono: data.telefono || null,
      plan: data.plan,
      fechaInicio: now.toISOString().slice(0, 10),
      fechaFin: end.toISOString().slice(0, 10),
      sesiones: 0,
      contrato: data.contrato || null,
      status: 'ACTIVO',
      role: 'CLIENTE',
    };
    mockUsersStore = [newUser, ...mockUsersStore];
    return newUser;
  }
}

export async function adminDeleteUser(accessToken: string, id: string): Promise<void> {
  try {
    await apiFetch<void>(`/admin/users/${id}`, accessToken, { method: 'DELETE' });
  } catch {
    mockUsersStore = mockUsersStore.filter((u) => u.id !== id);
  }
}

// ---------------------------------------------------------------------------
// Plans
// ---------------------------------------------------------------------------

const mockPlans: AdminPlan[] = [
  { id: 'plan-001', nombre: 'Basic',   precio: 9.99,  moneda: 'USD', duracionDias: 30, descripcion: 'Acceso básico a contenido estándar',   activo: true },
  { id: 'plan-002', nombre: 'Full',    precio: 19.99, moneda: 'USD', duracionDias: 30, descripcion: 'Acceso completo a todo el catálogo',     activo: true },
  { id: 'plan-003', nombre: 'Premium', precio: 29.99, moneda: 'USD', duracionDias: 30, descripcion: 'Acceso Premium con 4K y descargas',      activo: true },
  { id: 'plan-004', nombre: 'ISP Bundle', precio: 0, moneda: 'USD', duracionDias: 30, descripcion: 'Incluido con plan de internet del ISP', activo: true },
];

export async function adminListPlans(accessToken: string): Promise<AdminPlan[]> {
  try { return await apiFetch<AdminPlan[]>('/admin/planes', accessToken); }
  catch { return [...mockPlans]; }
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

const mockCanales: AdminCanal[] = [
  { id: 'ch-001', nombre: 'Noticias 24',  logo: '', streamUrl: 'https://stream.example.com/noticias24',  categoria: 'Noticias',   activo: true },
  { id: 'ch-002', nombre: 'Deportes HD',  logo: '', streamUrl: 'https://stream.example.com/deportes',   categoria: 'Deportes',   activo: true },
  { id: 'ch-003', nombre: 'Cine Clásico', logo: '', streamUrl: 'https://stream.example.com/cine',       categoria: 'Cine',       activo: true },
  { id: 'ch-004', nombre: 'Infantil TV',  logo: '', streamUrl: 'https://stream.example.com/infantil',  categoria: 'Infantil',   activo: false },
  { id: 'ch-005', nombre: 'Música Live',  logo: '', streamUrl: 'https://stream.example.com/musica',    categoria: 'Música',     activo: true },
];

export async function adminListCanales(accessToken: string): Promise<AdminCanal[]> {
  try { return await apiFetch<AdminCanal[]>('/admin/canales', accessToken); }
  catch { return [...mockCanales]; }
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
      usuariosActivos: mockUsersStore.filter((u) => u.status === 'ACTIVO').length,
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
