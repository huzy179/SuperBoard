/**
 * Property test for routing key format (P15)
 * Feature: rabbitmq-event-bus, Property 15: Routing Keys Follow {domain}.{action} Format
 * Validates: Requirements 11.2, 11.3
 *
 * Verifies all VALID_ROUTING_KEYS match regex ^[a-z]+\.[a-z_]+$
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import { VALID_ROUTING_KEYS } from '../events/rabbitmq.event.js';

describe('RabbitMQ Routing Key Format (P15)', () => {
  it('all VALID_ROUTING_KEYS match {domain}.{action} format', () => {
    fc.assert(
      fc.property(fc.constantFrom(...VALID_ROUTING_KEYS), (routingKey) => {
        // Routing key should match pattern: lowercase domain, dot separator, lowercase action with optional underscores
        const pattern = /^[a-z]+\.[a-z_]+$/;
        assert.ok(
          pattern.test(routingKey),
          `Routing key "${routingKey}" should match pattern ^[a-z]+\\.[a-z_]+$`,
        );
      }),
      { numRuns: 100 },
    );
  });

  it('each routing key has exactly one dot separator', () => {
    fc.assert(
      fc.property(fc.constantFrom(...VALID_ROUTING_KEYS), (routingKey) => {
        const dotCount = (routingKey.match(/\./g) || []).length;
        assert.equal(
          dotCount,
          1,
          `Routing key "${routingKey}" should have exactly one dot separator, found ${dotCount}`,
        );
      }),
      { numRuns: 100 },
    );
  });

  it('domain part (before dot) contains only lowercase letters', () => {
    fc.assert(
      fc.property(fc.constantFrom(...VALID_ROUTING_KEYS), (routingKey) => {
        const [domain] = routingKey.split('.');
        const domainPattern = /^[a-z]+$/;
        assert.ok(
          domain && domainPattern.test(domain),
          `Domain part "${domain}" should contain only lowercase letters`,
        );
      }),
      { numRuns: 100 },
    );
  });

  it('action part (after dot) contains only lowercase letters and underscores', () => {
    fc.assert(
      fc.property(fc.constantFrom(...VALID_ROUTING_KEYS), (routingKey) => {
        const [, action] = routingKey.split('.');
        const actionPattern = /^[a-z_]+$/;
        assert.ok(
          action && actionPattern.test(action),
          `Action part "${action}" should contain only lowercase letters and underscores`,
        );
      }),
      { numRuns: 100 },
    );
  });

  it('validates all 12 expected routing keys are present', () => {
    const expectedKeys = [
      'task.created',
      'task.updated',
      'task.status_changed',
      'task.deleted',
      'doc.updated',
      'doc.version_created',
      'message.sent',
      'message.reaction_added',
      'project.updated',
      'project.archived',
      'user.invited',
      'user.member_joined',
    ];

    assert.equal(
      VALID_ROUTING_KEYS.length,
      12,
      `Expected 12 routing keys, found ${VALID_ROUTING_KEYS.length}`,
    );

    for (const expectedKey of expectedKeys) {
      assert.ok(
        VALID_ROUTING_KEYS.includes(expectedKey as (typeof VALID_ROUTING_KEYS)[number]),
        `Expected routing key "${expectedKey}" not found in VALID_ROUTING_KEYS`,
      );
    }
  });
});
