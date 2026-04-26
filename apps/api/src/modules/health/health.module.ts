import { Module } from '@nestjs/common';
import { HealthCheckController } from './health.controller';
import { HealthService } from './health.service';
import { RabbitMQHealthIndicator } from './rabbitmq.health';
import { EventBusModule } from '../../common/event-bus/event-bus.module';

@Module({
  imports: [EventBusModule],
  controllers: [HealthCheckController],
  providers: [HealthService, RabbitMQHealthIndicator],
})
export class HealthModule {}
