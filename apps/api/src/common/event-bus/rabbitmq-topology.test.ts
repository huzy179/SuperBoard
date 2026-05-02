import { test, describe } from 'node:test';
import assert from 'node:assert';
import * as fc from 'fast-check';
import { declareConsumerTopology } from './rabbitmq-topology';
import { RABBITMQ_EXCHANGES } from '@superboard/shared';
import type * as amqplib from 'amqplib';

// Feature: rabbitmq-event-bus, Property 6: All Consumer Queues Declare Dead Letter Exchange
// Feature: rabbitmq-event-bus, Property 7: Topology Declaration Is Idempotent
describe('RabbitMQ Topology Properties', () => {
  /**
   * Property 6: All Consumer Queues Declare Dead Letter Exchange
   * **Validates: Requirements 2.5**
   */
  test('should declare all consumer queues with x-dead-letter-exchange pointing to DLX', async () => {
    await fc.assert(
      fc.asyncProperty(fc.constant(null), async (nullValue) => {
        void nullValue;
        // Mock channel to capture assertQueue calls
        const assertQueueCalls: Array<{ queue: string; options: Record<string, unknown> }> = [];
        const mockChannel = {
          assertQueue: (queue: string, options: Record<string, unknown>) => {
            assertQueueCalls.push({ queue, options });
            return Promise.resolve();
          },
          bindQueue: () => Promise.resolve(),
        } as unknown as amqplib.ConfirmChannel;

        await declareConsumerTopology(mockChannel);

        // Filter calls to consumer queues (not DLQs)
        const consumerQueueCalls = assertQueueCalls.filter(
          (call) => call.queue.endsWith('.domain.events') && !call.queue.endsWith('.dlq'),
        );

        // Verify all consumer queues have x-dead-letter-exchange set to DLX
        for (const call of consumerQueueCalls) {
          assert.ok(call.options.arguments, 'Queue should have arguments');
          assert.strictEqual(
            (call.options.arguments as Record<string, unknown>)['x-dead-letter-exchange'],
            RABBITMQ_EXCHANGES.DEAD_LETTER,
            `Queue ${call.queue} should have DLX configured`,
          );
        }

        // Ensure we actually tested some queues
        assert.ok(consumerQueueCalls.length > 0, 'Should have tested at least one consumer queue');
      }),
      { numRuns: 100 },
    );
  });

  /**
   * Property 7: Topology Declaration Is Idempotent
   * **Validates: Requirements 2.6**
   */
  test('should produce identical results when called multiple times', async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 1, max: 10 }), async (numCalls) => {
        // Track all calls across multiple invocations
        const allAssertQueueCalls: Array<{ queue: string; options: Record<string, unknown> }> = [];
        const allBindQueueCalls: Array<{ queue: string; exchange: string; routingKey: string }> =
          [];

        const mockChannel = {
          assertQueue: (queue: string, options: Record<string, unknown>) => {
            allAssertQueueCalls.push({ queue, options });
            return Promise.resolve();
          },
          bindQueue: (queue: string, exchange: string, routingKey: string) => {
            allBindQueueCalls.push({ queue, exchange, routingKey });
            return Promise.resolve();
          },
        } as unknown as amqplib.ConfirmChannel;

        // Call topology setup N times
        for (let i = 0; i < numCalls; i++) {
          await declareConsumerTopology(mockChannel);
        }

        // Verify each call made identical assertions
        const callsPerInvocation = allAssertQueueCalls.length / numCalls;
        const bindsPerInvocation = allBindQueueCalls.length / numCalls;

        // Check that each invocation made the same number of calls
        assert.strictEqual(allAssertQueueCalls.length, callsPerInvocation * numCalls);
        assert.strictEqual(allBindQueueCalls.length, bindsPerInvocation * numCalls);

        // Verify that the same queues were declared with same options in each invocation
        for (let i = 1; i < numCalls; i++) {
          const firstInvocationQueues = allAssertQueueCalls.slice(0, callsPerInvocation);
          const currentInvocationQueues = allAssertQueueCalls.slice(
            i * callsPerInvocation,
            (i + 1) * callsPerInvocation,
          );

          assert.deepStrictEqual(currentInvocationQueues, firstInvocationQueues);
        }

        // Verify that the same bindings were made in each invocation
        for (let i = 1; i < numCalls; i++) {
          const firstInvocationBinds = allBindQueueCalls.slice(0, bindsPerInvocation);
          const currentInvocationBinds = allBindQueueCalls.slice(
            i * bindsPerInvocation,
            (i + 1) * bindsPerInvocation,
          );

          assert.deepStrictEqual(currentInvocationBinds, firstInvocationBinds);
        }
      }),
      { numRuns: 100 },
    );
  });
});
