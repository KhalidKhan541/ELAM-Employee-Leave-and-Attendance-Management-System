import { requireUser } from '@/lib/auth';
import { attendanceService } from '@/lib/services';
import { handle, ok } from '@/lib/response';
import { attendanceSchema, parse, parseQuery, reportQuerySchema } from '@/lib/validation';

export async function GET(request: Request) {
  return handle(async () => {
    const session = await requireUser();
    const url = new URL(request.url);
    const query = parseQuery(reportQuerySchema, Object.fromEntries(url.searchParams));
    const isPrivileged = session.role === 'HR' || session.role === 'MANAGER';
    const rows = await attendanceService.list({
      employeeId: isPrivileged ? undefined : session.sub,
      from: query.from,
      to: query.to,
      departmentId: isPrivileged ? query.departmentId : undefined,
    });
    return ok(rows);
  });
}

export async function POST(request: Request) {
  return handle(async () => {
    const session = await requireUser();
    const input = parse(attendanceSchema, await request.json());
    const record =
      input.action === 'CHECK_IN'
        ? await attendanceService.checkIn(session.sub)
        : await attendanceService.checkOut(session.sub);
    return ok(record, 201);
  });
}
