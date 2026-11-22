import { requireRole } from '@/lib/auth';
import { leaveService } from '@/lib/services';
import { handle, ok } from '@/lib/response';
import { decisionSchema, parse } from '@/lib/validation';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const session = await requireRole('MANAGER', 'HR');
    const { id } = await context.params;
    const input = parse(decisionSchema, await request.json());
    const updated = await leaveService.decide(
      id,
      { id: session.sub, role: session.role, departmentId: session.departmentId },
      input.decision,
      input.comment,
    );
    return ok(updated);
  });
}
