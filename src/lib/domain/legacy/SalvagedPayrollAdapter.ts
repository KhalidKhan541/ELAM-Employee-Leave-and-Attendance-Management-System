/**
 * Seam between the old world and the new one: normalises the legacy CSV export
 * into the application's PayrollRow type without modifying the legacy parser.
 */
import { z } from 'zod';
import { InfrastructureError } from '../../errors';
import type { PayrollSource } from '../ports';
import type { PayrollRow } from '../types';
import { LegacyPayrollParser } from './LegacyPayrollParser';

const normalisedSchema = z.object({
  employeeId: z.string().min(1),
  date: z.date(),
  hours: z.number().min(-24).max(24),
});

/** Converts dd/mm/yyyy, yyyy-mm-dd and ISO timestamps without throwing. */
export function parseLegacyDate(value: string): Date | null {
  const trimmed = value.trim();
  const parts = trimmed.match(/^(\d{1,4})[-/](\d{1,2})[-/](\d{1,4})/);
  if (!parts) return null;
  const a = Number(parts[1]);
  const b = Number(parts[2]);
  const c = Number(parts[3]);
  if (parts[1].length === 4) {
    const date = new Date(Date.UTC(a, b - 1, c));
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const date = new Date(Date.UTC(c, b - 1, a)); // dd/mm/yyyy
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Legacy format writes negative numbers as (8.5). */
export function parseLegacyHours(value: string): number | null {
  const trimmed = value.trim();
  const negative = /^\((.+)\)$/.exec(trimmed);
  const numeric = Number(negative ? negative[1] : trimmed);
  return Number.isFinite(numeric) ? (negative ? -numeric : numeric) : null;
}

export class SalvagedPayrollAdapter implements PayrollSource {
  constructor(private readonly parser: LegacyPayrollParser) {}

  async getRows(month: string): Promise<PayrollRow[]> {
    try {
      const raw = this.parser.parse(sampleLegacyExport());
      const rows: PayrollRow[] = [];
      for (const row of raw) {
        if (!row.employeeId) continue; // legacy rule: skip orphan rows
        const parsed = normalisedSchema.safeParse({
          employeeId: row.employeeId,
          date: parseLegacyDate(row.date),
          hours: parseLegacyHours(row.hours),
        });
        if (!parsed.success) continue; // never crash the whole import
        if (!parsed.data.date.toISOString().startsWith(month)) continue;
        rows.push({
          employeeId: parsed.data.employeeId,
          employeeName: parsed.data.employeeId, // legacy export has no names
          month,
          presentDays: parsed.data.hours > 0 ? 1 : 0,
          approvedLeaveDays: 0,
          lateDays: 0,
          workingDays: 1,
          netPayableDays: Math.max(0, parsed.data.hours / 8),
        });
      }
      return rows;
    } catch (error) {
      throw new InfrastructureError('Legacy payroll export could not be read', error);
    }
  }
}

/** Anonymised sample of the old export (kept under database/legacy too). */
export function sampleLegacyExport(): string[] {
  return [
    'EmpId,Date,Hours',
    'EMP-1001,03/11/2026,8',
    'EMP-1002,2026-11-03,(8.5)',
    ',04/11/2026,7.5',
    'EMP-1001,04/11/2026,not-a-number',
    'EMP-1003,05/11/2026,9',
  ];
}
