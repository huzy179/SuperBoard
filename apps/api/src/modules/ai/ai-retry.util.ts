import { AI_CLIENT_CONFIG } from './ai-client.config';

export interface RetryOptions {
  maxAttempts: number;
  initialDelayMs: number;
  backoffMultiplier: number;
  retryableErrors: readonly number[];
}

function isRetryableError(error: unknown, retryableErrors: readonly number[]): boolean {
  if (error && typeof error === 'object' && 'code' in error) {
    return retryableErrors.includes((error as { code: number }).code);
  }
  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = AI_CLIENT_CONFIG.retry,
): Promise<T> {
  let lastError: unknown;
  let delayMs = options.initialDelayMs;

  for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (!isRetryableError(error, options.retryableErrors)) {
        throw error; // Non-retryable: fail fast
      }

      if (attempt === options.maxAttempts) {
        break; // Exhausted retries
      }

      await sleep(delayMs);
      delayMs = Math.round(delayMs * options.backoffMultiplier);
    }
  }

  throw lastError;
}
