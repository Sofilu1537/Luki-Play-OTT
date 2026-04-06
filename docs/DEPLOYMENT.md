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

### Servicios Opcionales (Para Producción Completa)

| Servicio     | Puerto por defecto | Estado actual        |
|--------------|--------------------|----------------------|
| PostgreSQL   | 5432               | Configurado, no conectado |
| Redis        | 6379               | Configurado, no conectado |
| Nginx        | 8120               | Activo en producción |
| PM2          | —                  | Gestor de procesos   |

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

## Inicialización

### Datos Seed

El backend carga datos de prueba automáticamente al iniciar (repositorios in-memory).
No se requieren migraciones ni scripts de seed adicionales en el estado actual.

Cuando se implemente PostgreSQL, los pasos serán:

```bash
cd backend
npm run migration:run    # [PENDIENTE — completar cuando se implemente]
npm run seed             # [PENDIENTE — completar cuando se implemente]
```

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

### Modo Producción (EC2 / PM2 + Nginx)

Este repositorio soporta dos formas de despliegue en EC2:

- `git clone` o `git pull` tradicional sobre una rama remota existente
- despliegue por snapshot de la rama activa local usando `deploy-active-branch.ps1`

El despliegue actualmente aplicado en EC2 se ejecutó por snapshot de la rama activa local,
por lo que el servidor puede no conservar metadatos `.git` aunque el contenido desplegado sí
corresponda a una rama concreta del repositorio.

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
npm run build:web
```

El script `build:web` usa actualmente:

```bash
expo export --platform web
```

Esto genera la carpeta `dist/` con los archivos estáticos. Si un entorno antiguo aún genera
`web-build/`, el script `deploy-ec2.sh` contempla ambos directorios como salida válida.

#### 3. Nginx

Copiar archivos estáticos al directorio de Nginx:

```bash
sudo rm -rf /var/www/luki-play-ott/*
sudo cp -r frontend/dist/* /var/www/luki-play-ott/
```

Configuración de Nginx (sitio `luki-play-ott.conf`):

```nginx
server {
  listen 80;
  listen 8120;
  server_name <IP_DEL_SERVIDOR>;
  root /var/www/luki-play-ott;
  index index.html;

  location /auth/ {
    proxy_pass http://127.0.0.1:8100/auth/;
    proxy_http_version 1.1;
    proxy_set_header Host localhost:8100;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header Authorization $http_authorization;
  }

  location /admin/ {
    proxy_pass http://127.0.0.1:8100/admin/;
    proxy_http_version 1.1;
    proxy_set_header Host localhost:8100;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header Authorization $http_authorization;
  }

  location /public/ {
    proxy_pass http://127.0.0.1:8100/public/;
    proxy_http_version 1.1;
    proxy_set_header Host localhost:8100;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }

  location /api/ {
    proxy_pass http://127.0.0.1:8100/api/;
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

#### 4. Security Group de AWS

Para acceso público desde navegador no basta con que Nginx y PM2 estén activos dentro de EC2.
El Security Group de la instancia debe permitir al menos:

- `80/tcp` desde `0.0.0.0/0`
- `8120/tcp` desde `0.0.0.0/0` si se desea mantener acceso alterno por ese puerto
- `22/tcp` preferiblemente solo desde la IP de administración

Si `curl http://127.0.0.1/cms/login` responde en la instancia pero el navegador externo da
timeout, el problema está en reglas de red de AWS y no en la aplicación.

---

## Servicios Externos Requeridos

### Actuales (Mock)

Todos los servicios externos están implementados como mocks. Para producción real
se deben reemplazar las implementaciones:

| Servicio               | Interfaz                     | Mock actual                     |
|------------------------|------------------------------|---------------------------------|
| Email / OTP            | `OtpService`                 | `MockOtpService` (código fijo)  |
| Facturación ISP        | `BillingGateway`             | `MockBillingGateway`            |
| CRM                    | `CrmGateway`                 | `MockCrmGateway`                |
| Hash de contraseñas    | `HashService`                | `BcryptHashService` (real)      |
| Tokens JWT             | `TokenService`               | `JwtTokenService` (real)        |

### Para Producción Completa

- **PostgreSQL**: Reemplazar repositorios in-memory por TypeORM/Prisma
- **Redis**: Almacenamiento de sesiones y caché de tokens
- **Proveedor SMTP**: AWS SES, SendGrid o similar para envío real de OTP
- **CDN de Video**: Integración con proveedor de streaming real
- **Pasarela de Pagos**: Para gestión de suscripciones OTT-only

---

## URLs de Acceso

| Servicio          | URL                                       |
|-------------------|-------------------------------------------|
| App OTT           | `http://<HOST>/`                          |
| Login cliente OTT | `http://<HOST>/login`                     |
| CMS Login         | `http://<HOST>/cms/login`                 |
| App OTT alterna   | `http://<HOST>:8120/`                     |
| CMS Login alterno | `http://<HOST>:8120/cms/login`            |
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
