import { Injectable } from '@nestjs/common';
import { Counter, Gauge, register } from 'prom-client';

@Injectable()
export class NotificationMetricsService {
  readonly jobsTotal: Counter<string>;
  readonly jobsFailed: Counter<string>;
  readonly queueBacklog: Gauge<string>;

  constructor() {
    register.removeSingleMetric('notification_jobs_total');
    register.removeSingleMetric('notification_jobs_failed_total');
    register.removeSingleMetric('notification_queue_backlog');

    this.jobsTotal = new Counter({
      name: 'notification_jobs_total',
      help: 'Total notification jobs processed',
      labelNames: ['type', 'status'],
    });

    this.jobsFailed = new Counter({
      name: 'notification_jobs_failed_total',
      help: 'Total notification jobs failed per channel',
      labelNames: ['type'],
    });

    this.queueBacklog = new Gauge({
      name: 'notification_queue_backlog',
      help: 'Current number of waiting jobs in the notifications queue',
    });
  }

  recordSuccess(type: string): void {
    this.jobsTotal.inc({ type, status: 'success' });
  }

  recordFailure(type: string): void {
    this.jobsTotal.inc({ type, status: 'failed' });
    this.jobsFailed.inc({ type });
  }

  setQueueBacklog(count: number): void {
    this.queueBacklog.set(count);
  }
}
