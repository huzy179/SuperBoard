import type { Channel, ConsumeMessage, Options } from 'amqplib';
import { Logger } from '@nestjs/common';
import { AMQPConnectionManager } from './connection-manager';
import type { MetricsService } from '../metrics/metrics.service';
import { createAmqpStandardMetrics, type AmqpStandardMetrics } from '../metrics/standard';
import type {
  AMQPConfig,
  AMQPConsumerMetrics,
  DeadLetterQueueConfig,
  MessageProcessingContext,
} from './types';

export interface LoggerLike {
  debug(message: string, meta?: unknown): void;
  log(message: string, meta?: unknown): void;
  warn(message: string, meta?: unknown): void;
  error(message: string, meta?: unknown): void;
}

export interface DeadLetterMessage {
  error: { message: string; name?: string; stack?: string };
  context: Omit<MessageProcessingContext, 'originalMessage'> & {
    originalMessage: {
      contentBase64: string;
      fields: ConsumeMessage['fields'];
      properties: ConsumeMessage['properties'];
    };
  };
}

export interface BaseAMQPConsumerOptions<TPayload = unknown> {
  config: AMQPConfig;
  serviceName: string;
  connectionManager?: AMQPConnectionManager;
  logger?: LoggerLike;
  metricsService?: MetricsService;
  exchangeType?: 'direct' | 'topic' | 'fanout' | 'headers';
  exchangeOptions?: Options.AssertExchange;
  queueOptions?: Options.AssertQueue;
  consumeOptions?: Options.Consume;
  deadLetter?: DeadLetterQueueConfig;
  maxReconnectAttempts?: number;
  baseReconnectDelayMs?: number;
  maxReconnectDelayMs?: number;
  jitterMs?: number;
  parseMessage?: (message: ConsumeMessage) => TPayload;
  shouldProcess?: (payload: TPayload, context: MessageProcessingContext) => boolean;
}

function defaultLogger(name: string): LoggerLike {
  const logger = new Logger(name);
  return {
    debug: (message, meta) => logger.debug(message, meta as never),
    log: (message, meta) => logger.log(message, meta as never),
    warn: (message, meta) => logger.warn(message, meta as never),
    error: (message, meta) => logger.error(message, meta as never),
  };
}

