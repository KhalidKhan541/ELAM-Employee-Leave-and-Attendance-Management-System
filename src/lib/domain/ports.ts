/** Narrow interfaces (Interface Segregation) used for dependency injection. */
import type {
  AttendanceFilter,
  AttendanceRecord,
  AuditEntry,
  BalanceRecord,
  EmployeeRecord,
  LeaveFilter,
  PayrollRow,
  LeaveRequestRecord,
  LeaveTypeRecord,
} from './types';

export interface Clock {
  now(): Date;
}

export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}

export interface Auditor {
  append(entry: AuditEntry): Promise<void>;
}

export class NoOpAuditor implements Auditor {
  async append(): Promise<void> {
    // intentional no-op for pure unit tests
  }
}

export interface EmployeeRepository {
  findById(id: string): Promise<EmployeeRecord | null>;
  findByEmail(email: string): Promise<(EmployeeRecord & { passwordHash: string }) | null>;
  list(): Promise<EmployeeRecord[]>;
  create(input: Omit<EmployeeRecord, 'id'> & { passwordHash: string }): Promise<EmployeeRecord>;
  update(id: string, input: Partial<EmployeeRecord>): Promise<EmployeeRecord>;
}

export interface LeaveTypeRepository {
  findById(id: string): Promise<LeaveTypeRecord | null>;
  list(): Promise<LeaveTypeRecord[]>;
}

export interface LeaveBalanceRepository {
  find(employeeId: string, leaveTypeId: string, year: number): Promise<BalanceRecord | null>;
  listForEmployee(employeeId: string, year: number): Promise<BalanceRecord[]>;
  upsert(record: Omit<BalanceRecord, 'id'>): Promise<BalanceRecord>;
}

export interface LeaveRepository {
  create(input: Omit<LeaveRequestRecord, 'id' | 'createdAt' | 'updatedAt' | 'decisionComment' | 'decidedBy'>): Promise<LeaveRequestRecord>;
  findById(id: string): Promise<LeaveRequestRecord | null>;
  list(filter: LeaveFilter): Promise<LeaveRequestRecord[]>;
  updateDecision(
    id: string,
    status: string,
    decidedBy: string,
    comment: string,
  ): Promise<LeaveRequestRecord>;
}

export interface AttendanceRepository {
  findByEmployeeAndDate(employeeId: string, date: Date): Promise<AttendanceRecord | null>;
  list(filter: AttendanceFilter): Promise<AttendanceRecord[]>;
  create(input: Omit<AttendanceRecord, 'id'>): Promise<AttendanceRecord>;
  update(id: string, input: Partial<AttendanceRecord>): Promise<AttendanceRecord>;
}

export interface AuditRepository {
  append(entry: AuditEntry): Promise<void>;
  list(limit?: number): Promise<AuditEntry[]>;
}

/** Seam for the salvaged legacy payroll data source. */
export interface PayrollSource {
  getRows(month: string): Promise<PayrollRow[]>;
}

/** Bundle of repositories available inside one unit of work. */
export interface DomainRepositories {
  employees: EmployeeRepository;
  leaveTypes: LeaveTypeRepository;
  balances: LeaveBalanceRepository;
  leaves: LeaveRepository;
  attendance: AttendanceRepository;
  audit: AuditRepository;
}

/** Abstraction over a database transaction so services stay storage-agnostic. */
export interface UnitOfWork {
  run<T>(work: (repos: DomainRepositories) => Promise<T>): Promise<T>;
}
