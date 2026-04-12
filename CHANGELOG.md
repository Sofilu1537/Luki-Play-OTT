# Changelog — LUKI Play OTT

Todos los cambios notables del proyecto se documentan en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/)
y este proyecto sigue [Versionado Semántico](https://semver.org/lang/es/).

---

## [0.1.0-alpha] — 2025-07

### Añadido

#### Backend
- **auth**: Login de dos fases para app (contraseña + OTP por correo) con JWT (access 15 min + refresh 7 días)
- **auth**: Login de una fase para CMS (email + contraseña)
- **auth**: Rotación de refresh token con detección de reutilización
- **auth**: Gestión de sesiones activas (listar, revocar individual, revocar todas)
- **auth**: Cambio de contraseña con revocación de sesiones
- **auth**: Solicitud y verificación de OTP independiente
- **auth**: Login QR (placeholder para futura implementación)
- **auth**: Decoradores `@CurrentUser()`, `@Roles()`, `@Permissions()`, `@RequireAudience()`
- **auth**: Guards JWT, roles, permisos y audiencia (APP vs CMS)
- **access-control**: Mapa de permisos por rol (SUPERADMIN, SOPORTE, CLIENTE)
- **billing**: Gateway de facturación (mock) con contratos y estados de servicio ISP
- **crm**: Gateway CRM (mock) con registros de clientes
- **profiles**: Entidad de perfil de usuario (esqueleto)
- **admin**: Módulo de administración CMS con gestión de usuarios, contratos y sesiones
- **admin**: Endpoint de componentes OTT (activar/desactivar/reordenar)
- **public**: Endpoint público de componentes activos (sin autenticación)
- **common**: Filtro global de excepciones HTTP con formato JSON
- **common**: Pipe de validación global (class-validator con whitelist y transform)
- Swagger en `/api/docs` con documentación completa de endpoints
- Rate limiting global (ThrottlerModule: 20 req/min)
- Variables de entorno via ConfigModule (.env)
- Repositorios in-memory con datos de prueba (seed)

#### Frontend
- **auth**: Pantalla de login (correo electrónico + contraseña, abandonando el número de contrato)
- **auth**: Pantalla de verificación OTP (6 dígitos)
- **app**: Pantalla principal con Hero banner y filas de contenido por género
- **app**: Pantalla de búsqueda (placeholder)
- **app**: Pantalla de favoritos (placeholder)
- **player**: Reproductor de video con soporte HLS (hls.js web / expo-av nativo)
- **admin**: Panel de administración de canales con CRUD completo
- **admin**: Login admin con contraseña hardcoded
- **cms**: Panel CMS con sidebar de navegación y módulos
- **cms**: Módulo de Componentes OTT (toggles de activación/desactivación)
- **components**: Button, Input, Hero, MediaRow reutilizables
- **components/cms**: CmsShell con sidebar de navegación
- **stores**: authStore (Zustand) — flujo de autenticación de dos fases
- **stores**: contentStore — catálogo con merge de canales admin
- **stores**: adminStore — CRUD de canales con persistencia via API
- **stores/api**: Funciones API para billing, CRM, componentes admin

#### Infraestructura
- Docker Compose con backend, PostgreSQL 16 y Redis 7
- Script de despliegue EC2 (deploy-ec2.sh) con PM2 + Nginx
- Dockerfile multi-stage (Node 20-slim)
- Configuración Nginx con proxy a backend

#### Documentación
- README.md con guía de instalación y credenciales de prueba
- ARCHITECTURE.md con diagramas y modelos de datos
- DEPLOYMENT.md con guía completa de despliegue
- CHANGELOG.md (este archivo)
- CONTRIBUTING.md con convenciones de commits
- .env.example con todas las variables de entorno
- .gitignore configurado para Node, Expo, IDE y OS

### Seguridad
- Contraseñas hasheadas con bcrypt (12 salt rounds)
- JWT con secretos separados para access y refresh tokens
- OTP de un solo uso con TTL de 5 minutos
- CORS habilitado
- Rate limiting contra fuerza bruta
- Validación de entrada con class-validator (whitelist + forbidNonWhitelisted)
- Segregación de audiencia (APP vs CMS) en tokens JWT

### Notas
- Los repositorios usan almacenamiento in-memory (datos se pierden al reiniciar)
- Los servicios de billing, CRM y OTP son mocks de desarrollo
- El OTP fijo en desarrollo es `123456`
- La persistencia real con PostgreSQL y Redis está configurada en Docker Compose pero no conectada aún

---

## Convenciones de Versionado

- **alpha**: Funcionalidad base implementada, sin persistencia real
- **beta**: Con base de datos y servicios externos conectados
- **rc**: Candidato a release, con tests completos
- **stable**: Release de producción

---

[0.1.0-alpha]: https://github.com/Sofilu1537/Luki-Play-OTT/releases/tag/v0.1.0-alpha
