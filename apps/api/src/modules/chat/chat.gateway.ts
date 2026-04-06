import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { logger } from '../../common/logger';
import { Message } from '@superboard/shared';

const toChannelRoom = (channelId: string) => `channel:${channelId}`;

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket) {
    logger.info({ clientId: client.id }, 'Client connected to chat namespace');
  }

  handleDisconnect(client: Socket) {
    logger.info({ clientId: client.id }, 'Client disconnected from chat namespace');
  }

  @SubscribeMessage('channel:join')
  handleChannelJoin(client: Socket, payload: { channelId: string }) {
    if (!payload.channelId) return;
    void client.join(toChannelRoom(payload.channelId));
    logger.info({ clientId: client.id, channelId: payload.channelId }, 'User joined channel room');
  }

  @SubscribeMessage('channel:leave')
  handleChannelLeave(client: Socket, payload: { channelId: string }) {
    if (!payload.channelId) return;
    void client.leave(toChannelRoom(payload.channelId));
    logger.info({ clientId: client.id, channelId: payload.channelId }, 'User left channel room');
  }

  @SubscribeMessage('chat:typing')
  handleTyping(client: Socket, payload: { channelId: string; userId: string; isTyping: boolean }) {
    if (!payload.channelId) return;
    client.to(toChannelRoom(payload.channelId)).emit('chat:typing', {
      channelId: payload.channelId,
      userId: payload.userId,
      isTyping: payload.isTyping,
    });
  }

  emitMessageSent(message: Message) {
    this.server.to(toChannelRoom(message.channelId)).emit('message:sent', {
      ...message,
      at: Date.now(),
    });
  }
}
