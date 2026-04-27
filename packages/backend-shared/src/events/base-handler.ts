import type { DomainEvent, EventContext, RetryOptions } from '../types';
import type { EventHandler } from './types';

export interface IdempotencyStore {
  has(key: string): Promise<boolean>;
  set(key: string): Promise<void>;
}

export class InMemoryIdempotencyStore implements IdempotencyStore {
  private readonly keys = new Set<string>();

  async has(key: string): Promise<boolean> {
    return this.keys.has(key);
  }

  async set(key: string): Promise<void> {
    this.keys.add(key);
  }
}

export interface BaseEventHandlerOptions {
  retry?: RetryOptions;
  idempotencyStore?: IdempotencyStore;
  /**
   * If provided, this key is used for idempotency instead of reading from event metadata.
   * Useful when upstream derives a canonical key.
   */
  idempotencyKey?: (event: DomainEvent) => string | undefined;
  /**
   * Filter hook; return false to ignore.
   */
  shouldHandle?: (event: DomainEvent) => boolean;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryable(error: Error, retryableErrors?: string[]): boolean {
  if (!retryableErrors || retryableErrors.length === 0) return true;
  return retryableErrors.includes(error.name);
}

/**
 * Base Event Handler
 *
 * - Correlation ID tracking via `EventContext`
 * - Optional retry with exponential backoff
 * - Optional idempotency via `metadata.idempotencyKey`
 */
export abstract class BaseEventHandler<TPayload = unknown> implements EventHandler<TPayload> {
  private readonly retry: Required<RetryOptions>;
  private readonly store?: IdempotencyStore;
  private readonly getIdempotencyKey?: (event: DomainEvent) => string | undefined;
  private readonly shouldHandle?: (event: DomainEvent) => boolean;

  constructor(options: BaseEventHandlerOptions = {}) {
    this.retry = {
      maxAttempts: options.retry?.maxAttempts ?? 3,
      initialDelay: options.retry?.initialDelay ?? 250,
      maxDelay: options.retry?.maxDelay ?? 5000,
      backoffMultiplier: options.retry?.backoffMultiplier ?? 2,
      retryableErrors: options.retry?.retryableErrors ?? [],
    };
    this.store = options.idempotencyStore;
    this.getIdempotencyKey = options.idempotencyKey;
    this.shouldHandle = options.shouldHandle;
  }

  abstract getEventType(): string;
  abstract handle(payload: TPayload, context: EventContext): Promise<void>;

  async handleDomainEvent(event: DomainEvent): Promise<void> {
    if (this.shouldHandle && !this.shouldHandle(event)) return;

    const idempotencyKey =
      this.getIdempotencyKey?.(event) ??
      (event.metadata?.idempotencyKey as string | undefined) ??
      undefined;

    if (idempotencyKey && this.store) {
      if (await this.store.has(idempotencyKey)) return;
    }

    const context: EventContext = {
      correlationId: event.correlationId,
      timestamp: new Date(event.timestamp),
      retryCount: 0,
      metadata: event.metadata ?? {},
    };

    let attempt = 0;
     
    while (true) {
      attempt++;
      context.retryCount = attempt - 1;
      try {
        await this.handle(event.payload as TPayload, context);
        if (idempotencyKey && this.store) {
          await this.store.set(idempotencyKey);
        }
        return;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        const canRetry =
          attempt < this.retry.maxAttempts && isRetryable(err, this.retry.retryableErrors);
        if (!canRetry) throw err;

        const backoff = Math.min(
          this.retry.initialDelay * Math.pow(this.retry.backoffMultiplier, attempt - 1),
          this.retry.maxDelay,
        );
        await delay(backoff);
      }
    }
  }
}
