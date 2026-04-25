import { Module } from '@nestjs/common';
import { SearchEventConsumerService } from './search-event-consumer.service';

@Module({
  providers: [SearchEventConsumerService],
})
export class SearchEventConsumerModule {}
