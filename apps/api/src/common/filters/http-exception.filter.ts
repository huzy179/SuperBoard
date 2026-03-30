import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import type { ApiResponse } from '@superboard/shared';
import { logger } from '../logger';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<{
      status: (code: number) => { json: (body: unknown) => void };
    }>();

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
    } else {
      logger.warn({ status, message }, 'Client request error');
    }

    const payload: ApiResponse<never> = {
      success: false,
      error: {
        code: `HTTP_${status}`,
        message,
      },
      meta: {
        timestamp: new Date().toISOString(),
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
