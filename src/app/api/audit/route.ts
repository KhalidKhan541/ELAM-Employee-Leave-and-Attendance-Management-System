import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { handle, ok } from '@/lib/response';
import { createRepos } from '@/lib/repositories';

export async function GET() {
  return handle(async () => {
    await requireRole('HR');
    return ok(await createRepos(prisma).audit.list(200));
  });
}
