# Guía de Despliegue — LUKI Play OTT

## Requisitos del Sistema

| Componente   | Versión mínima     | Recomendado         |
|--------------|--------------------|---------------------|
| Node.js      | 20.x LTS           | 20.20+              |
| npm           | 10.x              | 10.8+               |
| Git          | 2.x                | 2.40+               |
| OS           | Ubuntu 22.04+      | Debian 13 / Ubuntu 24.04 |
| RAM          | 1 GB               | 2 GB+               |
| Disco        | 5 GB libres        | 10 GB+              |

### Servicios Requeridos

| Servicio     | Puerto por defecto | Estado actual         |
|--------------|--------------------|------------------------|
| PostgreSQL   | 5432               | **Activo** (via Docker) |
| Redis        | 6379               | Configurado, preparado |
| Nginx        | 8120               | Activo en producción   |
| PM2          | —                  | Gestor de procesos     |

---

## Clonación del Repositorio

```bash
git clone https://github.com/Sofilu1537/Luki-Play-OTT.git
cd Luki-Play-OTT
```

---

## Instalación de Dependencias

### Backend

```bash
cd backend
npm install
```

> **Nota**: `npm install` ejecuta automáticamente `prisma generate` como postinstall,
> creando el Prisma Client necesario para la conexión a PostgreSQL.

### Frontend

```bash
cd frontend
npm install
```

---

## Configuración de Variables de Entorno

### Backend

```bash
cd backend
cp .env.example .env
```

Editar `.env` con los valores correspondientes al entorno.
Ver [.env.example](../.env.example) para referencia completa de todas las variables.

### Frontend

El frontend calcula la URL del API automáticamente:
- En desarrollo: `http://localhost:3000`
- En producción: mismo host y puerto del navegador (nginx proxea las rutas)

No requiere archivo `.env` separado.

---

## Inicialización de Base de Datos

### Requisito previo: PostgreSQL + Redis

Levantar los servicios con Docker Compose:

```bash
docker compose up -d postgres redis
```

Verificar que PostgreSQL esté `healthy`:

```bash
docker compose ps
```

### Migraciones y Seed (Desarrollo)

```bash
cd backend
npx prisma migrate dev      # Aplica todas las migraciones pendientes
npx prisma db seed           # Carga datos de prueba (47 suscriptores + 3 CMS + plan)
```

### Migraciones (Producción)

```bash
cd backend
npx prisma migrate deploy   # Solo aplica migraciones, sin generar nuevas
```

### Verificar datos

```bash
npx prisma studio           # Abre interfaz web para inspeccionar la BD
```

> **Datos del seed**: 47 suscriptores ISP con contratos reales, 3 usuarios CMS:
>
> | Email | Rol | Contraseña |
> |-------|-----|-----------|
> | `admin@lukiplay.com` | SUPERADMIN | `password123` |
> | `gestion@lukiplay.com` | ADMIN | `password123` |
> | `soporte@lukiplay.com` | SOPORTE | `password123` |
>
> También incluye 1 plan "LUKI PLAY" y contratos asociados a los suscriptores.

---

## Ejecución

### Modo Desarrollo

**Terminal 1 — Backend:**
```bash
cd backend
npm run start:dev
```
El backend queda en `http://localhost:3000`.
Swagger: `http://localhost:3000/api/docs`

**Terminal 2 — Frontend:**
```bash
cd frontend
npx expo start --web
```
La app queda en `http://localhost:8081`.

### Modo Producción (Docker)

```bash
docker compose up --build -d
```

> Esto levanta PostgreSQL, Redis y el backend. Las migraciones deben ejecutarse
> después: `docker compose exec backend npx prisma migrate deploy`.

### Modo Producción (EC2 / PM2 + Nginx)

#### 1. Backend

```bash
cd backend
npm install --production
npm run build
pm2 start dist/main.js --name luki-play-backend
```

El backend escucha en el puerto definido en `PORT` (8100 en producción).

#### 2. Frontend

```bash
cd frontend
npm install
NODE_OPTIONS='--max-old-space-size=512' npx expo export --platform web
```

Esto genera la carpeta `dist/` con los archivos estáticos.

#### 3. Nginx

Copiar archivos estáticos al directorio de Nginx:

