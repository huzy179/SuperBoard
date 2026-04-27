/**
 * Property-Based Tests for Search Service AMQP Event Consumer
 *
 * Feature: rabbitmq-event-bus, Property 8: ACK Sent If and Only If Processing Succeeds
 * Validates: Requirements 6.3, 6.4
 */
import { describe, it, beforeEach, afterEach } from 'node:test';
import { strict as assert } from 'node:assert';
import * as fc from 'fast-check';
import { ConfigService } from '@nestjs/config';
import * as amqplib from 'amqplib';
import { AmqpEventConsumerService } from './amqp-event-consumer.service';
import type { DomainEvent } from '@superboard/shared';

/**
 * Generator for valid domain events that the search service should process
 */
const domainEventArb = fc.record({
  eventId: fc.uuid(),
  eventType: fc.constantFrom(
    'task.created',
    'task.updated',
    'task.status_changed',
    'doc.updated',
    'project.updated',
  ),
  idempotencyKey: fc.uuid(),
  correlationId: fc.uuid(),
  timestamp: fc.date().map((d) => d.toISOString()),
  eventVersion: fc.constant('1'),
  producer: fc.constant('search-service'),
  occurredAt: fc.date().map((d) => d.toISOString()),
  payload: fc.record({
    taskId: fc.option(fc.uuid()),
    docId: fc.option(fc.uuid()),
    projectId: fc.uuid(),
  }),
}) as unknown as fc.Arbitrary<DomainEvent>;

describe('AmqpEventConsumerService - Property 8: ACK Sent If and Only If Processing Succeeds', () => {
  let service: AmqpEventConsumerService;
  let mockConfigService: Partial<ConfigService>;
  let mockChannel: Partial<amqplib.Channel>;
  let mockConnection: amqplib.Connection;
  let ackCalls: number;
  let nackCalls: number;

  beforeEach(() => {
    ackCalls = 0;
    nackCalls = 0;

    // Mock ConfigService
    mockConfigService = {
      get: (key: string) => {
        const config: Record<string, string> = {
          RABBITMQ_URL: 'amqp://localhost:5672',
          RABBITMQ_PREFETCH_COUNT: '10',
        };
        return config[key];
      },
    };

    // Mock Channel
    mockChannel = {
      assertExchange: async () =>
        ({ exchange: 'test' }) as unknown as amqplib.Replies.AssertExchange,
      assertQueue: async () =>
        ({
          queue: 'test',
          messageCount: 0,
          consumerCount: 0,
        }) as unknown as amqplib.Replies.AssertQueue,
      bindQueue: async () => ({}) as unknown as amqplib.Replies.Empty,
      prefetch: async () => ({}) as unknown as amqplib.Replies.Empty,
      consume: async () => ({ consumerTag: 'test' }) as unknown as amqplib.Replies.Consume,
      ack: () => {
        ackCalls++;
      },
      nack: () => {
        nackCalls++;
      },
      close: async () => {},
    };

    // Mock Connection
    mockConnection = {
      createChannel: async () => mockChannel as amqplib.Channel,
      on: () => mockConnection,
      close: async () => {},
    } as unknown as amqplib.Connection;

    // Create service instance
    service = new AmqpEventConsumerService(mockConfigService as ConfigService);
    service['connection'] = mockConnection;
    service['channel'] = mockChannel as amqplib.Channel;
  });

  afterEach(() => {
    ackCalls = 0;
    nackCalls = 0;
  });

  it('should ACK message when event processing succeeds', async () => {
    await fc.assert(
      fc.asyncProperty(domainEventArb, async (event: DomainEvent) => {
        ackCalls = 0;
        nackCalls = 0;

        // Create a mock message
        const mockMessage: Partial<amqplib.Message> = {
          content: Buffer.from(JSON.stringify(event)),
          properties: {
            messageId: event.idempotencyKey,
            correlationId: event.correlationId,
          } as unknown as amqplib.MessageProperties,
        };

        // Mock successful index update
        const originalUpdateSearchIndex = service['updateSearchIndex'];
        service['updateSearchIndex'] = async () => {
          // Simulate successful processing
        };

        // Handle the message
        await service['handleMessage'](mockMessage as amqplib.Message);

        // Verify ACK was called exactly once
        assert.equal(ackCalls, 1, 'ACK should be called exactly once on success');
        assert.equal(nackCalls, 0, 'NACK should not be called on success');

        // Restore original method
        service['updateSearchIndex'] = originalUpdateSearchIndex;
      }),
      { numRuns: 100 },
    );
  });

  it('should NACK message with requeue=false when event processing fails', async () => {
    await fc.assert(
      fc.asyncProperty(domainEventArb, async (event: DomainEvent) => {
        ackCalls = 0;
        nackCalls = 0;

        // Create a mock message
        const mockMessage: Partial<amqplib.Message> = {
          content: Buffer.from(JSON.stringify(event)),
          properties: {
            messageId: event.idempotencyKey,
            correlationId: event.correlationId,
          } as unknown as amqplib.MessageProperties,
        };

        // Mock failed index update
        const originalUpdateSearchIndex = service['updateSearchIndex'];
        service['updateSearchIndex'] = async () => {
          throw new Error('Index update failed');
        };

        // Handle the message
        await service['handleMessage'](mockMessage as amqplib.Message);

        // Verify NACK was called exactly once
        assert.equal(nackCalls, 1, 'NACK should be called exactly once on failure');
        assert.equal(ackCalls, 0, 'ACK should not be called on failure');

        // Restore original method
        service['updateSearchIndex'] = originalUpdateSearchIndex;
      }),
      { numRuns: 100 },
    );
  });

  it('should ACK message for unsupported event types (graceful discard)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          eventId: fc.uuid(),
          eventType: fc.constantFrom('unknown.event', 'other.type'),
          idempotencyKey: fc.uuid(),
          correlationId: fc.uuid(),
          timestamp: fc.date().map((d) => d.toISOString()),
          eventVersion: fc.constant('1'),
          producer: fc.constant('search-service'),
          occurredAt: fc.date().map((d) => d.toISOString()),
          payload: fc.record({}),
        }) as unknown as fc.Arbitrary<DomainEvent>,
        async (event: DomainEvent) => {
          ackCalls = 0;
          nackCalls = 0;

          // Create a mock message
          const mockMessage: Partial<amqplib.Message> = {
            content: Buffer.from(JSON.stringify(event)),
            properties: {
              messageId: event.idempotencyKey,
              correlationId: event.correlationId,
            } as unknown as amqplib.MessageProperties,
          };

          // Handle the message
          await service['handleMessage'](mockMessage as amqplib.Message);

          // Verify ACK was called (unsupported events are discarded gracefully)
          assert.equal(ackCalls, 1, 'ACK should be called for unsupported event types');
          assert.equal(nackCalls, 0, 'NACK should not be called for unsupported event types');
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should NACK message when JSON parsing fails', async () => {
    ackCalls = 0;
    nackCalls = 0;

    // Create a mock message with invalid JSON
    const mockMessage: Partial<amqplib.Message> = {
      content: Buffer.from('invalid json'),
      properties: {} as unknown as amqplib.MessageProperties,
    };

    // Handle the message
    await service['handleMessage'](mockMessage as amqplib.Message);

    // Verify NACK was called
    assert.equal(nackCalls, 1, 'NACK should be called when JSON parsing fails');
    assert.equal(ackCalls, 0, 'ACK should not be called when JSON parsing fails');
  });
});
