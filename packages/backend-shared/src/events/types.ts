/**
 * Event processing type definitions
 */

import { DomainEvent, EventContext } from '../types';

export { DomainEvent, EventContext };

export interface EventHandler<T = unknown> {
  getEventType(): string;
  handle(payload: T, context: EventContext): Promise<void>;
}

export interface EventBus {
  publish(event: DomainEvent): Promise<void>;
  subscribe<T>(eventType: string, handler: EventHandler<T>): void;
  unsubscribe(eventType: string, handler: EventHandler): void;
}

export interface EventProcessingMetrics {
  eventsProcessed: number;
  eventsSucceeded: number;
  eventsFailed: number;
  averageProcessingTimeMs: number;
  lastProcessedAt?: Date;
}
