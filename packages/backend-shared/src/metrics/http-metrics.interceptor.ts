import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MetricsService } from './metrics.service';

@Injectable()
export class HttpMetricsInterceptor implements NestInterceptor {
  private readonly requestsTotal;
  private readonly requestDurationMs;

  constructor(
    private readonly metrics: MetricsService,
    private readonly serviceName: string,
  ) {
    this.requestsTotal = metrics.counter('http_requests_total', 'HTTP requests', [
      'service',
      'method',
      'route',
      'status',
    ]);
    this.requestDurationMs = metrics.histogram(
      'http_request_duration_ms',
      'HTTP request duration (ms)',
      ['service', 'method', 'route', 'status'],
    );
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();
    const start = Date.now();

    const method = req.method;
    // `route.path` exists for controller routes; fallback to originalUrl.
    const route =
      (req as Request & { route?: { path: string } }).route?.path ??
      req.path ??
      req.originalUrl ??
      'unknown';

    return next.handle().pipe(
      tap({
        next: () => this.record(method, route, String(res.statusCode), Date.now() - start),
        error: () => this.record(method, route, String(res.statusCode || 500), Date.now() - start),
      }),
    );
  }

  private record(method: string, route: string, status: string, durationMs: number): void {
    this.requestsTotal.inc({ service: this.serviceName, method, route, status }, 1);
    this.requestDurationMs.observe(
      { service: this.serviceName, method, route, status },
      durationMs,
    );
  }
}
