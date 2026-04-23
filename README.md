# LUKI Play OTT

**Plataforma OTT de streaming y contenido bajo demanda**

Plataforma de streaming completa (Over-The-Top) con dos interfaces diferenciadas:
una aplicación para suscriptores con autenticación de dos factores (contraseña + OTP
por correo) y un panel administrativo CMS para administradores y personal de soporte.

---

## Información del Proyecto

| Campo               | Detalle                                                       |
|---------------------|---------------------------------------------------------------|
| **Nombre**          | LUKI Play OTT                                                 |
| **Propósito**       | Plataforma OTT de streaming y contenido bajo demanda          |
| **Estado**          | v0.5.0-beta — Sprint 4 en progreso (Player integrado con CMS + sistema de diseño definitivo) |
| **Autor**           | Sofia Soria — Product Designer, DataCom S.A.                 |
| **Repositorio**     | https://github.com/Sofilu1537/Luki-Play-OTT                  |
| **Zona horaria**    | America/Guayaquil (UTC-5)                                     |

---

## Tecnologías

| Capa            | Tecnología                              |
|-----------------|-----------------------------------------|
| Frontend        | Expo ~55 / React Native for Web         |
| Estilos         | NativeWind (Tailwind CSS para RN)       |
| Iconos          | Ionicons (`@expo/vector-icons`)         |
| Estado          | Zustand 5                               |
| Backend         | NestJS 11 / TypeScript 5                |
| ORM             | Prisma 7 con PrismaPg adapter           |
| Autenticación   | JWT (access + refresh) + auth por contrato |
| Base de datos   | PostgreSQL 15 (via Docker)              |
| Caché           | Redis 7 (via Docker)                    |
| Streaming       | HLS (hls.js en web, expo-av en native)  |
| Deploy          | AWS EC2 + PM2 + Nginx                   |
| Contenedores    | Docker + Docker Compose                 |

---

## Instalación Rápida

### Requisitos

- Node.js 20 LTS
- npm 10+
- Git
- Docker Desktop (para PostgreSQL y Redis)

### Opción A — Un solo comando (recomendado)

```bash
chmod +x start-all.sh && ./start-all.sh
```

Levanta Docker (backend + PostgreSQL + Redis) y el frontend Expo web en un solo paso.

### Opción B — Manual paso a paso

#### 1. Infraestructura (PostgreSQL + Redis)

```bash
docker compose up -d postgres redis
```

Esperar a que PostgreSQL reporte `healthy` antes de continuar.

#### 2. Backend

```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate dev      # Aplica migraciones a la BD
npx prisma db seed           # Carga datos de prueba
npm run start:dev
```

> **⚠️ Configuración de correo requerida**: el proyecto usa Titan Email para el envío
> de claves temporales y correos transaccionales. En el `.env` se debe completar
> `SMTP_PASS` para la cuenta `noreply@luki.ec`:
>
> `SMTP_HOST=smtp.titan.email`
> `SMTP_PORT=465`
> `SMTP_SECURE=true`
> `SMTP_USER=noreply@luki.ec`
> `SMTP_FROM=noreply@luki.ec`
>
> Sin `SMTP_PASS`, el envío de OTP, códigos de activación y recuperación de contraseña
> no funcionará.

El backend queda disponible en `http://localhost:3000`.
Swagger: `http://localhost:3000/api/docs`

#### 3. Frontend

```bash
cd frontend
npm install
npx expo start --web
```

La app queda disponible en `http://localhost:8081`.

### URLs de Desarrollo

| Servicio      | URL                                  |
|---------------|--------------------------------------|
| App (login)   | http://localhost:8081/login           |
| CMS (login)   | http://localhost:8081/cms/login       |
| Player        | http://localhost:8081/player/live     |
| Swagger API   | http://localhost:3000/api/docs        |
| Backend API   | http://localhost:3000                 |

---

## Credenciales de Prueba

> Los datos se cargan con `npx prisma db seed`. Contraseña por defecto: `password123`.

### App de Suscriptores (auth por contrato)

Los suscriptores se autentican con **número de contrato + contraseña**.
La primera vez deben completar el flujo de **primer acceso** (`/auth/app/first-access`)
para activar su cuenta y establecer contraseña.

