import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
export async function GET() {
  const accs = await prisma.userAccount.findMany({ select: { employeeId: true, passwordHash: true, lastLoginAt: true } });
  const emp = await prisma.employee.findUnique({ where: { email: 'KhalidKhan@elam.com' }, include: { userAccount: true } });
  let test = 'no emp';
  if (emp?.userAccount) test = String(await bcrypt.compare('Password123!', emp.userAccount.passwordHash));
  return NextResponse.json({ accounts: accs.length, empFound: !!emp, hashLen: emp?.userAccount?.passwordHash?.length ?? 0, bcryptMatch: test });
}
