# Arquitectura — LUKI Play OTT

## Descripción General

LUKI Play OTT es una plataforma de streaming Over-The-Top que permite a los
suscriptores (clientes ISP u OTT-only) acceder a contenido de video bajo demanda
y canales en vivo. El sistema incluye:

- **App de suscriptores**: Interfaz para consumir contenido (catálogo, reproductor,
  búsqueda, favoritos).
- **Panel CMS**: Interfaz administrativa para gestionar usuarios, componentes,
  canales, planes y configuración de la plataforma.

---

## Diagrama de Módulos

```
┌─────────────────────────────────────────────────────────────────────┐
│                          FRONTEND (Expo)                            │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐    │
│  │  App OTT     │  │  Panel CMS   │  │  Reproductor           │    │
│  │  (auth)      │  │  (cms)       │  │  (player)              │    │
│  │  - Login     │  │  - Dashboard │  │  - HLS streaming       │    │
│  │  - OTP       │  │  - Usuarios  │  │  - MP4 directo         │    │
│  │  - Home      │  │  - Componentes│ │  - Controles de video  │    │
│  │  - Búsqueda  │  │  - Canales   │  │                        │    │
│  │  - Favoritos │  │  - Planes    │  └────────────────────────┘    │
│  └──────┬───────┘  │  - Sliders   │                                │
│         │          │  - Monitor   │     ┌──────────────────┐       │
│         │          └──────┬───────┘     │  Stores Zustand  │       │
│         │                 │             │  - authStore     │       │
│         └─────────────────┼─────────────│  - contentStore  │       │
│                           │             │  - cmsStore      │       │
│                           │             │  - adminStore    │       │
│                           │             └────────┬─────────┘       │
└───────────────────────────┼──────────────────────┼─────────────────┘
                            │                      │
                    ┌───────▼──────────────────────▼──────┐
                    │            NGINX (puerto 8120)       │
                    │  /          → archivos estáticos     │
                    │  /auth/*    → backend :8100          │
                    │  /admin/*   → backend :8100          │
                    │  /public/*  → backend :8100          │
                    └───────────────┬─────────────────────┘
                                    │
┌───────────────────────────────────▼──────────────────────────────────┐
│                       BACKEND (NestJS, puerto 8100)                  │
│                                                                      │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐     │
│  │  AuthModule       │  │  AdminModule      │  │  PublicModule  │     │
│  │  - Login App/CMS  │  │  - CRUD usuarios  │  │  - Componentes│     │
│  │  - Contrato+Pwd  │  │  - Componentes    │  │    activos    │     │
│  │  - Primer acceso │  │  - Canales        │  │  (sin auth)   │     │
│  │  - Refresh token │  │  - Planes         │  └────────────────┘    │
│  │  - Logout         │  │  - Sliders        │                        │
│  └──────┬───────────┘  │  - Monitor        │                        │
│         │              └──────────────────┘                          │
│  ┌──────▼───────────┐  ┌──────────────────┐  ┌────────────────┐     │
│  │ AccessControl     │  │  BillingModule   │  │  CrmModule     │     │
│  │ - Roles Guard     │  │  (mock gateway)  │  │  (mock gateway)│     │
│  │ - Permissions     │  │  - Validar ISP   │  │  - Datos CRM   │    │
│  │ - Audience Guard  │  │  - Suscripciones │  │                │     │
│  └──────────────────┘  └──────────────────┘  └────────────────┘     │
│                                                                      │
│  ┌──────────────────┐                                                │
│  │  ProfilesModule   │                                               │
│  │  (placeholder)    │                                               │
│  └──────────────────┘                                                │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │  PrismaModule (Capa de Persistencia)                          │    │
│  │  - PrismaService (PrismaClient + PrismaPg adapter)            │    │
│  │  - PrismaUserRepository → implements UserRepository           │    │
│  │  - PrismaSessionRepository → implements SessionRepository     │    │
│  └──────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Flujo Principal de Operación

### Flujo del Suscriptor

```
1. PRIMER ACCESO (primera vez)
   └─ Ingresa número de contrato + número de cédula
      └─ Backend valida datos contra Customer + Contract en PostgreSQL
         └─ Si coinciden → devuelve token temporal para activación

2. ACTIVACIÓN
   └─ Establece contraseña permanente
      └─ Backend actualiza Customer (isAccountActivated, passwordHash)
         └─ Cuenta activada — puede hacer login normal

