/** Composition root: wire ports to their Prisma implementations once. */
import { PrismaUnitOfWork } from './repositories';
import { AttendanceService } from './domain/AttendanceService';
import { LeaveRequestService } from './domain/LeaveRequestService';
import { PayrollCalculator } from './domain/PayrollCalculator';
import { ReportService } from './domain/ReportService';
import { SalvagedPayrollAdapter } from './domain/legacy/SalvagedPayrollAdapter';
import { LegacyPayrollParser } from './domain/legacy/LegacyPayrollParser';

export const unitOfWork = new PrismaUnitOfWork();
export const attendanceService = new AttendanceService(unitOfWork);
export const leaveService = new LeaveRequestService(unitOfWork);
export const payrollCalculator = new PayrollCalculator(unitOfWork);
export const reportService = new ReportService(unitOfWork, payrollCalculator);
export const salvagedPayrollSource = new SalvagedPayrollAdapter(new LegacyPayrollParser());
