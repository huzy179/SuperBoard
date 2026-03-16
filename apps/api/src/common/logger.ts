import pino from 'pino';
import { getRequestContext } from './request-context';

export const logger = pino({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  base: null,
  timestamp: pino.stdTimeFunctions.isoTime,
  mixin(): Record<string, string> {
    const context = getRequestContext();
    return context ? { correlationId: context.correlationId } : {};
  },
});
