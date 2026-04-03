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
│  │  - Verificar OTP  │  │  - Componentes    │  │    activos    │     │
│  │  - Refresh token  │  │  - Canales        │  │  (sin auth)   │     │
│  │  - Sesiones       │  │  - Planes         │  └────────────────┘    │
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
└──────────────────────────────────────────────────────────────────────┘
```

---

## Flujo Principal de Operación

### Flujo del Suscriptor

```
1. REGISTRO / LOGIN
   └─ Ingresa número de contrato + contraseña
      └─ Backend valida credenciales contra UserRepository
         └─ Evalúa acceso OTT (ISP activo o suscripción OTT activa)
            └─ Envía OTP al correo del usuario

2. VERIFICACIÓN OTP
   └─ Ingresa código de 6 dígitos
      └─ Backend valida OTP
         └─ Genera JWT (access 15m + refresh 7d)
            └─ Registra sesión (dispositivo, audiencia, expiración)

3. CATÁLOGO
   └─ Home: Hero banner + filas por categoría/tag
      └─ Datos: canales admin (prioridad) + catálogo hardcoded
         └─ Filtrado por componentes activos

4. REPRODUCCIÓN
   └─ Selecciona contenido → Player
      └─ HLS adaptive streaming (hls.js en web)
         └─ Controles: play/pause, volumen, pantalla completa

5. SESIÓN
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
      Sliders, Categorías, Blog, Monitor, Impuestos
      └─ CRUD completo con interfaz Nebula Dark
```

---

## Modelo de Datos

### Entidades Principales

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    User      │     │   Account    │     │   Session    │
├──────────────┤     ├──────────────┤     ├──────────────┤
│ id           │────▶│ id           │     │ id           │
│ contractNum  │     │ contractNum  │     │ userId       │◀──┐
│ email        │     │ contractType │     │ deviceId     │   │
│ phone        │     │ isIspCustomer│     │ audience     │   │
│ passwordHash │     │ planId       │     │ refreshHash  │   │
│ role         │     │ subsStatus   │     │ expiresAt    │   │
│ status       │     │ serviceStatus│     │ createdAt    │   │
│ accountId ───┼────▶│ maxDevices   │     │ revokedAt    │   │
│ createdAt    │     └──────────────┘     └──────────────┘   │
└──────┬───────┘                                             │
       └─────────────────────────────────────────────────────┘
       (Un usuario puede tener N sesiones activas)
```

### Enumeraciones

| Enum           | Valores                                    |
|----------------|--------------------------------------------|
| UserRole       | SUPERADMIN, SOPORTE, CLIENTE               |
| UserStatus     | ACTIVE, INACTIVE, SUSPENDED                |
| ContractType   | ISP, OTT_ONLY                              |
| Audience       | app, cms                                   |

### Componentes OTT

| ID        | Nombre     | Tipo       | Descripción                               |
|-----------|------------|------------|-------------------------------------------|
| comp-001  | VOD        | VOD        | Video bajo demanda                        |
| comp-002  | Destacados | DESTACADOS | Contenido principal del banner hero       |
| comp-003  | Live       | LIVE       | Canales en vivo                           |
| comp-004  | Series     | SERIES     | Catálogo de series por temporadas         |
| comp-005  | Radio      | RADIO      | Estaciones de radio en línea              |
| comp-006  | PPV        | PPV        | Pay Per View — eventos premium            |
| comp-007  | Kids       | KIDS       | Contenido infantil                        |
| comp-008  | Deportes   | DEPORTES   | Canales y eventos deportivos              |
| comp-009  | Música     | MUSICA     | Canales de música y videoclips            |
| comp-010  | Noticias   | NOTICIAS   | Canales de noticias 24/7                  |

---

## Integraciones Externas

| Servicio             | Módulo       | Estado | Descripción                               |
|----------------------|--------------|--------|-------------------------------------------|
| Billing Gateway      | billing/     | Mock   | Valida contratos ISP y suscripciones      |
| CRM Gateway          | crm/         | Mock   | Consulta datos de clientes por contrato   |
| Servicio OTP (Email) | auth/        | Mock   | Envío de códigos OTP por correo           |
| PostgreSQL           | —            | Config | Definido en .env.example, no conectado    |
| Redis                | —            | Config | Definido en .env.example, no conectado    |
| TMDB                 | frontend     | URLs   | Imágenes de referencia (sin API key)      |
| CDN de Video         | frontend     | Demo   | URL de stream HLS de demostración         |

---

## Roles y Niveles de Acceso

### Permisos por Rol

| Permiso                | SUPERADMIN | SOPORTE | CLIENTE |
|------------------------|:----------:|:-------:|:-------:|
| cms:users:read         | ✅         | ✅      | ❌      |
| cms:users:write        | ✅         | ❌      | ❌      |
| cms:content:read       | ✅         | ✅      | ❌      |
| cms:content:write      | ✅         | ❌      | ❌      |
| cms:settings:read      | ✅         | ❌      | ❌      |
| cms:settings:write     | ✅         | ❌      | ❌      |
| cms:analytics:read     | ✅         | ✅      | ❌      |
| app:playback           | ✅         | ❌      | ✅      |
| app:profiles           | ✅         | ❌      | ✅      |

### Control de Acceso OTT

- **Clientes ISP**: Acceso si `serviceStatus` ∈ {ACTIVO, CORTESIA}
- **Clientes OTT-only**: Acceso si `subscriptionStatus` = ACTIVE
- **Mensaje de restricción**: Se retorna cuando el acceso es denegado
  indicando el motivo (suspensión, corte, suscripción expirada, etc.)

---

## Seguridad

- **Autenticación**: JWT con rotación de tokens (access 15m + refresh 7d)
- **Hashing**: bcrypt con 12 rondas de sal
- **Rate limiting**: 20 peticiones por minuto por IP (ThrottlerModule)
- **Validación**: class-validator en todos los DTOs de entrada
- **Guards**: JwtAuthGuard + RolesGuard + PermissionsGuard + AudienceGuard
- **CORS**: Habilitado globalmente
- **Filtro de excepciones**: Respuestas sanitizadas (no expone stack traces)
