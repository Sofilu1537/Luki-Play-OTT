# Guía de Despliegue — LUKI Play OTT

Cubre los dos ambientes soportados: **DEV** (desarrollo local) y **PRD** (producción en AWS EC2).
Leer la sección correspondiente al ambiente objetivo antes de ejecutar cualquier comando.

---

## Índice

1. [Comparación DEV vs PRD](#1-comparación-dev-vs-prd)
2. [Requisitos del sistema](#2-requisitos-del-sistema)
3. [DEV — Desarrollo local](#3-dev--desarrollo-local)
4. [PRD — Primer despliegue en EC2](#4-prd--primer-despliegue-en-ec2)
5. [PRD — Actualizaciones (deploys subsiguientes)](#5-prd--actualizaciones-deploys-subsiguientes)
6. [Variables de entorno](#6-variables-de-entorno)
7. [Base de datos y migraciones](#7-base-de-datos-y-migraciones)
8. [Seed — datos iniciales](#8-seed--datos-iniciales)
9. [Nginx — configuración](#9-nginx--configuración)
10. [Operación del servidor](#10-operación-del-servidor)
11. [Checklist de seguridad PRD](#11-checklist-de-seguridad-prd)
12. [URLs de acceso](#12-urls-de-acceso)
13. [Zona horaria](#13-zona-horaria)

---

## 1. Comparación DEV vs PRD

| Aspecto                | DEV                              | PRD                                      |
|------------------------|----------------------------------|------------------------------------------|
| Compose file           | `docker-compose.yml`             | `docker-compose.prod.yml`                |
| Runner backend         | `npm run start:dev` (hot reload) | PM2 + `npm run start:prod`               |
| Puerto backend         | 3000                             | 8100                                     |
| Puerto frontend        | Expo dev server (8081)           | Nginx estático → `/var/www/luki-play-ott`|
| Migración DB           | `prisma migrate dev`             | `prisma migrate deploy`                  |
| Seed                   | Siempre que se necesite          | **Solo en el PRIMER deploy**             |
| Instalar dependencias  | `npm install`                    | `npm ci`                                 |
| NODE\_ENV              | `development`                    | `production`                             |
| JWT secrets            | Valores hardcodeados dev         | `openssl rand -hex 32` por cada uno      |
| SMTP                   | Mailtrap (sandbox, sin envío)    | Titan Email real (`noreply@luki.ec`)     |
| Credenciales DB        | Hardcodeadas en docker-compose   | Variables desde `backend/.env`           |

---

## 2. Requisitos del sistema

### DEV

| Componente   | Versión mínima |
|--------------|----------------|
| Node.js      | 20 LTS         |
| npm          | 10+            |
| Git          | 2.x            |
| Docker Desktop | Cualquier versión reciente |

### PRD (servidor EC2)

| Componente   | Versión mínima     | Recomendado              |
|--------------|--------------------|--------------------------|
| OS           | Ubuntu 22.04+      | Debian 13 / Ubuntu 24.04 |
| Node.js      | 20 LTS             | 20.20+                   |
| npm          | 10+                | 10.8+                    |
| Git          | 2.x                | —                        |
| Docker       | 24+                | —                        |
| RAM          | 1 GB               | 2 GB+                    |
| Disco        | 5 GB libres        | 10 GB+                   |

| Servicio   | Puerto | Acceso           |
|------------|--------|------------------|
| PostgreSQL | 5432   | Solo localhost   |
| Redis      | 6379   | Solo localhost   |
| Backend    | 8100   | Solo localhost   |
| Nginx      | 80/443 | Público          |

---

## 3. DEV — Desarrollo local

### 3.1 Infraestructura

Docker Desktop debe estar corriendo antes de este paso.

```bash
# Levantar PostgreSQL + Redis
docker compose up -d postgres redis

# Verificar que postgres esté healthy
docker compose ps
```

### 3.2 Backend

```bash
cd backend
cp .env.example .env        # Editar las variables necesarias (ver sección 6)
npm install
npx prisma migrate dev      # ⚠️ Solo DEV — crea archivo SQL + aplica
npx prisma db seed          # Carga plan, usuarios CMS, categorías y suscriptores de prueba
npm run start:dev           # Hot reload — queda en http://localhost:3000
```

Swagger disponible en `http://localhost:3000/api/docs`.

### 3.3 Frontend

```bash
cd frontend
npm install
npx expo start --web        # App en http://localhost:8081
# Presionar 'a' para Android, 'i' para iOS, 'w' para web
```

### 3.4 SMTP en DEV (Mailtrap)

Para capturar OTPs y correos de activación sin enviar a destinatarios reales,
usar [Mailtrap](https://mailtrap.io) (cuenta gratuita):

```env
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_SECURE=false
SMTP_USER=<usuario_mailtrap>
SMTP_PASS=<password_mailtrap>
SMTP_FROM=noreply@lukiplay.com
```

Mailtrap → Email Testing → SMTP Settings → copiar credenciales.

### 3.5 Comandos útiles en DEV

```bash
# Crear una nueva migración tras cambiar schema.prisma
npx prisma migrate dev --name <nombre_descriptivo>

# Regenerar cliente Prisma sin crear migración
npx prisma generate

# Inspeccionar la base de datos
npx prisma studio                          # GUI en http://localhost:5555

# Tests
npm run test                               # Unit tests
npm run test:e2e                           # E2E
npx jest src/modules/auth/auth.spec.ts     # Archivo específico
```

---

## 4. PRD — Primer despliegue en EC2

Ejecutar esta sección **una sola vez** al provisionar el servidor.

### 4.1 Setup inicial del servidor

```bash
# Actualizar e instalar dependencias del sistema
sudo apt update && sudo apt install -y git curl nginx docker.io docker-compose-plugin

# Instalar Node 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar PM2 globalmente
sudo npm install -g pm2

# Dar permisos Docker al usuario actual
sudo usermod -aG docker $USER && newgrp docker

# Configurar zona horaria
sudo timedatectl set-timezone America/Guayaquil
```

### 4.2 Clonar el repositorio

```bash
git clone https://github.com/Sofilu1537/Luki-Play-OTT.git ~/Luki-Play-OTT
cd ~/Luki-Play-OTT
```

### 4.3 Configurar variables de entorno PRD

Copiar el archivo `.env` de producción al servidor (nunca commitear este archivo):

```bash
# Desde tu máquina local
scp backend/.env.prod ubuntu@<IP_EC2>:~/Luki-Play-OTT/backend/.env

# O crearlo directamente en el servidor (ver sección 6 para todas las variables)
nano ~/Luki-Play-OTT/backend/.env
```

### 4.4 Levantar infraestructura PRD

```bash
cd ~/Luki-Play-OTT
docker compose -f docker-compose.prod.yml --env-file backend/.env up -d

# Verificar que postgres esté healthy
docker compose -f docker-compose.prod.yml ps
```

> ⚠️ **Nunca usar `docker-compose.yml` (dev) en producción** — tiene credenciales
> hardcodeadas y `NODE_ENV=development`.

### 4.5 Backend — build y arranque

```bash
cd ~/Luki-Play-OTT/backend

npm ci                                              # ⚠️ ci, no install
npx prisma migrate deploy                           # ⚠️ deploy, no migrate dev
npx prisma db seed                                  # ⚠️ Solo esta primera vez
npm run build

PORT=8100 pm2 start npm --name luki-play-backend -- run start:prod
pm2 save                                            # Persiste la lista de procesos
pm2 startup                                         # Configura autostart en reboot
# Copiar y ejecutar el comando que pm2 startup imprima en pantalla
```

> ⚠️ **Después del seed:** cambiar las contraseñas de los usuarios CMS inmediatamente.
> El seed los crea con `password123`. Ver [sección 8](#8-seed--datos-iniciales).

### 4.6 Frontend — build y publicación

```bash
cd ~/Luki-Play-OTT/frontend

npm ci
npm run build:web                                   # Genera dist/

sudo mkdir -p /var/www/luki-play-ott
sudo cp -r dist/* /var/www/luki-play-ott/
```

### 4.7 Nginx

```bash
sudo cp ~/Luki-Play-OTT/deploy/nginx/luki-play-ott.conf /etc/nginx/sites-available/
sudo ln -sf /etc/nginx/sites-available/luki-play-ott.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

sudo nginx -t                                       # Verificar config
sudo systemctl reload nginx
```

### 4.8 Verificar el despliegue

```bash
# Health check del backend
curl http://localhost:8100/auth/health

# Estado PM2
pm2 status

# Logs del backend
pm2 logs luki-play-backend --lines 50
```

---

## 5. PRD — Actualizaciones (deploys subsiguientes)

Para cada nueva versión desplegada en el servidor:

### Opción A — Script automático

```bash
# Desde tu máquina local o desde el servidor
bash deploy-ec2.sh --branch main
```

### Opción B — Manual (cuando se necesita control paso a paso)

```bash
cd ~/Luki-Play-OTT
git pull origin main

# Backend
cd backend
npm ci
npx prisma migrate deploy         # Siempre antes de reiniciar PM2
npm run build
pm2 restart luki-play-backend --update-env

# Frontend
cd ../frontend
npm ci
npm run build:web
sudo rm -rf /var/www/luki-play-ott/*
sudo cp -r dist/* /var/www/luki-play-ott/
```

> ⚠️ **`prisma migrate deploy` va siempre antes de `pm2 restart`.**
> Si el deploy incluye cambios de schema y el backend arranca antes de migrar,
> las queries fallarán hasta que la migración se aplique.

> ⚠️ **No ejecutar `prisma db seed` en actualizaciones** — el seed usa `upsert`
> para algunos modelos pero crea duplicados en suscriptores. Solo ejecutarlo
> en el primer deploy.

---

## 6. Variables de entorno

### DEV (`backend/.env`)

```env
NODE_ENV=development
PORT=3000

DATABASE_URL=postgresql://lukiplay_admin:dev_password_2026@localhost:5432/lukiplay_dev
REDIS_URL=redis://localhost:6379

SUBSCRIBER_JWT_SECRET=dev-subscriber-jwt-secret-2026
ADMIN_JWT_SECRET=dev-admin-jwt-secret-2026
JWT_EXPIRATION=15m
REFRESH_TOKEN_EXPIRATION=7d

BCRYPT_SALT_ROUNDS=12
THROTTLE_TTL=60000
THROTTLE_LIMIT=20

# Mailtrap para desarrollo
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_SECURE=false
SMTP_USER=<usuario_mailtrap>
SMTP_PASS=<password_mailtrap>
SMTP_FROM=noreply@lukiplay.com

USE_MOCK_API=false
SYNC_CRON_SCHEDULE=0 */6 * * *
```

### PRD (`backend/.env` en el servidor EC2)

```env
NODE_ENV=production
PORT=8100                          # Diferente al dev

DATABASE_URL=postgresql://lukiplay_admin:<PASSWORD_FUERTE>@localhost:5432/lukiplay_prod
REDIS_URL=redis://localhost:6379

# Generar con: openssl rand -hex 32
SUBSCRIBER_JWT_SECRET=<secreto-aleatorio-32-bytes>
ADMIN_JWT_SECRET=<secreto-aleatorio-32-bytes-diferente>
JWT_EXPIRATION=15m
REFRESH_TOKEN_EXPIRATION=7d

BCRYPT_SALT_ROUNDS=12
THROTTLE_TTL=60000
THROTTLE_LIMIT=20

# SMTP real
SMTP_HOST=smtp.titan.email
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=noreply@luki.ec
SMTP_PASS=<clave_smtp_real>
SMTP_FROM=noreply@luki.ec

USE_MOCK_API=false
SYNC_CRON_SCHEDULE=0 */6 * * *
```

Generar los JWT secrets:

```bash
openssl rand -hex 32    # Ejecutar dos veces — uno para cada secret
```

---

## 7. Base de datos y migraciones

### Cuándo usar cada comando

| Comando                       | Cuándo usarlo                                        | Ambiente |
|-------------------------------|------------------------------------------------------|----------|
| `prisma migrate dev`          | Crear una nueva migración al cambiar `schema.prisma` | DEV únicamente |
| `prisma migrate deploy`       | Aplicar migraciones existentes al servidor           | PRD (y DEV si solo quieres aplicar) |
| `prisma migrate status`       | Ver qué migraciones están pendientes                 | DEV y PRD |
| `prisma generate`             | Regenerar el cliente Prisma sin crear migración      | DEV y PRD |
| `prisma db seed`              | Poblar la BD con datos iniciales                     | DEV siempre / PRD solo primer deploy |
| `prisma studio`               | Inspeccionar la BD en una GUI                        | DEV únicamente |

> ⚠️ **`migrate dev` nunca en producción** — genera archivos SQL en el repo y puede
> dejar la base de datos en estado inconsistente si se interrumpe.

### Migraciones pendientes en PRD

Si el servidor ya está desplegado con una versión anterior, las siguientes migraciones
deben aplicarse en el **próximo `prisma migrate deploy`**:

| Migración | Descripción |
|-----------|-------------|
| `20260502000000_enhance_devices` | Enum `DeviceType`, tabla `devices` mejorada con OS/browser/modelo, índice único por `(customerId, deviceFingerprint)` |
| `20260502010000_add_parental_control` | Columnas `parentalControlEnabled`, `parentalControlPin` en `customers` |
| `20260502020000_add_parental_control_level` | Columna `parentalControlLevel TEXT DEFAULT 'ALL'` en `customers` |

Estas migraciones son **no destructivas** (solo `ADD COLUMN` y `ALTER TABLE`) y se pueden
aplicar con el servidor en producción sin downtime.

### Verificar estado de migraciones

```bash
npx prisma migrate status
```

---

## 8. Seed — datos iniciales

El seed (`prisma/seed.ts`) crea en orden:

1. **Plan** — "LUKI PLAY" (`id: plan-lukiplay`)
2. **Usuarios CMS** — 3 usuarios con contraseña `password123`
3. **Categorías** — 6 categorías por defecto (Noticias, Deportes, Infantil, General, Cine, Música)
4. **Componentes OTT** — 10 componentes (VOD, Destacados, Live, Series, Radio, PPV, Kids, Deportes, Música, Noticias)
5. **Suscriptores** — ~47 registros del ISP con contratos y **cédulas de identidad reales** (`idNumber`)

> **Nota importante sobre cédulas:** desde el commit `12312c1`, el seed carga las cédulas reales de los suscriptores en el campo `Customer.idNumber`. Este campo es el identificador principal para login en la app (`POST /auth/app/id-login`). Sin este dato los suscriptores no pueden iniciar sesión.

### Usuarios CMS creados por el seed

| Email                  | Contraseña  | Rol        |
|------------------------|-------------|------------|
| admin@lukiplay.com     | password123 | SUPERADMIN |
| gestion@lukiplay.com   | password123 | ADMIN      |
| soporte@lukiplay.com   | password123 | SOPORTE    |

> ⚠️ **En producción, cambiar estas contraseñas inmediatamente después del seed.**
> Hacerlo desde `http://<HOST>/cms/login` → Perfil → Cambiar contraseña.

### Idempotencia del seed

Los modelos Plan, CmsRole, Customer y Category usan `upsert` — se pueden re-ejecutar
sin duplicar datos en esos modelos. Los **suscriptores** verifican si el contrato
ya existe antes de crear, pero **no actualizar datos existentes**. Por eso el seed
no debe ejecutarse en actualizaciones PRD.

---

## 9. Nginx — configuración

El archivo de configuración está en `deploy/nginx/luki-play-ott.conf`.
Rutas expuestas:

| Ruta          | Destino                         | Descripción                              |
|---------------|---------------------------------|------------------------------------------|
| `/auth/`      | `http://localhost:8100/auth/`   | Autenticación JWT + refresh              |
| `/admin/`     | `http://localhost:8100/admin/`  | CMS endpoints (requiere JWT)             |
| `/public/`    | `http://localhost:8100/public/` | API suscriptores (mix auth/sin auth)     |
| `/api/`       | `http://localhost:8100/api/`    | Swagger y endpoints generales            |
| `/favorites/` | `http://localhost:8100/api/favorites/` | Favoritos de canales (requiere JWT) |
| `/uploads/`   | `backend/uploads/` (alias)      | Logos y assets estáticos (caché 30d)     |
| `/`           | `/var/www/luki-play-ott`        | Frontend estático (SPA fallback)         |

Para habilitar HTTPS con Certbot:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d <tu_dominio>
```

---

## 10. Operación del servidor

### Comandos PM2

```bash
pm2 status                                    # Estado de todos los procesos
pm2 logs luki-play-backend                    # Logs en tiempo real
pm2 logs luki-play-backend --lines 100        # Últimas 100 líneas
pm2 restart luki-play-backend                 # Reinicio simple
pm2 restart luki-play-backend --update-env    # Reinicio + recarga de variables .env
pm2 stop luki-play-backend                    # Detener sin eliminar el proceso
pm2 delete luki-play-backend                  # Eliminar proceso de PM2
```

### Comandos Docker (infraestructura PRD)

```bash
# Estado de contenedores
docker compose -f docker-compose.prod.yml ps

# Logs de PostgreSQL
docker compose -f docker-compose.prod.yml logs postgres

# Reiniciar solo Redis
docker compose -f docker-compose.prod.yml restart redis

# Detener toda la infraestructura (no borra datos — volúmenes persisten)
docker compose -f docker-compose.prod.yml down
```

### Verificación post-deploy

```bash
curl http://localhost:8100/auth/health         # Health check backend
pm2 status                                     # Estado PM2
docker compose -f docker-compose.prod.yml ps   # Estado DB + Redis
sudo nginx -t                                  # Validar config Nginx
```

---

## 11. Checklist de seguridad PRD

Completar antes de exponer el servidor públicamente:

- [ ] `backend/.env` no está commiteado (verificar en `.gitignore`)
- [ ] `SUBSCRIBER_JWT_SECRET` generado con `openssl rand -hex 32`
- [ ] `ADMIN_JWT_SECRET` generado con `openssl rand -hex 32` (valor diferente al anterior)
- [ ] Contraseña de PostgreSQL mínimo 20 caracteres, única para este servidor
- [ ] EC2 Security Group: solo puertos **80**, **443** y **22** (SSH desde IP fija) abiertos públicamente
- [ ] Puertos **8100**, **5432**, **6379** accesibles solo desde `localhost` (no en Security Group)
- [ ] SMTP password real configurado para `noreply@luki.ec`
- [ ] Contraseñas CMS cambiadas después del seed (`password123` es temporal)
- [ ] HTTPS configurado con Certbot si se usa dominio
- [ ] `pm2 startup` ejecutado para autostart en reboot del servidor

---

## 12. URLs de acceso

### DEV

| Servicio       | URL                                   |
|----------------|---------------------------------------|
| App login      | http://localhost:8081/login           |
| CMS login      | http://localhost:8081/cms/login       |
| Swagger        | http://localhost:3000/api/docs        |
| Backend        | http://localhost:3000                 |
| Prisma Studio  | http://localhost:5555                 |

### PRD

| Servicio       | URL                                   |
|----------------|---------------------------------------|
| App            | http://\<IP\_EC2\>                    |
| App login      | http://\<IP\_EC2\>/login              |
| CMS login      | http://\<IP\_EC2\>/cms/login          |
| Backend health | http://\<IP\_EC2\>/auth/health        |

Reemplazar `<IP_EC2>` con la IP pública o dominio del servidor.

---

## 13. Zona horaria

El sistema opera en **America/Guayaquil (UTC-5)**.
Configurar en el servidor:

```bash
sudo timedatectl set-timezone America/Guayaquil
timedatectl status    # Verificar
```
