import type { DomainEvent } from '../types';
import type { MetricsService } from '../metrics/metrics.service';
import { type EventStandardMetrics, createEventStandardMetrics } from '../metrics/standard';
import { BaseEventHandler } from './base-handler';
import type { EventBus as EventBusInterface, EventHandler, EventProcessingMetrics } from './types';

export interface EventBusOptions {
  onError?: (params: {
    event: DomainEvent;
    handler: EventHandler;
    error: Error;
  }) => Promise<void> | void;
  metricsService?: MetricsService;
  serviceName?: string;
}

/**
 * Simple in-process Event Bus.
 *
 * Primarily intended for wiring AMQP consumers to domain handlers consistently.
 * (Transport-specific concerns like DLQ publishing can be handled via `onError`.)
 */
export class EventBus implements EventBusInterface {
  private readonly handlers = new Map<string, Set<EventHandler>>();
  private readonly options: EventBusOptions;
  private readonly metrics: Record<string, EventProcessingMetrics> = {};
  private readonly standardMetrics?: EventStandardMetrics;
  private readonly serviceName: string;

  constructor(options: EventBusOptions = {}) {
    this.options = options;
    this.serviceName = options.serviceName ?? 'unknown';
    this.standardMetrics = options.metricsService
      ? createEventStandardMetrics(options.metricsService, { serviceLabel: this.serviceName })
      : undefined;
  }

  getMetrics(eventType: string): EventProcessingMetrics {
    return (
      this.metrics[eventType] ?? {
        eventsProcessed: 0,
        eventsSucceeded: 0,
        eventsFailed: 0,
        averageProcessingTimeMs: 0,
      }
    );
  }

  async publish(event: DomainEvent): Promise<void> {
    const set = this.handlers.get(event.eventType);
    if (!set || set.size === 0) return;

    const start = Date.now();
    const metrics = this.metrics[event.eventType] ?? {
      eventsProcessed: 0,
      eventsSucceeded: 0,
      eventsFailed: 0,
      averageProcessingTimeMs: 0,
    };
    metrics.eventsProcessed++;

    const handlers = Array.from(set);
    const results = await Promise.allSettled(
      handlers.map(async (handler) => {
        if (handler instanceof BaseEventHandler) {
          await handler.handleDomainEvent(event);
        } else {
          // Best-effort mapping for non-Base handlers
          await handler.handle(event.payload as never, {
            correlationId: event.correlationId,
            timestamp: new Date(event.timestamp),
            retryCount: 0,
            metadata: event.metadata ?? {},
          });
        }
      }),
    );

    const duration = Date.now() - start;
    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.length - succeeded;

    metrics.eventsSucceeded += succeeded;
    metrics.eventsFailed += failed;
    metrics.lastProcessedAt = new Date();
    const processedSoFar = metrics.eventsSucceeded + metrics.eventsFailed;
    metrics.averageProcessingTimeMs =
      processedSoFar === 0
        ? 0
        : (metrics.averageProcessingTimeMs * (processedSoFar - 1) + duration) / processedSoFar;

    this.metrics[event.eventType] = metrics;

    if (failed > 0 && this.options.onError) {
      for (const [index, result] of results.entries()) {
        if (result.status !== 'rejected') continue;
        const handler = handlers[index];
        if (!handler) continue;
        const reason = result.reason;
        const error = reason instanceof Error ? reason : new Error(String(reason));
        await this.options.onError({ event, handler, error });
      }
    }

    // Prometheus-style standard metrics
    if (this.standardMetrics) {
      const status = failed > 0 ? 'failure' : 'success';
      this.standardMetrics.eventsTotal.inc(
        { service: this.serviceName, event_type: event.eventType, status },
        1,
      );
      this.standardMetrics.processingDurationMs.observe(
        { service: this.serviceName, event_type: event.eventType, status },
        duration,
      );
    }

    if (failed > 0) {
      // If any handler failed, bubble up to allow upstream transport to DLQ / retry.
      const firstRejection = results.find((r) => r.status === 'rejected') as
        | PromiseRejectedResult
        | undefined;
      if (firstRejection) {
        throw firstRejection.reason instanceof Error
          ? firstRejection.reason
          : new Error(String(firstRejection.reason));
      }
    }
  }

  subscribe<T>(eventType: string, handler: EventHandler<T>): void {
    const set = this.handlers.get(eventType) ?? new Set<EventHandler>();
    set.add(handler as unknown as EventHandler);
    this.handlers.set(eventType, set);
  }

  unsubscribe(eventType: string, handler: EventHandler): void {
    const set = this.handlers.get(eventType);
    if (!set) return;
    set.delete(handler);
    if (set.size === 0) this.handlers.delete(eventType);
  }
}
