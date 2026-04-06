#!/usr/bin/env bash
set -euo pipefail

# Deploy script for EC2 Debian instance.
# Usage:
#   bash deploy-ec2.sh [--branch BRANCH] [--repo-url URL] [--app-dir DIR]
#
# Modes:
#   - default: clone/update the repo from origin
#   - snapshot: set SKIP_GIT_SYNC=1 to deploy files already present in APP_DIR

usage() {
  cat <<'EOF'
Usage:
  bash deploy-ec2.sh [--branch BRANCH] [--repo-url URL] [--app-dir DIR]

Environment:
  SKIP_GIT_SYNC=1     Deploy current files in APP_DIR without git clone/fetch/pull.
  DEPLOY_BRANCH=name  Branch to deploy when git sync is enabled.
  BACKEND_PORT=8100   Backend listen port.
  NGINX_PORT=8120     Public nginx port.
EOF
}

REPO_URL="${REPO_URL:-https://github.com/Sofilu1537/Luki-Play-OTT.git}"
APP_DIR="${APP_DIR:-$HOME/Luki-Play-OTT}"
STATIC_DIR="${STATIC_DIR:-/var/www/luki-play-ott}"
BACKEND_PORT="${BACKEND_PORT:-8100}"
NGINX_PORT="${NGINX_PORT:-8120}"
BRANCH="${DEPLOY_BRANCH:-}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --branch)
      BRANCH="$2"
      shift 2
      ;;
    --repo-url)
      REPO_URL="$2"
      shift 2
      ;;
    --app-dir)
      APP_DIR="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      exit 1
      ;;
  esac
done

FRONTEND_DIR="$APP_DIR/frontend"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_BUILD_DIR="$FRONTEND_DIR/dist"

sudo apt update
sudo apt install -y git curl nginx

# Install Node 20
if ! command -v node >/dev/null 2>&1 || [[ "$(node -v)" != v20* ]]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt install -y nodejs
fi

if ! command -v pm2 >/dev/null 2>&1; then
  sudo npm install -g pm2
fi

# Clone or update repo when requested. Skip this entirely for local snapshot uploads.
if [[ "${SKIP_GIT_SYNC:-0}" != "1" ]]; then
  if [[ -d "$APP_DIR/.git" ]]; then
    cd "$APP_DIR"
    git fetch --all --prune

    if [[ -n "$BRANCH" ]]; then
      if ! git show-ref --verify --quiet "refs/remotes/origin/$BRANCH"; then
        echo "Remote branch origin/$BRANCH not found." >&2
        exit 1
      fi

      git checkout -B "$BRANCH" "origin/$BRANCH"
    else
      CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
      git checkout "$CURRENT_BRANCH"
      git pull --rebase origin "$CURRENT_BRANCH"
      BRANCH="$CURRENT_BRANCH"
    fi
  else
    mkdir -p "$(dirname "$APP_DIR")"

    if [[ -n "$BRANCH" ]]; then
      git clone --branch "$BRANCH" --single-branch "$REPO_URL" "$APP_DIR"
    else
      git clone "$REPO_URL" "$APP_DIR"
      BRANCH="$(git -C "$APP_DIR" rev-parse --abbrev-ref HEAD)"
    fi
  fi
elif [[ ! -f "$BACKEND_DIR/package.json" || ! -f "$FRONTEND_DIR/package.json" ]]; then
  echo "APP_DIR does not contain backend/frontend sources: $APP_DIR" >&2
  exit 1
fi

# Backend build
cd "$BACKEND_DIR"
npm install
npm run build

# Start backend via PM2
if pm2 describe luki-play-backend >/dev/null 2>&1; then
  PORT="$BACKEND_PORT" pm2 restart luki-play-backend --update-env
else
  PORT="$BACKEND_PORT" pm2 start npm --name luki-play-backend -- run start:prod
fi
pm2 save

# Frontend build on server only if resources allow.
cd "$FRONTEND_DIR"
npm install
npm run build:web

if [[ ! -d "$FRONTEND_BUILD_DIR" && -d "$FRONTEND_DIR/web-build" ]]; then
  FRONTEND_BUILD_DIR="$FRONTEND_DIR/web-build"
fi

if [[ ! -d "$FRONTEND_BUILD_DIR" ]]; then
  echo "Frontend build output not found in $FRONTEND_DIR/dist or $FRONTEND_DIR/web-build" >&2
  exit 1
fi

# Publish frontend static files to nginx web root
sudo mkdir -p "$STATIC_DIR"
sudo rm -rf "$STATIC_DIR"/*
sudo cp -r "$FRONTEND_BUILD_DIR"/* "$STATIC_DIR"

# Nginx config
sudo tee /etc/nginx/sites-available/luki-play-ott.conf > /dev/null <<EOF
server {
  listen 80;
  listen $NGINX_PORT;
  server_name _;

  root $STATIC_DIR;
  index index.html;

  location /auth/ {
    proxy_pass http://127.0.0.1:$BACKEND_PORT/auth/;
    proxy_http_version 1.1;
    proxy_set_header Host localhost:$BACKEND_PORT;
    proxy_set_header X-Forwarded-Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header Authorization \$http_authorization;
  }

  location /admin/ {
    proxy_pass http://127.0.0.1:$BACKEND_PORT/admin/;
    proxy_http_version 1.1;
    proxy_set_header Host localhost:$BACKEND_PORT;
    proxy_set_header X-Forwarded-Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header Authorization \$http_authorization;
  }

  location /public/ {
    proxy_pass http://127.0.0.1:$BACKEND_PORT/public/;
    proxy_http_version 1.1;
    proxy_set_header Host localhost:$BACKEND_PORT;
    proxy_set_header X-Forwarded-Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
  }

  location /api/ {
    proxy_pass http://127.0.0.1:$BACKEND_PORT/api/;
    proxy_http_version 1.1;
    proxy_set_header Host localhost:$BACKEND_PORT;
    proxy_set_header X-Forwarded-Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
  }

  location ~ /\.(?!well-known).* {
    deny all;
    return 404;
  }

  location / {
    try_files \$uri \$uri.html \$uri/ /index.html;
  }
}
EOF

sudo ln -fs /etc/nginx/sites-available/luki-play-ott.conf /etc/nginx/sites-enabled/luki-play-ott.conf
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

PUBLIC_HOST="$(curl -fsS ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')"

echo "Deployment completed."
echo "Source: ${BRANCH:-local-snapshot}"
echo "Frontend: http://$PUBLIC_HOST:$NGINX_PORT"
echo "CMS Login: http://$PUBLIC_HOST:$NGINX_PORT/cms/login"
echo "Backend health: http://$PUBLIC_HOST:$NGINX_PORT/auth/health"
