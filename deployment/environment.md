# Environment configuration

| Variable | Local | Vercel | Secret? |
|----------|-------|--------|---------|
| `DATABASE_URL` | `file:./dev.db` | `postgresql://…?sslmode=require` | Yes |
| `JWT_SECRET` | development value | long random string | Yes |
| `NODE_ENV` | `development` | `production` | No |
| `STAGING_DATABASE_URL` | `file:./staging.db` | separate staging DB | Yes |
| `BACKUP_DIR` | `./backups` | external mount / bucket path | No |

## Rules

* `.env` and `.env.local` are gitignored; only `.env.example` is committed.
* Secrets are set in the Vercel dashboard, never in `vercel.json` or source.
* `logger.ts` redacts any context key containing password/secret/token/cookie.
* Rotating `JWT_SECRET` signs out all users — schedule it with a release.

## Schema selection

`prisma/schema.prisma` (SQLite) is used locally. During a Vercel build,
`scripts/use-postgres-schema.mjs` copies `prisma/schema.postgres.prisma` over
it so the generated client and the migration use PostgreSQL. After a production
build on your machine, restore the local schema:

```bash
cp prisma/schema.prisma prisma/schema.sqlite.backup   # before build
# ... after build
cp prisma/schema.sqlite.backup prisma/schema.prisma
```

The committed `schema.prisma` is the SQLite one.
