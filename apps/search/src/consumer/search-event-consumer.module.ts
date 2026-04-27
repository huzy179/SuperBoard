import { Module } from '@nestjs/common';
import { SearchEventConsumerService } from './search-event-consumer.service';
import { AmqpEventConsumerService } from '../amqp/amqp-event-consumer.service';

@Module({
  providers: [SearchEventConsumerService, AmqpEventConsumerService],
})
export class SearchEventConsumerModule {}
