import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SearchResponseDTO, ProjectTaskItemDTO, ProjectItemDTO } from '@superboard/shared';
import { AiService } from '../ai/ai.service';

@Injectable()
export class SearchService {
  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
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

    const [traditionalTasks, semanticTasks, projects] = await Promise.all([
      this.searchTasksTraditional(workspaceId, q),
      this.searchTasksSemantic(workspaceId, q),
      this.searchProjects(workspaceId, q),
    ]);

    // Combine and deduplicate tasks
    const allTaskIds = new Set(traditionalTasks.map((t) => t.id));
    const uniqueSemanticTasks = semanticTasks.filter((t) => !allTaskIds.has(t.id));

    // Hybrid search: results from keyword search come first, then semantic matches
    const tasks = [...traditionalTasks, ...uniqueSemanticTasks].slice(0, 15);

    return { tasks, projects };
  }

  private async searchTasksTraditional(
    workspaceId: string,
    q: string,
  ): Promise<ProjectTaskItemDTO[]> {
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

  private async searchTasksSemantic(workspaceId: string, q: string): Promise<ProjectTaskItemDTO[]> {
    try {
      const embedding = await this.aiService.getEmbedding(q);
      const vectorStr = `[${embedding.join(',')}]`;

      // perform vector similarity search using raw SQL
      // using <=> for cosine distance (smaller is more similar)
      const tasks = await this.prisma.$queryRaw<RawTaskResult[]>`
        SELECT t.id
        FROM "Task" t
        JOIN "TaskEmbedding" te ON t.id = te."taskId"
        JOIN "Project" p ON t."projectId" = p.id
        WHERE p."workspaceId" = ${workspaceId} 
          AND t."deletedAt" IS NULL
        ORDER BY te.vector <=> ${vectorStr}::vector
        LIMIT 10;
      `;

      if (tasks.length === 0) return [];

      const hydratedTasks = await this.prisma.task.findMany({
        where: { id: { in: tasks.map((t) => t.id) } },
        select: this.taskSelect,
      });

      // Maintain the order from the vector search
      const taskMap = new Map(hydratedTasks.map((t) => [t.id, t]));
      const orderedTasks = tasks
        .map((t) => taskMap.get(t.id))
        .filter((t): t is NonNullable<typeof t> => !!t);

      return orderedTasks.map((task) => this.toTaskDTO(task));
    } catch (error) {
      console.error('Semantic search failed:', error);
      return [];
    }
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

  private toTaskDTO(task: any): ProjectTaskItemDTO {
    const t = task as any; // Temporary cast to avoid massive interface definition for prisma select
    return {
      id: t.id,
      projectId: t.projectId,
      title: t.title,
      description: t.description,
      parentTaskId: t.parentTaskId ?? null,
      status: t.status as ProjectTaskItemDTO['status'],
      priority: t.priority as ProjectTaskItemDTO['priority'],
      type: (t.type ?? 'task') as ProjectTaskItemDTO['type'],
      number: t.number ?? null,
      storyPoints: t.storyPoints ?? null,
      position: t.position ?? null,
      labels: (t.labels ?? []).map((tl: { label: any }) => tl.label),
      attachments: (t.attachments ?? []).map((a: any) => ({
        ...a,
        size: Number(a.size),
        createdAt: a.createdAt.toISOString(),
      })),
      dueDate: t.dueDate ? t.dueDate.toISOString() : null,
      assigneeId: t.assigneeId,
      assigneeName: t.assignee?.fullName ?? null,
      assigneeAvatarColor: t.assignee?.avatarColor ?? null,
      subtaskProgress: null,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
      deletedAt: t.deletedAt ? t.deletedAt.toISOString() : null,
    };
  }
}
