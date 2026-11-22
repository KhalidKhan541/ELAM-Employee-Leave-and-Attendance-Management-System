import { cookies } from 'next/headers';
import { createToken, SESSION_COOKIE, verifyPassword } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { AuthenticationError } from '@/lib/errors';
import { handle, ok } from '@/lib/response';
import { createRepos } from '@/lib/repositories';
import { loginSchema, parse } from '@/lib/validation';

export async function POST(request: Request) {
  return handle(async () => {
    const input = parse(loginSchema, await request.json());
    const employee = await createRepos(prisma).employees.findByEmail(input.email);
    if (!employee || !(await verifyPassword(input.password, employee.passwordHash))) {
      throw new AuthenticationError('Invalid email or password');
    }
    if (!employee.active) throw new AuthenticationError('This account has been deactivated');

    const token = await createToken({
      sub: employee.id,
      role: employee.role,
      name: employee.fullName,
      email: employee.email,
      departmentId: employee.departmentId,
    });
    const store = await cookies();
    store.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 8,
    });
    await prisma.userAccount.update({
      where: { employeeId: employee.id },
      data: { lastLoginAt: new Date() },
    });
    return ok({ name: employee.fullName, role: employee.role });
  });
}
