-- Redefine ADMIN and SOPORTE permissions with granular per-module operation keys.
--
-- ADMIN: full operational access — read + write per module (no role management)
-- SOPORTE: limited access — dashboard read, users read+write, canales read-only
--          (stream URLs hidden server-side), monitor read, notif-abonado write

UPDATE "cms_roles"
SET "permissions" = ARRAY[
  -- Dashboard
  'cms:dashboard', 'cms:dashboard:read',
  -- Usuarios
  'cms:users', 'cms:users:read', 'cms:users:write',
  -- Planes
  'cms:planes', 'cms:planes:read', 'cms:planes:write',
  -- Canales
  'cms:canales', 'cms:canales:read', 'cms:canales:write',
  -- Categorías
  'cms:categorias', 'cms:categorias:read', 'cms:categorias:write',
  -- Sliders
  'cms:sliders', 'cms:sliders:read', 'cms:sliders:write',
  -- Componentes
  'cms:componentes', 'cms:componentes:read', 'cms:componentes:write',
  -- Monitor
  'cms:monitor', 'cms:monitor:read',
  -- Notificaciones Admin
  'cms:notif-admin', 'cms:notif-admin:write',
  -- Analítica
  'cms:analitica', 'cms:analitica:read',
  -- Propaganda
  'cms:propaganda', 'cms:propaganda:write',
  -- Notificaciones Abonado
  'cms:notif-abonado', 'cms:notif-abonado:write'
]::TEXT[],
    "updatedAt" = NOW()
WHERE "key" = 'ADMIN';

UPDATE "cms_roles"
SET "permissions" = ARRAY[
  -- Dashboard
  'cms:dashboard', 'cms:dashboard:read',
  -- Usuarios (read + write para soporte)
  'cms:users', 'cms:users:read', 'cms:users:write',
  -- Canales (solo lectura — stream URL oculta por el servidor)
  'cms:canales:read',
  -- Monitor
  'cms:monitor', 'cms:monitor:read',
  -- Notificaciones Abonado
  'cms:notif-abonado', 'cms:notif-abonado:write'
]::TEXT[],
    "updatedAt" = NOW()
WHERE "key" = 'SOPORTE';
