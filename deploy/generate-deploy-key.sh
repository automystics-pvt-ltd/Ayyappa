#!/bin/bash
# ============================================================
#  Generate an SSH deploy key for GitHub Actions
#  Run this ONCE on any machine (your laptop, Replit, etc.)
#  Usage: bash generate-deploy-key.sh
# ============================================================
set -euo pipefail

KEY_FILE="deploy_key"

echo ""
echo "Generating SSH key pair for GitHub Actions deployment…"
ssh-keygen -t ed25519 -C "github-actions-deploy" -f "$KEY_FILE" -N ""

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  STEP 1 — Add the PUBLIC key to your SERVER"
echo "═══════════════════════════════════════════════════════"
echo "Run this command on your server (srv1609330):"
echo ""
echo "  echo '$(cat ${KEY_FILE}.pub)' >> ~/.ssh/authorized_keys"
echo ""

echo "═══════════════════════════════════════════════════════"
echo "  STEP 2 — Add the PRIVATE key to GitHub Secrets"
echo "═══════════════════════════════════════════════════════"
echo "Go to: https://github.com/automystics-pvt-ltd/AyyappanTempleWebsite"
echo "       → Settings → Secrets and variables → Actions → New repository secret"
echo ""
echo "Secret name : SSH_PRIVATE_KEY"
echo "Secret value:"
echo ""
cat "${KEY_FILE}"
echo ""

echo "═══════════════════════════════════════════════════════"
echo "  STEP 3 — Add the remaining GitHub Secrets"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "  SSH_HOST        →  srv1609330  (or your server IP)"
echo "  SSH_USER        →  root"
echo "  DEPLOY_WEB_ROOT →  /var/www/vadamadurai-ayyappan-temple.automystics.tech"
echo "  DEPLOY_API_DIR  →  /opt/ayyappan-api"
echo ""
echo "Files saved:"
echo "  Private key → ${KEY_FILE}      (add to GitHub Secrets, then delete)"
echo "  Public key  → ${KEY_FILE}.pub  (already shown above)"
echo ""
echo "⚠️  Delete both files from this machine once done:"
echo "    rm ${KEY_FILE} ${KEY_FILE}.pub"