3. LOGIN
   └─ Ingresa número de contrato + contraseña
      └─ Backend busca Contract → Customer en PostgreSQL
         └─ Valida passwordHash con bcrypt
            └─ Genera JWT (access 15m + refresh 7d)
               └─ Registra sesión (dispositivo, audiencia, expiración)

4. CATÁLOGO
   └─ Home: Hero banner + filas por categoría/tag
      └─ Datos: canales admin (prioridad) + catálogo hardcoded
         └─ Filtrado por componentes activos

5. REPRODUCCIÓN
   └─ Selecciona contenido → Player
      └─ HLS adaptive streaming (hls.js en web)
         └─ Controles: play/pause, volumen, pantalla completa

6. SESIÓN
   └─ Token refresh automático cada 15 minutos
      └─ Logout: revoca sesión + limpia estado local
```

### Flujo del Administrador CMS

```
1. LOGIN CMS
   └─ Email + contraseña (sin OTP)
      └─ Solo roles SUPERADMIN o SOPORTE
         └─ JWT directo

2. DASHBOARD
   └─ Métricas: usuarios, contratos, canales, planes
      └─ Estado del sistema

3. GESTIÓN
   └─ Módulos: Usuarios, Componentes, Canales, Planes,
      Sliders, Categorías, Blog, Monitor, Impuestos,
      Solicitudes de Registro, Roles
      └─ CRUD completo con interfaz Nebula Dark
      └─ Persistencia 100% en PostgreSQL (sin localStorage)
```

---

## Modelo de Datos

### Entidades Principales (Prisma / PostgreSQL)

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Customer   │     │   Contract   │     │    Session   │
├──────────────┤     ├──────────────┤     ├──────────────┤
│ id (uuid)    │◀──┐ │ id (uuid)    │     │ id (uuid)    │
│ nombre       │   │ │ customerId ──┼────▶│ contractId?  │──┐
│ email?       │   │ │ contractNum  │     │ customerId?  │──┤
│ idNumber?    │   │ │ planName     │     │ deviceId     │  │
│ passwordHash │   │ │ maxDevices   │     │ audience     │  │
│ role         │   └─┤ sessionLimit │     │ refreshToken │  │
│ status       │     │ fechaInicio? │     │ expiresAt    │  │
│ isCmsUser    │     │ fechaFin?    │     │ revokedAt?   │  │
│ isSubscriber │     └──────┬───────┘     └──────────────┘  │
│ isAccountAct │            │                               │
│ mustChangePw │            ▼                               │
└──────────────┘     ┌──────────────┐                       │
                     │ViewingProfile│     ┌──────────────┐  │
                     ├──────────────┤     │    Device    │  │
                     │ contractId   │     ├──────────────┤  │
                     │ displayName  │     │ contractId   │  │
                     │ avatarUrl?   │     │ deviceName?  │  │
                     │ isDefault    │     │ fingerprint  │  │
                     └──────────────┘     │ isActive     │  │
                                          └──────────────┘  │
┌──────────────┐     ┌──────────────┐                       │
│     Plan     │     │   SyncLog    │    Customer ◀─────────┘
├──────────────┤     ├──────────────┤    (Session puede
│ nombre       │     │ syncType     │     vincular por
│ maxDevices   │     │ startedAt    │     contract O
│ maxProfiles  │     │ completedAt? │     directamente
│ videoQuality │     │ errors       │     por customer)
│ entitlements │     │ errorDetails │
└──────────────┘     └──────────────┘
```

> **Nota**: `Session` tiene dos FKs opcionales: `contractId` (para suscriptores que
> acceden via contrato) y `customerId` (para usuarios CMS que no tienen contrato).
> Las queries de sesión buscan con `OR` en ambos campos.

### Enumeraciones

| Enum                       | Valores                                                        |
|----------------------------|----------------------------------------------------------------|
| UserRole                   | SUPERADMIN, ADMIN, SOPORTE, CLIENTE                            |
| UserStatus                 | ACTIVE, INACTIVE, SUSPENDED, PENDING, TRIAL                    |
| SessionLimitPolicy         | BLOCK_NEW, REPLACE_OLDEST                                      |
| ChannelStatus              | ACTIVE, SCHEDULED, MAINTENANCE, INACTIVE                       |
| StreamProtocol             | HLS, DASH, HLS_DASH                                            |
| ChannelHealthStatus        | HEALTHY, DEGRADED, OFFLINE, MAINTENANCE                        |
| RegistrationRequestStatus  | PENDING, APPROVED, REJECTED                                    |
| Audience (lógico)          | app, cms                                                       |

