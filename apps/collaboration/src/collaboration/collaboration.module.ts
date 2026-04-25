import { Module } from '@nestjs/common';
import { CollaborationGateway } from './collaboration.gateway';
import { RedisAdapterService } from './redis-adapter.service';

@Module({
  providers: [CollaborationGateway, RedisAdapterService],
})
export class CollaborationModule {}
