#!/bin/bash
# ============================================================
#  Ayyappan Temple — First-time server setup
#  Run as root on a fresh Ubuntu 22.04 / 24.04 server:
#    bash setup.sh
# ============================================================
set -euo pipefail

# ── helpers ──────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

info()    { echo -e "${CYAN}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }
ask()     { echo -e "${BOLD}$*${NC}"; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ── root check ───────────────────────────────────────────────
[[ "$EUID" -eq 0 ]] || error "Please run as root: sudo bash setup.sh"

# ── OS check ─────────────────────────────────────────────────
command -v apt-get &>/dev/null || error "This script requires an Ubuntu/Debian system."

echo ""
echo -e "${BOLD}╔════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║  Ayyappan Temple — Server Setup            ║${NC}"
echo -e "${BOLD}╚════════════════════════════════════════════╝${NC}"
echo ""

# ═══════════════════════════════════════════════════
# STEP 1: Collect all configuration up front
# ═══════════════════════════════════════════════════
echo -e "${BOLD}── Configuration ───────────────────────────────${NC}"
echo ""

ask "Domain name (e.g. vadamadurai-ayyappan-temple.automystics.tech):"
read -r DOMAIN
[[ -n "$DOMAIN" ]] || error "Domain cannot be empty."

ask "API port for Node.js (press Enter for default 3001):"
read -r API_PORT
API_PORT="${API_PORT:-3001}"

ask "Web root path (press Enter for /var/www/${DOMAIN}):"
read -r WEB_ROOT
WEB_ROOT="${WEB_ROOT:-/var/www/${DOMAIN}}"

ask "App directory for Node.js API (press Enter for /opt/ayyappan-api):"
read -r APP_DIR
APP_DIR="${APP_DIR:-/opt/ayyappan-api}"

echo ""
echo -e "${BOLD}── Database setup ──────────────────────────────${NC}"
ask "Use a LOCAL PostgreSQL database? (y/n, default y):"
read -r USE_LOCAL_PG
USE_LOCAL_PG="${USE_LOCAL_PG:-y}"

if [[ "$USE_LOCAL_PG" =~ ^[Yy] ]]; then
  ask "New database name (press Enter for 'ayyappan_temple'):"
  read -r DB_NAME
  DB_NAME="${DB_NAME:-ayyappan_temple}"
  ask "New database username (press Enter for 'ayyappan_user'):"
  read -r DB_USER
  DB_USER="${DB_USER:-ayyappan_user}"
  ask "New database password:"
  read -rs DB_PASS
  echo ""
  [[ -n "$DB_PASS" ]] || error "Database password cannot be empty."
  DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@127.0.0.1:5432/${DB_NAME}"
else
  ask "Full PostgreSQL connection URL (postgresql://user:pass@host:5432/dbname):"
  read -r DATABASE_URL
  [[ -n "$DATABASE_URL" ]] || error "DATABASE_URL cannot be empty."
fi

echo ""
echo -e "${BOLD}── Application secrets ─────────────────────────${NC}"
ask "SESSION_SECRET (any long random string, min 32 chars):"
read -rs SESSION_SECRET
echo ""
[[ ${#SESSION_SECRET} -ge 32 ]] || error "SESSION_SECRET must be at least 32 characters."

ask "INITIAL_ADMIN_PASSWORD (password you'll use to log into /admin):"
read -rs INITIAL_ADMIN_PASSWORD
echo ""
[[ -n "$INITIAL_ADMIN_PASSWORD" ]] || error "Admin password cannot be empty."

echo ""
echo -e "${BOLD}── Photo / file storage ────────────────────────${NC}"
echo "Photos are stored on this server's local disk by default."
echo "Leave blank to use local storage (recommended for first setup)."
echo ""
ask "Google Cloud Storage bucket ID (press Enter to skip):"
read -r GCS_BUCKET
ask "Private object directory (press Enter for /opt/ayyappan-api/uploads):"
read -r PRIVATE_OBJECT_DIR
PRIVATE_OBJECT_DIR="${PRIVATE_OBJECT_DIR:-/opt/ayyappan-api/uploads}"
ask "Public object search paths (press Enter for default):"
read -r PUBLIC_OBJECT_SEARCH_PATHS
PUBLIC_OBJECT_SEARCH_PATHS="${PUBLIC_OBJECT_SEARCH_PATHS:-uploads}"

echo ""
ask "Get a free SSL certificate via Let's Encrypt? (y/n, default y):"
read -r GET_SSL
GET_SSL="${GET_SSL:-y}"

ask "Email for SSL certificate notifications:"
read -r SSL_EMAIL

echo ""
echo -e "${BOLD}════ Summary ═════════════════════════════════${NC}"
echo "  Domain     : $DOMAIN"
echo "  Web root   : $WEB_ROOT"
echo "  API dir    : $APP_DIR"
echo "  API port   : $API_PORT"
echo "  Database   : $DATABASE_URL" | sed 's|://[^:]*:[^@]*@|://***:***@|'
echo "  SSL        : $([[ "$GET_SSL" =~ ^[Yy] ]] && echo Yes || echo No)"
echo ""
ask "Proceed? (y/n):"
read -r CONFIRM
[[ "$CONFIRM" =~ ^[Yy] ]] || { echo "Aborted."; exit 0; }

# ═══════════════════════════════════════════════════
# STEP 2: Install system packages
# ═══════════════════════════════════════════════════
echo ""
info "Updating package lists…"
apt-get update -qq

info "Installing Nginx, PostgreSQL, curl, rsync…"
apt-get install -y -qq nginx postgresql postgresql-client curl rsync certbot python3-certbot-nginx

# ═══════════════════════════════════════════════════
# STEP 3: Install Node.js 20 + PM2
# ═══════════════════════════════════════════════════
if ! node --version 2>/dev/null | grep -q "^v2[0-9]"; then
  info "Installing Node.js 20…"
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash - >/dev/null
  apt-get install -y -qq nodejs
fi
success "Node.js $(node --version)"

if ! command -v pm2 &>/dev/null; then
  info "Installing PM2…"
  npm install -g pm2 --silent
fi
success "PM2 $(pm2 --version)"

# ═══════════════════════════════════════════════════
# STEP 4: Set up PostgreSQL (local only)
# ═══════════════════════════════════════════════════
if [[ "$USE_LOCAL_PG" =~ ^[Yy] ]]; then
  info "Starting PostgreSQL…"
  systemctl enable --now postgresql

  info "Creating database user and database…"
  sudo -u postgres psql -c "CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASS}';" 2>/dev/null || \
    sudo -u postgres psql -c "ALTER USER ${DB_USER} WITH PASSWORD '${DB_PASS}';"
  sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};" 2>/dev/null || true
  sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};" >/dev/null
  success "Database '${DB_NAME}' ready."
fi

# ═══════════════════════════════════════════════════
# STEP 5: Run schema
# ═══════════════════════════════════════════════════
info "Applying database schema…"
PGPASSWORD="${DB_PASS:-}" psql "$DATABASE_URL" -f "${SCRIPT_DIR}/schema.sql" -q
success "Schema applied."

# ═══════════════════════════════════════════════════
# STEP 6: Deploy frontend
# ═══════════════════════════════════════════════════
info "Deploying frontend to ${WEB_ROOT}…"
mkdir -p "$WEB_ROOT"
rsync -a --delete "${SCRIPT_DIR}/frontend/" "${WEB_ROOT}/"
success "Frontend deployed."

# ═══════════════════════════════════════════════════
# STEP 7: Deploy API
# ═══════════════════════════════════════════════════
info "Deploying API to ${APP_DIR}…"
mkdir -p "${APP_DIR}/dist"
mkdir -p "${APP_DIR}/uploads"
rsync -a --delete "${SCRIPT_DIR}/api/" "${APP_DIR}/dist/"

# Write PM2 ecosystem file
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
success "API deployed."

# ═══════════════════════════════════════════════════
# STEP 8: Start API with PM2
# ═══════════════════════════════════════════════════
info "Starting API with PM2…"
cd "$APP_DIR"
pm2 delete ayyappan-api 2>/dev/null || true
pm2 start ecosystem.config.cjs
pm2 save

# Auto-start PM2 on server reboot
PM2_STARTUP=$(pm2 startup systemd -u root --hp /root | grep "sudo" | tail -1)
eval "$PM2_STARTUP" 2>/dev/null || true
success "API running on port ${API_PORT}."

# Wait a moment then verify API is up
sleep 3
if curl -sf "http://127.0.0.1:${API_PORT}/api/healthz" >/dev/null; then
  success "API health check passed ✓"
else
  warn "API health check failed — check logs: pm2 logs ayyappan-api"
fi

# ═══════════════════════════════════════════════════
# STEP 9: Configure Nginx
# ═══════════════════════════════════════════════════
info "Configuring Nginx…"

# Start with HTTP-only config (certbot will add SSL)
cat > "/etc/nginx/sites-available/ayyappan-temple" <<NGINX
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

# ═══════════════════════════════════════════════════
# STEP 10: SSL certificate
# ═══════════════════════════════════════════════════
if [[ "$GET_SSL" =~ ^[Yy] ]] && [[ -n "$SSL_EMAIL" ]]; then
  info "Requesting SSL certificate for ${DOMAIN}…"
  certbot --nginx \
    -d "$DOMAIN" \
    --email "$SSL_EMAIL" \
    --agree-tos \
    --non-interactive \
    --redirect
  success "SSL certificate installed."
else
  warn "SSL skipped. Run later: certbot --nginx -d ${DOMAIN} --email your@email.com --agree-tos --redirect"
fi

# ═══════════════════════════════════════════════════
# Done
# ═══════════════════════════════════════════════════
echo ""
echo -e "${GREEN}${BOLD}╔════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}${BOLD}║  Setup complete!                               ║${NC}"
echo -e "${GREEN}${BOLD}╚════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  Site    : https://${DOMAIN}"
echo -e "  Admin   : https://${DOMAIN}/admin"
echo -e "  API     : https://${DOMAIN}/api/healthz"
echo ""
echo -e "  Useful commands:"
echo -e "    pm2 logs ayyappan-api       — live API logs"
echo -e "    pm2 restart ayyappan-api    — restart API"
echo -e "    nginx -t                    — test Nginx config"
echo -e "    systemctl reload nginx      — reload Nginx"
echo ""
