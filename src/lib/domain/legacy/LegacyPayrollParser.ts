/**
 * LEGACY MODULE — preserved verbatim behaviour from the old VB6-era export.
 * Do not "clean up" this file: it is the characterisation target for the
 * salvaging exercise documented in docs/07. The adapter handles normalisation.
 */

export interface LegacyRow {
  employeeId: string;
  date: string;
  hours: string;
  raw: string[];
}

export class LegacyPayrollParser {
  private headerIndex(headers: string[], aliases: string[]): number {
    const index = headers.findIndex((header) => aliases.includes(header.toLowerCase()));
    return index === -1 ? -1 : index; // legacy code silently returns -1
  }

  /** Accepts raw CSV lines (including the header) and returns quirky rows. */
  parse(lines: string[]): LegacyRow[] {
    if (lines.length === 0) return [];
    const headers = lines[0].split(',').map((cell) => cell.trim().toLowerCase());
    const idIndex = this.headerIndex(headers, ['empid', 'employeeid', 'employee id', 'id']);
    const dateIndex = this.headerIndex(headers, ['date', 'workdate', 'day']);
    const hoursIndex = this.headerIndex(headers, ['hours', 'worked', 'totalhours']);

    return lines
      .slice(1)
      .filter((line) => line.trim().length > 0)
      .map((line) => {
        const cells = line.split(',').map((cell) => cell.trim());
        return {
          employeeId: idIndex >= 0 ? cells[idIndex] ?? '' : '',
          date: dateIndex >= 0 ? cells[dateIndex] ?? '' : '',
          hours: hoursIndex >= 0 ? cells[hoursIndex] ?? '' : '',
          raw: cells,
        };
      });
  }
}
