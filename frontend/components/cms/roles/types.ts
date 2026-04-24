import type { ComponentProps } from 'react';
import type FontAwesome from '@expo/vector-icons/FontAwesome';

export type FAIconName = ComponentProps<typeof FontAwesome>['name'];

/** A CMS sidebar module with its associated permission key. */
export interface CmsModule {
  key: string;
  label: string;
  icon: FAIconName;
  path: string;
}

/** CMS module definitions — single source of truth for sidebar + permission toggles. */
export const CMS_MODULES: CmsModule[] = [
  { key: 'cms:dashboard',       label: 'Dashboard',             icon: 'th-large',     path: '/cms/dashboard' },
  { key: 'cms:users',           label: 'Usuarios',              icon: 'users',        path: '/cms/users' },
  { key: 'cms:componentes',     label: 'Componentes',           icon: 'puzzle-piece', path: '/cms/componentes' },
  { key: 'cms:planes',          label: 'Planes',                icon: 'star',         path: '/cms/planes' },
  { key: 'cms:canales',         label: 'Canales',               icon: 'tv',           path: '/cms/canales' },
  { key: 'cms:categorias',      label: 'Categorías',            icon: 'tags',         path: '/cms/categorias' },
  { key: 'cms:sliders',         label: 'Sliders',               icon: 'image',        path: '/cms/sliders' },
  { key: 'cms:monitor',         label: 'Monitor',               icon: 'bar-chart',    path: '/cms/monitor' },
  { key: 'cms:notif-admin',     label: 'Notif. Admin',          icon: 'bell',         path: '/cms/notificaciones-admin' },
  { key: 'cms:analitica',       label: 'Analítica',             icon: 'line-chart',   path: '/cms/analitica' },
  { key: 'cms:propaganda',      label: 'Propaganda',            icon: 'bullhorn',     path: '/cms/propaganda' },
  { key: 'cms:notif-abonado',   label: 'Notif. Abonado',        icon: 'commenting',   path: '/cms/notificaciones-abonado' },
  { key: 'cms:roles',           label: 'Roles',                 icon: 'shield',       path: '/cms/roles' },
];

/** Toggleable modules (excludes cms:roles which is SUPERADMIN-only). */
export const TOGGLEABLE_MODULES = CMS_MODULES.filter((m) => m.key !== 'cms:roles');

/**
 * Operations each module supports.
 * Drives the permission matrix UI.
 */
export const MODULE_OPS: Record<string, ('read' | 'write')[]> = {
  'cms:dashboard':     ['read'],
  'cms:users':         ['read', 'write'],
  'cms:componentes':   ['read', 'write'],
  'cms:planes':        ['read', 'write'],
  'cms:canales':       ['read', 'write'],
  'cms:categorias':    ['read', 'write'],
  'cms:sliders':       ['read', 'write'],
  'cms:monitor':       ['read'],
  'cms:notif-admin':   ['write'],
  'cms:analitica':     ['read'],
  'cms:propaganda':    ['write'],
  'cms:notif-abonado': ['write'],
  'cms:roles':         [],
};

// ─── Default permission sets ─────────────────────────────────────────────────

/** Default permissions for the ADMIN role. */
export const ADMIN_DEFAULT_PERMISSIONS: string[] = [
  'cms:dashboard', 'cms:dashboard:read',
  'cms:users', 'cms:users:read', 'cms:users:write',
  'cms:planes', 'cms:planes:read', 'cms:planes:write',
  'cms:canales', 'cms:canales:read', 'cms:canales:write',
  'cms:categorias', 'cms:categorias:read', 'cms:categorias:write',
  'cms:sliders', 'cms:sliders:read', 'cms:sliders:write',
  'cms:componentes', 'cms:componentes:read', 'cms:componentes:write',
  'cms:monitor', 'cms:monitor:read',
  'cms:notif-admin', 'cms:notif-admin:write',
  'cms:analitica', 'cms:analitica:read',
  'cms:propaganda', 'cms:propaganda:write',
  'cms:notif-abonado', 'cms:notif-abonado:write',
];

