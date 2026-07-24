#!/bin/bash
# ============================================================
#  Ayyappan Temple — ONE-TIME server setup for GitHub Actions
#
#  Run this ONCE on your server before the first GitHub Actions
#  deploy. After this, every push to main deploys automatically.
#
#  Usage (on server as root):
#    bash first-time-server-setup.sh
# ============================================================
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

info()    { echo -e "${CYAN}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

[[ "$EUID" -eq 0 ]] || error "Run as root: sudo bash first-time-server-setup.sh"
command -v apt-get &>/dev/null || error "Requires Ubuntu/Debian."

echo ""
echo -e "${BOLD}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║  Ayyappan Temple — First-Time Server Setup       ║${NC}"
echo -e "${BOLD}║  (GitHub Actions will handle future deploys)     ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════════════════╝${NC}"
echo ""

# ── Collect config ───────────────────────────────────────────
echo -e "${BOLD}── Paths ───────────────────────────────────────────${NC}"
read -rp "Domain (e.g. vadamadurai-ayyappan-temple.automystics.tech): " DOMAIN
[[ -n "$DOMAIN" ]] || error "Domain required."

read -rp "Web root path [/var/www/${DOMAIN}]: " WEB_ROOT
WEB_ROOT="${WEB_ROOT:-/var/www/${DOMAIN}}"

read -rp "API directory [/opt/ayyappan-api]: " APP_DIR
APP_DIR="${APP_DIR:-/opt/ayyappan-api}"

read -rp "API port [3001]: " API_PORT
API_PORT="${API_PORT:-3001}"

echo ""
echo -e "${BOLD}── Database ─────────────────────────────────────────${NC}"
read -rp "Use local PostgreSQL? (y/n) [y]: " USE_LOCAL_PG
USE_LOCAL_PG="${USE_LOCAL_PG:-y}"

if [[ "$USE_LOCAL_PG" =~ ^[Yy] ]]; then
  read -rp "Database name [ayyappan_temple]: " DB_NAME;  DB_NAME="${DB_NAME:-ayyappan_temple}"
  read -rp "Database user [ayyappan_user]: "  DB_USER;  DB_USER="${DB_USER:-ayyappan_user}"
  read -rsp "Database password: " DB_PASS; echo ""
  [[ -n "$DB_PASS" ]] || error "Password required."
  DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@127.0.0.1:5432/${DB_NAME}"
else
  read -rp "PostgreSQL URL (postgresql://user:pass@host:5432/db): " DATABASE_URL
  [[ -n "$DATABASE_URL" ]] || error "DATABASE_URL required."
fi

echo ""
echo -e "${BOLD}── Secrets ──────────────────────────────────────────${NC}"
read -rsp "SESSION_SECRET (min 32 chars): " SESSION_SECRET; echo ""
[[ ${#SESSION_SECRET} -ge 32 ]] || error "SESSION_SECRET must be ≥ 32 chars."

read -rsp "INITIAL_ADMIN_PASSWORD (for /admin login): " INITIAL_ADMIN_PASSWORD; echo ""
[[ -n "$INITIAL_ADMIN_PASSWORD" ]] || error "Admin password required."

echo ""
echo -e "${BOLD}── File storage ─────────────────────────────────────${NC}"
echo "Leave GCS bucket blank to store uploads on local disk."
read -rp "GCS bucket ID [leave blank for local disk]: " GCS_BUCKET
PRIVATE_OBJECT_DIR="${APP_DIR}/uploads"
PUBLIC_OBJECT_SEARCH_PATHS="uploads"

echo ""
echo -e "${BOLD}── SSL ──────────────────────────────────────────────${NC}"
read -rp "Get free SSL certificate via Let's Encrypt? (y/n) [y]: " GET_SSL
GET_SSL="${GET_SSL:-y}"
read -rp "Email for SSL notifications: " SSL_EMAIL

echo ""
echo -e "${BOLD}════ Summary ════════════════════════════════════════${NC}"
echo "  Domain   : $DOMAIN"
echo "  Web root : $WEB_ROOT"
echo "  API dir  : $APP_DIR"
echo "  API port : $API_PORT"
echo "  DB URL   : $(echo "$DATABASE_URL" | sed 's|://[^:]*:[^@]*@|://***:***@|')"
echo "  SSL      : $([[ "$GET_SSL" =~ ^[Yy] ]] && echo Yes || echo No)"
echo ""
read -rp "Proceed? (y/n): " CONFIRM
[[ "$CONFIRM" =~ ^[Yy] ]] || { echo "Aborted."; exit 0; }

# ── Install system packages ──────────────────────────────────
echo ""
info "Updating packages…"
apt-get update -qq
apt-get install -y -qq nginx postgresql postgresql-client curl rsync certbot python3-certbot-nginx

# ── Node.js 20 ───────────────────────────────────────────────
if ! node --version 2>/dev/null | grep -qE "^v2[0-9]"; then
  info "Installing Node.js 20…"
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash - >/dev/null
  apt-get install -y -qq nodejs
fi
success "Node $(node --version)"

# ── PM2 ──────────────────────────────────────────────────────
if ! command -v pm2 &>/dev/null; then
  info "Installing PM2…"
  npm install -g pm2 --silent
fi
success "PM2 $(pm2 --version)"

# ── PostgreSQL (local) ───────────────────────────────────────
if [[ "$USE_LOCAL_PG" =~ ^[Yy] ]]; then
  info "Configuring PostgreSQL…"
  systemctl enable --now postgresql
  sudo -u postgres psql -c "CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASS}';" 2>/dev/null \
    || sudo -u postgres psql -c "ALTER USER ${DB_USER} WITH PASSWORD '${DB_PASS}';"
  sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};" 2>/dev/null || true
  sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};" >/dev/null
  success "Database '${DB_NAME}' ready."
fi

# ── Schema ───────────────────────────────────────────────────
info "Applying database schema…"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PGPASSWORD="${DB_PASS:-}" psql "$DATABASE_URL" -f "${SCRIPT_DIR}/schema.sql" -q
success "Schema applied."

# ── Directories ──────────────────────────────────────────────
info "Creating directories…"
mkdir -p "$WEB_ROOT" "${APP_DIR}/dist" "${APP_DIR}/uploads"

# ── Write PM2 ecosystem (GitHub Actions will rsync code here) ─
info "Writing PM2 config…"
cat > "${APP_DIR}/ecosystem.config.cjs" <<ECOSYSTEM
module.exports = {
  apps: [{
    name: "ayyappan-api",
    script: "${APP_DIR}/dist/index.mjs",
    interpreter: "node",
    interpreter_args: "--enable-source-maps",
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: "512M",
    env: {
      NODE_ENV: "production",
      PORT: "${API_PORT}",
      DATABASE_URL: "${DATABASE_URL}",
      SESSION_SECRET: "${SESSION_SECRET}",
      INITIAL_ADMIN_PASSWORD: "${INITIAL_ADMIN_PASSWORD}",
      DEFAULT_OBJECT_STORAGE_BUCKET_ID: "${GCS_BUCKET}",
      PRIVATE_OBJECT_DIR: "${PRIVATE_OBJECT_DIR}",
      PUBLIC_OBJECT_SEARCH_PATHS: "${PUBLIC_OBJECT_SEARCH_PATHS}",
    }
  }]
};
ECOSYSTEM
chmod 600 "${APP_DIR}/ecosystem.config.cjs"

# ── Nginx ────────────────────────────────────────────────────
info "Configuring Nginx…"
cat > /etc/nginx/sites-available/ayyappan-temple <<NGINX
server {
    listen 80;
    server_name ${DOMAIN};

    location /api/ {
        proxy_pass         http://127.0.0.1:${API_PORT};
        proxy_http_version 1.1;
        proxy_set_header   Host              \$host;
        proxy_set_header   X-Real-IP         \$remote_addr;
        proxy_set_header   X-Forwarded-For   \$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto \$scheme;
        proxy_read_timeout 60s;
        client_max_body_size 15M;
    }

    root ${WEB_ROOT};
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    gzip on;
    gzip_types text/plain text/css application/javascript application/json image/svg+xml;
}
NGINX

ln -sf /etc/nginx/sites-available/ayyappan-temple /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
nginx -t && systemctl enable --now nginx && systemctl reload nginx
success "Nginx configured."

# ── SSL ──────────────────────────────────────────────────────
if [[ "$GET_SSL" =~ ^[Yy] ]] && [[ -n "$SSL_EMAIL" ]]; then
  info "Getting SSL certificate…"
  certbot --nginx -d "$DOMAIN" --email "$SSL_EMAIL" --agree-tos --non-interactive --redirect
  success "SSL installed."
else
  warn "SSL skipped. Run later: certbot --nginx -d ${DOMAIN} --email your@email.com --agree-tos --redirect"
fi

# ── PM2 startup ──────────────────────────────────────────────
info "Configuring PM2 auto-start on reboot…"
env PATH="$PATH:/usr/bin" pm2 startup systemd -u root --hp /root | tail -1 | bash || true
pm2 save

# ── Done ─────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}${BOLD}║  Server setup complete!                              ║${NC}"
echo -e "${GREEN}${BOLD}╚══════════════════════════════════════════════════════╝${NC}"
echo ""
echo "  Web root : ${WEB_ROOT}  ← GitHub Actions will rsync here"
echo "  API dir  : ${APP_DIR}   ← GitHub Actions will rsync here"
echo ""
echo "  Next step: push code to GitHub → Actions will auto-deploy!"
echo ""
echo "  Useful commands:"
echo "    pm2 logs ayyappan-api       — live API logs"
echo "    pm2 restart ayyappan-api    — restart API"
echo "    journalctl -u nginx -f      — Nginx logs"
echo ""
