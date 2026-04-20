import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { tap } from 'rxjs/operators';
import { logger } from '../logger';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  intercept(context: ExecutionContext, next: CallHandler): any {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    const { method, url } = request;
    const userId = request.user?.id;
    const start = Date.now();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (next.handle() as any).pipe(
      tap({
        next: () => {
          const durationMs = Date.now() - start;
          const statusCode = response.statusCode;
          logger.info({ method, url, userId, durationMs, statusCode });
        },
        error: () => {
          const durationMs = Date.now() - start;
          const statusCode = response.statusCode ?? 500;
          logger.info({ method, url, userId, durationMs, statusCode });
        },
      }),
    );
  }
}
