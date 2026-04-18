import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { logger } from '../logger';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    const { method, url } = request;
    const userId = request.user?.id;
    const start = Date.now();

    return next.handle().pipe(
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
