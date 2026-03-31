# Luki Play OTT — Guía de Despliegue

## Requisitos

- Node.js v18 o superior
- npm v9+
- Git

---

## Despliegue Local (Windows)

### 1. Clonar el repositorio

```powershell
git clone https://github.com/Sofilu1537/Luki-Play-OTT.git
cd Luki-Play-OTT
```

### 2. Backend (Terminal 1)

```powershell
cd backend
npm install
npm run start:dev
```

✅ Espera: `Auth service running on port 3000`

**Swagger:** http://localhost:3000/api/docs

### 3. Frontend (Terminal 2)

```powershell
cd frontend
npm install
npx expo start --web
```

✅ Espera: `Web is waiting on http://localhost:8081`

---

## Variables de Entorno

Copia `backend/.env.example` a `backend/.env` y configura:

```env
# JWT
JWT_ACCESS_SECRET=dev-access-secret-change-in-prod
JWT_REFRESH_SECRET=dev-refresh-secret-change-in-prod
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Server
PORT=3000

# Redis (para producción)
# REDIS_HOST=localhost
# REDIS_PORT=6379
```

---

## URLs de la Aplicación

| Recurso                    | URL                                  |
|----------------------------|--------------------------------------|
| App cliente (login)        | http://localhost:8081/(auth)/login   |
| App cliente (OTP)          | http://localhost:8081/(auth)/verify-otp |
| App cliente (catálogo)     | http://localhost:8081/(app)/home     |
| CMS login                  | http://localhost:8081/cms/login      |
| CMS dashboard              | http://localhost:8081/cms/dashboard  |
| CMS usuarios               | http://localhost:8081/cms/users      |
| CMS contratos              | http://localhost:8081/cms/accounts   |
| CMS sesiones               | http://localhost:8081/cms/sessions   |
| API REST (Swagger)         | http://localhost:3000/api/docs       |

---

## Credenciales de Prueba

### App Cliente
| Contrato       | Contraseña  | Estado     |
|----------------|-------------|------------|
| CONTRACT-001   | password123 | ACTIVO ✅   |
| CONTRACT-002   | password123 | ACTIVO ✅   |
| CONTRACT-003   | password123 | SUSPENDIDO ⚠️ |
| CONTRACT-004   | password123 | CORTESIA ✅ |
| OTT-000001     | password123 | ACTIVO ✅   |

> **OTP en desarrollo**: El código OTP aparece en la terminal del backend:
> ```
> [MockOtpService] OTP for user usr-001: 123456
> ```

### CMS
| Email                    | Contraseña  | Rol         |
|--------------------------|-------------|-------------|
| admin@lukiplay.com       | password123 | SUPERADMIN  |
| soporte@lukiplay.com     | password123 | SOPORTE     |

---

## Docker (opcional)

```bash
# Desde la raíz del repositorio
docker-compose up --build
```

El `docker-compose.yml` levanta el backend en el puerto 3000.

Para el frontend, actualmente se ejecuta fuera de Docker (requiere Expo).

---

## Despliegue en Producción

### Backend

1. Configurar variables de entorno reales (secrets seguros)
2. Configurar base de datos PostgreSQL y reemplazar los repositorios in-memory
3. Configurar Redis para sesiones
4. Configurar un servicio de email real (SendGrid, SES, etc.)
5. Habilitar HTTPS

```bash
npm run build
npm run start:prod
```

### Frontend

```bash
# Build web estático
npx expo export --platform web

# Desplegar carpeta dist/ en Vercel, Netlify, S3+CloudFront, etc.
```

---

## Solución de Problemas

### Backend no inicia

```powershell
# Limpiar y reinstalar dependencias
cd backend
rm -rf node_modules
npm install
npm run start:dev
```

### Frontend no conecta con el backend

- Verificar que el backend esté corriendo en `http://localhost:3000`
- Verificar CORS (está habilitado por defecto en desarrollo)
- Verificar que `API_BASE_URL` en los archivos de API sea correcto

### OTP no llega

En modo desarrollo el OTP se muestra en la consola del backend. Busca:
```
[MockOtpService] OTP for user <id>: <code>
```

### TypeScript errors en frontend

```powershell
cd frontend
npx tsc --noEmit
```