/** Default permissions for the SOPORTE role. */
export const SOPORTE_DEFAULT_PERMISSIONS: string[] = [
  'cms:dashboard', 'cms:dashboard:read',
  'cms:users', 'cms:users:read', 'cms:users:write',
  'cms:canales:read',               // no write — stream URL hidden server-side
  'cms:monitor', 'cms:monitor:read',
  'cms:notif-abonado', 'cms:notif-abonado:write',
];

// ─── Per-module permission matrix ────────────────────────────────────────────

/** A single operation toggle within a module row. */
export interface ModuleOp {
  key: string;     // e.g. 'cms:canales:read'
  enabled: boolean;
  locked: boolean;
}

/** A row in the permission matrix: one entry per module with optional read/write ops. */
export interface ModulePermissionRow {
  moduleKey: string;   // e.g. 'cms:canales'
  label: string;
  icon: FAIconName;
  read?: ModuleOp;
  write?: ModuleOp;
}

/**
 * Returns true if the given permissions array effectively grants the target key.
 * Handles: exact match, wildcard (cms:*), and parent-implies-children.
 */
function permGranted(perms: string[], key: string): boolean {
  return (
    perms.includes('cms:*') ||
    perms.includes(key) ||
    perms.some((p) => p !== 'cms:*' && key.startsWith(p + ':'))
  );
}

/**
 * Build the per-module permission matrix for a given role and its current permissions.
 */
export function buildModulePermissions(
  role: string,
  currentPermissions: string[] | null | undefined,
  editable = false,
): ModulePermissionRow[] {
  const isSuperadmin = role === 'superadmin';
  const isCliente    = role === 'cliente';
  const perms        = Array.isArray(currentPermissions) ? currentPermissions : [];
  const locked       = isSuperadmin || isCliente || !editable;

  return TOGGLEABLE_MODULES
    .filter((mod) => (MODULE_OPS[mod.key]?.length ?? 0) > 0)
    .map((mod) => {
      const ops = MODULE_OPS[mod.key] ?? [];
      const row: ModulePermissionRow = {
        moduleKey: mod.key,
        label:     mod.label,
        icon:      mod.icon,
      };

      if (ops.includes('read')) {
        row.read = {
          key:     `${mod.key}:read`,
          enabled: isSuperadmin || permGranted(perms, `${mod.key}:read`),
          locked,
        };
      }

      if (ops.includes('write')) {
        row.write = {
          key:     `${mod.key}:write`,
          enabled: isSuperadmin || permGranted(perms, `${mod.key}:write`),
          locked,
        };
      }

      return row;
    });
}

// ─── Legacy helpers (kept for any remaining usages) ──────────────────────────

/** Role display metadata. */
export const ROLE_META: Record<string, { label: string; color: string; icon: FAIconName; description: string }> = {
  superadmin: { label: 'Super Admin',    color: '#FFB800', icon: 'user-secret',  description: 'Control total del sistema. Todos los permisos, gestión de roles.' },
  admin:      { label: 'Administrador',  color: '#B490FF', icon: 'user-plus',    description: 'Gestión operativa. Permisos configurables por el Super Admin.' },
  soporte:    { label: 'Soporte',        color: '#10B981', icon: 'headphones',   description: 'Atención al cliente. Lectura en módulos asignados.' },
  cliente:    { label: 'Cliente',        color: '#8B72B2', icon: 'user',         description: 'Suscriptor/Abonado. Solo acceso a la app OTT.' },
};

/** Item passed to the legacy PermissionToggles component. */
export interface PermissionToggleItem {
  key: string;
  label: string;
  description?: string;
  icon: FAIconName;
  path?: string;
  enabled: boolean;
  locked: boolean;
  lockReason?: string;
}

