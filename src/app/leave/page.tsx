import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { CancelButton } from '@/components/CancelButton';
import { StatusPill } from '@/components/StatusPill';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createRepos } from '@/lib/repositories';
import { leaveService } from '@/lib/services';

export const dynamic = 'force-dynamic';

export default async function LeavePage() {
  const session = await requireUser();
  const repos = createRepos(prisma);
  const privileged = session.role === 'HR' || session.role === 'MANAGER';

  const [requests, balances, types, employees] = await Promise.all([
    leaveService.list(privileged ? {} : { employeeId: session.sub }),
    repos.balances.listForEmployee(session.sub, new Date().getUTCFullYear()),
    repos.leaveTypes.list(),
    repos.employees.list(),
  ]);
  const typeNames = new Map(types.map((type) => [type.id, type.name]));
  const employeeNames = new Map(employees.map((employee) => [employee.id, employee.fullName]));

  return (
    <AppShell session={session} title="My leave" subtitle="Requests and remaining balances">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-ink">Leave requests</h2>
          <p className="mt-1 text-xs text-slate-500">Balances are deducted when a request is finally approved.</p>
        </div>
        <Link href="/leave/new" className="btn-primary">Apply for leave</Link>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {balances.map((balance) => {
          const available = balance.opening + balance.carriedIn + balance.accrued - balance.used - balance.reserved;
          const type = types.find((item) => item.id === balance.leaveTypeId);
          return (
            <div className="card px-5 py-4" key={balance.id}>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{type?.name ?? balance.leaveTypeId}</div>
              <div className="stat-value">{available} <span className="text-sm font-normal text-slate-500">days</span></div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-accent-600"
                  style={{ width: `${Math.min(100, (available / Math.max(type?.annualAllowance ?? 1, 1)) * 100)}%` }}
                />
              </div>
              <div className="mt-2 text-[11px] text-slate-500">{balance.used} used · {balance.accrued} accrued</div>
            </div>
          );
        })}
      </div>

      <section className="card">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="card-title">History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Type</th>
                <th>From</th>
                <th>To</th>
                <th>Days</th>
                <th>Reason</th>
                <th>Status</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.id}>
                  <td className="font-medium">{privileged ? employeeNames.get(request.employeeId) ?? request.employeeId : 'You'}</td>
                  <td>{typeNames.get(request.leaveTypeId) ?? request.leaveTypeId}</td>
                  <td className="tabular-nums">{request.startDate.toISOString().slice(0, 10)}</td>
                  <td className="tabular-nums">{request.endDate.toISOString().slice(0, 10)}</td>
                  <td className="tabular-nums">{request.workingDays}</td>
                  <td className="max-w-xs truncate text-slate-500">{request.reason}</td>
                  <td><StatusPill status={request.status} /></td>
                  <td>
                    {(request.status === 'PENDING_MANAGER' || request.status === 'PENDING_HR') &&
                    (request.employeeId === session.sub || session.role === 'HR') ? (
                      <CancelButton requestId={request.id} />
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {requests.length === 0 && (
                <tr><td colSpan={8} className="py-8 text-center text-slate-400">No leave requests yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
