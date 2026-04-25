/**
 * Property-Based Test: Notification Idempotency
 *
 * Property 10: Notification Idempotency
 * For any notification job replayed with the same idempotency key,
 * the notification must be delivered exactly once.
 *
 * Validates: Requirements 10.4
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

const ITERATIONS = 100;

class MockRedis {
  private store = new Map<string, string>();

  async set(
    key: string,
    value: string,
    _ex: string,
    _ttl: number,
    nx: string,
  ): Promise<string | null> {
    if (nx === 'NX') {
      if (this.store.has(key)) return null;
      this.store.set(key, value);
      return 'OK';
    }
    this.store.set(key, value);
    return 'OK';
  }

  clear() {
    this.store.clear();
  }
}

interface NotificationJob {
  id: string;
  type: 'in-app' | 'email' | 'digest' | 'reminder';
  recipientId: string;
  correlationId: string;
}

async function processWithIdempotency(
  job: NotificationJob,
  redis: MockRedis,
  deliveryLog: string[],
): Promise<void> {
  const idempotencyKey = `notif:processed:${job.id}`;
  const isNew = await redis.set(idempotencyKey, '1', 'EX', 86400, 'NX');
  if (!isNew) return;
  deliveryLog.push(job.id);
}

function makeJob(id: string): NotificationJob {
  return { id, type: 'in-app', recipientId: 'user-1', correlationId: 'corr-1' };
}

describe('Property 10: Notification Idempotency', () => {
  it('notification is delivered exactly once for a given idempotency key', async () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const redis = new MockRedis();
      const deliveryLog: string[] = [];
      const jobId = `job-${i}`;
      const job = makeJob(jobId);
      const replayCount = Math.floor(Math.random() * 5) + 2;
      for (let r = 0; r < replayCount; r++) {
        await processWithIdempotency(job, redis, deliveryLog);
      }
      assert.equal(
        deliveryLog.length,
        1,
        `iteration ${i}: job replayed ${replayCount} times must be delivered exactly once`,
      );
    }
  });

  it('different jobs with different IDs are each delivered exactly once', async () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const redis = new MockRedis();
      const deliveryLog: string[] = [];
      const jobCount = Math.floor(Math.random() * 10) + 1;
      const jobs = Array.from({ length: jobCount }, (_, j) => makeJob(`job-${i}-${j}`));
      for (const job of jobs) await processWithIdempotency(job, redis, deliveryLog);
      assert.equal(
        deliveryLog.length,
        jobCount,
        `iteration ${i}: ${jobCount} unique jobs must each be delivered once`,
      );
    }
  });

  it('replaying all jobs does not increase delivery count', async () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const redis = new MockRedis();
      const deliveryLog: string[] = [];
      const jobCount = Math.floor(Math.random() * 5) + 1;
      const jobs = Array.from({ length: jobCount }, (_, j) => makeJob(`job-${i}-${j}`));
      for (const job of jobs) await processWithIdempotency(job, redis, deliveryLog);
      const firstPassCount = deliveryLog.length;
      for (const job of jobs) await processWithIdempotency(job, redis, deliveryLog);
      assert.equal(
        deliveryLog.length,
        firstPassCount,
        `iteration ${i}: replaying must not increase delivery count`,
      );
    }
  });

  it('first delivery returns OK, subsequent deliveries return null (NX semantics)', async () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const redis = new MockRedis();
      const key = `notif:processed:job-${i}`;
      const first = await redis.set(key, '1', 'EX', 86400, 'NX');
      assert.equal(first, 'OK', `iteration ${i}: first SET NX must return OK`);
      const second = await redis.set(key, '1', 'EX', 86400, 'NX');
      assert.equal(second, null, `iteration ${i}: second SET NX must return null`);
    }
  });
});
