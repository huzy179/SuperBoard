import {
  BadRequestException,
  Catch,
  ForbiddenException,
  HttpException,
  Inject,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  GlobalExceptionFilter,
  type GlobalExceptionContext,
} from '@superboard/backend-shared/errors';
import { apiError, ErrorCodes } from '@superboard/shared';
import { logger } from '../logger';
import { DiagnosisService } from '../../modules/knowledge/diagnosis.service';

@Catch()
export class ApiGlobalExceptionFilter extends GlobalExceptionFilter {
  constructor(
    @Inject(DiagnosisService)
    private readonly diagnosisService: DiagnosisService,
  ) {
    super();
  }

  protected override onException(ctx: GlobalExceptionContext): void {
    const isNotFound = ctx.status === 404 && ctx.error?.name === 'NotFoundException';

    // Only log + diagnose server errors
    if (ctx.status >= 500) {
      logger.error(
        {
          status: ctx.status,
          message: ctx.error.message,
          error: { name: ctx.error.name, message: ctx.error.message, stack: ctx.error.stack },
          correlationId: ctx.correlationId,
        },
        'Unhandled server error',
      );

      void this.diagnosisService.diagnose(ctx.error, {
        url: ctx.request.url,
        method: ctx.request.method,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        body: (ctx.request as any).body,
        workspaceId: String(ctx.request.headers['x-workspace-id'] || 'system'),
      });
    } else {
      logger.warn(
        {
          status: ctx.status,
          message: ctx.error.message,
          ...(isNotFound
            ? {
                hint:
                  process.env.ENABLE_DEBUG_ROUTES === 'true'
                    ? 'Check registered routes at GET /api/v1/_debug/routes'
                    : 'Set ENABLE_DEBUG_ROUTES=true and check GET /api/v1/_debug/routes',
              }
            : {}),
        },
        'Client request error',
      );
    }
  }

  protected override buildBody(ctx: GlobalExceptionContext): unknown {
    const code = this.extractErrorCode(ctx.exception, ctx.status);
    const message =
      ctx.exception instanceof HttpException
        ? this.getHttpExceptionMessage(ctx.exception)
        : ctx.error.message;

    const details = this.extractDetails(ctx.exception);

    return apiError(code, message, details, {
      correlationId: ctx.correlationId,
      trace:
        process.env.NODE_ENV === 'development' && ctx.error.stack ? ctx.error.stack : undefined,
    });
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