### Modelos extendidos — Canales, Categorías y Componentes

```
┌─────────────────┐        ┌──────────────────────┐        ┌─────────────────┐
│    Category     │        │   ChannelCategory     │        │    Channel      │
├─────────────────┤        ├──────────────────────┤        ├─────────────────┤
│ id (uuid)       │◀───────│ categoryId           │───────▶│ id (uuid)       │
│ nombre (unique) │        │ channelId            │        │ nombre (unique) │
│ slug?           │        │ assignedAt           │        │ slug (unique)   │
│ descripcion     │        └──────────────────────┘        │ streamUrl       │
│ icono           │                                         │ categoryId ─────┼──▶ Category
│ accentColor     │        ┌──────────────────────┐        │ status          │
│ displayOrder    │        │  ComponentCategory   │        │ healthStatus    │
│ activo          │◀───────│ categoryId           │        │ streamProtocol  │
│ deletedAt?      │        │ componentId          │        │ deletedAt?      │
└─────────────────┘        └──────────┬───────────┘        └─────────────────┘
                                      │
                           ┌──────────▼───────────┐
                           │      Component       │
                           ├──────────────────────┤
                           │ id (uuid)            │
                           │ nombre (unique)      │
                           │ descripcion          │
                           │ icono                │
                           │ tipo                 │
                           │ activo               │
                           │ orden                │
                           └──────────────────────┘
```

> **Nota**: `Channel` tiene una FK directa a `Category` (categoría principal) y además
> una relación M:M via `ChannelCategory` para asignaciones adicionales desde el CMS.
> `Category` tiene `deletedAt` para soft-delete; categorías con `displayOrder <= 5`
> están protegidas contra eliminación.

### Componentes OTT (persistidos en BD)

| Tipo       | Descripción                               |
|------------|-------------------------------------------|
| VOD        | Video bajo demanda                        |
| DESTACADOS | Contenido principal del banner hero       |
| LIVE       | Canales en vivo                           |
| SERIES     | Catálogo de series por temporadas         |
| RADIO      | Estaciones de radio en línea              |
| comp-006  | PPV        | PPV        | Pay Per View — eventos premium            |
| comp-007  | Kids       | KIDS       | Contenido infantil                        |
| comp-008  | Deportes   | DEPORTES   | Canales y eventos deportivos              |
| comp-009  | Música     | MUSICA     | Canales de música y videoclips            |
| comp-010  | Noticias   | NOTICIAS   | Canales de noticias 24/7                  |

---

## Integraciones Externas

| Servicio             | Módulo       | Estado  | Descripción                               |
|----------------------|--------------|---------|-------------------------------------------|
| Billing Gateway      | billing/     | Mock    | Valida contratos ISP y suscripciones      |
| CRM Gateway          | crm/         | Mock    | Consulta datos de clientes por contrato   |
| Servicio OTP (Email) | auth/        | Mock    | Envío de códigos OTP por correo           |
| PostgreSQL 15        | prisma/      | **Activo** | Persistencia completa: usuarios, contratos, sesiones, planes, canales, categorías, componentes |
| Redis 7              | —            | Config  | Definido en .env, preparado para caché/sesiones |
| TMDB                 | frontend     | URLs    | Imágenes de referencia (sin API key)      |
| CDN de Video         | frontend     | Demo    | URL de stream HLS de demostración         |

---

## Roles y Niveles de Acceso (RBAC Híbrido)

### Roles del Sistema

| Rol | Código | Tipo | Acceso CMS | Permisos |
|-----|--------|------|:----------:|----------|
| **Super Admin** | `SUPERADMIN` | Estático | ✅ | `cms:*` — inmutable, todos los permisos |
| **Administrador** | `ADMIN` | Dinámico | ✅ | Configurables por SUPERADMIN vía toggles |
| **Soporte** | `SOPORTE` | Estático | ✅ | Fijos: dashboard, usuarios, canales, monitor, analítica |
| **Cliente** | `CLIENTE` | Estático | ❌ | `app:playback`, `app:profiles` |

### Permisos por Módulo del CMS

