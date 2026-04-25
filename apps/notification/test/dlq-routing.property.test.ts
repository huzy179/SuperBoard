/**
 * Property-Based Test: Failed Events Route to DLQ After Max Retries
 *
 * Property 13: Failed Events Route to DLQ After Max Retries
 * For any domain event that consistently fails processing by a consumer
 * (AI or Notification), after exhausting the configured maximum retry
 * attempts, the event must appear in the Dead-Letter Queue — never
 * silently dropped.
 *
 * Validates: Requirements 13.3
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { DomainEvent } from '@superboard/shared';

const ITERATIONS = 100;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomUlid(): string {
  const alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  return Array.from({ length: 26 }, () => alphabet[randomInt(0, alphabet.length - 1)]).join('');
}

const EVENT_TYPES = [
  'task.created',
  'task.updated',
  'task.status_changed',
  'doc.updated',
  'doc.version_created',
  'message.sent',
  'project.updated',
  'user.invited',
  'user.member_joined',
];

function randomEventType(): string {
  return EVENT_TYPES[randomInt(0, EVENT_TYPES.length - 1)];
}

function buildDomainEvent(overrides: Partial<DomainEvent> = {}): DomainEvent {
  return {
    eventId: randomUlid(),
    eventType: randomEventType(),
    eventVersion: '1.0',
    producer: 'core-api',
    correlationId: randomUlid(),
    idempotencyKey: `key-${randomUlid()}`,
    occurredAt: new Date().toISOString(),
    payload: { workspaceId: 'ws-1' },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Consumer simulation
// ---------------------------------------------------------------------------

interface DlqEntry {
  event: DomainEvent;
  error: string;
  failedAt: string;
  attempts: number;
}

/**
 * Simulates a consumer that processes events with retry + DLQ logic.
 * `handler` is the processing function — throw to simulate failure.
 */
async function processWithRetryAndDlq(
  event: DomainEvent,
  handler: (event: DomainEvent) => Promise<void>,
  maxAttempts: number,
  dlq: DlqEntry[],
): Promise<'success' | 'dlq'> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await handler(event);
      return 'success';
    } catch (err) {
      lastError = err as Error;
      // Exponential backoff is skipped in tests (no real sleep)
    }
  }

  // All retries exhausted → DLQ
  dlq.push({
    event,
    error: lastError?.message ?? 'unknown',
    failedAt: new Date().toISOString(),
    attempts: maxAttempts,
  });
  return 'dlq';
}

// ---------------------------------------------------------------------------
// Property tests
// ---------------------------------------------------------------------------

