# Changelog — LUKI Play OTT

Todos los cambios notables del proyecto se documentan en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/)
y este proyecto sigue [Versionado Semántico](https://semver.org/lang/es/).

---

## [0.3.0-alpha] — 2026-04-13

### Añadido

#### Luki Play Player (React Native / Expo)

##### 🎬 LivePlayerScreen — Player completo de TV en vivo (inspirado en Zapping)
- **Video HLS fullscreen** con `expo-video` — reproducción de streams M3U8 en tiempo real.
- **Controls auto-hide**: controles desaparecen tras 4 segundos de inactividad; reaparecen con un tap.
- **Top bar**: menú lateral, Chromecast, AirPlay, candado de pantalla (lock/unlock), grid de canales, configuración.
- **Bottom info bar**: botón favorito ♥, logo + nombre del canal, nombre del programa en curso, indicador LIVE rojo, botón PiP.
- **Progress bar roja (LIVE)**: muestra hora de inicio, posición actual (punto rojo animado) y hora de fin del programa en curso.
- **Botón retroceso 10s** y acceso rápido a lista de canales.

##### 📺 Channel List Overlay (estilo carril lateral Zapping)
- Carril vertical izquierdo con lista scrolleable: número de canal, logo emoji, nombre.
- Canal activo resaltado con borde dorado.
- Panel central: thumbnail del programa con badge **AHORA** y botón ▶.
- Panel derecho: título, horario y descripción del programa activo.
- Cierre por botón ✕ o tap en área oscura.

##### 🔢 Channel Dial — Teclado numérico
- Grid 3×4 (1-9, ✕, 0, →) semitransparente sobre el lado derecho del video.
- Toast con el número tecleado visible sobre el centro del video.
- Navegación directa: digitar número + → para saltar al canal correspondiente.

##### ℹ️ Now Playing Panel
- Tarjeta flotante **"ESTÁS VIENDO"** (etiqueta dorada) con título del programa, horario y thumbnail del canal.
- Toggle de visibilidad desde botón FAB.

##### ♥ Favoritos
- Toggle de favorito por canal, persistente en sesión.
- Fila de favoritos visible en la HomeScreen.

##### 📊 Data layer — `src/data/channels.ts`
- 10 canales predefinidos del ecosistema ecuatoriano (Gamavisión, TC, TVC, Ecuador TV, Teleamazonas, etc.)
- EPG simulado con programación horaria por canal.
- `getCurrentProgram()` — detecta automáticamente el programa en curso según la hora del dispositivo.
- `getProgressPercent()` — calcula el porcentaje de avance de la transmisión para la barra LIVE.

##### 🏠 HomeScreen — Rediseño premium
- Hero banner **TV en Vivo** con badge pulsante EN VIVO (rojo), subtítulo y CTAs.
- Grid horizontal de canales con thumbnails, badge LIVE rojo y programa actual.
- Fila **Mis Favoritos** con logo + nombre + programa en curso.
- Fila **Tendencias** (placeholder listo para contenido VOD).
- Header con logo **LUKI PLAY** y accesos rápidos (búsqueda, notificaciones).
- Integración directa con `LivePlayerScreen`: tap en canal → abre el player.

### Repositorio
- **Luki-Play-Player** (rama `main`): commits `5b67c57` y `fb5e7ea`
- **Luki-Play-OTT** (rama `Luki-Play-Reproductor`): documentación actualizada en CHANGELOG.

---

## [0.2.0-alpha] — 2026-04-13

### Añadido

#### Backend
- **persistence**: Nuevo repositorio `SqliteUserRepository` — los usuarios se almacenan en `backend/data/lukiplay.db` (SQLite WAL) y persisten ante cualquier reinicio del proceso o del servidor.
- **admin/users**: Campo `password` opcional en `CreateUserDto` — permite asignar contraseña al momento de crear un usuario desde el CMS; si se omite se genera una aleatoria.
- **admin/users**: Nuevo endpoint `POST /admin/users/:id/generate-password` que genera y envía contraseña temporal por correo.

#### CMS (Next.js — localhost:3001)
- **users/page.tsx**: Página completa de gestión de usuarios con tarjetas de estadísticas, filtros por tipo y estado, tabla con acciones, y modal de creación/edición.
- **users/page.tsx**: Sección **🔑 Contraseña de acceso** disponible tanto al crear como al editar un usuario: generación automática segura, campo manual con toggle de visibilidad, botón de copiar y envío por email.
- **users/page.tsx**: Botón **+ Crear usuario** que permite registrar nuevos abonados con correo electrónico y contraseña asignada desde el panel administrativo.

#### Infraestructura
- **cms/next.config.ts**: Corregido proxy hacia el backend — apuntaba al puerto incorrecto `3000` en lugar de `8100`, causando que todas las operaciones del CMS cayeran silenciosamente al mock local.
- **.gitignore**: Archivos de base de datos SQLite (`*.db`, `*.db-shm`, `*.db-wal`) excluidos del repositorio.

### Corregido
- **cms/next.config.ts**: El proxy `BACKEND_URL` estaba configurado en `localhost:3000` en desarrollo en lugar de `localhost:8100`, lo que impedía que cualquier operación del CMS (crear, editar, listar usuarios) llegara al backend real.
- **CMS → mock fallback silencioso**: Al corregir el puerto, se eliminó el comportamiento donde los datos aparecían en pantalla pero desaparecían al recargar (datos vivían solo en React state).

### Flujo habilitado — Creación de abonados desde el CMS
```
Admin CMS → "+ Crear usuario" → llena email + genera contraseña          
         → POST /admin/users (backend NestJS port 8100)                  
         → Usuario guardado en SQLite (data/lukiplay.db) ✅              
         → Abonado abre Luki Play → ingresa email + contraseña           
         → POST /auth/app/login → acceso concedido ✅                    
```

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
