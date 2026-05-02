# LUKI Play OTT

**Plataforma OTT de streaming en vivo y contenido bajo demanda**

Plataforma de streaming completa (Over-The-Top) con dos interfaces diferenciadas:
una aplicación para suscriptores con autenticación segura (contrato / cédula + OTP)
y un panel administrativo CMS para administradores y personal de soporte.

---

## Información del Proyecto

| Campo            | Detalle                                                                 |
|------------------|-------------------------------------------------------------------------|
| **Nombre**       | LUKI Play OTT                                                           |
| **Versión**      | v0.5.0-beta — Sprint integración player completado                      |
| **Propósito**    | Plataforma OTT de streaming para suscriptores de ISP DataCom            |
| **Autor**        | Sofia Soria — Product Designer, DataCom S.A.                            |
| **Repositorio**  | https://github.com/Sofilu1537/Luki-Play-OTT                             |
| **Zona horaria** | America/Guayaquil (UTC-5)                                               |

---

## Tecnologías

| Capa            | Tecnología                                          |
|-----------------|-----------------------------------------------------|
| Frontend        | Expo ~52 / React Native 0.76 / React Native Web     |
| Estilos         | NativeWind 4 (Tailwind CSS para RN)                 |
| Estado          | Zustand 5                                           |
| Routing         | Expo Router ~4 (file-based)                         |
| Backend         | NestJS 11 / TypeScript 5.7                          |
| ORM             | Prisma 7 con `@prisma/adapter-pg`                   |
| Autenticación   | JWT dual-token (access 15 min + refresh 7 días)     |
| Base de datos   | PostgreSQL 15                                       |
| Caché           | Redis 7                                             |
| Streaming       | HLS — `hls.js` en web, `expo-av` en native          |
| Video player    | Reproductor full-screen con slot management         |
| Deploy          | AWS EC2 + PM2 + Nginx                               |
| Contenedores    | Docker + Docker Compose (infraestructura)           |
| Email           | Nodemailer 8 + SMTP (Titan Email / Mailtrap en DEV) |

---

## Inicio Rápido

