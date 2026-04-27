/**
 * @superboard/backend-shared
 *
 * Shared backend infrastructure components for SuperBoard microservices.
 * Provides common functionality for AMQP consumers, health checks, configuration,
 * event processing, metrics, and more.
 */

// Core infrastructure exports
export * from './amqp';
export * from './health';
export * from './config';
export * from './events';
export * from './metrics';
export * from './bootstrap';
export * from './connections';
export * from './errors';
export * from './testing';

// Type definitions
export * from './types';
