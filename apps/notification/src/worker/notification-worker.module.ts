import { Module } from '@nestjs/common';
import { NotificationWorkerService } from './notification-worker.service';
import { EventConsumerService } from './event-consumer.service';
import { AmqpEventConsumerService } from './amqp-event-consumer.service';
import { MetricsModule } from '../metrics/metrics.module';

@Module({
  imports: [MetricsModule],
  providers: [NotificationWorkerService, EventConsumerService, AmqpEventConsumerService],
})
export class NotificationWorkerModule {}
