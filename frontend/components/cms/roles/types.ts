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
  { key: 'cms:notif-admin',     label: 'Notif. Administrador',  icon: 'bell',         path: '/cms/notificaciones-admin' },
  { key: 'cms:analitica',       label: 'Analítica',             icon: 'line-chart',   path: '/cms/analitica' },
  { key: 'cms:propaganda',      label: 'Propaganda',            icon: 'bullhorn',     path: '/cms/propaganda' },
  { key: 'cms:notif-abonado',   label: 'Notif. Abonado',       icon: 'commenting',   path: '/cms/notificaciones-abonado' },
  { key: 'cms:roles',           label: 'Roles',                 icon: 'shield',       path: '/cms/roles' },
];

/** Toggleable modules (excludes cms:roles which is SUPERADMIN-only and not toggleable). */
export const TOGGLEABLE_MODULES = CMS_MODULES.filter((m) => m.key !== 'cms:roles');

/** Default permissions for the SOPORTE role (fixed, not editable). */
export const SOPORTE_DEFAULT_PERMISSIONS: string[] = [
  'cms:dashboard',
  'cms:users',
  'cms:canales',
  'cms:monitor',
  'cms:analitica',
];

/** Role display metadata. */
export const ROLE_META: Record<string, { label: string; color: string; icon: FAIconName; description: string }> = {
  superadmin: { label: 'Super Admin',    color: '#FFB800', icon: 'user-secret',  description: 'Control total del sistema. Todos los permisos, gestión de roles.' },
  admin:      { label: 'Administrador',  color: '#B490FF', icon: 'user-plus',    description: 'Gestión operativa. Permisos configurables por Super Admin.' },
  soporte:    { label: 'Soporte',        color: '#10B981', icon: 'headphones',   description: 'Atención al cliente. Lectura en módulos asignados.' },
  cliente:    { label: 'Cliente',        color: '#8B72B2', icon: 'user',         description: 'Suscriptor/Abonado. Solo acceso a la app OTT.' },
};

/** Item passed to the PermissionToggles component. */
export interface PermissionToggleItem {
  key: string;
  label: string;
  icon: FAIconName;
  path: string;
  enabled: boolean;
  locked: boolean;
  lockReason?: string;
}

/** Build toggle items for a given role and its current permissions. */
export function buildToggleItems(
  role: string,
  currentPermissions: string[],
): PermissionToggleItem[] {
  return TOGGLEABLE_MODULES.map((mod) => {
    const isSuperadmin = role === 'superadmin';
    const isSoporte = role === 'soporte';
    const soporteHas = SOPORTE_DEFAULT_PERMISSIONS.includes(mod.key);

    return {
      key: mod.key,
      label: mod.label,
      icon: mod.icon,
      path: mod.path,
      enabled: isSuperadmin || currentPermissions.includes(mod.key) || (isSoporte && soporteHas),
      locked: isSuperadmin || isSoporte,
      lockReason: isSuperadmin
        ? 'Super Admin tiene todos los permisos'
        : isSoporte
          ? (soporteHas ? 'Permiso fijo para Soporte' : 'No disponible para Soporte')
          : undefined,
    };
  });
}
