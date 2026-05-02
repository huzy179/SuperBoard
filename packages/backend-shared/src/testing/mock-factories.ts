/**
 * Mock factories for common dependencies
 */

import { AMQPConfig, DatabaseConfig, DomainEvent, HealthConfig, RedisConfig } from '../types';

export class MockFactories {
  static createAMQPConfig(overrides?: Partial<AMQPConfig>): AMQPConfig {
    return {
      url: 'amqp://localhost:5672',
      exchange: 'test.exchange',
      queue: 'test.queue',
      routingKeys: ['test.key'],
      prefetchCount: 10,
      reconnectInterval: 1000,
      maxReconnectAttempts: 5,
      deadLetterExchange: 'test.dlx',
      deadLetterQueue: 'test.dlq',
      ...overrides,
    };
  }

  static createDomainEvent(overrides?: Partial<DomainEvent>): DomainEvent {
    return {
      eventType: 'test.event',
      correlationId: 'test-correlation-id',
      timestamp: new Date().toISOString(),
      payload: { test: 'data' },
      metadata: { source: 'test' },
      ...overrides,
    };
  }

  static createRedisConfig(overrides?: Partial<RedisConfig>): RedisConfig {
    return {
      host: 'localhost',
      port: 6379,
      db: 0,
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      lazyConnect: true,
      ...overrides,
    };
  }

  static createDatabaseConfig(overrides?: Partial<DatabaseConfig>): DatabaseConfig {
    return {
      host: 'localhost',
      port: 5432,
      database: 'test_db',
      username: 'test_user',
      password: 'test_password',
      ssl: false,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      max: 10,
      ...overrides,
    };
  }

  static createHealthConfig(overrides?: Partial<HealthConfig>): HealthConfig {
    return {
      endpoints: {
        health: '/health',
        ready: '/ready',
      },
      dependencies: [
        {
          name: 'database',
          type: 'database',
          config: MockFactories.createDatabaseConfig(),
          timeout: 5000,
        },
        {
          name: 'redis',
          type: 'redis',
          config: MockFactories.createRedisConfig(),
          timeout: 3000,
        },
      ],
      ...overrides,
    };
  }
}
