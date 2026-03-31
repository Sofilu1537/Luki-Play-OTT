# API Reference — Luki Play OTT

Base URL: `http://localhost:3000`

Documentación interactiva (Swagger): `http://localhost:3000/api/docs`

---

## Autenticación

Los endpoints protegidos requieren el header:

```
Authorization: Bearer <accessToken>
```

El `accessToken` se obtiene completando el flujo de login (App o CMS).

---

## Endpoints de la App Cliente

### POST /auth/app/login

**Fase 1 del login de cliente.** Valida credenciales y envía OTP al correo registrado.

**Request body:**

```json
{
  "contractNumber": "CONTRACT-001",
  "password": "password123",
  "deviceId": "luki-web-dev-device-001"
}
```

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `contractNumber` | string | ✅ | Número de contrato del cliente |
| `password` | string | ✅ | Contraseña (mín. 6 caracteres) |
| `deviceId` | string | ✅ | Identificador único del dispositivo |

**Response 200 — OK:**

```json
{
  "otpRequired": true,
  "loginToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "OTP sent to email",
  "canAccessOtt": true,
  "restrictionMessage": null
}
```

| Campo | Tipo | Descripción |
|---|---|---|
| `otpRequired` | boolean | Siempre `true` para el flujo app |
| `loginToken` | string | Token JWT temporal para usar en Fase 2 |
| `message` | string | Confirmación de envío de OTP |
| `canAccessOtt` | boolean | Si el usuario puede acceder al contenido OTT |
| `restrictionMessage` | string \| null | Mensaje de restricción si `canAccessOtt` es `false` |

**Códigos de respuesta:**

| Código | Descripción |
|---|---|
| `200` | Credenciales válidas, OTP enviado |
| `401` | Credenciales inválidas |
| `404` | Número de contrato no encontrado |

---

### POST /auth/app/verify-otp

**Fase 2 del login de cliente.** Verifica el OTP y emite los tokens JWT definitivos.

**Request body:**

```json
{
  "loginToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "code": "123456"
}
```

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `loginToken` | string | ✅ | Token recibido en la Fase 1 |
| `code` | string | ✅ | Código OTP de 6 dígitos |

**Response 200 — OK:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "canAccessOtt": true,
  "restrictionMessage": null
}
```

| Campo | Tipo | Descripción |
|---|---|---|
| `accessToken` | string | JWT de acceso (expira en 15 minutos) |
| `refreshToken` | string | JWT de renovación (expira en 7 días) |
| `canAccessOtt` | boolean | Si el usuario puede consumir contenido OTT |
| `restrictionMessage` | string \| null | Mensaje si el acceso OTT está restringido |

**Códigos de respuesta:**

| Código | Descripción |
|---|---|
| `200` | OTP válido, tokens emitidos |
| `401` | OTP inválido, expirado o loginToken inválido |
| `429` | Demasiados intentos fallidos (máx. 3) |

---

## Endpoints del CMS Admin

### POST /auth/cms/login

**Login para usuarios internos del CMS** (roles `superadmin` y `soporte`). No requiere OTP.

**Request body:**

```json
{
  "email": "admin@lukiplay.com",
  "password": "password123",
  "deviceId": "cms-browser-xyz"
}
```

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `email` | string | ✅ | Email del usuario CMS |
| `password` | string | ✅ | Contraseña (mín. 6 caracteres) |
| `deviceId` | string | ✅ | Identificador del dispositivo |

**Response 200 — OK:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "canAccessOtt": true,
  "restrictionMessage": null
}
```

**Códigos de respuesta:**

| Código | Descripción |
|---|---|
| `200` | Login exitoso |
| `401` | Credenciales inválidas |
| `403` | Usuario autenticado pero sin rol CMS |

---

## Endpoints de tokens y sesión

### POST /auth/refresh

**Renueva el `accessToken`** usando el `refreshToken`. Implementa **token rotation**: el refresh token usado queda invalidado y se emite uno nuevo.

