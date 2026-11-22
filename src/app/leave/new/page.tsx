import { AppShell } from '@/components/AppShell';
import { LeaveForm } from '@/components/LeaveForm';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createRepos } from '@/lib/repositories';

export const dynamic = 'force-dynamic';

export default async function NewLeavePage() {
  const session = await requireUser();
  const repos = createRepos(prisma);
  const [types, balances] = await Promise.all([
    repos.leaveTypes.list(),
    repos.balances.listForEmployee(session.sub, new Date().getUTCFullYear()),
  ]);

  const options = types.map((type) => {
    const balance = balances.find((item) => item.leaveTypeId === type.id);
    const available = balance
      ? balance.opening + balance.carriedIn + balance.accrued - balance.used - balance.reserved
      : 0;
    return { id: type.id, name: type.name, available };
  });

  return (
    <AppShell session={session} title="Apply for leave" subtitle="Check the balance, choose dates, add a reason">
      <div className="mb-6">
        <p className="max-w-2xl text-sm leading-relaxed text-slate-600">
          Only working days (Monday to Friday) count towards your balance. Requests longer than three
          working days are routed to HR after your manager approves them.
        </p>
      </div>
      <LeaveForm types={options} />
    </AppShell>
  );
}
