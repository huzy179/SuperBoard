import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  SearchResponseDTO,
  ProjectTaskItemDTO,
  ProjectItemDTO,
  DocItemDTO,
} from '@superboard/shared';
import { AiService } from '../ai/ai.service';

interface RawTaskResult {
  id: string;
}

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
    parentTask: { select: { title: true } },
    project: { select: { name: true } },
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

  private readonly docSelect = {
    id: true,
    title: true,
    workspaceId: true,
    parentDocId: true,
    parentDoc: { select: { title: true } },
    createdById: true,
    lastEditedBy: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
  } as const;

  async globalSearch(workspaceId: string, query: string): Promise<SearchResponseDTO> {
    const q = query.trim();
    if (!q) {
      return { tasks: [], projects: [] };
    }

    const [traditionalTasks, semanticTasks, traditionalProjects, semanticProjects, docs] =
      await Promise.all([
        this.searchTasksTraditional(workspaceId, q),
        this.searchTasksSemantic(workspaceId, q),
        this.searchProjectsTraditional(workspaceId, q),
        this.searchProjectsSemantic(workspaceId, q),
        this.searchDocsHybrid(workspaceId, q),
      ]);

    // 1. Task Intelligent Merging: Score-based rank fusion
    const taskScores = new Map<string, { task: ProjectTaskItemDTO; score: number }>();

    // Traditional results get a baseline high score (vanguard)
    traditionalTasks.forEach((task, index) => {
      const weight = 1.0 - index * 0.05; // Descending weight for original order
      taskScores.set(task.id, { task, score: 0.7 * weight });
    });

    // Semantic results are blended in
    semanticTasks.forEach((task, index) => {
      const weight = 1.0 - index * 0.05;
      const existing = taskScores.get(task.id);
      if (existing) {
        existing.score += 0.3 * weight;
      } else {
        taskScores.set(task.id, { task, score: 0.3 * weight });
      }
    });

    const tasks = Array.from(taskScores.values())
      .sort((a, b) => b.score - a.score)
      .map((item) => item.task)
      .slice(0, 15);

    // 2. Project Intelligent Merging
    const projectScores = new Map<string, { project: ProjectItemDTO; score: number }>();

    traditionalProjects.forEach((project, index) => {
      const weight = 1.0 - index * 0.1;
      projectScores.set(project.id, { project, score: 0.7 * weight });
    });

    semanticProjects.forEach((project, index) => {
      const weight = 1.0 - index * 0.1;
      const existing = projectScores.get(project.id);
      if (existing) {
        existing.score += 0.3 * weight;
      } else {
        projectScores.set(project.id, { project, score: 0.3 * weight });
      }
    });

    const projects = Array.from(projectScores.values())
      .sort((a, b) => b.score - a.score)
      .map((item) => item.project)
      .slice(0, 5);

    return { tasks, projects, docs };
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

  private async searchProjectsTraditional(
    workspaceId: string,
    q: string,
  ): Promise<ProjectItemDTO[]> {
    const projects = await this.prisma.project.findMany({
      where: {
        workspaceId,

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
            tasks: { where: {} },
          },
        },
      },
      take: 5,
      orderBy: { updatedAt: 'desc' },
    });

    return projects.map((p) => this.toProjectDTO(p));
  }

  private async searchProjectsSemantic(workspaceId: string, q: string): Promise<ProjectItemDTO[]> {
    try {
      const embedding = await this.aiService.getEmbedding(q);
      const vectorStr = `[${embedding.join(',')}]`;

      const projects = await this.prisma.$queryRaw<{ id: string }[]>`
        SELECT p.id
        FROM "Project" p
        JOIN "ProjectEmbedding" pe ON p.id = pe."projectId"
        WHERE p."workspaceId" = ${workspaceId} 
          AND p."deletedAt" IS NULL
        ORDER BY pe.vector <=> ${vectorStr}::vector
        LIMIT 5;
      `;

      if (projects.length === 0) return [];

      const hydrated = await this.prisma.project.findMany({
        where: { id: { in: projects.map((p) => p.id) } },
        select: {
          id: true,
          name: true,
          description: true,
          color: true,
          icon: true,
          key: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { tasks: { where: {} } } },
        },
      });

      const projectMap = new Map(hydrated.map((p) => [p.id, p]));
      return projects
        .map((p) => projectMap.get(p.id))
        .filter((p): p is NonNullable<typeof p> => !!p)
        .map((p) => this.toProjectDTO(p));
    } catch (error) {
      console.error('Project semantic search failed:', error);
      return [];
    }
  }

  private async searchDocsHybrid(workspaceId: string, q: string): Promise<DocItemDTO[]> {
    try {
      const [traditional, semantic] = await Promise.all([
        this.searchDocsTraditional(workspaceId, q),
        this.searchDocsSemantic(workspaceId, q),
      ]);

      const docScores = new Map<string, { doc: DocItemDTO; score: number }>();

      traditional.forEach((doc, index) => {
        const weight = 1.0 - index * 0.1;
        docScores.set(doc.id, { doc, score: 0.6 * weight });
      });

      semantic.forEach((doc, index) => {
        const weight = 1.0 - index * 0.1;
        const existing = docScores.get(doc.id);
        if (existing) {
          existing.score += 0.4 * weight;
        } else {
          docScores.set(doc.id, { doc, score: 0.4 * weight });
        }
      });

      return Array.from(docScores.values())
        .sort((a, b) => b.score - a.score)
        .map((item) => item.doc)
        .slice(0, 5);
    } catch (error) {
      console.error('Doc hybrid search failed:', error);
      return [];
    }
  }

  private async searchDocsTraditional(workspaceId: string, q: string): Promise<DocItemDTO[]> {
    const docs = await this.prisma.doc.findMany({
      where: {
        workspaceId,
        OR: [{ title: { contains: q, mode: 'insensitive' } }],
      },
      select: this.docSelect,
      take: 10,
      orderBy: { updatedAt: 'desc' },
    });

    return docs.map((d) => this.toDocDTO(d));
  }

  private async searchDocsSemantic(workspaceId: string, q: string): Promise<DocItemDTO[]> {
    try {
      const embedding = await this.aiService.getEmbedding(q);
      const vectorStr = `[${embedding.join(',')}]`;

      const docs = await this.prisma.$queryRaw<{ id: string }[]>`
        SELECT d.id
        FROM "Doc" d
        JOIN "DocEmbedding" de ON d.id = de."docId"
        WHERE d."workspaceId" = ${workspaceId} 
          AND d."deletedAt" IS NULL
        ORDER BY de.vector <=> ${vectorStr}::vector
        LIMIT 10;
      `;

      if (docs.length === 0) return [];

      const hydrated = await this.prisma.doc.findMany({
        where: { id: { in: docs.map((d) => d.id) } },
        select: this.docSelect,
      });

      const docMap = new Map(hydrated.map((d) => [d.id, d]));
      return docs
        .map((d) => docMap.get(d.id))
        .filter((d): d is NonNullable<typeof d> => !!d)
        .map((d) => this.toDocDTO(d));
    } catch (error) {
      console.error('Doc semantic search failed:', error);
      return [];
    }
  }

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  private toProjectDTO(p: any): ProjectItemDTO {
    return {
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
    };
  }

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  private toDocDTO(d: any): DocItemDTO {
    return {
      id: d.id,
      workspaceId: d.workspaceId,
      title: d.title,
      parentDocId: d.parentDocId,
      parentDocTitle: d.parentDoc?.title ?? null,
      createdById: d.createdById,
      lastEditedBy: d.lastEditedBy,
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
    };
  }

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  private toTaskDTO(task: any): ProjectTaskItemDTO {
    const t = task as {
      id: string;
      projectId: string;
      title: string;
      description: string | null;
      parentTaskId: string | null;
      parentTask: { title: string } | null;
      project: { name: string } | null;
      status: string;
      priority: string;
      type: string;
      number: number | null;
      storyPoints: number | null;
      position: string | null;
      labels: { label: { id: string; name: string; color: string } }[];
      attachments: {
        id: string;
        name: string;
        key: string;
        url: string;
        size: bigint;
        mimeType: string;
        createdAt: Date;
      }[];
      dueDate: Date | null;
      assigneeId: string | null;
      assignee: { fullName: string; avatarColor: string | null } | null;
      createdAt: Date;
      updatedAt: Date;
      deletedAt: Date | null;
    };

    return {
      id: t.id,
      projectId: t.projectId,
      title: t.title,
      description: t.description ?? '',
      parentTaskId: t.parentTaskId,
      parentTaskTitle: t.parentTask?.title ?? null,
      projectName: t.project?.name ?? null,
      status: t.status as ProjectTaskItemDTO['status'],
      priority: t.priority as ProjectTaskItemDTO['priority'],
      type: (t.type ?? 'task') as ProjectTaskItemDTO['type'],
      number: t.number,
      storyPoints: t.storyPoints,
      position: t.position,
      labels: (t.labels ?? []).map((tl) => tl.label),
      attachments: (t.attachments ?? []).map((a) => ({
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

  async getWorkspaceSyncStatus(workspaceId: string) {
    const [taskCount, taskWithEmbed, projectCount, projectWithEmbed, docCount, docWithEmbed] =
      await Promise.all([
        this.prisma.task.count({ where: { project: { workspaceId } } }),
        this.prisma.taskEmbedding.count({ where: { task: { project: { workspaceId } } } }),
        this.prisma.project.count({ where: { workspaceId } }),
        this.prisma.projectEmbedding.count({ where: { project: { workspaceId } } }),
        this.prisma.doc.count({ where: { workspaceId } }),
        this.prisma.docEmbedding.count({ where: { doc: { workspaceId } } }),
      ]);

    return {
      tasks: { total: taskCount, indexed: taskWithEmbed },
      projects: { total: projectCount, indexed: projectWithEmbed },
      docs: { total: docCount, indexed: docWithEmbed },
      isFullySynced:
        taskCount === taskWithEmbed &&
        projectCount === projectWithEmbed &&
        docCount === docWithEmbed,
    };
  }

  async syncAllEntities(workspaceId: string) {
    // This is a background task. We trigger it and return a message.
    void this.performSync(workspaceId);
    return { message: 'Neural synchronization sequence initiated in background.' };
  }

  private async performSync(workspaceId: string) {
    try {
      // 1. Sync Projects
      const projects = await this.prisma.project.findMany({
        where: { workspaceId, embedding: { is: null } },
      });
      for (const p of projects) {
        await this.syncProjectEmbedding(p.id, p.name, p.description || '');
      }

      // 2. Sync Docs
      const docs = await this.prisma.doc.findMany({
        where: { workspaceId, embedding: { is: null } },
      });
      for (const d of docs) {
        const textContent = d.content ? this.extractTextFromJSON(d.content) : '';
        await this.syncDocEmbedding(d.id, d.title, textContent);
      }

      // 3. Sync Tasks
      const tasks = await this.prisma.task.findMany({
        where: { project: { workspaceId }, embedding: { is: null } },
      });
      for (const t of tasks) {
        await this.syncTaskEmbedding(t.id, t.title, t.description || '');
      }
    } catch (error) {
      console.error('Core neural sync failed:', error);
    }
  }

  private async syncTaskEmbedding(taskId: string, title: string, description: string) {
    const text = `${title}\n${description}`;
    const embedding = await this.aiService.getEmbedding(text);
    const vectorStr = `[${embedding.join(',')}]`;

    await this.prisma.$executeRaw`
      INSERT INTO "TaskEmbedding" ("taskId", "vector", "updatedAt")
      VALUES (${taskId}, ${vectorStr}::vector, NOW())
      ON CONFLICT ("taskId") 
      DO UPDATE SET "vector" = ${vectorStr}::vector, "updatedAt" = NOW();
    `;
  }

  private async syncProjectEmbedding(projectId: string, name: string, description: string) {
    const text = `${name}\n${description}`;
    const embedding = await this.aiService.getEmbedding(text);
    const vectorStr = `[${embedding.join(',')}]`;

    await this.prisma.$executeRaw`
      INSERT INTO "ProjectEmbedding" ("projectId", "vector", "updatedAt")
      VALUES (${projectId}, ${vectorStr}::vector, NOW())
      ON CONFLICT ("projectId") 
      DO UPDATE SET "vector" = ${vectorStr}::vector, "updatedAt" = NOW();
    `;
  }

  private async syncDocEmbedding(docId: string, title: string, textContent: string) {
    const text = `${title}\n${textContent}`.slice(0, 3000);
    const embedding = await this.aiService.getEmbedding(text);
    const vectorStr = `[${embedding.join(',')}]`;

    await this.prisma.$executeRaw`
      INSERT INTO "DocEmbedding" ("docId", "vector", "updatedAt")
      VALUES (${docId}, ${vectorStr}::vector, NOW())
      ON CONFLICT ("docId") 
      DO UPDATE SET "vector" = ${vectorStr}::vector, "updatedAt" = NOW();
    `;
  }

  // Re-implementing text extraction to avoid service dependency for now
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  private extractTextFromJSON(node: any): string {
    if (!node) return '';
    if (node.type === 'text') return node.text || '';
    if (Array.isArray(node.content)) {
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      return node.content.map((child: any) => this.extractTextFromJSON(child)).join(' ');
    }
    if (node.content) {
      return this.extractTextFromJSON(node.content);
    }
    return '';
  }
}
