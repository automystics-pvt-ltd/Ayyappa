---
name: Drizzle push non-interactive
description: drizzle-kit push fails in non-TTY shells when conflicts prompt
---
`pnpm run push` (drizzle-kit push) dies with "Interactive prompts require a TTY" whenever it detects table/column conflicts, even with `--force`.
**Why:** conflict resolution prompts need stdin; agent shells are non-interactive.
**How to apply:** if push prompts, apply the DDL manually via `psql "$DATABASE_URL"` to match the schema, and mirror it in `deploy/schema.sql` (used for production). Also rebuild `lib/db` (`tsc -b`) after schema changes — consumers type-check against `lib/db/dist`.
