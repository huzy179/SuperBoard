/**
 * Integration tests for API global exception filter migration
 * Validates: Requirements 9.1, 9.2, 9.7
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BadRequestException } from '@nestjs/common';
import { ApiGlobalExceptionFilter } from '../../src/common/filters/api-global-exception.filter';

function makeHost(params: { correlationId?: string } = {}) {
  let statusCode = 200;
  let body: unknown;

  const res = {
    status(code: number) {
      statusCode = code;
      return res;
    },
    json(data: unknown) {
      body = data;
      return res;
    },
    getStatusCode: () => statusCode,
    getBody: () => body,
  };

  const req = {
    method: 'GET',
    url: '/test',
    headers: {
      'x-correlation-id': params.correlationId ?? 'test-corr',
    },
    body: {},
  };

  const host = {
    switchToHttp: () => ({
      getRequest: () => req,
      getResponse: () => res,
    }),
  } as unknown as import('@nestjs/common').ArgumentsHost;

  return { host, res };
}

describe('ApiGlobalExceptionFilter integration', () => {
  it('returns @superboard/shared apiError envelope', () => {
    const filter = new ApiGlobalExceptionFilter({ diagnose: async () => undefined } as never);
    const { host, res } = makeHost({ correlationId: 'corr-123' });

    filter.catch(new BadRequestException('bad'), host);

    assert.equal(res.getStatusCode(), 400);
    const body = res.getBody() as {
      success: boolean;
      data: unknown;
      error: { code: string; message: string };
      meta: { correlationId: string; timestamp: string };
    };
    assert.equal(body.success, false);
    assert.equal(body.data, null);
    assert.equal(body.error.code, 'VALIDATION_FAILED');
    assert.equal(body.error.message, 'bad');
    assert.equal(body.meta.correlationId, 'corr-123');
    assert.ok(typeof body.meta.timestamp === 'string');
  });
});
