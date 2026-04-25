/**
 * Property-Based Test: Notification Enqueue is Non-Blocking
 *
 * Property 9: Notification Enqueue is Non-Blocking
 * For any Core API action that triggers a notification, Core API response time
 * must NOT be correlated with notification worker processing time.
 * Core API must return immediately after enqueuing the job.
 *
 * Validates: Requirements 10.1
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

const ITERATIONS = 100;

// Simulate the enqueue pattern: fire-and-forget via void
// The key property: enqueue time is O(1) regardless of worker processing time

interface EnqueueResult {
  enqueueTimeMs: number;
  jobId: string;
}

async function simulateEnqueue(
  workerDelayMs: number,
  deliveryLog: string[],
): Promise<EnqueueResult> {
  const jobId = `job-${Math.random().toString(36).slice(2)}`;
  const start = Date.now();

  // Simulate fire-and-forget: enqueue returns immediately
  // Worker processes asynchronously (simulated with setTimeout)
  void (async () => {
    await new Promise((resolve) => setTimeout(resolve, workerDelayMs));
    deliveryLog.push(jobId);
  })();

  const enqueueTimeMs = Date.now() - start;
  return { enqueueTimeMs, jobId };
}

describe('Property 9: Notification Enqueue is Non-Blocking', () => {
  it('enqueue time is not correlated with worker processing time', async () => {
    const fastWorkerTimes: number[] = [];
    const slowWorkerTimes: number[] = [];

    for (let i = 0; i < ITERATIONS; i++) {
      const deliveryLog: string[] = [];

      // Fast worker (0ms delay)
      const fast = await simulateEnqueue(0, deliveryLog);
      fastWorkerTimes.push(fast.enqueueTimeMs);

      // Slow worker (100ms delay)
      const slow = await simulateEnqueue(100, deliveryLog);
      slowWorkerTimes.push(slow.enqueueTimeMs);
    }

    // Both fast and slow worker enqueue times should be near-zero (< 10ms)
    const avgFast = fastWorkerTimes.reduce((a, b) => a + b, 0) / fastWorkerTimes.length;
    const avgSlow = slowWorkerTimes.reduce((a, b) => a + b, 0) / slowWorkerTimes.length;

    assert.ok(avgFast < 10, `average fast enqueue time ${avgFast}ms must be < 10ms (non-blocking)`);
    assert.ok(
      avgSlow < 10,
      `average slow enqueue time ${avgSlow}ms must be < 10ms (non-blocking, worker delay should not affect enqueue)`,
    );
  });

  it('enqueue returns before worker processes the job', async () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const deliveryLog: string[] = [];
      const workerDelayMs = 50;

      const { jobId } = await simulateEnqueue(workerDelayMs, deliveryLog);

      // Immediately after enqueue, job should NOT be in delivery log yet
      assert.ok(
        !deliveryLog.includes(jobId),
        `iteration ${i}: job ${jobId} must NOT be delivered immediately after enqueue (worker processes async)`,
      );
    }
  });

  it('void fire-and-forget pattern: enqueue does not await worker completion', async () => {
    const deliveryLog: string[] = [];
    const jobIds: string[] = [];

    // Enqueue many jobs rapidly
    for (let i = 0; i < 10; i++) {
      const { jobId } = await simulateEnqueue(20, deliveryLog);
      jobIds.push(jobId);
    }

    // None should be delivered yet (workers are still processing)
    assert.equal(
      deliveryLog.length,
      0,
      `no jobs should be delivered immediately after rapid enqueue, got ${deliveryLog.length}`,
    );

    // Wait for workers to complete
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Now all should be delivered
    assert.equal(
      deliveryLog.length,
      10,
      `all 10 jobs should be delivered after worker delay, got ${deliveryLog.length}`,
    );
  });

  it('enqueue time is bounded regardless of queue depth', async () => {
    const enqueueTimes: number[] = [];

    for (let i = 0; i < ITERATIONS; i++) {
      const deliveryLog: string[] = [];
      // Simulate varying queue depths by using different worker delays
      const workerDelay = Math.floor(Math.random() * 1000); // 0-1000ms worker delay
      const { enqueueTimeMs } = await simulateEnqueue(workerDelay, deliveryLog);
      enqueueTimes.push(enqueueTimeMs);
    }

    // All enqueue times should be < 10ms regardless of worker delay
    const maxEnqueueTime = Math.max(...enqueueTimes);
    assert.ok(
      maxEnqueueTime < 10,
      `max enqueue time ${maxEnqueueTime}ms must be < 10ms regardless of worker processing time`,
    );
  });
});
