# =============================================================================
# LUKI Play OTT — Makefile
# =============================================================================
# Atajos para tareas comunes de desarrollo, build y despliegue.
#
# Uso:
#   make setup      — Configura el entorno de desarrollo
#   make run        — Inicia backend y frontend en modo desarrollo
#   make build      — Compila backend y exporta frontend web
#   make test       — Ejecuta tests del backend
#   make clean      — Limpia dependencias y artefactos de build
# =============================================================================

.PHONY: setup run run-backend run-frontend build build-backend build-frontend \
        test test-backend lint clean help

# Default target
help:
	@echo ""
	@echo "  LUKI Play OTT — Comandos disponibles"
	@echo "  ====================================="
	@echo ""
	@echo "  make setup          Configura entorno de desarrollo (instala deps, copia .env)"
	@echo "  make run            Inicia backend (dev) — frontend debe iniciarse aparte"
	@echo "  make run-backend    Inicia solo el backend en modo desarrollo"
	@echo "  make run-frontend   Inicia solo el frontend en modo desarrollo"
	@echo "  make build          Compila backend y exporta frontend web"
	@echo "  make build-backend  Compila solo el backend"
	@echo "  make build-frontend Exporta solo el frontend web"
	@echo "  make test           Ejecuta tests del backend"
	@echo "  make test-backend   Ejecuta tests unitarios del backend"
	@echo "  make lint           Ejecuta linter del backend"
	@echo "  make clean          Elimina node_modules y artefactos de build"
	@echo "  make help           Muestra esta ayuda"
	@echo ""

# ---------------------------------------------------------------------------
# Setup
# ---------------------------------------------------------------------------
setup:
	@bash scripts/setup.sh

# ---------------------------------------------------------------------------
# Run (Development)
# ---------------------------------------------------------------------------
run: run-backend

run-backend:
	cd backend && npm run start:dev

run-frontend:
	cd frontend && npx expo start --web

# ---------------------------------------------------------------------------
# Build (Production)
# ---------------------------------------------------------------------------
build: build-backend build-frontend

build-backend:
	cd backend && npm run build

build-frontend:
	cd frontend && npx expo export --platform web

# ---------------------------------------------------------------------------
# Test
# ---------------------------------------------------------------------------
test: test-backend

test-backend:
	cd backend && npm test

# ---------------------------------------------------------------------------
# Lint
# ---------------------------------------------------------------------------
lint:
	cd backend && npm run lint

# ---------------------------------------------------------------------------
# Clean
# ---------------------------------------------------------------------------
clean:
	rm -rf backend/node_modules backend/dist
	rm -rf frontend/node_modules frontend/dist frontend/web-build frontend/.expo
	@echo "Limpieza completada."
