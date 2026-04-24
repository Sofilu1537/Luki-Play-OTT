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

/** Toggleable modules (excludes cms:roles which is SUPERADMIN-only). */
export const TOGGLEABLE_MODULES = CMS_MODULES.filter((m) => m.key !== 'cms:roles');

/** Role display metadata. */
export const ROLE_META: Record<string, { label: string; color: string; icon: FAIconName; description: string }> = {
  superadmin: { label: 'Super Admin',    color: '#FFB800', icon: 'user-secret',  description: 'Control total del sistema. Todos los permisos, gestión de roles.' },
  admin:      { label: 'Administrador',  color: '#B490FF', icon: 'user-plus',    description: 'Gestión operativa. Permisos configurables por el Super Admin.' },
  soporte:    { label: 'Soporte',        color: '#10B981', icon: 'headphones',   description: 'Atención al cliente. Lectura en módulos asignados.' },
  cliente:    { label: 'Cliente',        color: '#8B72B2', icon: 'user',         description: 'Suscriptor/Abonado. Solo acceso a la app OTT.' },
};

/** Item passed to the PermissionToggles component. */
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

/**
 * Content operation permissions — controls what API operations are allowed.
 */
export const CONTENT_PERM_DEFS = [
  {
    key: 'cms:content:read',
    label: 'Lectura de contenido',
    description: 'Ver canales, categorías, sliders y planes desde la API',
    icon: 'eye' as FAIconName,
  },
  {
    key: 'cms:content:write',
    label: 'Escritura de contenido',
    description: 'Crear, editar, eliminar canales, categorías y sliders',
    icon: 'pencil' as FAIconName,
  },
];

/** Build module toggle items for a given role and its current permissions. */
export function buildToggleItems(
  role: string,
  currentPermissions: string[],
  editable = false,
): PermissionToggleItem[] {
  const isSuperadmin = role === 'superadmin';
  const isCliente = role === 'cliente';

  return TOGGLEABLE_MODULES.map((mod) => ({
    key: mod.key,
    label: mod.label,
    icon: mod.icon,
    path: mod.path,
    enabled: isSuperadmin || currentPermissions.includes(mod.key),
    locked: isSuperadmin || isCliente || !editable,
    lockReason: isSuperadmin
      ? 'Super Admin tiene todos los permisos'
      : isCliente
        ? 'Clientes no tienen acceso al CMS'
        : !editable
          ? undefined
          : undefined,
  }));
}

/** Build content-permission toggle items for a given role and its current permissions. */
export function buildContentPermItems(
  role: string,
  currentPermissions: string[],
  editable = false,
): PermissionToggleItem[] {
  const isSuperadmin = role === 'superadmin';
  const isCliente = role === 'cliente';

  return CONTENT_PERM_DEFS.map((def) => ({
    key: def.key,
    label: def.label,
    description: def.description,
    icon: def.icon,
    enabled: isSuperadmin || currentPermissions.includes(def.key),
    locked: isSuperadmin || isCliente || !editable,
    lockReason: isSuperadmin
      ? 'Super Admin tiene todos los permisos'
      : isCliente
        ? 'No disponible para Clientes'
        : undefined,
  }));
}
