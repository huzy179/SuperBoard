import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';

function toProjectRoom(projectId: string): string {
  return `project:${projectId}`;
}

@WebSocketGateway({
  namespace: '/projects',
  cors: {
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  },
})
export class ProjectGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  private readonly clientProjectRoom = new Map<string, string>();

  handleConnection(client: Socket) {
    const projectId =
      typeof client.handshake.query.projectId === 'string' ? client.handshake.query.projectId : '';

    if (projectId) {
      const room = toProjectRoom(projectId);
      client.join(room);
      this.clientProjectRoom.set(client.id, room);
      this.emitProjectPresence(projectId);
    }
  }

  handleDisconnect(client: Socket) {
    const previousRoom = this.clientProjectRoom.get(client.id);
    this.clientProjectRoom.delete(client.id);

    if (!previousRoom) {
      return;
    }

    const projectId = previousRoom.replace('project:', '');
    this.emitProjectPresence(projectId);
  }

  @SubscribeMessage('project:join')
  handleJoinProject(
    @MessageBody() payload: { projectId?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const projectId = payload.projectId?.trim();
    if (!projectId) {
      return;
    }

    const nextRoom = toProjectRoom(projectId);
    const previousRoom = this.clientProjectRoom.get(client.id);

    if (previousRoom && previousRoom !== nextRoom) {
      client.leave(previousRoom);
      const previousProjectId = previousRoom.replace('project:', '');
      this.emitProjectPresence(previousProjectId);
    }

    client.join(nextRoom);
    this.clientProjectRoom.set(client.id, nextRoom);
    this.emitProjectPresence(projectId);
  }

  emitProjectUpdated(projectId: string) {
    this.server.to(toProjectRoom(projectId)).emit('project:updated', {
      projectId,
      at: Date.now(),
    });
  }

  private emitProjectPresence(projectId: string) {
    const room = this.server.sockets.adapter.rooms.get(toProjectRoom(projectId));
    const viewerCount = room?.size ?? 0;

    this.server.to(toProjectRoom(projectId)).emit('project:presence', {
      projectId,
      viewerCount,
      at: Date.now(),
    });
  }
}
