import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  CreateProjectRequestDTO,
  CreateTaskRequestDTO,
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
  constructor(private prisma: PrismaService) {}

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

    return this.toTaskDTO(task);
  }

  async updateTaskStatusForProject(input: {
    projectId: string;
    taskId: string;
    workspaceId: string;
    status: UpdateTaskStatusRequestDTO['status'];
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

    const existingTask = await this.prisma.task.findFirst({
      where: {
        id: input.taskId,
        projectId: input.projectId,
        deletedAt: null,
      } as Prisma.TaskWhereInput,
      select: {
        id: true,
      },
    });

    if (!existingTask) {
      throw new NotFoundException('Task not found');
    }

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

    const existingTask = await this.prisma.task.findFirst({
      where: {
        id: input.taskId,
        projectId: input.projectId,
        deletedAt: null,
      } as Prisma.TaskWhereInput,
      select: { id: true },
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

    return this.toTaskDTO(task);
  }

  async deleteTaskForProject(input: {
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

    const existingTask = await this.prisma.task.findFirst({
      where: {
        id: input.taskId,
        projectId: input.projectId,
        deletedAt: null,
      } as Prisma.TaskWhereInput,
      select: { id: true },
    });

    if (!existingTask) {
      throw new NotFoundException('Task not found');
    }

    await this.prisma.task.update({
      where: {
        id: input.taskId,
      },
      data: {
        deletedAt: new Date(),
      },
    });
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
