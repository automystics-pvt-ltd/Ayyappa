#!/bin/bash
# ============================================================
#  Ayyappan Temple — Production Deploy Script
#
#  Run on the server as root:
#    bash /opt/ayyappan-source/deploy/deploy.sh
#
#  What it does:
#    1. Pull latest code from GitHub
#    2. Install / update pnpm dependencies
#    3. Build frontend  → rsync to web root
#    4. Build API       → rsync to /opt/ayyappan-api/dist/
#    5. Apply any new DB migrations (idempotent)
#    6. Restart PM2 and verify the API is healthy
# ============================================================
set -euo pipefail

# ── Colour helpers ───────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'
info()    { echo -e "${CYAN}[INFO]${NC}  $*"; }
ok()      { echo -e "${GREEN}[ OK ]${NC}  $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
die()     { echo -e "${RED}[FAIL]${NC}  $*"; exit 1; }

# ── Config ───────────────────────────────────────────────────
SOURCE_DIR="${SOURCE_DIR:-/opt/ayyappan-source}"
API_DIR="${API_DIR:-/opt/ayyappan-api}"
WEB_ROOT="${WEB_ROOT:-/home/automystics-ayyappan/htdocs/vadamadurai-ayyappan-temple.automystics.tech}"
API_PORT="${API_PORT:-3001}"
PM2_APP="${PM2_APP:-ayyappan-api}"

echo ""
echo -e "${BOLD}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║   Ayyappan Temple — Deploy  $(date '+%Y-%m-%d %H:%M:%S')   ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════════════════════╝${NC}"
echo ""

# ── Guard ────────────────────────────────────────────────────
[[ -d "$SOURCE_DIR" ]]      || die "Source dir not found: $SOURCE_DIR  (run first-time-server-setup.sh first)"
[[ -d "$API_DIR/dist" ]]    || die "API dir not found: $API_DIR/dist"
command -v pnpm &>/dev/null || die "pnpm not installed. Run: npm install -g pnpm"
command -v pm2  &>/dev/null || die "PM2 not installed.  Run: npm install -g pm2"
command -v psql &>/dev/null || die "psql not installed. Run: apt-get install -y postgresql-client"

# ── Step 1 — pull latest ─────────────────────────────────────
info "[1/6] Pulling latest code…"
cd "$SOURCE_DIR"
git fetch --all --prune
git checkout -- .
git pull origin clean-main
COMMIT=$(git rev-parse --short HEAD)
ok "At commit $COMMIT"

# ── Step 2 — install dependencies ───────────────────────────
info "[2/6] Installing dependencies…"
# Allow lifecycle scripts that pnpm normally prompts for
pnpm approve-builds 2>/dev/null || true
pnpm install --frozen-lockfile
ok "Dependencies up to date"

# ── Step 3 — build frontend ──────────────────────────────────
info "[3/6] Building frontend…"
# Run in a subshell so PORT/BASE_PATH don't leak into the parent environment
# and get picked up by `pm2 restart --update-env` later.
(export PORT=3000; export BASE_PATH=/; pnpm --filter @workspace/ayyappan-temple run build)
ok "Frontend built → artifacts/ayyappan-temple/dist/public/"

info "        Syncing frontend to $WEB_ROOT …"
mkdir -p "$WEB_ROOT"
rsync -a --delete artifacts/ayyappan-temple/dist/public/ "$WEB_ROOT/"
ok "Frontend deployed"

# ── Step 4 — build API ───────────────────────────────────────
info "[4/6] Building API server…"
pnpm --filter @workspace/api-server run build
ok "API built → artifacts/api-server/dist/"

info "        Syncing API bundle to $API_DIR/dist/ …"
rsync -a artifacts/api-server/dist/ "$API_DIR/dist/"
ok "API bundle deployed"

# ── Step 5 — apply DB migrations ────────────────────────────
info "[5/6] Applying database migrations (idempotent)…"
ECOSYSTEM="$API_DIR/ecosystem.config.cjs"
if [[ -f "$ECOSYSTEM" ]]; then
  # Extract DATABASE_URL from the ecosystem config
  DB_URL=$(node -e "const c=require('$ECOSYSTEM'); console.log(c.apps[0].env.DATABASE_URL)" 2>/dev/null || true)
  if [[ -n "$DB_URL" && "$DB_URL" != *REPLACE* ]]; then
    psql "$DB_URL" -f "$SOURCE_DIR/deploy/schema.sql" -q
    ok "Migrations applied"
  else
    warn "DATABASE_URL not configured in $ECOSYSTEM — skipping migrations"
    warn "Edit $ECOSYSTEM and fill in the real DATABASE_URL, then re-run this script."
  fi
else
  warn "ecosystem.config.cjs not found at $ECOSYSTEM — skipping migrations"
fi

# ── Step 6 — restart PM2 & verify ───────────────────────────
info "[6/6] Restarting API via PM2…"
if pm2 describe "$PM2_APP" &>/dev/null; then
  pm2 restart "$PM2_APP" --update-env
else
  warn "PM2 app '$PM2_APP' not found — starting from ecosystem config…"
  pm2 start "$ECOSYSTEM" --env production
fi
pm2 save --force >/dev/null

# Give the app a moment to come up
sleep 4

# Health check
HEALTH_URL="http://127.0.0.1:${API_PORT}/api/healthz"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" || echo "000")

echo ""
if [[ "$HTTP_STATUS" == "200" ]]; then
  echo -e "${GREEN}${BOLD}╔══════════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}${BOLD}║  ✓  Deploy complete — API is healthy                 ║${NC}"
  echo -e "${GREEN}${BOLD}╚══════════════════════════════════════════════════════╝${NC}"
  echo ""
  echo "  Commit   : $COMMIT"
  echo "  API      : $HEALTH_URL → HTTP $HTTP_STATUS"
  echo "  Web root : $WEB_ROOT"
  echo ""
  echo "  Useful commands:"
  echo "    pm2 logs $PM2_APP         — live API logs"
  echo "    pm2 status                — process list"
  echo "    pm2 restart $PM2_APP      — manual restart"
else
  echo -e "${RED}${BOLD}╔══════════════════════════════════════════════════════╗${NC}"
  echo -e "${RED}${BOLD}║  ✗  Deploy finished but API health check failed      ║${NC}"
  echo -e "${RED}${BOLD}╚══════════════════════════════════════════════════════╝${NC}"
  echo ""
  echo "  Health check URL : $HEALTH_URL"
  echo "  HTTP status      : $HTTP_STATUS"
  echo ""
  echo "  Check logs with: pm2 logs $PM2_APP --lines 50"
  exit 1
fi
