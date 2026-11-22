import { requireUser } from '@/lib/auth';
import { leaveService } from '@/lib/services';
import { handle, ok } from '@/lib/response';
import { createLeaveSchema, parse, parseQuery, reportQuerySchema } from '@/lib/validation';

export async function GET(request: Request) {
  return handle(async () => {
    const session = await requireUser();
    const url = new URL(request.url);
    const query = parseQuery(reportQuerySchema, Object.fromEntries(url.searchParams));
    const rows = await leaveService.list({
      employeeId: session.role === 'EMPLOYEE' ? session.sub : undefined,
      departmentId: session.role === 'EMPLOYEE' ? undefined : query.departmentId,
    });
    return ok(rows);
  });
}

export async function POST(request: Request) {
  return handle(async () => {
    const session = await requireUser();
    const input = parse(createLeaveSchema, await request.json());
    const requestRecord = await leaveService.submit({
      employeeId: session.sub,
      leaveTypeId: input.leaveTypeId,
      startDate: input.startDate,
      endDate: input.endDate,
      reason: input.reason,
    });
    return ok(requestRecord, 201);
  });
}
