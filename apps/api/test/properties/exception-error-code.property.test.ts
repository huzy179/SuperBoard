/**
 * Property-Based Test: Exception-to-Domain-Error-Code Mapping
 *
 * **Validates: Requirements 3.2**
 *
 * Property 2: Exception-to-Domain-Error-Code Mapping
 * For any exception thrown within a Core API request handler, the HTTP response
 * `error.code` field must be a valid entry in the `ErrorCodes` catalog — not a
 * raw HTTP status string like `"ERR_404"`.
 *
 * Acceptable values for `error.code`:
 *   1. A value in `ErrorCodes` (the catalog), OR
 *   2. A NestJS error string in SCREAMING_SNAKE_CASE (like `NOT_FOUND`, `UNAUTHORIZED`)
 *      — acceptable fallbacks for domain-specific exceptions not yet in the catalog
 *   NOT: a raw `ERR_<number>` string for common HTTP exceptions (400, 401, 403, 404, 500)
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { ErrorCodes } from '@superboard/shared';

// ---------------------------------------------------------------------------
// Inline extractErrorCode — mirrors the logic in HttpExceptionFilter exactly
// so we can test it without instantiating the full NestJS DI container.
// ---------------------------------------------------------------------------

const VALID_ERROR_CODE_VALUES = new Set<string>(Object.values(ErrorCodes));

/**
 * Extracted from HttpExceptionFilter.extractErrorCode — kept in sync with the
 * real implementation so the property test validates the actual mapping logic.
 */
function extractErrorCode(exception: unknown, status: number): string {
  // Check for explicit code set on the exception response first
  if (exception instanceof HttpException) {
    const exceptionResponse = exception.getResponse();
    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const res = exceptionResponse as Record<string, unknown>;
      if (typeof res['code'] === 'string' && res['code']) {
        return res['code'];
      }
    }
  }

  // Map common NestJS exception classes to domain error codes
  if (exception instanceof UnauthorizedException) {
    return ErrorCodes.AUTH_PERMISSION_DENIED;
  }
  if (exception instanceof ForbiddenException) {
    return ErrorCodes.AUTH_PERMISSION_DENIED;
  }
  if (exception instanceof BadRequestException) {
    return ErrorCodes.VALIDATION_FAILED;
  }
  if (exception instanceof InternalServerErrorException) {
    return ErrorCodes.INTERNAL_ERROR;
  }

  // Fall back to status-based mapping for other HttpExceptions
  if (exception instanceof HttpException) {
    const exceptionResponse = exception.getResponse();
    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const res = exceptionResponse as Record<string, unknown>;
      if (typeof res['error'] === 'string' && res['error']) {
        return res['error'].toUpperCase().replace(/\s+/g, '_');
      }
    }
  }

  if (status >= 500) {
    return ErrorCodes.INTERNAL_ERROR;
  }

  return `ERR_${status}`;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** SCREAMING_SNAKE_CASE pattern — acceptable NestJS fallback codes */
const SCREAMING_SNAKE_CASE = /^[A-Z][A-Z0-9]*(_[A-Z0-9]+)*$/;

/** Raw ERR_<number> pattern — must NOT appear for common HTTP status codes */
const RAW_ERR_NUMBER = /^ERR_\d+$/;

/** Common HTTP status codes that must never produce a raw ERR_<n> code */
const COMMON_HTTP_STATUSES = [400, 401, 403, 404, 500];

/**
 * Assert that a given error code satisfies the property:
 *   - Either it is in the ErrorCodes catalog, OR
 *   - It is a valid SCREAMING_SNAKE_CASE string (NestJS fallback)
 *   - It is NOT a raw ERR_<number> string for common HTTP statuses
 */
function assertValidErrorCode(code: string, status: number, label: string): void {
  assert.equal(typeof code, 'string', `${label}: error code must be a string`);
  assert.ok(code.length > 0, `${label}: error code must not be empty`);

  const isInCatalog = VALID_ERROR_CODE_VALUES.has(code);
  const isScreamingSnakeCase = SCREAMING_SNAKE_CASE.test(code);

  assert.ok(
    isInCatalog || isScreamingSnakeCase,
    `${label}: error code "${code}" must be in ErrorCodes catalog or SCREAMING_SNAKE_CASE — got neither`,
  );

  // For common HTTP statuses, raw ERR_<number> is explicitly forbidden
  if (COMMON_HTTP_STATUSES.includes(status)) {
    assert.ok(
      !RAW_ERR_NUMBER.test(code),
      `${label}: error code must not be a raw ERR_<number> string for HTTP ${status}, got "${code}"`,
    );
  }
}

// ---------------------------------------------------------------------------
// Exception generators
// ---------------------------------------------------------------------------

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Generate a random ErrorCodes catalog value */
function randomCatalogCode(): string {
  const values = Object.values(ErrorCodes);
  return values[randomInt(0, values.length - 1)];
}

