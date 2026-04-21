import { Module } from '@nestjs/common';
import { ProjectEventsGateway } from './project-events.gateway';

@Module({
  providers: [ProjectEventsGateway],
  exports: [ProjectEventsGateway],
})
export class ProjectEventsModule {}
