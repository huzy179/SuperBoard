import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  CreateProjectRequestDTO,
  CreateTaskRequestDTO,
  ProjectDetailDTO,
  ProjectItemDTO,
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
        deletedAt: null,
        ...(options?.showArchived ? {} : { isArchived: false }),
      } as Prisma.ProjectWhereInput,
      select: {
        id: true,
        name: true,
        description: true,
        color: true,
        icon: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return projects.map((project) => this.toProjectItemDTO(project));
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
        deletedAt: null,
        ...(options?.showArchived ? {} : { isArchived: false }),
      } as Prisma.ProjectWhereInput,
      include: {
        tasks: {
          where: {
            ...(options?.showArchived ? {} : { isArchived: false }),
            deletedAt: null,
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
            dueDate: true,
            assigneeId: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!project) {
      return null;
    }

    return {
      ...this.toProjectItemDTO(project),
      tasks: project.tasks.map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate ? task.dueDate.toISOString() : null,
        assigneeId: task.assigneeId,
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
        isArchived: false,
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
        isArchived: false,
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
        isArchived: true,
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
            isArchived: true,
            deletedAt: true,
          },
        },
      },
    });

    if (!existingProject) {
      throw new NotFoundException('Project not found');
    }

    if (existingProject.workspace.isArchived || existingProject.workspace.deletedAt) {
      throw new BadRequestException(
        'Cannot restore project because parent workspace is archived. Please restore workspace first.',
      );
    }

    await this.prisma.project.update({
      where: { id: input.projectId },
      data: {
        isArchived: false,
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
    dueDate?: Date | null;
    assigneeId?: string | null;
  }): Promise<ProjectTaskItemDTO> {
    const project = await this.prisma.project.findFirst({
      where: {
        id: input.projectId,
        workspaceId: input.workspaceId,
        isArchived: false,
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

    const task = await this.prisma.task.create({
      data: {
        projectId: input.projectId,
        title: input.title,
        description: input.description ?? null,
        status: input.status,
        priority: input.priority,
        dueDate: input.dueDate ?? null,
        assigneeId: input.assigneeId ?? null,
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        dueDate: true,
        assigneeId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.toISOString() : null,
      assigneeId: task.assigneeId,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    };
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
        isArchived: false,
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
        isArchived: false,
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
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        dueDate: true,
        assigneeId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.toISOString() : null,
      assigneeId: task.assigneeId,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    };
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
        isArchived: false,
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
        isArchived: false,
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

    const task = await this.prisma.task.update({
      where: {
        id: input.taskId,
      },
      data: {
        ...(input.data.title !== undefined ? { title: input.data.title } : {}),
        ...(input.data.description !== undefined ? { description: input.data.description } : {}),
        ...(input.data.status !== undefined ? { status: input.data.status } : {}),
        ...(input.data.priority !== undefined ? { priority: input.data.priority } : {}),
        ...(input.data.dueDate !== undefined ? { dueDate: input.data.dueDate } : {}),
        ...(input.data.assigneeId !== undefined ? { assigneeId: input.data.assigneeId } : {}),
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        dueDate: true,
        assigneeId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.toISOString() : null,
      assigneeId: task.assigneeId,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    };
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
        isArchived: false,
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
        isArchived: false,
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
        isArchived: true,
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
    createdAt: Date;
    updatedAt: Date;
  }): ProjectItemDTO {
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      color: project.color,
      icon: project.icon,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
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
