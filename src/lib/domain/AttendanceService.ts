/** Enforces the attendance rules (FR-10..FR-15) atomically. */
import { ConflictError, DomainError, NotFoundError } from '../errors';
import type { Clock, UnitOfWork } from './ports';
import { SystemClock } from './ports';
import type { AttendanceFilter, AttendanceRecord } from './types';
import { WorkingDayCalendar } from './WorkingDayCalendar';

export class AttendanceService {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly clock: Clock = new SystemClock(),
    private readonly calendar: WorkingDayCalendar = new WorkingDayCalendar(),
  ) {}

  async checkIn(employeeId: string): Promise<AttendanceRecord> {
    return this.uow.run(async (repos) => {
      const employee = await repos.employees.findById(employeeId);
      if (!employee) throw new NotFoundError('Employee');
      if (!employee.active) throw new DomainError('EMPLOYEE_INACTIVE', 'Inactive employees cannot check in');

      const now = this.clock.now();
      const date = this.calendar.startOfDay(now);
      const existing = await repos.attendance.findByEmployeeAndDate(employeeId, date);
      if (existing) {
        throw new ConflictError('ATTENDANCE_ALREADY_CHECKED_IN', 'You have already checked in today');
      }

      const created = await repos.attendance.create({
        employeeId,
        date,
        checkIn: now,
        checkOut: null,
        status: 'CHECKED_IN',
        late: this.calendar.isLate(now),
        hours: null,
      });
      await repos.audit.append({
        actorId: employeeId,
        action: 'ATTENDANCE_CHECK_IN',
        entity: 'AttendanceRecord',
        entityId: created.id,
        newValue: JSON.stringify({ date: date.toISOString(), late: created.late }),
      });
      return created;
    });
  }

  async checkOut(employeeId: string): Promise<AttendanceRecord> {
    return this.uow.run(async (repos) => {
      const now = this.clock.now();
      const date = this.calendar.startOfDay(now);
      const existing = await repos.attendance.findByEmployeeAndDate(employeeId, date);
      if (!existing) {
        throw new ConflictError('ATTENDANCE_NOT_CHECKED_IN', 'Check in before checking out');
      }
      if (existing.checkOut) {
        throw new ConflictError('ATTENDANCE_ALREADY_CHECKED_OUT', 'You have already checked out today');
      }
      if (!existing.checkIn) {
        throw new DomainError('ATTENDANCE_INVALID_STATE', 'This record has no check-in time');
      }
      const hours = Math.round(((now.getTime() - existing.checkIn.getTime()) / 3_600_000) * 100) / 100;
      if (hours <= 0) {
        throw new DomainError('ATTENDANCE_INVALID_HOURS', 'Check-out must be after check-in');
      }

      const updated = await repos.attendance.update(existing.id, {
        checkOut: now,
        status: 'COMPLETE',
        hours,
      });
      await repos.audit.append({
        actorId: employeeId,
        action: 'ATTENDANCE_CHECK_OUT',
        entity: 'AttendanceRecord',
        entityId: updated.id,
        oldValue: JSON.stringify({ status: 'CHECKED_IN' }),
        newValue: JSON.stringify({ status: 'COMPLETE', hours }),
      });
      return updated;
    });
  }

  async list(filter: AttendanceFilter = {}): Promise<AttendanceRecord[]> {
    return this.uow.run((repos) => repos.attendance.list(filter));
  }
}