| Permiso | Módulo | SUPERADMIN | ADMIN | SOPORTE |
|---------|--------|:----------:|:-----:|:-------:|
| `cms:dashboard` | Dashboard | ✅ siempre | 🔧 toggle | ✅ fijo |
| `cms:users` | Usuarios | ✅ siempre | 🔧 toggle | ✅ fijo |
| `cms:componentes` | Componentes | ✅ siempre | 🔧 toggle | ❌ |
| `cms:planes` | Planes | ✅ siempre | 🔧 toggle | ❌ |
| `cms:canales` | Canales | ✅ siempre | 🔧 toggle | ✅ fijo |
| `cms:categorias` | Categorías | ✅ siempre | 🔧 toggle | ❌ |
| `cms:sliders` | Sliders | ✅ siempre | 🔧 toggle | ❌ |
| `cms:monitor` | Monitor | ✅ siempre | 🔧 toggle | ✅ fijo |
| `cms:notif-admin` | Notif. Admin | ✅ siempre | 🔧 toggle | ❌ |
| `cms:analitica` | Analítica | ✅ siempre | 🔧 toggle | ✅ fijo |
| `cms:propaganda` | Propaganda | ✅ siempre | 🔧 toggle | ❌ |
| `cms:notif-abonado` | Notif. Abonado | ✅ siempre | 🔧 toggle | ❌ |
| `cms:roles` | Roles | ✅ siempre | ❌ nunca | ❌ nunca |

### Resolución de Permisos

- **SUPERADMIN**: `cms:*` wildcard, hardcoded, no se almacena en BD
- **ADMIN**: `Customer.permissions[]` en PostgreSQL, configurable por SUPERADMIN
- **SOPORTE**: Permisos fijos en código (`SOPORTE_DEFAULT_PERMISSIONS`)
- Los permisos se incluyen en el JWT y se refrescan en cada login/refresh
- El sidebar CMS se filtra dinámicamente según `profile.permissions`

### Módulo Roles (`/cms/roles`)

- **Pestaña "Roles"**: Vista general de roles con permisos (read-only)
- **Pestaña "Usuarios CMS"**: CRUD de usuarios internos con toggles de permisos
- Solo accesible para SUPERADMIN (`cms:roles` permission)

### Control de Acceso OTT

- **Clientes ISP**: Acceso si contrato tiene estado activo y `isAccountActivated: true`
- **Primer acceso**: Requiere número de contrato + cédula para activar cuenta
- **Suspensión por contrato**: Solo afecta el contrato específico, no otros del mismo cliente
- **CMS**: Acceso directo con email + contraseña (sin contrato)

---

## Endpoints REST — Módulos Recientes

### Categorías (`/admin/categorias`)

| Método | Ruta                                      | Descripción                              |
|--------|-------------------------------------------|------------------------------------------|
| GET    | `/admin/categorias`                       | Listar (filtros: active, search, limit)  |
| GET    | `/admin/categorias/:id`                   | Obtener categoría por ID                 |
| POST   | `/admin/categorias`                       | Crear categoría                          |
| PATCH  | `/admin/categorias/:id`                   | Actualizar categoría                     |
| POST   | `/admin/categorias/:id/toggle`            | Activar/desactivar                       |
| DELETE | `/admin/categorias/:id`                   | Soft-delete                              |
| POST   | `/admin/categorias/:id/canales`           | Sincronizar canales asociados (M:M)      |
| DELETE | `/admin/categorias/:id/canales/:channelId`| Eliminar canal de categoría              |
| PATCH  | `/admin/categorias/reorder/bulk`          | Reordenar categorías en bloque           |

### Componentes (`/admin/componentes`)

| Método | Ruta                                      | Descripción                              |
|--------|-------------------------------------------|------------------------------------------|
| GET    | `/admin/componentes`                      | Listar componentes con categorías        |
| POST   | `/admin/componentes/:id/toggle`           | Activar/desactivar componente            |
| POST   | `/admin/componentes/reorder`              | Reordenar por array de IDs               |
| GET    | `/admin/componentes/:id/categorias`       | Obtener categorías de un componente      |
| POST   | `/admin/componentes/:id/categorias`       | Sincronizar categorías (M:M)             |

### Endpoint público (sin auth)

| Método | Ruta                    | Descripción                              |
|--------|-------------------------|------------------------------------------|
| GET    | `/public/componentes`   | Componentes activos para la app OTT      |

---

## Seguridad

- **Autenticación**: JWT con rotación de tokens (access 15m + refresh 7d)
- **Hashing**: bcrypt con 12 rondas de sal
- **Rate limiting**: 20 peticiones por minuto por IP (ThrottlerModule)
- **Validación**: class-validator en todos los DTOs de entrada
- **Guards**: JwtAuthGuard + RolesGuard + PermissionsGuard + AudienceGuard
- **CORS**: Habilitado globalmente
- **Filtro de excepciones**: Respuestas sanitizadas (no expone stack traces)
