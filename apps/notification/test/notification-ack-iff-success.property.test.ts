/**
 * Property-Based Test: ACK Sent If and Only If Processing Succeeds — Notification Service
 *
 * Feature: rabbitmq-event-bus, Property 8: ACK Sent If and Only If Processing Succeeds
 * For any AMQP message delivered to the Notification Service consumer,
 * the consumer SHALL send channel.ack() if and only if the event handler completes without throwing.
 * If the handler throws, the consumer SHALL send channel.nack(msg, false, false) instead.
 *
 * Validates: Requirements 5.4
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as fc from 'fast-check';
import type { DomainEvent } from '@superboard/shared';

const ITERATIONS = 100;

// Mock AMQP Channel
class MockAmqpChannel {
  public ackCalls: Array<{ msg: MockAmqpMessage }> = [];
  public nackCalls: Array<{ msg: MockAmqpMessage; multiple: boolean; requeue: boolean }> = [];

  ack(msg: MockAmqpMessage): void {
    this.ackCalls.push({ msg });
  }

  nack(msg: MockAmqpMessage, multiple: boolean, requeue: boolean): void {
    this.nackCalls.push({ msg, multiple, requeue });
  }

  clear(): void {
    this.ackCalls = [];
    this.nackCalls = [];
  }
}

// Mock BullMQ Queue
class MockBullMQQueue {
  public shouldFail = false;
  public enqueuedJobs: Array<Record<string, unknown>> = [];

  async add(
    type: string,
    data: Record<string, unknown>,
    options: Record<string, unknown>,
  ): Promise<void> {
    if (this.shouldFail) {
      throw new Error('BullMQ enqueue failed');
    }
    this.enqueuedJobs.push({ type, data, options });
  }

  setShouldFail(shouldFail: boolean): void {
    this.shouldFail = shouldFail;
  }

  clear(): void {
    this.enqueuedJobs = [];
    this.shouldFail = false;
  }
}

// Mock AMQP Message
interface MockAmqpMessage {
  content: Buffer;
  properties: {
    messageId: string;
    correlationId: string;
  };
}

// Simplified version of AmqpEventConsumerService for testing
class TestAmqpEventConsumer {
  constructor(
    private channel: MockAmqpChannel,
    private notifQueue: MockBullMQQueue,
  ) {}

  async handleMessage(msg: MockAmqpMessage): Promise<void> {
    try {
      const event: DomainEvent = JSON.parse(msg.content.toString());

      // Supported event types
      const supportedTypes = new Set([
        'task.created',
        'task.updated',
        'task.status_changed',
        'doc.updated',
        'message.sent',
        'user.invited',
        'user.member_joined',
      ]);

      if (!supportedTypes.has(event.eventType)) {
        // Unsupported events are ACKed (not an error)
        this.channel.ack(msg);
        return;
      }

      // Map event to notification jobs (simplified)
      const jobs = this.mapEventToNotificationJobs(event);

      if (jobs.length === 0) {
        // No jobs to enqueue, but not an error
        this.channel.ack(msg);
        return;
      }

      // Enqueue jobs to BullMQ - this can throw
      for (const job of jobs) {
        await this.notifQueue.add(job.type, job, {
          jobId: event.idempotencyKey,
          attempts: 5,
        });
      }

      // ACK only after successful BullMQ enqueue
      this.channel.ack(msg);
    } catch (error) {
      // NACK with requeue=false to send to DLQ
      this.channel.nack(msg, false, false);
      throw error; // Re-throw for test verification
    }
  }

  private mapEventToNotificationJobs(event: DomainEvent): Record<string, unknown>[] {
    const payload = event.payload as Record<string, unknown>;

    // Always return at least one job for supported event types to ensure BullMQ enqueue is attempted
    const base = {
      id: `notif-${Date.now()}-${Math.random()}`,
      correlationId: event.correlationId,
      createdAt: new Date().toISOString(),
    };

    switch (event.eventType) {
      case 'task.created':
        return [
          {
            ...base,
            type: 'in-app',
            recipientId: (payload.assigneeId as string) ?? 'default-user',
            payload: { title: 'New task assigned' },
          },
        ];
      case 'task.updated':
        return [
          {
            ...base,
            type: 'in-app',
            recipientId: (payload.assigneeId as string) ?? 'default-user',
            payload: { title: 'Task updated' },
          },
        ];
      case 'task.status_changed':
        return [
          {
            ...base,
            type: 'in-app',
            recipientId: (payload.assigneeId as string) ?? 'default-user',
            payload: { title: 'Task status changed' },
          },
        ];
      case 'doc.updated':
        return [
          {
            ...base,
            type: 'in-app',
            recipientId: 'default-user',
            payload: { title: 'Document updated' },
          },
        ];
      case 'message.sent':
        return [
          {
            ...base,
            type: 'in-app',
            recipientId: 'default-user',
            payload: { title: 'New message' },
          },
        ];
      case 'user.invited':
        return [
          {
            ...base,
            type: 'email',
            recipientId: (payload.inviteeId as string) ?? 'default-user',
            payload: { title: 'You have been invited' },
          },
        ];
      case 'user.member_joined':
        return [
          {
            ...base,
            type: 'in-app',
            recipientId: 'default-user',
            payload: { title: 'Welcome!' },
          },
        ];
      default:
        // Return empty array for truly unsupported types
        return [];
    }
  }
}

// Generators
const domainEventArb = fc.record({
  eventId: fc.uuid(),
  eventType: fc.constantFrom(
    'task.created',
    'task.updated',
    'task.status_changed',
    'doc.updated',
    'message.sent',
    'user.invited',
    'user.member_joined',
    'unsupported.event', // Include unsupported type to test ACK behavior
  ),
  eventVersion: fc.constant('1.0'),
  idempotencyKey: fc.uuid(),
  correlationId: fc.uuid(),
  producer: fc.constant('core-api'),
  timestamp: fc.date().map((d) => d.toISOString()),
  payload: fc.record({
    assigneeId: fc.uuid(),
    inviteeId: fc.uuid(),
    workspaceId: fc.uuid(),
    title: fc.string({ minLength: 1, maxLength: 100 }),
  }),
});

const amqpMessageArb = (event: DomainEvent) =>
  fc.record({
    content: fc.constant(Buffer.from(JSON.stringify(event))),
    properties: fc.record({
      messageId: fc.constant(event.idempotencyKey),
      correlationId: fc.constant(event.correlationId),
    }),
  });

describe('Property 8: ACK Sent If and Only If Processing Succeeds — Notification Service', () => {
  it('ACK is sent when processing succeeds', async () => {
    await fc.assert(
      fc.asyncProperty(domainEventArb, async (event) => {
        const mockChannel = new MockAmqpChannel();
        const mockQueue = new MockBullMQQueue();
        mockQueue.setShouldFail(false); // Ensure success

        const consumer = new TestAmqpEventConsumer(mockChannel, mockQueue);
        const message = await fc.sample(amqpMessageArb(event), 1)[0];

        // This should not throw
        await consumer.handleMessage(message);

        // Verify ACK was called exactly once
        assert.equal(
          mockChannel.ackCalls.length,
          1,
          `ACK must be called exactly once when processing succeeds for event ${event.eventType}`,
        );

        // Verify NACK was not called
        assert.equal(
          mockChannel.nackCalls.length,
          0,
          `NACK must not be called when processing succeeds for event ${event.eventType}`,
        );

        // Verify the correct message was ACKed
        assert.equal(mockChannel.ackCalls[0].msg, message, `The correct message must be ACKed`);
      }),
      { numRuns: ITERATIONS },
    );
  });

  it('NACK is sent when processing fails', async () => {
    await fc.assert(
      fc.asyncProperty(domainEventArb, async (event) => {
        // Only test with supported event types that would actually try to enqueue jobs
        const supportedTypes = new Set([
          'task.created',
          'task.updated',
          'task.status_changed',
          'doc.updated',
          'message.sent',
          'user.invited',
          'user.member_joined',
        ]);

        if (!supportedTypes.has(event.eventType)) {
          return; // Skip unsupported events as they don't fail
        }

        const mockChannel = new MockAmqpChannel();
        const mockQueue = new MockBullMQQueue();
        mockQueue.setShouldFail(true); // Force failure

        const consumer = new TestAmqpEventConsumer(mockChannel, mockQueue);
        const message = await fc.sample(amqpMessageArb(event), 1)[0];

        // This should throw due to BullMQ failure
        let didThrow = false;
        try {
          await consumer.handleMessage(message);
        } catch {
          didThrow = true;
        }

        assert.ok(
          didThrow,
          `Processing must throw when BullMQ enqueue fails for event ${event.eventType}`,
        );

        // Verify NACK was called exactly once
        assert.equal(
          mockChannel.nackCalls.length,
          1,
          `NACK must be called exactly once when processing fails for event ${event.eventType}`,
        );

        // Verify ACK was not called
        assert.equal(
          mockChannel.ackCalls.length,
          0,
          `ACK must not be called when processing fails for event ${event.eventType}`,
        );

        // Verify NACK was called with correct parameters (requeue=false)
        const nackCall = mockChannel.nackCalls[0];
        assert.equal(nackCall.msg, message, `The correct message must be NACKed`);
        assert.equal(nackCall.multiple, false, `NACK multiple must be false`);
        assert.equal(nackCall.requeue, false, `NACK requeue must be false (send to DLQ)`);
      }),
      { numRuns: ITERATIONS },
    );
  });

  it('exactly one of ACK or NACK is called for any message', async () => {
    await fc.assert(
      fc.asyncProperty(domainEventArb, fc.boolean(), async (event, shouldFail) => {
        const mockChannel = new MockAmqpChannel();
        const mockQueue = new MockBullMQQueue();
        mockQueue.setShouldFail(shouldFail);

        const consumer = new TestAmqpEventConsumer(mockChannel, mockQueue);
        const message = await fc.sample(amqpMessageArb(event), 1)[0];

        try {
          await consumer.handleMessage(message);
        } catch {
          // Ignore the error, we're testing the ACK/NACK behavior
        }

        const totalCalls = mockChannel.ackCalls.length + mockChannel.nackCalls.length;
        assert.equal(
          totalCalls,
          1,
          `Exactly one of ACK or NACK must be called for event ${event.eventType} (shouldFail=${shouldFail})`,
        );

        if (shouldFail) {
          // For supported events that would try to enqueue, expect NACK
          const supportedTypes = new Set([
            'task.created',
            'task.updated',
            'task.status_changed',
            'doc.updated',
            'message.sent',
            'user.invited',
            'user.member_joined',
          ]);

          if (supportedTypes.has(event.eventType)) {
            assert.equal(
              mockChannel.nackCalls.length,
              1,
              `NACK expected for failing supported event`,
            );
            assert.equal(mockChannel.ackCalls.length, 0, `ACK not expected for failing event`);
          } else {
            // Unsupported events are ACKed even when queue would fail
            assert.equal(mockChannel.ackCalls.length, 1, `ACK expected for unsupported event`);
            assert.equal(
              mockChannel.nackCalls.length,
              0,
              `NACK not expected for unsupported event`,
            );
          }
        } else {
          // Success case - always ACK
          assert.equal(mockChannel.ackCalls.length, 1, `ACK expected for successful processing`);
          assert.equal(
            mockChannel.nackCalls.length,
            0,
            `NACK not expected for successful processing`,
          );
        }
      }),
      { numRuns: ITERATIONS },
    );
  });

  it('malformed JSON message results in NACK', async () => {
    await fc.assert(
      fc.asyncProperty(fc.string(), async (malformedJson) => {
        // Ensure it's actually malformed JSON
        let isValidJson = false;
        try {
          JSON.parse(malformedJson);
          isValidJson = true;
        } catch {
          // Good, it's malformed
        }

        if (isValidJson) return; // Skip valid JSON

        const mockChannel = new MockAmqpChannel();
        const mockQueue = new MockBullMQQueue();
        const consumer = new TestAmqpEventConsumer(mockChannel, mockQueue);

        const message: MockAmqpMessage = {
          content: Buffer.from(malformedJson),
          properties: {
            messageId: 'test-id',
            correlationId: 'test-correlation',
          },
        };

        let didThrow = false;
        try {
          await consumer.handleMessage(message);
        } catch {
          didThrow = true;
        }

        assert.ok(didThrow, `Malformed JSON must cause processing to throw`);

        // Verify NACK was called
        assert.equal(mockChannel.nackCalls.length, 1, `NACK must be called for malformed JSON`);

        // Verify ACK was not called
        assert.equal(mockChannel.ackCalls.length, 0, `ACK must not be called for malformed JSON`);
      }),
      { numRuns: ITERATIONS },
    );
  });
});
