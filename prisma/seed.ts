/**
 * Deterministic demo data — the single source of truth for local dev, tests
 * and the sample SQL export. Run with: npm run db:seed
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const YEAR = 2026;

const at = (day: number, hour = 0, minute = 0) => new Date(Date.UTC(YEAR, 10, day, hour, minute));

async function main() {
  // Idempotent: hosted builds run the seed. Never wipe existing data on redeploy.
  const existing = await prisma.employee.count();
  if (existing > 0) {
    console.log(`Seed skipped: ${existing} employee(s) already present.`);
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

  const passwordHash = await bcrypt.hash('Password123!', 10);

  const hrDept = await prisma.department.create({ data: { id: 'dept-hr', name: 'Human Resources' } });
  const engDept = await prisma.department.create({ data: { id: 'dept-eng', name: 'Engineering' } });
  const opsDept = await prisma.department.create({ data: { id: 'dept-ops', name: 'Operations' } });

  const employees = [
    { id: 'emp-hr', email: 'hr@elams.test', fullName: 'Hina Rahman', departmentId: hrDept.id, role: 'HR' },
    { id: 'emp-mgr', email: 'manager@elams.test', fullName: 'Imran Sheikh', departmentId: engDept.id, role: 'MANAGER' },
    { id: 'emp-1', email: 'employee@elams.test', fullName: 'Khalid Khan', departmentId: engDept.id, role: 'EMPLOYEE' },
    { id: 'emp-2', email: 'javed@elams.test', fullName: 'Javed Ali', departmentId: engDept.id, role: 'EMPLOYEE' },
    { id: 'emp-3', email: 'saad@elams.test', fullName: 'Saad Ahmad', departmentId: opsDept.id, role: 'EMPLOYEE' },
    { id: 'emp-4', email: 'sara@elams.test', fullName: 'Sara Ahmed', departmentId: hrDept.id, role: 'EMPLOYEE' },
  ];

  for (const employee of employees) {
    await prisma.employee.create({
      data: {
        ...employee,
        joiningDate: new Date(Date.UTC(2023, 0, 15)),
        active: true,
        userAccount: { create: { passwordHash } },
      },
    });
  }
  await prisma.department.update({ where: { id: engDept.id }, data: { managerId: 'emp-mgr' } });
  await prisma.department.update({ where: { id: hrDept.id }, data: { managerId: 'emp-hr' } });

  const leaveTypes = [
    { id: 'lt-casual', code: 'CASUAL', name: 'Casual Leave', annualAllowance: 12, carryForwardCap: 3, requiresHR: false },
    { id: 'lt-sick', code: 'SICK', name: 'Sick Leave', annualAllowance: 10, carryForwardCap: 2, requiresHR: false },
    { id: 'lt-earned', code: 'EARNED', name: 'Earned Leave', annualAllowance: 15, carryForwardCap: 5, requiresHR: true },
  ];
  for (const type of leaveTypes) await prisma.leaveType.create({ data: type });

  for (const employee of employees) {
    for (const type of leaveTypes) {
      await prisma.leaveBalance.create({
        data: {
          employeeId: employee.id,
          leaveTypeId: type.id,
          year: YEAR,
          opening: 0,
          carriedIn: type.code === 'CASUAL' ? 2 : 0,
          accrued: Math.floor(type.annualAllowance / 12) * 8,
          used: employee.id === 'emp-2' && type.code === 'SICK' ? 3 : 0,
          reserved: 0,
        },
      });
    }
  }

  const days = [3, 4, 5, 6, 9, 10, 11, 12, 13, 16, 17, 18, 19, 20];
  for (const employee of employees) {
    for (const day of days) {
      const late = employee.id === 'emp-3' && day === 13;
      const checkIn = at(day, late ? 9 : 8, late ? 45 : 55);
      await prisma.attendanceRecord.create({
        data: {
          employeeId: employee.id,
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
      {
        id: 'lr-1', employeeId: 'emp-1', leaveTypeId: 'lt-casual',
        startDate: at(23), endDate: at(24), reason: 'Family event at home',
        workingDays: 2, status: 'PENDING_MANAGER',
      },
      {
        id: 'lr-2', employeeId: 'emp-2', leaveTypeId: 'lt-sick',
        startDate: at(16), endDate: at(18), reason: 'Medical appointment and recovery',
        workingDays: 3, status: 'APPROVED', decidedBy: 'emp-mgr', decisionComment: 'Approved',
      },
      {
        id: 'lr-3', employeeId: 'emp-3', leaveTypeId: 'lt-earned',
        startDate: at(25), endDate: at(27), reason: 'Personal work',
        workingDays: 3, status: 'PENDING_MANAGER',
      },
      {
        id: 'lr-4', employeeId: 'emp-1', leaveTypeId: 'lt-earned',
        startDate: new Date(Date.UTC(YEAR, 11, 1)), endDate: new Date(Date.UTC(YEAR, 11, 4)),
        reason: 'Annual vacation (4 days)', workingDays: 4, status: 'PENDING_HR',
      },
    ],
  });

  await prisma.auditLog.createMany({
    data: [
      { actorId: 'emp-hr', action: 'EMPLOYEE_CREATED', entity: 'Employee', entityId: 'emp-1', newValue: '{"role":"EMPLOYEE"}' },
      { actorId: 'emp-mgr', action: 'LEAVE_APPROVED', entity: 'LeaveRequest', entityId: 'lr-2', oldValue: '{"status":"PENDING_MANAGER"}', newValue: '{"status":"APPROVED"}' },
      { actorId: 'emp-1', action: 'LEAVE_SUBMITTED', entity: 'LeaveRequest', entityId: 'lr-1', newValue: '{"workingDays":2}' },
    ],
  });

  console.log('Seed complete: 6 employees, 3 leave types, 3 balances each, 14 attendance days, 4 leave requests.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
