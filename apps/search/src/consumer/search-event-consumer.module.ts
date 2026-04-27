import { Module } from '@nestjs/common';
import { SearchEventConsumerService } from './search-event-consumer.service';
import { AmqpEventConsumerService } from '../amqp/amqp-event-consumer.service';
import { MetricsModule } from '../metrics/metrics.module';

@Module({
  imports: [MetricsModule],
  providers: [SearchEventConsumerService, AmqpEventConsumerService],
})
export class SearchEventConsumerModule {}
