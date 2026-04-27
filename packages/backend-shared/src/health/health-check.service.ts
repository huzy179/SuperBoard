import type { DependencyHealth, HealthResult, ReadinessResult } from '../types';
import type { HealthIndicator } from './types';

export interface HealthCheckServiceOptions {
  service: string;
  version: string;
  /**
   * Override start time (ms since epoch) for deterministic tests.
   */
  startTimeMs?: number;
}

/**
 * HealthCheckService
 *
 * - `/health` (liveness): basic process status
 * - `/ready` (readiness): checks registered dependency indicators
 */
export class HealthCheckService {
  private readonly indicators = new Map<string, HealthIndicator>();
  private readonly startTimeMs: number;

  constructor(private readonly options: HealthCheckServiceOptions) {
    this.startTimeMs = options.startTimeMs ?? Date.now();
  }

  registerIndicator(indicator: HealthIndicator): void {
    this.indicators.set(indicator.name, indicator);
  }

  listIndicators(): string[] {
    return Array.from(this.indicators.keys());
  }

  checkHealth(): HealthResult {
    return {
      status: 'ok',
      service: this.options.service,
      version: this.options.version,
      uptime: Math.floor((Date.now() - this.startTimeMs) / 1000),
      timestamp: new Date().toISOString(),
    };
  }

  async checkReadiness(): Promise<ReadinessResult> {
    const dependencyResults = await Promise.all(
      Array.from(this.indicators.values()).map(async (indicator) => {
        const start = Date.now();
        try {
          const status = await indicator.check();
          return {
            name: indicator.name,
            status: status.status,
            latencyMs: status.latencyMs ?? Date.now() - start,
            error: status.error,
          } satisfies DependencyHealth;
        } catch (error) {
          return {
            name: indicator.name,
            status: 'unhealthy',
            latencyMs: Date.now() - start,
            error: error instanceof Error ? error.message : String(error),
          } satisfies DependencyHealth;
        }
      }),
    );

    const allHealthy = dependencyResults.every((d) => d.status === 'healthy');
    return {
      ...this.checkHealth(),
      status: allHealthy ? 'ok' : 'error',
      dependencies: dependencyResults,
    };
  }
}
