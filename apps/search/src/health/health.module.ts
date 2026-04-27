import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AMQPConnectionManager } from '@superboard/backend-shared/amqp';
import { RedisPoolManager } from '@superboard/backend-shared/connections';
import {
  HealthCheckController,
  HealthCheckService,
  RabbitMQHealthIndicator,
  RedisHealthIndicator,
} from '@superboard/backend-shared/health';
import { RABBITMQ_EXCHANGES, RABBITMQ_QUEUES, RABBITMQ_DLQ_NAMES } from '@superboard/shared';

@Module({
  controllers: [HealthCheckController],
  providers: [
    AMQPConnectionManager,
    RedisPoolManager,
    {
      provide: HealthCheckService,
      useFactory: (
        config: ConfigService,
        amqp: AMQPConnectionManager,
        redisPool: RedisPoolManager,
      ) => {
        const health = new HealthCheckService({
          service: 'search',
          version: config.get<string>('npm_package_version') ?? '0.1.0',
        });

        const rabbitmqUrl = config.get<string>('RABBITMQ_URL') ?? 'amqp://localhost:5672';
        health.registerIndicator(
          new RabbitMQHealthIndicator('rabbitmq', amqp, {
            url: rabbitmqUrl,
            exchange: RABBITMQ_EXCHANGES.DOMAIN_EVENTS,
            queue: RABBITMQ_QUEUES.SEARCH,
            routingKeys: ['task.*', 'doc.updated', 'project.updated'],
            deadLetterExchange: RABBITMQ_EXCHANGES.DEAD_LETTER,
            deadLetterQueue: RABBITMQ_DLQ_NAMES.SEARCH,
            reconnectInterval: 1000,
            maxReconnectAttempts: 1,
          }),
        );

        const redisUrl = config.get<string>('REDIS_URL') ?? 'redis://localhost:6379';
        const parsed = new URL(redisUrl);
        const host = parsed.hostname;
        const port = Number(parsed.port || 6379);
        const password = parsed.password || undefined;
        const db =
          parsed.pathname && parsed.pathname !== '/' ? Number(parsed.pathname.slice(1)) : 0;
        health.registerIndicator(
          new RedisHealthIndicator('redis', redisPool, {
            host,
            port,
            password,
            db: Number.isFinite(db) ? db : 0,
            maxRetriesPerRequest: 1,
          }),
        );

        return health;
      },
      inject: [ConfigService, AMQPConnectionManager, RedisPoolManager],
    },
  ],
})
export class HealthModule {}
