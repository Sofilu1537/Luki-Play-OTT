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
| **Estado**          | v0.4.0-beta — Sprint 1 completado (Autenticación, RBAC granular read/write por módulo, Módulo Roles rediseñado, Perfil con cambio de contraseña) |
| **Autor**           | Sofia Soria  — Product Designer , DataCom S.A. |
| **Repositorio**     | https://github.com/Sofilu1537/Luki-Play-OTT                  |
| **Zona horaria**    | America/Guayaquil (UTC-5)                                     |

---

## Tecnologías

| Capa            | Tecnología                              |
|-----------------|-----------------------------------------|
| Frontend        | Expo ~55 / React Native for Web         |
| Estilos         | NativeWind (Tailwind CSS para RN)       |
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
cp .env.example .env          # Editar: SMTP, DB si es necesario
npm install
npx prisma migrate dev        # ⚠️ Solo DEV — crea migración + aplica
npx prisma db seed            # Carga 47 suscriptores + 3 usuarios CMS + plan
npm run start:dev             # Hot reload en http://localhost:3000

# 3. Frontend (nueva terminal)
cd frontend
npm install
npx expo start --web          # App en http://localhost:8081
```

> **Email en DEV:** usar [Mailtrap](https://mailtrap.io) para capturar OTPs sin enviar correos reales.
> ```
> SMTP_HOST=sandbox.smtp.mailtrap.io   SMTP_PORT=2525   SMTP_SECURE=false
> SMTP_USER=<usuario_mailtrap>         SMTP_PASS=<pass_mailtrap>
> ```

| Servicio    | URL DEV                           |
|-------------|-----------------------------------|
| App login   | http://localhost:8081/login       |
| CMS login   | http://localhost:8081/cms/login   |
| Swagger     | http://localhost:3000/api/docs    |
| Backend     | http://localhost:3000             |

---

### PRD — Producción (AWS EC2)

**Requisitos en el servidor:** Ubuntu/Debian · Node 20 · PM2 · Docker · Nginx

```bash
# 1. Infraestructura (PostgreSQL + Redis — usa compose de producción)
docker compose -f docker-compose.prod.yml --env-file backend/.env up -d

# 2. Backend
cd backend
npm ci                            # ⚠️ ci, no install — reproduce package-lock exacto
npx prisma migrate deploy         # ⚠️ deploy, no migrate dev — solo aplica, no genera
npx prisma db seed                # ⚠️ Solo en el PRIMER deploy — cambiar passwords CMS después
npm run build
PORT=8100 pm2 start npm --name luki-play-backend -- run start:prod
pm2 save && pm2 startup           # Autostart al reiniciar el servidor

