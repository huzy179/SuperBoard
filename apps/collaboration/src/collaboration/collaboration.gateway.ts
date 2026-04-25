import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { RedisAdapterService } from './redis-adapter.service';
import { AuthService } from './auth.service';
import { PresenceService } from './presence.service';

interface JoinChannelPayload {
  channelType: 'project' | 'doc' | 'chat';
  channelId: string;
}

interface TypingPayload {
  channelType: 'project' | 'doc' | 'chat';
  channelId: string;
  userId: string;
  isTyping: boolean;
}

interface PresencePayload {
  channelType: 'project' | 'doc' | 'chat';
  channelId: string;
  userId: string;
  status: 'online' | 'offline' | 'away';
}

interface DocSyncPayload {
  docId: string;
  operation: unknown;
  userId: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  },
})
export class CollaborationGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  constructor(
    private redisAdapter: RedisAdapterService,
    private authService: AuthService,
    private presenceService: PresenceService,
  ) {}

  afterInit(server: Server) {
    server.adapter(createAdapter(this.redisAdapter.pubClient, this.redisAdapter.subClient));
    console.log('CollaborationGateway initialized with Redis adapter');
  }

  async handleConnection(client: Socket) {
    const token = client.handshake.auth.token as string;
    if (!token) {
      console.log(`Client ${client.id} rejected: no token`);
      client.disconnect();
      return;
    }

    const authResult = await this.authService.verifyToken(token);
    if (!authResult) {
      console.log(`Client ${client.id} rejected: invalid token`);
      client.disconnect();
      return;
    }

    client.data.userId = authResult.userId;
    client.data.workspaceId = authResult.workspaceId;
    console.log(`Client connected: ${client.id}, userId: ${authResult.userId}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  private getChannelRoom(channelType: string, channelId: string): string {
    return `${channelType}:${channelId}`;
  }

  @SubscribeMessage('join:channel')
  async handleJoinChannel(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinChannelPayload,
  ) {
    const room = this.getChannelRoom(payload.channelType, payload.channelId);
    await client.join(room);
    await this.presenceService.setPresence(
      payload.channelType,
      payload.channelId,
      client.data.userId,
      'online',
    );
    client.to(room).emit('presence:update', {
      userId: client.data.userId,
      channelType: payload.channelType,
      channelId: payload.channelId,
      status: 'online',
      timestamp: new Date().toISOString(),
    });
    return { joined: room };
  }

  @SubscribeMessage('leave:channel')
  async handleLeaveChannel(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinChannelPayload,
  ) {
    const room = this.getChannelRoom(payload.channelType, payload.channelId);
    await client.leave(room);
    await this.presenceService.setPresence(
      payload.channelType,
      payload.channelId,
      client.data.userId,
      'offline',
    );
    client.to(room).emit('presence:update', {
      userId: client.data.userId,
      channelType: payload.channelType,
      channelId: payload.channelId,
      status: 'offline',
      timestamp: new Date().toISOString(),
    });
    return { left: room };
  }

  @SubscribeMessage('typing:indicator')
  handleTypingIndicator(@ConnectedSocket() client: Socket, @MessageBody() payload: TypingPayload) {
    const room = this.getChannelRoom(payload.channelType, payload.channelId);
    client.to(room).emit('typing:indicator', {
      userId: payload.userId,
      channelType: payload.channelType,
      channelId: payload.channelId,
      isTyping: payload.isTyping,
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('presence:update')
  handlePresenceUpdate(@ConnectedSocket() client: Socket, @MessageBody() payload: PresencePayload) {
    const room = this.getChannelRoom(payload.channelType, payload.channelId);
    this.server.to(room).emit('presence:update', {
      userId: payload.userId,
      channelType: payload.channelType,
      channelId: payload.channelId,
      status: payload.status,
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('doc:sync')
  handleDocSync(@ConnectedSocket() client: Socket, @MessageBody() payload: DocSyncPayload) {
    const room = this.getChannelRoom('doc', payload.docId);
    client.to(room).emit('doc:sync', {
      docId: payload.docId,
      operation: payload.operation,
      userId: payload.userId,
      timestamp: new Date().toISOString(),
    });
  }
}
