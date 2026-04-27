/**
 * Property Test: Error Response Standardization
 *
 * **Validates: Requirements 9.2, 9.4, 9.5, 9.7**
 */

import fc from 'fast-check';
import { GlobalExceptionFilter } from '../filters';
import { ValidationError } from '../error-types';

function makeHost() {
  const res: any = {
    statusCode: 200,
    body: null as any,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: any) {
      this.body = body;
      return this;
    },
  };

  const req: any = {
    method: 'GET',
    url: '/test',
    headers: {},
  };

  const host: any = {
    switchToHttp: () => ({
      getResponse: () => res,
      getRequest: () => req,
    }),
  };

  return { host, req, res };
}

describe('Property 10: Error Response Standardization', () => {
  it('should always return StandardErrorResponse shape with correlationId', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 64 }),
        fc.string({ minLength: 1, maxLength: 100 }),
        async (correlationId: string, message: string) => {
          const filter = new GlobalExceptionFilter();
          const { host, res } = makeHost();

          filter.catch(new ValidationError(message, correlationId), host);

          expect(res.statusCode).toBeGreaterThanOrEqual(400);
          expect(res.body).toHaveProperty('error');
          expect(res.body.error).toHaveProperty('message', message);
          expect(res.body.error).toHaveProperty('correlationId', correlationId);
          expect(res.body.error).toHaveProperty('timestamp');
          expect(res.body.error).toHaveProperty('type');
          expect(res.body.error).toHaveProperty('severity');
        },
      ),
      { numRuns: 100 },
    );
  });
});
