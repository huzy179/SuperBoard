import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AMQPConnectionManager } from '@superboard/backend-shared/amqp';
import {
  HealthCheckController,
  HealthCheckService,
  RabbitMQHealthIndicator,
} from '@superboard/backend-shared/health';
import { RABBITMQ_EXCHANGES, RABBITMQ_QUEUES, RABBITMQ_DLQ_NAMES } from '@superboard/shared';

@Module({
  controllers: [HealthCheckController],
  providers: [
    AMQPConnectionManager,
    {
      provide: HealthCheckService,
      useFactory: (config: ConfigService, amqp: AMQPConnectionManager) => {
        const health = new HealthCheckService({
          service: 'automation',
          version: config.get<string>('npm_package_version') ?? '0.1.0',
        });

        const rabbitmqUrl = config.get<string>('RABBITMQ_URL') ?? 'amqp://localhost:5672';
        health.registerIndicator(
          new RabbitMQHealthIndicator('rabbitmq', amqp, {
            url: rabbitmqUrl,
            exchange: RABBITMQ_EXCHANGES.DOMAIN_EVENTS,
            queue: RABBITMQ_QUEUES.AUTOMATION,
            routingKeys: ['task.*', 'project.updated'],
            deadLetterExchange: RABBITMQ_EXCHANGES.DEAD_LETTER,
            deadLetterQueue: RABBITMQ_DLQ_NAMES.AUTOMATION,
            reconnectInterval: 1000,
            maxReconnectAttempts: 1,
          }),
        );

        return health;
      },
      inject: [ConfigService, AMQPConnectionManager],
    },
  ],
})
export class HealthModule {}
