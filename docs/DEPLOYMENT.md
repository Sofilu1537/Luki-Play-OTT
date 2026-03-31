# Guía de Despliegue — Luki Play OTT

## Desarrollo local (Windows)

### Prerrequisitos

- [Git](https://git-scm.com/download/win)
- [Node.js 20 LTS](https://nodejs.org/) (incluye npm)
- PowerShell

### Paso a paso

**1. Clonar el repositorio**

```powershell
git clone https://github.com/Sofilu1537/Luki-Play-OTT.git
cd Luki-Play-OTT
```

**2. Configurar el backend**

```powershell
cd backend
copy .env.example .env
npm install
```

**3. Levantar el backend (Terminal 1)**

```powershell
npm run start:dev
```

Espera a ver:

```
[Bootstrap] Auth service running on port 3000
[Bootstrap] Swagger docs available at http://localhost:3000/api/docs
```

> ⚠️ **No cierres esta terminal** mientras uses la aplicación.

**4. Levantar el frontend (Terminal 2)**

Abre **otra** ventana de PowerShell:

```powershell
cd Luki-Play-OTT\frontend
npm install
npx expo start --web
```

Espera a ver:

```
Web is waiting on http://localhost:8081
```

**5. Verificar que todo funciona**

| URL | Servicio |
|---|---|
| http://localhost:8081 | App cliente |
| http://localhost:8081/cms/login | CMS admin |
| http://localhost:3000/api/docs | Swagger UI |

---

## Con Docker

### Prerrequisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### Levantar todos los servicios

```powershell
docker compose up --build
```

Esto inicia automáticamente:

| Servicio | Puerto | Descripción |
|---|---|---|
| `backend` | `3000` | API NestJS |
| `postgres` | `5432` | Base de datos PostgreSQL |
| `redis` | `6379` | Cache y sesiones |

### Detener servicios

```powershell
docker compose down
```

### Detener y eliminar volúmenes (reset completo)

```powershell
docker compose down -v
```

> ⚠️ Esto elimina los datos de PostgreSQL y Redis.

---

## Variables de entorno

Todas las variables se configuran en `backend/.env` (copiado desde `backend/.env.example`).

### Variables del servidor

| Variable | Valor por defecto | Descripción |
|---|---|---|
| `PORT` | `3000` | Puerto en el que escucha el backend |
| `NODE_ENV` | `development` | Entorno de ejecución |

### Variables de JWT

| Variable | Valor por defecto | Descripción |
|---|---|---|
| `JWT_ACCESS_SECRET` | *(cambiar en producción)* | Clave secreta para firmar access tokens |
| `JWT_REFRESH_SECRET` | *(cambiar en producción)* | Clave secreta para firmar refresh tokens |
| `JWT_ACCESS_EXPIRY` | `15m` | Tiempo de vida del access token |
| `JWT_REFRESH_EXPIRY` | `7d` | Tiempo de vida del refresh token |

### Variables de base de datos (para producción)

| Variable | Valor por defecto | Descripción |
|---|---|---|
| `DB_HOST` | `localhost` | Host de PostgreSQL |
| `DB_PORT` | `5432` | Puerto de PostgreSQL |
| `DB_USERNAME` | `lukiplay` | Usuario de la base de datos |
| `DB_PASSWORD` | `lukiplay_secret` | Contraseña de la base de datos |
| `DB_NAME` | `lukiplay_auth` | Nombre de la base de datos |

### Variables de Redis (para producción)

| Variable | Valor por defecto | Descripción |
|---|---|---|
| `REDIS_HOST` | `localhost` | Host de Redis |
| `REDIS_PORT` | `6379` | Puerto de Redis |
| `REDIS_PASSWORD` | *(vacío)* | Contraseña de Redis (opcional) |

### Variables de rate limiting

| Variable | Valor por defecto | Descripción |
|---|---|---|
| `THROTTLE_TTL` | `60000` | Ventana de tiempo en ms (1 minuto) |
| `THROTTLE_LIMIT` | `20` | Máximo de requests por ventana |

---

## Comandos útiles del backend

| Comando | Descripción |
|---|---|
| `npm run start:dev` | Inicia con hot reload (desarrollo) |
| `npm run build` | Compila TypeScript a JavaScript |
| `npm run start:prod` | Inicia la versión compilada (producción) |
| `npm run test` | Ejecuta tests unitarios |
| `npm run test:e2e` | Ejecuta tests end-to-end |
| `npm run lint` | Ejecuta ESLint |

## Comandos útiles del frontend

| Comando | Descripción |
|---|---|
| `npx expo start --web` | Inicia la app en modo web |
| `npx expo start` | Inicia con opciones (web, iOS, Android) |
| `npx expo build:web` | Compila para producción web |

---

## Próximos pasos para producción

### 1. Base de datos real

Reemplazar los repositorios in-memory con TypeORM o Prisma conectado a PostgreSQL.

Los repositorios implementan interfaces del dominio, por lo que el cambio es solo de infraestructura:

```typescript
// Desarrollo (actual)
providers: [{ provide: USER_REPOSITORY, useClass: InMemoryUserRepository }]

// Producción (futuro)
providers: [{ provide: USER_REPOSITORY, useClass: TypeOrmUserRepository }]
```

### 2. Redis para sesiones y OTP

- Almacenar OTPs en Redis con TTL nativo (reemplaza `MockOtpService`)
- Almacenar sesiones activas en Redis para escalabilidad horizontal

### 3. SMTP real para OTP

Reemplazar `MockOtpService` con una implementación que use un proveedor de email:
- **Nodemailer** con SMTP propio
- **SendGrid** / **Mailgun** / **AWS SES**

```typescript
// Producción (futuro)
providers: [{ provide: OTP_SERVICE, useClass: SmtpOtpService }]
```

### 4. HTTPS

- Obtener certificado SSL (Let's Encrypt o proveedor cloud)
- Configurar reverse proxy (Nginx o Caddy) frente al backend NestJS

### 5. Variables de entorno seguras

En producción, generar secretos JWT con al menos 64 caracteres aleatorios:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 6. CI/CD

Pipeline recomendado:

```
Push → Lint → Tests → Build → Docker build → Deploy
```

Plataformas: GitHub Actions, GitLab CI, Railway, Render, AWS ECS.

### 7. CORS

Configurar orígenes explícitos en `src/main.ts`:

```typescript
app.enableCors({
  origin: ['https://app.lukiplay.com', 'https://cms.lukiplay.com'],
  credentials: true,
});
```

### 8. Monitoreo y logging

- Logs estructurados con **Winston** o **Pino**
- Métricas con **Prometheus** + **Grafana**
- Trazas con **OpenTelemetry**
