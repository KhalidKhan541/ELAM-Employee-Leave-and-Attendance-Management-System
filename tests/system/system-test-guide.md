# System test guide

Run these journeys against a clean, seeded database.

## Setup

```bash
cd source
npm run db:reset
npm run dev
```

Demo password for all accounts: `Password123!`.

## Journey 1 — Employee applies for leave

1. Sign in as `employee@elams.test`.
2. Open **My leave → Apply for leave**.
3. Choose Casual Leave, pick two future working days, enter a reason, submit.
4. **Expected:** request appears with status "Awaiting manager"; balance is
   unchanged until approval.

## Journey 2 — Manager approves, then HR approves

1. Sign in as `manager@elams.test`, open **Approvals**.
2. Approve the 2-day request from Journey 1.
3. **Expected:** status becomes Approved and the employee's balance drops by 2.
4. Sign in as `hr@elams.test`, approve the seed request `lr-4` (4 days).
4. **Expected:** HR-only requests are visible to HR; balance drops by 4 only
   after the HR decision.

## Journey 3 — Attendance rules

1. Sign in as employee, click **Check in** twice.
2. **Expected:** second attempt shows "You have already checked in today".
3. Click **Check out**.
4. **Expected:** status Complete and hours displayed.

## Journey 4 — Reports and payroll

1. Sign in as HR, open **HR reports** and switch between the three tabs.
2. **Expected:** tables render, month filter works, CSV export downloads.
3. Open **Payroll**, select the seed month, export CSV.

## Journey 5 — Access control

1. Sign in as employee and navigate directly to `/employees`.
2. **Expected:** redirected to `/dashboard?error=forbidden`.

Each journey was executed on 2026-11-21; results are in `../test-report.md` and
screenshots in `../../report/screenshots/`.
