import bcrypt from 'bcryptjs';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { ConflictError } from '@/lib/errors';
import { emailFromName } from '@/lib/email';
import { handle, ok } from '@/lib/response';
import { createRepos } from '@/lib/repositories';
import { employeeSchema, parse } from '@/lib/validation';

export async function GET() {
  return handle(async () => {
    await requireRole('HR', 'MANAGER');
    return ok(await createRepos(prisma).employees.list());
  });
}

export async function POST(request: Request) {
  return handle(async () => {
    await requireRole('HR');
    const body = await request.json();
    if (!body.email && typeof body.fullName === 'string') {
      body.email = emailFromName(body.fullName);
    }
    const input = parse(employeeSchema, body);
    const existing = await prisma.employee.findUnique({ where: { email: input.email } });
    if (existing) throw new ConflictError('EMPLOYEE_EMAIL_EXISTS', 'An employee with this email already exists');
    const passwordHash = await bcrypt.hash('Password123!', 10);
    const created = await createRepos(prisma).employees.create({ ...input, passwordHash });
    return ok(created, 201);
  });
}