```bash
sudo rm -rf /var/www/luki-play-ott/*
sudo cp -r frontend/dist/* /var/www/luki-play-ott/
```

Configuración de Nginx (sitio `luki-play-ott.conf`):

```nginx
server {
  listen 8120;
  server_name <IP_DEL_SERVIDOR>;
  root /var/www/luki-play-ott;
  index index.html;

  location /auth/ {
    proxy_pass http://[::1]:8100/auth/;
    proxy_http_version 1.1;
    proxy_set_header Host localhost:8100;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header Authorization $http_authorization;
  }

  location /admin/ {
    proxy_pass http://[::1]:8100/admin/;
    proxy_http_version 1.1;
    proxy_set_header Host localhost:8100;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header Authorization $http_authorization;
  }

  location /public/ {
    proxy_pass http://[::1]:8100/public/;
    proxy_http_version 1.1;
    proxy_set_header Host localhost:8100;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }

  location /api/ {
    proxy_pass http://[::1]:8100/api/;
    proxy_http_version 1.1;
    proxy_set_header Host localhost:8100;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }

  location ~ /\.(?!well-known).* {
    deny all;
    return 404;
  }

  location / {
    try_files $uri $uri.html $uri/ /index.html;
  }
}
```

Verificar y recargar:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## Servicios Externos Requeridos

### Activos

| Servicio               | Módulo                       | Implementación                  |
|------------------------|------------------------------|---------------------------------|
| PostgreSQL 15          | `PrismaModule`               | `PrismaService` + PrismaPg adapter |
| Hash de contraseñas    | `HashService`                | `BcryptHashService` (real)      |
| Tokens JWT             | `TokenService`               | `JwtTokenService` (real)        |
| Email / SMTP           | `EmailService`               | `NodemailerEmailService` (real) |

### Mock (Para desarrollo — sin integración real)

| Servicio               | Interfaz                     | Mock actual                     |
|------------------------|------------------------------|---------------------------------|
| Facturación ISP        | `BillingGateway`             | `MockBillingGateway`            |
| CRM                    | `CrmGateway`                 | `MockCrmGateway`                |

### Configuración SMTP (Desarrollo)

El servicio de email usa `NodemailerEmailService`. Para desarrollo local, configurar Mailtrap en `backend/.env`:

```env
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=<tu_usuario_mailtrap>
SMTP_PASS=<tu_password_mailtrap>
SMTP_FROM=noreply@lukiplay.com
```

> **Mailtrap**: Crear cuenta en [mailtrap.io](https://mailtrap.io) → Email Testing → SMTP Settings → copiar credenciales.
> Todos los correos enviados en desarrollo quedan capturados en el inbox de Mailtrap (no llegan a destinatarios reales).

### Para Producción Completa

- **Redis**: Caché de sesiones y tokens (configurado, no habilitado aún)
- **Proveedor SMTP**: AWS SES, SendGrid o similar para envío real de OTP y activaciones
- **CDN de Video**: Integración con proveedor de streaming real
- **Pasarela de Pagos**: Para gestión de suscripciones OTT-only

---

## URLs de Acceso

### Desarrollo Local

| Servicio          | URL                                       |
|-------------------|-------------------------------------------|
| App OTT (login)   | `http://localhost:8081/login`              |
| CMS Login         | `http://localhost:8081/cms/login`          |
| Swagger API       | `http://localhost:3000/api/docs`           |
| Backend API       | `http://localhost:3000`                    |
| Prisma Studio     | `http://localhost:5555` (via `npx prisma studio`) |

### Producción (Nginx)

| Servicio          | URL                                       |
|-------------------|-------------------------------------------|
| App OTT           | `http://<HOST>:8120`                      |
| Login cliente OTT | `http://<HOST>:8120/login`                |
| CMS Login         | `http://<HOST>:8120/cms/login`            |
| Swagger API       | `http://<HOST>:8120/api/docs`             |

> Reemplazar `<HOST>` con la IP o dominio del servidor.
> Las credenciales iniciales se encuentran en la raíz del README.

---

## Zona Horaria

El sistema está configurado para la zona horaria **America/Guayaquil (UTC-5)**.
Asegurarse de que el servidor tenga configurada esta zona:

```bash
sudo timedatectl set-timezone America/Guayaquil
```
