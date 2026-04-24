/**
 * CMS module definitions — single source of truth for sidebar items and permission keys.
 */
export const CMS_MODULES = [
  {
    key: 'cms:dashboard',
    label: 'Dashboard',
    icon: 'th-large',
    path: '/cms/dashboard',
  },
  { key: 'cms:users', label: 'Usuarios', icon: 'users', path: '/cms/users' },
  {
    key: 'cms:componentes',
    label: 'Componentes',
    icon: 'puzzle-piece',
    path: '/cms/componentes',
  },
  { key: 'cms:planes', label: 'Planes', icon: 'star', path: '/cms/planes' },
  { key: 'cms:canales', label: 'Canales', icon: 'tv', path: '/cms/canales' },
  {
    key: 'cms:categorias',
    label: 'Categorías',
    icon: 'tags',
    path: '/cms/categorias',
  },
  { key: 'cms:sliders', label: 'Sliders', icon: 'image', path: '/cms/sliders' },
  {
    key: 'cms:monitor',
    label: 'Monitor',
    icon: 'bar-chart',
    path: '/cms/monitor',
  },
  {
    key: 'cms:notif-admin',
    label: 'Notif. Administrador',
    icon: 'bell',
    path: '/cms/notificaciones-admin',
  },
  {
    key: 'cms:analitica',
    label: 'Analítica',
    icon: 'line-chart',
    path: '/cms/analitica',
  },
  {
    key: 'cms:propaganda',
    label: 'Propaganda',
    icon: 'bullhorn',
    path: '/cms/propaganda',
  },
  {
    key: 'cms:notif-abonado',
    label: 'Notif. Abonado',
    icon: 'commenting',
    path: '/cms/notificaciones-abonado',
  },
  { key: 'cms:roles', label: 'Roles', icon: 'shield', path: '/cms/roles' },
] as const;

/**
 * Operations available per module.
 * Drives the permission matrix UI and granular key generation.
 */
export const MODULE_OPS: Record<string, ('read' | 'write')[]> = {
  'cms:dashboard':    ['read'],
  'cms:users':        ['read', 'write'],
  'cms:componentes':  ['read', 'write'],
  'cms:planes':       ['read', 'write'],
  'cms:canales':      ['read', 'write'],
  'cms:categorias':   ['read', 'write'],
  'cms:sliders':      ['read', 'write'],
  'cms:monitor':      ['read'],
  'cms:notif-admin':  ['write'],
  'cms:analitica':    ['read'],
  'cms:propaganda':   ['write'],
  'cms:notif-abonado':['write'],
  'cms:roles':        [],
};

/**
 * All valid permission keys accepted by the system.
 * Used to sanitize permission arrays before persisting them.
 */
export const VALID_CMS_PERMISSIONS: string[] = [
  // Module-level keys (sidebar visibility + backward compat)
  ...CMS_MODULES.map((m) => m.key),
  // Wildcard
  'cms:*',
  // Granular per-module operation keys
  'cms:dashboard:read',
  'cms:users:read',
  'cms:users:write',
  'cms:componentes:read',
  'cms:componentes:write',
  'cms:planes:read',
  'cms:planes:write',
  'cms:canales:read',
  'cms:canales:write',
  'cms:categorias:read',
  'cms:categorias:write',
  'cms:sliders:read',
  'cms:sliders:write',
  'cms:monitor:read',
  'cms:notif-admin:write',
  'cms:analitica:read',
  'cms:propaganda:write',
  'cms:notif-abonado:write',
  // Legacy content keys (kept for backward compat with existing sessions)
  'cms:content:read',
  'cms:content:write',
  // Subscription management
  'cms:subscriptions:read',
  'cms:subscriptions:create',
  'cms:subscriptions:renew',
  'cms:subscriptions:cancel',
  // App permissions
  'app:playback',
  'app:profiles',
];

/**
 * Filters a permission array to only include valid, known permission keys.
 */
export function sanitizePermissions(permissions: string[]): string[] {
  const valid = new Set(VALID_CMS_PERMISSIONS);
  return [...new Set(permissions.filter((p) => valid.has(p)))];
}
