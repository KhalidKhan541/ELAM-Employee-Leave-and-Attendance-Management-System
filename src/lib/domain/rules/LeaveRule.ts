/** Strategy interface for leave validation rules. */
import { DomainError } from '../../errors';
import type { EmployeeRecord, LeaveRequestRecord, LeaveTypeRecord, SubmitLeaveInput } from '../types';

export interface LeaveContext {
  employee: EmployeeRecord;
  leaveType: LeaveTypeRecord;
  input: SubmitLeaveInput;
  workingDays: number;
  availability: number;
  overlapping: LeaveRequestRecord[];
  now: Date;
}

export interface LeaveRule {
  readonly name: string;
  check(ctx: LeaveContext): Promise<void> | void;
}

export class DateOrderRule implements LeaveRule {
  readonly name = 'DateOrderRule';
  check(ctx: LeaveContext): void {
    if (ctx.input.endDate < ctx.input.startDate) {
      throw new DomainError('LEAVE_INVALID_DATES', 'End date cannot be before start date');
    }
  }
}

export class PastDateRule implements LeaveRule {
  readonly name = 'PastDateRule';
  check(ctx: LeaveContext): void {
    const today = new Date(Date.UTC(ctx.now.getUTCFullYear(), ctx.now.getUTCMonth(), ctx.now.getUTCDate()));
    if (ctx.input.startDate < today) {
      throw new DomainError('LEAVE_PAST_DATE', 'Leave cannot start in the past');
    }
  }
}

export class ActiveEmployeeRule implements LeaveRule {
  readonly name = 'ActiveEmployeeRule';
  check(ctx: LeaveContext): void {
    if (!ctx.employee.active) {
      throw new DomainError('EMPLOYEE_INACTIVE', 'Inactive employees cannot request leave');
    }
  }
}

export class BalanceRule implements LeaveRule {
  readonly name = 'BalanceRule';
  check(ctx: LeaveContext): void {
    if (ctx.workingDays <= 0) {
      throw new DomainError('LEAVE_INVALID_DAYS', 'At least one working day is required');
    }
    if (ctx.workingDays > ctx.availability) {
      throw new DomainError(
        'LEAVE_INSUFFICIENT_BALANCE',
        `Requested ${ctx.workingDays} day(s) but only ${ctx.availability} available`,
        { requested: ctx.workingDays, available: ctx.availability },
      );
    }
  }
}

export class OverlapRule implements LeaveRule {
  readonly name = 'OverlapRule';
  check(ctx: LeaveContext): void {
    if (ctx.overlapping.length > 0) {
      throw new DomainError(
        'LEAVE_OVERLAP',
        'Dates overlap an existing leave request',
        { conflictingIds: ctx.overlapping.map((r) => r.id) },
      );
    }
  }
}

export const defaultLeaveRules: LeaveRule[] = [
  new ActiveEmployeeRule(),
  new DateOrderRule(),
  new PastDateRule(),
  new BalanceRule(),
  new OverlapRule(),
];
