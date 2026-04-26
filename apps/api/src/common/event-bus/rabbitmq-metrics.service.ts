import { Injectable } from '@nestjs/common';
import { Counter, Histogram, register } from 'prom-client';

@Injectable()
export class RabbitMQMetricsService {
  readonly publishTotal: Counter<string>;
  readonly publishDurationSeconds: Histogram<string>;

  constructor() {
    // Unregister if already registered (for hot reload)
    register.removeSingleMetric('rabbitmq_publish_total');
    register.removeSingleMetric('rabbitmq_publish_duration_seconds');

    this.publishTotal = new Counter({
      name: 'rabbitmq_publish_total',
      help: 'Total number of RabbitMQ publish attempts',
      labelNames: ['event_type', 'status'],
    });

    this.publishDurationSeconds = new Histogram({
      name: 'rabbitmq_publish_duration_seconds',
      help: 'Duration of RabbitMQ publish operations in seconds',
      labelNames: ['event_type'],
      buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
    });
  }

  recordPublish(eventType: string, status: 'success' | 'failure'): void {
    this.publishTotal.inc({ event_type: eventType, status });
  }

  recordPublishDuration(eventType: string, durationMs: number): void {
    this.publishDurationSeconds.observe({ event_type: eventType }, durationMs / 1000);
  }
}
