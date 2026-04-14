import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { logger } from '../../common/logger';

const toProjectRoom = (projectId: string) => `project:${projectId}`;
const toTaskRoom = (projectId: string, taskId: string) => `project:${projectId}:task:${taskId}`;

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'projects',
})
export class ProjectGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket) {
    const projectId = client.handshake.query.projectId as string;
    if (projectId) {
      void client.join(toProjectRoom(projectId));
      this.emitProjectPresence(projectId);
      logger.info({ clientId: client.id, projectId }, 'Client connected to project');
    }
  }

  handleDisconnect(client: Socket) {
    const projectId = client.handshake.query.projectId as string;
    if (projectId) {
      this.emitProjectPresence(projectId);
      logger.info({ clientId: client.id, projectId }, 'Client disconnected from project');
    }
  }

  @SubscribeMessage('project:join')
  handleProjectJoin(client: Socket, payload: { projectId: string }) {
    if (!payload.projectId) return;
    void client.join(toProjectRoom(payload.projectId));
    this.emitProjectPresence(payload.projectId);
  }

  @SubscribeMessage('project:leave')
  handleProjectLeave(client: Socket, payload: { projectId: string }) {
    if (!payload.projectId) return;
    void client.leave(toProjectRoom(payload.projectId));
    this.emitProjectPresence(payload.projectId);
  }

  @SubscribeMessage('task:join')
  handleTaskJoin(client: Socket, payload: { projectId: string; taskId: string }) {
    if (!payload.projectId || !payload.taskId) return;
    void client.join(toTaskRoom(payload.projectId, payload.taskId));
    this.emitTaskPresence(payload.projectId, payload.taskId);
  }

  @SubscribeMessage('task:leave')
  handleTaskLeave(client: Socket, payload: { projectId: string; taskId: string }) {
    if (!payload.projectId || !payload.taskId) return;
    void client.leave(toTaskRoom(payload.projectId, payload.taskId));
    this.emitTaskPresence(payload.projectId, payload.taskId);
  }

  emitProjectUpdated(projectId: string) {
    this.server.to(toProjectRoom(projectId)).emit('project:updated', {
      projectId,
      at: Date.now(),
    });
  }

  emitProjectTaskPatched(payload: {
    projectId: string;
    taskId: string;
    status: string;
    position?: string | null;
    updatedAt: string;
  }) {
    this.server.to(toProjectRoom(payload.projectId)).emit('project:task-patched', {
      projectId: payload.projectId,
      taskId: payload.taskId,
      status: payload.status,
      position: payload.position ?? null,
      updatedAt: payload.updatedAt,
      at: Date.now(),
    });
  }

  emitTaskUpdated(payload: {
    projectId: string;
    taskId: string;
    aiContext?: string | null;
    updatedAt: string;
  }) {
    this.server.to(toProjectRoom(payload.projectId)).emit('task:updated', {
      projectId: payload.projectId,
      taskId: payload.taskId,
      aiContext: payload.aiContext || null,
      aiMetadata: payload.aiContext ? { processedAt: new Date().toISOString() } : null,
      updatedAt: payload.updatedAt,
      at: Date.now(),
    });
  }

  emitCommentAdded(payload: {
    projectId: string;
    taskId: string;
    commentId: string;
    authorName: string;
    content: string;
    createdAt: string;
  }) {
    this.server.to(toTaskRoom(payload.projectId, payload.taskId)).emit('comment:added', {
      ...payload,
      at: Date.now(),
    });
  }

  emitCommentUpdated(payload: {
    projectId: string;
    taskId: string;
    commentId: string;
    content: string;
    updatedAt: string;
  }) {
    this.server.to(toTaskRoom(payload.projectId, payload.taskId)).emit('comment:updated', {
      ...payload,
      at: Date.now(),
    });
  }

  emitCommentDeleted(payload: { projectId: string; taskId: string; commentId: string }) {
    this.server.to(toTaskRoom(payload.projectId, payload.taskId)).emit('comment:deleted', {
      ...payload,
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

  private emitTaskPresence(projectId: string, taskId: string) {
    const room = this.server.sockets.adapter.rooms.get(toTaskRoom(projectId, taskId));
    const viewerCount = room?.size ?? 0;

    this.server.to(toTaskRoom(projectId, taskId)).emit('task:presence', {
      projectId,
      taskId,
      viewerCount,
      at: Date.now(),
    });
  }
}
