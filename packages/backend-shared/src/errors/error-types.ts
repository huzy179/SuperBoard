/**
 * Error type definitions and custom error classes
 */

export * from '../types';

export class BaseError extends Error {
  public readonly type: string;
  public readonly severity: string;
  public readonly correlationId?: string | undefined;
  public readonly timestamp: Date;
  public readonly details?: unknown;

  constructor(
    message: string,
    type: string,
    severity: string,
    correlationId?: string,
    details?: unknown,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.type = type;
    this.severity = severity;
    this.correlationId = correlationId;
    this.timestamp = new Date();
    this.details = details;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class BusinessError extends BaseError {
  constructor(message: string, correlationId?: string, details?: unknown) {
    super(message, 'business', 'medium', correlationId, details);
  }
}

export class TechnicalError extends BaseError {
  constructor(message: string, correlationId?: string, details?: unknown) {
    super(message, 'technical', 'high', correlationId, details);
  }
}

export class ValidationError extends BaseError {
  constructor(message: string, correlationId?: string, details?: unknown) {
    super(message, 'validation', 'low', correlationId, details);
  }
}

export class InfrastructureError extends BaseError {
  constructor(message: string, correlationId?: string, details?: unknown) {
    super(message, 'infrastructure', 'critical', correlationId, details);
  }
}
