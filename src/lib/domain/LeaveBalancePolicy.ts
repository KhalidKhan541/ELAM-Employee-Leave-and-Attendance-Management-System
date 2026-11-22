/** Pure policy object: balance arithmetic and accrual. No I/O, easily unit-tested. */
import { DomainError } from '../errors';
import type { BalanceSnapshot } from './types';
import { WorkingDayCalendar } from './WorkingDayCalendar';

export interface AccrualResult {
  monthlyAllowance: number;
  carriedIn: number;
  cap: number;
  accruedAfter: number;
  carriedAfter: number;
}

export class LeaveBalancePolicy {
  constructor(private readonly calendar: WorkingDayCalendar = new WorkingDayCalendar()) {}

  countWorkingDays(start: Date, end: Date): number {
    if (end < start) {
      throw new DomainError('LEAVE_INVALID_DATES', 'End date cannot be before start date');
    }
    return this.calendar.workingDaysBetween(start, end);
  }

  available(balance: BalanceSnapshot): number {
    return (
      balance.opening +
      balance.carriedIn +
      balance.accrued -
      balance.used -
      balance.reserved
    );
  }

  /** Returns a new snapshot; never mutates the caller's object. */
  deduct(current: BalanceSnapshot, days: number): BalanceSnapshot {
    if (!Number.isFinite(days) || days <= 0) {
      throw new DomainError('LEAVE_INVALID_DAYS', 'Leave duration must be positive');
    }
    if (days > this.available(current)) {
      throw new DomainError('LEAVE_INSUFFICIENT_BALANCE', 'Not enough leave balance available');
    }
    return { ...current, used: current.used + days };
  }

  restore(current: BalanceSnapshot, days: number): BalanceSnapshot {
    return { ...current, used: Math.max(0, current.used - days) };
  }

  /** Whole-year allowance divided into 12, with carry-forward capped. */
  accrueFor(
    current: BalanceSnapshot,
    annualAllowance: number,
    carryForwardCap: number,
    monthsElapsed: number,
  ): AccrualResult {
    const monthlyAllowance = Math.floor(annualAllowance / 12);
    const accruedAfter = monthlyAllowance * Math.max(0, monthsElapsed);
    const carriedAfter = Math.min(Math.max(0, current.carriedIn), carryForwardCap);
    return {
      monthlyAllowance,
      carriedIn: carriedAfter,
      cap: carryForwardCap,
      accruedAfter,
      carriedAfter,
    };
  }
}
