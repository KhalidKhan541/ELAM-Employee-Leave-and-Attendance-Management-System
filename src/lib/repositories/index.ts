/** Prisma implementations of the domain ports — the only place DB calls live. */
import { Prisma, type PrismaClient } from '@prisma/client';
import { withRetry } from '../retry';
import type {
  AttendanceRepository,
  AuditRepository,
  DomainRepositories,
  EmployeeRepository,
  LeaveBalanceRepository,
  LeaveRepository,
  LeaveTypeRepository,
  UnitOfWork,
} from '../domain/ports';
import type {
  AttendanceFilter,
  AttendanceRecord,
  AuditEntry,
  BalanceRecord,
  EmployeeRecord,
  LeaveFilter,
  LeaveRequestRecord,
  LeaveTypeRecord,
} from '../domain/types';
import { prisma } from '../db';

type Client = PrismaClient | Prisma.TransactionClient;

export function createRepos(client: Client): DomainRepositories {
  const employees: EmployeeRepository = {
    findById: async (id) =>
      withRetry(() => client.employee.findUnique({ where: { id } })) as Promise<EmployeeRecord | null>,
    findByEmail: async (email) => {
      // Emails are stored as FirstNameLastName@elam.com (mixed case) while the
      // login form normalises input to lowercase, so compare case-insensitively.
      // Works on both SQLite (local) and PostgreSQL (production).
      const rows = await withRetry(() =>
        client.employee.findMany({ include: { userAccount: true } }),
      );
      const match = rows.find(
        (row) => row.email.toLowerCase() === email.trim().toLowerCase(),
      );
      return match
        ? ({ ...match, passwordHash: match.userAccount?.passwordHash ?? '' } as EmployeeRecord & { passwordHash: string })
        : null;
    },
    list: async () => withRetry(() => client.employee.findMany({ orderBy: { fullName: 'asc' } })) as Promise<EmployeeRecord[]>,
    create: async (input) => {
      const { passwordHash, ...rest } = input;
      return withRetry(() =>
        client.employee.create({
          data: {
            ...rest,
            userAccount: { create: { passwordHash } },
          },
        }),
      ) as Promise<EmployeeRecord>;
    },
    update: async (id, input) =>
      withRetry(() => client.employee.update({ where: { id }, data: input })) as Promise<EmployeeRecord>,
  };

  const leaveTypes: LeaveTypeRepository = {
    findById: async (id) =>
      withRetry(() => client.leaveType.findUnique({ where: { id } })) as Promise<LeaveTypeRecord | null>,
    list: async () => withRetry(() => client.leaveType.findMany({ orderBy: { name: 'asc' } })) as Promise<LeaveTypeRecord[]>,
  };

  const balances: LeaveBalanceRepository = {
    find: async (employeeId, leaveTypeId, year) =>
      withRetry(() =>
        client.leaveBalance.findUnique({
          where: { employeeId_leaveTypeId_year: { employeeId, leaveTypeId, year } },
        }),
      ) as Promise<BalanceRecord | null>,
    listForEmployee: async (employeeId, year) =>
      withRetry(() => client.leaveBalance.findMany({ where: { employeeId, year } })) as Promise<BalanceRecord[]>,
    upsert: async (record) => {
      const { employeeId, leaveTypeId, year, ...values } = record;
      return withRetry(() =>
        client.leaveBalance.upsert({
          where: { employeeId_leaveTypeId_year: { employeeId, leaveTypeId, year } },
          create: { employeeId, leaveTypeId, year, ...values },
          update: values,
        }),
      ) as Promise<BalanceRecord>;
    },
  };

  const leaves: LeaveRepository = {
    create: async (input) =>
      withRetry(() => client.leaveRequest.create({ data: input })) as Promise<LeaveRequestRecord>,
    findById: async (id) =>
      withRetry(() => client.leaveRequest.findUnique({ where: { id } })) as Promise<LeaveRequestRecord | null>,
    list: async (filter: LeaveFilter) =>
      withRetry(() =>
        client.leaveRequest.findMany({
          where: {
            employeeId: filter.employeeId,
            status: filter.status,
            employee: filter.departmentId ? { departmentId: filter.departmentId } : undefined,
          },
          orderBy: { createdAt: 'desc' },
        }),
      ) as Promise<LeaveRequestRecord[]>,
    updateDecision: async (id, status, decidedBy, comment) =>
      withRetry(() =>
        client.leaveRequest.update({
          where: { id },
          data: { status, decidedBy, decisionComment: comment },
        }),
      ) as Promise<LeaveRequestRecord>,
  };

  const attendance: AttendanceRepository = {
    findByEmployeeAndDate: async (employeeId, date) =>
      withRetry(() =>
        client.attendanceRecord.findUnique({
          where: { employeeId_date: { employeeId, date } },
        }),
      ) as Promise<AttendanceRecord | null>,
    list: async (filter: AttendanceFilter) =>
      withRetry(() =>
        client.attendanceRecord.findMany({
          where: {
            employeeId: filter.employeeId,
            date: filter.from || filter.to ? { gte: filter.from, lte: filter.to } : undefined,
            employee: filter.departmentId ? { departmentId: filter.departmentId } : undefined,
          },
          orderBy: { date: 'desc' },
        }),
      ) as Promise<AttendanceRecord[]>,
    create: async (input) =>
      withRetry(() => client.attendanceRecord.create({ data: input })) as Promise<AttendanceRecord>,
    update: async (id, input) =>
      withRetry(() => client.attendanceRecord.update({ where: { id }, data: input })) as Promise<AttendanceRecord>,
  };

  const audit: AuditRepository = {
    append: async (entry: AuditEntry) => {
      await withRetry(() => client.auditLog.create({ data: entry }));
    },
    list: async (limit = 100) =>
      (await withRetry(() =>
        client.auditLog.findMany({ take: limit, orderBy: { at: 'desc' } }),
      )) as unknown as AuditEntry[],
  };

  return { employees, leaveTypes, balances, leaves, attendance, audit };
}

export class PrismaUnitOfWork implements UnitOfWork {
  constructor(private readonly client: PrismaClient = prisma) {}

  run<T>(work: (repos: DomainRepositories) => Promise<T>): Promise<T> {
    return this.client.$transaction((tx) => work(createRepos(tx)));
  }
}
