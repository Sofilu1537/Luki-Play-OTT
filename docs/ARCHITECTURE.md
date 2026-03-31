# Luki Play OTT — Arquitectura del Sprint 1

## Resumen

Luki Play es una plataforma OTT multi-tenant diseñada para ISPs y clientes OTT-only. La arquitectura implementa **Clean Architecture** con separación estricta entre dominio, aplicación, infraestructura y presentación.

---

## Estructura del Repositorio

```
Luki-Play-OTT/
├── backend/                    # NestJS API (puerto 3000)
│   └── src/
│       ├── modules/
│       │   ├── auth/           # Módulo de autenticación (principal)
│       │   │   ├── domain/     # Entidades y contratos
│       │   │   ├── application/# Use Cases y DTOs
│       │   │   ├── infrastructure/ # Repos, JWT, bcrypt
│       │   │   └── presentation/   # Controllers y Guards
│       │   ├── access-control/ # Roles y permisos
│       │   ├── billing/        # Mock de facturación
│       │   ├── crm/            # Mock de CRM
│       │   └── profiles/       # Módulo de perfiles (futuro)
│       └── common/             # Pipes, filtros globales
│
├── frontend/                   # Expo Router + React Native (puerto 8081)
│   ├── app/
│   │   ├── index.tsx           # Entry point + restoreSession
│   │   ├── (auth)/             # Login + OTP (clientes)
│   │   ├── (app)/              # Catálogo autenticado
│   │   ├── cms/                # Panel CMS (admin/soporte)
│   │   └── player/             # Reproductor de video
│   ├── services/
│   │   ├── authStore.ts        # Zustand: auth cliente
│   │   ├── cmsStore.ts         # Zustand: auth CMS
│   │   └── api/
│   │       ├── authApi.ts      # HTTP: endpoints de auth
│   │       └── cmsApi.ts       # HTTP: endpoints de CMS
│   └── components/             # Componentes reutilizables
│
└── docs/                       # Documentación técnica
```

---

## Modelo de Datos

### USER
```typescript
{
  id: string;             // UUID
  contractNumber: string | null;  // null para usuarios CMS
  email: string;
  phone: string | null;
  passwordHash: string;   // bcrypt con salt 12
  role: 'superadmin' | 'soporte' | 'cliente';
  status: 'active' | 'inactive' | 'suspended';
  accountId: string | null;
  createdAt: Date;
}
```

### ACCOUNT (contrato)
```typescript
{
  id: string;
  contractNumber: string;
  contractType: 'ISP' | 'OTT_ONLY';
  isIspCustomer: boolean;
  planId: string;
  subscriptionStatus: 'active' | 'suspended' | 'cancelled';
  serviceStatus: 'ACTIVO' | 'CORTESIA' | 'PENDIENTE' | 'SUSPENDIDO' | 'ANULADO' | 'CORTADO' | null;
  maxDevices: number;
  canAccessOtt: boolean;     // computed: true si ACTIVO o CORTESIA (ISP), o active (OTT)
  restrictionMessage: string | null;  // mensaje si acceso restringido
}
```

### SESSION
```typescript
{
  id: string;
  userId: string;
  deviceId: string;
  audience: 'app' | 'cms';
  refreshTokenHash: string;  // hash bcrypt del refresh token
  expiresAt: Date;
  createdAt: Date;
  revokedAt: Date | null;
}
```

### OTP
```typescript
{
  id: string;
  userId: string;
  codeHash: string;    // hash bcrypt del código de 6 dígitos
  expiresAt: Date;     // +5 minutos desde creación
  attempts: number;    // máx 3 intentos
  usedAt: Date | null;
}
```

---

## Flujos de Autenticación

### App Cliente (2 fases)

```
Cliente                Backend              Email
   |                      |                   |
   |-- POST /auth/app/login -->               |
   |   { contractNumber, password, deviceId } |
   |                      |                   |
   |                 Valida credenciales       |
   |                 Genera OTP               |
   |                      |--- Envía OTP ---->|
   |<-- { loginToken, otpRequired: true } ----|
   |                      |                   |
   |-- POST /auth/app/verify-otp -----------> |
   |   { loginToken, code }                   |
   |                      |                   |
   |              Verifica OTP                |
   |              Crea Session                |
   |              Emite tokens                |
   |<-- { accessToken, refreshToken } --------|
```

### CMS Admin (1 fase)

```
Admin CMS              Backend
   |                      |
   |-- POST /auth/cms/login -->
   |   { email, password, deviceId }
   |                      |
   |                 Valida credenciales
   |                 Verifica rol CMS
   |                 Crea Session (audience: cms)
   |                 Emite tokens
   |<-- { accessToken, refreshToken } ---
```

---

## Arquitectura de Seguridad

### JWT
- **Access token**: 15 minutos, firmado con `JWT_ACCESS_SECRET`
- **Refresh token**: 7 días, firmado con `JWT_REFRESH_SECRET`
- **Rotation**: Cada `POST /auth/refresh` invalida el refresh anterior
- **Audience**: `app` o `cms` — cada tipo de usuario recibe tokens separados

### Passwords
- Hash con **bcrypt**, `saltRounds = 12`
- No se almacena el password en texto plano en ningún punto

### OTP
- 6 dígitos aleatorios
- Expiración: 5 minutos
- Máximo 3 intentos antes de invalidación
- El código se almacena **hasheado** con bcrypt

### Guards
- `JwtAuthGuard` — valida JWT en Authorization header
- `RolesGuard` — verifica que el rol esté en la lista permitida
- `PermissionsGuard` — valida permisos granulares por recurso+acción
- `AudienceGuard` — asegura que el token es del tipo correcto (app/cms)

---

## Lógica de Acceso OTT

| Estado ISP     | Puede autenticarse | Puede consumir OTT |
|----------------|-------------------|-------------------|
| ACTIVO         | ✅                 | ✅                 |
| CORTESIA       | ✅                 | ✅                 |
| PENDIENTE      | ✅                 | ❌ (mensaje)       |
| SUSPENDIDO     | ✅                 | ❌ (mensaje)       |
| ANULADO        | ✅                 | ❌ (mensaje)       |
| CORTADO        | ✅                 | ❌ (mensaje)       |

**Regla clave**: El usuario **siempre puede autenticarse** pero recibirá `restrictionMessage` y `canAccessOtt: false` si no puede consumir contenido.

---

## Mocks Desacoplados

### CRM Mock (`/backend/src/modules/crm/`)
- Simula consultas al CRM del ISP
- Interfaz: `CrmGateway`
- Implementación: `MockCrmGateway`

### Billing Mock (`/backend/src/modules/billing/`)
- Simula consultas a facturación
- Interfaz: `BillingGateway`
- Devuelve entitlements por cuenta
- Implementación: `MockBillingGateway`

Para conectar con CRM o billing reales, solo se necesita implementar la interface correspondiente y registrar el nuevo proveedor en el módulo.
