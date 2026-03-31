# 🎬 Luki Play OTT — Plataforma de Streaming

Plataforma OTT completa para clientes ISP y OTT-only, con autenticación de dos factores (contraseña + OTP), panel CMS para administración, y arquitectura limpia (Clean Architecture).

## Prerrequisitos

- [Git](https://git-scm.com/download/win)
- [Node.js 20 LTS](https://nodejs.org/)

## Instalación y ejecución en Windows

### Terminal 1 — Backend (API)

```powershell
git clone https://github.com/Sofilu1537/Luki-Play-OTT.git
cd Luki-Play-OTT\backend
copy .env.example .env
npm install
npm run start:dev
```

Cuando veas `Auth service running on port 3000` el backend está listo.

### Terminal 2 — Frontend (App visual)

Abre OTRA ventana de PowerShell:

```powershell
cd Luki-Play-OTT\frontend
npm install
npx expo start --web
```

## URLs disponibles

| Servicio                 | URL                                          |
|--------------------------|----------------------------------------------|
| App cliente (login)      | http://localhost:8081/(auth)/login           |
| App OTP verification     | http://localhost:8081/(auth)/verify-otp      |
| App catálogo             | http://localhost:8081/(app)/home             |
| **CMS login**            | **http://localhost:8081/cms/login**          |
| CMS dashboard            | http://localhost:8081/cms/dashboard          |
| CMS usuarios             | http://localhost:8081/cms/users              |
| CMS contratos            | http://localhost:8081/cms/accounts           |
| CMS sesiones             | http://localhost:8081/cms/sessions           |
| API Backend              | http://localhost:3000                        |
| Swagger docs             | http://localhost:3000/api/docs               |

## Credenciales de prueba

### App Cliente (login con número de contrato)

| Contrato       | Contraseña  | Estado ISP  | Acceso OTT |
|----------------|-------------|-------------|------------|
| CONTRACT-001   | password123 | ACTIVO      | ✅          |
| CONTRACT-002   | password123 | ACTIVO      | ✅          |
| CONTRACT-003   | password123 | SUSPENDIDO  | ❌ (restringido) |
| CONTRACT-004   | password123 | CORTESIA    | ✅          |
| OTT-000001     | password123 | —           | ✅          |

> **OTP en desarrollo**: El código OTP aparece en la terminal del backend:
> ```
> [MockOtpService] OTP for user usr-001: 123456
> ```
> Ingresa ese código en la pantalla de verificación.

### CMS Panel (login con email)

| Email                    | Contraseña  | Rol         |
|--------------------------|-------------|-------------|
| admin@lukiplay.com       | password123 | SUPERADMIN  |
| soporte@lukiplay.com     | password123 | SOPORTE     |

> El CMS **no requiere OTP** — login directo con email + contraseña.

## Flujo de prueba — App Cliente

1. Abre http://localhost:8081 en tu navegador
2. Ingresa número de contrato (ej. `CONTRACT-001`) y contraseña `password123`
3. Aparece la pantalla de OTP
4. Revisa los logs del backend — busca:
   ```
   [MockOtpService] OTP for user usr-001: 123456
   ```
5. Ingresa el código → accedes al catálogo

## Flujo de prueba — CMS

1. Abre http://localhost:8081/cms/login
2. Ingresa `admin@lukiplay.com` y `password123`
3. Accedes al dashboard con estadísticas
4. Navega a Usuarios, Contratos o Sesiones desde el sidebar

## Con Docker (opcional)

```powershell
docker compose up --build
```

## Estructura del proyecto

```
Luki-Play-OTT/
├── backend/          # API NestJS — auth, OTP, JWT, CMS endpoints
├── frontend/         # App Expo/React Native — app cliente + CMS panel
├── docs/             # Documentación técnica
│   ├── ARCHITECTURE.md
│   ├── API.md
│   ├── SPRINT1-CHANGELOG.md
│   └── DEPLOYMENT.md
└── docker-compose.yml
```

## Documentación

- [Arquitectura](docs/ARCHITECTURE.md) — estructura, modelos de datos, flujos
- [API](docs/API.md) — todos los endpoints documentados
- [Changelog Sprint 1](docs/SPRINT1-CHANGELOG.md) — historial de cambios
- [Despliegue](docs/DEPLOYMENT.md) — guía de instalación y despliegue

