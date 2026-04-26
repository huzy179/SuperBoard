/**
 * Property test for queue naming convention (P5)
 * Feature: rabbitmq-event-bus, Property 5: Consumer Queue Names Follow Naming Convention
 * Validates: Requirements 2.3, 8.2
 *
 * Verifies queue/DLQ naming follows {service}.domain.events pattern
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import { RABBITMQ_QUEUES, RABBITMQ_DLQ_NAMES } from '../events/rabbitmq.event.js';

describe('RabbitMQ Queue Naming Convention (P5)', () => {
  const serviceNames = ['AI', 'NOTIFICATION', 'SEARCH', 'AUTOMATION'] as const;

  it('consumer queue names follow {service}.domain.events pattern', () => {
    fc.assert(
      fc.property(fc.constantFrom(...serviceNames), (serviceName) => {
        const expectedQueueName = `${serviceName.toLowerCase()}.domain.events`;
        const actualQueueName = RABBITMQ_QUEUES[serviceName];

        assert.equal(
          actualQueueName,
          expectedQueueName,
          `Queue name for service ${serviceName} should be "${expectedQueueName}", got "${actualQueueName}"`,
        );
      }),
      { numRuns: 100 },
    );
  });

  it('DLQ names follow {service}.domain.events.dlq pattern', () => {
    fc.assert(
      fc.property(fc.constantFrom(...serviceNames), (serviceName) => {
        const expectedDlqName = `${serviceName.toLowerCase()}.domain.events.dlq`;
        const actualDlqName = RABBITMQ_DLQ_NAMES[serviceName];

        assert.equal(
          actualDlqName,
          expectedDlqName,
          `DLQ name for service ${serviceName} should be "${expectedDlqName}", got "${actualDlqName}"`,
        );
      }),
      { numRuns: 100 },
    );
  });

  it('queue names contain only lowercase letters, dots, and no special characters', () => {
    fc.assert(
      fc.property(fc.constantFrom(...serviceNames), (serviceName) => {
        const queueName = RABBITMQ_QUEUES[serviceName];
        const pattern = /^[a-z.]+$/;

        assert.ok(
          pattern.test(queueName),
          `Queue name "${queueName}" should contain only lowercase letters and dots`,
        );
      }),
      { numRuns: 100 },
    );
  });

  it('DLQ names contain only lowercase letters, dots, and no special characters', () => {
    fc.assert(
      fc.property(fc.constantFrom(...serviceNames), (serviceName) => {
        const dlqName = RABBITMQ_DLQ_NAMES[serviceName];
        const pattern = /^[a-z.]+$/;

        assert.ok(
          pattern.test(dlqName),
          `DLQ name "${dlqName}" should contain only lowercase letters and dots`,
        );
      }),
      { numRuns: 100 },
    );
  });

  it('all expected service queues are defined', () => {
    const expectedServices = ['AI', 'NOTIFICATION', 'SEARCH', 'AUTOMATION'];

    for (const service of expectedServices) {
      assert.ok(
        service in RABBITMQ_QUEUES,
        `Service "${service}" should have a queue defined in RABBITMQ_QUEUES`,
      );

      assert.ok(
        service in RABBITMQ_DLQ_NAMES,
        `Service "${service}" should have a DLQ defined in RABBITMQ_DLQ_NAMES`,
      );
    }
  });

  it('queue and DLQ names are consistent (DLQ = queue + .dlq)', () => {
    fc.assert(
      fc.property(fc.constantFrom(...serviceNames), (serviceName) => {
        const queueName = RABBITMQ_QUEUES[serviceName];
        const dlqName = RABBITMQ_DLQ_NAMES[serviceName];
        const expectedDlqName = `${queueName}.dlq`;

        assert.equal(
          dlqName,
          expectedDlqName,
          `DLQ name "${dlqName}" should be queue name "${queueName}" + ".dlq"`,
        );
      }),
      { numRuns: 100 },
    );
  });
});
