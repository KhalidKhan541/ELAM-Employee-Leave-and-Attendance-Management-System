/** Shared domain value types (framework-free). */

export const ROLES = ['EMPLOYEE', 'MANAGER', 'HR'] as const;
export type Role = (typeof ROLES)[number];

export const LEAVE_STATUSES = [
  'PENDING_MANAGER',
  'PENDING_HR',
  'APPROVED',
  'REJECTED',
  'CANCELLED',
] as const;
export type LeaveStatus = (typeof LEAVE_STATUSES)[number];

export const ALLOWED_TRANSITIONS: Record<LeaveStatus, LeaveStatus[]> = {
  PENDING_MANAGER: ['PENDING_HR', 'APPROVED', 'REJECTED', 'CANCELLED'],
  PENDING_HR: ['APPROVED', 'REJECTED', 'CANCELLED'],
  APPROVED: [],
  REJECTED: [],
  CANCELLED: [],
};

export interface EmployeeRecord {
  id: string;
  email: string;
  fullName: string;
  departmentId: string;
  joiningDate: Date;
  role: string;
  active: boolean;
}

export interface LeaveTypeRecord {
  id: string;
  code: string;
  name: string;
  annualAllowance: number;
  carryForwardCap: number;
  requiresHR: boolean;
}

export interface BalanceRecord {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  year: number;
  opening: number;
  carriedIn: number;
  accrued: number;
  used: number;
  reserved: number;
}

export interface BalanceSnapshot {
  opening: number;
  carriedIn: number;
  accrued: number;
  used: number;
  reserved: number;
}

export interface LeaveRequestRecord {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  startDate: Date;
  endDate: Date;
  reason: string;
  workingDays: number;
  status: string;
  decisionComment: string | null;
  decidedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: Date;
  checkIn: Date | null;
  checkOut: Date | null;
  status: string;
  late: boolean;
  hours: number | null;
}

export interface AuditEntry {
  actorId: string;
  action: string;
  entity: string;
  entityId: string;
  oldValue?: string;
  newValue?: string;
}

export interface SubmitLeaveInput {
  employeeId: string;
  leaveTypeId: string;
  startDate: Date;
  endDate: Date;
  reason: string;
}

export interface AttendanceFilter {
  employeeId?: string;
  departmentId?: string;
  from?: Date;
  to?: Date;
}

export interface LeaveFilter {
  employeeId?: string;
  departmentId?: string;
  status?: string;
}

export interface PayrollRow {
  employeeId: string;
  employeeName: string;
  month: string;
  presentDays: number;
  approvedLeaveDays: number;
  lateDays: number;
  workingDays: number;
  netPayableDays: number;
}
