# Changelog — LUKI Play OTT

Todos los cambios notables del proyecto se documentan en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/)
y este proyecto sigue [Versionado Semántico](https://semver.org/lang/es/).

---

## [0.5.0-beta] — 2026-05

### Añadido

#### Backend — Gestión de Dispositivos
- **DeviceService**: `upsertDevice`, `getDevices`, `renameDevice`, `removeDevice` con soft-delete y revocación de sesiones en transaction
- **DeviceService**: Resolución de límite de dispositivos desde `Contract.maxDevices` → `planSnapshot` → default 3
- **Schema**: Modelo `Device` mejorado — `DeviceType` enum (MOBILE/TABLET/DESKTOP/SMART_TV/UNKNOWN), campos `os`, `browser`, `modelo`, `ipAddress`, `lastSeenAt`, `deletedAt`; índice único `(customerId, deviceFingerprint)`
- **Migración**: `20260502000000_enhance_devices`
- **PublicController**: `POST /public/devices/register`, `GET /public/devices`, `PATCH /public/devices/:fingerprint`, `DELETE /public/devices/:fingerprint`
- **PublicController**: `GET /public/sessions` — sesiones activas con info enriquecida de dispositivo

#### Backend — Control Parental
- **ParentalControlService**: `getStatus`, `enable`, `disable`, `verifyPin`, `changePin`, `updateLevel`
- **ParentalControlService**: PIN de 4 dígitos numéricos almacenado con bcrypt (`HASH_SERVICE`)
- **Schema**: Campos `parentalControlEnabled`, `parentalControlPin`, `parentalControlLevel` en `Customer`
- **Migraciones**: `20260502010000_add_parental_control`, `20260502020000_add_parental_control_level`
- **PublicController**: `GET /public/parental-control`, `POST enable/disable/verify`, `PATCH level/pin`

#### Backend — Streams Concurrentes (ya existente, documentado)
- **StreamSessionService**: Reserva y libera slots de stream por suscriptor
- **StreamSessionService**: Limpieza automática de streams sin heartbeat después de 90s
- **StreamSessionService**: Políticas `BLOCK_NEW` (HTTP 429) y `REPLACE_OLDEST`
- **Schema**: Modelo `ActiveStream` con `lastHeartbeat` para TTL heartbeat
- **PublicController**: `POST /public/streams/start`, `PATCH /public/streams/:id/heartbeat`, `DELETE /public/streams/:id`

#### Frontend — Gestión de Dispositivos
- **devices.tsx**: Pantalla completa — lista de dispositivos con tipo, OS, browser; indicador de slots usados/total con barra de progreso y color dinámico (verde → naranja → rojo)
- **devices.tsx**: Dispositivo actual destacado con ícono coloreado; rename via bottom sheet; delete con confirmación
- **deviceApi.ts**: `detectDeviceInfo()`, `registerDevice`, `getDevices`, `renameDevice`, `removeDevice`, `getActiveSessions`
- **_layout.tsx**: Ruta `/(app)/devices` registrada en el stack

#### Frontend — Control Parental
- **parental-control.tsx**: Máquina de estados — `loading | gate | settings | enable | change-pin | disable`
- **parental-control.tsx**: `PinGate` — pantalla completa de verificación antes de ver ajustes (si está activado)
- **parental-control.tsx**: `EnableFlow` — 3 pasos: selector de nivel → nuevo PIN → confirmar PIN
- **parental-control.tsx**: `ChangePinFlow` — verificar PIN actual → nuevo PIN → confirmar
- **parental-control.tsx**: `DisableFlow` — ingresar PIN → desactivar
- **parental-control.tsx**: `PinDots` — 4 círculos con glow verde al llenarse, rojo en error
- **parental-control.tsx**: `PinKeypad` — teclado numérico estilo iOS con backspace
- **parental-control.tsx**: Animación shake (`Animated.sequence`) en PIN incorrecto; auto-submit a los 4 dígitos con delay 120ms
- **parental-control.tsx**: `SettingsView` — tarjeta de estado + selector de nivel (auto-guarda) + botones de acción
- **parental-control.tsx**: Toast animado de feedback (fade in/hold/fade out)
- **_layout.tsx**: Ruta `/(app)/parental-control` registrada en el stack

#### Frontend — UX y Perfil
- **home.tsx**: `ProfileDropdown` rediseñado — iconos coloreados estilo iOS Settings, agrupación por sección, animación spring al abrir, caret triangular apuntando al avatar
- **home.tsx**: Eliminadas secciones "Configuración" y "Ayuda y soporte" del menú
- **profile.tsx**: Filas "Mis Dispositivos" y "Control Parental" con íconos coloreados
- **subscription.tsx**: Rediseño — tarjeta de estado, fechas, sin secciones redundantes

### Cambiado
- **PublicModule**: Importa `AuthModule` para acceder a `HASH_SERVICE` (bcrypt)
- **PublicModule**: Registra `StreamSessionService`, `DeviceService`, `ParentalControlService`
- **MENU_ITEMS** en `home.tsx`: Tipo simplificado (sin `soon?`), solo ítems con rutas activas
- **main**: `Sprint_1_integracion-player` fusionada en `main` via force push (backup tag `backup/main-pre-sprint1`)

---

## [0.4.0-beta] — 2026-04

### Añadido

#### Backend
- **auth**: Endpoint `POST /auth/change-password` — cambia contraseña y revoca **todas** las sesiones activas del usuario
- **main**: Configuración CORS explícita — `origin: true`, métodos `GET HEAD PUT PATCH POST DELETE OPTIONS`, headers `Content-Type Authorization Accept`

#### Frontend — Perfil de usuario CMS
- **cms/profile**: Sección "Cambiar contraseña" con 3 campos (actual, nueva, confirmar), validación inline y feedback auto-dismiss
- **cms/profile**: Títulos y subtítulos de perfil diferenciados por rol (Super Admin / Administrador / Soporte)
- **cms/profile**: Al cambiar contraseña exitosamente → logout automático y redirección al login (sesiones revocadas server-side)
- **cmsApi**: Función `cmsChangePassword(accessToken, currentPassword, newPassword)`
- **CmsComponents**: Prop `secureTextEntry` en `TextInputField`

#### Frontend — Módulo Roles (rediseño completo)
- **roles/types.ts**: Función `buildModulePermissions()` — genera matriz read/write por módulo con `permGranted()` que soporta wildcard, coincidencia exacta y permisos padre-hijo
- **roles/types.ts**: `MODULE_OPS` — mapa de operaciones soportadas por módulo (`read`/`write`)
- **roles/types.ts**: `ADMIN_DEFAULT_PERMISSIONS` y `SOPORTE_DEFAULT_PERMISSIONS` — arrays de permisos por defecto
- **roles/types.ts**: Interfaces `ModulePermissionRow`, `ModuleOp` para la nueva matriz de permisos
- **roles/PermissionToggles**: Rediseñado — muestra tabla con columnas LECTURA / ESCRITURA como chips interactivos (`OpChip`)
- **roles/RolesOverviewTab**: Rediseño completo — tarjetas de los 3 roles CMS, panel inline de edición de permisos (solo SUPERADMIN), badge "FIJO" para SUPERADMIN, aviso read-only para no-SUPERADMIN
- **roles/RolesOverviewTab**: Sincronización de clave de módulo (`cms:canales`) al activar/desactivar operaciones granulares (`cms:canales:read`, `cms:canales:write`)
- **roles/CmsUsersTab**: Rediseño completo — tabla con búsqueda + filtro por rol, stats bar, acciones por rol (toggle estado, editar, ver detalle), aviso read-only para no-SUPERADMIN
- **app/cms/roles**: Tabs renombrados: "Roles y permisos" (icono shield) + "Usuarios internos" (icono users)

### Corregido
- **roles/types.ts**: `buildToggleItems()` y `buildContentPermItems()` (legacy) — guard defensivo `Array.isArray()` para evitar crash cuando `currentPermissions` es `undefined` o `null`
- **roles/RolesOverviewTab**: `getPermissions()` — normalización de clave de rol (maneja uppercase/lowercase desde la API) y fallback a `[]` cuando `permissions` es `null`
- **cms/profile**: Eliminado `router.replace('/cms/login')` del `useEffect` — evitaba triple-redirect al hacer logout (el `_layout.tsx` es la única autoridad de navegación)
- **roles/RolesOverviewTab**: Error "No se pudo conectar con el servidor" con mensaje descriptivo en lugar de "Failed to fetch"

### Cambiado
- **auth.module.ts**: `EMAIL_SERVICE` cambiado de `MockEmailService` a `NodemailerEmailService` (emails reales via SMTP)
- **CmsUserFormModal**: Ícono y subtítulo del header diferenciados entre crear (`user-plus` verde) y editar (`pencil` accent)
- **CmsUserFormModal**: Selector de rol bloqueado en modo edición con ícono de candado
- **feedback**: Mensajes de éxito auto-dismiss en 2s, errores en 4s (perfil + roles)

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

[0.4.0-beta]: https://github.com/Sofilu1537/Luki-Play-OTT/compare/v0.3.0-beta...v0.4.0-beta
[0.2.0-beta]: https://github.com/Sofilu1537/Luki-Play-OTT/compare/v0.1.0-alpha...v0.2.0-beta
[0.1.0-alpha]: https://github.com/Sofilu1537/Luki-Play-OTT/releases/tag/v0.1.0-alpha
