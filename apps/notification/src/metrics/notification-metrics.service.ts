import { Injectable } from '@nestjs/common';
import type { Counter, Gauge } from 'prom-client';
import { MetricsService } from '@superboard/backend-shared/metrics';

@Injectable()
export class NotificationMetricsService {
  private readonly jobsTotal: Counter<string>;
  private readonly jobsFailed: Counter<string>;
  private readonly queueBacklog: Gauge<string>;

  // Event consumer metrics (Requirements: 13.4)
  private readonly eventsProcessedTotal: Counter<string>;
  private readonly eventsFailedTotal: Counter<string>;
  private readonly eventDlqDepth: Gauge<string>;

  // RabbitMQ consume metrics (Requirements: 9.3)
  private readonly rabbitmqConsumeTotal: Counter<string>;

  constructor(metrics: MetricsService) {
    this.jobsTotal = metrics.counter(
      'notification_jobs_total',
      'Total notification jobs processed',
      ['type', 'status'],
    );
    this.jobsFailed = metrics.counter(
      'notification_jobs_failed_total',
      'Total notification jobs failed per channel',
      ['type'],
    );
    this.queueBacklog = metrics.gauge(
      'notification_queue_backlog',
      'Current number of waiting jobs in the notifications queue',
    );

    this.eventsProcessedTotal = metrics.counter(
      'notification_events_processed_total',
      'Total domain events processed by the notification event consumer',
      ['event_type', 'status'],
    );
    this.eventsFailedTotal = metrics.counter(
      'notification_events_failed_total',
      'Total domain events that failed processing and were routed to DLQ',
      ['event_type'],
    );
    this.eventDlqDepth = metrics.gauge(
      'notification_event_dlq_depth',
      'Current number of events in the domain-events DLQ',
    );

    this.rabbitmqConsumeTotal = metrics.counter(
      'rabbitmq_consume_total',
      'Total RabbitMQ events consumed by service',
      ['service', 'event_type', 'status'],
    );
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
    // Also record RabbitMQ consume metric
    this.rabbitmqConsumeTotal.inc({
      service: 'notification',
      event_type: eventType,
      status: 'success',
    });
  }

  /** Record a domain event that exhausted retries and was routed to DLQ. */
  recordEventDlq(eventType: string): void {
    this.eventsProcessedTotal.inc({ event_type: eventType, status: 'dlq' });
    this.eventsFailedTotal.inc({ event_type: eventType });
    // Also record RabbitMQ consume metric
    this.rabbitmqConsumeTotal.inc({
      service: 'notification',
      event_type: eventType,
      status: 'dlq',
    });
  }

  /** Record a failed RabbitMQ event processing. */
  recordRabbitmqEventFailure(eventType: string): void {
    this.rabbitmqConsumeTotal.inc({
      service: 'notification',
      event_type: eventType,
      status: 'failure',
    });
  }

  /** Set the current DLQ depth for domain events. */
  setEventDlqDepth(count: number): void {
    this.eventDlqDepth.set(count);
  }
}
