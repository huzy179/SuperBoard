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
    await this.verifyActiveTaskForWorkspace(input);

    await this.prisma.task.update({
      where: {
        id: input.taskId,
      },
      data: {
        deletedAt: input.archivedAt ?? new Date(),
      },
    });
  }

  async restoreTaskForWorkspace(input: {
    taskId: string;
    workspaceId: string;
    restoredAt?: Date;
  }): Promise<void> {
    const task = await this.findTaskWithProjectForWorkspace(input);

    if (task.project.workspace.deletedAt) {
      throw new BadRequestException(
        'Cannot restore task because parent workspace is archived. Please restore workspace first.',
      );
    }

    if (task.project.deletedAt) {
      throw new BadRequestException(
        'Cannot restore task because parent project is archived. Please restore project first.',
      );
    }

    await this.prisma.task.update({
      where: {
        id: input.taskId,
      },
      data: {
        deletedAt: null,
      },
    });

    void input.restoredAt;
  }

  private async verifyActiveTaskForWorkspace(input: {
    taskId: string;
    workspaceId: string;
  }): Promise<void> {
    const task = await this.prisma.task.findFirst({
      where: {
        id: input.taskId,
        deletedAt: null,
        project: {
          workspaceId: input.workspaceId,
          deletedAt: null,
          workspace: {
            deletedAt: null,
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
  }

  private async findTaskWithProjectForWorkspace(input: {
    taskId: string;
    workspaceId: string;
  }): Promise<{
    project: {
      deletedAt: Date | null;
      workspace: {
        deletedAt: Date | null;
      };
    };
  }> {
    const task = await this.prisma.task.findFirst({
      where: {
        id: input.taskId,
        project: {
          workspaceId: input.workspaceId,
        },
      } as Prisma.TaskWhereInput,
      select: {
        project: {
          select: {
            deletedAt: true,
            workspace: {
              select: {
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

    return task;
  }
}
