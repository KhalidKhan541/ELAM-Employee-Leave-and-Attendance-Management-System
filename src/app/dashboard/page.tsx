import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { StatCard } from '@/components/StatCard';
import { StatusPill } from '@/components/StatusPill';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createRepos } from '@/lib/repositories';
import { leaveService } from '@/lib/services';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await requireUser();
  const repos = createRepos(prisma);
  const privileged = session.role === 'HR' || session.role === 'MANAGER';

  const [requests, balances, today, employees, leaveTypes] = await Promise.all([
    leaveService.list(privileged ? {} : { employeeId: session.sub }),
    repos.balances.listForEmployee(session.sub, new Date().getUTCFullYear()),
    repos.attendance.findByEmployeeAndDate(
      session.sub,
      new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate())),
    ),
    repos.employees.list(),
    repos.leaveTypes.list(),
  ]);
  const employeeNames = new Map(employees.map((employee) => [employee.id, employee.fullName]));
  const typeNames = new Map(leaveTypes.map((type) => [type.id, type.name]));

  const available = balances.reduce((sum, balance) => sum + balance.opening + balance.carriedIn + balance.accrued - balance.used - balance.reserved, 0);
  const pending = requests.filter((request) => request.status.startsWith('PENDING'));
  const approved = requests.filter((request) => request.status === 'APPROVED');

  return (
    <AppShell session={session} title="Overview" subtitle="A quick view of where things stand today">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Available leave" value={`${available} days`} hint="Across all leave types" />
        <StatCard label="Pending requests" value={pending.length} hint={privileged ? 'Across the organisation' : 'Your requests'} />
        <StatCard label="Approved leave" value={approved.length} hint="All time" />
        <StatCard
          label="Today's attendance"
          value={today?.checkOut ? 'Complete' : today?.checkIn ? 'Checked in' : 'Not recorded'}
          hint={today?.late ? 'Marked late today' : 'Threshold 09:30'}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <section className="card">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="card-title">Recent leave requests</h2>
              <p className="mt-0.5 text-xs text-slate-500">Newest first</p>
            </div>
            <Link href="/leave" className="text-xs font-medium text-accent-700 hover:underline">View all</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Type</th>
                  <th>Dates</th>
                  <th>Days</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {requests.slice(0, 6).map((request) => (
                  <tr key={request.id}>
                    <td className="font-medium">{privileged ? employeeNames.get(request.employeeId) ?? request.employeeId : 'You'}</td>
                    <td>{typeNames.get(request.leaveTypeId) ?? request.leaveTypeId}</td>
                    <td className="tabular-nums">
                      {request.startDate.toISOString().slice(0, 10)} → {request.endDate.toISOString().slice(0, 10)}
                    </td>
                    <td className="tabular-nums">{request.workingDays}</td>
                    <td><StatusPill status={request.status} /></td>
                  </tr>
                ))}
                {requests.length === 0 && (
                  <tr><td colSpan={5} className="py-8 text-center text-slate-400">No requests yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card p-5">
          <h2 className="card-title">Quick actions</h2>
          <p className="mt-1 text-xs text-slate-500">The two things people use most.</p>
          <div className="mt-5 space-y-3">
            <Link href="/attendance" className="flex items-center justify-between rounded-md border border-slate-200 px-4 py-3 hover:border-accent-500 hover:bg-accent-50/40">
              <span className="text-sm font-medium">Record attendance</span>
              <span className="text-xs text-accent-700">Open →</span>
            </Link>
            <Link href="/leave/new" className="flex items-center justify-between rounded-md border border-slate-200 px-4 py-3 hover:border-accent-500 hover:bg-accent-50/40">
              <span className="text-sm font-medium">Apply for leave</span>
              <span className="text-xs text-accent-700">Open →</span>
            </Link>
            {privileged && (
              <Link href="/approvals" className="flex items-center justify-between rounded-md border border-slate-200 px-4 py-3 hover:border-accent-500 hover:bg-accent-50/40">
                <span className="text-sm font-medium">Review approvals</span>
                <span className="text-xs text-accent-700">{pending.length} waiting →</span>
              </Link>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
