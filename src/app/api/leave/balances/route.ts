import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { handle, ok } from '@/lib/response';
import { createRepos } from '@/lib/repositories';

export async function GET(request: Request) {
  return handle(async () => {
    const session = await requireUser();
    const url = new URL(request.url);
    const employeeId = session.role === 'EMPLOYEE' ? session.sub : url.searchParams.get('employeeId') ?? session.sub;
    const year = Number(url.searchParams.get('year') ?? new Date().getUTCFullYear());
    const rows = await createRepos(prisma).balances.listForEmployee(employeeId, year);
    return ok(rows);
  });
}
