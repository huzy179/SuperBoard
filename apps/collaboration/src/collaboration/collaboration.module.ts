import { Module } from '@nestjs/common';
import { RedisPoolManager } from '@superboard/backend-shared/connections';
import { CollaborationGateway } from './collaboration.gateway';
import { RedisAdapterService } from './redis-adapter.service';
import { AuthService } from './auth.service';
import { PresenceService } from './presence.service';

@Module({
  providers: [
    RedisPoolManager,
    CollaborationGateway,
    RedisAdapterService,
    AuthService,
    PresenceService,
  ],
})
export class CollaborationModule {}
