# Guía de Contribución — LUKI Play OTT

## Convenciones de Commits

Este proyecto usa [Conventional Commits](https://www.conventionalcommits.org/es/).

### Formato

```
<tipo>(<alcance>): <descripción corta>

[cuerpo opcional]

[notas de pie opcionales]
```

### Tipos Permitidos

| Tipo       | Descripción                                          | Ejemplo                                       |
|------------|------------------------------------------------------|-----------------------------------------------|
| `feat`     | Nueva funcionalidad                                  | `feat(auth): add QR login flow`               |
| `fix`      | Corrección de error                                  | `fix(player): handle HLS timeout on slow net` |
| `docs`     | Cambios en documentación                             | `docs: update DEPLOYMENT.md for nginx`        |
| `refactor` | Cambio de código sin fix ni feature                  | `refactor(billing): extract gateway interface`|
| `test`     | Agregar o corregir tests                             | `test(auth): add login-app use-case specs`    |
| `chore`    | Mantenimiento, CI, dependencias                      | `chore: update NestJS to v11.1`               |
| `ui`       | Cambios visuales o de interfaz                       | `ui(cms): add dark mode to sidebar`           |
| `stream`   | Funcionalidad de streaming/player                    | `stream(player): add quality selector`        |
| `content`  | Cambios en catálogo o contenido                      | `content: add new demo channels`              |
| `auth`     | Cambios específicos de autenticación                 | `auth: implement token blacklist`             |

### Alcances Comunes

| Alcance        | Área                                    |
|----------------|-----------------------------------------|
| `auth`         | Módulo de autenticación                 |
| `admin`        | Panel de administración                 |
| `cms`          | Panel CMS                               |
| `player`       | Reproductor de video                    |
| `billing`      | Facturación e ISP                       |
| `crm`          | CRM e información de clientes          |
| `profiles`     | Perfiles de usuario                     |
| `componentes`  | Módulo de componentes OTT               |
| `api`          | Endpoints REST generales                |
| `store`        | Stores Zustand (frontend)               |
| `deps`         | Dependencias                            |

### Ejemplos

```bash
# Feature
git commit -m "feat(componentes): add reorder endpoint"

# Fix
git commit -m "fix(config): use window.location.host for API URL"

# Docs
git commit -m "docs: add ARCHITECTURE.md with module diagrams"

# Refactor
git commit -m "refactor(auth): extract OTP logic to separate service"
```

---

## Flujo de Trabajo

### Ramas

| Rama         | Propósito                           |
|--------------|-------------------------------------|
| `main`       | Código estable / producción         |
| `develop`    | Integración de features en curso    |
| `feat/*`     | Nuevas funcionalidades              |
| `fix/*`      | Correcciones de errores             |
| `docs/*`     | Cambios de documentación            |

### Proceso

1. Crear rama desde `develop`: `git checkout -b feat/nombre-feature`
2. Desarrollar con commits convencionales
3. Asegurarse de que los tests pasen: `npm test`
4. Crear Pull Request hacia `develop`
5. Revisión de código por al menos un compañero
6. Merge con squash o merge commit

---

## Estándares de Código

### Backend (TypeScript / NestJS)

- **Nombrado**: camelCase para variables/funciones, PascalCase para clases/interfaces/enums
- **Archivos**: kebab-case con sufijo de tipo (`.controller.ts`, `.service.ts`, `.use-case.ts`)
- **Imports**: Usar index.ts (barrel exports) en cada carpeta de módulo
- **Inyección de dependencias**: Siempre via interfaces con tokens de inyección (`@Inject(TOKEN)`)
- **Validación**: Usar class-validator decorators en DTOs
- **Swagger**: Documentar todos los endpoints con `@ApiOperation`, `@ApiResponse`

### Frontend (TypeScript / Expo)

- **Nombrado**: PascalCase para componentes, camelCase para funciones/variables
- **Archivos**: PascalCase para componentes (`.tsx`), camelCase para stores (`.ts`)
- **Estilos**: NativeWind (Tailwind CSS classes) — evitar StyleSheet.create cuando sea posible
- **Estado**: Zustand stores — un store por dominio (auth, content, admin)
- **Rutas**: File-based routing via Expo Router — la estructura de carpetas ES la estructura de rutas

### General

- **Idioma del código**: Inglés (nombres de variables, funciones, clases)
- **Idioma de documentación**: Archivos `.md` en español, JSDoc/comentarios inline en inglés
- **Formato**: Prettier con configuración por defecto del proyecto
- **Lint**: ESLint con configuración TypeScript

---

## Tests

### Backend

```bash
cd backend
npm test            # Tests unitarios
npm run test:cov    # Cobertura
npm run test:e2e    # Tests E2E
```

### Frontend

```bash
cd frontend
npm test
```

---

## Variables de Entorno

Al agregar una nueva variable de entorno:

1. Añadirla en `backend/.env.example` con valor de referencia
2. Documentarla en `docs/DEPLOYMENT.md`
3. Añadirla en `docker-compose.yml` si aplica
4. Usar `ConfigService` de NestJS para accederla (no `process.env` directo)
