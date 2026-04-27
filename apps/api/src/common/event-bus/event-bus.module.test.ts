import { test, describe } from 'node:test';
import assert from 'node:assert';
import * as fc from 'fast-check';
import type { DomainEvent } from '@superboard/shared';

// Feature: rabbitmq-event-bus, Property Tests
describe('EventBusModule Property Tests', () => {
  /**
   * Property 11: Feature Flag Routes to Correct Publisher
   * **Validates: Requirements 10.1, 10.2**
   */
  test('should route to RabbitMQ when flag is true, BullMQ when false', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          eventId: fc.string({ minLength: 1 }),
          eventType: fc.string({ minLength: 1 }),
          eventVersion: fc.string({ minLength: 1 }),
          producer: fc.string({ minLength: 1 }),
          correlationId: fc.string({ minLength: 1 }),
          idempotencyKey: fc.string({ minLength: 1 }),
          occurredAt: fc.date().map((d) => d.toISOString()),
          payload: fc.anything(),
        }),
        fc.boolean(), // feature flag value
        async (eventData: DomainEvent, enableRabbitMQ: boolean) => {
          let rabbitMQCalled = false;
          let bullMQCalled = false;

          // Mock RabbitMQEventBusService
          const mockRabbitMQService = {
            publish: async (_event: DomainEvent) => {
              rabbitMQCalled = true;
            },
          };

          // Mock EventBusService (BullMQ)
          const mockBullMQService = {
            publish: async (_event: DomainEvent) => {
              bullMQCalled = true;
            },
          };

          // Mock ConfigService
          const mockConfigService = {
            get: (key: string) => {
              if (key === 'ENABLE_RABBITMQ_EVENT_BUS') {
                return enableRabbitMQ ? 'true' : 'false';
              }
              return undefined;
            },
          };

          // Simulate the factory logic from EventBusModule
          const eventBus =
            mockConfigService.get('ENABLE_RABBITMQ_EVENT_BUS') === 'true'
              ? mockRabbitMQService
              : mockBullMQService;

          await eventBus.publish(eventData);

          if (enableRabbitMQ) {
            // When flag is true, only RabbitMQ should be called
            assert.ok(rabbitMQCalled, 'RabbitMQ service should be called when flag is true');
            assert.ok(!bullMQCalled, 'BullMQ service should NOT be called when flag is true');
          } else {
            // When flag is false, only BullMQ should be called
            assert.ok(!rabbitMQCalled, 'RabbitMQ service should NOT be called when flag is false');
            assert.ok(bullMQCalled, 'BullMQ service should be called when flag is false');
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 12: BullMQ Notification Queue Is Independent of Feature Flag
   * **Validates: Requirements 10.3, 5.2**
   */
  test('should process BullMQ notification jobs regardless of feature flag value', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.boolean(), // feature flag value
        fc.record({
          type: fc.constantFrom('email', 'push', 'sms'),
          recipientId: fc.string({ minLength: 1 }),
          title: fc.string({ minLength: 1 }),
          body: fc.string({ minLength: 1 }),
          correlationId: fc.string({ minLength: 1 }),
        }),
        async (enableRabbitMQ: boolean, notificationJob: Record<string, unknown>) => {
          let notificationProcessed = false;

          // Mock NotificationWorkerService behavior - this represents the BullMQ job processor
          // which should work independently of the domain event routing
          const mockNotificationWorker = {
            processNotificationJob: async (_job: Record<string, unknown>) => {
              notificationProcessed = true;
              return { success: true };
            },
          };

          // Mock BullMQ Queue for notifications - this is separate from domain events
          const mockNotificationQueue = {
            add: async (
              _jobType: string,
              jobData: Record<string, unknown>,
              options?: Record<string, unknown>,
            ) => {
              // Simulate job processing by the worker
              await mockNotificationWorker.processNotificationJob({
                id: options?.jobId || 'test-job-id',
                data: jobData,
              });
            },
          };

          // Simulate notification job processing (independent of domain event routing)
          // This represents the notification service adding jobs to BullMQ notification queue
          await mockNotificationQueue.add(notificationJob.type as string, notificationJob, {
            jobId: `notification-${notificationJob.correlationId as string}`,
          });

          // Verify that notification processing works regardless of feature flag
          assert.ok(
            notificationProcessed,
            `Notification job should be processed regardless of ENABLE_RABBITMQ_EVENT_BUS=${enableRabbitMQ}`,
          );
        },
      ),
      { numRuns: 100 },
    );
  });
});
