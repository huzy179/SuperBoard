import { Injectable } from '@nestjs/common';
import { Counter, Histogram, Gauge, register } from 'prom-client';

@Injectable()
export class AiMetricsService {
  readonly requestsTotal: Counter<string>;
  readonly durationSeconds: Histogram<string>;
  readonly circuitBreakerState: Gauge<string>;

  constructor() {
    // Unregister if already registered (for hot reload)
    register.removeSingleMetric('ai_grpc_requests_total');
    register.removeSingleMetric('ai_grpc_duration_seconds');
    register.removeSingleMetric('ai_circuit_breaker_state');

    this.requestsTotal = new Counter({
      name: 'ai_grpc_requests_total',
      help: 'Total number of gRPC requests to AI Service',
      labelNames: ['method', 'status'],
    });

    this.durationSeconds = new Histogram({
      name: 'ai_grpc_duration_seconds',
      help: 'Duration of gRPC requests to AI Service in seconds',
      labelNames: ['method'],
      buckets: [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    });

    this.circuitBreakerState = new Gauge({
      name: 'ai_circuit_breaker_state',
      help: 'Current state of the AI Service circuit breaker (0=closed, 1=open, 2=half-open)',
      labelNames: ['state'],
    });
  }

  recordRequest(method: string, status: 'success' | 'error' | 'fallback' | 'circuit_open'): void {
    this.requestsTotal.inc({ method, status });
  }

  recordDuration(method: string, durationMs: number): void {
    this.durationSeconds.observe({ method }, durationMs / 1000);
  }

  updateCircuitBreakerState(state: 'closed' | 'open' | 'half-open'): void {
    // Reset all states to 0, then set the current state to 1
    this.circuitBreakerState.set({ state: 'closed' }, state === 'closed' ? 1 : 0);
    this.circuitBreakerState.set({ state: 'open' }, state === 'open' ? 1 : 0);
    this.circuitBreakerState.set({ state: 'half-open' }, state === 'half-open' ? 1 : 0);
  }
}
