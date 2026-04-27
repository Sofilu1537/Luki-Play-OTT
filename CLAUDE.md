# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

**Luki Play OTT** — A streaming platform for an ISP. Monorepo with:
- `backend/` — NestJS REST API (TypeScript, Prisma, PostgreSQL, Redis)
- `frontend/` — Expo / React Native app (iOS, Android, Web) serving both the subscriber app and the CMS admin panel

---

## Commands

### DEV — Ambiente de Desarrollo (local)

#### Infraestructura local (Docker Desktop debe estar corriendo)

```bash
# Levantar PostgreSQL + Redis en contenedores locales
docker compose up -d postgres redis

# Detener
docker compose down
```

#### Backend (`cd backend`)

```bash
npm run start:dev                      # Hot reload — modo watch
npm run build                          # Compilar a dist/
npm run lint                           # ESLint + auto-fix
npm run test                           # Jest unit tests
npm run test:watch                     # Watch mode
npm run test:e2e                       # E2E (jest-e2e.json)
npx jest src/path/to.spec.ts           # Un archivo específico

# Base de datos (DEV — crea migraciones nuevas)
npx prisma migrate dev --name <name>   # ⚠️ Solo en DEV: crea archivo SQL + aplica
npx prisma generate                    # Regenerar cliente tras cambiar schema
npx prisma db seed                     # Poblar DB con datos de prueba
npx prisma studio                      # GUI en localhost:5555
```

> **Diferencia clave DEV vs PRD en migraciones:**
> `migrate dev` genera el archivo SQL y aplica. `migrate deploy` solo aplica archivos ya existentes — es el comando para PRD.

#### Frontend (`cd frontend`)

```bash
npx expo start           # Dev server (w = web, a = Android, i = iOS)
npx expo start --web     # Web únicamente
npm run lint             # ESLint
npm run build:web        # Build estático (genera dist/)
```

---

### PRD — Ambiente de Producción (EC2)

#### Pre-requisitos en el servidor (solo la primera vez)

```bash
# 1. Dependencias del sistema
sudo apt update && sudo apt install -y git curl nginx docker.io docker-compose-plugin

# 2. Node 20 + PM2
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2

# 3. Permisos Docker
sudo usermod -aG docker $USER && newgrp docker
```

#### Variables de entorno PRD — `backend/.env` en el servidor

```bash
NODE_ENV=production
PORT=8100                  # diferente al dev (3000)

DATABASE_URL=postgresql://lukiplay_admin:<PASSWORD_FUERTE>@localhost:5432/lukiplay_prod
REDIS_URL=redis://localhost:6379

# ⚠️ Nunca usar los valores dev — generar con: openssl rand -hex 32
SUBSCRIBER_JWT_SECRET=<secreto-32-bytes-hexadecimal>
ADMIN_JWT_SECRET=<secreto-32-bytes-hexadecimal>

JWT_EXPIRATION=15m
REFRESH_TOKEN_EXPIRATION=7d
BCRYPT_SALT_ROUNDS=12
THROTTLE_TTL=60000
THROTTLE_LIMIT=20

SMTP_HOST=smtp.titan.email
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=noreply@luki.ec
SMTP_PASS=<clave-smtp-real>
SMTP_FROM=noreply@luki.ec

USE_MOCK_API=false
SYNC_CRON_SCHEDULE=0 */6 * * *
```

#### Infraestructura PRD (PostgreSQL + Redis via Docker)

```bash
# Usar docker-compose.prod.yml — lee vars desde backend/.env
docker compose -f docker-compose.prod.yml --env-file backend/.env up -d

# ⚠️ Nunca usar docker-compose.yml (dev) en producción —
#    tiene credenciales hardcodeadas y NODE_ENV=development
```

#### Primer despliegue en EC2

```bash
# Clonar repo
git clone https://github.com/Sofilu1537/Luki-Play-OTT.git ~/Luki-Play-OTT
cd ~/Luki-Play-OTT

# Copiar .env de producción al servidor (vía scp desde tu máquina)
# scp backend/.env.prod ubuntu@<IP_EC2>:~/Luki-Play-OTT/backend/.env

# Levantar base de datos
docker compose -f docker-compose.prod.yml --env-file backend/.env up -d

# Backend
cd backend
npm ci                                 # ⚠️ ci, no install — usa package-lock exacto
npx prisma migrate deploy              # ⚠️ deploy, no migrate dev — aplica sin generar
npx prisma db seed                     # ⚠️ Solo en PRIMER deploy — crea roles, plan, categorías
npm run build
PORT=8100 pm2 start npm --name luki-play-backend -- run start:prod
pm2 save
pm2 startup                            # Configura autostart en reboot del servidor

# Frontend
cd ../frontend
npm ci
npm run build:web
sudo mkdir -p /var/www/luki-play-ott
sudo cp -r dist/* /var/www/luki-play-ott/

# Nginx
sudo cp deploy/nginx/luki-play-ott.conf /etc/nginx/sites-available/
sudo ln -sf /etc/nginx/sites-available/luki-play-ott.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

> **Sobre el seed en PRD:** `prisma/seed.ts` crea el plan LUKI PLAY, usuarios CMS (admin/gestion/soporte con contraseña `password123`), categorías, componentes OTT y ~50 suscriptores de prueba. Ejecutarlo solo en el primer deploy. **Cambiar contraseñas CMS inmediatamente después.**

#### Despliegues subsiguientes (actualizaciones)

```bash
# Opción A — script automático (desde tu máquina o el servidor)
bash deploy-ec2.sh --branch main

