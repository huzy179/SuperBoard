import {
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { logger } from '../../common/logger';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'notifications',
})
export class NotificationGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      void client.join(`user:${userId}`);
      logger.info({ clientId: client.id, userId }, 'Client connected to notifications');
    }
  }

  @SubscribeMessage('join:user')
  handleJoinUser(client: Socket, userId: string) {
    if (userId) {
      void client.join(`user:${userId}`);
    }
  }

  emitNotification(userId: string, notification: unknown) {
    this.server.to(`user:${userId}`).emit('notification:received', notification);
  }
}
