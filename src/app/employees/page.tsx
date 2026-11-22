import { AppShell } from '@/components/AppShell';
import { EmployeeForm } from '@/components/EmployeeForm';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createRepos } from '@/lib/repositories';

export const dynamic = 'force-dynamic';

export default async function EmployeesPage() {
  const session = await requireRole('HR');
  const repos = createRepos(prisma);
  const [employees, departments] = await Promise.all([
    repos.employees.list(),
    prisma.department.findMany({ orderBy: { name: 'asc' } }),
  ]);
  const departmentNames = new Map(departments.map((department) => [department.id, department.name]));

  return (
    <AppShell session={session} title="Employees" subtitle="Master records and access roles">
      <div className="mb-6 flex justify-end">
        <EmployeeForm departments={departments.map((department) => ({ id: department.id, name: department.name }))} />
      </div>

      <section className="card">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="card-title">Employee directory</h2>
          <p className="mt-0.5 text-xs text-slate-500">{employees.length} record(s)</p>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Department</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <tr key={employee.id}>
                  <td className="font-medium">{employee.fullName}</td>
                  <td className="text-slate-500">{employee.email}</td>
                  <td>{departmentNames.get(employee.departmentId) ?? employee.departmentId}</td>
                  <td><span className="pill bg-slate-100 text-slate-700 ring-1 ring-slate-200">{employee.role}</span></td>
                  <td className="tabular-nums">{employee.joiningDate.toISOString().slice(0, 10)}</td>
                  <td>
                    <span className={`pill ${employee.active ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'bg-rose-50 text-rose-700 ring-1 ring-rose-200'}`}>
                      {employee.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
