/**
 * Property Test: Health Check Response Format Consistency
 *
 * **Validates: Requirements 2.1, 2.4, 2.6**
 */

import fc from 'fast-check';
import { HealthCheckService } from '../health-check.service';
import type { HealthIndicator } from '../types';

class StaticIndicator implements HealthIndicator {
  constructor(
    public readonly name: string,
    private readonly healthy: boolean,
  ) {}

  async check() {
    return {
      status: this.healthy ? ('healthy' as const) : ('unhealthy' as const),
      latencyMs: 1,
      error: this.healthy ? undefined : 'down',
    };
  }
}

describe('Property 3: Health Check Response Format Consistency', () => {
  it('should return consistent liveness and readiness shapes', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 30 }),
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.array(fc.boolean(), { minLength: 0, maxLength: 5 }),
        async (service: string, version: string, deps: boolean[]) => {
          const health = new HealthCheckService({
            service,
            version,
            startTimeMs: Date.now() - 1000,
          });
          deps.forEach((isHealthy, idx) =>
            health.registerIndicator(new StaticIndicator(`dep_${idx}`, isHealthy)),
          );

          const liveness = health.checkHealth();
          expect(liveness).toHaveProperty('status');
          expect(liveness).toHaveProperty('service', service);
          expect(liveness).toHaveProperty('version', version);
          expect(typeof liveness.uptime).toBe('number');
          expect(typeof liveness.timestamp).toBe('string');

          const readiness = await health.checkReadiness();
          expect(readiness).toHaveProperty('dependencies');
          expect(Array.isArray(readiness.dependencies)).toBe(true);
          expect(readiness.dependencies.length).toBe(deps.length);

          const allHealthy = deps.every(Boolean);
          expect(readiness.status).toBe(allHealthy ? 'ok' : 'error');
        },
      ),
      { numRuns: 100 },
    );
  });
});
