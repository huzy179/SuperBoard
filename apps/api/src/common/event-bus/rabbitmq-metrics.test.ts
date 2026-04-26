// Feature: rabbitmq-event-bus, Property 13: Publish Metrics Are Emitted for Every Attempt

import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert';
import * as fc from 'fast-check';
import { RabbitMQMetricsService } from './rabbitmq-metrics.service';

/**
 * **Property 13: Publish Metrics Are Emitted for Every Attempt**
 *
 * For any publish attempt (success or failure), the counter `rabbitmq_publish_total`
 * SHALL be incremented with labels `event_type=event.eventType` and `status` equal to
 * `"success"` or `"failure"`. The histogram `rabbitmq_publish_duration_seconds` SHALL
 * be observed with label `event_type=event.eventType`.
 *
 * **Validates: Requirements 9.1, 9.2**
 */

describe('RabbitMQ Publish Metrics Property Tests', () => {
  let metricsService: RabbitMQMetricsService;
  let mockPublishTotal: { inc: ReturnType<typeof mock.fn> };
  let mockPublishDurationSeconds: { observe: ReturnType<typeof mock.fn> };

  beforeEach(() => {
    // Create mocks for the metrics
    mockPublishTotal = {
      inc: mock.fn(),
    };

    mockPublishDurationSeconds = {
      observe: mock.fn(),
    };

    // Create metrics service and replace the metrics with mocks
    metricsService = new RabbitMQMetricsService();
    (metricsService as unknown as Record<string, unknown>).publishTotal = mockPublishTotal;
    (metricsService as unknown as Record<string, unknown>).publishDurationSeconds =
      mockPublishDurationSeconds;
  });

  it('Property 13: Publish Metrics Are Emitted for Every Attempt', () => {
    fc.assert(
      fc.property(
        // Generate random event types and outcomes
        fc.record({
          eventType: fc.stringMatching(/^[a-z]+\.[a-z_]+$/), // Valid routing key format
          status: fc.constantFrom('success' as const, 'failure' as const),
          durationMs: fc.integer({ min: 1, max: 10000 }),
        }),
        (testCase) => {
          // Reset mocks
          mockPublishTotal.inc.mock.resetCalls();
          mockPublishDurationSeconds.observe.mock.resetCalls();

          // Record metrics
          metricsService.recordPublish(testCase.eventType, testCase.status);
          metricsService.recordPublishDuration(testCase.eventType, testCase.durationMs);

          // Verify counter was incremented with correct labels
          assert.strictEqual(mockPublishTotal.inc.mock.callCount(), 1);
          const counterCall = mockPublishTotal.inc.mock.calls[0];
          assert.deepStrictEqual(counterCall.arguments[0], {
            event_type: testCase.eventType,
            status: testCase.status,
          });

          // Verify histogram was observed with correct labels and value
          assert.strictEqual(mockPublishDurationSeconds.observe.mock.callCount(), 1);
          const histogramCall = mockPublishDurationSeconds.observe.mock.calls[0];
          assert.deepStrictEqual(histogramCall.arguments[0], {
            event_type: testCase.eventType,
          });
          assert.strictEqual(histogramCall.arguments[1], testCase.durationMs / 1000);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('Property 13: Multiple Attempts Emit Multiple Metrics', () => {
    fc.assert(
      fc.property(
        fc.record({
          eventType: fc.stringMatching(/^[a-z]+\.[a-z_]+$/),
          attempts: fc.array(
            fc.record({
              status: fc.constantFrom('success' as const, 'failure' as const),
              durationMs: fc.integer({ min: 1, max: 5000 }),
            }),
            { minLength: 1, maxLength: 5 },
          ),
        }),
        (testCase) => {
          // Reset mocks
          mockPublishTotal.inc.mock.resetCalls();
          mockPublishDurationSeconds.observe.mock.resetCalls();

          // Record metrics for each attempt
          testCase.attempts.forEach((attempt) => {
            metricsService.recordPublish(testCase.eventType, attempt.status);
            metricsService.recordPublishDuration(testCase.eventType, attempt.durationMs);
          });

          // Verify counter was incremented for each attempt
          assert.strictEqual(mockPublishTotal.inc.mock.callCount(), testCase.attempts.length);

          // Verify histogram was observed for each attempt
          assert.strictEqual(
            mockPublishDurationSeconds.observe.mock.callCount(),
            testCase.attempts.length,
          );

          // Verify all calls have correct event_type
          mockPublishTotal.inc.mock.calls.forEach((call) => {
            assert.strictEqual(
              (call.arguments[0] as Record<string, unknown>).event_type,
              testCase.eventType,
            );
          });

          mockPublishDurationSeconds.observe.mock.calls.forEach((call) => {
            assert.strictEqual(
              (call.arguments[0] as Record<string, unknown>).event_type,
              testCase.eventType,
            );
          });
        },
      ),
      { numRuns: 100 },
    );
  });
});
