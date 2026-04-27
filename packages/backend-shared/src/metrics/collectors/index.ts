import type { Registry } from 'prom-client';
import { collectDefaultMetrics } from 'prom-client';

export class DefaultMetricsCollector {
  private started = false;
  constructor(
    private readonly registry: Registry,
    private readonly prefix: string = '',
  ) {}

  start(): void {
    if (this.started) return;
    collectDefaultMetrics({ register: this.registry, prefix: this.prefix });
    this.started = true;
  }
}
