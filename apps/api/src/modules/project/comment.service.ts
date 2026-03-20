import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { CommentItemDTO } from '@superboard/shared';

@Injectable()
export class CommentService {
  constructor(private prisma: PrismaService) {}

  async getCommentsByTask(input: {
    projectId: string;
    taskId: string;
    workspaceId: string;
  }): Promise<CommentItemDTO[]> {
    await this.verifyProjectAndTask(input);

    const comments = await this.prisma.comment.findMany({
      where: {
        taskId: input.taskId,
        deletedAt: null,
      } as Prisma.CommentWhereInput,
      include: {
        author: {
          select: { fullName: true },
        },
      },
      orderBy: { createdAt: 'asc' },
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

    await this.verifyProjectAndTask(input);
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

    return this.toCommentItemDTO(comment);
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

    await this.verifyProjectAndTask(input);

    const comment = await this.prisma.comment.findFirst({
      where: {
        id: input.commentId,
        taskId: input.taskId,
        deletedAt: null,
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

    return this.toCommentItemDTO(updated);
  }
  async deleteComment(input: {
    projectId: string;
    taskId: string;
    commentId: string;
    workspaceId: string;
    currentUserId: string;
  }): Promise<{ deleted: boolean }> {
    await this.verifyProjectAndTask(input);

    const comment = await this.prisma.comment.findFirst({
      where: {
        id: input.commentId,
        taskId: input.taskId,
        deletedAt: null,
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

    return { deleted: true };
  }

  private async verifyProjectAndTask(input: {
    projectId: string;
    taskId: string;
    workspaceId: string;
  }): Promise<void> {
    const project = await this.prisma.project.findFirst({
      where: {
        id: input.projectId,
        workspaceId: input.workspaceId,
        deletedAt: null,
      } as Prisma.ProjectWhereInput,
      select: { id: true },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const task = await this.prisma.task.findFirst({
      where: {
        id: input.taskId,
        projectId: input.projectId,
        deletedAt: null,
      } as Prisma.TaskWhereInput,
      select: { id: true },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }
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
