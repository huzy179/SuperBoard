/**
 * Search Service AMQP Event Consumer
 *
 * Consumes domain events from RabbitMQ to update the search index.
 * Subscribes to the "search.domain.events" queue with binding keys:
 * task.*, doc.updated, project.updated
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */
import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqplib from 'amqplib';
import { register, Counter } from 'prom-client';
import type { DomainEvent } from '@superboard/shared';
import { RABBITMQ_EXCHANGES, RABBITMQ_QUEUES, RABBITMQ_DLQ_NAMES } from '@superboard/shared';

/** Event types that affect the search index. */
const SEARCH_EVENT_TYPES = new Set([
  'task.created',
  'task.updated',
  'task.status_changed',
  'doc.updated',
  'project.updated',
]);

/** Binding keys for the search queue */
const BINDING_KEYS = ['task.*', 'doc.updated', 'project.updated'];

// Global metric instance to avoid re-registration
let consumeCounterInstance: Counter<string> | null = null;

function getConsumeCounter(): Counter<string> {
  if (!consumeCounterInstance) {
    consumeCounterInstance = new Counter({
      name: 'rabbitmq_consume_total',
      help: 'Total number of RabbitMQ messages consumed',
      labelNames: ['service', 'event_type', 'status'],
      registers: [register],
    });
  }
  return consumeCounterInstance;
}

