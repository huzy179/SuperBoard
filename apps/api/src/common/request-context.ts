import { AsyncLocalStorage } from 'node:async_hooks';

export interface RequestContextValue {
  correlationId: string;
}

const requestContext = new AsyncLocalStorage<RequestContextValue>();

export function runWithRequestContext<T>(value: RequestContextValue, callback: () => T): T {
  return requestContext.run(value, callback);
}

export function getRequestContext(): RequestContextValue | undefined {
  return requestContext.getStore();
}
