# Backup and restore drill — 2026-11-20

## Objective

Verify that a backup can be restored into a staging database and that the
application works against the restored data (NFR-09).

## Steps performed

1. Seeded a clean database with `npm run db:reset` (6 employees, 4 leave
   requests, 84 attendance rows).
2. Ran `./deployment/backup.sh` → `backups/backup-20261120-1730.db`.
3. Deleted the working `dev.db` to simulate data loss.
4. Ran `./deployment/restore.sh backups/backup-20261120-1730.db` with
   `STAGING_DATABASE_URL=file:./staging.db`.
5. Started the app with `DATABASE_URL=file:./staging.db` and signed in as the
   HR demo account.
6. Verified: 6 employees, 4 leave requests, 84 attendance rows, reports render.
7. Tested the guard: running `restore.sh <pg dump>` without
   `STAGING_DATABASE_URL` exited with code 1 (DEF-009 fix confirmed).

## Result

**Pass.** Restore took 4 seconds for the SQLite dataset. The guarded restore
refused to target production without an explicit staging URL and `--force`.

## Follow-up

Production backups must be stored in an external bucket (not in Git) and
retained for 7 daily + 4 weekly snapshots. The Vercel cron job calls
`backup.sh` nightly in the real deployment; this drill used the local script
with the same code path.
