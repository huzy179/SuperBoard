import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { logger } from '../logger';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const endTime = Date.now();
        const duration = endTime - startTime;

        const logData = {
          method,
          url,
          duration: `${duration}ms`,
          type: 'HTTP_REQUEST',
        };

        if (duration > 200) {
          logger.warn({ ...logData, slow: true }, `🚩 SLOW REQUEST: ${method} ${url}`);
        } else {
          logger.info(logData, `[${method}] ${url}`);
        }
      }),
    );
  }
}
