---
name: Sessions table bootstrap
description: Why and how the sessions table is created — connect-pg-simple, bundling constraint, and the idempotent inline-SQL fix.
---

## Rule
The `sessions` table must be created via `bootstrapSessionsTable()` in `artifacts/api-server/src/lib/bootstrap.ts`, called from `src/index.ts` before the server starts listening.

## Why
`connect-pg-simple`'s built-in `createTableIfMissing: true` uses `fs.readFile(__dirname, './table.sql')` at runtime. `__dirname` breaks inside the esbuild bundle (points to the wrong location), so the file read fails silently and the table is never created.

Setting `createTableIfMissing: false` (the current app.ts config) means the table must be created externally.

## How to apply
`bootstrapSessionsTable()` runs `CREATE TABLE IF NOT EXISTS sessions (...)` with inline SQL — no file read, bundle-safe, idempotent on every restart. It also creates `IDX_session_expire`.

Any time a task agent merge causes drizzle-kit push to run, the sessions table may be dropped (it is not in the Drizzle schema). The bootstrap recreates it on next server start automatically.

## Symptoms when missing
- `error: relation "sessions" does not exist` in server logs
- All authenticated routes return 500 (session middleware crashes)
- Admin login returns 500 instead of 200
- Tests that call `/api/auth/login` then an authenticated route get unexpected 500s