# 3. Frontend
cd ../frontend
npm ci
npm run build:web
sudo cp -r dist/* /var/www/luki-play-ott/
```

| Servicio  | URL PRD                         |
|-----------|---------------------------------|
| App       | http://\<IP_EC2\>:8120          |
| CMS       | http://\<IP_EC2\>:8120/cms/login |
| Backend   | http://\<IP_EC2\>:8100          |

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

### App de Suscriptores (auth por cédula)

Los suscriptores se autentican con **cédula de identidad + contraseña** (`POST /auth/app/id-login`).
La primera vez deben completar el flujo de **primer acceso** (2 pasos):
1. `POST /auth/app/first-access` → ingresa cédula → recibe OTP por correo
2. `POST /auth/app/activate` → ingresa OTP + contraseña → cuenta activada

| Cédula       | Nombre                     | Estado     | Nota                          |
|--------------|----------------------------|------------|-------------------------------|
| 1720289063   | CASTRO DANIEL              | Anulado    | Cuenta cancelada              |
| 0504130527   | DOICELA NEGRETE J.         | Suspendido | Sin email → OTP no llega      |
| 0503557068   | PASTUNA CHUSIN MANUEL      | Activo     | Requiere primer acceso        |
| 1713830626   | CATOTA YUGSI JENNY         | Activo     | Requiere primer acceso        |
| 0502855224   | AYALA USUNO JOSE NEPTALI   | Activo     | Plan Hogar Super (4 devices)  |

Se incluyen ~47 suscriptores del ISP en la BD. Todos tienen `mustChangePassword: true`
y `isAccountActivated: false` hasta completar primer acceso.

> **Recuperación de contraseña:** `POST /auth/app/request-password-otp` → `{ idNumber }` → OTP → `POST /auth/app/reset-with-otp`

### Panel CMS

| Email                    | Contraseña   | Rol            |
|--------------------------|--------------|----------------|
| admin@lukiplay.com       | password123  | Super Admin    |
| gestion@lukiplay.com     | password123  | Admin          |
| soporte@lukiplay.com     | password123  | Soporte        |

> ⚠️ Cambiar estas contraseñas inmediatamente en producción.

---

## Estructura del Proyecto

```
Luki-Play-OTT/
├── backend/                        # API NestJS
│   ├── prisma/
│   │   ├── schema.prisma           # Modelos de datos (12 modelos, 5 enums)
│   │   ├── seed.ts                 # Seed: 47 suscriptores + 3 CMS + plan + roles
│   │   └── migrations/             # Migraciones SQL de PostgreSQL
│   ├── prisma.config.ts            # Configuración Prisma 7 (datasource + seed)
│   ├── src/
│   │   ├── main.ts                 # Bootstrap + Swagger
│   │   ├── app.module.ts           # Módulo raíz
│   │   ├── common/
│   │   │   ├── filters/            # Filtro global de excepciones
│   │   │   └── pipes/              # Pipe de validación global
│   │   └── modules/
│   │       ├── auth/               # Autenticación (login, JWT, sesiones)
│   │       │   ├── application/    # DTOs y casos de uso
│   │       │   ├── domain/         # Entidades e interfaces
│   │       │   ├── infrastructure/ # JWT, bcrypt, OTP mock
│   │       │   └── presentation/   # Controlador, guards, decoradores
│   │       ├── prisma/             # PrismaService + repositorios PostgreSQL
│   │       │   └── repositories/   # Implementaciones Prisma de los puertos
│   │       ├── access-control/     # RBAC: CMS_MODULES, VALID_CMS_PERMISSIONS, sanitizePermissions()
│   │       ├── admin/              # Gestión CMS (usuarios, componentes, etc.)
│   │       ├── billing/            # Facturación (mock)
│   │       ├── crm/                # CRM (mock)
│   │       ├── profiles/           # Perfiles de usuario
│   │       └── public/             # Endpoints públicos (sin auth)
│   ├── test/                       # Tests E2E
│   ├── Dockerfile                  # Build multi-stage Node 20
│   └── .env.example                # Variables de entorno de referencia
├── frontend/                       # App Expo / React Native
│   ├── app/
│   │   ├── (auth)/                 # Pantallas de login (contraseña + OTP)
│   │   ├── (app)/                  # Área autenticada (home, búsqueda, favoritos)
│   │   ├── cms/                    # Panel CMS administrativo
│   │   ├── admin/                  # Panel admin legacy
│   │   └── player/                 # Reproductor de contenido
│   ├── components/                 # Componentes reutilizables
│   │   └── cms/                    # Componentes del CMS (CmsShell)
│   └── services/                   # Stores Zustand + API clients
│       └── api/                    # Funciones de comunicación con el backend
├── docs/                           # Documentación técnica
├── scripts/                        # Scripts de utilidad
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

## Control de Acceso (RBAC)

Los permisos están almacenados por **rol** en la tabla `cms_roles`, no por usuario individual. Al hacer login, los permisos del rol se incluyen en el JWT y se evalúan en cada request mediante `PermissionsGuard`.

| Rol        | Permisos          | Editable desde CMS |
|------------|-------------------|--------------------|
| SUPERADMIN | Todos (`cms:*`)   | No (fijo)          |
| ADMIN      | Configurables     | Sí (por SUPERADMIN)|
| SOPORTE    | Configurables     | Sí (por SUPERADMIN)|
| CLIENTE    | Solo app OTT      | No (fijo)          |

Los cambios a permisos de un rol aplican a **todos los usuarios** con ese rol en su próximo inicio de sesión. Las sesiones activas conservan el JWT anterior hasta que expira (15 min).

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
| Sliders                 | /cms/sliders                    | Activo        |
| Monitor                 | /cms/monitor                    | Activo        |
| Notificaciones Admin    | /cms/notificaciones-admin       | Activo        |
| Analítica               | /cms/analitica                  | Activo        |
| Propaganda              | /cms/propaganda                 | Activo        |
| Notificaciones Abonado  | /cms/notificaciones-abonado     | Activo        |
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
| 3.7    | RBAC por rol: tabla `cms_roles`, permisos editables desde CMS | ✅ Completado |
| 3.8    | Módulo Roles rediseñado: matriz read/write por módulo, gestión de usuarios CMS, perfil con cambio de contraseña | ✅ Completado |
| Sprint_1_integracion-player | Auth por cédula: login directo, OTP recovery, activación 2-pasos; canales públicos sin auth; branding logo PNG | ✅ Completado |
| 4      | Integración billing/CRM real                              | ⏳ Pendiente  |

---

## Licencia

Proyecto privado — DataCom S.A. Todos los derechos reservados.
