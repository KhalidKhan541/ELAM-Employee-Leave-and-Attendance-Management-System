/** Aggregates attendance + approved leave into payroll rows (FR-28). */
import type { UnitOfWork } from './ports';
import type { PayrollRow } from './types';
import { WorkingDayCalendar } from './WorkingDayCalendar';

export function monthRange(month: string): { from: Date; to: Date; workingDays: number } {
  const [year, monthNumber] = month.split('-').map(Number);
  if (!year || !monthNumber || monthNumber < 1 || monthNumber > 12) {
    throw new Error('Invalid month, expected YYYY-MM');
  }
  const from = new Date(Date.UTC(year, monthNumber - 1, 1));
  const to = new Date(Date.UTC(year, monthNumber, 0));
  const calendar = new WorkingDayCalendar();
  return { from, to, workingDays: calendar.workingDaysBetween(from, to) };
}

export class PayrollCalculator {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly calendar: WorkingDayCalendar = new WorkingDayCalendar(),
  ) {}

  async calculate(month: string, departmentId?: string): Promise<PayrollRow[]> {
    const { from, to, workingDays } = monthRange(month);
    return this.uow.run(async (repos) => {
      const employees = (await repos.employees.list()).filter(
        (e) => e.active && (!departmentId || e.departmentId === departmentId),
      );
      const attendance = await repos.attendance.list({ from, to, departmentId });
      const requests = await repos.leaves.list({});

      return employees.map((employee) => {
        const own = attendance.filter((a) => a.employeeId === employee.id && a.checkIn);
        const presentDays = own.length;
        const lateDays = own.filter((a) => a.late).length;
        const approvedLeaveDays = requests
          .filter(
            (r) =>
              r.employeeId === employee.id &&
              r.status === 'APPROVED' &&
              r.startDate <= to &&
              r.endDate >= from,
          )
          .reduce((sum, r) => sum + r.workingDays, 0);

        return {
          employeeId: employee.id,
          employeeName: employee.fullName,
          month,
          presentDays,
          approvedLeaveDays,
          lateDays,
          workingDays,
          netPayableDays: Math.min(workingDays, presentDays + approvedLeaveDays),
        };
      });
    });
  }
}
