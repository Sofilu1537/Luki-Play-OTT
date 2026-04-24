-- Set sensible default permissions for ADMIN and SOPORTE roles.
--
-- The initial migration (20260423000000_add_cms_roles) seeded both roles with
-- empty permissions arrays. This migration fills in the expected defaults so
-- that out-of-the-box installations work without manual configuration.
--
-- ADMIN  — full operational access (everything except role management)
-- SOPORTE — read/monitor access for support staff

UPDATE "cms_roles"
SET "permissions" = ARRAY[
  'cms:dashboard',
  'cms:users',
  'cms:users:read',
  'cms:users:write',
  'cms:content:read',
  'cms:content:write',
  'cms:monitor',
  'cms:notif-abonado',
  'cms:notif-admin',
  'cms:canales',
  'cms:categorias',
  'cms:componentes',
  'cms:sliders',
  'cms:planes',
  'cms:analitica',
  'cms:propaganda'
]::TEXT[],
    "updatedAt" = NOW()
WHERE "key" = 'ADMIN';

UPDATE "cms_roles"
SET "permissions" = ARRAY[
  'cms:dashboard',
  'cms:users',
  'cms:users:read',
  'cms:monitor',
  'cms:notif-abonado',
  'cms:content:read'
]::TEXT[],
    "updatedAt" = NOW()
WHERE "key" = 'SOPORTE';
