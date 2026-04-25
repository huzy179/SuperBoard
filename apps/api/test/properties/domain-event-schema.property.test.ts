/**
 * Property-Based Test: Domain Event Schema Conformance
 *
 * **Validates: Requirements 11.1, 11.2**
 *
 * Property 11: Domain Event Schema Conformance
 * For any domain event emitted by Core API, the event object must conform to
 * the `DomainEvent` base schema: containing non-empty `eventId`, `eventType`,
 * `eventVersion`, `producer`, `correlationId`, `idempotencyKey`, `occurredAt`,
 * and `payload` fields.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { DomainEvent } from '@superboard/shared';

// ---------------------------------------------------------------------------
// ULID / ISO8601 validators
// ---------------------------------------------------------------------------

// ULID: 26 chars, Crockford base32 alphabet
const ULID_REGEX = /^[0-9A-HJKMNP-TV-Z]{26}$/;

function isValidUlid(value: string): boolean {
  return ULID_REGEX.test(value);
}

// ISO8601 datetime — at minimum YYYY-MM-DDTHH:mm:ss with optional ms and Z/offset
const ISO8601_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;

function isValidIso8601(value: string): boolean {
  if (!ISO8601_REGEX.test(value)) return false;
  const d = new Date(value);
  return !isNaN(d.getTime());
}

// ---------------------------------------------------------------------------
// Random generators
// ---------------------------------------------------------------------------

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomString(length = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length }, () => chars[randomInt(0, chars.length - 1)]).join('');
}

function randomNonEmptyString(minLen = 1, maxLen = 20): string {
  return randomString(randomInt(minLen, maxLen));
}

/** Generate a random ULID-like string (26 chars, Crockford base32) */
function randomUlid(): string {
  const alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  return Array.from({ length: 26 }, () => alphabet[randomInt(0, alphabet.length - 1)]).join('');
}

/** Generate a valid ISO8601 timestamp */
function randomIso8601(): string {
  const base = new Date(Date.now() - randomInt(0, 365 * 24 * 60 * 60 * 1000));
  return base.toISOString();
}

/** Generate a random payload (object, string, number, array) */
function randomPayload(): unknown {
  const pick = randomInt(0, 4);
  switch (pick) {
    case 0:
      return { id: randomString(), value: randomInt(0, 100) };
    case 1:
      return randomString();
    case 2:
      return randomInt(0, 1_000_000);
    case 3:
      return Array.from({ length: randomInt(1, 5) }, () => randomString());
    default:
      return { nested: { key: randomString() } };
  }
}

/** Pick a random event type from the Event Taxonomy v1 */
function randomEventType(): string {
  const types = [
    'task.created',
    'task.updated',
    'task.status_changed',
    'doc.updated',
    'doc.version_created',
    'message.sent',
    'message.reaction_added',
    'project.updated',
    'user.invited',
    'user.member_joined',
  ];
  return types[randomInt(0, types.length - 1)];
}

/** Build a fully conformant DomainEvent with random values */
function buildConformantEvent<T = unknown>(payload?: T): DomainEvent<T> {
  return {
    eventId: randomUlid(),
    eventType: randomEventType(),
    eventVersion: '1.0',
    producer: 'core-api',
    correlationId: randomUlid(),
    idempotencyKey: randomUlid(),
    occurredAt: randomIso8601(),
    payload: payload !== undefined ? payload : (randomPayload() as T),
  };
}

// ---------------------------------------------------------------------------
// Schema conformance checker
// ---------------------------------------------------------------------------

const REQUIRED_FIELDS: Array<keyof DomainEvent> = [
  'eventId',
  'eventType',
  'eventVersion',
  'producer',
  'correlationId',
  'idempotencyKey',
  'occurredAt',
  'payload',
];

