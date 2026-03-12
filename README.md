# Pocket Flow

## Prerequisites

- `pnpm` installed
- Docker Desktop or Docker Engine running
- A local `.env` file with:

```env
DATABASE_URL="postgresql://budget_user:budget_password@localhost:5433/budget_app?schema=public"
```

## Local Database Commands

```bash
pnpm db:up
pnpm db:ps
pnpm db:ready
pnpm db:seed
pnpm prisma:migrate:status
pnpm db:logs
pnpm db:down
pnpm db:down:volumes
pnpm db:reset:migrate
```

## After `git pull` When `main` Includes a DB Update

Run this from the repo root after pulling changes that include new Prisma migrations or schema updates:

```bash
git pull origin main
pnpm install
pnpm db:up
pnpm db:ready
pnpm exec prisma migrate dev
pnpm prisma:migrate:status
```

What each step does:

- `pnpm install` syncs dependencies in case `package.json` or `pnpm-lock.yaml` changed.
- `pnpm db:up` starts the local Postgres container.
- `pnpm db:ready` confirms Postgres is accepting connections.
- `pnpm exec prisma migrate dev` applies any new local migrations and regenerates the Prisma client in `generated/prisma`.
- `pnpm prisma:migrate:status` lets you confirm your database is up to date.

Use `pnpm db:seed` only if you need seeded demo data. You do not need to reseed on every pull.

If your local database gets out of sync or you want a clean reset, run:

```bash
pnpm db:reset:migrate
```

That command removes the local Postgres volume, starts a fresh database, waits for readiness, and applies the migrations again. It deletes local DB data.

## Starting the App After a PC Reboot

After a reboot, your code is still there and the Postgres volume is still there, but the Docker container and app server are not running. Use this process:

```bash
pnpm db:up
pnpm db:ready
pnpm dev
```

Notes:

- Make sure Docker is running before `pnpm db:up`.
- In the normal reboot case, you do not need `pnpm db:seed` or `pnpm db:reset:migrate`.
- If you rebooted after pulling schema changes and have not migrated yet, run `pnpm exec prisma migrate dev` before `pnpm dev`.
- `pnpm dev` starts the local app in development mode.

## Clean Reset + Migrate

Use this when you want a clean local DB and then apply migrations in one command:

```bash
pnpm db:reset:migrate
```

This runs:

```bash
pnpm db:down:volumes
pnpm db:up
pnpm db:ready
pnpm exec prisma migrate dev
pnpm prisma:migrate:status
```

`pnpm db:down:volumes` removes the Postgres volume, so local DB data is deleted.
