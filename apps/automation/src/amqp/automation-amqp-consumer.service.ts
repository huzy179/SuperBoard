import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseAMQPConsumer } from '@superboard/backend-shared/amqp';
import { MetricsService } from '@superboard/backend-shared/metrics';
import type { DomainEvent } from '@superboard/shared';
import { RABBITMQ_EXCHANGES, RABBITMQ_QUEUES, RABBITMQ_DLQ_NAMES } from '@superboard/shared';

const AUTOMATION_EVENT_TYPES = new Set([
  'task.created',
  'task.updated',
  'task.status_changed',
  'project.updated',
]);

const BINDING_KEYS = ['task.*', 'project.updated'];

@Injectable()
export class AutomationAmqpConsumerService
  extends BaseAMQPConsumer<DomainEvent>
  implements OnModuleInit, OnModuleDestroy
{
  constructor(
    private readonly configService: ConfigService,
    metricsService: MetricsService,
  ) {
    const rabbitmqUrl = configService.get<string>('RABBITMQ_URL') ?? 'amqp://localhost:5672';
    const prefetchCount = Number(configService.get<string>('RABBITMQ_PREFETCH_COUNT') ?? '10');

    super({
      serviceName: 'automation',
      metricsService,
      config: {
        url: rabbitmqUrl,
        exchange: RABBITMQ_EXCHANGES.DOMAIN_EVENTS,
        queue: RABBITMQ_QUEUES.AUTOMATION,
        routingKeys: BINDING_KEYS,
        prefetchCount,
        reconnectInterval: 1000,
        maxReconnectAttempts: 10,
        deadLetterExchange: RABBITMQ_EXCHANGES.DEAD_LETTER,
        deadLetterQueue: RABBITMQ_DLQ_NAMES.AUTOMATION,
      },
      deadLetter: {
        exchange: RABBITMQ_EXCHANGES.DEAD_LETTER,
        queue: RABBITMQ_DLQ_NAMES.AUTOMATION,
        routingKey: RABBITMQ_QUEUES.AUTOMATION,
        ttl: 604800000, // 7 days
      },
      shouldProcess: (event) => AUTOMATION_EVENT_TYPES.has(event.eventType),
      parseMessage: (msg) => JSON.parse(msg.content.toString('utf8')) as DomainEvent,
    });
  }

  async onModuleInit(): Promise<void> {
    // Ensure config is read during startup
    void this.configService.get<string>('RABBITMQ_URL');
    await this.start();
  }

  async onModuleDestroy(): Promise<void> {
    await this.stop();
  }

  protected async processMessage(event: DomainEvent): Promise<void> {
    await this.evaluateRules(event);
  }

  protected async evaluateRules(event: DomainEvent): Promise<void> {
    const payload = event.payload as Record<string, unknown>;
    this.logger.log(
      `[amqp-consumer] evaluating automation rules for event '${event.eventType}' (correlationId=${event.correlationId})`,
    );

    switch (event.eventType) {
      case 'task.created':
        this.logger.log(
          `[amqp-consumer] [mock] evaluate rules: task created taskId=${payload.taskId}`,
        );
        break;
      case 'task.updated':
        this.logger.log(
          `[amqp-consumer] [mock] evaluate rules: task updated taskId=${payload.taskId}`,
        );
        break;
      case 'task.status_changed':
        this.logger.log(
          `[amqp-consumer] [mock] evaluate rules: task status changed taskId=${payload.taskId} ${payload.oldStatus} → ${payload.newStatus}`,
        );
        break;
      case 'project.updated':
        this.logger.log(
          `[amqp-consumer] [mock] evaluate rules: project updated projectId=${payload.projectId}`,
        );
        break;
      default:
        this.logger.log(`[amqp-consumer] [mock] evaluate rules for event '${event.eventType}'`);
    }
  }
}
