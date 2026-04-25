import { Module } from '@nestjs/common';
import { AutomationEventConsumerService } from './automation-event-consumer.service';

@Module({
  providers: [AutomationEventConsumerService],
})
export class AutomationEventConsumerModule {}
