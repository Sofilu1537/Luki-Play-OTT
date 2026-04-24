#!/usr/bin/env bash
set -euo pipefail

# Deploy script for EC2 Debian instance.
# Usage:
#   bash deploy-ec2.sh [--branch BRANCH]

REPO_URL="${REPO_URL:-https://github.com/Sofilu1537/Luki-Play-OTT.git}"
APP_DIR="${APP_DIR:-$HOME/Luki-Play-OTT}"
STATIC_DIR="${STATIC_DIR:-/var/www/luki-play-ott}"
BACKEND_PORT="${BACKEND_PORT:-3000}"
BRANCH="${DEPLOY_BRANCH:-main}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --branch) BRANCH="$2"; shift 2 ;;
    --repo-url) REPO_URL="$2"; shift 2 ;;
    --app-dir) APP_DIR="$2"; shift 2 ;;
    *) echo "Unknown argument: $1" >&2; exit 1 ;;
  esac
done

FRONTEND_DIR="$APP_DIR/frontend"
BACKEND_DIR="$APP_DIR/backend"

# ── 1. System packages ────────────────────────────────────────────────────────
export DEBIAN_FRONTEND=noninteractive
sudo apt-get update -qq
sudo apt-get install -y -qq git curl nginx postgresql postgresql-contrib redis-server

# ── 2. Node 20 ───────────────────────────────────────────────────────────────
if ! node --version 2>/dev/null | grep -q '^v20'; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y -qq nodejs
fi

# ── 3. PM2 ───────────────────────────────────────────────────────────────────
if ! command -v pm2 >/dev/null 2>&1; then
  sudo npm install -g pm2 --quiet
fi

# ── 4. PostgreSQL setup ───────────────────────────────────────────────────────
sudo systemctl enable postgresql --quiet
sudo systemctl start postgresql

DB_NAME="lukiplay_prd"
DB_USER="lukiplay_admin"
DB_PASS="lukiplay_$(openssl rand -hex 8)"

# Create user and DB only if they don't exist
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASS}';"

sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};"

# If user already exists, update the password so .env stays in sync
sudo -u postgres psql -c "ALTER USER ${DB_USER} WITH PASSWORD '${DB_PASS}';" 2>/dev/null || true

DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}"

# ── 5. Redis ──────────────────────────────────────────────────────────────────
sudo systemctl enable redis-server --quiet
sudo systemctl start redis-server

# ── 6. Clone / update repo ────────────────────────────────────────────────────
if [[ -d "$APP_DIR/.git" ]]; then
  cd "$APP_DIR"
  git fetch --all --prune
  git checkout -B "$BRANCH" "origin/$BRANCH"
else
  mkdir -p "$(dirname "$APP_DIR")"
  git clone --branch "$BRANCH" --single-branch "$REPO_URL" "$APP_DIR"
fi

# ── 7. Backend .env ───────────────────────────────────────────────────────────
JWT_SECRET="$(openssl rand -hex 32)"
REFRESH_SECRET="$(openssl rand -hex 32)"

cat > "$BACKEND_DIR/.env" <<EOF
PORT=${BACKEND_PORT}
NODE_ENV=production
DATABASE_URL=${DATABASE_URL}
REDIS_URL=redis://localhost:6379
SUBSCRIBER_JWT_SECRET=${JWT_SECRET}
ADMIN_JWT_SECRET=${REFRESH_SECRET}
JWT_EXPIRATION=15m
REFRESH_TOKEN_EXPIRATION=7d
BCRYPT_SALT_ROUNDS=12
USE_MOCK_API=false
THROTTLE_TTL=60000
THROTTLE_LIMIT=100
SMTP_HOST=smtp.titan.email
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=noreply@luki.ec
SMTP_PASS=
SMTP_FROM=noreply@luki.ec
EOF

echo ".env written to $BACKEND_DIR/.env"

# ── 8. Backend build ──────────────────────────────────────────────────────────
cd "$BACKEND_DIR"
npm install --legacy-peer-deps
npx prisma generate
DATABASE_URL="${DATABASE_URL}" npx prisma db push --accept-data-loss
DATABASE_URL="${DATABASE_URL}" npx prisma db seed 2>/dev/null || echo "Seed skipped"
npm run build

# ── 9. PM2 ────────────────────────────────────────────────────────────────────
if pm2 describe luki-backend >/dev/null 2>&1; then
  pm2 restart luki-backend --update-env
else
  pm2 start npm --name luki-backend -- run start:prod
fi
pm2 save
sudo env PATH="$PATH:/usr/bin" pm2 startup systemd -u admin --hp /home/admin 2>/dev/null || true

# ── 10. Frontend build ────────────────────────────────────────────────────────
cd "$FRONTEND_DIR"
npm install --legacy-peer-deps
npm run build:web

FRONTEND_BUILD_DIR="$FRONTEND_DIR/dist"
[[ -d "$FRONTEND_BUILD_DIR" ]] || FRONTEND_BUILD_DIR="$FRONTEND_DIR/web-build"

if [[ ! -d "$FRONTEND_BUILD_DIR" ]]; then
  echo "ERROR: Frontend build output not found." >&2
  exit 1
fi

sudo mkdir -p "$STATIC_DIR"
sudo rm -rf "${STATIC_DIR:?}"/*
sudo cp -r "$FRONTEND_BUILD_DIR"/. "$STATIC_DIR/"

# ── 11. Nginx ─────────────────────────────────────────────────────────────────
sudo tee /etc/nginx/sites-available/luki-play.conf > /dev/null <<NGINX
server {
  listen 80 default_server;
  server_name _;

  root ${STATIC_DIR};
  index index.html;

  # Uploads (logos, etc.)
  location /uploads/ {
    alias ${BACKEND_DIR}/uploads/;
    expires 30d;
    add_header Cache-Control "public";
  }

  # Backend API routes
  location ~ ^/(auth|admin|public|api)/ {
    proxy_pass http://127.0.0.1:${BACKEND_PORT};
    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header Authorization \$http_authorization;
    proxy_read_timeout 60s;
  }

  # SPA fallback
  location / {
    try_files \$uri \$uri.html \$uri/ /index.html;
  }

  location ~ /\.(?!well-known).* {
    deny all;
  }
}
NGINX

sudo ln -fs /etc/nginx/sites-available/luki-play.conf /etc/nginx/sites-enabled/luki-play.conf
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl enable nginx --quiet
sudo systemctl reload nginx

PUBLIC_IP="$(curl -fsS --max-time 3 ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')"

echo ""
echo "══════════════════════════════════════════"
echo " Deployment complete — branch: ${BRANCH}"
echo "══════════════════════════════════════════"
echo " App:        http://${PUBLIC_IP}"
echo " CMS login:  http://${PUBLIC_IP}/cms/login"
echo " API health: http://${PUBLIC_IP}/auth/health"
echo "══════════════════════════════════════════"
