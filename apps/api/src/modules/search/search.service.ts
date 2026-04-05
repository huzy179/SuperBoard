import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SearchResponseDTO, ProjectTaskItemDTO, ProjectItemDTO } from '@superboard/shared';

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

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
    attachments: {
      where: { deletedAt: null },
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

  async globalSearch(workspaceId: string, query: string): Promise<SearchResponseDTO> {
    const q = query.trim();
    if (!q) {
      return { tasks: [], projects: [] };
    }

    const [tasks, projects] = await Promise.all([
      this.searchTasks(workspaceId, q),
      this.searchProjects(workspaceId, q),
    ]);

    return { tasks, projects };
  }

  private async searchTasks(workspaceId: string, q: string): Promise<ProjectTaskItemDTO[]> {
    const isNumber = /^\d+$/.test(q);
    const taskNumber = isNumber ? parseInt(q, 10) : undefined;

    const tasks = await this.prisma.task.findMany({
      where: {
        project: { workspaceId },
        deletedAt: null,
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          ...(taskNumber !== undefined ? [{ number: taskNumber }] : []),
        ],
      },
      select: this.taskSelect,
      take: 10,
      orderBy: { updatedAt: 'desc' },
    });

    return tasks.map((task) => this.toTaskDTO(task));
  }

  private async searchProjects(workspaceId: string, q: string): Promise<ProjectItemDTO[]> {
    const projects = await this.prisma.project.findMany({
      where: {
        workspaceId,
        deletedAt: null,
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { key: { contains: q, mode: 'insensitive' } },
        ],
      },
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
            tasks: { where: { deletedAt: null } },
          },
        },
      },
      take: 5,
      orderBy: { updatedAt: 'desc' },
    });

    return projects.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description ?? '',
      color: p.color ?? null,
      icon: p.icon ?? null,
      key: p.key ?? '',
      taskCount: p._count.tasks,
      doneTaskCount: 0,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    }));
  }

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
    assigneeId: string | null;
    assignee?: { fullName: string; avatarColor?: string | null } | null;
    dueDate: Date | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
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
}
