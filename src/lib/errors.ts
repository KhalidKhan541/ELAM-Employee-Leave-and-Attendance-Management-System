/**
 * Typed error hierarchy shared by domain, services and controllers.
 * This module is deliberately framework-free so the domain layer can import it.
 */

export type ErrorDetails = Record<string, unknown> | undefined;

export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
    public readonly details: ErrorDetails = undefined,
    cause?: unknown,
  ) {
    super(message);
    this.name = new.target.name;
    if (cause !== undefined) {
      (this as Error & { cause?: unknown }).cause = cause;
    }
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Invalid input', details: ErrorDetails = undefined) {
    super('VALIDATION_ERROR', message, 400, details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super('UNAUTHENTICATED', message, 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'You are not allowed to perform this action') {
    super('FORBIDDEN', message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(entity = 'Resource') {
    super('NOT_FOUND', `${entity} not found`, 404);
  }
}

export class ConflictError extends AppError {
  constructor(code: string, message: string, details: ErrorDetails = undefined) {
    super(code, message, 409, details);
  }
}

export class DomainError extends AppError {
  constructor(code: string, message: string, details: ErrorDetails = undefined) {
    super(code, message, 422, details);
  }
}

export class InfrastructureError extends AppError {
  constructor(message = 'A dependent service is unavailable', cause?: unknown) {
    super('INFRASTRUCTURE_ERROR', message, 503, undefined, cause);
  }
}