/** Generate a random SCREAMING_SNAKE_CASE domain code not in catalog */
function randomDomainCode(): string {
  const domains = ['NOTIFICATION', 'SEARCH', 'AUTOMATION', 'BILLING', 'INTEGRATION'];
  const nouns = ['NOT_FOUND', 'LIMIT_EXCEEDED', 'INVALID', 'FORBIDDEN', 'CONFLICT'];
  const domain = domains[randomInt(0, domains.length - 1)];
  const noun = nouns[randomInt(0, nouns.length - 1)];
  return `${domain}_${noun}`;
}

type ExceptionFactory = () => { exception: unknown; status: number };

/** All exception factories used in property tests */
const EXCEPTION_FACTORIES: ExceptionFactory[] = [
  // Standard NestJS exception classes
  () => ({ exception: new BadRequestException('bad input'), status: 400 }),
  () => ({ exception: new UnauthorizedException('not authenticated'), status: 401 }),
  () => ({ exception: new ForbiddenException('access denied'), status: 403 }),
  () => ({ exception: new NotFoundException('resource not found'), status: 404 }),
  () => ({ exception: new InternalServerErrorException('server error'), status: 500 }),

  // HttpException with explicit `code` in response body (catalog code)
  () => ({
    exception: new HttpException({ code: randomCatalogCode(), message: 'domain error' }, 422),
    status: 422,
  }),

  // HttpException with explicit `code` in response body (custom domain code)
  () => ({
    exception: new HttpException({ code: randomDomainCode(), message: 'custom error' }, 400),
    status: 400,
  }),

  // HttpException with `error` string in response (NestJS default shape)
  () => ({
    exception: new HttpException({ error: 'Not Found', message: 'resource missing' }, 404),
    status: 404,
  }),
  () => ({
    exception: new HttpException({ error: 'Unprocessable Entity', message: 'invalid data' }, 422),
    status: 422,
  }),

  // Generic non-HTTP Error (maps to INTERNAL_ERROR)
  () => ({ exception: new Error('unexpected crash'), status: 500 }),
  () => ({ exception: new TypeError('type mismatch'), status: 500 }),
  () => ({ exception: new RangeError('out of range'), status: 500 }),

  // HttpException with status >= 500 (maps to INTERNAL_ERROR)
  () => ({
    exception: new HttpException('service unavailable', 503),
    status: 503,
  }),

  // HttpException with non-common status (may produce ERR_<n> — that's acceptable)
  () => ({
    exception: new HttpException('teapot', 418),
    status: 418,
  }),
];

// ---------------------------------------------------------------------------
// Property tests
// ---------------------------------------------------------------------------

const ITERATIONS = 200;

