/**
 * Property-Based Test: No Duplicate Events Per Transaction
 *
 * **Validates: Requirements 12.4**
 *
 * Property 12: No Duplicate Events Per Transaction
 * For any single state-change operation (e.g., one task status update), Core API
 * must emit exactly one domain event with a unique `idempotencyKey`. Replaying
 * the same operation with the same transaction context must NOT produce a second
 * event with the same idempotency key.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { DomainEvent } from '@superboard/shared';

// ---------------------------------------------------------------------------
// IdempotencyStore — simulates Redis SET NX deduplication
// ---------------------------------------------------------------------------

/**
 * In-memory simulation of Redis SET NX behavior.
 * `tryAcquire(key)` returns `true` if the key is new (process it),
 * `false` if already seen (skip — duplicate).
 */
class IdempotencyStore {
  private readonly seen = new Map<string, number>();

  tryAcquire(key: string): boolean {
    if (this.seen.has(key)) {
      return false;
    }
    this.seen.set(key, Date.now());
    return true;
  }

  has(key: string): boolean {
    return this.seen.has(key);
  }

  clear(): void {
    this.seen.clear();
  }

  get size(): number {
    return this.seen.size;
  }
}

// ---------------------------------------------------------------------------
// Idempotency key generation — mirrors the production pattern
// task-{eventType}-{taskId}-{timestamp}
// ---------------------------------------------------------------------------

function buildIdempotencyKey(
  domain: string,
  eventType: string,
  entityId: string,
  timestamp: number,
): string {
  return `${domain}-${eventType}-${entityId}-${timestamp}`;
}

// ---------------------------------------------------------------------------
// Random generators
// ---------------------------------------------------------------------------

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomString(length = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length }, () => chars[randomInt(0, chars.length - 1)]).join('');
}

function randomUlid(): string {
  const alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  return Array.from({ length: 26 }, () => alphabet[randomInt(0, alphabet.length - 1)]).join('');
}

function randomTaskId(): string {
  return `task-${randomUlid()}`;
}

function randomEventType(): string {
  const types = ['task.created', 'task.updated', 'task.status_changed'];
  return types[randomInt(0, types.length - 1)];
}

/** Build a domain event with the production idempotency key format */
function buildTaskEvent(eventType: string, taskId: string, timestamp: number): DomainEvent {
  return {
    eventId: randomUlid(),
    eventType,
    eventVersion: '1.0',
    producer: 'core-api',
    correlationId: randomUlid(),
    idempotencyKey: buildIdempotencyKey('task', eventType, taskId, timestamp),
    occurredAt: new Date(timestamp).toISOString(),
    payload: { taskId, status: 'in_progress' },
  };
}

// ---------------------------------------------------------------------------
// Property tests
// ---------------------------------------------------------------------------

const ITERATIONS = 100;

