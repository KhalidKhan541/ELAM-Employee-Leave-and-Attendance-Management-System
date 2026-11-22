# ELAM — Employee Leave and Attendance Management System

Full-stack web application built with Next.js 15, TypeScript, Prisma and
Tailwind CSS. Runs locally on SQLite and deploys to Vercel with PostgreSQL.

## Quick start

```bash
npm install
cp .env.example .env
npx prisma db push
npm run db:seed
npm run dev
```

Open <http://localhost:3000>.

### Demo accounts (password: `Password123!`)

| Role | Email | What you can do |
|------|-------|-----------------|
| Employee | `employee@elams.test` | Attendance, leave requests, balances |
| Manager | `manager@elams.test` | Approve department leave, reports, payroll |
| HR | `hr@elams.test` | Manage employees, all approvals, audit, reports |

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run typecheck` | TypeScript check |
| `npm test` | All Vitest suites |
| `npm run test:coverage` | Coverage report |
| `npm run db:push` | Sync SQLite schema |
| `npm run db:seed` | Load deterministic demo data |
| `npm run db:reset` | Reset + seed |
| `npm run db:studio` | Prisma Studio |

## Structure

```
prisma/          schema.prisma (SQLite), schema.postgres.prisma, seed.ts, migrations/
src/app/         pages and API route handlers
src/components/  React UI components
src/lib/domain/  pure OO domain layer (services, policy, rules, legacy)
src/lib/repositories/  Prisma implementations of the domain ports
src/lib/         auth, errors, validation, retry, logger, response, csv
tests/           unit, integration, fault tests + in-memory fakes
```

## Architecture in one paragraph

UI components call thin API route handlers; handlers validate input with Zod
and delegate to domain services. Services depend on narrow interfaces
(`UnitOfWork`, `Clock`, `Auditor`, repositories) so they can be unit-tested with
in-memory fakes. Prisma implementations are the only code that touches the
database. Every state change runs in one transaction and writes an audit row.
Errors are typed (`AppError` hierarchy) and every route is wrapped by
`withErrorHandling`, so clients always receive
`{ error: { code, message, details } }`.

## Deployment

See `../deployment/deploy-guide.md`. Summary: push `main` to GitHub; Vercel
builds with `node scripts/use-postgres-schema.mjs && npx prisma generate &&
npx prisma migrate deploy && next build`; set `DATABASE_URL` and `JWT_SECRET`
in the Vercel dashboard; root directory is `source`.

## Course concepts implemented here

| Concept | File |
|---------|------|
| OO design refined to code | `src/lib/domain/` |
| Error/exception handling | `src/lib/errors.ts`, `src/lib/response.ts` |
| Robust input checks | `src/lib/validation.ts`, `src/lib/domain/rules/` |
| Fault tolerance | `src/lib/retry.ts`, `src/lib/domain/ReportService.ts` |
| Refactoring | `src/lib/domain/LeaveBalancePolicy.ts` (vs `legacy/`) |
| Legacy code / salvaging | `src/lib/domain/legacy/` |
| Configuration & releases | `vercel.json`, `../deployment/` |
| Tests & reviews | `tests/`, `../reviews/` |
