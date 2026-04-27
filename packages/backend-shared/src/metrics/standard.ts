import type { Counter, Histogram } from 'prom-client';
import { MetricsService } from './metrics.service';

export interface AmqpStandardMetrics {
  messagesTotal: Counter<string>;
  processingDurationMs: Histogram<string>;
}

export function createAmqpStandardMetrics(
  metrics: MetricsService,
  opts: { prefix?: string; serviceLabel?: string } = {},
): AmqpStandardMetrics {
  const prefix = opts.prefix ?? '';
  const service = opts.serviceLabel ?? 'unknown';

  const messagesTotal = metrics.counter(`${prefix}amqp_messages_total`, 'AMQP messages processed', [
    'service',
    'queue',
    'status',
  ]);

  const processingDurationMs = metrics.histogram(
    `${prefix}amqp_processing_duration_ms`,
    'AMQP message processing duration (ms)',
    ['service', 'queue', 'status'],
    [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000],
  );

  // Pre-bind service default label by returning bound helpers is overkill; callers can label.
  // This function documents the standard names/labels used by the shared library.
  void service;
  return { messagesTotal, processingDurationMs };
}

export interface EventStandardMetrics {
  eventsTotal: Counter<string>;
  processingDurationMs: Histogram<string>;
}

export function createEventStandardMetrics(
  metrics: MetricsService,
  opts: { prefix?: string; serviceLabel?: string } = {},
): EventStandardMetrics {
  const prefix = opts.prefix ?? '';
  const service = opts.serviceLabel ?? 'unknown';

  const eventsTotal = metrics.counter(`${prefix}events_total`, 'Domain events processed', [
    'service',
    'event_type',
    'status',
  ]);

  const processingDurationMs = metrics.histogram(
    `${prefix}event_processing_duration_ms`,
    'Domain event processing duration (ms)',
    ['service', 'event_type', 'status'],
    [1, 2.5, 5, 10, 25, 50, 100, 250, 500, 1000],
  );

  void service;
  return { eventsTotal, processingDurationMs };
}