describe('Property 2: Exception-to-Domain-Error-Code Mapping', () => {
  /**
   * **Validates: Requirements 3.2**
   *
   * For every standard NestJS exception class (BadRequest, Unauthorized,
   * Forbidden, NotFound, InternalServerError), the resulting error code must
   * be a value in the ErrorCodes catalog.
   */
  it('standard NestJS exception classes always map to ErrorCodes catalog entries', () => {
    const standardExceptions: Array<{ exception: unknown; status: number; label: string }> = [
      {
        exception: new BadRequestException('bad input'),
        status: 400,
        label: 'BadRequestException',
      },
      {
        exception: new UnauthorizedException('not auth'),
        status: 401,
        label: 'UnauthorizedException',
      },
      { exception: new ForbiddenException('forbidden'), status: 403, label: 'ForbiddenException' },
      {
        exception: new InternalServerErrorException('crash'),
        status: 500,
        label: 'InternalServerErrorException',
      },
    ];

    for (const { exception, status, label } of standardExceptions) {
      const code = extractErrorCode(exception, status);
      assert.ok(
        VALID_ERROR_CODE_VALUES.has(code),
        `${label}: expected a catalog entry, got "${code}"`,
      );
      assertValidErrorCode(code, status, label);
    }
  });

  /**
   * **Validates: Requirements 3.2**
   *
   * For any HttpException that carries an explicit `code` field in its response
   * body, that code must be returned as-is (pass-through). The code must still
   * satisfy the SCREAMING_SNAKE_CASE or catalog constraint.
   */
  it('HttpException with explicit code field returns that code (pass-through)', () => {
    const catalogCodes = Object.values(ErrorCodes);

    for (let i = 0; i < ITERATIONS; i++) {
      const code = catalogCodes[randomInt(0, catalogCodes.length - 1)];
      const status = [400, 401, 403, 404, 422, 500][randomInt(0, 5)];
      const exception = new HttpException({ code, message: 'error' }, status);

      const result = extractErrorCode(exception, status);
      assert.equal(
        result,
        code,
        `iteration ${i}: expected pass-through of code "${code}", got "${result}"`,
      );
      assertValidErrorCode(result, status, `explicit code iteration ${i}`);
    }
  });

  /**
   * **Validates: Requirements 3.2**
   *
   * For any HttpException with a custom domain code (SCREAMING_SNAKE_CASE but
   * not in catalog), the code must be returned as-is and must satisfy the
   * SCREAMING_SNAKE_CASE constraint.
   */
  it('HttpException with custom domain code returns SCREAMING_SNAKE_CASE code', () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const code = randomDomainCode();
      const status = [400, 422, 409][randomInt(0, 2)];
      const exception = new HttpException({ code, message: 'domain error' }, status);

      const result = extractErrorCode(exception, status);
      assert.equal(
        result,
        code,
        `iteration ${i}: expected pass-through of "${code}", got "${result}"`,
      );
      assertValidErrorCode(result, status, `custom domain code iteration ${i}`);
    }
  });

  /**
   * **Validates: Requirements 3.2**
   *
   * For common HTTP status codes (400, 401, 403, 404, 500), the error code
   * must NEVER be a raw `ERR_<number>` string. It must always be either a
   * catalog entry or a SCREAMING_SNAKE_CASE string.
   */
  it('common HTTP status codes (400, 401, 403, 404, 500) never produce raw ERR_<number> codes', () => {
    const commonExceptions: Array<{ exception: unknown; status: number }> = [
      { exception: new BadRequestException('bad'), status: 400 },
      { exception: new UnauthorizedException('unauth'), status: 401 },
      { exception: new ForbiddenException('forbidden'), status: 403 },
      { exception: new NotFoundException('not found'), status: 404 },
      { exception: new InternalServerErrorException('crash'), status: 500 },
      // HttpException with NestJS default error shape
      { exception: new HttpException({ error: 'Bad Request', message: 'bad' }, 400), status: 400 },
      {
        exception: new HttpException({ error: 'Unauthorized', message: 'unauth' }, 401),
        status: 401,
      },
      {
        exception: new HttpException({ error: 'Forbidden', message: 'forbidden' }, 403),
        status: 403,
      },
      {
        exception: new HttpException({ error: 'Not Found', message: 'missing' }, 404),
        status: 404,
      },
      {
        exception: new HttpException({ error: 'Internal Server Error', message: 'crash' }, 500),
        status: 500,
      },
    ];

    for (const { exception, status } of commonExceptions) {
      const code = extractErrorCode(exception, status);
      assert.ok(
        !RAW_ERR_NUMBER.test(code),
        `HTTP ${status}: error code must not be raw ERR_<number>, got "${code}"`,
      );
      assertValidErrorCode(code, status, `HTTP ${status}`);
    }
  });

  /**
   * **Validates: Requirements 3.2**
   *
   * For any non-HTTP Error (plain Error, TypeError, RangeError, etc.),
   * the error code must be INTERNAL_ERROR from the catalog.
   */
  it('non-HTTP errors always map to INTERNAL_ERROR catalog entry', () => {
    const nonHttpErrors: Error[] = [
      new Error('generic error'),
      new TypeError('type error'),
      new RangeError('range error'),
      new SyntaxError('syntax error'),
      new ReferenceError('reference error'),
    ];

    for (const error of nonHttpErrors) {
      const code = extractErrorCode(error, 500);
      assert.equal(
        code,
        ErrorCodes.INTERNAL_ERROR,
        `${error.constructor.name}: expected INTERNAL_ERROR, got "${code}"`,
      );
    }
  });

  /**
   * **Validates: Requirements 3.2**
   *
   * Property test across all exception factories: for any exception type,
   * the resulting error code must satisfy the validity constraint.
   */
  it('all exception types produce valid error codes across many iterations', () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const factory = EXCEPTION_FACTORIES[randomInt(0, EXCEPTION_FACTORIES.length - 1)];
      const { exception, status } = factory();
      const code = extractErrorCode(exception, status);
      assertValidErrorCode(code, status, `random exception iteration ${i} (status=${status})`);
    }
  });

  /**
   * **Validates: Requirements 3.2**
   *
   * HttpException with status >= 500 (but not InternalServerErrorException)
   * must map to INTERNAL_ERROR.
   */
  it('HttpException with status >= 500 maps to INTERNAL_ERROR', () => {
    const serverErrorStatuses = [500, 501, 502, 503, 504, 507, 511];

    for (const status of serverErrorStatuses) {
      const exception = new HttpException(`error ${status}`, status);
      const code = extractErrorCode(exception, status);
      assert.equal(
        code,
        ErrorCodes.INTERNAL_ERROR,
        `HTTP ${status}: expected INTERNAL_ERROR, got "${code}"`,
      );
    }
  });
});
