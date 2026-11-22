/** Pure date arithmetic. All comparisons use UTC to be deterministic in tests. */

export const LATE_THRESHOLD_MINUTES = 9 * 60 + 30; // 09:30

export class WorkingDayCalendar {
  isWeekend(date: Date): boolean {
    const day = date.getUTCDay();
    return day === 0 || day === 6;
  }

  startOfDay(date: Date): Date {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  }

  /** Inclusive count of Mon–Fri days between two dates. */
  workingDaysBetween(start: Date, end: Date): number {
    const from = this.startOfDay(start);
    const to = this.startOfDay(end);
    if (to < from) return 0;
    let count = 0;
    const cursor = new Date(from);
    while (cursor <= to) {
      if (!this.isWeekend(cursor)) count++;
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    return count;
  }

  addWorkingDays(start: Date, days: number): Date {
    const cursor = this.startOfDay(start);
    let added = 0;
    while (added < days) {
      cursor.setUTCDate(cursor.getUTCDate() + 1);
      if (!this.isWeekend(cursor)) added++;
    }
    return cursor;
  }

  minutesOfDay(date: Date): number {
    return date.getUTCHours() * 60 + date.getUTCMinutes();
  }

  isLate(checkIn: Date, threshold = LATE_THRESHOLD_MINUTES): boolean {
    return this.minutesOfDay(checkIn) > threshold;
  }

  monthsBetween(from: Date, to: Date): number {
    return (
      (to.getUTCFullYear() - from.getUTCFullYear()) * 12 +
      (to.getUTCMonth() - from.getUTCMonth())
    );
  }
}

export const workingDayCalendar = new WorkingDayCalendar();
