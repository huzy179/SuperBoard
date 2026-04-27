/**
 * AMQP Consumer Framework
 *
 * Provides base classes and utilities for AMQP message consumption
 * with connection management, reconnection logic, and dead letter queue handling.
 */

export * from './base-consumer';
export * from './connection-manager';
export { AMQPConfig, AMQPMessage, DeadLetterQueueConfig, MessageProcessingContext } from './types';
