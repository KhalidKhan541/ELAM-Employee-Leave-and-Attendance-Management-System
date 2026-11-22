# Release notes — v1.2.0 (2026-11-21)

## Features

* Role-based sign-in for Employee, Manager and HR.
* Daily attendance check-in/out with duplicate, ordering and late checks.
* Leave types, balances, and monthly accrual with carry-forward caps.
* Two-step approval workflow for leave longer than three working days (CR-01).
* Payroll summary and HR reports with CSV export (CR-03).
* Append-only audit log for every state change.
* Fault-tolerant reporting: a failed report query shows a warning, not a crash.
* Light, information-first UI (CR-04).

## Fixes

* DEF-003 weekends no longer counted as leave days.
* DEF-004 duplicate check-in now rejected on the server.
* DEF-005 manager can no longer approve a request at the HR stage.
* DEF-006/007 cookie hardened and password hash removed from responses.
* DEF-009 restore script now requires staging and `--force`.

## Known issues

* DEF-011 (S3): a legacy export with an unexpected header yields no rows; a
  warning will be added in v1.3.
* PostgreSQL behaviour is covered only by the deployment smoke test, not the
  local Vitest suite.
* No native mobile app; the responsive web UI is the supported client.

## Upgrade notes

Run `prisma migrate deploy` before starting the new application version. The
v1.2 schema is unchanged from v1.1, so no data migration is required.

## Verification

* 42 automated tests pass; 93.76% domain statement coverage.
* Backup and restore drill completed on 2026-11-20 (see `backup-drill.md`).
* Vercel smoke test checklist in `deploy-guide.md` passed.
