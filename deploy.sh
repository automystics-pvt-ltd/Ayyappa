#!/usr/bin/env bash
# ============================================================
# Ayyappan Temple — VPS deployment script
#
# Server layout used by the VPS File Manager:
#   /home/automystics-ayyappan/
#   ├── src/       Git repository
#   ├── api/       Production API files
#   └── htdocs/   Production website files
#
# Upload this file to:
#   /home/automystics-ayyappan/deploy.sh
#
# Run on the server as root:
#   cd /home/automystics-ayyappan
#   bash deploy.sh
#
# Optional overrides:
#   APP_DIR=/custom/path bash deploy.sh
# ============================================================
set -Eeuo pipefail

APP_DIR="${APP_DIR:-/home/automystics-ayyappan}"
SOURCE_DIR="${SOURCE_DIR:-$APP_DIR/src}"
API_DIR="${API_DIR:-$APP_DIR/api}"
WEB_ROOT="${WEB_ROOT:-$APP_DIR/htdocs/vadamadurai-ayyappan-temple.automystics.tech}"
BRANCH="${BRANCH:-clean-main}"
PM2_APP="${PM2_APP:-ayyappan-api}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

info() { echo -e "${CYAN}[INFO]${NC} $*"; }
ok()   { echo -e "${GREEN}[ OK ]${NC} $*"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
fail() { echo -e "${RED}[FAIL]${NC} $*"; exit 1; }

trap 'echo -e "${RED}[FAIL]${NC} Deployment stopped at line $LINENO."; exit 1' ERR

[[ "$EUID" -eq 0 ]] || fail "Run as root: sudo bash deploy.sh"
[[ -d "$SOURCE_DIR" ]] || fail "Source directory not found: $SOURCE_DIR"
[[ -d "$SOURCE_DIR/.git" ]] || fail "Git repository not found: $SOURCE_DIR"
command -v node >/dev/null 2>&1 || fail "Node.js is not installed."
command -v pnpm >/dev/null 2>&1 || fail "pnpm is not installed. Run: npm install -g pnpm"
command -v pm2 >/dev/null 2>&1 || fail "PM2 is not installed. Run: npm install -g pm2"
command -v rsync >/dev/null 2>&1 || fail "rsync is not installed."

echo ""
echo -e "${BOLD}============================================================${NC}"
echo -e "${BOLD} Ayyappan Temple — Production Deploy${NC}"
echo -e "${BOLD}============================================================${NC}"
echo "Source : $SOURCE_DIR"
echo "API    : $API_DIR"
echo "Web    : $WEB_ROOT"
echo "Branch : $BRANCH"
echo ""

info "Pulling latest code from GitHub..."
cd "$SOURCE_DIR"
git fetch --all --prune
git checkout "$BRANCH"
git reset --hard "origin/$BRANCH"
COMMIT="$(git rev-parse --short HEAD)"
ok "Using commit $COMMIT"

info "Installing dependencies..."
pnpm install --frozen-lockfile
ok "Dependencies installed"

info "Building frontend..."
PORT=3000 BASE_PATH=/ pnpm --filter @workspace/ayyappan-temple run build
mkdir -p "$WEB_ROOT"
rsync -a --delete \
  "$SOURCE_DIR/artifacts/ayyappan-temple/dist/public/" \
  "$WEB_ROOT/"
ok "Frontend deployed to $WEB_ROOT"

info "Building API..."
NODE_ENV=production pnpm --filter @workspace/api-server run build
mkdir -p "$API_DIR/dist"
rsync -a "$SOURCE_DIR/artifacts/api-server/dist/" "$API_DIR/dist/"
ok "API bundle deployed to $API_DIR/dist"

ECOSYSTEM="$API_DIR/ecosystem.config.cjs"
if [[ ! -f "$ECOSYSTEM" ]]; then
  [[ -f "$SOURCE_DIR/deploy/ecosystem.config.cjs" ]] || \
    fail "Missing $ECOSYSTEM and no ecosystem template was found."
  cp "$SOURCE_DIR/deploy/ecosystem.config.cjs" "$ECOSYSTEM"
  fail "Created $ECOSYSTEM. Edit its DATABASE_URL and secrets, then run deploy.sh again."
fi

if grep -q "REPLACE" "$ECOSYSTEM"; then
  fail "$ECOSYSTEM still contains REPLACE placeholders. Fill in the real production values, then run deploy.sh again."
fi

info "Applying database migrations..."
DB_URL="$(node -e "
  const c = require('$ECOSYSTEM');
  process.stdout.write(c.apps[0].env.DATABASE_URL || '');
" 2>/dev/null || true)"

[[ -n "$DB_URL" ]] || fail "DATABASE_URL is missing in $ECOSYSTEM."
command -v psql >/dev/null 2>&1 || fail "psql is not installed."
psql "$DB_URL" -f "$SOURCE_DIR/deploy/schema.sql" -q
ok "Database migrations applied"

info "Restarting API with PM2..."
if pm2 describe "$PM2_APP" >/dev/null 2>&1; then
  pm2 restart "$PM2_APP" --update-env
else
  pm2 start "$ECOSYSTEM" --env production
fi
pm2 save --force >/dev/null
ok "PM2 process is running"

API_PORT="$(node -e "
  const c = require('$ECOSYSTEM');
  process.stdout.write(String(c.apps[0].env.PORT || 3001));
" 2>/dev/null || echo "3001")"

info "Checking API health..."
sleep 4
HTTP_STATUS="$(curl -sS -o /dev/null -w '%{http_code}' \
  --max-time 15 "http://127.0.0.1:${API_PORT}/api/healthz" || true)"

if [[ "$HTTP_STATUS" != "200" ]]; then
  echo ""
  warn "API health check returned HTTP $HTTP_STATUS"
  echo "Check logs with: pm2 logs $PM2_APP --lines 80"
  exit 1
fi

echo ""
echo -e "${GREEN}${BOLD}============================================================${NC}"
echo -e "${GREEN}${BOLD} DEPLOYMENT COMPLETE${NC}"
echo -e "${GREEN}${BOLD}============================================================${NC}"
echo "Commit : $COMMIT"
echo "Health : http://127.0.0.1:${API_PORT}/api/healthz"
echo ""
echo "Useful commands:"
echo "  pm2 status"
echo "  pm2 logs $PM2_APP --lines 80"
echo "  pm2 restart $PM2_APP"