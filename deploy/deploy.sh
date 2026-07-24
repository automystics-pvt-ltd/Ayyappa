#!/bin/bash
set -e

echo "=== [1/7] Resetting local changes & pulling latest ==="
cd /opt/ayyappan-source
git checkout -- .
git pull origin main

echo "=== [2/7] Approving build scripts ==="
pnpm approve-builds || true

echo "=== [3/7] Installing dependencies ==="
pnpm install

echo "=== [4/7] Building frontend ==="
pnpm --filter @workspace/ayyappan-temple build

echo "=== [5/7] Building API ==="
pnpm --filter @workspace/api-server build

echo "=== [6/7] Deploying files ==="
rsync -av --delete artifacts/ayyappan-temple/dist/public/ \
  /home/automystics-ayyappan/htdocs/vadamadurai-ayyappan-temple.automystics.tech/

rsync -av artifacts/api-server/dist/ /opt/ayyappan-api/dist/

echo "=== [7/7] Restarting API & seeding admin ==="
pm2 restart ayyappan-api
sleep 3

# Upsert admin with correct password
PGPASSWORD='Temple2026secure' psql \
  "postgresql://ayyappan_user:Temple2026secure@127.0.0.1:5432/ayyappan_temple" \
  -c "INSERT INTO admins (username, password_hash, role, display_name)
      VALUES (
        'admin',
        '\$2b\$12\$MjGaLRSbIHv.lFpEKrtZmu7lVuBpFzDEcNBOwGTl9.WtodRcz2LnG',
        'super_admin',
        'முதன்மை நிர்வாகி'
      )
      ON CONFLICT (username)
      DO UPDATE SET password_hash = EXCLUDED.password_hash,
                    role          = EXCLUDED.role;"

echo ""
echo "=== Verifying login ==="
curl -s -X POST http://127.0.0.1:3010/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin@2026$"}'
echo ""
echo "=== DONE — admin password: Admin@2026$ ==="
