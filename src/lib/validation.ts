/**
 * Boundary validation: every value coming from a calling object (HTTP body,
 * query string, form, server component) is parsed here before use.
 */
import { z } from 'zod';
import { ValidationError } from './errors';

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const createLeaveSchema = z.object({
  leaveTypeId: z.string().min(1, 'Select a leave type'),
  startDate: z.coerce.date({ invalid_type_error: 'Enter a valid start date' }),
  endDate: z.coerce.date({ invalid_type_error: 'Enter a valid end date' }),
  reason: z.string().trim().min(5, 'Give a reason of at least 5 characters').max(500),
});

export const decisionSchema = z.object({
  decision: z.enum(['APPROVE', 'REJECT']),
  comment: z.string().trim().max(500).optional().default(''),
});

export const attendanceSchema = z.object({
  action: z.enum(['CHECK_IN', 'CHECK_OUT']),
});

export const employeeSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email(),
  departmentId: z.string().min(1),
  joiningDate: z.coerce.date(),
  role: z.enum(['EMPLOYEE', 'MANAGER', 'HR']),
  active: z.boolean().default(true),
});

export const reportQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Use YYYY-MM').optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  departmentId: z.string().optional(),
});

export function parse<T extends z.ZodTypeAny>(schema: T, input: unknown): z.infer<T> {
  const result = schema.safeParse(input);
  if (!result.success) {
    const details = result.error.flatten();
    throw new ValidationError(
      'Please correct the highlighted fields',
      { fields: details.fieldErrors, form: details.formErrors },
    );
  }
  return result.data;
}

/** Parses a query-string record, dropping empty values so optional fields stay optional. */
export function parseQuery<T extends z.ZodTypeAny>(schema: T, input: Record<string, unknown>): z.infer<T> {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined && value !== null && value !== '') cleaned[key] = value;
  }
  return parse(schema, cleaned);
}