**Request body:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response 200 — OK:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "canAccessOtt": true,
  "restrictionMessage": null
}
```

**Códigos de respuesta:**

| Código | Descripción |
|---|---|
| `200` | Tokens renovados |
| `401` | Refresh token inválido, expirado o ya usado |

---

### POST /auth/logout

**Cierra la sesión actual** y revoca el refresh token. Requiere autenticación.

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Request body:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response 200 — OK:**

```json
{
  "message": "Logged out successfully"
}
```

**Códigos de respuesta:**

| Código | Descripción |
|---|---|
| `200` | Sesión cerrada correctamente |
| `401` | Access token inválido o expirado |

---

### GET /auth/me

**Obtiene el perfil completo del usuario autenticado**, incluyendo estado de acceso OTT.

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Response 200 — OK:**

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
  "permissions": ["read:content", "manage:profile"],
  "entitlements": ["basic-catalog"]
}
```

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | string | UUID del usuario |
| `contractNumber` | string \| null | Número de contrato (null para CMS users) |
| `email` | string | Email del usuario |
| `role` | string | Rol: `cliente`, `soporte` o `superadmin` |
| `status` | string | Estado: `active`, `inactive` o `suspended` |
| `accountId` | string \| null | ID de la cuenta asociada |
| `contractType` | string \| null | `ISP` o `OTT_ONLY` |
| `serviceStatus` | string \| null | Estado del servicio ISP |
| `canAccessOtt` | boolean | Si puede consumir contenido OTT |
| `restrictionMessage` | string \| null | Mensaje si hay restricción |
| `permissions` | string[] | Lista de permisos |
| `entitlements` | string[] | Lista de accesos a contenido |

**Códigos de respuesta:**

| Código | Descripción |
|---|---|
| `200` | Perfil devuelto correctamente |
| `401` | Token inválido o expirado |

---

## Endpoints adicionales

### GET /auth/sessions

Lista las sesiones activas del usuario autenticado.

**Headers:** `Authorization: Bearer <accessToken>`

**Response 200:**

```json
[
  {
    "id": "ses-001",
    "deviceId": "luki-web-dev-device-001",
    "audience": "app",
    "createdAt": "2026-03-31T07:00:00.000Z",
    "expiresAt": "2026-04-07T07:00:00.000Z"
  }
]
```

---

### DELETE /auth/sessions/:id

Revoca una sesión específica del usuario autenticado.

**Headers:** `Authorization: Bearer <accessToken>`

**Response 200:**

```json
{ "message": "Session revoked successfully" }
```

---

### POST /auth/otp/request

Solicita o reenvía un OTP para un contrato dado.

**Request body:**

```json
{ "contractNumber": "CONTRACT-001" }
```

**Response 200:**

```json
{ "message": "OTP sent" }
```

---

### POST /auth/otp/verify

Verifica un OTP de forma independiente (sin emitir tokens).

**Request body:**

```json
{
  "contractNumber": "CONTRACT-001",
  "code": "123456"
}
```

**Response 200:**

```json
{ "verified": true }
```

---

### POST /auth/change-password

Cambia la contraseña del usuario autenticado.

**Headers:** `Authorization: Bearer <accessToken>`

**Request body:**

```json
{
  "currentPassword": "password123",
  "newPassword": "newSecurePass456"
}
```

**Response 200:**

```json
{ "message": "Password changed successfully" }
```

---

## Payload del JWT

El `accessToken` contiene el siguiente payload:

```json
{
  "sub": "usr-001",
  "email": "juan@example.com",
  "role": "cliente",
  "sessionId": "ses-uuid-here",
  "audience": "app",
  "iat": 1711872000,
  "exp": 1711872900
}
```

---

## Manejo de errores

Todos los errores siguen el formato estándar de NestJS:

```json
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized"
}
```

| Código | Descripción |
|---|---|
| `400` | Datos de entrada inválidos (validación) |
| `401` | No autenticado o credenciales inválidas |
| `403` | Autenticado pero sin permisos suficientes |
| `404` | Recurso no encontrado |
| `429` | Demasiadas solicitudes (rate limiting) |
| `500` | Error interno del servidor |
