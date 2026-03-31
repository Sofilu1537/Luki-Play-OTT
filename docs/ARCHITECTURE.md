# Arquitectura — Luki Play OTT

## Estructura del repositorio

```
Luki-Play-OTT/
├── frontend/                        ← Expo / React Native (web + móvil)
│   ├── app/
│   │   ├── (auth)/                  ← Login cliente + pantalla OTP
│   │   │   ├── _layout.tsx
│   │   │   ├── login.tsx
│   │   │   └── verify-otp.tsx
│   │   ├── (app)/                   ← Catálogo protegido (post-login)
│   │   │   ├── _layout.tsx
│   │   │   ├── home.tsx
│   │   │   ├── favorites.tsx
│   │   │   └── search.tsx
│   │   ├── cms/                     ← Panel admin (Sprint 1.5)
│   │   │   ├── login.tsx
│   │   │   ├── dashboard.tsx
│   │   │   ├── users.tsx
│   │   │   ├── accounts.tsx
│   │   │   └── sessions.tsx
│   │   ├── admin/                   ← Gestión de canales
│   │   ├── player/
│   │   │   └── [id].tsx
│   │   ├── _layout.tsx
│   │   └── index.tsx
│   ├── components/                  ← Componentes UI reutilizables
│   │   ├── Button.tsx
│   │   ├── Hero.tsx
│   │   ├── Input.tsx
│   │   └── MediaRow.tsx
│   └── services/                    ← Stores Zustand + APIs
│       ├── authStore.ts
│       ├── contentStore.ts
│       └── adminStore.ts
│
├── backend/                         ← NestJS auth-service
│   └── src/
│       ├── main.ts
│       ├── app.module.ts
│       ├── common/
│       │   ├── filters/
│       │   │   └── http-exception.filter.ts
│       │   └── pipes/
│       │       └── validation.pipe.ts
│       └── modules/
│           ├── auth/                ← Módulo de autenticación principal
│           │   ├── domain/          ← Entidades, enums, interfaces de repos
│           │   │   ├── entities/
│           │   │   │   ├── user.entity.ts
│           │   │   │   ├── account.entity.ts
│           │   │   │   └── session.entity.ts
│           │   │   └── interfaces/
│           │   │       ├── user.repository.ts
│           │   │       ├── account.repository.ts
│           │   │       ├── session.repository.ts
│           │   │       ├── hash.service.ts
│           │   │       ├── otp.service.ts
│           │   │       └── token.service.ts
│           │   ├── application/     ← Use cases + DTOs
│           │   │   ├── dto/
│           │   │   └── use-cases/
│           │   ├── infrastructure/  ← Repos in-memory, JWT, bcrypt, OTP
│           │   │   ├── jwt/
│           │   │   ├── persistence/
│           │   │   └── repositories/
│           │   └── presentation/    ← Controllers, guards, decorators
│           │       ├── controllers/
│           │       ├── decorators/
│           │       └── guards/
│           ├── billing/             ← Mock de facturación
│           │   ├── domain/interfaces/billing.gateway.ts
│           │   └── infrastructure/adapters/mock-billing.gateway.ts
│           ├── crm/                 ← Mock de CRM
│           │   ├── domain/interfaces/crm.gateway.ts
│           │   └── infrastructure/adapters/mock-crm.gateway.ts
│           ├── profiles/            ← Perfiles de usuario
│           └── access-control/      ← Permisos y roles
│
├── docker-compose.yml
└── docs/
```

---

## Modelo de datos

### User

Representa a cualquier persona que puede autenticarse en el sistema.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `string` (UUID) | Identificador único |
| `contractNumber` | `string \| null` | Número de contrato (solo clientes) |
| `email` | `string` | Correo electrónico |
| `phone` | `string \| null` | Teléfono (opcional) |
| `passwordHash` | `string` | Hash bcrypt de la contraseña |
| `role` | `UserRole` | Rol del usuario |
| `status` | `UserStatus` | Estado del usuario |
| `accountId` | `string \| null` | Referencia a `Account` (solo clientes) |
| `createdAt` | `Date` | Fecha de creación |

**Enums:**

```typescript
enum UserRole {
  SUPERADMIN = 'superadmin',
  SOPORTE    = 'soporte',
  CLIENTE    = 'cliente',
}

enum UserStatus {
  ACTIVE    = 'active',
  INACTIVE  = 'inactive',
  SUSPENDED = 'suspended',
}
```

---

### Account

