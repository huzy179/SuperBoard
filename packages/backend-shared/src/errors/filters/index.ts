import { type ArgumentsHost, Catch, HttpStatus, Logger } from '@nestjs/common';
import type { Request, Response } from 'express';
import { BaseError } from '../error-types';
import type { StandardErrorResponse } from '../../types';
import { ErrorSeverity, ErrorType } from '../../types';

export interface GlobalExceptionContext {
  exception: unknown;
  request: Request;
  status: number;
  correlationId: string;
  timestamp: string;
  type: ErrorType;
  severity: ErrorSeverity;
  error: Error;
}

function generateCorrelationId(): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cryptoAny = globalThis.crypto as any;
  if (cryptoAny?.randomUUID) return cryptoAny.randomUUID();
  return `corr_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function mapStatus(exception: unknown): number {
  if (isHttpExceptionLike(exception)) return exception.getStatus();
  if (exception instanceof BaseError) {
    switch (exception.type) {
      case 'validation':
        return HttpStatus.BAD_REQUEST;
      case 'business':
        return HttpStatus.UNPROCESSABLE_ENTITY;
      case 'infrastructure':
        return HttpStatus.SERVICE_UNAVAILABLE;
      case 'technical':
      default:
        return HttpStatus.INTERNAL_SERVER_ERROR;
    }
  }
  return HttpStatus.INTERNAL_SERVER_ERROR;
}

function mapTypeSeverity(exception: unknown): { type: ErrorType; severity: ErrorSeverity } {
  if (exception instanceof BaseError) {
    const type =
      exception.type === 'business'
        ? ErrorType.BUSINESS
        : exception.type === 'validation'
          ? ErrorType.VALIDATION
          : exception.type === 'infrastructure'
            ? ErrorType.INFRASTRUCTURE
            : ErrorType.TECHNICAL;

    const severity =
      exception.severity === 'low'
        ? ErrorSeverity.LOW
        : exception.severity === 'medium'
          ? ErrorSeverity.MEDIUM
          : exception.severity === 'critical'
            ? ErrorSeverity.CRITICAL
            : ErrorSeverity.HIGH;

    return { type, severity };
  }

  return { type: ErrorType.TECHNICAL, severity: ErrorSeverity.HIGH };
}

function isHttpExceptionLike(
  exception: unknown,
): exception is { getStatus(): number; getResponse(): unknown } {
  return (
    typeof exception === 'object' &&
    exception !== null &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    typeof (exception as any).getStatus === 'function' &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    typeof (exception as any).getResponse === 'function'
  );
}

@Catch()
export class GlobalExceptionFilter {
  protected readonly logger: Logger;

  constructor() {
    this.logger = new Logger(GlobalExceptionFilter.name);
  }

  protected onException(_ctx: GlobalExceptionContext): void {
    // Hook for subclasses.
  }

  protected buildBody(ctx: GlobalExceptionContext): unknown {
    const body: StandardErrorResponse = {
      error: {
        code: ctx.error.name,
        message: ctx.error.message,
        type: ctx.type,
        severity: ctx.severity,
        correlationId: ctx.correlationId,
        timestamp: ctx.timestamp,
        details: ctx.exception instanceof BaseError ? ctx.exception.details : undefined,
        stack: process.env.NODE_ENV === 'production' ? undefined : ctx.error.stack,
      },
    };
    return body;
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = mapStatus(exception);
    const err = exception instanceof Error ? exception : new Error(String(exception));

    const correlationId =
      (exception instanceof BaseError ? exception.correlationId : undefined) ??
      (request.headers['x-correlation-id'] as string | undefined) ??
      generateCorrelationId();

    const { type, severity } = mapTypeSeverity(exception);
    const timestamp = new Date().toISOString();

    const context: GlobalExceptionContext = {
      exception,
      request,
      status,
      correlationId,
      timestamp,
      type,
      severity,
      error: err,
    };

    this.logger.error(`[http] ${request.method} ${request.url} -> ${status} ${err.message}`, {
      correlationId,
      type,
      severity,
    });

    try {
      this.onException(context);
    } catch {
      // ignore hook errors
    }

    const body = this.buildBody(context);
    response.status(status).json(body);
  }
}