function assertDomainEventConformance(event: unknown, label: string): void {
  assert.ok(
    event !== null && typeof event === 'object',
    `${label}: event must be a non-null object`,
  );

  const obj = event as Record<string, unknown>;

  // All required fields must be present
  for (const field of REQUIRED_FIELDS) {
    assert.ok(
      Object.prototype.hasOwnProperty.call(obj, field),
      `${label}: missing required field "${field}"`,
    );
  }

  // eventId: non-empty string (ULID format)
  assert.ok(
    typeof obj['eventId'] === 'string' && obj['eventId'].length > 0,
    `${label}: eventId must be a non-empty string`,
  );
  assert.ok(
    isValidUlid(obj['eventId'] as string),
    `${label}: eventId "${obj['eventId']}" must be a valid ULID (26 chars, Crockford base32)`,
  );

  // eventType: non-empty string
  assert.ok(
    typeof obj['eventType'] === 'string' && (obj['eventType'] as string).length > 0,
    `${label}: eventType must be a non-empty string`,
  );

  // eventVersion: non-empty string
  assert.ok(
    typeof obj['eventVersion'] === 'string' && (obj['eventVersion'] as string).length > 0,
    `${label}: eventVersion must be a non-empty string`,
  );

  // producer: non-empty string
  assert.ok(
    typeof obj['producer'] === 'string' && (obj['producer'] as string).length > 0,
    `${label}: producer must be a non-empty string`,
  );

  // correlationId: non-empty string
  assert.ok(
    typeof obj['correlationId'] === 'string' && (obj['correlationId'] as string).length > 0,
    `${label}: correlationId must be a non-empty string`,
  );

  // idempotencyKey: non-empty string
  assert.ok(
    typeof obj['idempotencyKey'] === 'string' && (obj['idempotencyKey'] as string).length > 0,
    `${label}: idempotencyKey must be a non-empty string`,
  );

  // occurredAt: valid ISO8601 string
  assert.ok(
    typeof obj['occurredAt'] === 'string' && (obj['occurredAt'] as string).length > 0,
    `${label}: occurredAt must be a non-empty string`,
  );
  assert.ok(
    isValidIso8601(obj['occurredAt'] as string),
    `${label}: occurredAt "${obj['occurredAt']}" must be a valid ISO8601 datetime`,
  );

  // payload: must be defined (not undefined)
  assert.notEqual(obj['payload'], undefined, `${label}: payload must be defined (not undefined)`);
}

// ---------------------------------------------------------------------------
// Property tests
// ---------------------------------------------------------------------------

const ITERATIONS = 100;

