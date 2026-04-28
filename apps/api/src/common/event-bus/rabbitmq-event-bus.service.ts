import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqplib from 'amqplib';
import type { DomainEvent } from '@superboard/shared';
import { RABBITMQ_EXCHANGES } from '@superboard/shared';
import { declareConsumerTopology } from './rabbitmq-topology';
import { RabbitMQMetricsService } from './rabbitmq-metrics.service';

@Injectable()
export class RabbitMQEventBusService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQEventBusService.name);
  private connection: amqplib.ChannelModel | null = null;
  private channel: amqplib.ConfirmChannel | null = null;
  private readonly maxRetries: number;
  private readonly backoffBaseMs: number;
  private readonly enabled: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly metricsService: RabbitMQMetricsService,
  ) {
    this.enabled = this.configService.get('ENABLE_RABBITMQ_EVENT_BUS') === 'true';
    this.maxRetries = this.configService.get<number>('RABBITMQ_PUBLISH_MAX_RETRIES') ?? 3;
    this.backoffBaseMs = this.configService.get<number>('RABBITMQ_PUBLISH_BACKOFF_BASE_MS') ?? 1000;
  }

  async onModuleInit(): Promise<void> {
    if (!this.enabled) {
      this.logger.warn('RabbitMQEventBusService is disabled (ENABLE_RABBITMQ_EVENT_BUS!=true)');
      return;
    }
    await this.connect();
    await this.declareTopology();
  }

  async onModuleDestroy(): Promise<void> {
    if (this.channel) {
      await this.channel.close();
    }
    if (this.connection) {
      await this.connection.close();
    }
  }

  /**
   * Establish AMQP connection and create confirm channel
   */
  private async connect(): Promise<void> {
    const rabbitmqUrl = this.configService.get<string>('RABBITMQ_URL');
    if (!rabbitmqUrl) {
      this.logger.warn('RabbitMQEventBusService missing RABBITMQ_URL; skipping connect');
      return;
    }

    try {
      this.connection = await amqplib.connect(rabbitmqUrl);
      this.channel = await this.connection.createConfirmChannel();

      // Set up connection recovery
      this.connection.on('error', (err) => {
        this.logger.error(`RabbitMQ connection error: ${err.message}`, err.stack);
      });

      this.connection.on('close', () => {
        this.logger.warn('RabbitMQ connection closed, attempting to reconnect...');
        this.reconnectWithBackoff();
      });

      this.logger.log('RabbitMQ connection established');
    } catch (error) {
      this.logger.error(
        `Failed to connect to RabbitMQ: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  /**
   * Reconnect with exponential backoff when connection is lost
   */
  private async reconnectWithBackoff(attempt = 1): Promise<void> {
    const delay = this.backoffBaseMs * Math.pow(2, attempt - 1) + Math.random() * 1000; // Add jitter

    this.logger.log(`Reconnection attempt ${attempt} in ${Math.round(delay)}ms`);

    await this.sleep(delay);

    try {
      await this.connect();
      await this.declareTopology();
      this.logger.log('RabbitMQ reconnection successful');
    } catch (error) {
      this.logger.error(`Reconnection attempt ${attempt} failed: ${(error as Error).message}`);
      // Continue trying to reconnect
      this.reconnectWithBackoff(attempt + 1);
    }
  }

  /**
   * Declare exchanges idempotently (assertExchange is idempotent by AMQP spec)
   */
  private async declareTopology(): Promise<void> {
    if (!this.enabled) return;
    if (!this.channel) {
      throw new Error('Channel not available for topology declaration');
    }

    await this.channel.assertExchange(RABBITMQ_EXCHANGES.DOMAIN_EVENTS, 'topic', {
      durable: true,
    });

    await this.channel.assertExchange(RABBITMQ_EXCHANGES.DEAD_LETTER, 'topic', {
      durable: true,
    });

    // Declare consumer topology for all services
    await declareConsumerTopology(this.channel);

    this.logger.log('RabbitMQ topology declared successfully');
  }

  /**
   * Publish a domain event to RabbitMQ with retry logic and exponential backoff
   */
  async publish(event: DomainEvent): Promise<void> {
    if (!this.channel) {
      this.logger.error(
        `Cannot publish event - no channel available. eventType=${event.eventType} correlationId=${event.correlationId}`,
      );
      this.metricsService.recordPublish(event.eventType, 'failure');
      return;
    }

    const startTime = Date.now();
    let lastError: unknown;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const messageBuffer = Buffer.from(JSON.stringify(event));
        const options: amqplib.Options.Publish = {
          deliveryMode: 2, // Persistent
          messageId: event.idempotencyKey,
          correlationId: event.correlationId,
          contentType: 'application/json',
          timestamp: Date.now(),
          headers: {
            'x-event-version': event.eventVersion,
            'x-producer': event.producer,
          },
        };

        // Use publisher confirms to ensure message is received by broker
        const confirmed = await new Promise<boolean>((resolve, reject) => {
          this.channel!.publish(
            RABBITMQ_EXCHANGES.DOMAIN_EVENTS,
            event.eventType, // routing key = event type
            messageBuffer,
            options,
            (err) => {
              if (err) {
                reject(err);
              } else {
                resolve(true);
              }
            },
          );
        });

        if (confirmed) {
          // Record successful publish metrics
          this.metricsService.recordPublish(event.eventType, 'success');
          this.metricsService.recordPublishDuration(event.eventType, Date.now() - startTime);

          this.logger.debug(
            `[RabbitMQ] Published: ${event.eventType} correlationId=${event.correlationId} attempt=${attempt}`,
          );
          return;
        }
      } catch (err) {
        lastError = err;

        // Record failed attempt metrics
        this.metricsService.recordPublish(event.eventType, 'failure');
        this.metricsService.recordPublishDuration(event.eventType, Date.now() - startTime);

        this.logger.warn(
          `[RabbitMQ] Publish attempt ${attempt}/${this.maxRetries} failed for ${event.eventType} correlationId=${event.correlationId}: ${(err as Error).message}`,
        );

        if (attempt < this.maxRetries) {
          const delay = this.backoffBaseMs * Math.pow(2, attempt - 1) + Math.random() * 500; // Add jitter
          await this.sleep(delay);
        }
      }
    }

    // All retries exhausted — log failure with full context, do NOT throw
    // Record final failure metrics
    this.metricsService.recordPublish(event.eventType, 'failure');
    this.metricsService.recordPublishDuration(event.eventType, Date.now() - startTime);

    this.logger.error(
      `[RabbitMQ] Failed to publish event after ${this.maxRetries} attempts. ` +
        `eventType=${event.eventType} correlationId=${event.correlationId} ` +
        `idempotencyKey=${event.idempotencyKey} payload=${JSON.stringify(event.payload)}`,
      lastError instanceof Error ? lastError.stack : String(lastError),
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Check if RabbitMQ connection is available
   */
  async isConnected(): Promise<boolean> {
    return this.connection !== null && this.channel !== null;
  }
}
