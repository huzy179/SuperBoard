/**
 * Property-Based Test: ApiResponse Envelope Invariant
 *
 * Validates: Requirements 2.1, 2.2, 2.3
 *
 * Property 1: ApiResponse Envelope Invariant
 * For any HTTP response from Core API (success or failure), the body must always
 * have exactly 4 fields: `success`, `data`, `error`, `meta`.
 * - On success: `error === null`, `data !== null`
 * - On failure: `data === null`, `error.code` and `error.message` must have values
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { apiSuccess, apiError } from '@superboard/shared';

// ---------------------------------------------------------------------------
// Random data generators
// ---------------------------------------------------------------------------

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomString(length = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length }, () => chars[randomInt(0, chars.length - 1)]).join('');
}

function randomNonEmptyString(): string {
  return randomString(randomInt(1, 20));
}

/** Generate a random primitive or structured value for use as `data` */
function randomData(): unknown {
  const pick = randomInt(0, 6);
  switch (pick) {
    case 0:
      return randomString();
    case 1:
      return randomInt(-1_000_000, 1_000_000);
    case 2:
      return randomInt(0, 1) === 1;
    case 3:
      return { id: randomString(), value: randomInt(0, 100) };
    case 4:
      return Array.from({ length: randomInt(1, 5) }, () => randomString());
    case 5:
      return { nested: { deep: randomString() }, count: randomInt(0, 50) };
    default:
      return randomString();
  }
}

// ---------------------------------------------------------------------------
// Invariant checker helpers
// ---------------------------------------------------------------------------

const REQUIRED_FIELDS = ['success', 'data', 'error', 'meta'] as const;

function assertEnvelopeShape(response: unknown, label: string): void {
  assert.ok(
    response !== null && typeof response === 'object',
    `${label}: response must be an object`,
  );

  const obj = response as Record<string, unknown>;

  // Must have exactly the 4 required fields (no more, no less)
  for (const field of REQUIRED_FIELDS) {
    assert.ok(
      Object.prototype.hasOwnProperty.call(obj, field),
      `${label}: missing required field "${field}"`,
    );
  }

  const actualKeys = Object.keys(obj);
  assert.equal(
    actualKeys.length,
    REQUIRED_FIELDS.length,
    `${label}: expected exactly 4 fields, got ${actualKeys.length} (${actualKeys.join(', ')})`,
  );
}

function assertSuccessInvariant(response: unknown, label: string): void {
  assertEnvelopeShape(response, label);
  const obj = response as Record<string, unknown>;

  assert.equal(obj['success'], true, `${label}: success must be true`);
  assert.equal(obj['error'], null, `${label}: error must be null on success`);
  assert.notEqual(obj['data'], null, `${label}: data must not be null on success`);
  assert.notEqual(obj['data'], undefined, `${label}: data must not be undefined on success`);

  // meta must be an object with a timestamp
  assert.ok(
    obj['meta'] !== null && typeof obj['meta'] === 'object',
    `${label}: meta must be an object`,
  );
  const meta = obj['meta'] as Record<string, unknown>;
  assert.ok(
    typeof meta['timestamp'] === 'string' && meta['timestamp'].length > 0,
    `${label}: meta.timestamp must be a non-empty string`,
  );
}

function assertErrorInvariant(response: unknown, label: string): void {
  assertEnvelopeShape(response, label);
  const obj = response as Record<string, unknown>;

  assert.equal(obj['success'], false, `${label}: success must be false`);
  assert.equal(obj['data'], null, `${label}: data must be null on failure`);
  assert.notEqual(obj['error'], null, `${label}: error must not be null on failure`);

  const error = obj['error'] as Record<string, unknown>;
  assert.ok(
    typeof error['code'] === 'string' && error['code'].length > 0,
    `${label}: error.code must be a non-empty string`,
  );
  assert.ok(
    typeof error['message'] === 'string' && error['message'].length > 0,
    `${label}: error.message must be a non-empty string`,
  );

  // meta must be an object with a timestamp
  assert.ok(
    obj['meta'] !== null && typeof obj['meta'] === 'object',
    `${label}: meta must be an object`,
  );
  const meta = obj['meta'] as Record<string, unknown>;
  assert.ok(
    typeof meta['timestamp'] === 'string' && meta['timestamp'].length > 0,
    `${label}: meta.timestamp must be a non-empty string`,
  );
}

