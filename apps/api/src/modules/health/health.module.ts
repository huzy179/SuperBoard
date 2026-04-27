import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HealthCheckService } from '@superboard/backend-shared/health';
import { PrismaService } from '../../prisma/prisma.service';
import { HealthCheckController } from './health.controller';
import { RedisService } from '../../common/redis.service';
import { QueueService } from '../../common/queue.service';
import { RabbitMQEventBusService } from '../../common/event-bus/rabbitmq-event-bus.service';
import { EventBusModule } from '../../common/event-bus/event-bus.module';
import { PrismaHealthIndicator } from './indicators/prisma-health.indicator';
import { ApiRedisHealthIndicator } from './indicators/redis-health.indicator';
import { QueueHealthIndicator } from './indicators/queue-health.indicator';
import { ApiRabbitMQHealthIndicator } from './indicators/rabbitmq-health.indicator';

@Module({
  imports: [EventBusModule],
  controllers: [HealthCheckController],
  providers: [
    {
      provide: HealthCheckService,
      useFactory: (
        configService: ConfigService,
        prisma: PrismaService,
        redis: RedisService,
        queue: QueueService,
        rabbitmq: RabbitMQEventBusService,
      ) => {
        const health = new HealthCheckService({
          service: 'core-api',
          version: configService.get<string>('npm_package_version') ?? '0.1.0',
        });

        health.registerIndicator(new PrismaHealthIndicator('postgres', prisma));
        health.registerIndicator(new ApiRedisHealthIndicator('redis', redis));
        health.registerIndicator(new QueueHealthIndicator('bullmq', queue));
        health.registerIndicator(
          new ApiRabbitMQHealthIndicator('rabbitmq', configService, rabbitmq),
        );

        return health;
      },
      inject: [ConfigService, PrismaService, RedisService, QueueService, RabbitMQEventBusService],
    },
  ],
})
export class HealthModule {}
