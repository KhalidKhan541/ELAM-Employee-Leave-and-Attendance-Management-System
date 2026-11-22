import { AppShell } from '@/components/AppShell';
import { requireRole } from '@/lib/auth';
import { reportService } from '@/lib/services';

export const dynamic = 'force-dynamic';

function currentMonth() {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
}

export default async function PayrollPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const session = await requireRole('MANAGER', 'HR');
  const { month: requested } = await searchParams;
  const month = requested ?? currentMonth();
  const result = await reportService.payroll(month);

  return (
    <AppShell session={session} title="Payroll" subtitle="Derived from attendance and approved leave">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <form className="flex items-end gap-3" action="/payroll">
          <div>
            <label className="label" htmlFor="month">Month</label>
            <input className="input" id="month" name="month" type="month" defaultValue={month} />
          </div>
          <button className="btn-secondary" type="submit">View</button>
        </form>
        <a className="btn-primary" href={`/api/reports/summary?type=payroll&month=${month}&format=csv`}>
          Export CSV
        </a>
      </div>

      {result.warnings.length > 0 && (
        <p className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {result.warnings.join(' ')}
        </p>
      )}

      <section className="card">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="card-title">Payroll summary · {month}</h2>
          <p className="mt-0.5 text-xs text-slate-500">Net payable days = present days + approved leave days, capped at working days.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Working days</th>
                <th>Present</th>
                <th>Late</th>
                <th>Approved leave</th>
                <th>Net payable days</th>
              </tr>
            </thead>
            <tbody>
              {result.rows.map((row) => (
                <tr key={row.employeeId}>
                  <td className="font-medium">{row.employeeName}</td>
                  <td className="tabular-nums">{row.workingDays}</td>
                  <td className="tabular-nums">{row.presentDays}</td>
                  <td className="tabular-nums">{row.lateDays}</td>
                  <td className="tabular-nums">{row.approvedLeaveDays}</td>
                  <td className="font-semibold tabular-nums text-accent-700">{row.netPayableDays}</td>
                </tr>
              ))}
              {result.rows.length === 0 && (
                <tr><td colSpan={6} className="py-8 text-center text-slate-400">No payroll rows for this month.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
