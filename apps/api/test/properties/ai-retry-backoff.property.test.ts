/**
 * Property-Based Test: AI Service Retry with Exponential Backoff
 *
 * Property 6: AI Service Retry with Exponential Backoff
 * For any transient AI Service error, Core API must retry. Delay between retry N and N+1
 * must be greater than delay between N-1 and N. Total retries must not exceed configured maximum.
 *
 * **Validates: Requirements 8.1**
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { withRetry, type RetryOptions } from '../../src/modules/ai/ai-retry.util.js';
import { AI_CLIENT_CONFIG } from '../../src/modules/ai/ai-client.config.js';
import { status as GrpcStatus } from '@grpc/grpc-js';

const ITERATIONS = 50;

// Helper to create a transient gRPC error
function makeGrpcError(code: number): Error & { code: number } {
  const err = new Error(`gRPC error ${code}`) as Error & { code: number };
  err.code = code;
  return err;
}

// Helper to create a non-retryable gRPC error
function makeNonRetryableError(): Error & { code: number } {
  return makeGrpcError(GrpcStatus.NOT_FOUND); // NOT_FOUND is not retryable
}

describe('Property 6: AI Service Retry with Exponential Backoff', () => {
  const testOptions: RetryOptions = {
    maxAttempts: 3,
    initialDelayMs: 10, // Small for fast tests
    backoffMultiplier: 2,
    retryableErrors: [GrpcStatus.UNAVAILABLE, GrpcStatus.DEADLINE_EXCEEDED],
  };

  it('retries exactly maxAttempts times on persistent transient errors', async () => {
    for (let i = 0; i < ITERATIONS; i++) {
      let callCount = 0;
      const error = makeGrpcError(GrpcStatus.UNAVAILABLE);

      await assert.rejects(
        () =>
          withRetry(() => {
            callCount++;
            return Promise.reject(error);
          }, testOptions),
        (err: unknown) => err === error,
      );

      assert.equal(
        callCount,
        testOptions.maxAttempts,
        `iteration ${i}: must call exactly maxAttempts=${testOptions.maxAttempts} times, got ${callCount}`,
      );
    }
  });

  it('non-retryable errors fail fast without retry', async () => {
    for (let i = 0; i < ITERATIONS; i++) {
      let callCount = 0;
      const error = makeNonRetryableError();

      await assert.rejects(
        () =>
          withRetry(() => {
            callCount++;
            return Promise.reject(error);
          }, testOptions),
        (err: unknown) => err === error,
      );

      assert.equal(
        callCount,
        1,
        `iteration ${i}: non-retryable error must fail fast after 1 call, got ${callCount}`,
      );
    }
  });

  it('succeeds on first attempt without retry when no error', async () => {
    for (let i = 0; i < ITERATIONS; i++) {
      let callCount = 0;
      const result = await withRetry(() => {
        callCount++;
        return Promise.resolve('success');
      }, testOptions);

      assert.equal(result, 'success', `iteration ${i}: must return the resolved value`);
      assert.equal(callCount, 1, `iteration ${i}: must call exactly once on success`);
    }
  });

  it('succeeds on retry after transient failure', async () => {
    for (let i = 0; i < ITERATIONS; i++) {
      let callCount = 0;
      const failOn = Math.floor(Math.random() * (testOptions.maxAttempts - 1)) + 1; // 1 to maxAttempts-1

      const result = await withRetry(() => {
        callCount++;
        if (callCount < failOn + 1) {
          return Promise.reject(makeGrpcError(GrpcStatus.UNAVAILABLE));
        }
        return Promise.resolve('recovered');
      }, testOptions);

      assert.equal(result, 'recovered', `iteration ${i}: must eventually succeed`);
      assert.equal(
        callCount,
        failOn + 1,
        `iteration ${i}: must call ${failOn + 1} times (${failOn} failures + 1 success)`,
      );
    }
  });

  it('exponential backoff: delays grow by backoffMultiplier between retries', async () => {
    // Track delays by intercepting setTimeout
    const delays: number[] = [];
    const originalSetTimeout = globalThis.setTimeout;

    // Temporarily replace setTimeout to capture delays
    (globalThis as unknown as Record<string, unknown>).setTimeout = (
      fn: () => void,
      ms: number,
    ) => {
      delays.push(ms);
      return originalSetTimeout(fn, 0); // Execute immediately for test speed
    };

    try {
      const error = makeGrpcError(GrpcStatus.UNAVAILABLE);
      await assert.rejects(() =>
        withRetry(() => Promise.reject(error), {
          ...testOptions,
          maxAttempts: 4, // 3 retries = 3 delays
        }),
      );
    } finally {
      (globalThis as unknown as Record<string, unknown>).setTimeout = originalSetTimeout;
    }

    // Should have 3 delays for 4 attempts (no delay after last attempt)
    assert.equal(delays.length, 3, `must have maxAttempts-1 delays, got ${delays.length}`);

    // Each delay must be greater than the previous (exponential growth)
    for (let i = 1; i < delays.length; i++) {
      assert.ok(
        delays[i] > delays[i - 1],
        `delay[${i}]=${delays[i]} must be greater than delay[${i - 1}]=${delays[i - 1]}`,
      );
    }

    // Verify backoff multiplier: delay[i] = delay[i-1] * backoffMultiplier (within rounding)
    for (let i = 1; i < delays.length; i++) {
      const expected = Math.round(delays[i - 1] * testOptions.backoffMultiplier);
      assert.equal(
        delays[i],
        expected,
        `delay[${i}]=${delays[i]} must equal delay[${i - 1}] * ${testOptions.backoffMultiplier} = ${expected}`,
      );
    }
  });

  it('AI_CLIENT_CONFIG retry settings satisfy exponential backoff invariant', () => {
    const { retry } = AI_CLIENT_CONFIG;
    assert.ok(retry.maxAttempts >= 1, 'maxAttempts must be at least 1');
    assert.ok(retry.initialDelayMs > 0, 'initialDelayMs must be positive');
    assert.ok(retry.backoffMultiplier > 1, 'backoffMultiplier must be > 1 for exponential growth');

    // Simulate delay sequence
    let delay = retry.initialDelayMs;
    const delays: number[] = [delay];
    for (let i = 1; i < retry.maxAttempts - 1; i++) {
      delay = Math.round(delay * retry.backoffMultiplier);
      delays.push(delay);
    }

    // Verify each delay is greater than the previous
    for (let i = 1; i < delays.length; i++) {
      assert.ok(
        delays[i] > delays[i - 1],
        `delay[${i}]=${delays[i]} must be greater than delay[${i - 1}]=${delays[i - 1]}`,
      );
    }
  });
});
