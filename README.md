# Pocket Flow

## Local PostgreSQL (Docker Compose)

`DATABASE_URL` in `.env` should match:

```env
DATABASE_URL="postgresql://budget_user:budget_password@localhost:5433/budget_app?schema=public"
```

Commands:

```bash
pnpm db:up
pnpm db:ps
pnpm db:ready
pnpm db:seed
pnpm prisma:migrate:status
pnpm db:logs
pnpm db:down
pnpm db:down:volumes
```

### Reset + Migrate Script

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
