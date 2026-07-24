#!/bin/bash
# Run this ON your server (srv1609330) as root
# Usage: bash server-setup.sh

set -e

REPO="https://github.com/automystics-pvt-ltd/AyyappanTempleWebsite.git"
APP_DIR="/home/automystics-ayyappan"
WEB_ROOT="$APP_DIR/htdocs/vadamadurai-ayyappan-temple.automystics.tech"
API_DIR="$APP_DIR/api"

echo "=== 1. Install Node.js 20 + pnpm ==="
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
npm install -g pnpm pm2

echo "=== 2. Clone / update repo ==="
if [ -d "$APP_DIR/src/.git" ]; then
  cd "$APP_DIR/src" && git pull origin main
else
  mkdir -p "$APP_DIR/src"
  git clone "$REPO" "$APP_DIR/src"
  cd "$APP_DIR/src"
fi

echo "=== 3. Install dependencies ==="
cd "$APP_DIR/src"
pnpm install --frozen-lockfile

echo "=== 4. Build frontend ==="
PORT=3000 BASE_PATH=/ pnpm --filter @workspace/ayyappan-temple run build

echo "=== 5. Build API ==="
NODE_ENV=production pnpm --filter @workspace/api-server run build

echo "=== 6. Deploy frontend to web root ==="
mkdir -p "$WEB_ROOT"
rsync -a --delete "$APP_DIR/src/artifacts/ayyappan-temple/dist/public/" "$WEB_ROOT/"

echo "=== 7. Deploy API ==="
mkdir -p "$API_DIR"
rsync -a --delete "$APP_DIR/src/artifacts/api-server/dist/" "$API_DIR/dist/"
cp deploy/ecosystem.config.cjs "$API_DIR/"

echo "=== 8. Start / reload API with PM2 ==="
cd "$API_DIR"
# Edit ecosystem.config.cjs with your real env vars before running this!
pm2 start ecosystem.config.cjs || pm2 reload ecosystem.config.cjs
pm2 save
pm2 startup

echo "=== 9. Install Nginx config ==="
cp "$APP_DIR/src/deploy/nginx.conf" /etc/nginx/sites-available/ayyappan-temple
ln -sf /etc/nginx/sites-available/ayyappan-temple /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

echo ""
echo "✅ Done! Site should be live at https://vadamadurai-ayyappan-temple.automystics.tech"
echo ""
echo "⚠️  Remember to:"
echo "   1. Edit $API_DIR/ecosystem.config.cjs with real DATABASE_URL and secrets"
echo "   2. Run: pm2 restart ayyappan-api"
echo "   3. SSL: certbot --nginx -d vadamadurai-ayyappan-temple.automystics.tech"