Representa la cuenta de servicio de un cliente (ISP u OTT-only).

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `string` (UUID) | Identificador único |
| `contractNumber` | `string` | Número de contrato |
| `contractType` | `ContractType` | ISP o OTT_ONLY |
| `isIspCustomer` | `boolean` | Si tiene servicio ISP |
| `planId` | `string` | Identificador del plan |
| `subscriptionStatus` | `SubscriptionStatus` | Estado de la suscripción |
| `serviceStatus` | `ServiceStatus \| null` | Estado del servicio ISP (null para OTT-only) |
| `maxDevices` | `number` | Cantidad máxima de dispositivos |

**Enums:**

```typescript
enum ContractType {
  ISP      = 'ISP',
  OTT_ONLY = 'OTT_ONLY',
}

enum SubscriptionStatus {
  ACTIVE    = 'active',
  SUSPENDED = 'suspended',
  CANCELLED = 'cancelled',
}

enum ServiceStatus {
  ACTIVO    = 'ACTIVO',     // ✅ Permite acceso OTT
  CORTESIA  = 'CORTESIA',   // ✅ Permite acceso OTT
  PENDIENTE = 'PENDIENTE',  // ❌ Restringe acceso OTT
  SUSPENDIDO= 'SUSPENDIDO', // ❌ Restringe acceso OTT
  ANULADO   = 'ANULADO',    // ❌ Restringe acceso OTT
  CORTADO   = 'CORTADO',    // ❌ Restringe acceso OTT
}
```

**Lógica de acceso OTT:**
- Clientes **OTT-only**: acceso permitido si `subscriptionStatus === ACTIVE`.
- Clientes **ISP**: acceso permitido si `serviceStatus` es `ACTIVO` o `CORTESIA`.
- Si el acceso está restringido, se devuelve un `restrictionMessage` pero el usuario **sí puede autenticarse**.

---

### Session

Representa una sesión activa de un usuario en un dispositivo específico.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `string` (UUID) | Identificador único |
| `userId` | `string` | Referencia al `User` |
| `deviceId` | `string` | Identificador del dispositivo |
| `audience` | `Audience` | APP o CMS |
| `refreshTokenHash` | `string` | Hash bcrypt del refresh token |
| `expiresAt` | `Date` | Fecha de expiración |
| `createdAt` | `Date` | Fecha de creación |
| `revokedAt` | `Date \| null` | Fecha de revocación (null = activa) |

```typescript
enum Audience {
  APP = 'app',
  CMS = 'cms',
}
```

---

### OTP (gestionado por MockOtpService)

El OTP no persiste como entidad separada en la implementación actual; es generado y verificado por el servicio `MockOtpService`. En producción debe migrar a un repositorio con TTL.

| Campo conceptual | Descripción |
|---|---|
| Código | 6 dígitos numéricos |
| Expiración | 5 minutos |
| Máximo de intentos | 3 |
| Almacenamiento actual | In-memory (Map) |
| Hash | Hash bcrypt del código |

---

## Estados de servicio y acceso OTT

| Estado ISP | Tipo | Acceso OTT | Mensaje |
|---|---|---|---|
| `ACTIVO` | ISP | ✅ Sí | — |
| `CORTESIA` | ISP | ✅ Sí | — |
| `PENDIENTE` | ISP | ❌ No | Servicio en estado PENDIENTE |
| `SUSPENDIDO` | ISP | ❌ No | Servicio en estado SUSPENDIDO |
| `ANULADO` | ISP | ❌ No | Servicio en estado ANULADO |
| `CORTADO` | ISP | ❌ No | Servicio en estado CORTADO |
| `active` | OTT-only | ✅ Sí | — |
| `suspended` / `cancelled` | OTT-only | ❌ No | Suscripción OTT no activa |

---

## Flujos de autenticación

### 1. App Login (contrato → OTP → tokens)

```
Cliente                    Backend                       MockOtpService
  |                           |                               |
  |-- POST /auth/app/login --> |                               |
  |   { contractNumber,        |                               |
  |     password, deviceId }  |                               |
  |                           |-- findByContractNumber()      |
  |                           |-- bcrypt.compare(password)    |
  |                           |-- generateOtp() -----------> |
  |                           |                              |-- genera código (6 dígitos)
  |                           |                              |-- hashea con bcrypt
  |                           |                              |-- almacena en memoria (5 min)
  |                           |                              |-- "envía" por email (mock log)
  |                           |<-- { loginToken, otpRequired: true, canAccessOtt, restrictionMessage }
  |<-- 200 OK                 |
  |
  |-- POST /auth/app/verify-otp -->
  |   { loginToken, code }   |
  |                           |-- valida loginToken (JWT temporal)
  |                           |-- verifyOtp(code)
  |                           |-- crea Session
  |                           |-- genera accessToken + refreshToken
  |<-- { accessToken, refreshToken, canAccessOtt, restrictionMessage }
```