> Para la guía completa de despliegue en ambos ambientes, ver [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

---

### DEV — Desarrollo Local

**Requisitos:** Node.js 20 LTS · npm 10+ · Git · Docker Desktop

```bash
# 1. Infraestructura (Docker Desktop debe estar corriendo)
docker compose up -d postgres redis

# 2. Backend
cd backend
cp .env.example .env          # Editar: SMTP_USER, SMTP_PASS (Mailtrap para DEV)
npm install
npx prisma migrate dev        # ⚠️ Solo DEV — crea migración + aplica
npx prisma db seed            # Carga plan, roles, categorías, 47 suscriptores, 3 usuarios CMS
npm run start:dev             # Hot reload → http://localhost:3000

# 3. Frontend (nueva terminal)
cd frontend
npm install
npx expo start --web          # App → http://localhost:8081
```

| Servicio       | URL DEV                           |
|----------------|-----------------------------------|
| App login      | http://localhost:8081/login       |
| CMS login      | http://localhost:8081/cms/login   |
| Swagger        | http://localhost:3000/api/docs    |
| Backend        | http://localhost:3000             |
| Prisma Studio  | http://localhost:5555             |

> **Email en DEV:** usar [Mailtrap](https://mailtrap.io) para capturar OTPs sin enviar correos reales.
> ```env
> SMTP_HOST=sandbox.smtp.mailtrap.io   SMTP_PORT=2525   SMTP_SECURE=false
> SMTP_USER=<usuario_mailtrap>         SMTP_PASS=<pass_mailtrap>
> ```

---

### PRD — Producción (AWS EC2)

**Requisitos en el servidor:** Ubuntu 22.04+ / Debian · Node 20 · PM2 · Docker · Nginx

```bash
# 1. Infraestructura (PostgreSQL + Redis)
docker compose -f docker-compose.prod.yml --env-file backend/.env up -d

# 2. Backend
cd backend
npm ci
npx prisma migrate deploy         # ⚠️ deploy, nunca migrate dev en PRD
npx prisma db seed                # ⚠️ Solo en el PRIMER deploy
npm run build
PORT=8100 pm2 start npm --name luki-play-backend -- run start:prod
pm2 save && pm2 startup

# 3. Frontend
cd ../frontend
npm ci
npm run build:web
sudo cp -r dist/* /var/www/luki-play-ott/
```

| Servicio  | URL PRD                           |
|-----------|-----------------------------------|
| App       | http://\<IP_EC2\>                 |
| CMS       | http://\<IP_EC2\>/cms/login       |
| Backend   | http://\<IP_EC2\>:8100            |

---

### Diferencias clave DEV vs PRD

| Aspecto           | DEV                        | PRD                                  |
|-------------------|----------------------------|--------------------------------------|
| Compose file      | `docker-compose.yml`       | `docker-compose.prod.yml`            |
| Runner backend    | `npm run start:dev`        | PM2 + `npm run start:prod`           |
| Puerto backend    | 3000                       | 8100                                 |
| Puerto frontend   | Expo dev server (8081)     | Nginx → `/var/www/luki-play-ott`     |
| Migración DB      | `prisma migrate dev`       | `prisma migrate deploy`              |
| Seed              | Siempre que se necesite    | **Solo primer deploy**               |
| Instalar deps     | `npm install`              | `npm ci`                             |
| NODE\_ENV         | `development`              | `production`                         |
| JWT secrets       | Valores hardcodeados (dev) | `openssl rand -hex 32` por cada uno  |
| SMTP              | Mailtrap (sandbox)         | Titan Email real (`noreply@luki.ec`) |

---

## Credenciales de Prueba

> Los datos se cargan con `npx prisma db seed`. Contraseña por defecto: `password123`.

### App de Suscriptores

Los suscriptores se autentican con **cédula de identidad + contraseña** (`POST /auth/app/id-login`).
La primera vez deben completar el flujo de **primer acceso** (2 pasos):
1. `POST /auth/app/first-access` → ingresa cédula → confirma datos
2. `POST /auth/app/request-activation-code` → recibe código por email
3. `POST /auth/app/activate` → ingresa código + contraseña → cuenta activada

| Cédula       | Nombre                   | Estado     | Nota                         |
|--------------|--------------------------|------------|------------------------------|
| 1720289063   | CASTRO DANIEL            | Anulado    | Cuenta cancelada             |
| 0504130527   | DOICELA NEGRETE J.       | Suspendido | Sin email → código no llega  |
| 0503557068   | PASTUNA CHUSIN MANUEL    | Activo     | Requiere primer acceso       |
| 1713830626   | CATOTA YUGSI JENNY       | Activo     | Requiere primer acceso       |
| 0502855224   | AYALA USUNO JOSE NEPTALI | Activo     | Requiere primer acceso       |

Se incluyen ~47 suscriptores del ISP en la BD. Todos tienen `mustChangePassword: true`
y `isAccountActivated: false` hasta completar primer acceso.

### Panel CMS

| Email                  | Contraseña  | Rol        |
|------------------------|-------------|------------|
| admin@lukiplay.com     | password123 | SUPERADMIN |
| gestion@lukiplay.com   | password123 | ADMIN      |
| soporte@lukiplay.com   | password123 | SOPORTE    |

> ⚠️ Cambiar estas contraseñas inmediatamente en producción vía CMS → Perfil → Cambiar contraseña.

---

## Estructura del Proyecto

```
Luki-Play-OTT/
├── backend/                         # API NestJS
│   ├── prisma/
│   │   ├── schema.prisma            # 18 modelos · 12 enums
│   │   ├── seed.ts                  # Seed: plan + roles + categorías + 47 suscriptores + CMS
│   │   └── migrations/              # Migraciones SQL aplicadas en orden
│   ├── src/
│   │   ├── main.ts                  # Bootstrap + Swagger + CORS + ValidationPipe
│   │   ├── app.module.ts            # Módulo raíz
│   │   ├── common/
│   │   │   ├── filters/             # Filtro global de excepciones HTTP
│   │   │   └── pipes/               # Pipe de validación global (class-validator)
│   │   └── modules/
│   │       ├── auth/                # Autenticación hexagonal (login, JWT, OTP, sesiones)
│   │       │   ├── application/     # Casos de uso + DTOs
│   │       │   ├── domain/          # Entidades + interfaces (puertos)
│   │       │   ├── infrastructure/  # JWT, bcrypt, Nodemailer, repositorios
│   │       │   └── presentation/    # Controlador, guards, decoradores
│   │       ├── prisma/              # PrismaService + repositorios PostgreSQL
│   │       ├── access-control/      # RBAC: CMS_MODULES, VALID_CMS_PERMISSIONS
│   │       ├── admin/               # CMS — usuarios, canales, planes, sliders, etc.
│   │       ├── public/              # API suscriptores — canales, streams, devices, parental control
│   │       │   ├── stream-session.service.ts  # Control de slots concurrentes
│   │       │   ├── device.service.ts          # Gestión de dispositivos registrados
│   │       │   └── parental-control.service.ts# Control parental con PIN bcrypt
│   │       ├── subscription/        # Ciclo de vida de suscripciones + cron job
│   │       ├── favorites/           # Favoritos por (usuario, canal, dispositivo, perfil)
│   │       ├── billing/             # Facturación (mock, para integración futura)
│   │       ├── crm/                 # CRM (mock, para integración futura)
│   │       └── profiles/            # Perfiles de visualización (placeholder)
│   ├── Dockerfile                   # Build multi-stage Node 20
│   └── .env.example                 # Referencia de variables de entorno
├── frontend/                        # App Expo / React Native
│   ├── app/
│   │   ├── _layout.tsx              # Stack raíz (fuente + splash)
│   │   ├── index.tsx                # Gate de sesión → redirección
│   │   ├── (auth)/                  # Login + OTP (sin header)
│   │   ├── (app)/                   # Área autenticada del suscriptor
│   │   │   ├── (tabs)/              # Tabs: Inicio · Buscar · Mi Lista
│   │   │   │   ├── home.tsx         # Home — canales, slider hero, favoritos, menú usuario
│   │   │   │   ├── search.tsx       # Búsqueda (placeholder)
│   │   │   │   └── favorites.tsx    # Canal favoritos
│   │   │   ├── profile.tsx          # Perfil del suscriptor
│   │   │   ├── subscription.tsx     # Estado de suscripción
│   │   │   ├── devices.tsx          # Gestión de dispositivos registrados
│   │   │   ├── parental-control.tsx # Control parental — PIN, niveles KIDS/FAMILY/TEEN/ALL
│   │   │   └── player/[id].tsx      # Reproductor full-screen (HLS)
│   │   ├── cms/                     # Panel CMS administrativo (13 módulos)
│   │   └── admin/                   # Panel admin legacy
│   ├── components/                  # Componentes reutilizables
│   │   ├── HlsVideoPlayer.tsx       # Player HLS cross-platform (hls.js / expo-av)
│   │   ├── Hero.tsx, MediaRow.tsx   # Componentes de catálogo
│   │   └── cms/                     # CmsShell, CmsComponents, roles/
│   └── services/                    # Stores Zustand + clientes API
│       ├── authStore.ts             # Autenticación suscriptor (persistida en localStorage)
│       ├── cmsStore.ts              # Autenticación CMS
│       ├── contentStore.ts          # Catálogo de contenido
│       ├── useChannels.ts           # Hook canales públicos + favoritos
│       ├── streamApi.ts             # Start/heartbeat/stop de streams
│       └── api/                     # authApi, adminApi, deviceApi, subscriptionApi, etc.
├── docs/
│   ├── ARCHITECTURE.md              # Diagramas, módulos, flujos de auth
│   ├── DEPLOYMENT.md                # Guía completa DEV + PRD
│   └── CONTRIBUTING.md              # Convenciones de commits y ramas
├── deploy/nginx/                    # Configuración Nginx de referencia
├── docker-compose.yml               # DEV: postgres + redis + backend
├── docker-compose.prod.yml          # PRD: postgres + redis (backend corre con PM2)
├── deploy-ec2.sh                    # Script de despliegue automatizado EC2
└── Makefile                         # Atajos de comandos frecuentes
```

---

## Arquitectura

La plataforma sigue una arquitectura **frontend/backend separados** con Nginx como proxy inverso en producción:

```
Browser / App
      │
      ▼
   Nginx :80
  ┌─────────────────────────────────────────────────────┐
  │  /auth/   /admin/   /public/   /api/   /favorites/  │
  │                    ▼                                 │
  │           NestJS :8100 (PM2)                         │
  │                    │                                 │
  │           PostgreSQL :5432   Redis :6379             │
  └─────────────────────────────────────────────────────┘
  │
  │  /  → /var/www/luki-play-ott  (SPA estático)
```

- **Backend**: Arquitectura hexagonal (DDD + puertos y adaptadores) en NestJS 11.
  Los repositorios implementan interfaces de dominio, permitiendo intercambiar
  la capa de datos sin afectar la lógica de negocio.
  Los tokens efímeros (reset, primer acceso) usan repositorios in-memory.

- **Frontend**: Expo Router con file-based routing. Dos experiencias en un solo proyecto:
  la app OTT para suscriptores y el panel CMS para administradores.

> Para detalles completos, ver [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## Control de Acceso (RBAC)

Los permisos se almacenan por **rol** en la tabla `cms_roles`, no por usuario individual.
Al hacer login, los permisos del rol se incluyen en el JWT y se evalúan en cada request
mediante `PermissionsGuard`. Los cambios aplican en el **próximo inicio de sesión** (TTL del access token: 15 min).

| Rol        | Permisos              | Editable desde CMS   |
|------------|-----------------------|----------------------|
| SUPERADMIN | Todos (`cms:*`)       | No (fijo)            |
| ADMIN      | Configurables por módulo | Sí (por SUPERADMIN)|
| SOPORTE    | Configurables por módulo | Sí (por SUPERADMIN)|
| CLIENTE    | Solo app OTT (sin CMS) | No (fijo)           |

**Formato de permiso:** `cms:<módulo>` (padre, implica read+write) o `cms:<módulo>:read` / `cms:<módulo>:write` (granular).

---

## API Endpoints — Resumen

### Auth — `/auth`

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/auth/app/id-login` | Login con cédula + contraseña |
| POST | `/auth/app/contract-login` | Login con número de contrato + contraseña |
| POST | `/auth/app/first-access` | Verificar cédula para primer acceso |
| POST | `/auth/app/request-activation-code` | Solicitar código de activación (6 chars) |
| POST | `/auth/app/verify-activation-code` | Verificar código de activación |
| POST | `/auth/app/activate` | Activar cuenta + establecer contraseña |
| POST | `/auth/app/request-password-otp` | Solicitar OTP para recuperar contraseña |
| POST | `/auth/app/reset-with-otp` | Resetear contraseña con OTP |
| POST | `/auth/cms/login` | Login CMS (email + contraseña) |
| POST | `/auth/refresh` | Rotar refresh token |
| POST | `/auth/logout` | Revocar sesión actual |
| GET  | `/auth/me` | Perfil del usuario autenticado |
| POST | `/auth/change-password` | Cambiar contraseña (revoca todas las sesiones) |

### Público — `/public` (suscriptores autenticados)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET    | `/public/canales` | No | Canales activos (sin streamUrl) |
| GET    | `/public/sliders` | No | Banners/sliders activos |
| GET    | `/public/componentes` | No | Componentes OTT con categorías |
| GET    | `/public/canales/:id/stream` | Sí | URL de stream del canal |
| GET    | `/public/me/plan` | Sí | Plan y suscripción del usuario |
| POST   | `/public/streams/start` | Sí | Reservar slot de stream concurrente |
| PATCH  | `/public/streams/:id/heartbeat` | Sí | Keep-alive del slot (cada 30s) |
| DELETE | `/public/streams/:id` | Sí | Liberar slot de stream |
| POST   | `/public/devices/register` | Sí | Registrar/actualizar dispositivo |
| GET    | `/public/devices` | Sí | Listar dispositivos registrados |
| PATCH  | `/public/devices/:fingerprint` | Sí | Renombrar dispositivo |
| DELETE | `/public/devices/:fingerprint` | Sí | Eliminar dispositivo + revocar sesiones |
| GET    | `/public/sessions` | Sí | Sesiones activas con info de dispositivo |
| GET    | `/public/parental-control` | Sí | Estado del control parental |
| POST   | `/public/parental-control/enable` | Sí | Activar control parental con PIN |
| POST   | `/public/parental-control/disable` | Sí | Desactivar (requiere PIN) |
| POST   | `/public/parental-control/verify` | Sí | Verificar PIN para contenido restringido |
| PATCH  | `/public/parental-control/level` | Sí | Actualizar nivel (KIDS/FAMILY/TEEN/ALL) |
| PATCH  | `/public/parental-control/pin` | Sí | Cambiar PIN |

### Admin (CMS) — `/admin`

Todos los endpoints requieren JWT + `PermissionsGuard`. Ver Swagger para la lista completa.

| Recurso       | Operaciones disponibles |
|---------------|------------------------|
| Usuarios      | CRUD, cambio de contraseña, sesiones, asignación de plan |
| Canales       | CRUD, toggle activo, upload de logo, validación de stream |
| Categorías    | CRUD, reorder, asignación M:M con canales |
| Componentes   | CRUD, reorder, asignación M:M con categorías |
| Planes        | CRUD, toggle activo, migración masiva de contratos |
| Sliders       | CRUD, reorder, upload de imagen, scheduling por fechas |
| Roles         | Ver permisos, editar permisos por módulo |
| Suscripciones | Crear, listar, procesar pago, cancelar |
| Monitor       | Stats del sistema, salud de canales |

Documentación interactiva: `http://localhost:3000/api/docs` (Swagger UI)

---

## Módulos del CMS

| Módulo                 | Ruta                           | Estado   |
|------------------------|--------------------------------|----------|
| Dashboard              | /cms/dashboard                 | Activo   |
| Usuarios               | /cms/users                     | Activo   |
| Canales                | /cms/canales                   | Activo   |
| Categorías             | /cms/categorias                | Activo   |
| Componentes            | /cms/componentes               | Activo   |
| Planes                 | /cms/planes                    | Activo   |
| Sliders                | /cms/sliders                   | Activo   |
| Monitor                | /cms/monitor                   | Activo   |
| Roles y Permisos       | /cms/roles                     | Activo   |
| Analítica              | /cms/analitica                 | Activo   |
| Notificaciones Admin   | /cms/notificaciones-admin      | Activo   |
| Notificaciones Abonado | /cms/notificaciones-abonado    | Activo   |
| Propaganda             | /cms/propaganda                | Activo   |

---

## Funcionalidades Clave

### Control de Streams Concurrentes

El sistema hace cumplir el límite de streams simultáneos configurado en el plan.
Cuando el reproductor abre → reserva un slot. Cada 30s envía un heartbeat.
Al cerrar → libera el slot. Slots sin heartbeat por más de 90s se reciclan automáticamente.

**Prioridad de resolución del límite:** `Contract.maxConcurrentStreams` → `Subscription.planSnapshot` → `Plan.maxConcurrentStreams`

**Políticas configurables por contrato:**
- `BLOCK_NEW` — rechaza con HTTP 429 cuando el límite está lleno
- `REPLACE_OLDEST` — desconecta el stream más antiguo automáticamente

### Gestión de Dispositivos

Registro de dispositivos por huella digital (`deviceFingerprint` = UUID persistido en localStorage).
Cada dispositivo guarda: tipo (MOBILE/TABLET/DESKTOP/SMART_TV), OS, browser, modelo.
El suscriptor puede renombrar y eliminar dispositivos desde la app. Al eliminar, se revocan todas sus sesiones activas.

### Control Parental

PIN de 4 dígitos numéricos (almacenado como bcrypt hash). Cuatro niveles de restricción:

| Nivel  | Descripción              | Equivalencia         |
|--------|--------------------------|----------------------|
| KIDS   | Solo contenido infantil  | Clasificación G / TV-Y  |
| FAMILY | Apto para familias       | Hasta PG / TV-PG     |
| TEEN   | Adolescentes             | Hasta PG-13 / TV-14  |
| ALL    | Sin restricción          | Todo el contenido    |

La app muestra una pantalla de verificación de PIN antes de acceder a los ajustes de control parental (si está activado). Incluye animación de shake al ingresar un PIN incorrecto y auto-submit al completar 4 dígitos.

---

## Variables de Entorno

Archivo de referencia: `backend/.env.example`

| Variable                   | DEV (default)                                       | PRD (requerido)              |
|----------------------------|-----------------------------------------------------|------------------------------|
| `NODE_ENV`                 | `development`                                       | `production`                 |
| `PORT`                     | `3000`                                              | `8100`                       |
| `DATABASE_URL`             | `postgresql://lukiplay_admin:dev_password_2026@...` | URL PRD con password fuerte  |
| `REDIS_URL`                | `redis://localhost:6379`                            | `redis://localhost:6379`     |
| `SUBSCRIBER_JWT_SECRET`    | `dev-subscriber-jwt-secret-2026`                    | `openssl rand -hex 32`       |
| `ADMIN_JWT_SECRET`         | `dev-admin-jwt-secret-2026`                         | `openssl rand -hex 32`       |
| `JWT_EXPIRATION`           | `15m`                                               | `15m`                        |
| `REFRESH_TOKEN_EXPIRATION` | `7d`                                                | `7d`                         |
| `BCRYPT_SALT_ROUNDS`       | `12`                                                | `12`                         |
| `SMTP_HOST`                | `sandbox.smtp.mailtrap.io`                          | `smtp.titan.email`           |
| `SMTP_PORT`                | `2525`                                              | `465`                        |
| `SMTP_SECURE`              | `false`                                             | `true`                       |
| `SMTP_USER`                | `<mailtrap_user>`                                   | `noreply@luki.ec`            |
| `SMTP_PASS`                | `<mailtrap_pass>`                                   | `<clave_smtp_real>`          |
| `SMTP_FROM`                | `noreply@lukiplay.com`                              | `noreply@luki.ec`            |

---

## Modelos de Base de Datos

El schema Prisma define **18 modelos** y **12 enums** en PostgreSQL.

| Modelo             | Tabla                    | Descripción                                          |
|--------------------|--------------------------|------------------------------------------------------|
| `Customer`         | `customers`              | Suscriptores y usuarios CMS. Incluye PIN de control parental. |
| `Contract`         | `contracts`              | Contratos ISP con límites de dispositivos y streams. |
| `Session`          | `sessions`               | Sesiones JWT activas con refresh token.              |
| `ActiveStream`     | `active_streams`         | Slots de stream concurrentes (heartbeat 90s TTL).    |
| `Device`           | `devices`                | Dispositivos registrados por huella digital.         |
| `Plan`             | `plans`                  | Planes con entitlements, límites y pricing.          |
| `Subscription`     | `subscriptions`          | Suscripciones con snapshot inmutable del plan.       |
| `Payment`          | `payments`               | Pagos asociados a suscripciones.                     |
| `Channel`          | `channels`               | Canales de TV con stream URL, health y metadata.     |
| `Category`         | `categories`             | Categorías de contenido (M:M con canales).           |
| `ChannelFavorite`  | `channel_favorites`      | Favoritos por (usuario, canal, dispositivo, perfil). |
| `Component`        | `components`             | Componentes OTT de la UI (VOD, Live, etc.).          |
| `Slider`           | `sliders`                | Banners/sliders con scheduling y action types.       |
| `ViewingProfile`   | `viewing_profiles`       | Perfiles de visualización por contrato.              |
| `ActivationCode`   | `activation_codes`       | Códigos de activación de 6 chars (corta vida).       |
| `RegistrationRequest` | `registration_requests` | Solicitudes de registro no-ISP pendientes de revisión. |
| `CmsRole`          | `cms_roles`              | Permisos RBAC por rol (array de strings).            |
| `Notification`     | `notifications`          | Historial de notificaciones enviadas.                |

---

## Estado del Proyecto

| Sprint / Fase | Descripción                                                                                 | Estado        |
|---------------|---------------------------------------------------------------------------------------------|---------------|
| 1             | Autenticación (login, OTP, JWT, sesiones)                                                   | ✅ Completado |
| 1.5           | Panel CMS base (diseño, estructura, módulos activos)                                        | ✅ Completado |
| 2             | Módulos CMS avanzados (componentes, autenticación segura)                                   | ✅ Completado |
| 3             | Persistencia PostgreSQL + Prisma + auth por contrato                                        | ✅ Completado |
| 3.5           | Módulo Categorías con campos extendidos y M:M canales                                       | ✅ Completado |
| 3.6           | Módulo Componentes con M:M categorías y persistencia BD                                     | ✅ Completado |
| 3.7           | RBAC por rol: tabla `cms_roles`, permisos editables desde CMS                               | ✅ Completado |
| 3.8           | Módulo Roles rediseñado: matriz read/write, gestión usuarios CMS, perfil CMS                | ✅ Completado |
| 4.0           | Auth por cédula: login directo, OTP recovery, activación 2-pasos; canales públicos          | ✅ Completado |
| 4.1           | Reproductor HLS full-screen: slot de stream, heartbeat, gestión de inactividad              | ✅ Completado |
| 4.2           | Módulo Dispositivos: registro por fingerprint, rename, remove, límite por plan              | ✅ Completado |
| 4.3           | Control parental: PIN bcrypt, niveles KIDS/FAMILY/TEEN/ALL, gate screen, shake animation    | ✅ Completado |
| 4.4           | Rediseño UX: perfil, dropdown home, menú Apple-style, suscripción                          | ✅ Completado |
| 5             | Integración billing/CRM real                                                                | ⏳ Pendiente  |
| 6             | Repositorios in-memory → Redis (tokens efímeros)                                            | ⏳ Pendiente  |
| 7             | HTTPS + dominio + CDN para assets                                                           | ⏳ Pendiente  |

---

## Licencia

Proyecto privado — DataCom S.A. Todos los derechos reservados.