// ---------------------------------------------------------------------------
// Property tests
// ---------------------------------------------------------------------------

const ITERATIONS = 100;

describe('Property 1: ApiResponse Envelope Invariant', () => {
  /**
   * Validates: Requirements 2.1, 2.2, 2.3
   *
   * For any call to apiSuccess(data) with arbitrary data, the resulting
   * ApiResponse must have exactly 4 fields and satisfy the success invariant.
   */
  it('apiSuccess always produces a valid envelope with error===null and data!==null', () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const data = randomData();
      const response = apiSuccess(data);
      assertSuccessInvariant(response, `apiSuccess iteration ${i}`);
    }
  });

  /**
   * Validates: Requirements 2.1, 2.2, 2.3
   *
   * For any call to apiError(code, message) with arbitrary non-empty strings,
   * the resulting ApiResponse must have exactly 4 fields and satisfy the
   * failure invariant.
   */
  it('apiError always produces a valid envelope with data===null and non-empty error.code/message', () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const code = randomNonEmptyString();
      const message = randomNonEmptyString();
      const response = apiError(code, message);
      assertErrorInvariant(response, `apiError iteration ${i}`);
    }
  });

  /**
   * Validates: Requirements 2.1, 2.2, 2.3
   *
   * The envelope shape must hold regardless of the data type passed to apiSuccess.
   * Tests specific data types: string, number, boolean, object, array.
   */
  it('apiSuccess envelope invariant holds for all primitive and structured data types', () => {
    const dataVariants: unknown[] = [
      'hello world',
      42,
      -1,
      0,
      true,
      false,
      { id: 'abc', name: 'test' },
      [],
      [1, 2, 3],
      [{ a: 1 }, { b: 2 }],
      { nested: { deep: { value: 99 } } },
    ];

    for (const data of dataVariants) {
      const response = apiSuccess(data);
      assertSuccessInvariant(response, `apiSuccess with data=${JSON.stringify(data)}`);
    }
  });

  /**
   * Validates: Requirements 2.1, 2.2, 2.3
   *
   * The envelope shape must hold for apiError regardless of error code/message content,
   * including codes with special characters, long strings, and domain-style codes.
   */
  it('apiError envelope invariant holds for various code and message formats', () => {
    const errorVariants: Array<[string, string]> = [
      ['AUTH_UNAUTHORIZED', 'User is not authenticated'],
      ['WORKSPACE_NOT_FOUND', 'The requested workspace does not exist'],
      ['VALIDATION_FAILED', 'Input validation failed'],
      ['INTERNAL_ERROR', 'An unexpected error occurred'],
      ['RATE_LIMIT_EXCEEDED', 'Too many requests'],
      ['TASK_NOT_FOUND', 'Task not found'],
      ['PROJECT_FORBIDDEN', 'Access denied to project'],
      ['a', 'b'],
      ['CODE_WITH_DETAILS', 'Message with details'],
    ];

    for (const [code, message] of errorVariants) {
      const response = apiError(code, message);
      assertErrorInvariant(response, `apiError(${code})`);
    }
  });

  /**
   * Validates: Requirements 2.1, 2.2, 2.3
   *
   * The envelope must have EXACTLY 4 fields — no extra fields should be present
   * at the top level, regardless of what data or details are passed.
   */
  it('envelope never has more or fewer than exactly 4 top-level fields', () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const isSuccess = randomInt(0, 1) === 1;
      const response = isSuccess
        ? apiSuccess(randomData())
        : apiError(randomNonEmptyString(), randomNonEmptyString());

      assertEnvelopeShape(
        response,
        `field count check iteration ${i} (${isSuccess ? 'success' : 'error'})`,
      );
    }
  });
});
