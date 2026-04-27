/**
 * Event Processing Framework
 *
 * Provides base event handler interface with correlation ID tracking,
 * retry mechanisms, and event type filtering capabilities.
 */

export * from './base-handler';
export * from './event-bus';
export { EventHandler, EventProcessingMetrics } from './types';
