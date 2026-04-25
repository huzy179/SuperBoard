// WebSocket gateway disabled — collaboration moved to apps/collaboration/
import { Injectable, Logger } from '@nestjs/common';
import type { Message } from '@superboard/shared';

@Injectable()
export class ChatGateway {
  private logger = new Logger('ChatGateway');

  broadcastMessage(channelId: string, message: Message) {
    this.logger.warn(
      `ChatGateway.broadcastMessage: WebSocket disabled, skipping emit for channel ${channelId}. Message ID: ${message.id}`,
    );
  }

  broadcastUpdate(channelId: string, message: Message) {
    this.logger.warn(
      `ChatGateway.broadcastUpdate: WebSocket disabled, skipping emit for channel ${channelId}. Message ID: ${message.id}`,
    );
  }

  broadcastDelete(channelId: string, messageId: string) {
    this.logger.warn(
      `ChatGateway.broadcastDelete: WebSocket disabled, skipping emit for channel ${channelId}. Message ID: ${messageId}`,
    );
  }

  broadcastReaction(channelId: string, data: { messageId: string; userId: string; emoji: string }) {
    this.logger.warn(
      `ChatGateway.broadcastReaction: WebSocket disabled, skipping emit for channel ${channelId}. Message ID: ${data.messageId}`,
    );
  }
}
