# 🎬 Luki Play OTT — Plataforma de Streaming

Plataforma OTT (Over-The-Top) diseñada para clientes ISP y clientes OTT-only.
Incluye autenticación de dos factores (contraseña + OTP por correo), panel CMS para usuarios internos y arquitectura limpia lista para escalar.

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Backend | NestJS + TypeScript (Clean Architecture) |
| Frontend | Expo / React Native (web + móvil) |
| Autenticación | JWT + Refresh Token Rotation + OTP |
| Estado cliente | Zustand |
| Hash de passwords | bcrypt |
| Docs API | Swagger / OpenAPI |
| Contenedores | Docker + Docker Compose |

## Arquitectura

Monorepo con dos servicios independientes:

```
Luki-Play-OTT/
├── backend/    ← API NestJS (auth, OTP, JWT, guards)
├── frontend/   ← App Expo/React Native (cliente + CMS admin)
└── docs/       ← Documentación técnica
```

Ver [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) para más detalles.

---

## Prerrequisitos

- [Git](https://git-scm.com/download/win)
- [Node.js 20 LTS](https://nodejs.org/)
- npm (incluido con Node.js)
- PowerShell (Windows)

---

## Instalación paso a paso (Windows)

### Clonar el repositorio

```powershell
git clone https://github.com/Sofilu1537/Luki-Play-OTT.git
cd Luki-Play-OTT
```

### Terminal 1 — Backend (API)

```powershell
cd backend
copy .env.example .env
npm install
npm run start:dev
```

Espera hasta ver:

```
[Bootstrap] Auth service running on port 3000
[Bootstrap] Swagger docs available at http://localhost:3000/api/docs
```

### Terminal 2 — Frontend (App visual)

Abre **otra** ventana de PowerShell:

```powershell
cd frontend
npm install
npx expo start --web
```

Espera hasta ver:

```
Web is waiting on http://localhost:8081
```

> ⚠️ **Mantén ambas terminales abiertas** mientras usas la aplicación.

---

## URLs disponibles

| Servicio | URL |
|---|---|
| App Cliente | http://localhost:8081 |
| CMS Admin | http://localhost:8081/cms/login |
| API Backend | http://localhost:3000 |
| Swagger Docs | http://localhost:3000/api/docs |

---

## Credenciales de prueba

### App Cliente (login con contrato + OTP)

| Contrato | Password | Estado ISP | Acceso OTT |
|---|---|---|---|
| `CONTRACT-001` | `password123` | ACTIVO | ✅ Permitido |
| `CONTRACT-002` | `password123` | ACTIVO | ✅ Permitido |
| `CONTRACT-003` | `password123` | SUSPENDIDO | ⚠️ Restringido |
| `CONTRACT-004` | `password123` | CORTESIA | ✅ Permitido |
| `OTT-000001` | `password123` | N/A (OTT-only) | ✅ Permitido |

**Código OTP en desarrollo:** siempre es `123456`

> El código real aparece en los logs del backend:
> ```
> [MockOtpService] [MOCK] OTP 123456 sent to juan@example.com
> ```

### CMS Admin (login con email, sin OTP)

| Email | Password | Rol |
|---|---|---|
| `admin@lukiplay.com` | `password123` | SUPERADMIN |
| `soporte@lukiplay.com` | `password123` | SOPORTE |

---

## Con Docker (opcional)

```powershell
docker compose up --build
```

Esto levanta el backend, PostgreSQL y Redis automáticamente.

Ver [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) para guía completa de despliegue.

---

## Documentación técnica

| Documento | Descripción |
|---|---|
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Arquitectura, entidades, flujos y guards |
| [`docs/API.md`](docs/API.md) | Referencia completa de todos los endpoints |
| [`docs/SPRINT1-CHANGELOG.md`](docs/SPRINT1-CHANGELOG.md) | Changelog del Sprint 1 y Sprint 1.5 (CMS) |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Guía de despliegue local y Docker |

---

## Estructura del proyecto

```
Luki-Play-OTT/
├── frontend/               ← Expo/React Native
│   ├── app/
│   │   ├── (auth)/         ← Login cliente + pantalla OTP
│   │   ├── (app)/          ← Catálogo protegido
│   │   ├── cms/            ← Panel admin (Sprint 1.5)
│   │   └── admin/          ← Gestión de canales
│   ├── services/           ← Zustand stores
│   └── components/         ← Componentes UI reutilizables
├── backend/                ← NestJS
│   └── src/
│       ├── modules/
│       │   ├── auth/        ← Módulo de autenticación completo
│       │   ├── billing/     ← Mock de facturación
│       │   ├── crm/         ← Mock de CRM
│       │   └── profiles/    ← Perfiles de usuario
│       └── common/          ← Filtros y pipes globales
├── docker-compose.yml
└── docs/                   ← Documentación técnica
```
