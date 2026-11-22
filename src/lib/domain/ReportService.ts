/**
 * Read-side facade. Fault tolerant: a failed query degrades to an empty result
 * plus a warning instead of taking down the page (FR-32).
 */
import { logger } from '../logger';
import type { Clock, UnitOfWork } from './ports';
import { SystemClock } from './ports';
import { PayrollCalculator } from './PayrollCalculator';
import type { AttendanceRecord, LeaveRequestRecord, PayrollRow } from './types';
import { monthRange } from './PayrollCalculator';

export interface ReportResult<T> {
  rows: T[];
  warnings: string[];
}

export interface AttendanceSummaryRow {
  employeeId: string;
  employeeName: string;
  presentDays: number;
  lateDays: number;
  totalHours: number;
}

export interface LeaveUtilisationRow {
  leaveTypeName: string;
  departmentName: string;
  requests: number;
  days: number;
}

export class ReportService {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly calculator: PayrollCalculator,
    private readonly clock: Clock = new SystemClock(),
  ) {}

  async attendanceSummary(month: string): Promise<ReportResult<AttendanceSummaryRow>> {
    try {
      const { from, to } = monthRange(month);
      return await this.uow.run(async (repos) => {
        const employees = await repos.employees.list();
        const records = await repos.attendance.list({ from, to });
        const rows = employees.map((employee) => {
          const own = records.filter((a) => a.employeeId === employee.id && a.checkIn);
          return {
            employeeId: employee.id,
            employeeName: employee.fullName,
            presentDays: own.length,
            lateDays: own.filter((a) => a.late).length,
            totalHours: Math.round(own.reduce((sum, a) => sum + (a.hours ?? 0), 0) * 100) / 100,
          };
        });
        return { rows, warnings: [] };
      });
    } catch (error) {
      logger.error('attendance summary failed; returning partial result', { error: String(error) });
      return { rows: [], warnings: ['Attendance data is temporarily unavailable.'] };
    }
  }

  async leaveUtilisation(from: Date, to: Date): Promise<ReportResult<LeaveUtilisationRow>> {
    try {
      return await this.uow.run(async (repos) => {
        const [requests, types, employees] = await Promise.all([
          repos.leaves.list({}),
          repos.leaveTypes.list(),
          repos.employees.list(),
        ]);
        const approved = requests.filter(
          (r) => r.status === 'APPROVED' && r.startDate <= to && r.endDate >= from,
        );
        const rows = this.groupUtilisation(approved, types, employees);
        return { rows, warnings: [] };
      });
    } catch (error) {
      logger.error('leave utilisation failed; returning partial result', { error: String(error) });
      return { rows: [], warnings: ['Leave utilisation data is temporarily unavailable.'] };
    }
  }

  async payroll(month: string, departmentId?: string): Promise<ReportResult<PayrollRow>> {
    try {
      const rows = await this.calculator.calculate(month, departmentId);
      return { rows, warnings: [] };
    } catch (error) {
      logger.error('payroll calculation failed; returning partial result', { error: String(error) });
      return { rows: [], warnings: ['Payroll summary could not be generated.'] };
    }
  }

  private groupUtilisation(
    requests: LeaveRequestRecord[],
    types: { id: string; name: string }[],
    employees: { id: string; departmentId: string }[],
  ): LeaveUtilisationRow[] {
    const map = new Map<string, LeaveUtilisationRow>();
    for (const request of requests) {
      const type = types.find((t) => t.id === request.leaveTypeId);
      const employee = employees.find((e) => e.id === request.employeeId);
      const key = `${type?.name ?? 'Unknown'}|${employee?.departmentId ?? 'Unknown'}`;
      const row = map.get(key) ?? {
        leaveTypeName: type?.name ?? 'Unknown',
        departmentName: employee?.departmentId ?? 'Unknown',
        requests: 0,
        days: 0,
      };
      row.requests += 1;
      row.days += request.workingDays;
      map.set(key, row);
    }
    return [...map.values()];
  }
}

/** Re-exported so tests can construct a service with a fixed clock. */
export type { AttendanceRecord };
