import { AppShell } from '@/components/AppShell';
import { AttendancePanel } from '@/components/AttendancePanel';
import { StatusPill } from '@/components/StatusPill';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createRepos } from '@/lib/repositories';
import { attendanceService } from '@/lib/services';

export const dynamic = 'force-dynamic';

export default async function AttendancePage() {
  const session = await requireUser();
  const repos = createRepos(prisma);
  const privileged = session.role === 'HR' || session.role === 'MANAGER';

  const [rows, employees, today] = await Promise.all([
    attendanceService.list(privileged ? {} : { employeeId: session.sub }),
    repos.employees.list(),
    repos.attendance.findByEmployeeAndDate(
      session.sub,
      new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate())),
    ),
  ]);
  const names = new Map(employees.map((employee) => [employee.id, employee.fullName]));

  return (
    <AppShell session={session} title="Attendance" subtitle="Daily check-in and check-out records">
      <section className="card mb-6 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="card-title">Today · {new Date().toISOString().slice(0, 10)}</h2>
            <p className="mt-1 text-xs text-slate-500">A second check-in on the same day is rejected deliberately.</p>
          </div>
          <AttendancePanel hasRecord={Boolean(today)} checkedOut={Boolean(today?.checkOut)} />
        </div>
      </section>

      <section className="card">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="card-title">Recent records</h2>
          <p className="mt-0.5 text-xs text-slate-500">{rows.length} record(s) in total</p>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                {privileged && <th>Employee</th>}
                <th>Check in</th>
                <th>Check out</th>
                <th>Hours</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 40).map((row) => (
                <tr key={row.id}>
                  <td className="tabular-nums font-medium">{row.date.toISOString().slice(0, 10)}</td>
                  {privileged && <td>{names.get(row.employeeId) ?? row.employeeId}</td>}
                  <td className="tabular-nums">{row.checkIn ? new Date(row.checkIn).toISOString().slice(11, 16) : '—'}</td>
                  <td className="tabular-nums">{row.checkOut ? new Date(row.checkOut).toISOString().slice(11, 16) : '—'}</td>
                  <td className="tabular-nums">{row.hours ?? '—'}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <StatusPill status={row.status} />
                      {row.late && <span className="pill bg-amber-50 text-amber-700 ring-1 ring-amber-200">Late</span>}
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={privileged ? 6 : 5} className="py-8 text-center text-slate-400">No attendance records.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
