import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TaskService {
  constructor(private prisma: PrismaService) {}

  async archiveTaskForWorkspace(input: {
    taskId: string;
    workspaceId: string;
    archivedAt?: Date;
  }): Promise<void> {
    const task = await this.prisma.task.findFirst({
      where: {
        id: input.taskId,
        isArchived: false,
        deletedAt: null,
        project: {
          workspaceId: input.workspaceId,
          deletedAt: null,
          isArchived: false,
          workspace: {
            deletedAt: null,
            isArchived: false,
          },
        },
      } as Prisma.TaskWhereInput,
      select: {
        id: true,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.prisma.task.update({
      where: {
        id: input.taskId,
      },
      data: {
        isArchived: true,
        deletedAt: input.archivedAt ?? new Date(),
      },
    });
  }

  async restoreTaskForWorkspace(input: {
    taskId: string;
    workspaceId: string;
    restoredAt?: Date;
  }): Promise<void> {
    const task = await this.prisma.task.findFirst({
      where: {
        id: input.taskId,
        project: {
          workspaceId: input.workspaceId,
        },
      } as Prisma.TaskWhereInput,
      select: {
        id: true,
        project: {
          select: {
            id: true,
            isArchived: true,
            deletedAt: true,
            workspace: {
              select: {
                id: true,
                isArchived: true,
                deletedAt: true,
              },
            },
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (task.project.workspace.isArchived || task.project.workspace.deletedAt) {
      throw new BadRequestException(
        'Cannot restore task because parent workspace is archived. Please restore workspace first.',
      );
    }

    if (task.project.isArchived || task.project.deletedAt) {
      throw new BadRequestException(
        'Cannot restore task because parent project is archived. Please restore project first.',
      );
    }

    await this.prisma.task.update({
      where: {
        id: input.taskId,
      },
      data: {
        isArchived: false,
        deletedAt: null,
      },
    });

    void input.restoredAt;
  }
}
