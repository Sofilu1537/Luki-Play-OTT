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
| **Estado**          | Desarrollo activo — Sprint 2 completado                       |
| **Autor**           | Marco Logacho — Director de Desarrollo Digital e IA, DataCom S.A. |
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
| Autenticación   | JWT (access + refresh) + OTP por correo |
| Persistencia    | In-memory (repositorios reemplazables)  |
| Streaming       | HLS (hls.js en web, expo-av en native)  |
| Deploy          | AWS EC2 + PM2 + Nginx                   |
| Contenedores    | Docker + Docker Compose                 |

---

## Instalación Rápida

### Requisitos

- Node.js 20 LTS
- npm 10+
- Git

### Backend

```bash
cd backend
cp .env.example .env
npm install
npm run start:dev
```

El backend queda disponible en `http://localhost:3000`.
Swagger: `http://localhost:3000/api/docs`

### Frontend

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

> Para instrucciones detalladas de despliegue, ver [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

---

## Credenciales de Prueba

### App de Suscriptores

| Contrato       | Contraseña     | Tipo        | Estado              |
|----------------|----------------|-------------|---------------------|
| CONTRACT-001   | password123    | ISP         | Activo              |
| CONTRACT-002   | password123    | ISP         | Activo              |
| CONTRACT-003   | password123    | ISP         | Suspendido          |
| OTT-000001     | password123    | OTT-only    | Activo              |

OTP en desarrollo: `123456` (ver logs del backend).

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
│   ├── src/
│   │   ├── main.ts                 # Bootstrap + Swagger
│   │   ├── app.module.ts           # Módulo raíz
│   │   ├── common/
│   │   │   ├── filters/            # Filtro global de excepciones
│   │   │   └── pipes/              # Pipe de validación global
│   │   └── modules/
│   │       ├── auth/               # Autenticación (login, OTP, JWT, sesiones)
│   │       │   ├── application/    # DTOs y casos de uso
│   │       │   ├── domain/         # Entidades e interfaces
│   │       │   ├── infrastructure/ # JWT, bcrypt, OTP mock, repos in-memory
│   │       │   └── presentation/   # Controlador, guards, decoradores
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
  Cada módulo expone interfaces que permiten reemplazar la implementación
  (ej: pasar de in-memory a PostgreSQL sin cambiar lógica de negocio).

- **Frontend**: Expo con file-based routing (Expo Router). Dos experiencias:
  la app OTT para suscriptores y el panel CMS para administradores.

> Para detalles completos, ver [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## Módulos del CMS

| Módulo               | Ruta               | Estado        |
|----------------------|--------------------|---------------|
| Dashboard            | /cms/dashboard     | Activo        |
| Usuarios             | /cms/users         | Activo        |
| Contratos            | /cms/accounts      | Activo        |
| Sesiones             | /cms/sessions      | Activo        |
| Componentes          | /cms/componentes   | Activo        |
| Planes               | /cms/planes        | Activo        |
| Sliders              | /cms/sliders       | Activo        |
| Canales              | /cms/canales       | Activo        |
| Categorías           | /cms/categorias    | Activo        |
| Blog                 | /cms/blog          | Activo        |
| Monitor              | /cms/monitor       | Activo        |
| Impuestos            | /cms/impuestos     | Activo        |

---

## Estado del Proyecto

| Sprint | Descripción                                               | Estado      |
|--------|-----------------------------------------------------------|-------------|
| 1      | Autenticación (login, OTP, JWT, roles)                    | Completado  |
| 1.5    | Panel CMS base (diseño, estructura, módulos activos)      | Completado  |
| 2      | Módulos CMS avanzados (componentes, autenticación segura) | Completado  |
| 3      | Persistencia real (base de datos PostgreSQL + Redis)      | Pendiente   |
| 4      | Integración billing/CRM real                              | Pendiente   |

---

## Licencia

Proyecto privado — DataCom S.A. Todos los derechos reservados.
