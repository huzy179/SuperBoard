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

  handleConnection(client: Socket) {
    const projectId =
      typeof client.handshake.query.projectId === 'string' ? client.handshake.query.projectId : '';

    if (projectId) {
      client.join(toProjectRoom(projectId));
    }
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

    client.join(toProjectRoom(projectId));
  }

  emitProjectUpdated(projectId: string) {
    this.server.to(toProjectRoom(projectId)).emit('project:updated', {
      projectId,
      at: Date.now(),
    });
  }
}
