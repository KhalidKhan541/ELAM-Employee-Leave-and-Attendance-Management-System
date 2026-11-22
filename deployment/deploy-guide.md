# Deployment guide — GitHub → Vercel

## 1. Prerequisites

* GitHub account and a repository created from this `source/` folder.
* Vercel account linked to that repository.
* Free PostgreSQL instance (Neon or Supabase) with a connection string.
* A random `JWT_SECRET` (at least 32 characters).

## 2. Local verification (before pushing)

```bash
cd source
cp .env.example .env
npm ci
npx prisma db push
npm run db:seed
npm run typecheck && npm test && npm run build
npm run dev   # open http://localhost:3000
```

Demo logins: `employee@elams.test`, `manager@elams.test`, `hr@elams.test`
(password `Password123!`).

## 3. GitHub repository

Set the repository root to the `source/` directory (Vercel project setting:
**Root Directory = source**). Protected branch: `main`.

```bash
git init
git add .
git commit -m "Initial commit: ELAM v1.2"
git remote add origin https://github.com/<user>/<repo>.git
git branch -M main
git push -u origin main
```

## 4. Vercel project settings

| Setting | Value |
|---------|-------|
| Framework preset | Next.js |
| Root directory | `source` |
| Build command | `node scripts/use-postgres-schema.mjs && npx prisma generate && npx prisma migrate deploy && next build` |
| Output directory | `.next` |
| Node version | 20.x or 22.x |
| Region | iad1 (or nearest) |

Environment variables (Production and Preview):

| Name | Value |
|------|-------|
| `DATABASE_URL` | `postgresql://user:pass@host/db?sslmode=require` |
| `JWT_SECRET` | long random string |
| `NODE_ENV` | `production` |

Never commit these values. `.env` is gitignored.

## 5. First deployment

1. Import the GitHub repository in Vercel.
2. Apply the settings above.
3. Deploy. The build swaps in `schema.postgres.prisma`, applies the initial
   migration, and builds Next.js.
4. Open the live URL and sign in with a demo account.
5. Create real HR/employee records through **Employees** before sharing.

## 6. Smoke test after each deployment

* [ ] `/login` loads and a demo account can sign in.
* [ ] `/dashboard` shows balances and requests.
* [ ] `/attendance` check-in and check-out work.
* [ ] `/approvals` shows the seed queue for a manager.
* [ ] `/reports` renders and CSV export downloads.
* [ ] No error entries in the Vercel function logs.

## 7. Rollback

If the smoke test fails, use **Deployments → Promote to Production** on the
previous successful deployment. If a destructive migration ran, restore the
pre-release backup into staging first (`restore.sh`) and then re-point the
connection string.

## 8. Backup schedule

Run `deployment/backup.sh` nightly (Vercel Cron or an external scheduler) and
store the output outside the repository. Verify with `deployment/restore.sh`
before every release — see `backup-drill.md`.
