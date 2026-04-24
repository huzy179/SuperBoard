import { Injectable, NestMiddleware } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';
import type { NextFunction, Request, Response } from 'express';
import type { CorrelationContext } from '@superboard/shared';
import { runWithRequestContext } from '../request-context';

const CORRELATION_ID_HEADER = 'x-correlation-id';

export const correlationStorage = new AsyncLocalStorage<CorrelationContext>();

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const existingId = req.header(CORRELATION_ID_HEADER);
    const correlationId = existingId ?? crypto.randomUUID();

    res.setHeader(CORRELATION_ID_HEADER, correlationId);

    const context: CorrelationContext = { correlationId };

    correlationStorage.run(context, () => {
      runWithRequestContext({ correlationId }, next);
    });
  }
}