| Contrato    | Nombre                  | Estado     | Nota                      |
|-------------|-------------------------|------------|---------------------------|
| 000000000   | CASTRO DANIEL           | Anulado    | Cuenta cancelada          |
| 000000002   | DOICELA NEGRETE J.      | Suspendido | Requiere primer acceso    |
| 000000003   | TOCTE VELASQUE W.       | Suspendido | Requiere primer acceso    |
| 999000001   | Contrato Test Luki      | Activo     | Usuario QA permanente     |

Se incluyen 47 suscriptores del ISP con contratos reales en la BD.
Todos tienen `mustChangePassword: true` hasta completar primer acceso.

El usuario QA (`contract.test@lukiplay.com` / `password123`) tiene acceso permanente
para pruebas de smoke test en dev y staging sin necesidad de primer acceso.

### Panel CMS

| Email                    | Contraseña   | Rol            |
|--------------------------|--------------|----------------|
| admin@lukiplay.com       | password123  | Super Admin    |
| soporte@lukiplay.com     | password123  | Soporte        |

---

## Estructura del Proyecto

```
Luki-Play-OTT/
├── backend/                        # API NestJS
│   ├── prisma/
│   │   ├── schema.prisma           # Modelos de datos (11 modelos, 5 enums)
│   │   ├── seed.ts                 # Seed: 47 suscriptores + 2 CMS + usuario QA + canales
│   │   └── migrations/             # Migraciones SQL de PostgreSQL
│   ├── prisma.config.ts            # Configuración Prisma 7 (datasource + seed)
│   ├── src/
│   │   ├── main.ts                 # Bootstrap + Swagger
│   │   ├── app.module.ts           # Módulo raíz
│   │   ├── common/
│   │   │   ├── filters/            # Filtro global de excepciones (con logging HttpException)
│   │   │   └── pipes/              # Pipe de validación global
│   │   └── modules/
│   │       ├── auth/               # Autenticación (login, JWT, sesiones, activation codes)
│   │       │   ├── application/    # DTOs y casos de uso
│   │       │   ├── domain/         # Entidades e interfaces
│   │       │   ├── infrastructure/ # JWT, bcrypt, Nodemailer
│   │       │   └── presentation/   # Controlador, guards, decoradores
│   │       ├── prisma/             # PrismaService + repositorios PostgreSQL
│   │       │   └── repositories/   # Implementaciones Prisma de los puertos
│   │       ├── access-control/     # Permisos y roles (RBAC)
│   │       ├── admin/              # Gestión CMS (usuarios, componentes, canales, planes)
│   │       ├── public/             # Endpoints públicos: GET /public/canales, /public/componentes
│   │       ├── billing/            # Facturación (mock)
│   │       ├── crm/                # CRM (mock)
│   │       └── profiles/           # Perfiles de usuario
│   ├── test/                       # Tests E2E
│   ├── Dockerfile                  # Build multi-stage Node 20 (CMD apunta a dist/src/main.js)
│   └── .env.example                # Variables de entorno de referencia
├── frontend/                       # App Expo / React Native
│   ├── app/
│   │   ├── (auth)/                 # Pantallas de login (contraseña + OTP)
│   │   ├── (app)/                  # Área autenticada (home, búsqueda, favoritos)
│   │   ├── cms/                    # Panel CMS administrativo
│   │   ├── admin/                  # Panel admin legacy
│   │   └── player/                 # Reproductor HLS con controles avanzados
│   ├── components/
│   │   ├── HlsVideoPlayer.tsx      # Reproductor HLS (hls.js web + expo-av native) con control de volumen
│   │   ├── SplashIntro.tsx         # Animación de entrada con branding LUKI PLAY
│   │   ├── ChannelLogo (inline)    # Renderiza logo como URL, emoji o Ionicon según tipo
│   │   └── cms/                    # Componentes del CMS (CmsShell, StatsCard, LiveChannels…)
│   └── services/
│       ├── channelTypes.ts         # Tipos Channel + STATIC_CHANNELS + helpers EPG
│       ├── useChannels.ts          # Hook: fetch desde backend, caché local, reload silencioso
│       └── api/                    # Funciones de comunicación (API_BASE_URL unificada)
├── start-all.sh                    # Levanta Docker + Expo web en un comando
├── docs/                           # Documentación técnica
├── docker-compose.yml              # Orquestación de servicios
└── deploy-ec2.sh                   # Script de despliegue en EC2
```