@Injectable()
export class AmqpEventConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AmqpEventConsumerService.name);
  private connection: amqplib.Connection | null = null;
  private channel: amqplib.Channel | null = null;
  private readonly prefetchCount: number;
  private readonly rabbitmqUrl: string;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 10;
  private readonly baseReconnectDelay = 1000; // 1 second

  // Metrics
  private readonly consumeCounter: Counter<string>;

  constructor(private readonly config: ConfigService) {
    this.rabbitmqUrl = this.config.get<string>('RABBITMQ_URL') ?? 'amqp://localhost:5672';
    this.prefetchCount = parseInt(this.config.get<string>('RABBITMQ_PREFETCH_COUNT') ?? '10', 10);

    // Get or create metrics
    this.consumeCounter = getConsumeCounter();
  }

  async onModuleInit(): Promise<void> {
    await this.connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.disconnect();
  }

  private async connect(): Promise<void> {
    try {
      this.connection = await amqplib.connect(this.rabbitmqUrl);
      this.channel = await this.connection.createChannel();

      // Set up connection event handlers
      this.connection.on('error', (err: Error) => {
        this.logger.error(`[amqp-consumer] connection error: ${err.message}`);
      });

      this.connection.on('close', () => {
        this.logger.warn('[amqp-consumer] connection closed, attempting to reconnect...');
        this.reconnect();
      });

      await this.declareAndBind();
      await this.startConsuming();

      this.reconnectAttempts = 0; // Reset on successful connection
      this.logger.log(
        `[amqp-consumer] connected to RabbitMQ and consuming from queue '${RABBITMQ_QUEUES.SEARCH}'`,
      );
    } catch (error) {
      this.logger.error(`[amqp-consumer] failed to connect: ${(error as Error).message}`);
      this.reconnect();
    }
  }

  private async reconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.logger.error(
        `[amqp-consumer] max reconnect attempts (${this.maxReconnectAttempts}) reached`,
      );
      return;
    }

    this.reconnectAttempts++;
    const delay = this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    const jitter = Math.random() * 1000; // Add jitter to prevent thundering herd
    const totalDelay = Math.min(delay + jitter, 30000); // Cap at 30 seconds

    this.logger.log(
      `[amqp-consumer] reconnecting in ${Math.round(totalDelay)}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`,
    );

    setTimeout(() => {
      this.connect();
    }, totalDelay);
  }

  private async declareAndBind(): Promise<void> {
    if (!this.channel) {
      throw new Error('Channel not available');
    }

    // Declare exchanges (idempotent)
    await this.channel.assertExchange(RABBITMQ_EXCHANGES.DOMAIN_EVENTS, 'topic', {
      durable: true,
    });
    await this.channel.assertExchange(RABBITMQ_EXCHANGES.DEAD_LETTER, 'topic', {
      durable: true,
    });

    // Declare main queue with DLX configuration
    await this.channel.assertQueue(RABBITMQ_QUEUES.SEARCH, {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': RABBITMQ_EXCHANGES.DEAD_LETTER,
      },
    });

    // Declare DLQ
    await this.channel.assertQueue(RABBITMQ_DLQ_NAMES.SEARCH, {
      durable: true,
      arguments: {
        'x-message-ttl': 604800000, // 7 days in milliseconds
      },
    });

    // Bind main queue to domain events exchange
    for (const bindingKey of BINDING_KEYS) {
      await this.channel.bindQueue(
        RABBITMQ_QUEUES.SEARCH,
        RABBITMQ_EXCHANGES.DOMAIN_EVENTS,
        bindingKey,
      );
    }

    // Bind DLQ to dead letter exchange
    await this.channel.bindQueue(
      RABBITMQ_DLQ_NAMES.SEARCH,
      RABBITMQ_EXCHANGES.DEAD_LETTER,
      RABBITMQ_QUEUES.SEARCH,
    );
  }

  private async startConsuming(): Promise<void> {
    if (!this.channel) {
      throw new Error('Channel not available');
    }

    // Set prefetch count
    await this.channel.prefetch(this.prefetchCount);

    // Start consuming
    await this.channel.consume(RABBITMQ_QUEUES.SEARCH, this.handleMessage.bind(this));
  }

  private async handleMessage(msg: amqplib.Message | null): Promise<void> {
    if (!msg) return;

    let event: DomainEvent;
    let eventType = 'unknown';

    try {
      // Parse the event
      event = JSON.parse(msg.content.toString());
      eventType = event.eventType;

      // Check if we should process this event type
      if (!SEARCH_EVENT_TYPES.has(eventType)) {
        this.logger.debug(`[amqp-consumer] ignoring event type '${eventType}'`);
        this.channel!.ack(msg);
        this.consumeCounter.inc({ service: 'search', event_type: eventType, status: 'success' });
        return;
      }

      // Process the event (update search index)
      await this.updateSearchIndex(event);

      // ACK only after successful processing
      this.channel!.ack(msg);
      this.consumeCounter.inc({ service: 'search', event_type: eventType, status: 'success' });

      this.logger.log(
        `[amqp-consumer] successfully processed event '${eventType}' (correlationId=${event.correlationId})`,
      );
    } catch (error) {
      this.logger.error(
        `[amqp-consumer] failed to process event '${eventType}': ${error.message}`,
        { correlationId: event?.correlationId },
      );

      // NACK with requeue=false to send to DLQ
      this.channel!.nack(msg, false, false);
      this.consumeCounter.inc({ service: 'search', event_type: eventType, status: 'failure' });
    }
  }

  /**
   * Update the search index based on the domain event.
   * Mock implementation — logs the indexing action.
   */
  private async updateSearchIndex(event: DomainEvent): Promise<void> {
    const payload = event.payload as Record<string, unknown>;

    this.logger.log(
      `[amqp-consumer] updating search index for event '${event.eventType}' ` +
        `(correlationId=${event.correlationId})`,
    );

    // Mock: log the indexing action per event type
    switch (event.eventType) {
      case 'task.created':
      case 'task.updated':
      case 'task.status_changed':
        this.logger.log(
          `[amqp-consumer] [mock] index task taskId=${payload.taskId} projectId=${payload.projectId}`,
        );
        break;
      case 'doc.updated':
        this.logger.log(
          `[amqp-consumer] [mock] index doc docId=${payload.docId} projectId=${payload.projectId}`,
        );
        break;
      case 'project.updated':
        this.logger.log(`[amqp-consumer] [mock] index project projectId=${payload.projectId}`);
        break;
    }

    // Simulate some processing time
    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  private async disconnect(): Promise<void> {
    try {
      await this.channel?.close();
      await this.connection?.close();
      this.logger.log('[amqp-consumer] disconnected from RabbitMQ');
    } catch (error) {
      this.logger.error(`[amqp-consumer] error during disconnect: ${(error as Error).message}`);
    }
  }
}
