import { BadRequestException, Injectable } from '@nestjs/common';
import {
  findTaskWithProjectInWorkspaceOrThrow,
  verifyActiveTaskInWorkspace,
} from '../../common/project-scope.helper';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TaskService {
  constructor(private prisma: PrismaService) {}

  async archiveTaskForWorkspace(input: {
    taskId: string;
    workspaceId: string;
    archivedAt?: Date;
  }): Promise<void> {
    await verifyActiveTaskInWorkspace(this.prisma, input);

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
    const task = await findTaskWithProjectInWorkspaceOrThrow(this.prisma, input);

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

  async getTaskById(taskId: string) {
    return this.prisma.task.findUnique({
      where: { id: taskId, deletedAt: null },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
      },
    });
  }
}
