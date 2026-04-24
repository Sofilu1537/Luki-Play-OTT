# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

**Luki Play OTT** — A streaming platform for an ISP. Monorepo with:
- `backend/` — NestJS REST API (TypeScript, Prisma, PostgreSQL, Redis)
- `frontend/` — Expo / React Native app (iOS, Android, Web) serving both the subscriber app and the CMS admin panel

---

## Commands

### Infrastructure (required before backend)

```bash
# Start PostgreSQL + Redis (Docker Desktop must be running)
docker compose up -d postgres redis

# Stop
docker compose down
```

### Backend (`cd backend`)

```bash
npm run start:dev          # Watch mode (hot reload)
npm run build              # Compile to dist/
npm run start:prod         # Run compiled build
npm run lint               # ESLint + auto-fix
npm run test               # Jest unit tests
npm run test:watch         # Watch mode
npm run test:e2e           # E2E tests (jest-e2e.json config)
npx jest src/path/to.spec.ts  # Single test file

# Database
npx prisma migrate dev --name <name>   # Create + apply migration
npx prisma migrate deploy              # Apply pending migrations (prod)
npx prisma generate                    # Regenerate Prisma client after schema change
npx prisma db seed                     # Run prisma/seed.ts
npx prisma studio                      # Browse DB at localhost:5555
```

### Frontend (`cd frontend`)

```bash
npx expo start           # Dev server (press w for web, a for Android, i for iOS)
npx expo start --web     # Web only
npm run lint             # ESLint
npm run build:web        # Export static web build
```

---

## Architecture

### Backend — Clean Architecture

Each feature is a NestJS module under `src/modules/`. The auth module strictly follows clean architecture with separated layers:

```
src/modules/auth/
  domain/
    entities/       # Pure domain objects (User, Session, etc.)
    interfaces/     # Port tokens (USER_REPOSITORY, TOKEN_SERVICE, ...)
  application/
    use-cases/      # One class per use case, injected via DI tokens
    dto/
  infrastructure/
    repositories/   # Prisma implementations of domain interfaces
    jwt/            # JwtTokenService
    persistence/    # BcryptHashService, OtpService, EmailService
  presentation/
    controllers/    # AuthController
    guards/         # JwtAuthGuard, PermissionsGuard, RolesGuard
    decorators/     # @Permissions(), @Roles(), @RequireAudience()
```

**AdminModule** (`src/modules/admin/`) is flatter: `AdminController` + `AdminService` + DTOs, with direct Prisma access via `PrismaService`. No repository pattern — domain logic lives in the service.

**Key modules:**
- `AuthModule` — all authentication flows, exports TOKEN_SERVICE, USER_REPOSITORY, etc.
- `AdminModule` — CMS CRUD operations, imports AuthModule + AccessControlModule + PrismaModule
- `AccessControlModule` — exports PermissionsGuard, RolesGuard, AudienceGuard
- `BillingModule` — currently mocked; swap `MockBillingGateway` for real HTTP adapter
- `PrismaModule` — global, provides `PrismaService` (uses `@prisma/adapter-pg` driver adapter)

**Adding a new endpoint:**
1. Add route + `@Permissions('cms:something')` in `admin.controller.ts`
2. Add method in `admin.service.ts`
3. Add the permission key to `VALID_CMS_PERMISSIONS` in `access-control/domain/permissions.ts`

### Authentication Flows

**CMS login** (single-phase): `POST /auth/cms/login` → JWT pair. Handled by `LoginCmsUseCase`.

**App login** (two-phase OTP):
1. `POST /auth/app/login` → sends OTP, returns `loginToken`
2. `POST /auth/app/complete-login` → verifies OTP, returns JWT pair. Handled by `CompleteLoginUseCase`.

**Permissions** are resolved at login time from the `cms_roles` table (`prisma.cmsRole.findUnique({ where: { key: user.role } })`), embedded into the JWT, and validated on each request by `PermissionsGuard`. Wildcard `cms:*` grants all `cms:` permissions. Changes to a role's permissions take effect on the user's next login (JWT TTL: 15 min).

### RBAC — Role & Permission System

Roles are a fixed PostgreSQL enum (`UserRole`: SUPERADMIN, ADMIN, SOPORTE, CLIENTE). Permissions are stored per role in the `cms_roles` table — not per user.

- **SUPERADMIN / CLIENTE**: fixed permissions, not editable from CMS
- **ADMIN / SOPORTE**: permissions configurable by SUPERADMIN via `PATCH /admin/roles/:key/permissions`
- Permission keys are validated against `VALID_CMS_PERMISSIONS` before persisting (`sanitizePermissions()` in `permissions.ts`)

Default CMS users (from `prisma/seed.ts`):
- `admin@lukiplay.com` — SUPERADMIN
- `gestion@lukiplay.com` — ADMIN
- `soporte@lukiplay.com` — SOPORTE

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
- `Contract` — billing contract tied to a customer; holds `maxDevices`, `sessionDurationDays`, plan info.
- `CmsRole` — stores permission arrays per role (`key: UserRole @unique`). This is the RBAC source of truth.
- `Session` — tracks active JWT sessions; `audience` field distinguishes `cms` vs `app` sessions.
- `ActivationCode` — 6-char codes for account activation flow.
- `RegistrationRequest` — self-registration requests from non-ISP users.

### PrismaService Note

`PrismaService` uses the `@prisma/adapter-pg` driver adapter (not the default Prisma engine). Always construct with the adapter:
```typescript
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
super({ adapter });
```
Direct `new PrismaClient()` without the adapter will throw `PrismaClientInitializationError`.
