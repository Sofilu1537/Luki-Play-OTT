import { UserRole } from '../../auth/domain/entities/user.entity';

/**
 * CMS module definitions — single source of truth for sidebar items and permission keys.
 */
export const CMS_MODULES = [
  { key: 'cms:dashboard',       label: 'Dashboard',             icon: 'th-large',     path: '/cms/dashboard' },
  { key: 'cms:users',           label: 'Usuarios',              icon: 'users',        path: '/cms/users' },
  { key: 'cms:componentes',     label: 'Componentes',           icon: 'puzzle-piece', path: '/cms/componentes' },
  { key: 'cms:planes',          label: 'Planes',                icon: 'star',         path: '/cms/planes' },
  { key: 'cms:canales',         label: 'Canales',               icon: 'tv',           path: '/cms/canales' },
  { key: 'cms:categorias',      label: 'Categorías',            icon: 'tags',         path: '/cms/categorias' },
  { key: 'cms:sliders',         label: 'Sliders',               icon: 'image',        path: '/cms/sliders' },
  { key: 'cms:monitor',         label: 'Monitor',               icon: 'bar-chart',    path: '/cms/monitor' },
  { key: 'cms:notif-admin',     label: 'Notif. Administrador',  icon: 'bell',         path: '/cms/notificaciones-admin' },
  { key: 'cms:analitica',       label: 'Analítica',             icon: 'line-chart',   path: '/cms/analitica' },
  { key: 'cms:propaganda',      label: 'Propaganda',            icon: 'bullhorn',     path: '/cms/propaganda' },
  { key: 'cms:notif-abonado',   label: 'Notif. Abonado',       icon: 'commenting',   path: '/cms/notificaciones-abonado' },
  { key: 'cms:roles',           label: 'Roles',                 icon: 'shield',       path: '/cms/roles' },
] as const;

/** Default permissions for SOPORTE role (read-only on select modules). */
export const SOPORTE_DEFAULT_PERMISSIONS: string[] = [
  'cms:dashboard',
  'cms:users',
  'cms:canales',
  'cms:monitor',
  'cms:analitica',
];

/**
 * Static mapping from each {@link UserRole} to its base permission strings.
 *
 * - SUPERADMIN: `cms:*` wildcard grants all CMS permissions.
 * - ADMIN: empty base — actual permissions stored in Customer.permissions (BD).
 * - SOPORTE: fixed read-only modules.
 * - CLIENTE: app-only permissions.
 */
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  [UserRole.SUPERADMIN]: [
    'cms:*',
    'cms:users:read',
    'cms:users:write',
    'cms:content:read',
    'cms:content:write',
    'cms:analytics:read',
    'cms:settings:read',
    'cms:settings:write',
    'app:playback',
    'app:profiles',
  ],
  [UserRole.ADMIN]: [],
  [UserRole.SOPORTE]: [
    ...SOPORTE_DEFAULT_PERMISSIONS,
    'cms:users:read',
    'cms:content:read',
    'cms:analytics:read',
  ],
  [UserRole.CLIENTE]: ['app:playback', 'app:profiles'],
};

/**
 * Returns the resolved permissions for a user.
 *
 * - SUPERADMIN/SOPORTE/CLIENTE: static from ROLE_PERMISSIONS.
 * - ADMIN: merges base ROLE_PERMISSIONS with dynamic permissions from the database.
 *
 * @param role - The user role.
 * @param dynamicPermissions - Permissions stored in Customer.permissions (for ADMIN role).
 */
export function getPermissionsForRole(role: UserRole, dynamicPermissions?: string[]): string[] {
  const base = ROLE_PERMISSIONS[role] ?? [];
  if (role === UserRole.ADMIN && dynamicPermissions?.length) {
    const merged = new Set([...base, ...dynamicPermissions]);
    return Array.from(merged);
  }
  return base;
}