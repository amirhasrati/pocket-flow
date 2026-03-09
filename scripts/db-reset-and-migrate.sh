#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "Resetting local Postgres data volume and containers..."
pnpm db:down:volumes

echo "Starting Postgres..."
pnpm db:up

echo "Waiting for Postgres readiness..."
for i in {1..30}; do
  if docker compose exec -T db pg_isready -U budget_user -d budget_app >/dev/null 2>&1; then
    echo "Postgres is ready."
    break
  fi

  if [[ "$i" -eq 30 ]]; then
    echo "Postgres did not become ready in time."
    echo "Run 'pnpm db:logs' to inspect container logs."
    exit 1
  fi

  sleep 2
done

echo "Applying Prisma migrations..."
pnpm exec prisma migrate dev

echo "Printing migration status..."
pnpm prisma:migrate:status

echo "Done."