# Opción B — manual con control paso a paso
cd ~/Luki-Play-OTT
git pull origin main

cd backend
npm ci
npx prisma migrate deploy              # Siempre antes de reiniciar PM2
npm run build
pm2 restart luki-play-backend --update-env

cd ../frontend
npm ci
npm run build:web
sudo rm -rf /var/www/luki-play-ott/*
sudo cp -r dist/* /var/www/luki-play-ott/
```

#### Comandos de operación PRD

```bash
# Estado y logs del backend
pm2 status
pm2 logs luki-play-backend
pm2 logs luki-play-backend --lines 100

# Reinicio manual
pm2 restart luki-play-backend

# Estado de la DB
docker compose -f docker-compose.prod.yml ps

# Verificar despliegue
curl http://localhost:8100/auth/health
```

#### Diferencias DEV vs PRD — resumen

| Aspecto | DEV | PRD |
|---|---|---|
| Compose file | `docker-compose.yml` | `docker-compose.prod.yml` |
| Backend runner | `npm run start:dev` (watch) | `pm2` + `npm run start:prod` |
| Puerto backend | 3000 | 8100 |
| Puerto frontend | Expo dev server | Nginx → `/var/www/luki-play-ott` |
| Migración DB | `prisma migrate dev` | `prisma migrate deploy` |
| Seed | Siempre que se necesite | Solo primer deploy |
| Install deps | `npm install` | `npm ci` |
| NODE_ENV | `development` | `production` |
| JWT secrets | Valores dev hardcodeados | `openssl rand -hex 32` |
| DB password | `dev_password_2026` | Contraseña fuerte única |

#### Checklist de seguridad antes de ir a producción

- [ ] `.env` no está commiteado (verificar `.gitignore`)
- [ ] JWT secrets generados con `openssl rand -hex 32`
- [ ] DB password de mínimo 20 caracteres
- [ ] EC2 Security Group: solo puertos 80, 443 y 22 (SSH desde tu IP) expuestos públicamente
- [ ] Puertos 8100, 5432, 6379 accesibles solo internamente (localhost)
- [ ] SMTP password real configurado (`noreply@luki.ec`)
- [ ] Contraseñas CMS cambiadas después del seed (`password123` es solo temporal)
- [ ] HTTPS configurado con Certbot: `sudo certbot --nginx`

---

## Architecture

### Backend — Clean Architecture

Each feature is a NestJS module under `src/modules/`. The auth module strictly follows clean architecture with separated layers:

```
src/modules/auth/
  domain/
    entities/       # User, Session, Account, LoginAttempt, AuditLog, TemporaryCode,
                    # FirstAccessToken, PasswordResetToken
    interfaces/     # Port tokens: USER_REPOSITORY, SESSION_REPOSITORY, ACCOUNT_REPOSITORY,
                    # TOKEN_SERVICE, HASH_SERVICE, OTP_SERVICE, EMAIL_SERVICE,
                    # PASSWORD_RESET_TOKEN_REPOSITORY, FIRST_ACCESS_TOKEN_REPOSITORY,
                    # LOGIN_ATTEMPT_REPOSITORY, AUDIT_LOG_REPOSITORY, TEMPORARY_CODE_REPOSITORY
  application/
    use-cases/      # 35 use cases — uno por caso de negocio, inyectados via DI tokens
    dto/            # DTOs con class-validator por endpoint
  infrastructure/
    repositories/   # in-memory (dev/test) — PrismaUserRepository, PrismaSessionRepository,
                    # PrismaAccountRepository en src/modules/prisma/repositories/
    jwt/            # JwtTokenService, JwtStrategy (Passport)
    persistence/    # BcryptHashService, MockOtpService, NodemailerEmailService, MockEmailService
  presentation/
    controllers/    # AuthController (~31 endpoints)
    guards/         # JwtAuthGuard, PermissionsGuard, RolesGuard, AudienceGuard
    decorators/     # @CurrentUser(), @Permissions(), @Roles(), @Audience()
```

**Entidades de dominio principales:**
- `User` — datos del usuario; métodos `isActive()`, `isCmsUser()`, `isLocked()`, `lockMinutesRemaining()`
- `Session` — sesión JWT; métodos `isExpired()`, `isRevoked()`
- `Account` — contrato/suscripción; getter `canAccessOtt` (verifica ISP service status o suscripción activa), `restrictionMessage`

**Repositorios en memoria vs Prisma:**
- Los repositorios en `infrastructure/repositories/` son implementaciones in-memory usadas en tests.
- Los repositorios Prisma (reales) están en `src/modules/prisma/repositories/` y se registran en `auth.module.ts` via los tokens DI (`USER_REPOSITORY → PrismaUserRepository`, etc.).
- Los repositorios de `PasswordResetToken`, `FirstAccessToken`, `LoginAttempt`, `AuditLog` y `TemporaryCode` son **solo in-memory** — no persisten en DB (datos efímeros).

**AdminModule** (`src/modules/admin/`) is flatter: `AdminController` + `AdminService` + DTOs, with direct Prisma access via `PrismaService`. No repository pattern — domain logic lives in the service.

**Key modules:**
- `AuthModule` — all authentication flows (35 use cases), exports TOKEN_SERVICE, USER_REPOSITORY, ACCOUNT_REPOSITORY, etc.
- `AdminModule` — CMS CRUD operations, imports AuthModule + AccessControlModule + PrismaModule
- `AccessControlModule` — exports PermissionsGuard, RolesGuard, AudienceGuard
- `BillingModule` — currently mocked; swap `MockBillingGateway` for real HTTP adapter
- `CrmModule` — currently mocked; swap `MockCrmGateway` for real HTTP adapter
- `SubscriptionModule` — gestión de suscripciones OTT-only (clientes no-ISP)
- `PublicModule` — endpoints sin autenticación (`/public/canales`, `/public/componentes`)
- `PrismaModule` — global, provides `PrismaService` (uses `@prisma/adapter-pg` driver adapter)

**Adding a new endpoint:**
1. Add route + `@Permissions('cms:something')` in `admin.controller.ts`
2. Add method in `admin.service.ts`
3. Add the permission key to `VALID_CMS_PERMISSIONS` in `access-control/domain/permissions.ts`

**Adding a new auth use case:**
1. Create `application/use-cases/nombre.use-case.ts` implementando la lógica
2. Crear DTO en `application/dto/nombre.dto.ts` con validaciones `class-validator`
3. Registrar el use case en `auth.module.ts` (array `providers`)
4. Inyectar en `AuthController` e implementar el endpoint

### Authentication Flows

Hay tres flujos de login activos. El flujo por cédula reemplazó al flujo OTP como método principal de la app de suscriptores (Sprint 1, commit `12312c1`).

**Flujo 1 — App por cédula (principal, sin OTP en login):**
1. `POST /auth/app/id-login` → `{ idNumber, password, deviceId }` → JWT pair directo. Handled by `IdNumberLoginUseCase`.

**Flujo 2 — CMS (single-phase):**
1. `POST /auth/cms/login` → `{ email, password }` → JWT pair. Handled by `LoginCmsUseCase`.

**Flujo 3 — App OTP (two-phase, legacy):**
1. `POST /auth/app/login` → envía OTP, retorna `loginToken`
2. `POST /auth/app/verify-otp` → verifica OTP → JWT pair. Handled by `CompleteLoginUseCase`.

**Activación de cuenta (primer acceso, 2 pasos):**
1. `POST /auth/app/first-access` → `{ idNumber }` → envía OTP al correo, retorna `customerId`
2. `POST /auth/app/activate` → `{ customerId, otpCode, password, email? }` → activa cuenta. Handled by `FirstAccessAppUseCase` + `ActivateAppUseCase`.

**Recuperación de contraseña por OTP:**
1. `POST /auth/app/request-password-otp` → `{ idNumber }` → envía OTP al correo
2. `POST /auth/app/reset-with-otp` → `{ idNumber, otpCode, newPassword }` → actualiza contraseña. Handled by `RequestPasswordOtpUseCase` + `ResetPasswordOtpUseCase`.

**Recuperación por contrato (alternativa):**
- `POST /auth/app/reset-password` → `{ contractNumber, idNumber, newPassword }` → sin OTP. Handled by `ContractResetPasswordUseCase`.

**Permissions** are resolved at login time from the `cms_roles` table (`prisma.cmsRole.findUnique({ where: { key: user.role } })`), embedded into the JWT, and validated on each request by `PermissionsGuard`. Wildcard `cms:*` grants all `cms:` permissions. Changes to a role's permissions take effect on the user's next login (JWT TTL: 15 min).

**Campo clave para autenticación:** `Customer.idNumber` (cédula, `@unique`) es el identificador primario en los flujos de app. `Customer.isAccountActivated` controla si la cuenta completó el flujo de primer acceso.

### RBAC — Role & Permission System

Roles are a fixed PostgreSQL enum (`UserRole`: SUPERADMIN, ADMIN, SOPORTE, CLIENTE). Permissions are stored per role in the `cms_roles` table — not per user.

- **SUPERADMIN / CLIENTE**: fixed permissions, not editable from CMS
- **ADMIN / SOPORTE**: permissions configurable by SUPERADMIN via `PATCH /admin/roles/:key/permissions`
- Permission keys are validated against `VALID_CMS_PERMISSIONS` before persisting (`sanitizePermissions()` in `permissions.ts`)

Default CMS users (from `prisma/seed.ts`) — contraseña inicial `password123`, **cambiar en producción**:
- `admin@lukiplay.com` — SUPERADMIN
- `gestion@lukiplay.com` — ADMIN
- `soporte@lukiplay.com` — SOPORTE

**JwtPayload** fields: `sub` (userId), `role`, `aud` (app|cms), `permissions[]`, `accountId`, `iat`, `exp`.

### Frontend — Expo Router Structure

File-based routing via `expo-router`. Route groups:

```
app/
  index.tsx            # Auth redirect gate
  (auth)/              # Subscriber login + OTP
  (app)/               # Subscriber app (home, search, favorites)
  player/[id].tsx      # Fullscreen HLS video player
  cms/                 # CMS admin panel (separate auth, separate layout)
    _layout.tsx        # Guards: redirects to /cms/login if no session
    login.tsx
    dashboard.tsx
    roles.tsx          # RBAC management
    users.tsx
    canales.tsx
    ... (one file per CMS module)
```

**CMS sidebar visibility** is controlled by `NAV_PERMISSION_MAP` in `CmsShell.tsx` — each nav path maps to a permission key. Items not in the user's JWT permissions are hidden automatically.

### Frontend State

Zustand stores — no Redux, no Context API for auth:

- `cmsStore` — CMS session (accessToken in memory, refreshToken in SecureStore/localStorage). Bootstraps from stored token on mount.
- `authStore` — Subscriber app session (OTT access, entitlements, profiles)
- `adminStore`, `channelStore`, `contentStore`, `categoriasStore`, `planesStore` — CMS data caches

All API calls go through typed functions in `frontend/services/api/`. The base URL is determined by `API_BASE_URL` in `services/api/config.ts` (auto-detects prod vs localhost).

### Database Schema Key Points

- `Customer` — all users (subscribers + CMS staff). Differentiated by `role` enum and `isCmsUser` flag.
  - `idNumber` (`@unique`, nullable) — cédula de identidad; identificador primario en flujos de app
  - `isAccountActivated` — `false` hasta que el suscriptor completa el flujo de primer acceso
  - `email` (`@unique`, nullable) — puede ser null para suscriptores ISP sin correo
  - `ispEmail` — correo del ISP (`facturacion@luki.ec`) cuando el suscriptor no tiene email propio
  - `mustChangePassword` — `true` en suscriptores nuevos hasta que el usuario cambia su contraseña
- `Contract` — billing contract tied to a customer; holds `maxDevices`, `sessionDurationDays`, `sessionLimitPolicy` (BLOCK_NEW | REPLACE_OLDEST), plan info.
- `CmsRole` — stores permission arrays per role (`key: UserRole @unique`). This is the RBAC source of truth.
- `Session` — tracks active JWT sessions; `audience` field distinguishes `cms` vs `app`; `refreshToken` stored as hash for reuse detection; `revokedAt` null = activa.
- `ActivationCode` — 6-char alphanumeric codes for manual activation flow (generados por CMS o autoservicio).
- `RegistrationRequest` — self-registration requests from non-ISP users (flujo 3).
- `Device` — dispositivos asociados a un contrato; controla límite `maxDevices`.
- `Subscription` / `Payment` — suscripciones OTT-only para clientes no-ISP (gestionadas por `SubscriptionModule`).

### PrismaService Note

`PrismaService` uses the `@prisma/adapter-pg` driver adapter (not the default Prisma engine). Always construct with the adapter:
```typescript
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
super({ adapter });
```
Direct `new PrismaClient()` without the adapter will throw `PrismaClientInitializationError`.
