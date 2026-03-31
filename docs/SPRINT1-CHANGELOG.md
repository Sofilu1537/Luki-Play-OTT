# Sprint 1 + Sprint 1.5 — Changelog

## Sprint 1 — Módulo de autenticación completo

### Backend — Cambios

#### Archivos nuevos creados

**Dominio (`src/modules/auth/domain/`)**

| Archivo | Descripción |
|---|---|
| `entities/user.entity.ts` | Entidad User con roles (cliente/soporte/superadmin) y estados |
| `entities/account.entity.ts` | Entidad Account con lógica de acceso OTT y estados ISP |
| `entities/session.entity.ts` | Entidad Session con audiencia (app/cms) y revocación |
| `interfaces/user.repository.ts` | Contrato del repositorio de usuarios |
| `interfaces/account.repository.ts` | Contrato del repositorio de cuentas |
| `interfaces/session.repository.ts` | Contrato del repositorio de sesiones |
| `interfaces/hash.service.ts` | Contrato del servicio de hash |
| `interfaces/otp.service.ts` | Contrato del servicio OTP |
| `interfaces/token.service.ts` | Contrato del servicio de tokens JWT |

**Aplicación — DTOs (`src/modules/auth/application/dto/`)**

| Archivo | Descripción |
|---|---|
| `login-app.dto.ts` | DTO para login de app: contractNumber + password + deviceId |
| `login-cms.dto.ts` | DTO para login CMS: email + password + deviceId |
| `otp.dto.ts` | DTOs para solicitar y verificar OTP (RequestOtpDto, VerifyOtpDto, VerifyLoginOtpDto) |
| `refresh-token.dto.ts` | DTO para refresh token |
| `change-password.dto.ts` | DTO para cambio de contraseña |
| `auth-response.dto.ts` | Clases de respuesta con decoradores Swagger |

**Aplicación — Use Cases (`src/modules/auth/application/use-cases/`)**

| Archivo | Descripción |
|---|---|
| `login-app.use-case.ts` | Fase 1: valida credenciales, genera y envía OTP |
| `login-app.use-case.spec.ts` | Tests del use case de login app |
| `complete-login.use-case.ts` | Fase 2: verifica OTP, crea sesión, emite tokens |
| `complete-login.use-case.spec.ts` | Tests del use case de complete login |
| `login-cms.use-case.ts` | Login directo para usuarios CMS |
| `login-cms.use-case.spec.ts` | Tests del use case de login CMS |
| `refresh-token.use-case.ts` | Rotación de refresh token |
| `logout.use-case.ts` | Revocación de sesión |
| `logout.use-case.spec.ts` | Tests del logout |
| `get-current-user.use-case.ts` | Devuelve perfil completo del usuario autenticado |
| `list-active-sessions.use-case.ts` | Lista sesiones activas del usuario |
| `revoke-session.use-case.ts` | Revoca una sesión específica |
| `request-otp.use-case.ts` | Solicita/reenvía un OTP |
| `verify-otp.use-case.ts` | Verifica OTP de forma independiente |
| `change-password.use-case.ts` | Cambia la contraseña del usuario |
| `init-qr-login.use-case.ts` | Inicializa login por QR (preparado para futuro) |
| `confirm-qr-login.use-case.ts` | Confirma login por QR |

**Infraestructura (`src/modules/auth/infrastructure/`)**

| Archivo | Descripción |
|---|---|
| `jwt/jwt-token.service.ts` | Implementación JWT: genera y valida access/refresh tokens |
| `jwt/jwt.strategy.ts` | Passport JWT strategy para NestJS |
| `persistence/bcrypt-hash.service.ts` | Implementación bcrypt para hash y comparación |
| `persistence/mock-otp.service.ts` | OTP in-memory: genera, hashea, valida con expiración e intentos |
| `repositories/in-memory-user.repository.ts` | Repositorio in-memory con 7 usuarios seed |
| `repositories/in-memory-account.repository.ts` | Repositorio in-memory con 5 cuentas seed |
| `repositories/in-memory-session.repository.ts` | Repositorio in-memory de sesiones |

**Presentación (`src/modules/auth/presentation/`)**

| Archivo | Descripción |
|---|---|
| `controllers/auth.controller.ts` | 11 endpoints REST con decoradores Swagger |
| `guards/jwt-auth.guard.ts` | Guard de autenticación JWT |
| `guards/roles.guard.ts` | Guard de verificación de roles |
| `guards/roles.guard.spec.ts` | Tests del roles guard |
| `guards/permissions.guard.ts` | Guard de permisos granulares |
| `guards/permissions.guard.spec.ts` | Tests del permissions guard |
| `guards/audience.guard.ts` | Guard de audiencia (app/cms) |
| `guards/audience.guard.spec.ts` | Tests del audience guard |
| `decorators/current-user.decorator.ts` | Extrae payload JWT del request |
| `decorators/roles.decorator.ts` | Declara roles requeridos |
| `decorators/permissions.decorator.ts` | Declara permisos requeridos |
| `decorators/audience.decorator.ts` | Declara audiencia del endpoint |

