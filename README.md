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
| **Estado**          | v0.3.0-beta — Sprint 1 completado (Modulos de autenticación y roles y persistencia en base de datos) |
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

## Instalación Rápida

### Requisitos

- Node.js 20 LTS
- npm 10+
- Git
- Docker Desktop (para PostgreSQL y Redis)

### 1. Infraestructura (PostgreSQL + Redis)

```bash
docker compose up -d postgres redis
```

Esperar a que PostgreSQL reporte `healthy` antes de continuar.

### 2. Backend

```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate dev      # Aplica migraciones a la BD
npx prisma db seed           # Carga datos de prueba (49 usuarios)
npm run start:dev
```

> **⚠️ Configuración de correo requerida**: el proyecto ya usa Titan Email para el envío
> de claves temporales y correos transaccionales. En el `.env` se debe completar
> `SMTP_PASS` para la cuenta `noreply@luki.ec`. Los valores de referencia son:
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

### 3. Frontend

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
| Swagger API   | http://localhost:3000/api/docs        |
| Backend API   | http://localhost:3000                 |

### Todo con Docker

```bash
docker compose up --build
```

> Para instrucciones detalladas de despliegue, ver [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

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

Se incluyen 47 suscriptores del ISP con contratos reales en la BD.
Todos tienen `mustChangePassword: true` hasta completar primer acceso.

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
│   │   ├── seed.ts                 # Seed: 47 suscriptores + 2 CMS + plan
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
│   │       ├── access-control/     # Permisos y roles (RBAC)
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
| 4      | Integración billing/CRM real                              | ⏳ Pendiente  |

---

## Licencia

Proyecto privado — DataCom S.A. Todos los derechos reservados.
