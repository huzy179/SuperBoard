import type { RetryOptions } from '../types';

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class CircuitBreakerOpenError extends Error {
  constructor(message: string = 'Circuit breaker is open') {
    super(message);
    this.name = 'CircuitBreakerOpenError';
  }
}

export interface CircuitBreakerOptions {
  failureThreshold: number;
  resetTimeoutMs: number;
}

export class CircuitBreaker {
  private failures = 0;
  private openedAt: number | null = null;

  constructor(private readonly options: CircuitBreakerOptions) {}

  private isOpen(): boolean {
    if (this.openedAt === null) return false;
    const elapsed = Date.now() - this.openedAt;
    if (elapsed >= this.options.resetTimeoutMs) {
      // half-open: allow one try
      this.openedAt = null;
      this.failures = 0;
      return false;
    }
    return true;
  }

  async exec<T>(fn: () => Promise<T>): Promise<T> {
    if (this.isOpen()) throw new CircuitBreakerOpenError();
    try {
      const result = await fn();
      this.failures = 0;
      return result;
    } catch (error) {
      this.failures++;
      if (this.failures >= this.options.failureThreshold) {
        this.openedAt = Date.now();
      }
      throw error;
    }
  }
}

export class ErrorHandler {
  static async retry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
    const maxAttempts = options.maxAttempts ?? 3;
    const initialDelay = options.initialDelay ?? 250;
    const backoffMultiplier = options.backoffMultiplier ?? 2;
    const maxDelay = options.maxDelay ?? 5000;
    const retryableErrors = options.retryableErrors ?? [];

    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        lastError = err;

        const canRetry =
          attempt < maxAttempts &&
          (retryableErrors.length === 0 || retryableErrors.includes(err.name));
        if (!canRetry) break;

        const backoff = Math.min(initialDelay * Math.pow(backoffMultiplier, attempt - 1), maxDelay);
        await delay(backoff);
      }
    }

    throw lastError ?? new Error('Retry failed');
  }
}
