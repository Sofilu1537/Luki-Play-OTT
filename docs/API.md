# Luki Play OTT — Documentación de API

Base URL: `http://localhost:3000`  
Swagger UI: `http://localhost:3000/api/docs`

---

## Autenticación

Los endpoints protegidos requieren el header:
```
Authorization: Bearer <accessToken>
```

---

## Auth — App Cliente

### POST /auth/app/login
**Fase 1**: Valida credenciales y envía OTP al correo registrado.

**Request:**
```json
{
  "contractNumber": "CONTRACT-001",
  "password": "password123",
  "deviceId": "mi-dispositivo-001"
}
```

**Response 200:**
```json
{
  "otpRequired": true,
  "loginToken": "eyJhbGci...",
  "message": "OTP sent to registered email",
  "canAccessOtt": true,
  "restrictionMessage": null
}
```

**Errores:** `401 Unauthorized` (credenciales inválidas), `401` (usuario inactivo)

---

### POST /auth/app/verify-otp
**Fase 2**: Verifica OTP y emite tokens de acceso.

**Request:**
```json
{
  "loginToken": "eyJhbGci...",
  "code": "123456"
}
```

**Response 200:**
```json
{
  "accessToken": "eyJhbGci...",
  "refreshToken": "eyJhbGci...",
  "canAccessOtt": true,
  "restrictionMessage": null
}
```

**Errores:** `401` (OTP inválido/expirado), `401` (loginToken expirado)

---

## Auth — CMS

### POST /auth/cms/login
Login directo para usuarios CMS (sin OTP).

**Request:**
```json
{
  "email": "admin@lukiplay.com",
  "password": "password123",
  "deviceId": "cms-device-001"
}
```

**Response 200:**
```json
{
  "accessToken": "eyJhbGci...",
  "refreshToken": "eyJhbGci...",
  "canAccessOtt": true,
  "restrictionMessage": null
}
```

**Errores:** `401` (credenciales inválidas), `401` (no es usuario CMS)

---

## Auth — Compartidos

### POST /auth/refresh
Rota el refresh token y emite un nuevo par de tokens.

**Request:**
```json
{
  "refreshToken": "eyJhbGci..."
}
```

**Response 200:** `{ accessToken, refreshToken, canAccessOtt, restrictionMessage }`

---

### POST /auth/logout
🔒 Requiere JWT. Revoca la sesión actual.

**Request:**
```json
{
  "refreshToken": "eyJhbGci..."
}
```

**Response 200:** `{ "message": "Logged out successfully" }`

---

### GET /auth/me
🔒 Requiere JWT. Devuelve el perfil del usuario autenticado.

**Response 200:**
```json
{
  "id": "usr-001",
  "contractNumber": "CONTRACT-001",
  "email": "juan@example.com",
  "role": "cliente",
  "status": "active",
  "accountId": "acc-001",
  "contractType": "ISP",
  "serviceStatus": "ACTIVO",
  "canAccessOtt": true,
  "restrictionMessage": null,
  "permissions": ["content:read"],
  "entitlements": ["basic", "hd"]
}
```

---

### POST /auth/change-password
🔒 Requiere JWT. Cambia la contraseña del usuario autenticado.

**Request:**
```json
{
  "currentPassword": "password123",
  "newPassword": "nuevaPassSegura456"
}
```

---

### GET /auth/sessions
🔒 Requiere JWT. Lista las sesiones activas del usuario actual.

**Response 200:**
```json
[
  {
    "id": "ses-001",
    "deviceId": "luki-web-dev-device-001",
    "audience": "app",
    "createdAt": "2026-01-01T10:00:00Z",
    "expiresAt": "2026-01-08T10:00:00Z"
  }
]
```

---

### DELETE /auth/sessions/:id
🔒 Requiere JWT. Revoca una sesión específica del usuario actual.

---

### POST /auth/otp/request
Solicita/reenvía un código OTP para un email.

**Request:** `{ "email": "juan@example.com" }`

---

### POST /auth/otp/verify
Verifica un código OTP (standalone, sin emitir tokens).

**Request:** `{ "userId": "usr-001", "code": "123456" }`

---

## CMS Admin (requiere rol SOPORTE o SUPERADMIN)

### GET /cms/stats
🔒 Roles: SUPERADMIN, SOPORTE.

**Response 200:**
```json
{
  "totalUsers": 7,
  "totalClients": 5,
  "totalCmsUsers": 2,
  "totalAccounts": 5,
  "totalIspAccounts": 4,
  "totalOttAccounts": 1,
  "totalActiveSessions": 0
}
```

---

### GET /cms/users
🔒 Roles: SUPERADMIN, SOPORTE. Lista todos los usuarios.

**Response 200:** Array de usuarios con id, email, contractNumber, role, status, accountId, phone, createdAt.

---

### GET /cms/accounts
🔒 Roles: SUPERADMIN, SOPORTE. Lista todos los contratos.

**Response 200:** Array de cuentas con id, contractNumber, contractType, serviceStatus, canAccessOtt, etc.

---

### GET /cms/sessions
🔒 Roles: SUPERADMIN, SOPORTE. Lista todas las sesiones activas.

**Response 200:** Array de sesiones con id, deviceId, audience, createdAt, expiresAt.

---

### DELETE /cms/sessions/:id
🔒 Roles: SUPERADMIN únicamente. Revoca cualquier sesión.

---

## Credenciales de Prueba (Seed Data)

### App Cliente
| Contrato       | Password    | Estado ISP  | Puede OTT |
|----------------|-------------|-------------|-----------|
| CONTRACT-001   | password123 | ACTIVO      | ✅         |
| CONTRACT-002   | password123 | ACTIVO      | ✅         |
| CONTRACT-003   | password123 | SUSPENDIDO  | ❌         |
| CONTRACT-004   | password123 | CORTESIA    | ✅         |
| OTT-000001     | password123 | —           | ✅         |

### CMS
| Email                    | Password    | Rol         |
|--------------------------|-------------|-------------|
| admin@lukiplay.com       | password123 | SUPERADMIN  |
| soporte@lukiplay.com     | password123 | SOPORTE     |

> **Nota sobre OTP**: En desarrollo, el OTP se muestra en la consola del backend con formato `[MockOtpService] OTP for user <id>: <code>`. Usa ese código para verificar.
