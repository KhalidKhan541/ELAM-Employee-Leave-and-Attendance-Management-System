# Test Report — final run, 2026-11-21

## 1. Summary

| Metric | Result | Target | Met |
|--------|--------|--------|-----|
| Automated tests executed | 42 | — | — |
| Tests passed | 42 | 100% | Yes |
| Tests failed | 0 | 0 | Yes |
| Domain statement coverage | 93.76% | ≥ 80% | Yes |
| Domain branch coverage | 77.77% | — | Informational |
| Severity-1 open defects | 0 | 0 | Yes |
| Severity-2 open defects | 2 (documented, deferred) | ≤ 3 | Yes |

Command: `cd source && npm run test:coverage`

## 2. Results by suite

| Suite | Tests | Result |
|-------|-------|--------|
| `tests/unit/working-day.test.ts` | 5 | Pass |
| `tests/unit/leave-balance.test.ts` | 6 | Pass |
| `tests/unit/leave-request.test.ts` | 9 | Pass |
| `tests/unit/attendance.test.ts` | 5 | Pass |
| `tests/unit/legacy-payroll.test.ts` | 5 | Pass |
| `tests/unit/report-fault.test.ts` | 5 | Pass |
| `tests/fault/retry.test.ts` | 4 | Pass |
| `tests/integration/database.test.ts` | 3 | Pass |

## 3. Coverage by file

| File | Statements | Branches | Functions |
|------|-----------|----------|-----------|
| `AttendanceService.ts` | 89.33% | 72.22% | 75% |
| `LeaveBalancePolicy.ts` | 91.48% | 80% | 100% |
| `LeaveRequestService.ts` | 96.64% | 73.91% | 87.5% |
| `PayrollCalculator.ts` | 96.07% | 84.61% | 100% |
| `ReportService.ts` | 96.29% | 72.22% | 100% |
| `WorkingDayCalendar.ts` | 90.69% | 91.66% | 85.71% |
| `rules/*` | 91.04% | 83.33% | 100% |
| **Overall** | **93.76%** | **77.77%** | **93.18%** |

Legacy files are excluded from the coverage gate by design: they are
characterised by dedicated tests but are not modified (see `../docs/07`).

## 4. Defects found by testing

| Defect | Found by | Fixed | Regression test |
|--------|----------|-------|-----------------|
| DEF-003 weekends counted as leave days | Unit test TC-33 | Yes | `leave-balance.test.ts` |
| DEF-005 manager could approve at HR stage | Peer review + TC-34 | Yes | `leave-request.test.ts` |

## 5. System / manual verification

A Selenium script (`../report/capture_screenshots.py`) logged in as all three
roles and visited the main screens. All pages rendered without console errors;
screenshots are in `../report/screenshots/` and embedded in Chapter 5 of the
report.

## 6. Known limitations

* Browser-level accessibility audit was not automated (only keyboard labels
  and contrast were checked manually).
* PostgreSQL-specific behaviour is verified only by the Vercel smoke test,
  not by the local test suite.
