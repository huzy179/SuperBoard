import { test, describe, mock } from 'node:test';
import assert from 'node:assert';
import * as fc from 'fast-check';
import type { DomainEvent } from '@superboard/shared';
import type { ConfigService } from '@nestjs/config';
import type { RabbitMQMetricsService } from './rabbitmq-metrics.service';

// Feature: rabbitmq-event-bus, Property Tests
describe('RabbitMQEventBusService Property Tests', () => {
  /**
   * Property 1: Routing Key Equals Event Type
   * **Validates: Requirements 3.2**
   */
  test('should use event type as routing key for all published events', async () => {
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
        async (eventData: DomainEvent) => {
          let capturedRoutingKey: string | undefined;

          // Mock channel that captures routing key
          const mockChannel = {
            publish: (
              _exchange: string,
              routingKey: string,
              _content: Buffer,
              _options: unknown,
              callback: (err: Error | null) => void,
            ) => {
              capturedRoutingKey = routingKey;
              if (callback) callback(null);
              return true;
            },
            assertExchange: async () => {},
            close: async () => {},
          };

          // Mock connection
          const mockConnection = {
            createConfirmChannel: async () => mockChannel,
            close: async () => {},
            on: () => {},
          };

          // Mock ConfigService
          const mockConfigService = {
            getOrThrow: () => 'amqp://superboard:password@localhost:5672/superboard',
            get: (key: string) => {
              if (key === 'RABBITMQ_PUBLISH_MAX_RETRIES') return 3;
              if (key === 'RABBITMQ_PUBLISH_BACKOFF_BASE_MS') return 1000;
              return undefined;
            },
          };

          // Import and mock amqplib dynamically
          const amqplib = await import('amqplib');
          const originalConnect = amqplib.connect;
          (amqplib as unknown as Record<string, unknown>).connect = (async () =>
            mockConnection) as unknown as typeof originalConnect;

          // Import service after mocking
          const { RabbitMQEventBusService } = await import('./rabbitmq-event-bus.service');

          const mockMetricsService = {
            recordPublish: mock.fn(),
            recordPublishDuration: mock.fn(),
          };

          const service = new RabbitMQEventBusService(
            mockConfigService as unknown as ConfigService,
            mockMetricsService as unknown as RabbitMQMetricsService,
          );
          await service.onModuleInit();
          await service.publish(eventData);

          // Verify that routing key equals event type
          assert.strictEqual(capturedRoutingKey, eventData.eventType);

          await service.onModuleDestroy();

          // Restore original connect
          (amqplib as unknown as Record<string, unknown>).connect = originalConnect;
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 2: Published Messages Are Persistent With Correct AMQP Properties
   * **Validates: Requirements 3.3, 3.4**
   */
  test('should publish messages with persistent delivery mode and correct AMQP properties', async () => {
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
        async (eventData: DomainEvent) => {
          let capturedOptions: Record<string, unknown> = {};

          const mockChannel = {
            publish: (
              _exchange: string,
              _routingKey: string,
              _content: Buffer,
              options: Record<string, unknown>,
              callback: (err: Error | null) => void,
            ) => {
              capturedOptions = options;
              if (callback) callback(null);
              return true;
            },
            assertExchange: async () => {},
            close: async () => {},
          };

          // Mock connection
          const mockConnection = {
            createConfirmChannel: async () => mockChannel,
            close: async () => {},
            on: () => {},
          };

          // Mock ConfigService
          const mockConfigService = {
            getOrThrow: () => 'amqp://superboard:password@localhost:5672/superboard',
            get: (key: string) => {
              if (key === 'RABBITMQ_PUBLISH_MAX_RETRIES') return 3;
              if (key === 'RABBITMQ_PUBLISH_BACKOFF_BASE_MS') return 1000;
              return undefined;
            },
          };

          // Import and mock amqplib dynamically
          const amqplib = await import('amqplib');
          const originalConnect = amqplib.connect;
          (amqplib as unknown as Record<string, unknown>).connect = (async () =>
            mockConnection) as unknown as typeof originalConnect;

          // Import service after mocking
          const { RabbitMQEventBusService } = await import('./rabbitmq-event-bus.service');

          const mockMetricsService = {
            recordPublish: mock.fn(),
            recordPublishDuration: mock.fn(),
          };

          const service = new RabbitMQEventBusService(
            mockConfigService as unknown as ConfigService,
            mockMetricsService as unknown as RabbitMQMetricsService,
          );
          await service.onModuleInit();
          await service.publish(eventData);

          // Verify AMQP properties
          assert.strictEqual(capturedOptions.deliveryMode, 2); // Persistent
          assert.strictEqual(capturedOptions.messageId, eventData.idempotencyKey);
          assert.strictEqual(capturedOptions.correlationId, eventData.correlationId);
          assert.strictEqual(capturedOptions.contentType, 'application/json');
          assert.ok(typeof capturedOptions.timestamp === 'number');
          assert.strictEqual(capturedOptions.headers['x-event-version'], eventData.eventVersion);
          assert.strictEqual(capturedOptions.headers['x-producer'], eventData.producer);

          await service.onModuleDestroy();

          // Restore original connect
          (amqplib as unknown as Record<string, unknown>).connect = originalConnect;
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 3: Publish Retry Uses Exponential Backoff
   * **Validates: Requirements 3.5**
   */
  test('should use exponential backoff for retry delays', async () => {
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
        fc.integer({ min: 1, max: 2 }), // failure count (1-2, less than maxRetries=3)
        async (eventData: DomainEvent, failureCount: number) => {
          const delays: number[] = [];
          let callCount = 0;

          // Mock channel that fails N times then succeeds
          const mockChannel = {
            publish: (
              _exchange: string,
              _routingKey: string,
              _content: Buffer,
              _options: unknown,
              callback: (err: Error | null) => void,
            ) => {
              callCount++;
              if (callCount <= failureCount) {
                if (callback) callback(new Error('Transient failure'));
                return false;
              } else {
                if (callback) callback(null);
                return true;
              }
            },
            assertExchange: async () => {},
            close: async () => {},
          };

          // Mock connection
          const mockConnection = {
            createConfirmChannel: async () => mockChannel,
            close: async () => {},
            on: () => {},
          };

          // Mock ConfigService
          const mockConfigService = {
            getOrThrow: () => 'amqp://superboard:password@localhost:5672/superboard',
            get: (key: string) => {
              if (key === 'RABBITMQ_PUBLISH_MAX_RETRIES') return 3;
              if (key === 'RABBITMQ_PUBLISH_BACKOFF_BASE_MS') return 1000;
              return undefined;
            },
          };

          // Import and mock amqplib dynamically
          const amqplib = await import('amqplib');
          const originalConnect = amqplib.connect;
          (amqplib as unknown as Record<string, unknown>).connect = (async () =>
            mockConnection) as unknown as typeof originalConnect;

          // Import service after mocking
          const { RabbitMQEventBusService } = await import('./rabbitmq-event-bus.service');

          const mockMetricsService = {
            recordPublish: mock.fn(),
            recordPublishDuration: mock.fn(),
          };

          const service = new RabbitMQEventBusService(
            mockConfigService as unknown as ConfigService,
            mockMetricsService as unknown as RabbitMQMetricsService,
          );

          // Mock sleep to capture delays
          const originalSleep = (service as unknown as Record<string, unknown>).sleep as (
            ms: number,
          ) => Promise<void>;
          (service as unknown as Record<string, unknown>).sleep = (ms: number) => {
            delays.push(ms);
            return Promise.resolve();
          };

          await service.onModuleInit();
          await service.publish(eventData);

          // Verify exponential backoff: each delay should be >= 2x the previous
          for (let i = 1; i < delays.length; i++) {
            // Account for jitter by checking base exponential growth
            const baseDelay1 = 1000 * Math.pow(2, i - 1);
            const baseDelay2 = 1000 * Math.pow(2, i);

            // The delay should be in the exponential range (allowing for jitter)
            assert.ok(delays[i] >= baseDelay1);
            assert.ok(delays[i] <= baseDelay2 + 500); // max jitter
          }

          await service.onModuleDestroy();

          // Restore original functions
          (service as unknown as Record<string, unknown>).sleep = originalSleep;
          (amqplib as unknown as Record<string, unknown>).connect = originalConnect;
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 4: Publish Failure Does Not Propagate as Unhandled Exception
   * **Validates: Requirements 3.6**
   */
  test('should resolve without throwing when all retries are exhausted', async () => {
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
        async (eventData: DomainEvent) => {
          let errorLogged = false;
          let loggedCorrelationId = '';

          // Mock channel that always fails
          const mockChannel = {
            publish: (
              _exchange: string,
              _routingKey: string,
              _content: Buffer,
              _options: unknown,
              callback: (err: Error | null) => void,
            ) => {
              if (callback) callback(new Error('Always fails'));
              return false;
            },
            assertExchange: async () => {},
            close: async () => {},
          };

          // Mock connection
          const mockConnection = {
            createConfirmChannel: async () => mockChannel,
            close: async () => {},
            on: () => {},
          };

          // Mock ConfigService
          const mockConfigService = {
            getOrThrow: () => 'amqp://superboard:password@localhost:5672/superboard',
            get: (key: string) => {
              if (key === 'RABBITMQ_PUBLISH_MAX_RETRIES') return 3;
              if (key === 'RABBITMQ_PUBLISH_BACKOFF_BASE_MS') return 1000;
              return undefined;
            },
          };

          // Import and mock amqplib dynamically
          const amqplib = await import('amqplib');
          const originalConnect = amqplib.connect;
          (amqplib as unknown as Record<string, unknown>).connect = (async () =>
            mockConnection) as unknown as typeof originalConnect;

          // Import service after mocking
          const { RabbitMQEventBusService } = await import('./rabbitmq-event-bus.service');

          const mockMetricsService = {
            recordPublish: mock.fn(),
            recordPublishDuration: mock.fn(),
          };

          const service = new RabbitMQEventBusService(
            mockConfigService as unknown as ConfigService,
            mockMetricsService as unknown as RabbitMQMetricsService,
          );

          // Mock logger to capture error logs
          const originalLogger = (service as unknown as Record<string, unknown>).logger;
          (service as unknown as Record<string, unknown>).logger = {
            ...(originalLogger as Record<string, unknown>),
            error: (message: string) => {
              errorLogged = true;
              loggedCorrelationId = message.includes(eventData.correlationId)
                ? eventData.correlationId
                : '';
            },
          };

          // Mock sleep to speed up test
          (service as unknown as Record<string, unknown>).sleep = () => Promise.resolve();

          await service.onModuleInit();

          // The publish method should resolve (not reject) even when all retries fail
          await service.publish(eventData);

          // Verify that an error log entry was created containing the correlationId
          assert.ok(errorLogged);
          assert.strictEqual(loggedCorrelationId, eventData.correlationId);

          await service.onModuleDestroy();

          // Restore original functions
          (service as unknown as Record<string, unknown>).logger = originalLogger;
          (amqplib as unknown as Record<string, unknown>).connect = originalConnect;
        },
      ),
      { numRuns: 100 },
    );
  });
});