---

## Arquitectura

La plataforma sigue una arquitectura **frontend/backend separados**:

- **Backend**: Arquitectura hexagonal (DDD + puertos y adaptadores) con NestJS.
  Persistencia real con PostgreSQL via Prisma 7 (PrismaPg adapter).
  Los repositorios implementan interfaces de dominio, permitiendo
  intercambiar la capa de datos sin afectar la lógica de negocio.

- **Frontend**: Expo con file-based routing (Expo Router). Dos experiencias:
  la app OTT para suscriptores y el panel CMS para administradores.

> Para detalles completos, ver [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## Módulos del CMS

| Módulo                  | Ruta                            | Estado        |
|-------------------------|---------------------------------|---------------|
| Dashboard               | /cms/dashboard                  | Activo        |
| Usuarios                | /cms/users                      | Activo        |
| Componentes             | /cms/componentes                | Activo        |
| Planes                  | /cms/planes                     | Activo        |
| Canales                 | /cms/canales                    | Activo        |
| Categorías              | /cms/categorias                 | Activo        |
| Monitor                 | /cms/monitor                    | Activo        |
| Roles                   | /cms/roles                      | Activo        |

---

## Estado del Proyecto

| Sprint | Descripción                                               | Estado        |
|--------|-----------------------------------------------------------|---------------|
| 1      | Autenticación (login, OTP, JWT, roles)                    | ✅ Completado |
| 1.5    | Panel CMS base (diseño, estructura, módulos activos)      | ✅ Completado |
| 2      | Módulos CMS avanzados (componentes, autenticación segura) | ✅ Completado |
| 3      | Persistencia PostgreSQL + Prisma + auth por contrato      | ✅ Completado |
| 3.5    | Módulo Categorías con campos extendidos y M:M canales     | ✅ Completado |
| 3.6    | Módulo Componentes con M:M categorías y persistencia BD   | ✅ Completado |
| 4      | Integración CMS ↔ Player + sistema de diseño definitivo   | 🔄 En progreso |
| 5      | Integración billing/CRM real                              | ⏳ Pendiente  |

---

## Historial de cambios — rama `Integracion-CMS-con-player`

### Backend

**Endpoint público de canales** (`GET /public/canales`)
- El frontend del player ahora consume los canales directamente desde la BD en lugar de usar datos estáticos.
- El endpoint filtra canales activos y normaliza el modelo para el player (id, nombre, logo, streamUrl, categoria).

**Usuario QA permanente en seed**
- Se agregó `contract.test@lukiplay.com` (contrato `999000001`) con acceso permanente.
- Permite smoke testing en dev/staging sin necesidad de completar flujo de primer acceso.

**Canales de prueba en seed**
- 5 canales HLS de prueba (Canal 1 HD, Gama TV, TC Televisión, Ecuador TV, Teleamazonas) con URLs reales.

**Corrección Dockerfile**
- El CMD apuntaba a `dist/main.js`; corregido a `dist/src/main.js` para reflejar la salida real del compilador NestJS.

**Logging de excepciones HTTP**
- `GlobalExceptionFilter` ahora registra el status y el body de toda `HttpException` antes de responder, facilitando el debugging en producción.

**Validación de URLs opcionales en DTO de canal**
- `backupUrl` y `logoUrl` usan `@ValidateIf` para aceptar cadena vacía sin disparar `@IsUrl`.

---

### Frontend — Sistema de diseño

**Paleta definitiva LUKI PLAY**
- Russian Violet `#240046` como color primario oscuro.
- Rebecca Purple `#60269E` como acento de superficie.
- Selective Yellow `#FFB800` como color de acción.
- Cosmic Latte `#FAF6E7` como blanco de texto.
- African Violet `#B07CC6` como gris de interfaz.
- La paleta se aplica desde `tailwind.config.js` y se propaga a todos los componentes.

**Migración a Ionicons**
- Se reemplazó `FontAwesome` por `@expo/vector-icons/Ionicons` en tabs, Hero y home.
- Los tabs usan íconos outline/filled según estado activo (`home` / `home-outline`, etc.).

---

### Frontend — Player y reproducción

**HlsVideoPlayer con control de volumen**
- Prop `volume` (0–1) propagada a `<video>.volume` en web y a `expo-av` en native.
- Sincronización en tiempo real vía `useEffect`; `muted` se activa automáticamente cuando `volume === 0`.

**Splash intro animado**
- `SplashIntro.tsx` se muestra una vez por sesión antes de la pantalla de login.
- El layout raíz fusiona la carga de fuentes (`useFonts`) con la animación: la splash aparece solo cuando las fuentes ya están listas.

**Player con controles avanzados**
- Control de volumen deslizable en la barra inferior (`BottomInfoBar`).
- Botón de fullscreen usando la Fullscreen API del browser; sincroniza el estado con el evento `fullscreenchange`.
- Navegación por swipe entre canales con `PanResponder` (>50 px horizontal cambia de canal).
- `Stack.Screen headerShown: false` en todos los estados de carga y error para evitar header fantasma.

**ChannelLogo adaptativo**
- Componente inline que renderiza el logo del canal según su tipo:
  - URL `http…` → `<Image>` con `resizeMode: contain`
  - Emoji → `<Text>`
  - Vacío / `'📺'` → `<Ionicons name="tv-outline">`
- Usado en home (tarjetas de canal) y en el player (barra inferior, lista de canales, panel Now Playing).

---

### Frontend — Pantalla Home

- Hero banner de TV en vivo con botón "Reproducir" usando `Ionicons` y colores definitivos.
- `ChannelRow` con soporte de logos URL/emoji/icono y badge EN VIVO pill-style.
- Reload silencioso de canales al enfocar la pantalla (`reloadChannels(true)`) para mantener la lista actualizada sin flash de carga.

---

### Frontend — CMS

**Dashboard simplificado**
- Se eliminó el hero banner con `LinearGradient`, decoradores y badge FIFA.
- Reemplazado por un encabezado contextual con saludo dinámico (Buenos días/tardes/noches) y nombre del usuario.
- Las secciones usan tipografía más pequeña y menos énfasis visual.

**Login CMS limpiado**
- Se eliminaron los tres "orbs" de bokeh y el `LinearGradient` de fondo; el contenedor ahora es un `View` plano (`#160030`).
- Bordes redondeados y sombras reducidos para una UI más sobria.

**CmsShell**
- Se eliminó el subtítulo "CONTROL CENTER" bajo el logo.
- Se eliminó el label "NAVEGACIÓN" sobre el menú; reemplazado por un separador horizontal sutil.

**StatsCard**
- Texto de etiqueta con menor contraste y tamaño de fuente aumentado (9 → 12 pt) para mejor legibilidad.

**Usuarios (users.tsx)**
- Fix TypeScript: `createdAt` accedido con cast `(user as any)` en `FieldCard` y en la exportación Excel.
- Eliminada prop `title` inválida de `TouchableOpacity` en tres botones de acción.
- `import('xlsx')` reemplazado por `Promise.resolve().then(() => require('xlsx'))` para evitar el error de tipo con dynamic import en React Native web.

---

### Dev tooling

**`start-all.sh`**
- Levanta `docker compose up -d` (backend + PostgreSQL + Redis) y luego `npx expo start --web`.
- Un único comando para arrancar todo el ecosistema en desarrollo.

**`API_BASE_URL` unificada**
- `useChannels.ts` usa la constante `API_BASE_URL` de `services/api/config.ts` en lugar de `http://localhost:3000` hardcodeado.
- Permite cambiar el host del backend en un único lugar.

**Preservación de favoritos en reload**
- Al recargar canales desde el backend, se conserva el estado `isFavorite` de la sesión actual comparando IDs.

---

## Licencia

Proyecto privado — DataCom S.A. Todos los derechos reservados.
