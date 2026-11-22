/** Consistent API responses and the single error-handling boundary. */
import { NextResponse } from 'next/server';
import { AppError, InfrastructureError } from './errors';
import { logger } from './logger';

export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ data }, { status });
}

export function errorResponse(error: unknown): NextResponse {
  if (error instanceof AppError) {
    if (error.status >= 500) {
      logger.error(error.code, { message: error.message, cause: String(error.cause ?? '') });
    }
    return NextResponse.json(
      { error: { code: error.code, message: error.message, details: error.details ?? null } },
      { status: error.status },
    );
  }
  logger.error('unhandled exception', { error: String(error) });
  const wrapped = new InfrastructureError('An unexpected error occurred');
  return NextResponse.json(
    { error: { code: wrapped.code, message: wrapped.message, details: null } },
    { status: 500 },
  );
}

/** Wrap every route handler so no exception escapes without a structured reply. */
export async function handle(operation: () => Promise<Response>): Promise<Response> {
  try {
    return await operation();
  } catch (error) {
    return errorResponse(error);
  }
}
