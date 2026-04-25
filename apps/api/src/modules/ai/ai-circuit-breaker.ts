import { AI_CLIENT_CONFIG } from './ai-client.config';

export type CircuitState = 'closed' | 'open' | 'half-open';

export interface CircuitBreakerOptions {
  failureThreshold: number; // consecutive failures to open circuit
  successThreshold: number; // consecutive successes in half-open to close
  timeout: number; // ms to wait before transitioning open → half-open
}

export class CircuitBreaker {
  private state: CircuitState = 'closed';
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime = 0;
  private readonly options: CircuitBreakerOptions;

  constructor(options: CircuitBreakerOptions = AI_CLIENT_CONFIG.circuitBreaker) {
    this.options = options;
  }

  getState(): CircuitState {
    return this.state;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      const elapsed = Date.now() - this.lastFailureTime;
      if (elapsed >= this.options.timeout) {
        this.state = 'half-open';
        this.successCount = 0;
      } else {
        throw new CircuitOpenError(
          `Circuit breaker is open. Retry after ${this.options.timeout - elapsed}ms`,
        );
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    if (this.state === 'half-open') {
      this.successCount++;
      if (this.successCount >= this.options.successThreshold) {
        this.state = 'closed';
        this.successCount = 0;
      }
    }
  }

  private onFailure(): void {
    this.lastFailureTime = Date.now();
    if (this.state === 'half-open') {
      // Any failure in half-open → back to open
      this.state = 'open';
      this.successCount = 0;
      return;
    }
    this.failureCount++;
    if (this.failureCount >= this.options.failureThreshold) {
      this.state = 'open';
    }
  }

  reset(): void {
    this.state = 'closed';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = 0;
  }
}

export class CircuitOpenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CircuitOpenError';
  }
}
