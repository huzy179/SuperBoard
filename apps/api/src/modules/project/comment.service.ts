import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { logger } from '../../common/logger';
import { verifyProjectAndTaskInWorkspace } from '../../common/project-scope.helper';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import type { CommentItemDTO } from '@superboard/shared';
import { ProjectGateway } from './project.gateway';
import { MentionService } from './mention.service';

@Injectable()
export class CommentService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
    private projectGateway: ProjectGateway,
    private mentionService: MentionService,
  ) {}

  async getCommentsByTask(input: {
    projectId: string;
    taskId: string;
    workspaceId: string;
    cursor?: string;
    limit?: number;
  }): Promise<CommentItemDTO[]> {
    await verifyProjectAndTaskInWorkspace(this.prisma, input);

    const limit = input.limit ?? 50;

    const comments = await this.prisma.comment.findMany({
      where: {
        taskId: input.taskId,
      } as Prisma.CommentWhereInput,
      include: {
        author: {
          select: { fullName: true },
        },
      },
      orderBy: { createdAt: 'desc' }, // Latest first usually better for pagination
      take: limit + 1,
      ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
    });

    return comments.map((c) => this.toCommentItemDTO(c));
  }

  async createComment(input: {
    projectId: string;
    taskId: string;
    workspaceId: string;
    authorId: string;
    content: string;
  }): Promise<CommentItemDTO> {
    const trimmed = input.content.trim();
    if (!trimmed) {
      throw new BadRequestException('Comment content is required');
    }

    await verifyProjectAndTaskInWorkspace(this.prisma, input);

    // Ensure author has a username for others to mention them
    void this.mentionService.ensureUsername(input.authorId).catch(() => {});

    const comment = await this.prisma.comment.create({
      data: {
        taskId: input.taskId,
        authorId: input.authorId,
        content: trimmed,
      },
      include: {
        author: {
          select: { fullName: true },
        },
      },
    });

    await this.prisma.taskEvent.create({
      data: {
        taskId: input.taskId,
        actorId: input.authorId,
        type: 'comment_added',
        payload: {
          commentId: comment.id,
        },
      },
    });

    // Notify task assignee about new comment (if different from author)
    const task = await this.prisma.task.findFirst({
      where: { id: input.taskId },
      select: {
        assigneeId: true,
        title: true,
        project: { select: { id: true, workspaceId: true } },
      },
    });

    // Process Mentions
    const usernames = this.mentionService.extractMentions(trimmed);
    const mentionedUsers = await this.mentionService.resolveMentions(usernames, input.workspaceId);
    const author = comment.author;

    for (const mentionedUser of mentionedUsers) {
      // Avoid notifying yourself if you mention your own username
      if (mentionedUser.id === input.authorId) continue;

      void this.notificationService
        .createNotification({
          userId: mentionedUser.id,
          workspaceId: input.workspaceId,
          type: 'comment_mention',
          payload: {
            taskId: input.taskId,
            projectId: input.projectId,
            taskTitle: task?.title || 'Unknown Task',
            authorName: author.fullName || 'Ai đó',
            commentPreview: trimmed.length > 50 ? `${trimmed.substring(0, 50)}...` : trimmed,
          },
        })
        .catch((err: unknown) => logger.error({ err }, 'Mention notification failed'));
    }

    const mentionedUserIds = new Set(mentionedUsers.map((u) => u.id));

    // Notify task assignee about new comment (if different from author AND not already mentioned)
    if (
      task?.assigneeId &&
      task.assigneeId !== input.authorId &&
      !mentionedUserIds.has(task.assigneeId)
    ) {
      void this.notificationService
        .createNotification({
          userId: task.assigneeId,
          workspaceId: task.project.workspaceId,
          type: 'comment_added',
          payload: {
            taskId: input.taskId,
            projectId: input.projectId, // Added projectId for better linking
            taskTitle: task.title,
            message: `Bình luận mới trên task: ${task.title}`,
          },
        })
        .catch((err: unknown) => logger.error({ err }, 'Notification failed'));
    }

    logger.info(
      { commentId: comment.id, taskId: input.taskId, authorId: input.authorId },
      'Comment created',
    );

    const dto = this.toCommentItemDTO(comment);
    this.projectGateway.emitCommentAdded({
      projectId: input.projectId,
      taskId: input.taskId,
      commentId: dto.id,
      authorName: dto.authorName,
      content: dto.content,
      createdAt: dto.createdAt,
    });

    return dto;
  }

  async updateComment(input: {
    projectId: string;
    taskId: string;
    commentId: string;
    workspaceId: string;
    currentUserId: string;
    content: string;
  }): Promise<CommentItemDTO> {
    const trimmed = input.content.trim();
    if (!trimmed) {
      throw new BadRequestException('Comment content is required');
    }

    await verifyProjectAndTaskInWorkspace(this.prisma, input);

    const comment = await this.prisma.comment.findFirst({
      where: {
        id: input.commentId,
        taskId: input.taskId,
      } as Prisma.CommentWhereInput,
      select: { id: true, authorId: true },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.authorId !== input.currentUserId) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    const updated = await this.prisma.comment.update({
      where: { id: input.commentId },
      data: { content: trimmed },
      include: {
        author: {
          select: { fullName: true },
        },
      },
    });

    await this.prisma.taskEvent.create({
      data: {
        taskId: input.taskId,
        actorId: input.currentUserId,
        type: 'updated',
        payload: {
          action: 'comment_updated',
          commentId: updated.id,
        },
      },
    });

    logger.info(
      { commentId: updated.id, taskId: input.taskId, currentUserId: input.currentUserId },
      'Comment updated',
    );

    const dto = this.toCommentItemDTO(updated);
    this.projectGateway.emitCommentUpdated({
      projectId: input.projectId,
      taskId: input.taskId,
      commentId: dto.id,
      content: dto.content,
      updatedAt: dto.updatedAt,
    });

    return dto;
  }

  async deleteComment(input: {
    projectId: string;
    taskId: string;
    commentId: string;
    workspaceId: string;
    currentUserId: string;
  }): Promise<{ deleted: boolean }> {
    await verifyProjectAndTaskInWorkspace(this.prisma, input);

    const comment = await this.prisma.comment.findFirst({
      where: {
        id: input.commentId,
        taskId: input.taskId,
      } as Prisma.CommentWhereInput,
      select: { id: true, authorId: true },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.authorId !== input.currentUserId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.prisma.comment.update({
      where: { id: input.commentId },
      data: { deletedAt: new Date() },
    });

    await this.prisma.taskEvent.create({
      data: {
        taskId: input.taskId,
        actorId: input.currentUserId,
        type: 'updated',
        payload: {
          action: 'comment_deleted',
          commentId: input.commentId,
        },
      },
    });

    logger.info(
      { commentId: input.commentId, taskId: input.taskId, currentUserId: input.currentUserId },
      'Comment deleted',
    );

    this.projectGateway.emitCommentDeleted({
      projectId: input.projectId,
      taskId: input.taskId,
      commentId: input.commentId,
    });

    return { deleted: true };
  }

  private toCommentItemDTO(comment: {
    id: string;
    taskId: string;
    authorId: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
    author: { fullName: string | null };
  }): CommentItemDTO {
    return {
      id: comment.id,
      taskId: comment.taskId,
      authorId: comment.authorId,
      authorName: comment.author.fullName ?? 'Unknown',
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
    };
  }
}
