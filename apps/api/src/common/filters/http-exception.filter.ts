import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Inject,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { apiError, ErrorCodes } from '@superboard/shared';
import { logger } from '../logger';
import { DiagnosisService } from '../../modules/knowledge/diagnosis.service';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(
    @Inject(DiagnosisService)
    private diagnosisService: DiagnosisService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = context.getResponse<any>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const request = context.getRequest<any>();
    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? this.getHttpExceptionMessage(exception)
        : exception instanceof Error
          ? exception.message
          : 'Internal server error';

    // Log non-HTTP errors (5xx) for observability
    if (status >= 500) {
      const error =
        exception instanceof Error
          ? { name: exception.name, message: exception.message, stack: exception.stack }
          : { exception };
      logger.error({ status, message, error }, 'Unhandled server error');

      // Trigger Neural Diagnosis
      if (exception instanceof Error) {
        void this.diagnosisService.diagnose(exception, {
          url: request.url,
          method: request.method,
          body: request.body,
          workspaceId: request.headers['x-workspace-id'] || 'system',
        });
      }
    } else {
      logger.warn({ status, message }, 'Client request error');
    }

    const correlationId = String(request.headers['x-correlation-id'] || 'root');

    // Extract error code from exception response if available
    const errorCode = this.extractErrorCode(exception, status);

    // Extract optional details (e.g. validation errors array)
    const details = this.extractDetails(exception);

    const payload = apiError(errorCode, message, details, {
      correlationId,
      trace:
        process.env.NODE_ENV === 'development' && exception instanceof Error
          ? exception.stack
          : undefined,
    });

    response.status(status).json(payload);
  }

  private extractErrorCode(exception: unknown, status: number): string {
    // Check for explicit code set on the exception response first
    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const res = exceptionResponse as Record<string, unknown>;
        if (typeof res['code'] === 'string' && res['code']) {
          return res['code'];
        }
      }
    }

    // Map common NestJS exception classes to domain error codes
    if (exception instanceof UnauthorizedException) {
      return ErrorCodes.AUTH_PERMISSION_DENIED;
    }
    if (exception instanceof ForbiddenException) {
      return ErrorCodes.AUTH_PERMISSION_DENIED;
    }
    if (exception instanceof BadRequestException) {
      return ErrorCodes.VALIDATION_FAILED;
    }
    if (exception instanceof InternalServerErrorException) {
      return ErrorCodes.INTERNAL_ERROR;
    }

    // Fall back to status-based mapping for other HttpExceptions
    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const res = exceptionResponse as Record<string, unknown>;
        if (typeof res['error'] === 'string' && res['error']) {
          return res['error'].toUpperCase().replace(/\s+/g, '_');
        }
      }
    }

    if (status >= 500) {
      return ErrorCodes.INTERNAL_ERROR;
    }

    return `ERR_${status}`;
  }

  private extractDetails(exception: unknown): unknown {
    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const res = exceptionResponse as Record<string, unknown>;
        // NestJS validation pipe puts errors in `message` array
        if (Array.isArray(res['message'])) {
          return res['message'];
        }
      }
    }
    return undefined;
  }

  private getHttpExceptionMessage(exception: HttpException): string {
    const exceptionResponse = exception.getResponse();

    if (typeof exceptionResponse === 'string') {
      return exceptionResponse;
    }

    if (
      typeof exceptionResponse === 'object' &&
      exceptionResponse &&
      'message' in exceptionResponse
    ) {
      const message = (exceptionResponse as { message?: string | string[] }).message;
      if (Array.isArray(message)) {
        return message.join(', ');
      }

      if (typeof message === 'string') {
        return message;
      }
    }

    return 'Request failed';
  }
}