describe('Property 13: Failed Events Route to DLQ After Max Retries', () => {
  /**
   * Core property: an event that always fails must end up in the DLQ,
   * never silently dropped.
   */
  it('always-failing event is routed to DLQ, never dropped', async () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const maxAttempts = randomInt(1, 5);
      const dlq: DlqEntry[] = [];
      const event = buildDomainEvent();

      const alwaysFail = async (_e: DomainEvent) => {
        throw new Error('processing failed');
      };

      const result = await processWithRetryAndDlq(event, alwaysFail, maxAttempts, dlq);

      assert.strictEqual(result, 'dlq', `iteration ${i}: result must be 'dlq'`);
      assert.strictEqual(dlq.length, 1, `iteration ${i}: DLQ must contain exactly 1 entry`);
      assert.strictEqual(
        dlq[0].event.eventId,
        event.eventId,
        `iteration ${i}: DLQ entry must contain the original event`,
      );
    }
  });

  /**
   * DLQ entry must preserve the original event's identity fields.
   */
  it('DLQ entry preserves event identity (eventId, eventType, correlationId)', async () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const dlq: DlqEntry[] = [];
      const event = buildDomainEvent();

      await processWithRetryAndDlq(
        event,
        async () => {
          throw new Error('fail');
        },
        3,
        dlq,
      );

      assert.strictEqual(dlq.length, 1);
      const entry = dlq[0];
      assert.strictEqual(entry.event.eventId, event.eventId, `iteration ${i}: eventId preserved`);
      assert.strictEqual(
        entry.event.eventType,
        event.eventType,
        `iteration ${i}: eventType preserved`,
      );
      assert.strictEqual(
        entry.event.correlationId,
        event.correlationId,
        `iteration ${i}: correlationId preserved`,
      );
    }
  });

  /**
   * A consumer that succeeds on the last attempt must NOT route to DLQ.
   */
  it('event that succeeds before max retries is NOT routed to DLQ', async () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const maxAttempts = randomInt(2, 5);
      const succeedOnAttempt = randomInt(1, maxAttempts);
      const dlq: DlqEntry[] = [];
      const event = buildDomainEvent();
      let attempts = 0;

      const flakyHandler = async (_e: DomainEvent) => {
        attempts++;
        if (attempts < succeedOnAttempt) throw new Error('transient');
      };

      const result = await processWithRetryAndDlq(event, flakyHandler, maxAttempts, dlq);

      assert.strictEqual(result, 'success', `iteration ${i}: must succeed before max retries`);
      assert.strictEqual(dlq.length, 0, `iteration ${i}: DLQ must be empty on success`);
    }
  });

  /**
   * Consumer is called exactly maxAttempts times before routing to DLQ.
   */
  it('consumer is called exactly maxAttempts times before DLQ routing', async () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const maxAttempts = randomInt(1, 5);
      const dlq: DlqEntry[] = [];
      const event = buildDomainEvent();
      let callCount = 0;

      const countingHandler = async (_e: DomainEvent) => {
        callCount++;
        throw new Error('always fail');
      };

      await processWithRetryAndDlq(event, countingHandler, maxAttempts, dlq);

      assert.strictEqual(
        callCount,
        maxAttempts,
        `iteration ${i}: handler must be called exactly ${maxAttempts} times`,
      );
    }
  });

  /**
   * Multiple distinct events that all fail must each appear in the DLQ exactly once.
   */
  it('N failing events each appear in DLQ exactly once', async () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const n = randomInt(2, 10);
      const dlq: DlqEntry[] = [];
      const events = Array.from({ length: n }, () => buildDomainEvent());

      for (const event of events) {
        await processWithRetryAndDlq(
          event,
          async () => {
            throw new Error('fail');
          },
          3,
          dlq,
        );
      }

      assert.strictEqual(dlq.length, n, `iteration ${i}: DLQ must contain exactly ${n} entries`);

      const dlqEventIds = new Set(dlq.map((e) => e.event.eventId));
      assert.strictEqual(
        dlqEventIds.size,
        n,
        `iteration ${i}: all ${n} events must be distinct in DLQ`,
      );
    }
  });

  /**
   * DLQ entry must include a non-empty error message (never silently dropped).
   */
  it('DLQ entry always contains a non-empty error message', async () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const dlq: DlqEntry[] = [];
      const errorMsg = `error-${randomUlid()}`;
      const event = buildDomainEvent();

      await processWithRetryAndDlq(
        event,
        async () => {
          throw new Error(errorMsg);
        },
        randomInt(1, 4),
        dlq,
      );

      assert.strictEqual(dlq.length, 1);
      assert.ok(
        dlq[0].error.length > 0,
        `iteration ${i}: DLQ entry must have non-empty error message`,
      );
      assert.ok(
        dlq[0].error.includes(errorMsg),
        `iteration ${i}: DLQ error must contain the original error message`,
      );
    }
  });

  /**
   * DLQ entry must record the number of attempts made.
   */
  it('DLQ entry records the number of attempts made', async () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const maxAttempts = randomInt(1, 5);
      const dlq: DlqEntry[] = [];
      const event = buildDomainEvent();

      await processWithRetryAndDlq(
        event,
        async () => {
          throw new Error('fail');
        },
        maxAttempts,
        dlq,
      );

      assert.strictEqual(
        dlq[0].attempts,
        maxAttempts,
        `iteration ${i}: DLQ entry must record ${maxAttempts} attempts`,
      );
    }
  });
});
