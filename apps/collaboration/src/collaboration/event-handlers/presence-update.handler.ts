import { Injectable, Logger } from '@nestjs/common';
import { BaseEventHandler } from '@superboard/backend-shared/events';
import { EventContext } from '@superboard/backend-shared/types';
import { PresenceService } from '../presence.service';

interface PresenceUpdatePayload {
  channelType: string;
  channelId: string;
  userId: string;
  status: 'online' | 'offline' | 'away';
}

@Injectable()
export class PresenceUpdateHandler extends BaseEventHandler<PresenceUpdatePayload> {
  private readonly logger = new Logger(PresenceUpdateHandler.name);

  constructor(private presenceService: PresenceService) {
    super({
      retry: {
        maxAttempts: 3,
        initialDelay: 250,
        maxDelay: 5000,
        backoffMultiplier: 2,
        retryableErrors: ['TimeoutError', 'ConnectionError'],
      },
    });
  }

  getEventType(): string {
    return 'presence.updated';
  }

  async handle(payload: PresenceUpdatePayload, context: EventContext): Promise<void> {
    this.logger.debug(
      `Processing presence update for user ${payload.userId} in ${payload.channelType}:${payload.channelId}`,
      { correlationId: context.correlationId, retryCount: context.retryCount },
    );

    await this.presenceService.setPresence(
      payload.channelType,
      payload.channelId,
      payload.userId,
      payload.status,
    );

    this.logger.debug(`Presence updated successfully for user ${payload.userId}`, {
      correlationId: context.correlationId,
      timestamp: context.timestamp,
    });
  }
}
