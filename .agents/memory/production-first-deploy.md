---
name: Production first deploy
description: What exists (and doesn't) before the first Publish, and what the bootstrap handles automatically.
---

## Rule
The production Neon database is provisioned only when the user clicks Publish for the first time. Until then, querying production returns "does not have a production Neon database."

## What happens on first Publish
1. Replit provisions the production DB and applies the Drizzle schema diff (all managed tables created).
2. The production server starts and runs:
   - `bootstrapSessionsTable()` — creates the sessions table (not in Drizzle schema, only path to prod).
   - `bootstrapFirstAdmin()` — creates username `admin` with `INITIAL_ADMIN_PASSWORD` secret (or a random password logged once if the secret is unset).
3. Admin login at the production URL works immediately after.

## Data
Dev and production databases are always separate. Records added in dev never appear in production automatically. Admins must re-enter data directly via the production admin panel, or use the "Overwrite data" toggle in the Publish UI to copy all dev data to prod wholesale (destructive).

## How to apply
When a user reports "data not showing in production" or "admin can't login on live site" — check if a production DB exists first (`executeSql({ environment: "production" })`). If it returns "does not have a production Neon database", the answer is simply: publish the app.
