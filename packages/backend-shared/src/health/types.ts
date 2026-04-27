/**
 * Health check type definitions
 */

export * from '../types';

export interface HealthIndicator {
  name: string;
  check(): Promise<HealthStatus>;
}

export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  latencyMs: number;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface HealthCheckOptions {
  timeout?: number;
  retries?: number;
  interval?: number;
}
