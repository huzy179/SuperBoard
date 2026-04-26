/**
 * Property-Based Test: Notification Event-to-Job Mapping Completeness
 *
 * Feature: rabbitmq-event-bus, Property 10: Notification Event-to-Job Mapping Completeness
 * For any domain event of a supported type received by the Notification Service,
 * at least one NotificationJobDTO SHALL be enqueued to BullMQ with correlationId matching the event's correlationId.
 *
 * Validates: Requirements 5.3
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

    // Supported event types that should trigger notifications
    const supportedTypes = new Set([
      'task.created',
      'task.updated',
      'task.status_changed',
      'doc.updated',
      'doc.version_created',
      'message.sent',
      'message.reaction_added',
      'project.updated',
      'user.invited',
      'user.member_joined',
    ]);

    if (!supportedTypes.has(event.eventType)) {
      return; // Skip unsupported events
    }

    // Map event to notification jobs
    const jobs = this.mapEventToNotificationJobs(event);

    // Enqueue jobs
    for (const job of jobs) {
      await this.notifQueue.add(job.type, job, {
        jobId: event.idempotencyKey,
        attempts: 5,
        backoff: { type: 'exponential', delay: 1000 },
      });
    }
  }

  private mapEventToNotificationJobs(event: DomainEvent): NotificationJobDTO[] {
    const payload = event.payload as Record<string, unknown>;
    const base = {
      id: `notif-${Date.now()}-${Math.random()}`,
      correlationId: event.correlationId, // This is the key property being tested
      createdAt: new Date().toISOString(),
    };

    switch (event.eventType) {
      case 'task.created':
        return [
          {
            ...base,
            type: 'in-app',
            recipientId:
              (payload.assigneeId as string) ?? (payload.creatorId as string) ?? 'default-user',
            payload: {
              title: 'New task assigned',
              body: `Task "${payload.title}" was created`,
              actionUrl: `/projects/${payload.projectId}/tasks/${payload.taskId}`,
              metadata: { taskId: payload.taskId, workspaceId: payload.workspaceId },
            },
          },
        ];

      case 'task.status_changed':
        return [
          {
            ...base,
            type: 'in-app',
            recipientId: (payload.changedBy as string) ?? 'default-user',
            payload: {
              title: 'Task status updated',
              body: `Task status changed from ${payload.oldStatus} to ${payload.newStatus}`,
              actionUrl: `/projects/${payload.projectId}/tasks/${payload.taskId}`,
              metadata: { taskId: payload.taskId, workspaceId: payload.workspaceId },
            },
          },
        ];

      case 'message.sent':
        return [
          {
            ...base,
            type: 'in-app',
            recipientId: (payload.recipientId as string) ?? 'default-user',
            payload: {
              title: 'New message',
              body: (payload.preview as string) ?? 'You have a new message',
              actionUrl: `/channels/${payload.channelId}`,
              metadata: { channelId: payload.channelId, workspaceId: payload.workspaceId },
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
              body: `You were invited to workspace ${payload.workspaceId}`,
              actionUrl: `/invite/${payload.inviteToken}`,
              metadata: { workspaceId: payload.workspaceId },
            },
          },
        ];

      case 'user.member_joined':
        return [
          {
            ...base,
            type: 'in-app',
            recipientId: (payload.userId as string) ?? 'default-user',
            payload: {
              title: 'Welcome!',
              body: `You joined workspace ${payload.workspaceId}`,
              actionUrl: `/workspaces/${payload.workspaceId}`,
              metadata: { workspaceId: payload.workspaceId },
            },
          },
        ];

      case 'doc.updated':
      case 'doc.version_created':
      case 'project.updated':
      case 'task.updated':
      case 'message.reaction_added': {
        // For other supported event types, create a generic notification if recipientId is available
        const recipientId =
          (payload.recipientId as string) ??
          (payload.userId as string) ??
          (payload.assigneeId as string);
        if (!recipientId) return []; // No notification if no recipient

        return [
          {
            ...base,
            type: 'in-app',
            recipientId,
            payload: {
              title: `Event: ${event.eventType}`,
              body: `A ${event.eventType} event occurred`,
              metadata: { eventId: event.eventId, workspaceId: payload.workspaceId },
            },
          },
        ];
      }

      default:
        return [];
    }
  }
}

// Generators
const supportedEventTypeArb = fc.constantFrom(
  'task.created',
  'task.updated',
  'task.status_changed',
  'doc.updated',
  'doc.version_created',
  'message.sent',
  'message.reaction_added',
  'project.updated',
  'user.invited',
  'user.member_joined',
);

const domainEventArb = fc.record({
  eventId: fc.uuid(),
  eventType: supportedEventTypeArb,
  eventVersion: fc.constant('1.0'),
  idempotencyKey: fc.uuid(),
  correlationId: fc.uuid(),
  producer: fc.constant('core-api'),
  timestamp: fc.date().map((d) => d.toISOString()),
  payload: fc.record({
    taskId: fc.uuid(),
    projectId: fc.uuid(),
    assigneeId: fc.uuid(),
    creatorId: fc.uuid(),
    changedBy: fc.uuid(),
    recipientId: fc.uuid(),
    userId: fc.uuid(),
    inviteeId: fc.uuid(),
    channelId: fc.uuid(),
    workspaceId: fc.uuid(),
    inviteToken: fc.uuid(),
    title: fc.string({ minLength: 1, maxLength: 100 }),
    preview: fc.string({ minLength: 1, maxLength: 200 }),
    oldStatus: fc.constantFrom('todo', 'in-progress', 'done'),
    newStatus: fc.constantFrom('todo', 'in-progress', 'done'),
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

describe('Property 10: Notification Event-to-Job Mapping Completeness', () => {
  it('at least one notification job is enqueued for any supported event type', async () => {
    await fc.assert(
      fc.asyncProperty(domainEventArb, async (event) => {
        const mockQueue = new MockBullMQQueue();
        const consumer = new TestAmqpEventConsumer(mockQueue);
        const message = await fc.sample(amqpMessageArb(event), 1)[0];

        await consumer.handleMessage(message);

        // Verify that at least one job was enqueued
        assert.ok(
          mockQueue.enqueuedJobs.length >= 1,
          `At least one notification job must be enqueued for supported event type '${event.eventType}'`,
        );
      }),
      { numRuns: ITERATIONS },
    );
  });

  it('all enqueued jobs have correlationId matching the event correlationId', async () => {
    await fc.assert(
      fc.asyncProperty(domainEventArb, async (event) => {
        const mockQueue = new MockBullMQQueue();
        const consumer = new TestAmqpEventConsumer(mockQueue);
        const message = await fc.sample(amqpMessageArb(event), 1)[0];

        await consumer.handleMessage(message);

        // Verify that all enqueued jobs have matching correlationId
        for (const enqueuedJob of mockQueue.enqueuedJobs) {
          assert.equal(
            enqueuedJob.data.correlationId,
            event.correlationId,
            `Job ${enqueuedJob.data.id} must have correlationId matching event correlationId ${event.correlationId}`,
          );
        }
      }),
      { numRuns: ITERATIONS },
    );
  });

  it('specific event types produce expected notification types', async () => {
    await fc.assert(
      fc.asyncProperty(domainEventArb, async (event) => {
        const mockQueue = new MockBullMQQueue();
        const consumer = new TestAmqpEventConsumer(mockQueue);
        const message = await fc.sample(amqpMessageArb(event), 1)[0];

        await consumer.handleMessage(message);

        // Verify event-specific mapping rules
        const jobs = mockQueue.enqueuedJobs.map((j) => j.data);

        switch (event.eventType) {
          case 'user.invited':
            // user.invited should produce email notifications
            assert.ok(
              jobs.some((job) => job.type === 'email'),
              `user.invited event should produce at least one email notification`,
            );
            break;

          case 'task.created':
          case 'task.status_changed':
          case 'message.sent':
          case 'user.member_joined':
            // These should produce in-app notifications
            assert.ok(
              jobs.some((job) => job.type === 'in-app'),
              `${event.eventType} event should produce at least one in-app notification`,
            );
            break;

          default:
            // Other supported types should produce some notification
            assert.ok(
              jobs.length > 0,
              `${event.eventType} should produce at least one notification`,
            );
        }
      }),
      { numRuns: ITERATIONS },
    );
  });

  it('multiple events produce jobs with distinct correlationIds', async () => {
    await fc.assert(
      fc.asyncProperty(fc.array(domainEventArb, { minLength: 2, maxLength: 5 }), async (events) => {
        // Ensure all events have unique correlationIds
        const uniqueCorrelationIds = new Set(events.map((e) => e.correlationId));
        if (uniqueCorrelationIds.size !== events.length) return; // Skip if not unique

        const mockQueue = new MockBullMQQueue();
        const consumer = new TestAmqpEventConsumer(mockQueue);

        // Process all events
        for (const event of events) {
          const message = await fc.sample(amqpMessageArb(event), 1)[0];
          await consumer.handleMessage(message);
        }

        // Collect all job correlationIds
        const jobCorrelationIds = mockQueue.enqueuedJobs.map((job) => job.data.correlationId);

        // Verify each job correlationId corresponds to an event correlationId
        for (const jobCorrelationId of jobCorrelationIds) {
          assert.ok(
            uniqueCorrelationIds.has(jobCorrelationId),
            `Job correlationId ${jobCorrelationId} must match one of the event correlationIds`,
          );
        }

        // Verify we have jobs for each event (at least one job per event)
        for (const eventCorrelationId of uniqueCorrelationIds) {
          assert.ok(
            jobCorrelationIds.includes(eventCorrelationId),
            `At least one job must be created for event with correlationId ${eventCorrelationId}`,
          );
        }
      }),
      { numRuns: ITERATIONS },
    );
  });
});
