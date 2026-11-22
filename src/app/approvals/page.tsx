import { AppShell } from '@/components/AppShell';
import { DecisionButtons } from '@/components/DecisionButtons';
import { StatusPill } from '@/components/StatusPill';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createRepos } from '@/lib/repositories';
import { leaveService } from '@/lib/services';

export const dynamic = 'force-dynamic';

export default async function ApprovalsPage() {
  const session = await requireRole('MANAGER', 'HR');
  const repos = createRepos(prisma);

  const [allRequests, types, employees] = await Promise.all([
    leaveService.list(session.role === 'MANAGER' ? { departmentId: session.departmentId } : {}),
    repos.leaveTypes.list(),
    repos.employees.list(),
  ]);
  const queue = allRequests.filter((request) => request.status === 'PENDING_MANAGER' || request.status === 'PENDING_HR');
  const typeNames = new Map(types.map((type) => [type.id, type.name]));
  const employeeNames = new Map(employees.map((employee) => [employee.id, employee.fullName]));

  return (
    <AppShell session={session} title="Approvals" subtitle="Leave requests waiting for a decision">
      <section className="card">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="card-title">Approval queue</h2>
          <p className="mt-0.5 text-xs text-slate-500">{queue.length} request(s) awaiting action</p>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Type</th>
                <th>Dates</th>
                <th>Days</th>
                <th>Reason</th>
                <th>Stage</th>
                <th className="text-right">Decision</th>
              </tr>
            </thead>
            <tbody>
              {queue.map((request) => (
                <tr key={request.id}>
                  <td className="font-medium">{employeeNames.get(request.employeeId) ?? request.employeeId}</td>
                  <td>{typeNames.get(request.leaveTypeId) ?? request.leaveTypeId}</td>
                  <td className="tabular-nums">{request.startDate.toISOString().slice(0, 10)} → {request.endDate.toISOString().slice(0, 10)}</td>
                  <td className="tabular-nums">{request.workingDays}</td>
                  <td className="max-w-xs truncate text-slate-500">{request.reason}</td>
                  <td><StatusPill status={request.status} /></td>
                  <td className="text-right"><DecisionButtons requestId={request.id} /></td>
                </tr>
              ))}
              {queue.length === 0 && (
                <tr><td colSpan={7} className="py-10 text-center text-slate-400">Nothing waiting for you. Well done.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
