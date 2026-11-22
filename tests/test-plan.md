# Test Plan — ELAM v1.2

## 1. Purpose and scope

This plan defines how we verify that the functional and non-functional
requirements in `../docs/02-requirements-specification.md` are satisfied. It
covers unit, integration, system and fault testing plus the defect process.

## 2. Test levels

| Level | Scope | Tool | Location |
|-------|-------|------|----------|
| Unit | Pure domain classes and rules | Vitest | `../source/tests/unit/` |
| Integration | Services with real SQLite | Vitest + Prisma | `../source/tests/integration/` |
| System | End-to-end user journeys | Selenium (manual script) | `../report/capture_screenshots.py`, `system/` |
| Fault | Retry, invalid inputs, partial failure | Vitest | `../source/tests/fault/` |

## 3. Entry and exit criteria

**Entry:** branch compiles (`npm run typecheck`), feature complete, test cases
written before or with the code.

**Exit:** all tests pass; domain coverage ≥ 80%; no open severity-1 defect;
each requirement in the traceability matrix has at least one passing test.

## 4. Test environment

* Node 22+, SQLite `test.db` created by `tests/globalSetup.ts`.
* Deterministic clock injected as `Clock` so date-dependent tests are stable.
* Seed data created per test in `beforeEach` — no cross-test dependency.
* Demo accounts: `employee@elams.test`, `manager@elams.test`, `hr@elams.test`
  with password `Password123!`.

## 5. Commands

```bash
cd source
npm test                 # all tests
npm run test:coverage    # coverage report
```

## 6. Defect process

A failing test is logged in `../reviews/defect-log.md` with an id, severity,
steps to reproduce and owner. Severity 1 (blocker) must be fixed before the
iteration can close. The fix requires a regression test that fails on the old code.

## 7. Risks

* Date/timezone differences between local and Vercel — mitigated by using UTC
  everywhere and a fixed clock in tests.
* Hosted PostgreSQL behaves slightly differently from SQLite — mitigated by
  keeping Prisma models provider-agnostic and running a smoke test after deploy.
