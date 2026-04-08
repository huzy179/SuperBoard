import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import type { Message } from '@superboard/shared';

@WebSocketGateway({
  namespace: 'chat',
  cors: { origin: '*' },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private logger = new Logger('ChatGateway');

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join:channel')
  handleJoinChannel(@ConnectedSocket() client: Socket, @MessageBody() channelId: string) {
    client.join(channelId);
    this.logger.log(`Client ${client.id} joined channel ${channelId}`);
  }

  @SubscribeMessage('leave:channel')
  handleLeaveChannel(@ConnectedSocket() client: Socket, @MessageBody() channelId: string) {
    client.leave(channelId);
    this.logger.log(`Client ${client.id} left channel ${channelId}`);
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { channelId: string; userId: string; fullName: string },
  ) {
    client.to(data.channelId).emit('user:typing', {
      userId: data.userId,
      fullName: data.fullName,
    });
  }

  broadcastMessage(channelId: string, message: Message) {
    this.server.to(channelId).emit('message:new', message);
  }

  broadcastUpdate(channelId: string, message: Message) {
    this.server.to(channelId).emit('message:updated', message);
  }

  broadcastDelete(channelId: string, messageId: string) {
    this.server.to(channelId).emit('message:deleted', { messageId });
  }

  broadcastReaction(channelId: string, data: { messageId: string; userId: string; emoji: string }) {
    this.server.to(channelId).emit('message:reaction', data);
  }
}
