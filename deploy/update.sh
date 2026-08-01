#!/bin/bash
# ============================================================
#  Ayyappan Temple — Update Script (run after first install)
#
#  Deploys new frontend + API code without asking questions.
#  Reads all config from the existing ecosystem.config.cjs.
#
#  Usage (on server as root):
#    bash update.sh /path/to/ayyappan-temple-deploy.tar.gz
#
#  Or run from inside an already-extracted package:
#    bash update.sh
# ============================================================
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'
info() { echo -e "${CYAN}[INFO]${NC}  $*"; }
ok()   { echo -e "${GREEN}[ OK ]${NC}  $*"; }
die()  { echo -e "${RED}[FAIL]${NC}  $*"; exit 1; }

APP_DIR="${APP_DIR:-/opt/ayyappan-api}"
ECOSYSTEM="${APP_DIR}/ecosystem.config.cjs"

[[ "$EUID" -eq 0 ]] || die "Run as root: sudo bash update.sh"
[[ -f "$ECOSYSTEM" ]] || die "Config not found at $ECOSYSTEM — run install.sh first."

# ── Locate source directory ──────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# If a tar.gz was passed as argument, extract it to a temp dir first
if [[ "${1:-}" == *.tar.gz ]]; then
  TMP=$(mktemp -d)
  info "Extracting $1 …"
  tar -xzf "$1" -C "$TMP"
  SCRIPT_DIR="$TMP"
fi

[[ -d "$SCRIPT_DIR/web" ]]        || die "web/ folder not found in package."
[[ -d "$SCRIPT_DIR/api/dist" ]]   || die "api/dist/ folder not found in package."

# ── Read web root from Nginx config ─────────────────────────
WEB_ROOT=$(grep -oP '(?<=root )[^;]+' /etc/nginx/sites-available/ayyappan-temple 2>/dev/null || true)
[[ -n "$WEB_ROOT" ]] || die "Could not detect web root from Nginx — is Nginx configured?"

echo ""
echo -e "${BOLD}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║  Ayyappan Temple — Update  $(date '+%Y-%m-%d %H:%M')       ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════════════════╝${NC}"
echo ""
echo "  Web root : $WEB_ROOT"
echo "  API dir  : $APP_DIR"
echo ""

# ── Deploy frontend ──────────────────────────────────────────
info "[1/4] Deploying frontend…"
rsync -a --delete "$SCRIPT_DIR/web/" "$WEB_ROOT/"
ok "Frontend deployed"

# ── Deploy API ───────────────────────────────────────────────
info "[2/4] Deploying API…"
rsync -a "$SCRIPT_DIR/api/dist/" "${APP_DIR}/dist/"
ok "API deployed"

# ── Apply DB migrations ──────────────────────────────────────
info "[3/4] Applying database migrations…"
DB_URL=$(node -e "const c=require('$ECOSYSTEM'); console.log(c.apps[0].env.DATABASE_URL)" 2>/dev/null || true)
if [[ -n "$DB_URL" && "$DB_URL" != *REPLACE* ]]; then
  psql "$DB_URL" -f "$SCRIPT_DIR/scripts/schema.sql" -q 2>/dev/null && ok "Migrations applied" \
    || ok "Migrations skipped (schema.sql not found in package)"
else
  ok "Migrations skipped (DATABASE_URL not set)"
fi

# ── Restart API ──────────────────────────────────────────────
info "[4/4] Restarting API…"
if pm2 describe ayyappan-api &>/dev/null; then
  pm2 restart ayyappan-api --update-env
else
  pm2 start "$ECOSYSTEM" --env production
fi
pm2 save --force >/dev/null
sleep 4

# ── Health check ─────────────────────────────────────────────
API_PORT=$(node -e "const c=require('$ECOSYSTEM'); console.log(c.apps[0].env.PORT || 3001)" 2>/dev/null || echo "3001")
HTTP=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:${API_PORT}/api/healthz" || echo "000")

echo ""
if [[ "$HTTP" == "200" ]]; then
  echo -e "${GREEN}${BOLD}╔══════════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}${BOLD}║  ✓  Update complete — API is healthy                 ║${NC}"
  echo -e "${GREEN}${BOLD}╚══════════════════════════════════════════════════════╝${NC}"
else
  echo -e "${RED}${BOLD}API health check failed (HTTP ${HTTP})${NC}"
  echo "  Check: pm2 logs ayyappan-api --lines 50"
  exit 1
fi
