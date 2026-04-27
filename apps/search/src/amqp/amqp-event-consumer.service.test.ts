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
import { MetricsService } from '@superboard/backend-shared/metrics';

function mockFields(routingKey: string): amqplib.ConsumeMessageFields {
  return {
    consumerTag: 'test',
    deliveryTag: 1,
    redelivered: false,
    exchange: 'superboard.domain.events',
    routingKey,
  };
}

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
  let mockMetrics: MetricsService;
  let ackCalls: number;
  let nackCalls: number;
  let publishCalls: number;

  beforeEach(() => {
    ackCalls = 0;
    nackCalls = 0;
    publishCalls = 0;

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

    mockMetrics = new MetricsService({ enabled: false });

    // Mock Channel (only the methods used by BaseAMQPConsumer)
    mockChannel = {
      ack: () => {
        ackCalls++;
      },
      nack: () => {
        nackCalls++;
      },
      publish: () => {
        publishCalls++;
        return true;
      },
      close: async () => {},
    };

    // Create service instance
    service = new AmqpEventConsumerService(mockConfigService as ConfigService, mockMetrics);
    service['channel'] = mockChannel as amqplib.Channel;
  });

  afterEach(() => {
    ackCalls = 0;
    nackCalls = 0;
    publishCalls = 0;
  });

  it('should ACK message when event processing succeeds', async () => {
    await fc.assert(
      fc.asyncProperty(domainEventArb, async (event: DomainEvent) => {
        ackCalls = 0;
        nackCalls = 0;
        publishCalls = 0;

        // Create a mock message
        const mockMessage: Partial<amqplib.ConsumeMessage> = {
          content: Buffer.from(JSON.stringify(event)),
          fields: mockFields(event.eventType),
          properties: {
            messageId: event.idempotencyKey,
            correlationId: event.correlationId,
            headers: {},
          } as unknown as amqplib.MessageProperties,
        };

        const originalPublish = service['eventBus'].publish.bind(service['eventBus']);
        service['eventBus'].publish = async () => {};

        // Handle the message
        await service['onMessage'](mockMessage as amqplib.ConsumeMessage);

        // Verify ACK was called exactly once
        assert.equal(ackCalls, 1, 'ACK should be called exactly once on success');
        assert.equal(nackCalls, 0, 'NACK should not be called on success');
        assert.equal(publishCalls, 0, 'DLQ publish should not occur on success');

        service['eventBus'].publish = originalPublish;
      }),
      { numRuns: 100 },
    );
  });

  it('should publish to DLQ and ACK when event processing fails', async () => {
    await fc.assert(
      fc.asyncProperty(domainEventArb, async (event: DomainEvent) => {
        ackCalls = 0;
        nackCalls = 0;
        publishCalls = 0;

        // Create a mock message
        const mockMessage: Partial<amqplib.ConsumeMessage> = {
          content: Buffer.from(JSON.stringify(event)),
          fields: mockFields(event.eventType),
          properties: {
            messageId: event.idempotencyKey,
            correlationId: event.correlationId,
            headers: {},
          } as unknown as amqplib.MessageProperties,
        };

        const originalPublish = service['eventBus'].publish.bind(service['eventBus']);
        service['eventBus'].publish = async () => {
          throw new Error('Index update failed');
        };

        // Handle the message
        await service['onMessage'](mockMessage as amqplib.ConsumeMessage);

        // With shared consumer DLQ publish enabled, failure is ACKed after DLQ publish.
        assert.equal(publishCalls, 1, 'DLQ publish should be called exactly once on failure');
        assert.equal(ackCalls, 1, 'ACK should be called exactly once after DLQ publish');
        assert.equal(nackCalls, 0, 'NACK should not be called when DLQ publish succeeds');

        service['eventBus'].publish = originalPublish;
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
          publishCalls = 0;

          // Create a mock message
          const mockMessage: Partial<amqplib.ConsumeMessage> = {
            content: Buffer.from(JSON.stringify(event)),
            fields: mockFields(event.eventType),
            properties: {
              messageId: event.idempotencyKey,
              correlationId: event.correlationId,
              headers: {},
            } as unknown as amqplib.MessageProperties,
          };

          // Handle the message
          await service['onMessage'](mockMessage as amqplib.ConsumeMessage);

          // Verify ACK was called (unsupported events are discarded gracefully)
          assert.equal(ackCalls, 1, 'ACK should be called for unsupported event types');
          assert.equal(nackCalls, 0, 'NACK should not be called for unsupported event types');
          assert.equal(publishCalls, 0, 'DLQ publish should not occur for ignored event types');
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should NACK message when JSON parsing fails', async () => {
    ackCalls = 0;
    nackCalls = 0;
    publishCalls = 0;

    // Create a mock message with invalid JSON
    const mockMessage: Partial<amqplib.ConsumeMessage> = {
      content: Buffer.from('invalid json'),
      fields: mockFields('task.created'),
      properties: { headers: {} } as unknown as amqplib.MessageProperties,
    };

    // Handle the message
    await service['onMessage'](mockMessage as amqplib.ConsumeMessage);

    assert.equal(publishCalls, 1, 'DLQ publish should be called when JSON parsing fails');
    assert.equal(ackCalls, 1, 'ACK should be called after DLQ publish');
    assert.equal(nackCalls, 0, 'NACK should not be called when DLQ publish succeeds');
  });
});
