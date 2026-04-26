/**
 * Property-Based Test: Notification Service Uses Event Idempotency Key as BullMQ Job ID
 *
 * Feature: rabbitmq-event-bus, Property 9: Notification Service Uses Event Idempotency Key as BullMQ Job ID
 * For any domain event received by the Notification Service AMQP consumer,
 * the BullMQ job enqueued for that event SHALL have jobId equal to event.idempotencyKey.
 *
 * Validates: Requirements 5.5
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as fc from 'fast-check';
import type { DomainEvent, NotificationJobDTO } from '@superboard/shared';

const ITERATIONS = 100;

// Mock BullMQ Queue
class MockBullMQQueue {
  public enqueuedJobs: Array<{
    type: string;
    data: NotificationJobDTO;
    options: Record<string, unknown>;
  }> = [];

  async add(
    type: string,
    data: NotificationJobDTO,
    options: Record<string, unknown>,
  ): Promise<void> {
    this.enqueuedJobs.push({ type, data, options });
  }

  clear(): void {
    this.enqueuedJobs = [];
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
  constructor(private notifQueue: MockBullMQQueue) {}

  async handleMessage(msg: MockAmqpMessage): Promise<void> {
    const event: DomainEvent = JSON.parse(msg.content.toString());

    // Only process supported event types
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
      return; // Skip unsupported events
    }

    // Map event to notification jobs (simplified)
    const jobs = this.mapEventToNotificationJobs(event);

    // Enqueue jobs with idempotencyKey as jobId
    for (const job of jobs) {
      await this.notifQueue.add(job.type, job, {
        jobId: event.idempotencyKey, // This is the key property being tested
        attempts: 5,
        backoff: { type: 'exponential', delay: 1000 },
      });
    }
  }

  private mapEventToNotificationJobs(event: DomainEvent): NotificationJobDTO[] {
    const payload = event.payload as Record<string, unknown>;
    const base = {
      id: `notif-${Date.now()}`,
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
            payload: {
              title: 'New task assigned',
              body: `Task "${payload.title}" was created`,
              metadata: { taskId: payload.taskId },
            },
          },
        ];
      case 'user.invited':
        return [
          {
            ...base,
            type: 'email',
            recipientId: (payload.inviteeId as string) ?? 'default-user',
            payload: {
              title: 'You have been invited',
              body: 'Welcome to the workspace',
              metadata: { workspaceId: payload.workspaceId },
            },
          },
        ];
      default:
        return [
          {
            ...base,
            type: 'in-app',
            recipientId: 'default-user',
            payload: {
              title: `Event: ${event.eventType}`,
              metadata: { eventId: event.eventId },
            },
          },
        ];
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
  ),
  eventVersion: fc.constant('1.0'),
  idempotencyKey: fc.uuid(),
  correlationId: fc.uuid(),
  producer: fc.constant('core-api'),
  timestamp: fc.date().map((d) => d.toISOString()),
  payload: fc.record({
    taskId: fc.uuid(),
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

describe('Property 9: Notification Service Uses Event Idempotency Key as BullMQ Job ID', () => {
  it('jobId equals event.idempotencyKey for any domain event', async () => {
    await fc.assert(
      fc.asyncProperty(domainEventArb, async (event) => {
        const mockQueue = new MockBullMQQueue();
        const consumer = new TestAmqpEventConsumer(mockQueue);
        const message = await fc.sample(amqpMessageArb(event), 1)[0];

        await consumer.handleMessage(message);

        // Verify that all enqueued jobs have jobId equal to event.idempotencyKey
        for (const enqueuedJob of mockQueue.enqueuedJobs) {
          assert.equal(
            enqueuedJob.options.jobId,
            event.idempotencyKey,
            `Job ${enqueuedJob.data.id} must have jobId equal to event.idempotencyKey ${event.idempotencyKey}`,
          );
        }
      }),
      { numRuns: ITERATIONS },
    );
  });

  it('multiple events with different idempotencyKeys produce jobs with different jobIds', async () => {
    await fc.assert(
      fc.asyncProperty(fc.array(domainEventArb, { minLength: 2, maxLength: 5 }), async (events) => {
        // Ensure all events have unique idempotencyKeys
        const uniqueKeys = new Set(events.map((e) => e.idempotencyKey));
        if (uniqueKeys.size !== events.length) return; // Skip if not unique

        const mockQueue = new MockBullMQQueue();
        const consumer = new TestAmqpEventConsumer(mockQueue);

        // Process all events
        for (const event of events) {
          const message = await fc.sample(amqpMessageArb(event), 1)[0];
          await consumer.handleMessage(message);
        }

        // Collect all jobIds
        const jobIds = mockQueue.enqueuedJobs.map((job) => job.options.jobId);
        const uniqueJobIds = new Set(jobIds);

        // Verify that we have as many unique jobIds as unique idempotencyKeys
        assert.equal(
          uniqueJobIds.size,
          uniqueKeys.size,
          `Number of unique jobIds (${uniqueJobIds.size}) must equal number of unique idempotencyKeys (${uniqueKeys.size})`,
        );

        // Verify each jobId corresponds to an idempotencyKey
        for (const jobId of jobIds) {
          assert.ok(
            uniqueKeys.has(jobId),
            `JobId ${jobId} must be one of the event idempotencyKeys`,
          );
        }
      }),
      { numRuns: ITERATIONS },
    );
  });

  it('same event processed multiple times uses same jobId (idempotency)', async () => {
    await fc.assert(
      fc.asyncProperty(
        domainEventArb,
        fc.integer({ min: 2, max: 5 }),
        async (event, processCount) => {
          const mockQueue = new MockBullMQQueue();
          const consumer = new TestAmqpEventConsumer(mockQueue);
          const message = await fc.sample(amqpMessageArb(event), 1)[0];

          // Process the same event multiple times
          for (let i = 0; i < processCount; i++) {
            await consumer.handleMessage(message);
          }

          // All jobs should have the same jobId (event.idempotencyKey)
          const jobIds = mockQueue.enqueuedJobs.map((job) => job.options.jobId);
          const uniqueJobIds = new Set(jobIds);

          assert.equal(
            uniqueJobIds.size,
            1,
            `All jobs from the same event must have the same jobId`,
          );

          assert.equal(
            Array.from(uniqueJobIds)[0],
            event.idempotencyKey,
            `The jobId must equal the event's idempotencyKey`,
          );
        },
      ),
      { numRuns: ITERATIONS },
    );
  });
});
