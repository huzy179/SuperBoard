/**
 * Property-Based Test: Correlation ID Round-Trip
 *
 * **Validates: Requirements 6.1, 6.2**
 *
 * Property 3: Correlation ID Round-Trip
 * For any HTTP request to Core API (with or without X-Correlation-ID header),
 * the response must always have X-Correlation-ID header.
 * - If request provides ID → response echoes the same value
 * - If not provided → response contains a new valid UUID v4
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { CorrelationIdMiddleware } from '../../src/common/middleware/correlation-id.middleware.js';

// ---------------------------------------------------------------------------
// UUID v4 validation
// ---------------------------------------------------------------------------

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUuidV4(value: string): boolean {
  return UUID_V4_REGEX.test(value);
}

// ---------------------------------------------------------------------------
// Mock request / response factories
// ---------------------------------------------------------------------------

function makeMockRequest(correlationId?: string): {
  header: (name: string) => string | undefined;
} {
  return {
    header: (name: string) => {
      if (name.toLowerCase() === 'x-correlation-id') {
        return correlationId;
      }
      return undefined;
    },
  };
}

function makeMockResponse(): {
  setHeader: (name: string, value: string) => void;
  getHeader: (name: string) => string | undefined;
} {
  const headers: Record<string, string> = {};
  return {
    setHeader: (name: string, value: string) => {
      headers[name.toLowerCase()] = value;
    },
    getHeader: (name: string) => headers[name.toLowerCase()],
  };
}

// ---------------------------------------------------------------------------
// Random generators
// ---------------------------------------------------------------------------

function randomUuidV4(): string {
  // Generate a valid UUID v4 using crypto.randomUUID
  return crypto.randomUUID();
}

function randomString(length = 12): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// ---------------------------------------------------------------------------
// Property tests
// ---------------------------------------------------------------------------

const ITERATIONS = 100;

describe('Property 3: Correlation ID Round-Trip', () => {
  const middleware = new CorrelationIdMiddleware();

  /**
   * Validates: Requirements 6.1, 6.2
   *
   * When a request provides X-Correlation-ID, the response must echo the same value.
   */
  it('response echoes the same X-Correlation-ID when request provides one', () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const providedId = randomUuidV4();
      const req = makeMockRequest(providedId) as never;
      const res = makeMockResponse() as never;

      let nextCalled = false;

      middleware.use(req, res, () => {
        nextCalled = true;
      });

      assert.ok(nextCalled, `iteration ${i}: next() must be called`);

      const responseId = res.getHeader('x-correlation-id');
      assert.ok(
        responseId !== undefined,
        `iteration ${i}: response must have X-Correlation-ID header`,
      );
      assert.equal(
        responseId,
        providedId,
        `iteration ${i}: response must echo the provided correlation ID`,
      );
    }
  });

  /**
   * Validates: Requirements 6.1, 6.2
   *
   * When a request provides X-Correlation-ID with arbitrary non-UUID string values,
   * the response must still echo the same value (middleware accepts any string).
   */
  it('response echoes arbitrary string X-Correlation-ID values from request', () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const providedId = randomString(Math.floor(Math.random() * 40) + 1);
      const req = makeMockRequest(providedId) as never;
      const res = makeMockResponse() as never;

      middleware.use(req, res, () => {});

      const responseId = res.getHeader('x-correlation-id');
      assert.equal(
        responseId,
        providedId,
        `iteration ${i}: response must echo the provided ID "${providedId}"`,
      );
    }
  });

  /**
   * Validates: Requirements 6.1
   *
   * When a request has no X-Correlation-ID header, the response must contain
   * a new valid UUID v4.
   */
  it('response contains a new valid UUID v4 when request has no X-Correlation-ID', () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const req = makeMockRequest(undefined) as never;
      const res = makeMockResponse() as never;

      let nextCalled = false;

      middleware.use(req, res, () => {
        nextCalled = true;
      });

      assert.ok(nextCalled, `iteration ${i}: next() must be called`);

      const responseId = res.getHeader('x-correlation-id');
      assert.ok(
        responseId !== undefined,
        `iteration ${i}: response must have X-Correlation-ID header even without request header`,
      );
      assert.ok(
        typeof responseId === 'string' && responseId.length > 0,
        `iteration ${i}: generated correlation ID must be a non-empty string`,
      );
      assert.ok(
        isValidUuidV4(responseId),
        `iteration ${i}: generated correlation ID "${responseId}" must be a valid UUID v4`,
      );
    }
  });

  /**
   * Validates: Requirements 6.1, 6.2
   *
   * Each request without a correlation ID must receive a unique generated UUID —
   * no two requests should share the same generated ID.
   */
  it('each request without X-Correlation-ID receives a unique generated UUID', () => {
    const generatedIds = new Set<string>();

    for (let i = 0; i < ITERATIONS; i++) {
      const req = makeMockRequest(undefined) as never;
      const res = makeMockResponse() as never;

      middleware.use(req, res, () => {});

      const responseId = res.getHeader('x-correlation-id') as string;
      assert.ok(
        !generatedIds.has(responseId),
        `iteration ${i}: generated ID "${responseId}" must be unique across requests`,
      );
      generatedIds.add(responseId);
    }
  });

  /**
   * Validates: Requirements 6.1, 6.2
   *
   * Response always has X-Correlation-ID regardless of whether the request
   * provided one or not (mixed scenario).
   */
  it('response always has X-Correlation-ID header regardless of request header presence', () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const hasHeader = Math.random() < 0.5;
      const providedId = hasHeader ? randomUuidV4() : undefined;
      const req = makeMockRequest(providedId) as never;
      const res = makeMockResponse() as never;

      middleware.use(req, res, () => {});

      const responseId = res.getHeader('x-correlation-id');
      assert.ok(
        responseId !== undefined && typeof responseId === 'string' && responseId.length > 0,
        `iteration ${i} (hasHeader=${hasHeader}): response must always have a non-empty X-Correlation-ID header`,
      );

      if (hasHeader && providedId) {
        assert.equal(
          responseId,
          providedId,
          `iteration ${i}: when request has header, response must echo it`,
        );
      } else {
        assert.ok(
          isValidUuidV4(responseId),
          `iteration ${i}: when request has no header, generated ID must be valid UUID v4`,
        );
      }
    }
  });
});
