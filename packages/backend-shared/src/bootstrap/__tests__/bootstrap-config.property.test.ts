/**
 * Property Test: Bootstrap Configuration Consistency
 *
 * **Validates: Requirements 6.3, 6.4, 6.7**
 */

import fc from 'fast-check';
import { resolveListenPort } from '../nest-bootstrap';

describe('Property 11: Bootstrap Configuration Consistency', () => {
  it('should deterministically resolve a positive listen port', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(fc.constant(undefined), fc.integer({ min: -1000, max: 70000 })),
        fc.oneof(fc.constant(undefined), fc.string({ minLength: 0, maxLength: 6 })),
        async (configPort, envPort) => {
          const port = resolveListenPort(
            configPort as number | undefined,
            envPort as string | undefined,
          );
          expect(typeof port).toBe('number');
          expect(Number.isFinite(port)).toBe(true);
          expect(port).toBeGreaterThan(0);
        },
      ),
      { numRuns: 100 },
    );
  });
});
