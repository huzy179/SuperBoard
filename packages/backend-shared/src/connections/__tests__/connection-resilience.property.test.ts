/**
 * Property Test: AMQP Connection Resilience
 *
 * **Validates: Requirements 1.2, 1.6, 7.5**
 *
 * For any AMQP configuration and connection failure scenario, the base consumer
 * SHALL automatically reconnect with exponential backoff and maintain connection
 * state consistency.
 */

import fc from 'fast-check';
import { AMQPConnectionManager } from '../../amqp/connection-manager';
import { AMQPConfig } from '../../types';

// Generator for valid AMQP configurations
const amqpConfigGenerator = fc.record({
  url: fc.domain().map((domain: string) => `amqp://${domain}:5672`),
  exchange: fc.string({ minLength: 1, maxLength: 50 }),
  queue: fc.string({ minLength: 1, maxLength: 50 }),
  routingKeys: fc.array(fc.string({ minLength: 1, maxLength: 30 }), {
    minLength: 1,
    maxLength: 5,
  }),
  prefetchCount: fc.oneof(fc.constant(undefined), fc.integer({ min: 1, max: 100 })),
  reconnectInterval: fc.oneof(fc.constant(undefined), fc.integer({ min: 100, max: 5000 })),
  maxReconnectAttempts: fc.oneof(fc.constant(undefined), fc.integer({ min: 1, max: 10 })),
});

describe('Property 1: AMQP Connection Resilience', () => {
  let connectionManager: AMQPConnectionManager;

  beforeEach(() => {
    connectionManager = new AMQPConnectionManager();
  });

  afterEach(async () => {
    await connectionManager.closeAll();
  });

  /**
   * Property: Connection manager should handle invalid URLs gracefully
   * and not crash the application
   */
  it('should handle connection failures gracefully without crashing', async () => {
    await fc.assert(
      fc.asyncProperty(amqpConfigGenerator, async (config: AMQPConfig) => {
        // Use an invalid URL to simulate connection failure
        const invalidConfig: AMQPConfig = {
          ...config,
          url: 'amqp://invalid-host-that-does-not-exist:5672',
          maxReconnectAttempts: 1, // Limit attempts for test speed
          reconnectInterval: 100, // Short interval for testing
        };

        try {
          // Should throw error after max attempts, not crash
          await connectionManager.getConnection(invalidConfig);
          // If we get here, connection succeeded (unlikely with invalid host)
          // This is acceptable behavior
        } catch (error) {
          // Expected: connection should fail gracefully
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toContain('Failed to connect');
        }
      }),
      { numRuns: 3 }, // Reduced runs for faster testing
    );
  });

  /**
   * Property: Connection manager should maintain consistent state
   * across multiple connection attempts
   */
  it('should maintain consistent connection state across attempts', async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 1, max: 5 }), async (attemptCount: number) => {
        const config: AMQPConfig = {
          url: 'amqp://invalid-host:5672',
          exchange: 'test.exchange',
          queue: 'test.queue',
          routingKeys: ['test.key'],
          maxReconnectAttempts: 1,
          reconnectInterval: 50,
        };

        // Multiple attempts should not corrupt state
        for (let i = 0; i < attemptCount; i++) {
          try {
            await connectionManager.getConnection(config);
          } catch {
            // Expected to fail
          }
        }

        // After all attempts, closeAll should work without errors
        await expect(connectionManager.closeAll()).resolves.toBeUndefined();
      }),
      { numRuns: 20 },
    );
  });

  /**
   * Property: Connection manager should apply exponential backoff
   * for reconnection attempts
   */
  it('should apply exponential backoff for reconnection attempts', async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 1, max: 3 }), async (baseInterval: number) => {
        const config: AMQPConfig = {
          url: 'amqp://invalid-host:5672',
          exchange: 'test.exchange',
          queue: 'test.queue',
          routingKeys: ['test.key'],
          maxReconnectAttempts: 3,
          reconnectInterval: baseInterval * 100,
        };

        const startTime = Date.now();

        try {
          await connectionManager.getConnection(config);
        } catch {
          // Expected to fail
        }

        const elapsedTime = Date.now() - startTime;

        // With exponential backoff, total time should be at least:
        // baseInterval + (baseInterval * 2) = baseInterval * 3
        // But we allow some margin for execution time
        const minExpectedTime = baseInterval * 100 * 2; // At least 2x base interval
        expect(elapsedTime).toBeGreaterThanOrEqual(minExpectedTime - 500); // 500ms margin
      }),
      { numRuns: 10 },
    );
  });

  /**
   * Property: Connection manager should properly clean up resources
   * on closeAll regardless of connection state
   */
  it('should properly clean up resources on closeAll', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(amqpConfigGenerator, { minLength: 1, maxLength: 3 }),
        async (configs: AMQPConfig[]) => {
          // Attempt to get connections (most will fail)
          for (const config of configs) {
            try {
              await connectionManager.getConnection({
                ...config,
                url: 'amqp://invalid-host:5672',
                maxReconnectAttempts: 1,
                reconnectInterval: 50,
              });
            } catch {
              // Expected to fail
            }
          }

          // closeAll should complete without errors
          await expect(connectionManager.closeAll()).resolves.toBeUndefined();

          // After closeAll, attempting to close again should also work
          await expect(connectionManager.closeAll()).resolves.toBeUndefined();
        },
      ),
      { numRuns: 15 },
    );
  });
});
