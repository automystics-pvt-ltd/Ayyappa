#!/bin/bash
set -e

# Install all workspace dependencies
pnpm install

# Push any new DB schema changes (non-interactive, idempotent)
pnpm --filter @workspace/db run push-force
