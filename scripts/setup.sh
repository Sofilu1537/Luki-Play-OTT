#!/usr/bin/env bash
# =============================================================================
# LUKI Play OTT — Setup Script
# =============================================================================
# Configura el entorno de desarrollo local.
#
# Uso:
#   bash scripts/setup.sh
#
# Prerequisitos:
#   - Node.js 20 LTS
#   - npm 10+
#   - Git
# =============================================================================

set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info()  { echo -e "${GREEN}[INFO]${NC}  $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# ---------------------------------------------------------------------------
# 1. Runtime checks
# ---------------------------------------------------------------------------
log_info "Verificando requisitos del sistema..."

if ! command -v node >/dev/null 2>&1; then
  log_error "Node.js no encontrado. Instálalo desde https://nodejs.org/ (v20 LTS)"
  exit 1
fi

NODE_VERSION=$(node -v | sed 's/v//')
NODE_MAJOR=$(echo "$NODE_VERSION" | cut -d. -f1)
if [[ "$NODE_MAJOR" -lt 20 ]]; then
  log_error "Node.js $NODE_VERSION detectado. Se requiere v20 o superior."
  exit 1
fi
log_info "Node.js $NODE_VERSION ✓"

if ! command -v npm >/dev/null 2>&1; then
  log_error "npm no encontrado."
  exit 1
fi
NPM_VERSION=$(npm -v)
log_info "npm $NPM_VERSION ✓"

if ! command -v git >/dev/null 2>&1; then
  log_warn "Git no encontrado. No es obligatorio para desarrollo local, pero sí para control de versiones."
fi

# ---------------------------------------------------------------------------
# 2. Determine project root
# ---------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

log_info "Directorio del proyecto: $PROJECT_ROOT"

# ---------------------------------------------------------------------------
# 3. Backend setup
# ---------------------------------------------------------------------------
log_info ""
log_info "=== Configurando Backend ==="

BACKEND_DIR="$PROJECT_ROOT/backend"

if [[ ! -d "$BACKEND_DIR" ]]; then
  log_error "Carpeta backend/ no encontrada en $PROJECT_ROOT"
  exit 1
fi

cd "$BACKEND_DIR"

# Copy .env.example if .env does not exist
if [[ ! -f ".env" ]]; then
  if [[ -f ".env.example" ]]; then
    cp .env.example .env
    log_info "Creado .env a partir de .env.example"
  else
    log_warn ".env.example no encontrado. Deberás crear .env manualmente."
  fi
else
  log_info ".env ya existe, no se sobreescribe"
fi

log_info "Instalando dependencias del backend..."
npm install

log_info "Compilando backend..."
npm run build

log_info "Backend configurado ✓"

# ---------------------------------------------------------------------------
# 4. Frontend setup
# ---------------------------------------------------------------------------
log_info ""
log_info "=== Configurando Frontend ==="

FRONTEND_DIR="$PROJECT_ROOT/frontend"

if [[ ! -d "$FRONTEND_DIR" ]]; then
  log_error "Carpeta frontend/ no encontrada en $PROJECT_ROOT"
  exit 1
fi

cd "$FRONTEND_DIR"

log_info "Instalando dependencias del frontend..."
npm install

log_info "Frontend configurado ✓"

# ---------------------------------------------------------------------------
# 5. Summary
# ---------------------------------------------------------------------------
log_info ""
log_info "============================================"
log_info "  LUKI Play OTT — Configuración completada"
log_info "============================================"
log_info ""
log_info "Para iniciar el backend:"
log_info "  cd backend && npm run start:dev"
log_info ""
log_info "Para iniciar el frontend:"
log_info "  cd frontend && npx expo start --web"
log_info ""
log_info "Credenciales de prueba:"
log_info "  App:  CONTRACT-001 / password123 / OTP: 123456"
log_info "  CMS:  admin@lukiplay.com / password123"
log_info ""
log_info "Swagger: http://localhost:3000/api/docs"
