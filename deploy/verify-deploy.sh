#!/bin/bash
# ============================================================
#  Ayyappan Temple — Post-Deploy Verification
#
#  Pings the live site and checks all critical endpoints.
#  Run from anywhere — no server access needed.
#
#  Usage:
#    bash deploy/verify-deploy.sh https://vadamadurai-ayyappan-temple.automystics.tech
#
#  Or set BASE_URL in env:
#    BASE_URL=https://your-domain.com bash deploy/verify-deploy.sh
# ============================================================
set -euo pipefail

BASE_URL="${1:-${BASE_URL:-}}"
[[ -n "$BASE_URL" ]] || {
  echo "Usage: bash verify-deploy.sh <base-url>"
  echo "  e.g. bash verify-deploy.sh https://vadamadurai-ayyappan-temple.automystics.tech"
  exit 1
}

# Strip trailing slash
BASE_URL="${BASE_URL%/}"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

PASS=0; FAIL=0

check() {
  local label="$1" url="$2" expect_status="${3:-200}" expect_body="${4:-}"

  local http body
  body=$(curl -s -o /tmp/vd_body -w "%{http_code}" --max-time 10 "$url" 2>/dev/null || echo "000")
  local content
  content=$(cat /tmp/vd_body 2>/dev/null || echo "")

  if [[ "$body" != "$expect_status" ]]; then
    echo -e "  ${RED}✗${NC}  $label"
    echo -e "       URL    : $url"
    echo -e "       Expected HTTP $expect_status, got HTTP $body"
    FAIL=$((FAIL + 1))
    return
  fi

  if [[ -n "$expect_body" ]] && ! echo "$content" | grep -q "$expect_body"; then
    echo -e "  ${RED}✗${NC}  $label"
    echo -e "       URL    : $url"
    echo -e "       Body missing: '$expect_body'"
    FAIL=$((FAIL + 1))
    return
  fi

  echo -e "  ${GREEN}✓${NC}  $label ${CYAN}(HTTP $body)${NC}"
  PASS=$((PASS + 1))
}

echo ""
echo -e "${BOLD}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║  Ayyappan Temple — Post-Deploy Verification          ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  Target: ${CYAN}${BASE_URL}${NC}"
echo ""

# ── Frontend ─────────────────────────────────────────────────
echo -e "${BOLD}── Frontend ────────────────────────────────────────────${NC}"
check "Home page loads"                    "${BASE_URL}/"             200 "<!doctype html"
check "Client-side route (donations)"      "${BASE_URL}/donations"    200 "<!doctype html"
check "Client-side route (admin login)"    "${BASE_URL}/admin"        200 "<!doctype html"
check "Static assets reachable"            "${BASE_URL}/assets/"      301   # redirect to index.html is fine too
echo ""

# ── API ───────────────────────────────────────────────────────
echo -e "${BOLD}── API ─────────────────────────────────────────────────${NC}"
check "API health check"                   "${BASE_URL}/api/healthz"  200
check "Events list"                        "${BASE_URL}/api/events"   200
check "News list"                          "${BASE_URL}/api/news"     200
check "Settings"                           "${BASE_URL}/api/settings" 200
check "Donation stats"                     "${BASE_URL}/api/donations/stats" 200
check "Approved donations"                 "${BASE_URL}/api/donations/approved" 200
check "Auth /me returns 401 (not 500)"     "${BASE_URL}/api/auth/me"  401
echo ""

# ── Summary ───────────────────────────────────────────────────
TOTAL=$((PASS + FAIL))
if [[ $FAIL -eq 0 ]]; then
  echo -e "${GREEN}${BOLD}╔══════════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}${BOLD}║  ✓  All ${TOTAL} checks passed — site is healthy           ║${NC}"
  echo -e "${GREEN}${BOLD}╚══════════════════════════════════════════════════════╝${NC}"
  echo ""
else
  echo -e "${RED}${BOLD}╔══════════════════════════════════════════════════════╗${NC}"
  echo -e "${RED}${BOLD}║  ✗  ${FAIL}/${TOTAL} checks failed                              ║${NC}"
  echo -e "${RED}${BOLD}╚══════════════════════════════════════════════════════╝${NC}"
  echo ""
  exit 1
fi
