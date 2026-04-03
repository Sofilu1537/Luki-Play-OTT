# Luki Play OTT

Plataforma OTT completa con dos interfaces diferenciadas: app de suscriptores (autenticación con OTP por correo) y panel administrativo CMS para administradores y soporte.

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | Expo ~4 / React Native for Web |
| Estado | Zustand 5 |
| Backend | NestJS 11 |
| Auth | JWT (access + refresh) + OTP por correo |
| Persistencia | In-memory (repositorios reemplazables) |
| Deploy | AWS EC2 + PM2 + Nginx |

---

## Estructura del proyecto

```
Luki-Play-OTT/
├── frontend/
│   ├── app/
│   │   ├── (app)/          # App de suscriptores (home, búsqueda, favoritos)
│   │   ├── (auth)/         # Login OTP de suscriptores
│   │   ├── cms/            # Panel CMS (admin/soporte)
│   │   └── player/         # Reproductor de contenido
│   ├── components/
│   │   └── cms/
│   │       └── CmsShell.tsx  # Layout compartido del CMS (Sidebar + TopBar)
│   └── services/api/
│       └── config.ts         # URL base de la API
├── backend/
│   └── src/
│       └── modules/
│           ├── auth/         # Auth, sesiones, OTP, JWT
│           ├── admin/        # Gestión de usuarios CMS
│           ├── billing/      # Facturación (mock)
│           ├── crm/          # CRM (mock)
│           └── profiles/     # Perfiles
└── docker-compose.yml
```

---

## Desarrollo local

### Requisitos

- Node.js 20 LTS
- Git

### Terminal 1 — Backend

```bash
cd backend
cp .env.example .env
npm install
npm run start:dev
```

El backend queda disponible en `http://localhost:3000`.  
Swagger: `http://localhost:3000/api/docs`

### Terminal 2 — Frontend

```bash
cd frontend
npm install
npx expo start --web
```

La app queda disponible en `http://localhost:8081`.

### Con Docker

```bash
docker compose up --build
```

---

## Flujos de autenticación

### App de suscriptores

1. Ingresar número de contrato y contraseña
   - Contratos de prueba: `CONTRACT-001`, `CONTRACT-002`, `CONTRACT-003`
   - Contraseña: `password123`
2. Se envía OTP al correo asociado
   - En desarrollo, el OTP siempre es `123456` (ver logs del backend)
3. Ingresar OTP → acceso al catálogo

### Panel CMS (Admin / Soporte)

- URL: `/cms/login`
- Credenciales de prueba: `admin@lukiplay.com` / `password123`
- Autenticación directa con email y contraseña (sin OTP)

---

## Panel CMS

Interfaz administrativa con diseño "Nebula Dark" (identidad propia de Luki Play).

### Módulos del sidebar

| Módulo | Ruta | Estado |
|---|---|---|
| Usuarios | `/cms/users` | Activo |
| Componentes | `/cms/componentes` | En desarrollo |
| Planes | `/cms/planes` | Activo |
| Canales | `/cms/canales` | Activo |
| Categorías | `/cms/categorias` | Activo |
| Sliders | `/cms/sliders` | Activo |
| Monitor | `/cms/monitor` | Activo |
| Notificaciones Admin | `/cms/notificaciones-admin` | En desarrollo |
| Analítica | `/cms/analitica` | En desarrollo |
| Propaganda | `/cms/propaganda` | En desarrollo |
| Notificaciones Abonado | `/cms/notificaciones-abonado` | En desarrollo |
| Abonado | `/cms/abonado` | En desarrollo |

El dashboard post-login (`/cms/dashboard`) muestra saludo con hora, 4 tarjetas de métricas (usuarios, contratos, canales, planes) y estado del sistema. No aparece en el sidebar.

### Sistema de diseño (CmsShell / C)

Todos los módulos importan el objeto `C` desde `components/cms/CmsShell.tsx`:

```typescript
// Colores principales
C.void      // #050B17 — fondo más profundo
C.panel     // #070E1D — sidebar y topbar
C.surface   // #0C1829 — cards
C.accent    // #7B5EF8 — violeta primario
C.cyan      // #22D3EE
C.green     // #10B981
C.amber     // #FBBF24
C.rose      // #F43F5E
```

---

## Producción

Desplegado en AWS EC2.

| Servicio | URL |
|---|---|
| App OTT | `http://18.117.101.59:8120` |
| CMS Login | `http://18.117.101.59:8120/cms/login` |

### Infraestructura

- **Nginx** en puerto `8120` sirve el build estático de Expo (`dist/`)
- Rutas `/auth/*` y `/admin/*` son proxeadas a `127.0.0.1:8100` (backend)
- **PM2** gestiona el proceso `luki-play-backend` (puerto interno 8100)

### Deploy del frontend

```bash
# Desde /frontend en local
npx expo export --platform web
tar -czf dist.tar.gz dist/

# Subir al servidor
scp -i bot.pem dist.tar.gz ubuntu@18.117.101.59:/tmp/

# En el servidor
ssh -i bot.pem ubuntu@18.117.101.59
cd /var/www/luki-play-ott
tar -xzf /tmp/dist.tar.gz --strip-components=1
```

### Deploy del backend

```bash
# En el servidor
cd /home/ubuntu/Luki-Play-OTT/backend
git pull
npm install --production
pm2 restart luki-play-backend
```

---

## Estado del proyecto

| Sprint | Descripción | Estado |
|---|---|---|
| 1 | Autenticación (login, OTP, JWT, roles) | Completado |
| 1.5 | Panel CMS base (diseño, estructura, módulos activos) | Completado |
| 2 | Módulos CMS avanzados (analítica, notificaciones, propaganda) | Pendiente |
| 3 | Persistencia real (base de datos) | Pendiente |