**Módulos externos (mocks)**

| Archivo | Descripción |
|---|---|
| `modules/billing/domain/interfaces/billing.gateway.ts` | Interfaz del gateway de facturación |
| `modules/billing/infrastructure/adapters/mock-billing.gateway.ts` | Mock de facturación desacoplado |
| `modules/crm/domain/interfaces/crm.gateway.ts` | Interfaz del gateway de CRM |
| `modules/crm/infrastructure/adapters/mock-crm.gateway.ts` | Mock de CRM desacoplado |

**Otros**

| Archivo | Descripción |
|---|---|
| `src/main.ts` | Bootstrap con Swagger, CORS, pipes y filtros globales |
| `src/app.module.ts` | Módulo raíz que importa Auth, Billing, CRM, AccessControl |
| `src/common/filters/http-exception.filter.ts` | Filtro global de excepciones |
| `src/common/pipes/validation.pipe.ts` | Pipe global de validación |
| `backend/.env.example` | Variables de entorno documentadas |
| `backend/Dockerfile` | Dockerfile del backend |
| `docker-compose.yml` | Orquestación con backend, PostgreSQL y Redis |

#### Endpoints añadidos

| Método | Endpoint | Descripción |
|---|---|---|
| `POST` | `/auth/app/login` | Fase 1: credenciales → OTP |
| `POST` | `/auth/app/verify-otp` | Fase 2: OTP → JWT tokens |
| `POST` | `/auth/cms/login` | Login directo para CMS |
| `POST` | `/auth/refresh` | Renovar access token |
| `POST` | `/auth/logout` | Cerrar sesión |
| `GET` | `/auth/me` | Perfil del usuario actual |
| `POST` | `/auth/change-password` | Cambiar contraseña |
| `GET` | `/auth/sessions` | Listar sesiones activas |
| `DELETE` | `/auth/sessions/:id` | Revocar sesión específica |
| `POST` | `/auth/otp/request` | Solicitar/reenviar OTP |
| `POST` | `/auth/otp/verify` | Verificar OTP (standalone) |

#### Seguridad implementada

- **bcrypt** (rounds: 12) para hash de passwords y OTP
- **JWT access token** con expiración de 15 minutos
- **JWT refresh token** con expiración de 7 días
- **Refresh token rotation**: cada uso invalida el token anterior
- **OTP** con hash bcrypt, expiración de 5 minutos y máximo 3 intentos
- **Guards**: JWT, Roles, Permissions, Audience
- **Separación de audiencias**: tokens `app` y `cms` son distintos

#### Datos seed (desarrollo)

| ID | Contrato/Email | Tipo | Estado | Password |
|---|---|---|---|---|
| `usr-001` | `CONTRACT-001` | ISP ACTIVO | ✅ | `password123` |
| `usr-002` | `CONTRACT-002` | ISP ACTIVO | ✅ | `password123` |
| `usr-003` | `CONTRACT-003` | ISP SUSPENDIDO | ⚠️ | `password123` |
| `usr-004` | `CONTRACT-004` | ISP CORTESIA | ✅ | `password123` |
| `usr-ott-001` | `OTT-000001` | OTT-only ACTIVO | ✅ | `password123` |
| `usr-admin-001` | `admin@lukiplay.com` | SUPERADMIN | — | `password123` |
| `usr-soporte-001` | `soporte@lukiplay.com` | SOPORTE | — | `password123` |

---

### Frontend — Cambios

#### Archivos modificados

| Archivo | Cambios |
|---|---|
| `frontend/services/authStore.ts` | Refactorizado con flujo de dos fases: login → OTP → JWT. Incluye `loginToken`, `accessToken`, `refreshToken`, `otpRequired`. |
| `frontend/app/(auth)/login.tsx` | Login con número de contrato + contraseña. Navega a OTP screen. |
| `frontend/app/(auth)/verify-otp.tsx` | Pantalla de verificación OTP de 6 dígitos con manejo de errores. |
| `frontend/app/(app)/_layout.tsx` | Navegación protegida: redirige a login si no hay sesión activa. |

#### authStore — Estado y acciones

```typescript
// Estado
user: User | null
isLoading: boolean
loginToken: string | null      // token temporal de fase 1
accessToken: string | null     // JWT de acceso
refreshToken: string | null    // JWT de renovación
otpRequired: boolean

// Acciones
login(contractNumber, password) // Fase 1 → POST /auth/app/login
verifyOtp(code)                 // Fase 2 → POST /auth/app/verify-otp
logout()                        // POST /auth/logout + limpia estado
```

---