describe('Property 11: Domain Event Schema Conformance', () => {
  /**
   * Validates: Requirements 11.1, 11.2
   *
   * For any randomly generated domain event, all 8 required fields must be
   * present and non-empty. eventId must be a valid ULID. occurredAt must be
   * a valid ISO8601 string. payload must be defined.
   */
  it('arbitrary domain events conform to DomainEvent base schema', () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const event = buildConformantEvent();
      assertDomainEventConformance(event, `iteration ${i}`);
    }
  });

  /**
   * Validates: Requirements 11.1, 11.2
   *
   * Events for every event type in the Event Taxonomy v1 must conform to the
   * DomainEvent base schema.
   */
  it('events for all Event Taxonomy v1 types conform to DomainEvent base schema', () => {
    const eventTypes = [
      'task.created',
      'task.updated',
      'task.status_changed',
      'doc.updated',
      'doc.version_created',
      'message.sent',
      'message.reaction_added',
      'project.updated',
      'user.invited',
      'user.member_joined',
    ];

    for (const eventType of eventTypes) {
      const event: DomainEvent = {
        eventId: randomUlid(),
        eventType,
        eventVersion: '1.0',
        producer: 'core-api',
        correlationId: randomUlid(),
        idempotencyKey: randomUlid(),
        occurredAt: new Date().toISOString(),
        payload: { sample: randomString() },
      };
      assertDomainEventConformance(event, `eventType=${eventType}`);
    }
  });

  /**
   * Validates: Requirements 11.1, 11.2
   *
   * payload field must be defined for any type of payload value —
   * including objects, strings, numbers, arrays, null, and false.
   */
  it('payload field is defined for all valid payload types', () => {
    const payloads: unknown[] = [
      { id: 'task-1', title: 'My Task' },
      'string-payload',
      42,
      0,
      false,
      null,
      [],
      [1, 2, 3],
      { nested: { deep: true } },
    ];

    for (const payload of payloads) {
      const event = buildConformantEvent(payload);
      // payload must be defined (not undefined) — null and false are valid
      assert.notEqual(
        event.payload,
        undefined,
        `payload=${JSON.stringify(payload)}: payload must not be undefined`,
      );
      assertDomainEventConformance(event, `payload=${JSON.stringify(payload)}`);
    }
  });

  /**
   * Validates: Requirements 11.1, 11.2
   *
   * eventId must be a valid ULID (26 chars, Crockford base32 alphabet) for
   * all generated events.
   */
  it('eventId is always a valid ULID across many generated events', () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const event = buildConformantEvent();
      assert.ok(
        isValidUlid(event.eventId),
        `iteration ${i}: eventId "${event.eventId}" must be a valid ULID`,
      );
    }
  });

  /**
   * Validates: Requirements 11.1, 11.2
   *
   * occurredAt must be a valid ISO8601 datetime string for all generated events.
   */
  it('occurredAt is always a valid ISO8601 datetime string', () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const event = buildConformantEvent();
      assert.ok(
        isValidIso8601(event.occurredAt),
        `iteration ${i}: occurredAt "${event.occurredAt}" must be a valid ISO8601 datetime`,
      );
    }
  });

  /**
   * Validates: Requirements 11.1, 11.2
   *
   * All string fields (eventId, eventType, eventVersion, producer,
   * correlationId, idempotencyKey, occurredAt) must be non-empty.
   */
  it('all string fields are non-empty across many generated events', () => {
    const stringFields: Array<keyof DomainEvent> = [
      'eventId',
      'eventType',
      'eventVersion',
      'producer',
      'correlationId',
      'idempotencyKey',
      'occurredAt',
    ];

    for (let i = 0; i < ITERATIONS; i++) {
      const event = buildConformantEvent();
      for (const field of stringFields) {
        const value = event[field];
        assert.ok(
          typeof value === 'string' && value.length > 0,
          `iteration ${i}: field "${field}" must be a non-empty string, got "${value}"`,
        );
      }
    }
  });

  /**
   * Validates: Requirements 11.2
   *
   * Events with various producer values (simulating different services) must
   * still conform to the schema as long as producer is non-empty.
   */
  it('events with various non-empty producer values conform to schema', () => {
    const producers = ['core-api', 'notification-service', 'ai-service', 'collaboration-service'];

    for (const producer of producers) {
      for (let i = 0; i < 10; i++) {
        const event: DomainEvent = {
          eventId: randomUlid(),
          eventType: randomEventType(),
          eventVersion: '1.0',
          producer,
          correlationId: randomUlid(),
          idempotencyKey: randomUlid(),
          occurredAt: new Date().toISOString(),
          payload: { test: true },
        };
        assertDomainEventConformance(event, `producer=${producer} iteration ${i}`);
      }
    }
  });

  /**
   * Validates: Requirements 11.2
   *
   * Events with various eventVersion values must conform to the schema as long
   * as eventVersion is non-empty.
   */
  it('events with various non-empty eventVersion values conform to schema', () => {
    const versions = ['1.0', '1.1', '2.0', '0.1', randomNonEmptyString(1, 5)];

    for (const version of versions) {
      const event: DomainEvent = {
        eventId: randomUlid(),
        eventType: randomEventType(),
        eventVersion: version,
        producer: 'core-api',
        correlationId: randomUlid(),
        idempotencyKey: randomUlid(),
        occurredAt: new Date().toISOString(),
        payload: { version },
      };
      assertDomainEventConformance(event, `eventVersion=${version}`);
    }
  });
});
