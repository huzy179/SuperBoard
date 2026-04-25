/**
 * Property-Based Test: Circuit Breaker Opens After Threshold
 *
 * Property 8: Circuit Breaker Opens After Threshold
 * For any sequence of consecutive AI Service failures that reaches the configured
 * failure threshold, subsequent AI calls must fail fast (circuit open) without
 * making new gRPC calls to AI Service, until the circuit transitions to half-open.
 *
 * Validates: Requirements 8.4
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { CircuitBreaker, CircuitOpenError } from '../../src/modules/ai/ai-circuit-breaker.js';

const ITERATIONS = 50;

const testOptions = {
  failureThreshold: 3,
  successThreshold: 2,
  timeout: 50, // 50ms for fast tests
};

describe('Property 8: Circuit Breaker Opens After Threshold', () => {
  it('circuit starts in closed state', () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const cb = new CircuitBreaker(testOptions);
      assert.equal(cb.getState(), 'closed', `iteration ${i}: initial state must be closed`);
    }
  });

  it('circuit opens after exactly failureThreshold consecutive failures', async () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const cb = new CircuitBreaker(testOptions);
      const error = new Error('AI unavailable');

      // Fail threshold-1 times — circuit should still be closed
      for (let f = 0; f < testOptions.failureThreshold - 1; f++) {
        await assert.rejects(() => cb.execute(() => Promise.reject(error)));
        assert.equal(
          cb.getState(),
          'closed',
          `iteration ${i}, failure ${f + 1}: circuit must remain closed before threshold`,
        );
      }

      // Fail one more time — circuit should open
      await assert.rejects(() => cb.execute(() => Promise.reject(error)));
      assert.equal(
        cb.getState(),
        'open',
        `iteration ${i}: circuit must open after ${testOptions.failureThreshold} failures`,
      );
    }
  });

  it('when circuit is open, execute throws CircuitOpenError without calling fn', async () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const cb = new CircuitBreaker(testOptions);
      const error = new Error('AI unavailable');

      // Open the circuit
      for (let f = 0; f < testOptions.failureThreshold; f++) {
        await assert.rejects(() => cb.execute(() => Promise.reject(error)));
      }
      assert.equal(cb.getState(), 'open');

      // Now try to call — should fail fast without calling fn
      let fnCalled = false;
      await assert.rejects(
        () =>
          cb.execute(() => {
            fnCalled = true;
            return Promise.resolve('should not reach');
          }),
        (err: unknown) => err instanceof CircuitOpenError,
      );

      assert.ok(!fnCalled, `iteration ${i}: fn must NOT be called when circuit is open`);
    }
  });

  it('after timeout, circuit transitions to half-open and allows one call', async () => {
    const cb = new CircuitBreaker(testOptions);
    const error = new Error('AI unavailable');

    // Open the circuit
    for (let f = 0; f < testOptions.failureThreshold; f++) {
      await assert.rejects(() => cb.execute(() => Promise.reject(error)));
    }
    assert.equal(cb.getState(), 'open');

    // Wait for timeout
    await new Promise((resolve) => setTimeout(resolve, testOptions.timeout + 10));

    // Next call should transition to half-open and execute
    let fnCalled = false;
    await assert.rejects(() =>
      cb.execute(() => {
        fnCalled = true;
        return Promise.reject(new Error('still failing'));
      }),
    );

    assert.ok(fnCalled, 'fn must be called after timeout (half-open state)');
  });

  it('in half-open: success transitions circuit to closed after successThreshold', async () => {
    const cb = new CircuitBreaker(testOptions);
    const error = new Error('AI unavailable');

    // Open the circuit
    for (let f = 0; f < testOptions.failureThreshold; f++) {
      await assert.rejects(() => cb.execute(() => Promise.reject(error)));
    }

    // Wait for timeout to enter half-open
    await new Promise((resolve) => setTimeout(resolve, testOptions.timeout + 10));

    // Succeed successThreshold times
    for (let s = 0; s < testOptions.successThreshold; s++) {
      await cb.execute(() => Promise.resolve('ok'));
    }

    assert.equal(
      cb.getState(),
      'closed',
      'circuit must close after successThreshold successes in half-open',
    );
  });

  it('in half-open: failure transitions circuit back to open', async () => {
    const cb = new CircuitBreaker(testOptions);
    const error = new Error('AI unavailable');

    // Open the circuit
    for (let f = 0; f < testOptions.failureThreshold; f++) {
      await assert.rejects(() => cb.execute(() => Promise.reject(error)));
    }

    // Wait for timeout to enter half-open
    await new Promise((resolve) => setTimeout(resolve, testOptions.timeout + 10));

    // Fail in half-open
    await assert.rejects(() => cb.execute(() => Promise.reject(new Error('still failing'))));
    assert.equal(cb.getState(), 'open', 'circuit must reopen after failure in half-open');
  });

  it('property: N failures < threshold keeps circuit closed', async () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const cb = new CircuitBreaker(testOptions);
      const failCount = Math.floor(Math.random() * (testOptions.failureThreshold - 1)) + 1;

      for (let f = 0; f < failCount; f++) {
        await assert.rejects(() => cb.execute(() => Promise.reject(new Error('fail'))));
      }

      assert.equal(
        cb.getState(),
        'closed',
        `iteration ${i}: ${failCount} failures < threshold ${testOptions.failureThreshold} must keep circuit closed`,
      );
    }
  });

  it('reset() restores circuit to closed state', async () => {
    const cb = new CircuitBreaker(testOptions);
    const error = new Error('AI unavailable');

    // Open the circuit
    for (let f = 0; f < testOptions.failureThreshold; f++) {
      await assert.rejects(() => cb.execute(() => Promise.reject(error)));
    }
    assert.equal(cb.getState(), 'open');

    cb.reset();
    assert.equal(cb.getState(), 'closed', 'reset() must restore circuit to closed state');

    // Should be able to execute again
    const result = await cb.execute(() => Promise.resolve('ok'));
    assert.equal(result, 'ok', 'circuit must work normally after reset');
  });
});