## Sprint 1.5 — Panel CMS Admin

### Frontend — Nuevo (en desarrollo)

#### Archivos a crear

| Archivo | Descripción |
|---|---|
| `frontend/app/cms/login.tsx` | Login CMS: email + password, sin OTP |
| `frontend/app/cms/dashboard.tsx` | Cards de resumen: usuarios, contratos, sesiones |
| `frontend/app/cms/users.tsx` | Tabla de usuarios con filtros por rol |
| `frontend/app/cms/accounts.tsx` | Tabla de contratos con badges por estado |
| `frontend/app/cms/sessions.tsx` | Sesiones activas con opción de revocar |
| `frontend/services/cmsStore.ts` | Zustand store para el CMS |
| `frontend/services/api/cmsApi.ts` | Llamadas HTTP separadas del store |

#### cmsStore — Estado y acciones

```typescript
// Estado
cmsUser: CmsUser | null
isLoading: boolean
accessToken: string | null
refreshToken: string | null

// Acciones
login(email, password)          // POST /auth/cms/login
logout()                        // POST /auth/logout + limpia estado
fetchUsers()                    // GET /cms/users (futuro endpoint)
fetchAccounts()                 // GET /cms/accounts (futuro endpoint)
fetchSessions()                 // GET /auth/sessions
revokeSession(sessionId)        // DELETE /auth/sessions/:id
```

#### Rutas del CMS

| Ruta | Pantalla | Rol requerido |
|---|---|---|
| `/cms/login` | Login CMS | — |
| `/cms/dashboard` | Dashboard | soporte, superadmin |
| `/cms/users` | Gestión de usuarios | soporte, superadmin |
| `/cms/accounts` | Gestión de contratos | soporte, superadmin |
| `/cms/sessions` | Sesiones activas | soporte, superadmin |

---

## Decisiones técnicas

### ¿Por qué repositorios in-memory?

Los repositorios in-memory permiten desarrollar y probar toda la lógica de negocio sin depender de una base de datos. La arquitectura Clean garantiza que el dominio y los use cases no saben si los datos vienen de memoria, PostgreSQL o cualquier otro origen. La migración es un cambio de infraestructura, no de lógica.

### ¿Por qué bcrypt para passwords?

bcrypt incluye un factor de costo configurable (actualmente 12 rounds) que hace la fuerza bruta computacionalmente inviable. También genera un salt aleatorio por cada hash, evitando ataques de tabla arcoíris.

### ¿Por qué JWT + refresh token rotation?

El access token de corta duración (15 min) limita la ventana de compromiso si es robado. El refresh token de larga duración (7 días) permite renovar sin re-autenticar. La rotación invalida el refresh token en cada uso, detectando reutilización (potencial robo).

### ¿Por qué OTP con hash y no texto plano?

El OTP se almacena hasheado con bcrypt para que incluso si la memoria en desarrollo fuera accedida, no se pudieran obtener los códigos activos. Mantiene la misma política de seguridad que las contraseñas.

### ¿Por qué stores separados (authStore vs cmsStore)?

El cliente app y el CMS admin tienen audiencias diferentes (`app` vs `cms`), tokens distintos y flujos de autenticación incompatibles (OTP obligatorio vs login directo). Compartir store generaría colisiones de estado y complejidad innecesaria.

### ¿Por qué mocks desacoplados para CRM y Billing?

El dominio nunca depende de una implementación concreta. Los módulos externos exponen una interfaz; los mocks implementan esa interfaz. Cuando el CRM real esté disponible, solo se reemplaza el adaptador de infraestructura sin tocar dominio ni use cases.

---

## Riesgos y TODOs

### Alta prioridad

- [ ] **Migrar a PostgreSQL** — Reemplazar repositorios in-memory con TypeORM o Prisma
- [ ] **Implementar envío real de email** — Integrar SMTP o servicio transaccional para OTP
- [ ] **Rate limiting en endpoints de auth** — Throttle en login, OTP y refresh

### Media prioridad

- [ ] **Conectar CRM real** — Implementar `CrmGateway` con la API del ISP
- [ ] **Conectar Billing real** — Implementar `BillingGateway` con el sistema de facturación
- [ ] **Tests e2e** — Cobertura de los flujos completos de autenticación
- [ ] **Redis para sesiones y OTP** — TTL nativo, escalabilidad horizontal
- [ ] **restoreSession en authStore** — Rehidratar sesión desde AsyncStorage al iniciar app

### Baja prioridad

- [ ] **CORS en producción** — Configurar orígenes permitidos explícitamente
- [ ] **HTTPS** — Certificado SSL para backend en producción
- [ ] **CI/CD** — Pipeline de build, test y deploy automático
- [ ] **Logging estructurado** — Reemplazar Logger de NestJS con solución de observabilidad
- [ ] **QR Login** — Los use cases están creados, falta implementación completa
