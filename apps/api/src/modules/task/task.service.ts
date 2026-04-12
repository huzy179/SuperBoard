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

  async getTaskIntelligence(taskId: string, workspaceId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: { select: { workspaceId: true } },
        embedding: true,
      },
    });

    if (!task) throw new BadRequestException('Task not found');
    if (task.project.workspaceId !== workspaceId) throw new BadRequestException('Access denied');

    const [suggestions, duplicates] = await Promise.all([
      this.getMetadataSuggestions(task),
      task.embedding ? this.findSimilarTasks(task.id, workspaceId) : Promise.resolve([]),
    ]);

    return {
      suggestions,
      duplicates,
    };
  }

  private async getMetadataSuggestions(task: {
    title: string;
    description: string | null;
    project: { workspaceId: string };
  }) {
    const workspaceId = task.project.workspaceId;
    const existingLabels = await this.prisma.label.findMany({
      where: { workspaceId },
      select: { id: true, name: true },
    });

    const [suggestedLabels, suggestedPriority] = await Promise.all([
      this.aiService.suggestLabels(task.title, task.description || '', existingLabels),
      this.aiService.suggestPriority(task.title, task.description || ''),
    ]);

    return {
      labels: suggestedLabels,
      priority: suggestedPriority,
    };
  }

  private async findSimilarTasks(taskId: string, workspaceId: string) {
    const taskWithEmbed = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { embedding: true },
    });

    if (!taskWithEmbed?.embedding) return [];

    const embedding = taskWithEmbed.embedding as { vector: number[] };
    const vectorStr = `[${embedding.vector.join(',')}]`;

    const similar = await this.prisma.$queryRaw<{ id: string; title: string; score: number }[]>`
      SELECT t.id, t.title, (1 - (te.vector <=> ${vectorStr}::vector)) as score
      FROM "Task" t
      JOIN "TaskEmbedding" te ON t.id = te."taskId"
      JOIN "Project" p ON t."projectId" = p.id
      WHERE p."workspaceId" = ${workspaceId}
        AND t.id != ${taskId}
        AND t."deletedAt" IS NULL
      ORDER BY te.vector <=> ${vectorStr}::vector
      LIMIT 3;
    `;

    return similar.filter((s) => s.score > 0.85); // Only high similarity duplicates
  }
}
