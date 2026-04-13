import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import type { ApiResponse } from '@superboard/shared';
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
    const response = context.getResponse<{
      status: (code: number) => { json: (body: unknown) => void };
    }>();

    const request = context.getRequest();
    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? this.getHttpExceptionMessage(exception)
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

    const correlationId = logger.bindings()?.correlationId || 'root';

    const payload: ApiResponse<never> = {
      success: false,
      error: {
        code: `ERR_${status}`,
        message,
      },
      meta: {
        timestamp: new Date().toISOString(),
        correlationId: String(correlationId),
        trace: process.env.NODE_ENV === 'development' ? (exception as Error).stack : undefined,
      },
    };

    response.status(status).json(payload);
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
