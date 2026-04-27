/**
 * Property Tests: Event Processing Framework
 *
 * - Property 5: Event Processing Idempotency (Req 4.7)
 * - Property 6: Event Handler Correlation Tracking (Req 4.2, 9.3)
 */

import fc from 'fast-check';
import { EventBus } from '../event-bus';
import { BaseEventHandler, InMemoryIdempotencyStore } from '../base-handler';
import type { DomainEvent, EventContext } from '../../types';

class CountingHandler extends BaseEventHandler<Record<string, unknown>> {
  public count = 0;
  public lastContext: EventContext | null = null;

  getEventType(): string {
    return 'test.event';
  }

  async handle(_payload: Record<string, unknown>, context: EventContext): Promise<void> {
    this.count++;
    this.lastContext = { ...context };
  }
}

function buildEvent(params: Partial<DomainEvent> = {}): DomainEvent {
  return {
    eventType: params.eventType ?? 'test.event',
    correlationId: params.correlationId ?? 'corr',
    timestamp: params.timestamp ?? new Date().toISOString(),
    payload: params.payload ?? { ok: true },
    metadata: params.metadata ?? {},
  };
}

describe('Property 5: Event Processing Idempotency', () => {
  it('should process the same idempotencyKey at most once', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 64 }),
        fc.jsonValue(),
        fc.jsonValue(),
        async (idempotencyKey: string, payloadA: unknown, payloadB: unknown) => {
          const store = new InMemoryIdempotencyStore();
          const handler = new CountingHandler({ idempotencyStore: store });
          const bus = new EventBus();
          bus.subscribe(handler.getEventType(), handler);

          const event1 = buildEvent({
            payload: payloadA,
            metadata: { idempotencyKey },
          });
          const event2 = buildEvent({
            payload: payloadB,
            metadata: { idempotencyKey },
          });

          await bus.publish(event1);
          await bus.publish(event2);

          expect(handler.count).toBe(1);
        },
      ),
      { numRuns: 100 },
    );
  });
});

describe('Property 6: Event Handler Correlation Tracking', () => {
  it('should pass through correlationId in EventContext', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 64 }),
        fc.jsonValue(),
        async (correlationId: string, payload: unknown) => {
          const handler = new CountingHandler();
          const bus = new EventBus();
          bus.subscribe(handler.getEventType(), handler);

          const event = buildEvent({ correlationId, payload });
          await bus.publish(event);

          expect(handler.lastContext?.correlationId).toBe(correlationId);
        },
      ),
      { numRuns: 100 },
    );
  });
});
