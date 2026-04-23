#!/bin/bash
echo "========================================================"
echo "🚀 Levantando ecosistema de Luki Play OTT y CMS"
echo "========================================================"

# 1. Asegurar que los servicios de Docker (Backend, DB, Redis) estén activos
echo "📦 1/2 Iniciando backend y bases de datos (Postgres, Redis)..."
docker compose up -d

# 2. Levantar el frontend (que contiene el Player y el panel CMS)
echo "🌐 2/2 Levantando la interfaz web (Player y CMS)..."
echo "👉 El Player estará en: http://localhost:8081"
echo "👉 El CMS estará en: http://localhost:8081/cms"
echo ""

cd frontend && npx expo start --web
