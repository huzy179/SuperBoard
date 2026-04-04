import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { logger } from '../../common/logger';
import {
  verifyActiveProjectInWorkspace,
  verifyAssigneeInWorkspace,
  verifyProjectAndTaskInWorkspace,
} from '../../common/project-scope.helper';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { WorkflowService } from '../workflow/workflow.service';
import type {
  BulkTaskOperationResultDTO,
  CreateProjectRequestDTO,
  CreateTaskRequestDTO,
  DashboardStatsDTO,
  LabelDTO,
  ProjectDetailDTO,
  ProjectItemDTO,
  ProjectMemberDTO,
  ProjectTaskItemDTO,
  TaskHistoryPayloadDTO,
  TaskHistoryItemDTO,
  UpdateProjectRequestDTO,
  UpdateTaskRequestDTO,
  UpdateTaskStatusRequestDTO,
} from '@superboard/shared';

@Injectable()
export class ProjectService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
    private workflowService: WorkflowService,
  ) {}

  async getProjectsByWorkspace(
    workspaceId: string,
    options?: { showArchived?: boolean },
  ): Promise<ProjectItemDTO[]> {
    const projects = await this.prisma.project.findMany({
      where: {
        workspaceId,
        ...(options?.showArchived ? {} : { deletedAt: null }),
      } as Prisma.ProjectWhereInput,
      select: {
        id: true,
        name: true,
        description: true,
        color: true,
        icon: true,
        key: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            tasks: {
              where: { deletedAt: null },
            },
          },
        },
        tasks: {
          where: { deletedAt: null, status: 'done' },
          select: { id: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return projects.map((project) => ({
      ...this.toProjectItemDTO(project),
      taskCount: project._count.tasks,
      doneTaskCount: project.tasks.length,
    }));
  }

  async getProjectByIdForWorkspace(
    projectId: string,
    workspaceId: string,
    options?: { showArchived?: boolean },
  ): Promise<ProjectDetailDTO | null> {
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        workspaceId,
        ...(options?.showArchived ? {} : { deletedAt: null }),
      } as Prisma.ProjectWhereInput,
      include: {
        tasks: {
          where: {
            ...(options?.showArchived ? {} : { deletedAt: null }),
          } as Prisma.TaskWhereInput,
          orderBy: {
            createdAt: 'desc',
          },
          select: {
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
            assignee: { select: { fullName: true, avatarColor: true } },
            labels: { select: { label: { select: { id: true, name: true, color: true } } } },
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!project) {
      return null;
    }

    // Fetch workspace members for assignee dropdown
    const workspaceMembers = await this.prisma.workspaceMember.findMany({
      where: { workspaceId, deletedAt: null },
      select: {
        user: { select: { id: true, fullName: true, avatarColor: true } },
      },
    });

    const members: ProjectMemberDTO[] = workspaceMembers.map((m) => ({
      id: m.user.id,
      fullName: m.user.fullName,
      avatarColor: m.user.avatarColor ?? null,
    }));

    const subtaskStatsByParent = new Map<
      string,
      { total: number; done: number; percent: number }
    >();
    for (const task of project.tasks) {
      if (!task.parentTaskId) {
        continue;
      }
      const current = subtaskStatsByParent.get(task.parentTaskId) ?? {
        total: 0,
        done: 0,
        percent: 0,
      };
      current.total += 1;
      if (task.status === 'done') {
        current.done += 1;
      }
      current.percent = current.total === 0 ? 0 : Math.round((current.done / current.total) * 100);
      subtaskStatsByParent.set(task.parentTaskId, current);
    }

    return {
      ...this.toProjectItemDTO(project),
      taskCount: project.tasks.length,
      doneTaskCount: project.tasks.filter((t) => t.status === 'done').length,
      members,
      tasks: project.tasks.map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        parentTaskId: task.parentTaskId,
        status: task.status as ProjectTaskItemDTO['status'],
        priority: task.priority,
        type: (task.type ?? 'task') as ProjectTaskItemDTO['type'],
        number: task.number ?? null,
        storyPoints: task.storyPoints ?? null,
        position: task.position ?? null,
        labels: (task.labels ?? []).map((tl) => tl.label as LabelDTO),
        dueDate: task.dueDate ? task.dueDate.toISOString() : null,
        assigneeId: task.assigneeId,
        assigneeName: task.assignee?.fullName ?? null,
        assigneeAvatarColor: task.assignee?.avatarColor ?? null,
        subtaskProgress: subtaskStatsByParent.get(task.id) ?? null,
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
      })),
    };
  }

  async createProject(workspaceId: string, data: CreateProjectRequestDTO): Promise<ProjectItemDTO> {
    const project = await this.prisma.project.create({
      data: {
        name: data.name,
        description: data.description ?? null,
        color: data.color ?? null,
        workspaceId,
      },
    });

    // Clone workspace workflow status template into project snapshot
    await this.workflowService.cloneWorkspaceTemplateToProject(workspaceId, project.id);

    return this.toProjectItemDTO(project);
  }

  async updateProjectForWorkspace(input: {
    projectId: string;
    workspaceId: string;
    data: UpdateProjectRequestDTO;
  }): Promise<ProjectItemDTO> {
    await verifyActiveProjectInWorkspace(this.prisma, input);

    const project = await this.prisma.project.update({
      where: { id: input.projectId },
      data: {
        ...(input.data.name !== undefined ? { name: input.data.name } : {}),
        ...(input.data.description !== undefined ? { description: input.data.description } : {}),
        ...(input.data.color !== undefined ? { color: input.data.color } : {}),
        ...(input.data.icon !== undefined ? { icon: input.data.icon } : {}),
      },
    });

    return this.toProjectItemDTO(project);
  }

  async archiveProjectForWorkspace(input: {
    projectId: string;
    workspaceId: string;
    archivedAt?: Date;
  }): Promise<void> {
    await verifyActiveProjectInWorkspace(this.prisma, input);

    await this.prisma.project.update({
      where: { id: input.projectId },
      data: {
        deletedAt: input.archivedAt ?? new Date(),
      } as Prisma.ProjectUpdateInput,
    });
  }

  async restoreProjectForWorkspace(input: {
    projectId: string;
    workspaceId: string;
    restoredAt?: Date;
  }): Promise<void> {
    const existingProject = await this.prisma.project.findFirst({
      where: {
        id: input.projectId,
        workspaceId: input.workspaceId,
        deletedAt: {
          not: null,
        },
      } as Prisma.ProjectWhereInput,
      select: {
        id: true,
        workspace: {
          select: {
            id: true,
            deletedAt: true,
          },
        },
      },
    });

    if (!existingProject) {
      throw new NotFoundException('Project not found');
    }

    if (existingProject.workspace.deletedAt) {
      throw new BadRequestException(
        'Cannot restore project because parent workspace is archived. Please restore workspace first.',
      );
    }

    await this.prisma.project.update({
      where: { id: input.projectId },
      data: {
        deletedAt: null,
      } as Prisma.ProjectUpdateInput,
    });

    void input.restoredAt;
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
    return this.toTaskDTO(task);
  }

  async updateTaskStatusForProject(input: {
    projectId: string;
    taskId: string;
    workspaceId: string;
    actorId?: string;
    status: UpdateTaskStatusRequestDTO['status'];
    position?: string | null;
  }): Promise<ProjectTaskItemDTO> {
    await this.verifyProjectAndTask(input);

    const existingTask = await this.prisma.task.findFirst({
      where: {
        id: input.taskId,
        projectId: input.projectId,
        deletedAt: null,
      } as Prisma.TaskWhereInput,
      select: { status: true },
    });

    if (!existingTask) {
      throw new NotFoundException('Task not found');
    }

    // Validate transition
    await this.workflowService.validateTransition(
      input.projectId,
      existingTask.status,
      input.status,
    );

    const task = await this.prisma.task.update({
      where: {
        id: input.taskId,
      },
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
    }

    return this.toTaskDTO(task);
  }

  async bulkOperateTasksForProject(input: {
    projectId: string;
    workspaceId: string;
    actorId?: string;
    taskIds: string[];
    status?: UpdateTaskStatusRequestDTO['status'];
    priority?: UpdateTaskRequestDTO['priority'];
    type?: UpdateTaskRequestDTO['type'];
    dueDate?: Date | null;
    assigneeId?: string | null;
    delete?: boolean;
  }): Promise<BulkTaskOperationResultDTO> {
    await verifyActiveProjectInWorkspace(this.prisma, input);

    const tasks = await this.prisma.task.findMany({
      where: {
        id: { in: input.taskIds },
        projectId: input.projectId,
        deletedAt: null,
      },
      select: { id: true, status: true, assigneeId: true },
    });

    if (tasks.length !== input.taskIds.length) {
      throw new NotFoundException('One or more tasks were not found');
    }

    if (input.assigneeId) {
      await verifyAssigneeInWorkspace(this.prisma, {
        workspaceId: input.workspaceId,
        assigneeId: input.assigneeId,
      });
    }

    // Validate status transitions for bulk update
    if (input.status) {
      for (const task of tasks) {
        await this.workflowService.validateTransition(input.projectId, task.status, input.status);
      }
    }

    if (input.delete) {
      const deletedAt = new Date();
      const deleteResult = await this.prisma.task.updateMany({
        where: {
          id: { in: input.taskIds },
          projectId: input.projectId,
          deletedAt: null,
        },
        data: {
          deletedAt,
        },
      });

      if (deleteResult.count > 0) {
        await this.prisma.taskEvent.createMany({
          data: tasks.map((task) => ({
            taskId: task.id,
            actorId: input.actorId ?? null,
            type: 'updated',
            payload: {
              action: 'bulk_delete',
              deletedAt: deletedAt.toISOString(),
            },
          })),
        });
      }

      return {
        updated: 0,
        deleted: deleteResult.count,
      };
    }

    const updateData: Prisma.TaskUpdateManyMutationInput = {
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.priority !== undefined ? { priority: input.priority } : {}),
      ...(input.type !== undefined ? { type: input.type } : {}),
      ...(input.dueDate !== undefined ? { dueDate: input.dueDate } : {}),
      ...(input.assigneeId !== undefined ? { assigneeId: input.assigneeId } : {}),
    };

    const updateResult = await this.prisma.task.updateMany({
      where: {
        id: { in: input.taskIds },
        projectId: input.projectId,
        deletedAt: null,
      },
      data: updateData,
    });

    if (updateResult.count > 0) {
      const events: Prisma.TaskEventCreateManyInput[] = [];

      for (const task of tasks) {
        if (input.status !== undefined && input.status !== task.status) {
          events.push({
            taskId: task.id,
            actorId: input.actorId ?? null,
            type: 'status_changed',
            payload: {
              from: task.status,
              to: input.status,
              action: 'bulk_update',
            },
          });
        }

        if (input.assigneeId !== undefined && input.assigneeId !== task.assigneeId) {
          events.push({
            taskId: task.id,
            actorId: input.actorId ?? null,
            type: 'assignee_changed',
            payload: {
              from: task.assigneeId,
              to: input.assigneeId,
              action: 'bulk_update',
            },
          });
        }

        events.push({
          taskId: task.id,
          actorId: input.actorId ?? null,
          type: 'updated',
          payload: {
            action: 'bulk_update',
            status: input.status,
            priority: input.priority,
            type: input.type,
            dueDate: input.dueDate?.toISOString() ?? input.dueDate ?? undefined,
            assigneeId: input.assigneeId,
          },
        });
      }

      await this.prisma.taskEvent.createMany({ data: events });
    }

    return {
      updated: updateResult.count,
      deleted: 0,
    };
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
        deletedAt: null,
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
            taskTitle: task.title,
            message: `Bạn được gán task: ${task.title}`,
          },
        })
        .catch((err: unknown) => logger.error({ err }, 'Notification failed'));
    }

    return this.toTaskDTO(task);
  }

  async deleteTaskForProject(input: {
    projectId: string;
    taskId: string;
    workspaceId: string;
    actorId?: string;
  }): Promise<void> {
    await this.verifyProjectAndTask(input);

    const deletedAt = new Date();

    await this.prisma.task.update({
      where: {
        id: input.taskId,
      },
      data: {
        deletedAt,
      },
    });

    await this.prisma.taskEvent.create({
      data: {
        taskId: input.taskId,
        actorId: input.actorId ?? null,
        type: 'updated',
        payload: {
          action: 'task_deleted',
          deletedAt: deletedAt.toISOString(),
        },
      },
    });

    logger.info(
      { taskId: input.taskId, projectId: input.projectId, actorId: input.actorId },
      'Task deleted',
    );
  }

  async getTaskHistoryForProject(input: {
    projectId: string;
    taskId: string;
    workspaceId: string;
  }): Promise<TaskHistoryItemDTO[]> {
    await this.verifyProjectAndTask(input);

    const events = await this.prisma.taskEvent.findMany({
      where: {
        taskId: input.taskId,
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
      select: {
        id: true,
        type: true,
        actorId: true,
        createdAt: true,
        payload: true,
        actor: {
          select: {
            fullName: true,
          },
        },
      },
    });

    return events.map((event) => ({
      id: event.id,
      type: event.type as TaskHistoryItemDTO['type'],
      actorId: event.actorId,
      actorName: event.actor?.fullName ?? null,
      createdAt: event.createdAt.toISOString(),
      payload:
        event.payload && typeof event.payload === 'object' && !Array.isArray(event.payload)
          ? (event.payload as TaskHistoryPayloadDTO)
          : null,
    }));
  }

  async getDashboardStats(workspaceId: string): Promise<DashboardStatsDTO> {
    const tasks = await this.prisma.task.findMany({
      where: {
        project: { workspaceId, deletedAt: null },
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        type: true,
        dueDate: true,
        assigneeId: true,
        assignee: { select: { fullName: true, avatarColor: true } },
        projectId: true,
      },
    });

    // Tasks by status
    const statusMap = new Map<string, number>();
    for (const t of tasks) {
      statusMap.set(t.status, (statusMap.get(t.status) ?? 0) + 1);
    }
    const tasksByStatus = [...statusMap.entries()].map(([status, count]) => ({
      status: status as DashboardStatsDTO['tasksByStatus'][number]['status'],
      count,
    }));

    // Tasks by priority
    const priorityMap = new Map<string, number>();
    for (const t of tasks) {
      priorityMap.set(t.priority, (priorityMap.get(t.priority) ?? 0) + 1);
    }
    const tasksByPriority = [...priorityMap.entries()].map(([priority, count]) => ({
      priority: priority as DashboardStatsDTO['tasksByPriority'][number]['priority'],
      count,
    }));

    // Tasks by type
    const typeMap = new Map<string, number>();
    for (const t of tasks) {
      typeMap.set(t.type ?? 'task', (typeMap.get(t.type ?? 'task') ?? 0) + 1);
    }
    const tasksByType = [...typeMap.entries()].map(([type, count]) => ({
      type: type as DashboardStatsDTO['tasksByType'][number]['type'],
      count,
    }));

    // Tasks by assignee
    const assigneeMap = new Map<string, { name: string; color: string | null; count: number }>();
    for (const t of tasks) {
      if (t.assigneeId && t.assignee) {
        const existing = assigneeMap.get(t.assigneeId);
        if (existing) {
          existing.count++;
        } else {
          assigneeMap.set(t.assigneeId, {
            name: t.assignee.fullName,
            color: t.assignee.avatarColor ?? null,
            count: 1,
          });
        }
      }
    }
    const tasksByAssignee = [...assigneeMap.entries()].map(([assigneeId, v]) => ({
      assigneeId,
      assigneeName: v.name,
      avatarColor: v.color,
      count: v.count,
    }));

    // Tasks by project
    const projects = await this.prisma.project.findMany({
      where: { workspaceId, deletedAt: null },
      select: { id: true, name: true, key: true, color: true },
    });
    const projectTaskMap = new Map<string, { total: number; done: number }>();
    for (const t of tasks) {
      const existing = projectTaskMap.get(t.projectId) ?? { total: 0, done: 0 };
      existing.total++;
      if (t.status === 'done') existing.done++;
      projectTaskMap.set(t.projectId, existing);
    }
    const tasksByProject = projects.map((p) => {
      const counts = projectTaskMap.get(p.id) ?? { total: 0, done: 0 };
      return {
        projectId: p.id,
        projectName: p.name,
        projectKey: p.key ?? null,
        color: p.color ?? null,
        total: counts.total,
        done: counts.done,
      };
    });

    // Overdue tasks
    const now = new Date();
    const overdueTasks = tasks.filter(
      (t) => t.dueDate && t.dueDate < now && t.status !== 'done' && t.status !== 'cancelled',
    ).length;

    // Recent activity
    const recentEvents = await this.prisma.taskEvent.findMany({
      where: {
        task: { project: { workspaceId, deletedAt: null }, deletedAt: null },
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        type: true,
        createdAt: true,
        task: { select: { title: true } },
        actor: { select: { fullName: true } },
      },
    });
    const recentActivity = recentEvents.map((e) => ({
      id: e.id,
      type: e.type as DashboardStatsDTO['recentActivity'][number]['type'],
      taskTitle: e.task.title,
      actorName: e.actor?.fullName ?? null,
      createdAt: e.createdAt.toISOString(),
    }));

    return {
      tasksByStatus,
      tasksByPriority,
      tasksByType,
      tasksByAssignee,
      tasksByProject,
      overdueTasks,
      recentActivity,
    };
  }

  private toProjectItemDTO(project: {
    id: string;
    name: string;
    description: string | null;
    color: string | null;
    icon: string | null;
    key?: string | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date | null;
  }): ProjectItemDTO {
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      color: project.color,
      icon: project.icon,
      key: project.key ?? null,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
      taskCount: 0,
      doneTaskCount: 0,
      deletedAt: project.deletedAt ? project.deletedAt.toISOString() : null,
    };
  }

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
    assignee: { select: { fullName: true, avatarColor: true } },
    labels: { select: { label: { select: { id: true, name: true, color: true } } } },
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
    createdAt: Date;
    updatedAt: Date;
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
      labels: (task.labels ?? []).map((tl) => tl.label),
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

  private async validateParentTask(input: {
    projectId: string;
    parentTaskId: string;
  }): Promise<void> {
    const parentTask = await this.prisma.task.findFirst({
      where: {
        id: input.parentTaskId,
        projectId: input.projectId,
        deletedAt: null,
      },
      select: {
        id: true,
        parentTaskId: true,
      },
    });

    if (!parentTask) {
      throw new NotFoundException('Parent task not found');
    }

    if (parentTask.parentTaskId) {
      throw new BadRequestException('Only one-level subtask is supported');
    }
  }

  private async verifyProjectAndTask(input: {
    projectId: string;
    taskId: string;
    workspaceId: string;
  }): Promise<void> {
    await verifyProjectAndTaskInWorkspace(this.prisma, input);
  }
}
