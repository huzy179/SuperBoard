/**
 * Integration tests for Automation AMQP consumer migration
 *
 * Validates: Requirements 1.1, 1.4, 1.5
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { ConsumeMessage } from 'amqplib';
import { MetricsService } from '@superboard/backend-shared/metrics';
import type { DomainEvent } from '@superboard/shared';
import { AutomationAmqpConsumerService } from './automation-amqp-consumer.service';

function makeConfigService(values: Record<string, string>) {
  return {
    get: (key: string) => values[key],
  };
}

function buildEvent(eventType: string): DomainEvent {
  return {
    eventId: '01HZZZZZZZZZZZZZZZZZZZZZZZ',
    eventType,
    eventVersion: '1.0',
    producer: 'automation-service',
    correlationId: 'corr-1',
    idempotencyKey: 'idem-1',
    occurredAt: new Date().toISOString(),
    payload: { taskId: 't1', projectId: 'p1', oldStatus: 'todo', newStatus: 'done' },
  };
}

function buildConsumeMessage(body: unknown, correlationId: string = 'corr-1'): ConsumeMessage {
  return {
    content: Buffer.from(JSON.stringify(body), 'utf8'),
    fields: {
      deliveryTag: 1,
      redelivered: false,
      exchange: 'ex',
      routingKey: 'task.created',
       
    } as any,
    properties: { correlationId, headers: {} },
  } as ConsumeMessage;
}

describe('AutomationAmqpConsumerService', () => {
  it('ACKs supported event types and processes them', async () => {
    const consumer = new AutomationAmqpConsumerService(
      makeConfigService({
        RABBITMQ_URL: 'amqp://localhost:5672',
        RABBITMQ_PREFETCH_COUNT: '10',
      }) as never,
      new MetricsService({
        enabled: true,
        collectDefaultMetrics: false,
        defaultLabels: { service: 'automation' },
      }),
    );

    let acked = false;
    let processed = false;

     
    (consumer as any).evaluateRules = async () => {
      processed = true;
    };

     
    (consumer as any).channel = {
      ack: () => {
        acked = true;
      },
      nack: () => {
        throw new Error('should not nack');
      },
      publish: () => true,
    };

    const msg = buildConsumeMessage(buildEvent('task.created'));
     
    await (consumer as any).onMessage(msg);

    assert.equal(processed, true);
    assert.equal(acked, true);
  });

  it('ACKs unsupported event types without processing', async () => {
    const consumer = new AutomationAmqpConsumerService(
      makeConfigService({
        RABBITMQ_URL: 'amqp://localhost:5672',
        RABBITMQ_PREFETCH_COUNT: '10',
      }) as never,
      new MetricsService({
        enabled: true,
        collectDefaultMetrics: false,
        defaultLabels: { service: 'automation' },
      }),
    );

    let acked = false;
    let processed = false;

     
    (consumer as any).evaluateRules = async () => {
      processed = true;
    };

     
    (consumer as any).channel = {
      ack: () => {
        acked = true;
      },
      nack: () => {
        throw new Error('should not nack');
      },
      publish: () => true,
    };

    const msg = buildConsumeMessage(buildEvent('unsupported.event'));
     
    await (consumer as any).onMessage(msg);

    assert.equal(processed, false);
    assert.equal(acked, true);
  });

  it('routes to DLQ when processing fails', async () => {
    const consumer = new AutomationAmqpConsumerService(
      makeConfigService({
        RABBITMQ_URL: 'amqp://localhost:5672',
        RABBITMQ_PREFETCH_COUNT: '10',
      }) as never,
      new MetricsService({
        enabled: true,
        collectDefaultMetrics: false,
        defaultLabels: { service: 'automation' },
      }),
    );

    let acked = false;
    let published = false;

     
    (consumer as any).evaluateRules = async () => {
      throw new Error('fail');
    };

     
    (consumer as any).channel = {
      ack: () => {
        acked = true;
      },
      nack: () => {
        throw new Error('should not nack when DLQ publish works');
      },
      publish: () => {
        published = true;
        return true;
      },
    };

    const msg = buildConsumeMessage(buildEvent('task.created'));
     
    await (consumer as any).onMessage(msg);

    assert.equal(published, true);
    assert.equal(acked, true);
  });
});
