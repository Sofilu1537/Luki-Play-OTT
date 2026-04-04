#!/usr/bin/env bash
set -euo pipefail

# Deploy script for EC2 Debian instance
# Usage:
#   bash deploy-ec2.sh

REPO_URL="https://github.com/Sofilu1537/Luki-Play-OTT.git"
APP_DIR="$HOME/Luki-Play-OTT"
FRONTEND_DIR="$APP_DIR/frontend"
BACKEND_DIR="$APP_DIR/backend"
STATIC_DIR="/var/www/luki-play-ott"

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

# Clone or update repo
if [[ -d "$APP_DIR/.git" ]]; then
  cd "$APP_DIR"
  git pull --rebase
else
  git clone "$REPO_URL" "$APP_DIR"
fi

# Backend build
cd "$BACKEND_DIR"
npm install
npm run build

# Start backend via PM2 on port 8100
PORT=8100 pm2 stop luki-play-backend || true
PORT=8100 pm2 start npm --name luki-play-backend -- run start:prod
pm2 save

# Frontend build on server only if resources allow.
cd "$FRONTEND_DIR"
npm install
npm run build:web

# Publish frontend static files to nginx web root
sudo rm -rf "$STATIC_DIR"
sudo mkdir -p "$STATIC_DIR"
sudo cp -r web-build/* "$STATIC_DIR"

# Nginx config
sudo tee /etc/nginx/sites-available/luki-play-ott.conf > /dev/null <<EOF
server {
  listen 8090;
  server_name _;

  root $STATIC_DIR;
  index index.html;

  location / {
    try_files $uri /index.html;
  }
}
EOF

sudo ln -fs /etc/nginx/sites-available/luki-play-ott.conf /etc/nginx/sites-enabled/luki-play-ott.conf
sudo nginx -t
sudo systemctl restart nginx

echo "Deployment completed."
echo "Frontend: http://$(curl -s ifconfig.me):8090"
echo "Backend: http://$(curl -s ifconfig.me):8100"
