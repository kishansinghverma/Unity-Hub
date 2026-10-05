import { ErrorCodes } from './error-codes.js';

export abstract class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details: unknown = undefined,
    cause: unknown = undefined,
  ) {
    super(message, { cause });
    this.name = new.target.name;
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', details?: unknown, cause?: unknown) {
    super(404, ErrorCodes.NotFound, message, details, cause);
  }
}
export class ValidationError extends AppError {
  constructor(message = 'Request validation failed', details?: unknown, cause?: unknown) {
    super(400, ErrorCodes.ValidationError, message, details, cause);
  }
}
export class ServerError extends AppError {
  constructor(message = 'An unexpected error occurred', statusCode = 500, cause?: unknown) {
    super(statusCode, ErrorCodes.InternalError, message, undefined, cause);
  }
}
export class UpstreamApiError extends AppError {
  constructor(message = 'Upstream API request failed', statusCode = 502, cause?: unknown) {
    super(statusCode, ErrorCodes.UpstreamApiError, message, undefined, cause);
  }
}
export class ConflictError extends AppError {
  constructor(message = 'Resource already exists', details?: unknown, cause?: unknown) {
    super(409, ErrorCodes.Conflict, message, details, cause);
  }
}
export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication is required', details?: unknown, cause?: unknown) {
    super(401, ErrorCodes.Unauthorized, message, details, cause);
  }
}
export class ForbiddenError extends AppError {
  constructor(message = 'Access is forbidden', details?: unknown, cause?: unknown) {
    super(403, ErrorCodes.Forbidden, message, details, cause);
  }
}
export class BusinessRuleError extends AppError {
  constructor(message = 'The requested action is not allowed', details?: unknown, cause?: unknown) {
    super(422, ErrorCodes.BusinessRule, message, details, cause);
  }
}
