/**
 * AMQP-specific type definitions
 */

import { Connection, ConsumeMessage } from 'amqplib';
import { AMQPConfig, AMQPMessage } from '../types';

export { AMQPConfig, AMQPMessage };

export interface AMQPConnectionManager {
  getConnection(config: AMQPConfig): Promise<Connection>;
  closeAll(): Promise<void>;
}

export interface AMQPConsumerMetrics {
  messagesProcessed: number;
  messagesSucceeded: number;
  messagesFailed: number;
  processingTimeMs: number;
  lastProcessedAt?: Date;
}

export interface DeadLetterQueueConfig {
  exchange: string;
  queue: string;
  routingKey: string;
  ttl?: number; // Time to live in milliseconds
}

export interface MessageProcessingContext {
  correlationId: string;
  timestamp: Date;
  retryCount: number;
  originalMessage: ConsumeMessage;
  startTime: number;
}
