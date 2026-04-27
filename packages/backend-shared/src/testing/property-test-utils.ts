/**
 * Property-based testing utilities using fast-check
 */

import fc from 'fast-check';
import type { AMQPConfig, DomainEvent } from '../types';

export class PropertyGenerators {
  static amqpConfigArb(): fc.Arbitrary<AMQPConfig> {
    return fc.record({
      url: fc.domain().map((domain) => `amqp://${domain}:5672`),
      exchange: fc.string({ minLength: 1, maxLength: 50 }),
      queue: fc.string({ minLength: 1, maxLength: 50 }),
      routingKeys: fc.array(fc.string({ minLength: 1, maxLength: 30 }), {
        minLength: 1,
        maxLength: 5,
      }),
      prefetchCount: fc.option(fc.integer({ min: 1, max: 100 }), { nil: undefined }),
      reconnectInterval: fc.option(fc.integer({ min: 100, max: 5000 }), { nil: undefined }),
      maxReconnectAttempts: fc.option(fc.integer({ min: 1, max: 10 }), { nil: undefined }),
      deadLetterExchange: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
      deadLetterQueue: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
    });
  }

  static domainEventArb(): fc.Arbitrary<DomainEvent> {
    return fc.record({
      eventType: fc.string({ minLength: 1, maxLength: 50 }),
      correlationId: fc.string({ minLength: 1, maxLength: 64 }),
      timestamp: fc.date().map((d) => d.toISOString()),
      payload: fc.jsonValue(),
      metadata: fc.option(
        fc.dictionary(fc.string({ minLength: 1, maxLength: 20 }), fc.jsonValue()),
        {
          nil: undefined,
        },
      ),
    }) as unknown as fc.Arbitrary<DomainEvent>;
  }
}

/**
 * Property test configuration with sensible defaults
 */
export const propertyTestConfig = {
  numRuns: 100, // Minimum 100 iterations as specified in design
  timeout: 10000, // 10 second timeout per test
  verbose: process.env.NODE_ENV === 'test' ? 0 : 1,
};
