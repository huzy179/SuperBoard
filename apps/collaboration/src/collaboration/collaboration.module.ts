import { Module } from '@nestjs/common';
import { RedisPoolManager, DatabasePoolManager } from '@superboard/backend-shared/connections';
import { CollaborationGateway } from './collaboration.gateway';
import { RedisAdapterService } from './redis-adapter.service';
import { AuthService } from './auth.service';
import { PresenceService } from './presence.service';
import { PresenceUpdateHandler, DocSyncHandler } from './event-handlers';

@Module({
  providers: [
    RedisPoolManager,
    DatabasePoolManager,
    CollaborationGateway,
    RedisAdapterService,
    AuthService,
    PresenceService,
    PresenceUpdateHandler,
    DocSyncHandler,
  ],
})
export class CollaborationModule {}
