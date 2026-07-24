# Deployment Guide — Ayyappan Temple

## How it works

Every push to `main` automatically builds and deploys the site to your server.

```
You push code → GitHub Actions builds → rsync to server → PM2 restarts
```

---

## First-time setup (do this once)

### Step 1 — Generate a deploy SSH key

Run on any machine (your laptop or Replit shell):

```bash
bash deploy/generate-deploy-key.sh
```

This prints:
- The **public key** → paste onto your server's `~/.ssh/authorized_keys`
- The **private key** → add as GitHub Secret `SSH_PRIVATE_KEY`

### Step 2 — Add GitHub Secrets

Go to your repo → **Settings → Secrets and variables → Actions → New repository secret**

| Secret name        | Value                                                          |
|--------------------|----------------------------------------------------------------|
| `SSH_PRIVATE_KEY`  | The private key from Step 1                                    |
| `SSH_HOST`         | `srv1609330` (or your server IP)                              |
| `SSH_USER`         | `root`                                                         |
| `DEPLOY_WEB_ROOT`  | `/var/www/vadamadurai-ayyappan-temple.automystics.tech`       |
| `DEPLOY_API_DIR`   | `/opt/ayyappan-api`                                           |

### Step 3 — Set up the server (once)

Copy `deploy/` folder to your server, then run:

```bash
bash deploy/first-time-server-setup.sh
```

This installs Node.js, Nginx, PostgreSQL, PM2, sets up the database, and configures SSL. It takes about 5 minutes.

### Step 4 — Push to GitHub

```bash
git push origin main
```

GitHub Actions runs automatically. Watch progress at:
`https://github.com/automystics-pvt-ltd/AyyappanTempleWebsite/actions`

---

## After setup — daily workflow

```bash
# Make changes, then:
git add -A
git commit -m "your message"
git push origin main
# → site is live in ~2 minutes
```

## Manual deploy trigger

In GitHub → Actions tab → "Deploy to Production" → "Run workflow"

## Useful server commands

```bash
pm2 logs ayyappan-api        # live API logs
pm2 restart ayyappan-api     # restart API
pm2 status                   # check if API is running
journalctl -u nginx -f       # Nginx logs
nginx -t                     # test Nginx config
```
