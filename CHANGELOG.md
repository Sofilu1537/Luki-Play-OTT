# Changelog — LUKI Play OTT

Todos los cambios notables del proyecto se documentan en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/)
y este proyecto sigue [Versionado Semántico](https://semver.org/lang/es/).

---

## [0.3.0-beta] — 2026-04

### Añadido

#### Backend — RBAC Híbrido
- **prisma**: Rol `ADMIN` en enum `UserRole` + campo `permissions String[]` en modelo `Customer`
- **prisma**: Migración `add_admin_role_and_permissions`
- **auth**: Lógica de permisos híbrida — estáticos (SUPERADMIN/SOPORTE) + dinámicos (ADMIN desde BD)
- **auth**: `getPermissionsForRole()` soporta merge de permisos estáticos + `dynamicPermissions`
- **auth**: `CMS_MODULES` constante — fuente de verdad de 13 módulos del sidebar
- **auth**: `dynamicPermissions` en entidad `User` del dominio
- **admin**: Campo `permissions` en `CreateUserDto`/`UpdateUserDto` para CMS users
- **admin**: Endpoint `PATCH /admin/users/:id/permissions` — actualizar permisos CMS
- **admin**: Endpoint `GET /admin/permissions/modules` — listar módulos disponibles
- **admin**: `getPermissionModules()` en AdminService

#### Frontend — Módulo de Roles
- **cms/roles**: Reescritura completa — de placeholder a módulo funcional con 2 tabs
- **roles/RolesOverviewTab**: Vista de 4 roles con permisos base (read-only)
- **roles/CmsUsersTab**: CRUD de usuarios CMS con tabla, filtros y modales
- **roles/CmsUserFormModal**: Crear/editar usuario CMS con selector de rol + toggles
- **roles/CmsUserDetailModal**: Detalle de usuario con permisos editables
- **roles/PermissionToggles**: Componente reutilizable de switches ON/OFF por módulo
- **roles/types.ts**: Tipos compartidos, CMS_MODULES, ROLE_META, buildToggleItems()
- **adminApi**: Funciones `adminListCmsUsers()`, `adminCreateCmsUser()`, `adminUpdateCmsUserPermissions()`
- **CmsShell**: Sidebar dinámico — filtra NAV_ITEMS según `profile.permissions`

### Cambiado
- **users.tsx**: Solo muestra clientes/abonados (filtro `isCmsUser` en data layer)
- **users.tsx**: Eliminado selector "Tipo de usuario" (Interno/Abonado) del formulario
- **users.tsx**: Eliminado filtro dropdown de tipo de usuario
- **CmsShell**: NAV_ITEMS filtrados por `NAV_PERMISSION_MAP` + `hasPermission()`

---

## [0.2.0-beta] — 2026-04

### Añadido

#### Backend — Persistencia PostgreSQL
- **prisma**: Schema con 7 modelos (`Customer`, `Contract`, `ViewingProfile`, `Session`, `Device`, `Plan`, `SyncLog`) y 3 enums
- **prisma**: Configuración Prisma 7 con `PrismaPg` adapter para compatibilidad con NestJS (CJS)
- **prisma**: 3 migraciones SQL (`init`, `optional_session_contract`, `add_session_customer`)
- **prisma**: Seed con 47 suscriptores ISP reales + 2 usuarios CMS + plan + contratos
- **prisma**: `PrismaService` como injectable que extiende `PrismaClient` con adapter PostgreSQL
- **prisma**: `PrismaUserRepository` — implementación Prisma del puerto `UserRepository`
- **prisma**: `PrismaSessionRepository` — implementación Prisma del puerto `SessionRepository`
- **auth**: Endpoint `POST /auth/app/contract-login` — login por número de contrato
- **auth**: Endpoint `POST /auth/app/first-access` — primer acceso con cédula + contrato
- **auth**: Endpoint `POST /auth/app/activate` — activación de cuenta con código
- **auth**: Endpoint `POST /auth/app/reset-password` — recuperación de contraseña
- **auth**: Endpoint `POST /auth/app/switch-contract` — cambio de contrato activo
- **admin**: Endpoint `GET /admin/users` ahora consulta PostgreSQL (ya no usa mocks)

#### Frontend — Auth por contrato
- **auth**: Pantalla de login adaptada a número de contrato + contraseña (sin OTP)
- **auth**: Flujo de primer acceso (contrato + cédula)
- **auth**: Flujo de activación de cuenta
- **auth**: Flujo de recuperación de contraseña
- **stores**: `authStore` actualizado con flujo contract-based

#### Infraestructura
- Docker Compose actualizado: PostgreSQL 15 + Redis 7 + backend
- `prisma.config.ts` con datasource URL y comando de seed
- `.env.example` con variables completas para desarrollo

### Cambiado
- **prisma/schema**: `Session.contractId` ahora es opcional (`String?`) para soportar sesiones CMS
- **prisma/schema**: Agregado `Session.customerId` como relación directa para usuarios sin contrato
- **imports**: Migrados de `generated/prisma/client.js` a `@prisma/client` (3 archivos)
- **admin.service**: Soporte para `contractId` nullable en validación de sesiones
- **session-repo**: Reemplazado `upsert` por `create`/`update` separados (compatibilidad Prisma 7)
- **session-repo**: `findByUserId` y `deleteAllByUserId` buscan por contrato O customerId directo
- **frontend**: Mocks de usuarios en `adminApi.ts` eliminados (los datos vienen de PostgreSQL)

### Notas
- Los servicios de billing, CRM y OTP siguen siendo mocks de desarrollo
- Los suscriptores del seed tienen `mustChangePassword: true` — requieren flujo de primer acceso
- Los módulos CMS no-auth (categorías, sliders, blog, impuestos, componentes) mantienen mocks temporales
- La persistencia de PostgreSQL está activa para: usuarios, contratos, sesiones y planes

---

## [0.1.0-alpha] — 2025-07

### Añadido

#### Backend
- **auth**: Login de dos fases para app (contraseña + OTP por correo) con JWT (access 15 min + refresh 7 días)
- **auth**: Login de una fase para CMS (email + contraseña)
- **auth**: Rotación de refresh token con detección de reutilización
- **auth**: Gestión de sesiones activas (listar, revocar individual, revocar todas)
- **auth**: Cambio de contraseña con revocación de sesiones
- **auth**: Solicitud y verificación de OTP independiente
- **auth**: Login QR (placeholder para futura implementación)
- **auth**: Decoradores `@CurrentUser()`, `@Roles()`, `@Permissions()`, `@RequireAudience()`
- **auth**: Guards JWT, roles, permisos y audiencia (APP vs CMS)
- **access-control**: Mapa de permisos por rol (SUPERADMIN, SOPORTE, CLIENTE)
- **billing**: Gateway de facturación (mock) con contratos y estados de servicio ISP
- **crm**: Gateway CRM (mock) con registros de clientes
- **profiles**: Entidad de perfil de usuario (esqueleto)
- **admin**: Módulo de administración CMS con gestión de usuarios, contratos y sesiones
- **admin**: Endpoint de componentes OTT (activar/desactivar/reordenar)
- **public**: Endpoint público de componentes activos (sin autenticación)
- **common**: Filtro global de excepciones HTTP con formato JSON
- **common**: Pipe de validación global (class-validator con whitelist y transform)
- Swagger en `/api/docs` con documentación completa de endpoints
- Rate limiting global (ThrottlerModule: 20 req/min)
- Variables de entorno via ConfigModule (.env)
- Repositorios in-memory con datos de prueba (seed)

#### Frontend
- **auth**: Pantalla de login (número de contrato + contraseña)
- **auth**: Pantalla de verificación OTP (6 dígitos)
- **app**: Pantalla principal con Hero banner y filas de contenido por género
- **app**: Pantalla de búsqueda (placeholder)
- **app**: Pantalla de favoritos (placeholder)
- **player**: Reproductor de video con soporte HLS (hls.js web / expo-av nativo)
- **admin**: Panel de administración de canales con CRUD completo
- **admin**: Login admin con contraseña hardcoded
- **cms**: Panel CMS con sidebar de navegación y módulos
- **cms**: Módulo de Componentes OTT (toggles de activación/desactivación)
- **components**: Button, Input, Hero, MediaRow reutilizables
- **components/cms**: CmsShell con sidebar de navegación
- **stores**: authStore (Zustand) — flujo de autenticación de dos fases
- **stores**: contentStore — catálogo con merge de canales admin
- **stores**: adminStore — CRUD de canales con persistencia via API
- **stores/api**: Funciones API para billing, CRM, componentes admin

#### Infraestructura
- Docker Compose con backend, PostgreSQL 16 y Redis 7
- Script de despliegue EC2 (deploy-ec2.sh) con PM2 + Nginx
- Dockerfile multi-stage (Node 20-slim)
- Configuración Nginx con proxy a backend

#### Documentación
- README.md con guía de instalación y credenciales de prueba
- ARCHITECTURE.md con diagramas y modelos de datos
- DEPLOYMENT.md con guía completa de despliegue
- CHANGELOG.md (este archivo)
- CONTRIBUTING.md con convenciones de commits
- .env.example con todas las variables de entorno
- .gitignore configurado para Node, Expo, IDE y OS

### Seguridad
- Contraseñas hasheadas con bcrypt (12 salt rounds)
- JWT con secretos separados para access y refresh tokens
- OTP de un solo uso con TTL de 5 minutos
- CORS habilitado
- Rate limiting contra fuerza bruta
- Validación de entrada con class-validator (whitelist + forbidNonWhitelisted)
- Segregación de audiencia (APP vs CMS) en tokens JWT

### Notas
- Los repositorios usan almacenamiento in-memory (datos se pierden al reiniciar)
- Los servicios de billing, CRM y OTP son mocks de desarrollo
- El OTP fijo en desarrollo es `123456`
- La persistencia real con PostgreSQL y Redis está configurada en Docker Compose pero no conectada aún

---

## Convenciones de Versionado

- **alpha**: Funcionalidad base implementada, sin persistencia real
- **beta**: Con base de datos PostgreSQL conectada via Prisma
- **rc**: Candidato a release, con tests completos
- **stable**: Release de producción

---

[0.2.0-beta]: https://github.com/Sofilu1537/Luki-Play-OTT/compare/v0.1.0-alpha...v0.2.0-beta
[0.1.0-alpha]: https://github.com/Sofilu1537/Luki-Play-OTT/releases/tag/v0.1.0-alpha
