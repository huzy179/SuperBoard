import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  CreateProjectRequestDTO,
  CreateTaskRequestDTO,
  ProjectDetailDTO,
  ProjectItemDTO,
  ProjectTaskItemDTO,
  UpdateTaskRequestDTO,
  UpdateTaskStatusRequestDTO,
} from '@superboard/shared';

@Injectable()
export class ProjectService {
  constructor(private prisma: PrismaService) {}

  async getProjectsByWorkspace(workspaceId: string): Promise<ProjectItemDTO[]> {
    const projects = await this.prisma.project.findMany({
      where: {
        workspaceId,
        isArchived: false,
      },
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
  ): Promise<ProjectDetailDTO | null> {
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        workspaceId,
        isArchived: false,
      },
      include: {
        tasks: {
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
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

  async createTaskForProject(input: {
    projectId: string;
    workspaceId: string;
    title: string;
    description?: string;
    status: NonNullable<CreateTaskRequestDTO['status']>;
  }): Promise<ProjectTaskItemDTO> {
    const project = await this.prisma.project.findFirst({
      where: {
        id: input.projectId,
        workspaceId: input.workspaceId,
        isArchived: false,
      },
      select: {
        id: true,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const task = await this.prisma.task.create({
      data: {
        projectId: input.projectId,
        title: input.title,
        description: input.description ?? null,
        status: input.status,
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
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
      },
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
      },
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
      assigneeId: task.assigneeId,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    };
  }

  async updateTaskForProject(input: {
    projectId: string;
    taskId: string;
    workspaceId: string;
    data: UpdateTaskRequestDTO;
  }): Promise<ProjectTaskItemDTO> {
    const project = await this.prisma.project.findFirst({
      where: {
        id: input.projectId,
        workspaceId: input.workspaceId,
        isArchived: false,
      },
      select: { id: true },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const existingTask = await this.prisma.task.findFirst({
      where: {
        id: input.taskId,
        projectId: input.projectId,
      },
      select: { id: true },
    });

    if (!existingTask) {
      throw new NotFoundException('Task not found');
    }

    const task = await this.prisma.task.update({
      where: {
        id: input.taskId,
      },
      data: {
        ...(input.data.title !== undefined ? { title: input.data.title } : {}),
        ...(input.data.description !== undefined ? { description: input.data.description } : {}),
        ...(input.data.status !== undefined ? { status: input.data.status } : {}),
        ...(input.data.assigneeId !== undefined ? { assigneeId: input.data.assigneeId } : {}),
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
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
      },
      select: { id: true },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const existingTask = await this.prisma.task.findFirst({
      where: {
        id: input.taskId,
        projectId: input.projectId,
      },
      select: { id: true },
    });

    if (!existingTask) {
      throw new NotFoundException('Task not found');
    }

    await this.prisma.task.delete({
      where: {
        id: input.taskId,
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
}
