// WebSocket gateway disabled — collaboration moved to apps/collaboration/
import { Injectable } from '@nestjs/common';
import { logger } from '../../common/logger';

@Injectable()
export class ProjectEventsGateway {
  emitProjectUpdated(projectId: string) {
    logger.warn(
      { projectId },
      'ProjectEventsGateway.emitProjectUpdated: WebSocket disabled, skipping emit',
    );
  }

  emitProjectTaskPatched(payload: {
    projectId: string;
    taskId: string;
    status: string;
    position?: string | null;
    updatedAt: string;
  }) {
    logger.warn(
      { projectId: payload.projectId, taskId: payload.taskId },
      'ProjectEventsGateway.emitProjectTaskPatched: WebSocket disabled, skipping emit',
    );
  }

  emitTaskUpdated(payload: {
    projectId: string;
    taskId: string;
    aiContext?: string | null;
    updatedAt: string;
  }) {
    logger.warn(
      { projectId: payload.projectId, taskId: payload.taskId },
      'ProjectEventsGateway.emitTaskUpdated: WebSocket disabled, skipping emit',
    );
  }

  emitCommentAdded(payload: {
    projectId: string;
    taskId: string;
    commentId: string;
    authorName: string;
    content: string;
    createdAt: string;
  }) {
    logger.warn(
      { projectId: payload.projectId, taskId: payload.taskId, commentId: payload.commentId },
      'ProjectEventsGateway.emitCommentAdded: WebSocket disabled, skipping emit',
    );
  }

  emitCommentUpdated(payload: {
    projectId: string;
    taskId: string;
    commentId: string;
    content: string;
    updatedAt: string;
  }) {
    logger.warn(
      { projectId: payload.projectId, taskId: payload.taskId, commentId: payload.commentId },
      'ProjectEventsGateway.emitCommentUpdated: WebSocket disabled, skipping emit',
    );
  }

  emitCommentDeleted(payload: { projectId: string; taskId: string; commentId: string }) {
    logger.warn(
      { projectId: payload.projectId, taskId: payload.taskId, commentId: payload.commentId },
      'ProjectEventsGateway.emitCommentDeleted: WebSocket disabled, skipping emit',
    );
  }
}
