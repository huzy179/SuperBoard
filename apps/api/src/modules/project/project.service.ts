import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { findOrThrow } from '../../common/helpers';
import { NotificationService } from '../notification/notification.service';
import type {
  CreateProjectRequestDTO,
  CreateTaskRequestDTO,
  DashboardStatsDTO,
  LabelDTO,
  ProjectDetailDTO,
  ProjectItemDTO,
  ProjectMemberDTO,
  ProjectTaskItemDTO,
  UpdateProjectRequestDTO,
  UpdateTaskRequestDTO,
  UpdateTaskStatusRequestDTO,
} from '@superboard/shared';

@Injectable()
export class ProjectService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
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
            status: true,
            priority: true,
            type: true,
            number: true,
            storyPoints: true,
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

    return {
      ...this.toProjectItemDTO(project),
      taskCount: project.tasks.length,
      doneTaskCount: project.tasks.filter((t) => t.status === 'done').length,
      members,
      tasks: project.tasks.map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status as ProjectTaskItemDTO['status'],
        priority: task.priority,
        type: (task.type ?? 'task') as ProjectTaskItemDTO['type'],
        number: task.number ?? null,
        storyPoints: task.storyPoints ?? null,
        labels: (task.labels ?? []).map((tl) => tl.label as LabelDTO),
        dueDate: task.dueDate ? task.dueDate.toISOString() : null,
        assigneeId: task.assigneeId,
        assigneeName: task.assignee?.fullName ?? null,
        assigneeAvatarColor: task.assignee?.avatarColor ?? null,
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

    return this.toProjectItemDTO(project);
  }

  async updateProjectForWorkspace(input: {
    projectId: string;
    workspaceId: string;
    data: UpdateProjectRequestDTO;
  }): Promise<ProjectItemDTO> {
    const existingProject = await this.prisma.project.findFirst({
      where: {
        id: input.projectId,
        workspaceId: input.workspaceId,
        deletedAt: null,
      } as Prisma.ProjectWhereInput,
      select: { id: true },
    });

    if (!existingProject) {
      throw new NotFoundException('Project not found');
    }

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
    const existingProject = await this.prisma.project.findFirst({
      where: {
        id: input.projectId,
        workspaceId: input.workspaceId,
        deletedAt: null,
      } as Prisma.ProjectWhereInput,
      select: { id: true },
    });

    if (!existingProject) {
      throw new NotFoundException('Project not found');
    }

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
    title: string;
    description?: string;
    status: NonNullable<CreateTaskRequestDTO['status']>;
    priority: NonNullable<CreateTaskRequestDTO['priority']>;
    type?: CreateTaskRequestDTO['type'];
    storyPoints?: number | null;
    labelIds?: string[];
    dueDate?: Date | null;
    assigneeId?: string | null;
  }): Promise<ProjectTaskItemDTO> {
    const project = await this.prisma.project.findFirst({
      where: {
        id: input.projectId,
        workspaceId: input.workspaceId,
        deletedAt: null,
      } as Prisma.ProjectWhereInput,
      select: {
        id: true,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (input.assigneeId) {
      await this.validateAssignee(input.workspaceId, input.assigneeId);
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
        storyPoints: input.storyPoints ?? null,
        dueDate: input.dueDate ?? null,
        assigneeId: input.assigneeId ?? null,
        ...(input.labelIds?.length
          ? { labels: { create: input.labelIds.map((labelId) => ({ labelId })) } }
          : {}),
      },
      select: this.taskSelect,
    });

    // Notify assignee
    if (input.assigneeId) {
      const project = await this.prisma.project.findUnique({
        where: { id: input.projectId },
        select: { workspaceId: true },
      });
      if (project) {
        void this.notificationService
          .createNotification({
            userId: input.assigneeId,
            workspaceId: project.workspaceId,
            type: 'task_assigned',
            payload: {
              taskId: task.id,
              taskTitle: input.title,
              message: `Bạn được gán task: ${input.title}`,
            },
          })
          .catch((err: unknown) => console.error('Notification failed:', err));
      }
    }

    return this.toTaskDTO(task);
  }

  async updateTaskStatusForProject(input: {
    projectId: string;
    taskId: string;
    workspaceId: string;
    status: UpdateTaskStatusRequestDTO['status'];
  }): Promise<ProjectTaskItemDTO> {
    await this.verifyProjectAndTask(input);

    const task = await this.prisma.task.update({
      where: {
        id: input.taskId,
      },
      data: {
        status: input.status,
      },
      select: this.taskSelect,
    });

    return this.toTaskDTO(task);
  }

  async updateTaskForProject(input: {
    projectId: string;
    taskId: string;
    workspaceId: string;
    data: Omit<UpdateTaskRequestDTO, 'dueDate'> & { dueDate?: Date | null };
  }): Promise<ProjectTaskItemDTO> {
    await this.verifyProjectAndTask(input);

    const existingTask = await this.prisma.task.findFirst({
      where: {
        id: input.taskId,
        projectId: input.projectId,
        deletedAt: null,
      } as Prisma.TaskWhereInput,
      select: { id: true, assigneeId: true, title: true },
    });

    if (!existingTask) {
      throw new NotFoundException('Task not found');
    }

    if (input.data.assigneeId) {
      await this.validateAssignee(input.workspaceId, input.data.assigneeId);
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
      },
      select: this.taskSelect,
    });

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
        .catch((err: unknown) => console.error('Notification failed:', err));
    }

    return this.toTaskDTO(task);
  }

  async deleteTaskForProject(input: {
    projectId: string;
    taskId: string;
    workspaceId: string;
  }): Promise<void> {
    await this.verifyProjectAndTask(input);

    await this.prisma.task.update({
      where: {
        id: input.taskId,
      },
      data: {
        deletedAt: new Date(),
      },
    });
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
    const tasksByStatus = [...statusMap.entries()].map(([status, count]) => ({ status, count }));

    // Tasks by priority
    const priorityMap = new Map<string, number>();
    for (const t of tasks) {
      priorityMap.set(t.priority, (priorityMap.get(t.priority) ?? 0) + 1);
    }
    const tasksByPriority = [...priorityMap.entries()].map(([priority, count]) => ({
      priority,
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
      type: e.type,
      taskTitle: e.task.title,
      actorName: e.actor?.fullName ?? null,
      createdAt: e.createdAt.toISOString(),
    }));

    return {
      tasksByStatus,
      tasksByPriority,
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
    };
  }

  private readonly taskSelect = {
    id: true,
    title: true,
    description: true,
    status: true,
    priority: true,
    type: true,
    number: true,
    storyPoints: true,
    dueDate: true,
    assigneeId: true,
    assignee: { select: { fullName: true, avatarColor: true } },
    labels: { select: { label: { select: { id: true, name: true, color: true } } } },
    createdAt: true,
    updatedAt: true,
  } as const;

  private toTaskDTO(task: {
    id: string;
    title: string;
    description: string | null;
    status: string;
    priority: string;
    type?: string;
    number?: number | null;
    storyPoints?: number | null;
    dueDate: Date | null;
    assigneeId: string | null;
    assignee: { fullName: string; avatarColor?: string | null } | null;
    labels?: Array<{ label: { id: string; name: string; color: string } }>;
    createdAt: Date;
    updatedAt: Date;
  }): ProjectTaskItemDTO {
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status as ProjectTaskItemDTO['status'],
      priority: task.priority as ProjectTaskItemDTO['priority'],
      type: (task.type ?? 'task') as ProjectTaskItemDTO['type'],
      number: task.number ?? null,
      storyPoints: task.storyPoints ?? null,
      labels: (task.labels ?? []).map((tl) => tl.label),
      dueDate: task.dueDate ? task.dueDate.toISOString() : null,
      assigneeId: task.assigneeId,
      assigneeName: task.assignee?.fullName ?? null,
      assigneeAvatarColor: task.assignee?.avatarColor ?? null,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    };
  }

  private async verifyProjectAndTask(input: {
    projectId: string;
    taskId: string;
    workspaceId: string;
  }): Promise<void> {
    await findOrThrow(
      this.prisma.project.findFirst({
        where: {
          id: input.projectId,
          workspaceId: input.workspaceId,
          deletedAt: null,
        } as Prisma.ProjectWhereInput,
        select: { id: true },
      }),
      'Project',
    );

    await findOrThrow(
      this.prisma.task.findFirst({
        where: {
          id: input.taskId,
          projectId: input.projectId,
          deletedAt: null,
        } as Prisma.TaskWhereInput,
        select: { id: true },
      }),
      'Task',
    );
  }

  private async validateAssignee(workspaceId: string, assigneeId: string): Promise<void> {
    const userInWorkspace = await this.prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId: assigneeId,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (!userInWorkspace) {
      throw new BadRequestException('Assignee is not a workspace member');
    }
  }
}
