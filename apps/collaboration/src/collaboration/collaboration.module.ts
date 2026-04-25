import { Module } from '@nestjs/common';
import { CollaborationGateway } from './collaboration.gateway';
import { RedisAdapterService } from './redis-adapter.service';
import { AuthService } from './auth.service';
import { PresenceService } from './presence.service';

@Module({
  providers: [CollaborationGateway, RedisAdapterService, AuthService, PresenceService],
})
export class CollaborationModule {}
