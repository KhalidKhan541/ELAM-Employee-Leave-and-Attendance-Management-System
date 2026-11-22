import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { requireRole } from '@/lib/auth';
import { reportService } from '@/lib/services';

export const dynamic = 'force-dynamic';

type Tab = 'attendance' | 'leave' | 'payroll';

function currentMonth() {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; type?: string }>;
}) {
  const session = await requireRole('MANAGER', 'HR');
  const params = await searchParams;
  const tab: Tab = (['attendance', 'leave', 'payroll'] as const).includes(params.type as Tab)
    ? (params.type as Tab)
    : 'attendance';
  const month = params.month ?? currentMonth();

  const result =
    tab === 'attendance'
      ? await reportService.attendanceSummary(month)
      : tab === 'leave'
        ? await reportService.leaveUtilisation(
            new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5)) - 1, 1)),
            new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5)), 0)),
          )
        : await reportService.payroll(month);

  const tabs: { key: Tab; label: string }[] = [
    { key: 'attendance', label: 'Attendance summary' },
    { key: 'leave', label: 'Leave utilisation' },
    { key: 'payroll', label: 'Payroll' },
  ];

  return (
    <AppShell session={session} title="HR reports" subtitle="Aggregated views for management decisions">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {tabs.map((item) => (
            <Link
              key={item.key}
              href={`/reports?type=${item.key}&month=${month}`}
              className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                tab === item.key
                  ? 'border-accent-600 bg-accent-600 text-white'
                  : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
        <form className="flex items-end gap-3" action="/reports">
          <input type="hidden" name="type" value={tab} />
          <div>
            <label className="label" htmlFor="month">Month</label>
            <input className="input" id="month" name="month" type="month" defaultValue={month} />
          </div>
          <button className="btn-secondary" type="submit">View</button>
        </form>
      </div>

      {result.warnings.length > 0 && (
        <p className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {result.warnings.join(' ')} The rest of the application is unaffected.
        </p>
      )}

      <div className="mb-4 flex justify-end">
        <a className="btn-secondary" href={`/api/reports/summary?type=${tab}&month=${month}&format=csv`}>Export CSV</a>
      </div>

      <section className="card">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="card-title">{tabs.find((item) => item.key === tab)?.label} · {month}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                {({
                  attendance: ['Employee', 'Present days', 'Late days', 'Total hours'],
                  leave: ['Leave type', 'Department', 'Requests', 'Days'],
                  payroll: ['Employee', 'Working days', 'Present', 'Late', 'Approved leave', 'Net payable days'],
                }[tab]).map((heading) => <th key={heading}>{heading}</th>)}
              </tr>
            </thead>
            <tbody>
              {result.rows.map((row, index) => (
                <tr key={index}>
                  {Object.values(row).map((value, cellIndex) => (
                    <td key={cellIndex} className="tabular-nums">{String(value)}</td>
                  ))}
                </tr>
              ))}
              {result.rows.length === 0 && (
                <tr><td colSpan={6} className="py-8 text-center text-slate-400">No data for this month.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