function generateCorrelationId(): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cryptoAny = globalThis.crypto as any;
  if (cryptoAny?.randomUUID) return cryptoAny.randomUUID();
  return `corr_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

/**
 * Base AMQP Consumer
 *
 * Provides:
 * - Connection + channel lifecycle (with exponential backoff reconnect)
 * - Declare exchange/queue/bindings + prefetch
 * - Correlation ID propagation
 * - Optional DLQ publish with preserved context
 *
 * Services should extend and implement `processMessage`.
 */
export abstract class BaseAMQPConsumer<TPayload = unknown> {
  protected readonly config: AMQPConfig;
  protected readonly serviceName: string;
  protected readonly logger: LoggerLike;
  protected readonly connectionManager: AMQPConnectionManager;

  protected channel: Channel | null = null;
  private consumerTag: string | null = null;
  private reconnectAttempts = 0;
  private stopped = false;

  private readonly exchangeType: 'direct' | 'topic' | 'fanout' | 'headers';
  private readonly exchangeOptions?: Options.AssertExchange;
  private readonly queueOptions?: Options.AssertQueue;
  private readonly consumeOptions?: Options.Consume;
  private readonly deadLetter?: DeadLetterQueueConfig;
  private readonly maxReconnectAttempts: number;
  private readonly baseReconnectDelayMs: number;
  private readonly maxReconnectDelayMs: number;
  private readonly jitterMs: number;
  private readonly parseMessage: (message: ConsumeMessage) => TPayload;
  private readonly shouldProcess?: (
    payload: TPayload,
    context: MessageProcessingContext,
  ) => boolean;
  private readonly metricsService?: MetricsService;
  private readonly standardMetrics?: AmqpStandardMetrics;

  private readonly metrics: AMQPConsumerMetrics = {
    messagesProcessed: 0,
    messagesSucceeded: 0,
    messagesFailed: 0,
    processingTimeMs: 0,
  };

  constructor(options: BaseAMQPConsumerOptions<TPayload>) {
    this.config = options.config;
    this.serviceName = options.serviceName;
    this.connectionManager = options.connectionManager ?? new AMQPConnectionManager();
    this.logger = options.logger ?? defaultLogger(`${options.serviceName}:AMQPConsumer`);
    this.exchangeType = options.exchangeType ?? 'topic';
    this.exchangeOptions = options.exchangeOptions;
    this.queueOptions = options.queueOptions;
    this.consumeOptions = options.consumeOptions;
    this.deadLetter =
      options.deadLetter ??
      (this.config.deadLetterExchange && this.config.deadLetterQueue
        ? {
            exchange: this.config.deadLetterExchange,
            queue: this.config.deadLetterQueue,
            routingKey: this.config.queue,
          }
        : undefined);
    this.maxReconnectAttempts =
      options.maxReconnectAttempts ?? this.config.maxReconnectAttempts ?? 10;
    this.baseReconnectDelayMs =
      options.baseReconnectDelayMs ?? this.config.reconnectInterval ?? 1000;
    this.maxReconnectDelayMs = options.maxReconnectDelayMs ?? 30000;
    this.jitterMs = options.jitterMs ?? 1000;
    this.parseMessage =
      options.parseMessage ??
      ((message: ConsumeMessage) => JSON.parse(message.content.toString('utf8')) as TPayload);
    this.shouldProcess = options.shouldProcess;

    this.metricsService = options.metricsService;
    this.standardMetrics = this.metricsService
      ? createAmqpStandardMetrics(this.metricsService, { serviceLabel: this.serviceName })
      : undefined;
  }

  getMetrics(): AMQPConsumerMetrics {
    return { ...this.metrics };
  }

  async start(): Promise<void> {
    this.stopped = false;
    await this.connectAndConsume();
  }

  async stop(): Promise<void> {
    this.stopped = true;
    try {
      if (this.channel && this.consumerTag) {
        await this.channel.cancel(this.consumerTag);
      }
    } catch {
      // ignore
    } finally {
      this.consumerTag = null;
    }

    try {
      await this.channel?.close();
    } catch {
      // ignore
    } finally {
      this.channel = null;
    }
  }

  protected abstract processMessage(
    payload: TPayload,
    context: MessageProcessingContext,
  ): Promise<void>;

  private async connectAndConsume(): Promise<void> {
    if (this.stopped) return;
    try {
      const connection = await this.connectionManager.getConnection(this.config);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const channel = await (connection as any).createChannel();
      this.channel = channel as unknown as Channel;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (connection as any).on('close', () => {
        this.logger.warn('[amqp] connection closed; reconnecting');
        void this.reconnect();
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (connection as any).on('error', (err: Error) => {
        this.logger.error(`[amqp] connection error: ${err.message}`);
      });

      await this.declareTopology();
      await this.startConsuming();

      this.reconnectAttempts = 0;
      this.logger.log(
        `[amqp] consuming queue='${this.config.queue}' exchange='${this.config.exchange}'`,
      );
    } catch (error) {
      this.logger.error(`[amqp] connect/consume failed: ${(error as Error).message}`);
      await this.reconnect();
    }
  }

  private async reconnect(): Promise<void> {
    if (this.stopped) return;
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.logger.error(`[amqp] max reconnect attempts reached (${this.maxReconnectAttempts})`);
      return;
    }

    this.reconnectAttempts++;
    const baseDelay = this.baseReconnectDelayMs * Math.pow(2, this.reconnectAttempts - 1);
    const jitter = Math.random() * this.jitterMs;
    const delay = Math.min(baseDelay + jitter, this.maxReconnectDelayMs);

    await this.stop();

    this.logger.warn(
      `[amqp] reconnecting in ${Math.round(delay)}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`,
    );

    setTimeout(() => {
      void this.connectAndConsume();
    }, delay);
  }

  private async declareTopology(): Promise<void> {
    if (!this.channel) throw new Error('Channel not available');

    await this.channel.assertExchange(this.config.exchange, this.exchangeType, {
      durable: true,
      ...(this.exchangeOptions ?? {}),
    });

    const queueArgs: Record<string, unknown> = {
      ...(this.queueOptions?.arguments ?? {}),
    };

    if (this.deadLetter?.exchange) {
      queueArgs['x-dead-letter-exchange'] = this.deadLetter.exchange;
    }

    await this.channel.assertQueue(this.config.queue, {
      durable: true,
      ...(this.queueOptions ?? {}),
      arguments: queueArgs,
    });

    for (const key of this.config.routingKeys) {
      await this.channel.bindQueue(this.config.queue, this.config.exchange, key);
    }

    if (this.deadLetter) {
      await this.channel.assertExchange(this.deadLetter.exchange, 'topic', { durable: true });
      await this.channel.assertQueue(this.deadLetter.queue, {
        durable: true,
        arguments: this.deadLetter.ttl ? { 'x-message-ttl': this.deadLetter.ttl } : undefined,
      });
      await this.channel.bindQueue(
        this.deadLetter.queue,
        this.deadLetter.exchange,
        this.deadLetter.routingKey,
      );
    }
  }

  private async startConsuming(): Promise<void> {
    if (!this.channel) throw new Error('Channel not available');

    const prefetch = this.config.prefetchCount ?? 10;
    await this.channel.prefetch(prefetch);

    const result = await this.channel.consume(
      this.config.queue,
      (message) => void this.onMessage(message),
      this.consumeOptions,
    );

    this.consumerTag = result.consumerTag;
  }

  private async onMessage(message: ConsumeMessage | null): Promise<void> {
    if (!message || !this.channel) return;

    const correlationId =
      message.properties.correlationId ??
      message.properties.messageId ??
      (message.properties.headers?.['x-correlation-id'] as string | undefined) ??
      generateCorrelationId();

    const context: MessageProcessingContext = {
      correlationId,
      timestamp: new Date(),
      retryCount: (message.properties.headers?.['x-retry-count'] as number | undefined) ?? 0,
      originalMessage: message,
      startTime: Date.now(),
    };

    let payload: TPayload;
    try {
      payload = this.parseMessage(message);
    } catch (error) {
      await this.handleFailure(message, context, error);
      return;
    }

    if (this.shouldProcess && !this.shouldProcess(payload, context)) {
      this.channel.ack(message);
      this.standardMetrics?.messagesTotal.inc(
        { service: this.serviceName, queue: this.config.queue, status: 'ignored' },
        1,
      );
      this.standardMetrics?.processingDurationMs.observe(
        { service: this.serviceName, queue: this.config.queue, status: 'ignored' },
        Date.now() - context.startTime,
      );
      return;
    }

    this.metrics.messagesProcessed++;

    try {
      await this.processMessage(payload, context);
      this.channel.ack(message);
      this.metrics.messagesSucceeded++;
      this.metrics.lastProcessedAt = new Date();
      this.standardMetrics?.messagesTotal.inc(
        { service: this.serviceName, queue: this.config.queue, status: 'success' },
        1,
      );
      this.standardMetrics?.processingDurationMs.observe(
        { service: this.serviceName, queue: this.config.queue, status: 'success' },
        Date.now() - context.startTime,
      );
    } catch (error) {
      await this.handleFailure(message, context, error);
    } finally {
      const duration = Date.now() - context.startTime;
      this.metrics.processingTimeMs += duration;
    }
  }

  private async handleFailure(
    message: ConsumeMessage,
    context: MessageProcessingContext,
    error: unknown,
  ): Promise<void> {
    if (!this.channel) return;

    this.metrics.messagesFailed++;
    this.metrics.lastProcessedAt = new Date();

    const err = error instanceof Error ? error : new Error(String(error));
    this.logger.error(`[amqp] message failed: ${err.message}`, {
      correlationId: context.correlationId,
      queue: this.config.queue,
    });

    // Prefer publishing an enriched DLQ message (preserves error + original metadata).
    if (this.deadLetter) {
      try {
        const dlqMessage: DeadLetterMessage = {
          error: { message: err.message, name: err.name, stack: err.stack },
          context: {
            correlationId: context.correlationId,
            timestamp: context.timestamp,
            retryCount: context.retryCount,
            startTime: context.startTime,
            originalMessage: {
              contentBase64: message.content.toString('base64'),
              fields: message.fields,
              properties: message.properties,
            },
          },
        };

        this.channel.publish(
          this.deadLetter.exchange,
          this.deadLetter.routingKey,
          Buffer.from(JSON.stringify(dlqMessage), 'utf8'),
          {
            contentType: 'application/json',
            correlationId: context.correlationId,
            headers: {
              'x-original-queue': this.config.queue,
              'x-original-exchange': this.config.exchange,
              'x-original-routing-key': message.fields.routingKey,
              'x-dead-lettered-by': this.serviceName,
            },
          },
        );

        this.channel.ack(message);
        this.standardMetrics?.messagesTotal.inc(
          { service: this.serviceName, queue: this.config.queue, status: 'dlq' },
          1,
        );
        this.standardMetrics?.processingDurationMs.observe(
          { service: this.serviceName, queue: this.config.queue, status: 'dlq' },
          Date.now() - context.startTime,
        );
        return;
      } catch (publishError) {
        this.logger.error(
          `[amqp] failed to publish to DLQ; falling back to nack: ${(publishError as Error).message}`,
          { correlationId: context.correlationId },
        );
      }
    }

    // Fallback: nack without requeue, allowing broker-level DLX routing if configured.
    this.channel.nack(message, false, false);
    this.standardMetrics?.messagesTotal.inc(
      { service: this.serviceName, queue: this.config.queue, status: 'failure' },
      1,
    );
    this.standardMetrics?.processingDurationMs.observe(
      { service: this.serviceName, queue: this.config.queue, status: 'failure' },
      Date.now() - context.startTime,
    );
  }
}
