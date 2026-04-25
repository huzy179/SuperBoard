import { Injectable } from '@nestjs/common';
import { Counter, Gauge, register } from 'prom-client';

@Injectable()
export class NotificationMetricsService {
  readonly jobsTotal: Counter<string>;
  readonly jobsFailed: Counter<string>;
  readonly queueBacklog: Gauge<string>;

  // Event consumer metrics (Requirements: 13.4)
  readonly eventsProcessedTotal: Counter<string>;
  readonly eventsFailedTotal: Counter<string>;
  readonly eventDlqDepth: Gauge<string>;

  constructor() {
    register.removeSingleMetric('notification_jobs_total');
    register.removeSingleMetric('notification_jobs_failed_total');
    register.removeSingleMetric('notification_queue_backlog');
    register.removeSingleMetric('notification_events_processed_total');
    register.removeSingleMetric('notification_events_failed_total');
    register.removeSingleMetric('notification_event_dlq_depth');

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

    this.eventsProcessedTotal = new Counter({
      name: 'notification_events_processed_total',
      help: 'Total domain events processed by the notification event consumer',
      labelNames: ['event_type', 'status'],
    });

    this.eventsFailedTotal = new Counter({
      name: 'notification_events_failed_total',
      help: 'Total domain events that failed processing and were routed to DLQ',
      labelNames: ['event_type'],
    });

    this.eventDlqDepth = new Gauge({
      name: 'notification_event_dlq_depth',
      help: 'Current number of events in the domain-events DLQ',
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

  /** Record a successfully processed domain event. */
  recordEventProcessed(eventType: string): void {
    this.eventsProcessedTotal.inc({ event_type: eventType, status: 'success' });
  }

  /** Record a domain event that exhausted retries and was routed to DLQ. */
  recordEventDlq(eventType: string): void {
    this.eventsProcessedTotal.inc({ event_type: eventType, status: 'dlq' });
    this.eventsFailedTotal.inc({ event_type: eventType });
  }

  /** Set the current DLQ depth for domain events. */
  setEventDlqDepth(count: number): void {
    this.eventDlqDepth.set(count);
  }
}
