/**
 * Property Test: Metrics Collection Completeness
 *
 * **Validates: Requirements 1.3, 4.6, 5.2, 5.7**
 */

import fc from 'fast-check';
import { MetricsService } from '../metrics.service';

describe('Property 7: Metrics Collection Completeness', () => {
  it('should expose registered metrics in Prometheus text format', async () => {
    const reserved = new Set([
      '__proto__',
      '__defineGetter__',
      '__defineSetter__',
      '__lookupGetter__',
      '__lookupSetter__',
      'prototype',
      'constructor',
      'toString',
      'valueOf',
      'hasOwnProperty',
      'isPrototypeOf',
      'propertyIsEnumerable',
      'toLocaleString',
    ]);

    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.constant(''),
          fc
            .string({ minLength: 1, maxLength: 10 })
            .filter((s) => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s))
            .map((s) => `${s}_`),
        ),
        fc
          .string({ minLength: 3, maxLength: 20 })
          .filter((s) => /^[a-zA-Z_:][a-zA-Z0-9_:]*$/.test(s) && !reserved.has(s)),
        fc.string({ minLength: 1, maxLength: 10 }),
        async (prefix: string, metricName: string, labelValue: string) => {
          const svc = new MetricsService({
            enabled: true,
            prefix,
            defaultLabels: { service: 'test' },
            collectDefaultMetrics: false,
          });

          const counter = svc.counter(metricName, 'help', ['status']);
          counter.inc({ status: labelValue }, 1);

          const out = await svc.metricsText();
          expect(out).toContain(`${prefix}${metricName}`);
          expect(out).toContain('service="test"');
        },
      ),
      { numRuns: 100 },
    );
  });
});
