import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  findTaskWithProjectInWorkspaceOrThrow,
  verifyActiveTaskInWorkspace,
  verifyActiveProjectInWorkspace,
  verifyAssigneeInWorkspace,
  verifyProjectAndTaskInWorkspace,
} from '../../common/project-scope.helper';
import { AiService } from '../ai/ai.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { WorkflowService } from '../workflow/workflow.service';
import { RedisService } from '../../common/redis.service';
import { AutomationService } from '../automation/automation.service';
import { Prisma, TaskPriority, TaskType } from '@prisma/client';
import { logger } from '../../common/logger';
import {
  CreateTaskRequestDTO,
  UpdateTaskRequestDTO,
  ProjectTaskItemDTO,
  BulkTaskOperationResultDTO,
  TaskHistoryItemDTO,
} from '@superboard/shared';

@Injectable()
export class TaskService {
  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
    private notificationService: NotificationService,
    private workflowService: WorkflowService,
    private redisService: RedisService,
    private automationService: AutomationService,
  ) {}

  private readonly taskSelect = {
    id: true,
    title: true,
    description: true,
    parentTaskId: true,
    status: true,
    priority: true,
    type: true,
    number: true,
    storyPoints: true,
    position: true,
    dueDate: true,
    assigneeId: true,
    projectId: true,
    assignee: { select: { fullName: true, avatarColor: true } },
    labels: { select: { label: { select: { id: true, name: true, color: true } } } },
    attachments: {
      where: {},
      select: {
        id: true,
        name: true,
        key: true,
        url: true,
        size: true,
        mimeType: true,
        createdAt: true,
      },
    },
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
  } as const;

  private toTaskDTO(task: {
    id: string;
    title: string;
    description: string | null;
    parentTaskId?: string | null;
    status: string;
    priority: string;
    type?: string;
    number?: number | null;
    storyPoints?: number | null;
    position?: string | null;
    dueDate: Date | null;
    assigneeId: string | null;
    assignee: { fullName: string; avatarColor?: string | null } | null;
    labels?: Array<{ label: { id: string; name: string; color: string } }>;
    attachments?: Array<{
      id: string;
      name: string;
      key: string;
      url: string;
      size: bigint;
      mimeType: string;
      createdAt: Date;
    }>;
    createdAt: Date;
    updatedAt: Date;
    projectId: string;
    deletedAt?: Date | null;
  }): ProjectTaskItemDTO {
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      parentTaskId: task.parentTaskId ?? null,
      status: task.status as ProjectTaskItemDTO['status'],
      priority: task.priority as ProjectTaskItemDTO['priority'],
      type: (task.type ?? 'task') as ProjectTaskItemDTO['type'],
      number: task.number ?? null,
      storyPoints: task.storyPoints ?? null,
      position: task.position ?? null,
      projectId: task.projectId,
      labels: (task.labels ?? []).map((tl) => tl.label),
      attachments: (task.attachments ?? []).map((a) => ({
        ...a,
        size: Number(a.size),
        createdAt: a.createdAt.toISOString(),
      })),
      dueDate: task.dueDate ? task.dueDate.toISOString() : null,
      assigneeId: task.assigneeId,
      assigneeName: task.assignee?.fullName ?? null,
      assigneeAvatarColor: task.assignee?.avatarColor ?? null,
      subtaskProgress: null,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
      deletedAt: task.deletedAt ? task.deletedAt.toISOString() : null,
    };
  }

  async getTasksByProject(input: {
    projectId: string;
    workspaceId: string;
    cursor?: string;
    limit?: number;
  }): Promise<ProjectTaskItemDTO[]> {
    await verifyActiveProjectInWorkspace(this.prisma, input);

    const limit = input.limit ?? 50;

    const tasks = await this.prisma.task.findMany({
      where: {
        projectId: input.projectId,
      },
      select: this.taskSelect,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
    });

    return tasks.map((task) => this.toTaskDTO(task));
  }

  async createTaskForProject(input: {
    projectId: string;
    workspaceId: string;
    actorId?: string;
    title: string;
    description?: string;
    parentTaskId?: string | null;
    status: NonNullable<CreateTaskRequestDTO['status']>;
    priority: NonNullable<CreateTaskRequestDTO['priority']>;
    type?: CreateTaskRequestDTO['type'];
    storyPoints?: number | null;
    labelIds?: string[];
    dueDate?: Date | null;
    assigneeId?: string | null;
  }): Promise<ProjectTaskItemDTO> {
    await verifyActiveProjectInWorkspace(this.prisma, input);

    if (input.assigneeId) {
      await verifyAssigneeInWorkspace(this.prisma, {
        workspaceId: input.workspaceId,
        assigneeId: input.assigneeId,
      });
    }

    if (input.parentTaskId) {
      await this.validateParentTask({
        projectId: input.projectId,
        parentTaskId: input.parentTaskId,
      });
    }

    // Auto-generate task number
    const maxNumberResult = await this.prisma.task.aggregate({
      where: { projectId: input.projectId },
      _max: { number: true },
    });
    const nextNumber = (maxNumberResult._max.number ?? 0) + 1;

    const task = await this.prisma.task.create({
      data: {
        projectId: input.projectId,
        title: input.title,
        description: input.description ?? null,
        status: input.status,
        priority: input.priority,
        type: input.type ?? 'task',
        number: nextNumber,
        position: String(nextNumber * 1000),
        storyPoints: input.storyPoints ?? null,
        dueDate: input.dueDate ?? null,
        assigneeId: input.assigneeId ?? null,
        parentTaskId: input.parentTaskId ?? null,
        ...(input.labelIds?.length
          ? { labels: { create: input.labelIds.map((labelId) => ({ labelId })) } }
          : {}),
      },
      select: this.taskSelect,
    });

    await this.prisma.taskEvent.create({
      data: {
        taskId: task.id,
        actorId: input.actorId ?? null,
        type: 'created',
        payload: {
          title: task.title,
          status: task.status,
          priority: task.priority,
        },
      },
    });

    // Notify assignee
    if (input.assigneeId) {
      void this.notificationService
        .createNotification({
          userId: input.assigneeId,
          workspaceId: input.workspaceId,
          type: 'task_assigned',
          payload: {
            taskId: task.id,
            taskTitle: input.title,
            message: `Bạn được gán task: ${input.title}`,
          },
        })
        .catch((err: unknown) => logger.error({ err }, 'Notification failed'));
    }

    logger.info(
      { taskId: task.id, projectId: input.projectId, actorId: input.actorId },
      'Task created',
    );
    // Trigger embedding sync in background
    void this.syncTaskEmbedding(task.id, task.title, task.description || '');

    // Trigger automation rules
    void this.automationService.handleTaskEvent({
      taskId: task.id,
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      type: 'created',
      actorId: input.actorId ?? null,
      payload: {
        title: task.title,
        status: task.status,
        priority: task.priority,
      },
    });

    await this.clearDashboardCache(input.workspaceId);

    // Emit Neural Signal for telemetry
    void this.aiService.logSignal(
      'TASK_CREATED',
      {
        taskId: task.id,
        title: task.title,
        status: task.status,
        priority: task.priority,
      },
      {
        workspaceId: input.workspaceId,
        projectId: input.projectId,
      },
    );

    return this.toTaskDTO(task);
  }

  async updateTaskForProject(input: {
    projectId: string;
    taskId: string;
    workspaceId: string;
    actorId?: string;
    data: Omit<UpdateTaskRequestDTO, 'dueDate'> & { dueDate?: Date | null };
  }): Promise<ProjectTaskItemDTO> {
    await this.verifyProjectAndTask(input);

    const existingTask = await this.prisma.task.findFirst({
      where: {
        id: input.taskId,
        projectId: input.projectId,
      } as Prisma.TaskWhereInput,
      select: {
        id: true,
        assigneeId: true,
        parentTaskId: true,
        title: true,
        status: true,
        priority: true,
        type: true,
        storyPoints: true,
        dueDate: true,
        description: true,
      },
    });

    if (!existingTask) {
      throw new NotFoundException('Task not found');
    }

    if (input.data.assigneeId) {
      await verifyAssigneeInWorkspace(this.prisma, {
        workspaceId: input.workspaceId,
        assigneeId: input.data.assigneeId,
      });
    }

    if (input.data.status) {
      await this.workflowService.validateTransition(
        input.projectId,
        existingTask.status,
        input.data.status,
      );
    }

    if (input.data.parentTaskId !== undefined) {
      if (input.data.parentTaskId === input.taskId) {
        throw new BadRequestException('Task cannot be parent of itself');
      }

      if (input.data.parentTaskId) {
        await this.validateParentTask({
          projectId: input.projectId,
          parentTaskId: input.data.parentTaskId,
        });
      }
    }

    // Handle label updates via deleteMany + create
    if (input.data.labelIds !== undefined) {
      await this.prisma.taskLabel.deleteMany({ where: { taskId: input.taskId } });
      if (input.data.labelIds.length > 0) {
        await this.prisma.taskLabel.createMany({
          data: input.data.labelIds.map((labelId) => ({ taskId: input.taskId, labelId })),
        });
      }
    }

    const task = await this.prisma.task.update({
      where: {
        id: input.taskId,
      },
      data: {
        ...(input.data.title !== undefined ? { title: input.data.title } : {}),
        ...(input.data.description !== undefined ? { description: input.data.description } : {}),
        ...(input.data.status !== undefined ? { status: input.data.status } : {}),
        ...(input.data.priority !== undefined ? { priority: input.data.priority } : {}),
        ...(input.data.type !== undefined ? { type: input.data.type } : {}),
        ...(input.data.storyPoints !== undefined ? { storyPoints: input.data.storyPoints } : {}),
        ...(input.data.dueDate !== undefined ? { dueDate: input.data.dueDate } : {}),
        ...(input.data.assigneeId !== undefined ? { assigneeId: input.data.assigneeId } : {}),
        ...(input.data.parentTaskId !== undefined ? { parentTaskId: input.data.parentTaskId } : {}),
      },
      select: this.taskSelect,
    });

    const changedFields: string[] = [];

    if (input.data.title !== undefined && input.data.title !== existingTask.title) {
      changedFields.push('title');
    }
    if (
      input.data.description !== undefined &&
      input.data.description !== existingTask.description
    ) {
      changedFields.push('description');
    }
    if (input.data.priority !== undefined && input.data.priority !== existingTask.priority) {
      changedFields.push('priority');
    }
    if (input.data.type !== undefined && input.data.type !== existingTask.type) {
      changedFields.push('type');
    }
    if (
      input.data.storyPoints !== undefined &&
      input.data.storyPoints !== existingTask.storyPoints
    ) {
      changedFields.push('storyPoints');
    }
    if (input.data.dueDate !== undefined) {
      const previousDueDate = existingTask.dueDate?.toISOString() ?? null;
      const currentDueDate = input.data.dueDate?.toISOString() ?? null;
      if (previousDueDate !== currentDueDate) {
        changedFields.push('dueDate');
      }
    }

    if (input.data.status !== undefined && input.data.status !== existingTask.status) {
      await this.prisma.taskEvent.create({
        data: {
          taskId: input.taskId,
          actorId: input.actorId ?? null,
          type: 'status_changed',
          payload: {
            from: existingTask.status,
            to: input.data.status,
          },
        },
      });
    }

    if (input.data.assigneeId !== undefined && input.data.assigneeId !== existingTask.assigneeId) {
      await this.prisma.taskEvent.create({
        data: {
          taskId: input.taskId,
          actorId: input.actorId ?? null,
          type: 'assignee_changed',
          payload: {
            from: existingTask.assigneeId,
            to: input.data.assigneeId,
          },
        },
      });
      changedFields.push('assigneeId');
    }

    if (input.data.labelIds !== undefined) {
      changedFields.push('labelIds');
    }

    if (
      input.data.parentTaskId !== undefined &&
      input.data.parentTaskId !== existingTask.parentTaskId
    ) {
      changedFields.push('parentTaskId');
    }

    if (changedFields.length > 0) {
      await this.prisma.taskEvent.create({
        data: {
          taskId: input.taskId,
          actorId: input.actorId ?? null,
          type: 'updated',
          payload: {
            action: 'task_updated',
            changedFields,
          },
        },
      });
    }

    // Notify new assignee if changed
    if (input.data.assigneeId && input.data.assigneeId !== existingTask.assigneeId) {
      void this.notificationService
        .createNotification({
          userId: input.data.assigneeId,
          workspaceId: input.workspaceId,
          type: 'task_assigned',
          payload: {
            taskId: input.taskId,
            projectId: task.projectId,
            taskTitle: task.title,
            message: `Bạn được gán task: ${task.title}`,
          },
        })
        .catch((err: unknown) => logger.error({ err }, 'Notification failed'));
    }

    // Trigger embedding sync if title or description changed
    if (changedFields.includes('title') || changedFields.includes('description')) {
      void this.syncTaskEmbedding(task.id, task.title, task.description || '');
    }

    // Trigger automation rules
    void this.automationService.handleTaskEvent({
      taskId: task.id,
      workspaceId: input.workspaceId,
      projectId: task.projectId,
      type: 'updated',
      actorId: input.actorId ?? null,
      payload: {
        changedFields,
        status: task.status,
        priority: task.priority,
      },
    });

    await this.clearDashboardCache(input.workspaceId);

    return this.toTaskDTO(task);
  }

  async updateTaskStatusForProject(input: {
    projectId: string;
    taskId: string;
    workspaceId: string;
    actorId?: string;
    status: string;
    position?: string | null;
  }): Promise<ProjectTaskItemDTO> {
    await this.verifyProjectAndTask(input);

    const existingTask = await this.prisma.task.findUnique({
      where: { id: input.taskId },
      select: { status: true, title: true },
    });

    if (!existingTask) {
      throw new NotFoundException('Task not found');
    }

    if (existingTask.status !== input.status) {
      await this.workflowService.validateTransition(
        input.projectId,
        existingTask.status,
        input.status,
      );
    }

    const task = await this.prisma.task.update({
      where: { id: input.taskId },
      data: {
        status: input.status,
        ...(input.position !== undefined ? { position: input.position } : {}),
      },
      select: this.taskSelect,
    });

    if (existingTask.status !== input.status) {
      await this.prisma.taskEvent.create({
        data: {
          taskId: input.taskId,
          actorId: input.actorId ?? null,
          type: 'status_changed',
          payload: {
            from: existingTask.status,
            to: input.status,
          },
        },
      });

      // Trigger automation rules
      void this.automationService.handleTaskEvent({
        taskId: task.id,
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        type: 'status_changed',
        actorId: input.actorId ?? null,
        payload: {
          from: existingTask.status,
          to: input.status,
        },
      });
    }

    await this.clearDashboardCache(input.workspaceId);

    return this.toTaskDTO(task);
  }

  async bulkCreateTasksForProject(input: {
    projectId: string;
    workspaceId: string;
    actorId?: string;
    tasks: { title: string; description?: string }[];
  }): Promise<ProjectTaskItemDTO[]> {
    await verifyActiveProjectInWorkspace(this.prisma, input);

    const createdTasks: ProjectTaskItemDTO[] = [];

    await this.prisma.$transaction(async (tx) => {
      // Get max number
      const maxNumberResult = await tx.task.aggregate({
        where: { projectId: input.projectId },
        _max: { number: true },
      });
      let nextNumber = (maxNumberResult._max.number ?? 0) + 1;

      for (const t of input.tasks) {
        const task = await tx.task.create({
          data: {
            projectId: input.projectId,
            title: t.title,
            description: t.description ?? null,
            status: 'todo',
            priority: 'medium',
            type: 'task',
            number: nextNumber,
            position: String(nextNumber * 1000),
          },
          select: this.taskSelect,
        });

        await tx.taskEvent.create({
          data: {
            taskId: task.id,
            actorId: input.actorId ?? null,
            type: 'created',
            payload: {
              title: task.title,
              status: task.status,
              priority: task.priority,
            },
          },
        });

        createdTasks.push(this.toTaskDTO(task));
        nextNumber++;

        // Sync embedding in background (outside transaction)
        void this.syncTaskEmbedding(task.id, task.title, task.description || '');
      }
    });

    await this.clearDashboardCache(input.workspaceId);

    return createdTasks;
  }

  async bulkOperateTasksForProject(input: {
    projectId: string;
    workspaceId: string;
    actorId?: string;
    taskIds: string[];
    status?: string;
    priority?: string;
    type?: string;
    dueDate?: Date | null;
    assigneeId?: string | null;
    delete?: boolean;
  }): Promise<BulkTaskOperationResultDTO> {
    await verifyActiveProjectInWorkspace(this.prisma, input);

    const validTasks = await this.prisma.task.findMany({
      where: {
        id: { in: input.taskIds },
        projectId: input.projectId,
      },
    });

    const validIds = validTasks.map((t) => t.id);

    if (input.delete) {
      await this.prisma.task.deleteMany({
        where: { id: { in: validIds } },
      });
      await this.clearDashboardCache(input.workspaceId);
      return { updated: 0, deleted: validIds.length };
    }

    const updateData: Prisma.TaskUncheckedUpdateInput = {};
    if (input.status !== undefined) updateData.status = input.status;
    if (input.priority !== undefined) updateData.priority = input.priority as TaskPriority;
    if (input.type !== undefined) updateData.type = input.type as TaskType;
    if (input.dueDate !== undefined) updateData.dueDate = input.dueDate;
    if (input.assigneeId !== undefined) updateData.assigneeId = input.assigneeId;

    await this.prisma.task.updateMany({
      where: { id: { in: validIds } },
      data: updateData,
    });

    // Create events and notifications
    for (const task of validTasks) {
      await this.prisma.taskEvent.create({
        data: {
          taskId: task.id,
          actorId: input.actorId ?? null,
          type: 'updated',
          payload: { action: 'bulk_update', status: input.status, priority: input.priority },
        },
      });

      if (input.assigneeId && input.assigneeId !== task.assigneeId) {
        void this.notificationService
          .createNotification({
            userId: input.assigneeId,
            workspaceId: input.workspaceId,
            type: 'task_assigned',
            payload: {
              taskId: task.id,
              taskTitle: task.title,
              message: `Bạn được gán task (bulk): ${task.title}`,
            },
          })
          .catch(() => {});
      }
    }

    await this.clearDashboardCache(input.workspaceId);

    return {
      updated: validIds.length,
      deleted: 0,
    };
  }

  async deleteTaskForProject(input: {
    projectId: string;
    taskId: string;
    workspaceId: string;
    actorId?: string;
  }): Promise<void> {
    await this.verifyProjectAndTask(input);

    await this.prisma.task.delete({
      where: { id: input.taskId },
    });

    await this.clearDashboardCache(input.workspaceId);
  }

  async getTaskHistoryForProject(input: {
    projectId: string;
    taskId: string;
    workspaceId: string;
  }): Promise<TaskHistoryItemDTO[]> {
    await this.verifyProjectAndTask(input);

    const events = await this.prisma.taskEvent.findMany({
      where: { taskId: input.taskId },
      include: {
        actor: { select: { fullName: true, avatarColor: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return events.map((event) => ({
      id: event.id,
      type: event.type as TaskHistoryItemDTO['type'],
      actorName: event.actor?.fullName ?? 'Hệ thống',
      actorAvatarColor: event.actor?.avatarColor ?? null,
      payload: event.payload as Record<string, unknown>,
      createdAt: event.createdAt.toISOString(),
    }));
  }

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

    const embedding = taskWithEmbed.embedding as unknown as { vector: number[] };
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

    return (similar as unknown as { id: string; title: string; score: number }[]).filter(
      (r) => r.id !== taskId,
    );
  }

  private async validateParentTask(input: {
    projectId: string;
    parentTaskId: string;
  }): Promise<void> {
    const parentTask = await this.prisma.task.findFirst({
      where: {
        id: input.parentTaskId,
        projectId: input.projectId,
      },
    });

    if (!parentTask) {
      throw new BadRequestException('Parent task must belong to the same project');
    }
  }

  private async verifyProjectAndTask(input: {
    projectId: string;
    taskId: string;
    workspaceId: string;
  }): Promise<void> {
    await verifyProjectAndTaskInWorkspace(this.prisma, input);
  }

  private async syncTaskEmbedding(taskId: string, title: string, description: string) {
    try {
      const text = `${title}\n${description}`;
      const embedding = await this.aiService.getEmbedding(text);
      const vectorStr = `[${embedding.join(',')}]`;

      await this.prisma.$executeRaw`
        INSERT INTO "TaskEmbedding" ("taskId", "vector", "updatedAt")
        VALUES (${taskId}, ${vectorStr}::vector, NOW())
        ON CONFLICT ("taskId") 
        DO UPDATE SET "vector" = ${vectorStr}::vector, "updatedAt" = NOW();
      `;
    } catch (err: unknown) {
      logger.error({ err, taskId }, 'Failed to sync task embedding');
    }
  }

  private async clearDashboardCache(workspaceId: string) {
    const key = `dashboard:stats:${workspaceId}`;
    await this.redisService.del(key).catch(() => {});
  }
}
