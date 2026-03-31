# Sprint 1 — Changelog

## v1.0.0 — Sprint 1 Completo (2026-03-31)

### Backend — Módulo de Autenticación Completo

#### Arquitectura
- Implementado **Clean Architecture** con separación domain / application / infrastructure / presentation
- Todos los límites de módulo separados con interfaces e inyección de dependencias

#### Domain Layer
- `User` entity con `id (UUID)`, `contractNumber`, `email`, `phone`, `passwordHash`, `role`, `status`, `accountId`, `createdAt`
- `Account` entity con `contractNumber`, `contractType` (ISP/OTT_ONLY), `serviceStatus` (6 estados ISP), `canAccessOtt` (computed), `restrictionMessage` (computed)
- `Session` entity con `audience` (app/cms), `refreshTokenHash`, `expiresAt`, `revokedAt`, métodos `isExpired()` / `isRevoked()`
- Enums: `UserRole` (CLIENTE/SOPORTE/SUPERADMIN), `ServiceStatus` (ACTIVO/CORTESIA/PENDIENTE/SUSPENDIDO/ANULADO/CORTADO), `ContractType` (ISP/OTT_ONLY)
- Interfaces de repositorios: `UserRepository`, `AccountRepository`, `SessionRepository`
- Interfaces de servicios: `HashService`, `TokenService`, `OtpService`

#### Infrastructure Layer
- `InMemoryUserRepository` — seed data con 7 usuarios (5 clientes + 2 CMS)
- `InMemoryAccountRepository` — seed data con 5 contratos (4 ISP + 1 OTT)
- `InMemorySessionRepository` — vacío al inicio, se llena con sesiones reales
- `BcryptHashService` — hashing con salt rounds = 12
- `JwtTokenService` — access token 15min, refresh token 7d, login challenge 5min
- `JwtStrategy` — Passport strategy para validar JWT
- `MockOtpService` — genera OTP de 6 dígitos, los hashea y los loguea en consola

#### Application Layer (Use Cases)
- `LoginAppUseCase` — valida credenciales + evalúa acceso OTT + envía OTP
- `CompleteLoginUseCase` — verifica OTP + emite tokens + crea sesión
- `LoginCmsUseCase` — login directo para usuarios CMS (sin OTP)
- `RefreshTokenUseCase` — rotación de refresh token
- `LogoutUseCase` — revoca sesión por refresh token hash
- `GetCurrentUserUseCase` — perfil completo con entitlements del billing mock
- `ChangePasswordUseCase` — cambio de contraseña con validación de actual
- `ListActiveSessionsUseCase` — sesiones activas del usuario actual
- `RevokeSessionUseCase` — revocar sesión por ID (solo dueño)
- `RequestOtpUseCase` — solicitar/reenviar OTP por email
- `VerifyOtpUseCase` — verificar OTP standalone
- `InitQrLoginUseCase` / `ConfirmQrLoginUseCase` — preparación para login QR
- `GetCmsStatsUseCase` — estadísticas agregadas para dashboard CMS

#### Presentation Layer
- `AuthController` — 12 endpoints de auth completamente documentados con Swagger
- `CmsController` — 5 endpoints CMS protegidos por rol
- `JwtAuthGuard` — guard JWT global
- `RolesGuard` — control por roles
- `PermissionsGuard` — control por permisos granulares
- `AudienceGuard` — separación de contextos app/cms
- Decoradores: `@CurrentUser()`, `@Roles()`, `@Permissions()`, `@Audience()`

#### Módulos Desacoplados
- `BillingModule` — interfaz `BillingGateway` + `MockBillingGateway`
- `CrmModule` — interfaz `CrmGateway` + `MockCrmGateway`
- `AccessControlModule` — mapa de permisos por rol

#### Configuración
- Variables de entorno: `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_EXPIRY`, `JWT_REFRESH_EXPIRY`
- `ThrottlerModule` — rate limiting: 20 peticiones / 60 segundos
- Global `ValidationPipe` con whitelist
- Global `ExceptionFilter` para respuestas de error uniformes
- Swagger en `/api/docs`

### Frontend — Auth Cliente Refactorizado

#### Nuevas funcionalidades
- `services/api/authApi.ts` — capa HTTP separada del store (appLogin, verifyOtp, refresh, logout, me)
- `services/authStore.ts` mejorado:
  - `restoreSession()` — restaura sesión desde localStorage al iniciar
  - Persistencia en `localStorage` (web) con clave `luki_auth_state`
  - Refresh automático si el access token expiró
  - `canAccessOtt` y `restrictionMessage` expuestos en el estado
  - Usa `authApi` en lugar de `fetch` directo
- `app/index.tsx` — llama `restoreSession()` antes de redirigir

#### Pantallas existentes mejoradas
- `app/(auth)/login.tsx` — sin cambios (ya funcional)
- `app/(auth)/verify-otp.tsx` — sin cambios (ya funcional)

### Frontend — Panel CMS (nuevo)

#### Estructura
```
app/cms/
├── _layout.tsx   — Layout con sidebar (visible en ≥768px) + protección de rutas
├── login.tsx     — Login email + password (sin OTP)
├── dashboard.tsx — Cards de estadísticas con navegación
├── users.tsx     — Tabla de usuarios con filtros por rol + búsqueda
├── accounts.tsx  — Tabla de contratos con badges de colores por estado
└── sessions.tsx  — Sesiones activas con opción de revocar (solo SUPERADMIN)
```

#### Services CMS
- `services/api/cmsApi.ts` — HTTP calls: login, getStats, listUsers, listAccounts, listSessions, revokeSession, me, logout
- `services/cmsStore.ts` — Zustand store: admin, accessToken, refreshToken, stats, users, accounts, sessions, login, logout, fetchStats, fetchUsers, fetchAccounts, fetchSessions, revokeSession, clearError

#### Diseño CMS
- Paleta: BG=#0F172A, SURFACE=#1E293B, ACCENT=#6D28D9
- Sidebar colapsable (oculto en pantallas < 768px)
- Badges de colores por estado de contrato ISP
- Responsive: sidebar en desktop, barra horizontal en mobile

### Documentación
- `README.md` — actualizado con instalación, URLs y credenciales
- `docs/ARCHITECTURE.md` — arquitectura completa con modelos y flujos
- `docs/API.md` — todos los endpoints documentados con ejemplos
- `docs/SPRINT1-CHANGELOG.md` — este archivo
- `docs/DEPLOYMENT.md` — guía de despliegue local y Docker

### Tests
- 27 tests unitarios (todos pasan ✅)
  - `login-app.use-case.spec.ts`
  - `login-cms.use-case.spec.ts`
  - `complete-login.use-case.spec.ts`
  - `logout.use-case.spec.ts`
  - `permissions.guard.spec.ts`
  - `roles.guard.spec.ts`
  - `audience.guard.spec.ts`

---

## Deuda Técnica y TODOs

- [ ] Reemplazar `InMemoryUserRepository` con TypeORM + PostgreSQL
- [ ] Reemplazar `InMemorySessionRepository` con Redis
- [ ] Implementar `EmailService` real (SendGrid / SES) en lugar de log a consola
- [ ] Implementar `CrmGateway` real conectando al ISP
- [ ] Implementar `BillingGateway` real conectando al sistema de facturación
- [ ] Agregar rate limiting específico para endpoints de login y OTP
- [ ] Agregar HTTPS/TLS en producción
- [ ] Implementar persistencia de sesiones CMS en frontend
- [ ] Agregar test de integración para endpoints CMS
- [ ] Agregar paginación en endpoints de CMS