### 2. CMS Login (email → tokens)

```
CMS User                   Backend
  |                           |
  |-- POST /auth/cms/login --> |
  |   { email, password,      |
  |     deviceId }            |
  |                           |-- findByEmail()
  |                           |-- verifica rol (superadmin | soporte)
  |                           |-- bcrypt.compare(password)
  |                           |-- crea Session (audience: 'cms')
  |                           |-- genera accessToken + refreshToken
  |<-- { accessToken, refreshToken, canAccessOtt: true, restrictionMessage: null }
```

### 3. Refresh Token Rotation

```
Cliente                    Backend
  |                           |
  |-- POST /auth/refresh ----> |
  |   { refreshToken }        |
  |                           |-- valida firma del refreshToken
  |                           |-- busca Session por userId
  |                           |-- bcrypt.compare(refreshToken, session.refreshTokenHash)
  |                           |-- revoca Session anterior
  |                           |-- crea nueva Session con nuevo refreshTokenHash
  |                           |-- genera nuevos accessToken + refreshToken
  |<-- { accessToken, refreshToken }
```

### 4. Logout

```
Cliente                    Backend
  |                           |
  |-- POST /auth/logout -----> |
  |   Authorization: Bearer   |
  |   Body: { refreshToken }  |
  |                           |-- valida JWT (JwtAuthGuard)
  |                           |-- busca Session
  |                           |-- Session.revokedAt = now
  |<-- { message: 'Logged out successfully' }
```

---

## Guards y decoradores

### JwtAuthGuard

Valida el `accessToken` en el header `Authorization: Bearer <token>`.
Extrae el payload JWT y lo expone mediante el decorador `@CurrentUser()`.

```typescript
@UseGuards(JwtAuthGuard)
@Get('me')
async me(@CurrentUser() user: JwtPayload): Promise<UserProfileResponse> { ... }
```

### RolesGuard

Verifica que el rol del usuario coincida con los roles requeridos.

```typescript
@Roles(UserRole.SUPERADMIN, UserRole.SOPORTE)
@UseGuards(JwtAuthGuard, RolesGuard)
```

### PermissionsGuard

Verifica permisos granulares definidos en `access-control/domain/permissions.ts`.

```typescript
@RequirePermissions('read:users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
```

### AudienceGuard

Restringe rutas a una audiencia específica (`app` o `cms`).

```typescript
@Audience('cms')
@UseGuards(JwtAuthGuard, AudienceGuard)
```

### Decoradores disponibles

| Decorador | Descripción |
|---|---|
| `@CurrentUser()` | Extrae el payload JWT del request |
| `@Roles(...)` | Define roles requeridos para el endpoint |
| `@RequirePermissions(...)` | Define permisos requeridos |
| `@Audience(...)` | Define la audiencia del endpoint (app/cms) |

---

## Módulos externos (mocks desacoplados)

### BillingGateway

Interfaz: `billing/domain/interfaces/billing.gateway.ts`
Mock: `billing/infrastructure/adapters/mock-billing.gateway.ts`

Permite consultar el estado de facturación de un cliente ISP.
En producción, se reemplaza por una implementación real sin cambiar el dominio.

### CrmGateway

Interfaz: `crm/domain/interfaces/crm.gateway.ts`
Mock: `crm/infrastructure/adapters/mock-crm.gateway.ts`

Permite consultar datos de clientes en el CRM del ISP.
En producción, se reemplaza por una implementación real.

---

## Decisiones de arquitectura

| Decisión | Justificación |
|---|---|
| Clean Architecture en backend | Separación clara de dominio, aplicación e infraestructura. Facilita tests y migración a PostgreSQL. |
| Repositorios in-memory | Permite desarrollo y pruebas sin base de datos. Se reemplaza con TypeORM/Prisma en producción. |
| JWT + Refresh Token Rotation | Cada uso del refresh token genera uno nuevo. El anterior queda inválido, minimizando riesgo de robo. |
| bcrypt para passwords y OTP hash | Nunca se almacenan credenciales en texto plano. |
| OTP con expiración e intentos limitados | Previene fuerza bruta. Máximo 3 intentos, 5 minutos de vida. |
| Stores separados (authStore vs cmsStore) | El cliente app y el panel CMS tienen flujos de autenticación distintos y no deben compartir estado. |
| Mocks desacoplados para CRM y Billing | Los módulos externos se definen como interfaces; los mocks implementan esas interfaces. Intercambiables sin tocar el dominio. |
