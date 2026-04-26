import { test, describe } from 'node:test';
import assert from 'node:assert';
import { RabbitMQEventBusService } from './rabbitmq-event-bus.service';
import { RabbitMQMetricsService } from './rabbitmq-metrics.service';
import type { DomainEvent } from '@superboard/shared';
import type { ConfigService } from '@nestjs/config';

describe('RabbitMQEventBusService Unit Tests', () => {
  test('should create service with correct configuration', () => {
    const mockConfigService = {
      getOrThrow: () => 'amqp://localhost',
      get: (key: string) => {
        if (key === 'RABBITMQ_PUBLISH_MAX_RETRIES') return 5;
        if (key === 'RABBITMQ_PUBLISH_BACKOFF_BASE_MS') return 2000;
        return undefined;
      },
    };

    const mockMetricsService = new RabbitMQMetricsService();
    const service = new RabbitMQEventBusService(
      mockConfigService as unknown as ConfigService,
      mockMetricsService,
    );

    // Verify configuration is loaded correctly
    assert.strictEqual((service as unknown as Record<string, unknown>).maxRetries, 5);
    assert.strictEqual((service as unknown as Record<string, unknown>).backoffBaseMs, 2000);
  });

  test('should use default values when config is not provided', () => {
    const mockConfigService = {
      getOrThrow: () => 'amqp://localhost',
      get: () => undefined,
    };

    const mockMetricsService = new RabbitMQMetricsService();
    const service = new RabbitMQEventBusService(
      mockConfigService as unknown as ConfigService,
      mockMetricsService,
    );

    // Verify default values are used
    assert.strictEqual((service as unknown as Record<string, unknown>).maxRetries, 3);
    assert.strictEqual((service as unknown as Record<string, unknown>).backoffBaseMs, 1000);
  });

  test('should handle publish when no channel is available', async () => {
    const mockConfigService = {
      getOrThrow: () => 'amqp://localhost',
      get: () => undefined,
    };

    const mockMetricsService = new RabbitMQMetricsService();
    const service = new RabbitMQEventBusService(
      mockConfigService as unknown as ConfigService,
      mockMetricsService,
    );

    const event: DomainEvent = {
      eventId: 'test-id',
      eventType: 'test.event',
      eventVersion: '1.0',
      producer: 'test',
      correlationId: 'test-correlation',
      idempotencyKey: 'test-key',
      occurredAt: new Date().toISOString(),
      payload: { test: true },
    };

    // Should not throw when no channel is available
    await service.publish(event);
  });
});
