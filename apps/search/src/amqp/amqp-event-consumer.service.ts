/**
 * Search Service AMQP Event Consumer
 *
 * Consumes domain events from RabbitMQ to update the search index.
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseAMQPConsumer } from '@superboard/backend-shared/amqp';
import type { MessageProcessingContext } from '@superboard/backend-shared/amqp';
import { MetricsService } from '@superboard/backend-shared/metrics';
import { RABBITMQ_EXCHANGES, RABBITMQ_QUEUES, RABBITMQ_DLQ_NAMES } from '@superboard/shared';
import type { DomainEvent } from '@superboard/shared';
import {
  createSearchEventBus,
  SEARCH_BINDING_KEYS,
  SEARCH_EVENT_TYPES,
} from '../events/search-index.handlers';

@Injectable()
export class AmqpEventConsumerService
  extends BaseAMQPConsumer<DomainEvent>
  implements OnModuleInit, OnModuleDestroy
{
  private readonly eventBus;

  constructor(
    private readonly configService: ConfigService,
    metricsService: MetricsService,
  ) {
    const rabbitmqUrl = configService.get<string>('RABBITMQ_URL') ?? 'amqp://localhost:5672';
    const prefetchCount = parseInt(
      configService.get<string>('RABBITMQ_PREFETCH_COUNT') ?? '10',
      10,
    );

    super({
      serviceName: 'search',
      metricsService,
      config: {
        url: rabbitmqUrl,
        exchange: RABBITMQ_EXCHANGES.DOMAIN_EVENTS,
        queue: RABBITMQ_QUEUES.SEARCH,
        routingKeys: SEARCH_BINDING_KEYS,
        prefetchCount,
        reconnectInterval: 1000,
        maxReconnectAttempts: 10,
        deadLetterExchange: RABBITMQ_EXCHANGES.DEAD_LETTER,
        deadLetterQueue: RABBITMQ_DLQ_NAMES.SEARCH,
      },
      deadLetter: {
        exchange: RABBITMQ_EXCHANGES.DEAD_LETTER,
        queue: RABBITMQ_DLQ_NAMES.SEARCH,
        routingKey: RABBITMQ_QUEUES.SEARCH,
        ttl: 604800000, // 7 days
      },
      shouldProcess: (event) => SEARCH_EVENT_TYPES.has(event.eventType),
      parseMessage: (msg) => JSON.parse(msg.content.toString('utf8')) as DomainEvent,
    });

    this.eventBus = createSearchEventBus(metricsService);
  }

  async onModuleInit(): Promise<void> {
    void this.configService.get<string>('RABBITMQ_URL');
    await this.start();
    this.logger.log(`[amqp-consumer] started (queue=${RABBITMQ_QUEUES.SEARCH})`);
  }

  async onModuleDestroy(): Promise<void> {
    await this.stop();
  }

  protected async processMessage(
    event: DomainEvent,
    context: MessageProcessingContext,
  ): Promise<void> {
    this.logger.log(
      `[amqp-consumer] received '${event.eventType}' (correlationId=${context.correlationId})`,
    );
    await this.eventBus.publish(event);
  }
}
