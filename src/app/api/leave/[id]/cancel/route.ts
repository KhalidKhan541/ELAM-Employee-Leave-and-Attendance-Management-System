import { requireUser } from '@/lib/auth';
import { leaveService } from '@/lib/services';
import { handle, ok } from '@/lib/response';

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const session = await requireUser();
    const { id } = await context.params;
    const updated = await leaveService.cancel(id, {
      id: session.sub,
      role: session.role,
      departmentId: session.departmentId,
    });
    return ok(updated);
  });
}
