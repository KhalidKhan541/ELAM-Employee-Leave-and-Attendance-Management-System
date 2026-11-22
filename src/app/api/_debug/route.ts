import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const employees = await prisma.employee.findMany({ select: { fullName: true, email: true } });
  return NextResponse.json({ count: employees.length, employees });
}
