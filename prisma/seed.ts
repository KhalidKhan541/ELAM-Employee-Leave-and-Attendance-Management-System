/**
 * Deterministic demo data — the single source of truth for local dev, tests
 * and the sample SQL export. Run with: npm run db:seed
 *
 * Every employee has a personal email: FirstNameLastName@elam.com
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { emailFromName } from '../src/lib/email';

const prisma = new PrismaClient();
const YEAR = 2026;

const at = (day: number, hour = 0, minute = 0) => new Date(Date.UTC(YEAR, 10, day, hour, minute));

const DEMO = [
  { id: 'emp-hr', name: 'Hina Rahman', dept: 'dept-hr', role: 'HR' },
  { id: 'emp-mgr', name: 'Imran Sheikh', dept: 'dept-eng', role: 'MANAGER' },
  { id: 'emp-1', name: 'Khalid Khan', dept: 'dept-eng', role: 'EMPLOYEE' },
  { id: 'emp-2', name: 'Javed Ali', dept: 'dept-eng', role: 'EMPLOYEE' },
  { id: 'emp-3', name: 'Saad Ahmad', dept: 'dept-ops', role: 'EMPLOYEE' },
  { id: 'emp-4', name: 'Sara Ahmed', dept: 'dept-hr', role: 'EMPLOYEE' },
] as const;

async function main() {
  const passwordHash = await bcrypt.hash('Password123!', 10);

  // Hosted deployments seed on every build. If data already exists, only sync
  // the demo account emails/passwords — never wipe real records.
  const existingCount = await prisma.employee.count();
  if (existingCount > 0) {
    let synced = 0;
    for (const demo of DEMO) {
      const found = await prisma.employee.findUnique({ where: { id: demo.id } });
      if (!found) continue;
      const email = emailFromName(demo.name);
      if (found.email !== email) {
        await prisma.employee.update({ where: { id: demo.id }, data: { email } });
        synced++;
      }
      await prisma.userAccount.upsert({
        where: { employeeId: demo.id },
        create: { employeeId: demo.id, passwordHash },
        update: { passwordHash },
      });
    }
    console.log(`Seed skipped (data present); synced ${synced} demo email(s).`);
    return;
  }

  await prisma.auditLog.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.leaveBalance.deleteMany();
  await prisma.userAccount.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.leaveType.deleteMany();
  await prisma.department.deleteMany();

  const hrDept = await prisma.department.create({ data: { id: 'dept-hr', name: 'Human Resources' } });
  const engDept = await prisma.department.create({ data: { id: 'dept-eng', name: 'Engineering' } });
  const opsDept = await prisma.department.create({ data: { id: 'dept-ops', name: 'Operations' } });

  for (const demo of DEMO) {
    await prisma.employee.create({
      data: {
        id: demo.id,
        email: emailFromName(demo.name),
        fullName: demo.name,
        departmentId: demo.dept,
        joiningDate: new Date(Date.UTC(2023, 0, 15)),
        role: demo.role,
        active: true,
        userAccount: { create: { passwordHash } },
      },
    });
  }
  await prisma.department.update({ where: { id: engDept.id }, data: { managerId: 'emp-mgr' } });
  await prisma.department.update({ where: { id: hrDept.id }, data: { managerId: 'emp-hr' } });
  void opsDept;

  const leaveTypes = [
    { id: 'lt-casual', code: 'CASUAL', name: 'Casual Leave', annualAllowance: 12, carryForwardCap: 3, requiresHR: false },
    { id: 'lt-sick', code: 'SICK', name: 'Sick Leave', annualAllowance: 10, carryForwardCap: 2, requiresHR: false },
    { id: 'lt-earned', code: 'EARNED', name: 'Earned Leave', annualAllowance: 15, carryForwardCap: 5, requiresHR: true },
  ];
  for (const type of leaveTypes) await prisma.leaveType.create({ data: type });

  for (const demo of DEMO) {
    for (const type of leaveTypes) {
      await prisma.leaveBalance.create({
        data: {
          employeeId: demo.id,
          leaveTypeId: type.id,
          year: YEAR,
          opening: 0,
          carriedIn: type.code === 'CASUAL' ? 2 : 0,
          accrued: Math.floor(type.annualAllowance / 12) * 8,
          used: demo.id === 'emp-2' && type.code === 'SICK' ? 3 : 0,
          reserved: 0,
        },
      });
    }
  }

  const days = [3, 4, 5, 6, 9, 10, 11, 12, 13, 16, 17, 18, 19, 20];
  for (const demo of DEMO) {
    for (const day of days) {
      const late = demo.id === 'emp-3' && day === 13;
      const checkIn = at(day, late ? 9 : 8, late ? 45 : 55);
      await prisma.attendanceRecord.create({
        data: {
          employeeId: demo.id,
          date: at(day),
          checkIn,
          checkOut: at(day, 17, 30),
          status: 'COMPLETE',
          late,
          hours: 8.5,
        },
      });
    }
  }

  await prisma.leaveRequest.createMany({
    data: [
      { id: 'lr-1', employeeId: 'emp-1', leaveTypeId: 'lt-casual', startDate: at(23), endDate: at(24), reason: 'Family event at home', workingDays: 2, status: 'PENDING_MANAGER' },
      { id: 'lr-2', employeeId: 'emp-2', leaveTypeId: 'lt-sick', startDate: at(16), endDate: at(18), reason: 'Medical appointment and recovery', workingDays: 3, status: 'APPROVED', decidedBy: 'emp-mgr', decisionComment: 'Approved' },
      { id: 'lr-3', employeeId: 'emp-3', leaveTypeId: 'lt-earned', startDate: at(25), endDate: at(27), reason: 'Personal work', workingDays: 3, status: 'PENDING_MANAGER' },
      { id: 'lr-4', employeeId: 'emp-1', leaveTypeId: 'lt-earned', startDate: new Date(Date.UTC(YEAR, 11, 1)), endDate: new Date(Date.UTC(YEAR, 11, 4)), reason: 'Annual vacation (4 days)', workingDays: 4, status: 'PENDING_HR' },
    ],
  });

  await prisma.auditLog.createMany({
    data: [
      { actorId: 'emp-hr', action: 'EMPLOYEE_CREATED', entity: 'Employee', entityId: 'emp-1', newValue: '{"role":"EMPLOYEE"}' },
      { actorId: 'emp-mgr', action: 'LEAVE_APPROVED', entity: 'LeaveRequest', entityId: 'lr-2', oldValue: '{"status":"PENDING_MANAGER"}', newValue: '{"status":"APPROVED"}' },
      { actorId: 'emp-1', action: 'LEAVE_SUBMITTED', entity: 'LeaveRequest', entityId: 'lr-1', newValue: '{"workingDays":2}' },
    ],
  });

  console.log('Seed complete: 6 employees with personal @elam.com emails, 3 leave types, 84 attendance rows, 4 leave requests.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