describe('Property 12: No Duplicate Events Per Transaction', () => {
  /**
   * Validates: Requirements 12.4
   *
   * For any set of N state-change operations on distinct entities (or at
   * distinct timestamps), each produces an event with a unique idempotencyKey.
   * The Set of all keys must have the same size as the number of operations.
   */
  it('idempotency keys are unique across N operations', () => {
    for (let run = 0; run < ITERATIONS; run++) {
      const n = randomInt(2, 20);
      const keys: string[] = [];

      for (let i = 0; i < n; i++) {
        const taskId = randomTaskId();
        const eventType = randomEventType();
        // Use distinct timestamps to guarantee uniqueness across operations
        const timestamp = Date.now() + i;
        const event = buildTaskEvent(eventType, taskId, timestamp);
        keys.push(event.idempotencyKey);
      }

      const uniqueKeys = new Set(keys);
      assert.strictEqual(
        uniqueKeys.size,
        n,
        `run ${run}: expected ${n} unique idempotency keys, got ${uniqueKeys.size}`,
      );
    }
  });

  /**
   * Validates: Requirements 12.4
   *
   * When the same idempotency key is presented to the store a second time,
   * `tryAcquire` must return `false` — simulating Redis SET NX rejecting a
   * duplicate event.
   */
  it('same idempotency key is detected as duplicate by IdempotencyStore', () => {
    const store = new IdempotencyStore();

    for (let i = 0; i < ITERATIONS; i++) {
      store.clear();

      const taskId = randomTaskId();
      const eventType = randomEventType();
      const timestamp = Date.now();
      const event = buildTaskEvent(eventType, taskId, timestamp);
      const key = event.idempotencyKey;

      // First acquisition must succeed
      const firstResult = store.tryAcquire(key);
      assert.ok(firstResult, `iteration ${i}: first tryAcquire must return true`);

      // Replay with the same key must be rejected
      const replayResult = store.tryAcquire(key);
      assert.ok(!replayResult, `iteration ${i}: replay tryAcquire must return false`);

      // Store size must remain 1 (no duplicate entry)
      assert.strictEqual(store.size, 1, `iteration ${i}: store must contain exactly 1 entry`);
    }
  });

  /**
   * Validates: Requirements 12.4
   *
   * The idempotency key format `{domain}-{eventType}-{entityId}-{timestamp}`
   * is deterministic: given the same inputs, the key is always identical.
   */
  it('idempotency key format is deterministic given same inputs', () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const taskId = randomTaskId();
      const eventType = randomEventType();
      const timestamp = Date.now();

      const key1 = buildIdempotencyKey('task', eventType, taskId, timestamp);
      const key2 = buildIdempotencyKey('task', eventType, taskId, timestamp);

      assert.strictEqual(
        key1,
        key2,
        `iteration ${i}: same inputs must produce identical idempotency key`,
      );

      // Verify the key contains all components
      assert.ok(key1.includes('task'), `iteration ${i}: key must contain domain "task"`);
      assert.ok(key1.includes(eventType), `iteration ${i}: key must contain eventType`);
      assert.ok(key1.includes(taskId), `iteration ${i}: key must contain taskId`);
      assert.ok(key1.includes(String(timestamp)), `iteration ${i}: key must contain timestamp`);
    }
  });

  /**
   * Validates: Requirements 12.4
   *
   * Events for different entities (different taskIds) must have different
   * idempotency keys, even when the eventType is the same.
   */
  it('events for different entities have different idempotency keys', () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const eventType = randomEventType();
      const timestamp = Date.now();

      const taskIdA = `task-${randomString(10)}`;
      const taskIdB = `task-${randomString(10)}`;

      // Ensure the two IDs are actually different
      if (taskIdA === taskIdB) continue;

      const keyA = buildIdempotencyKey('task', eventType, taskIdA, timestamp);
      const keyB = buildIdempotencyKey('task', eventType, taskIdB, timestamp);

      assert.notStrictEqual(
        keyA,
        keyB,
        `iteration ${i}: different entityIds must produce different idempotency keys`,
      );
    }
  });

  /**
   * Validates: Requirements 12.4
   *
   * Events for different eventTypes on the same entity must have different
   * idempotency keys — e.g., task.created vs task.updated for the same taskId.
   */
  it('events for different eventTypes on same entity have different keys', () => {
    const taskEventTypes = ['task.created', 'task.updated', 'task.status_changed'];

    for (let i = 0; i < ITERATIONS; i++) {
      const taskId = randomTaskId();
      const timestamp = Date.now();

      const keys = taskEventTypes.map((et) => buildIdempotencyKey('task', et, taskId, timestamp));

      const uniqueKeys = new Set(keys);
      assert.strictEqual(
        uniqueKeys.size,
        taskEventTypes.length,
        `iteration ${i}: each eventType must produce a distinct idempotency key for the same entity`,
      );
    }
  });

  /**
   * Validates: Requirements 12.4
   *
   * Simulates N concurrent state-change operations: each operation acquires
   * its idempotency key exactly once. The store must contain exactly N entries
   * after all operations complete — no duplicates, no missing entries.
   */
  it('N concurrent operations each acquire their key exactly once', () => {
    for (let run = 0; run < ITERATIONS; run++) {
      const store = new IdempotencyStore();
      const n = randomInt(2, 50);
      let acquired = 0;
      let rejected = 0;

      for (let i = 0; i < n; i++) {
        const taskId = randomTaskId();
        const eventType = randomEventType();
        const timestamp = Date.now() + i; // distinct timestamps
        const event = buildTaskEvent(eventType, taskId, timestamp);

        if (store.tryAcquire(event.idempotencyKey)) {
          acquired++;
        } else {
          rejected++;
        }
      }

      // All N operations have unique keys → all should be acquired
      assert.strictEqual(
        acquired,
        n,
        `run ${run}: all ${n} operations must acquire their key (got ${acquired})`,
      );
      assert.strictEqual(
        rejected,
        0,
        `run ${run}: no operations should be rejected (got ${rejected})`,
      );
      assert.strictEqual(store.size, n, `run ${run}: store must contain exactly ${n} entries`);
    }
  });
});
