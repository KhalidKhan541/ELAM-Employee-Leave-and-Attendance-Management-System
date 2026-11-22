import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { toCsv } from '@/lib/csv';
import { reportService } from '@/lib/services';
import { handle } from '@/lib/response';
import { parseQuery, reportQuerySchema } from '@/lib/validation';

export async function GET(request: Request) {
  return handle(async () => {
    await requireRole('HR', 'MANAGER');
    const url = new URL(request.url);
    const query = parseQuery(reportQuerySchema, Object.fromEntries(url.searchParams));
    const month = query.month ?? `${new Date().getUTCFullYear()}-${String(new Date().getUTCMonth() + 1).padStart(2, '0')}`;

    let result: { rows: unknown[]; warnings: string[] };
    switch (url.searchParams.get('type')) {
      case 'attendance': {
        const report = await reportService.attendanceSummary(month);
        result = { rows: report.rows, warnings: report.warnings };
        break;
      }
      case 'leave': {
        const report = await reportService.leaveUtilisation(
          query.from ?? new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5)) - 1, 1)),
          query.to ?? new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5)), 0)),
        );
        result = { rows: report.rows, warnings: report.warnings };
        break;
      }
      default: {
        const report = await reportService.payroll(month, query.departmentId);
        result = { rows: report.rows, warnings: report.warnings };
      }
    }

    if (url.searchParams.get('format') === 'csv') {
      return new NextResponse(toCsv(result.rows as Record<string, unknown>[]), {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="report-${month}.csv"`,
        },
      });
    }
    return NextResponse.json({ data: result.rows, warnings: result.warnings });
  });
}
