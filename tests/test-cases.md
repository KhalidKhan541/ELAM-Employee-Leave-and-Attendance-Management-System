# Test Cases — ELAM v1.2

Ids match `../docs/08-testing-and-review-plan.md` and the automated tests in
`../source/tests/`. "Pass" is the result of the final run on 2026-11-21.

| TC-ID | Level | Precondition / input | Expected result | Req | Result |
|-------|-------|----------------------|-----------------|-----|--------|
| TC-01 | Unit | `countWorkingDays(Fri 20, Sun 22 Nov)` | 1 | R3 | Pass |
| TC-02 | Unit | `available({opening:2,used:3})` | −1 (policy exposes; service blocks) | INV-4 | Pass |
| TC-03 | Unit | Submit 3-day leave, balance 2 | `LEAVE_INSUFFICIENT_BALANCE` | FR-20 | Pass |
| TC-04 | Unit | Overlapping pending request exists | `LEAVE_OVERLAP` | FR-21 | Pass |
| TC-05 | Unit | `REJECTED → APPROVED` | `LEAVE_INVALID_TRANSITION` | INV-5 | Pass |
| TC-06 | Unit | 4-day leave approved by manager | `PENDING_HR`, balance unchanged | FR-23 | Pass |
| TC-07 | Integration | Valid login credentials | 200 + httpOnly cookie, no password in body | FR-01 | Pass (manual demo) |
| TC-08 | Integration | Second check-in same day | 409 `ATTENDANCE_ALREADY_CHECKED_IN` | FR-13 | Pass |
| TC-09 | Integration | Employee reads `/employees` | 403 / redirect to dashboard | FR-05 | Pass (manual demo) |
| TC-10 | Integration | Approve request | request APPROVED, balance −days, 2 audit rows | FR-24 | Pass |
| TC-11 | Fault | Repository throws P2034 once | retry succeeds, 2 calls | NFR-03 | Pass |
| TC-12 | Fault | Repository throws P2034 twice | error after 3 calls | NFR-03 | Pass |
| TC-13 | Fault | Report query throws | 200 with warnings, no crash | FR-32 | Pass |
| TC-14 | Unit | Legacy hours `(8.5)` | −8.5 | legacy | Pass |
| TC-15 | Unit | Legacy row with no employee id | row skipped, no throw | legacy | Pass |
| TC-16 | Integration | Create employee with unique email | record created | FR-06 | Pass (manual demo) |
| TC-17 | Unit | Duplicate email | `EMPLOYEE_EMAIL_EXISTS` | FR-08 | Pass (code review) |
| TC-19 | Unit | Check-out without check-in | 409 `ATTENDANCE_NOT_CHECKED_IN` | FR-14 | Pass |
| TC-20 | Unit | Check-out after check-in | hours computed, status COMPLETE | FR-11 | Pass |
| TC-21 | Unit | Attendance list filter by date range | only matching rows | FR-15 | Pass |
| TC-22 | Unit | Check-in 09:45 | `late = true` | FR-15a | Pass |
| TC-23 | Unit | Balance accrual for 4 months of 12 days | accrued 4, capped carry-forward | FR-16 | Pass |
| TC-24 | Unit | Leave type annual allowance 12 | monthly accrual 1 | FR-17 | Pass |
| TC-25 | Unit | Start date before today | `LEAVE_PAST_DATE` | FR-19 | Pass |
| TC-26 | Unit | Manager approves 2-day leave | APPROVED directly | FR-22 | Pass |
| TC-27 | Unit | Owner cancels pending request | CANCELLED, no balance change | FR-25 | Pass |
| TC-28 | Unit | Attendance summary groups per employee | one row per employee | FR-26 | Pass |
| TC-29 | Unit | Leave utilisation groups by type/dept | correct counts and days | FR-27 | Pass |
| TC-30 | Unit | Payroll includes approved leave days | net payable days correct | FR-28 | Pass |
| TC-31 | Integration | `?format=csv` | CSV with quoted header row | FR-29 | Pass (manual demo) |
| TC-32 | Unit | Unknown error in route | 500 `INTERNAL_ERROR`, no stack in body | FR-31 | Pass (code review) |
| TC-33 | Unit | Weekend-only leave range | 0 days, `LEAVE_INVALID_DAYS` | R3 | Pass |
| TC-34 | Integration | Manager approves HR-stage request | `FORBIDDEN` | FR-23 | Pass (regression for CR-01 bug) |

## Regression findings

* **TC-33** was added after the refactor of `BalanceCalculator.legacy.ts` exposed
  that weekends had been counted as leave days. It is the regression test for
  that defect (DEF-003).
* **TC-34** was added after peer review R-06 found that a manager could still
  approve a request at `PENDING_HR`. The service was fixed; the test is retained.
