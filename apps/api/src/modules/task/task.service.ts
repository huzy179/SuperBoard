import { BadRequestException, Injectable } from '@nestjs/common';
import {
  findTaskWithProjectInWorkspaceOrThrow,
  verifyActiveTaskInWorkspace,
} from '../../common/project-scope.helper';
import { AiService } from '../ai/ai.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TaskService {
  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
  ) {}

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
      where: { id: taskId },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        projectId: true,
      },
    });
  }

  async generateAiSubtasks(taskId: string) {
    const task = await this.getTaskById(taskId);
    if (!task) throw new BadRequestException('Task not found');

    const subtasks = await this.aiService.smartDecompose(task.title, task.description || '');

    // Note: We don't save them automatically here, we just return for preview/approval in UI
    // Alternatively, we could create them in a transaction.
    // For "Elite" UX, let's return them so the user can see them "revealed".
    return subtasks;
  }

  async refineTaskMetadata(taskId: string) {
    const task = await this.getTaskById(taskId);
    if (!task) throw new BadRequestException('Task not found');

    const [refinedDescription, predictedPoints] = await Promise.all([
      this.aiService.processText(task.description || '', 'improve'),
      this.aiService.predictStoryPoints(task.title, task.description || ''),
    ]);

    return {
      description: refinedDescription,
      storyPoints: predictedPoints,
    };
  }
}
