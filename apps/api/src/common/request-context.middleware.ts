import type { NextFunction, Request, Response } from 'express';
import { monotonicFactory } from 'ulid';
import { logger } from './logger';
import { runWithRequestContext } from './request-context';

const CORRELATION_ID_HEADER = 'x-correlation-id';
const createCorrelationId = monotonicFactory();

export function requestContextMiddleware(req: Request, res: Response, next: NextFunction): void {
  const existingCorrelationId = req.header(CORRELATION_ID_HEADER);
  const correlationId = existingCorrelationId || createCorrelationId();

  res.setHeader(CORRELATION_ID_HEADER, correlationId);

  runWithRequestContext({ correlationId }, () => {
    const startedAt = Date.now();

    res.on('finish', () => {
      logger.info(
        {
          method: req.method,
          path: req.originalUrl,
          statusCode: res.statusCode,
          durationMs: Date.now() - startedAt,
        },
        'request.completed',
      );
    });

    next();
  });
}
