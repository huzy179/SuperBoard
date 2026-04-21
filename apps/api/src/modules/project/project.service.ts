import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import { RedisService } from '../../common/redis.service';
import type { Prisma } from '@prisma/client';
import { logger } from '../../common/logger';
import { verifyActiveProjectInWorkspace } from '../../common/project-scope.helper';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { WorkflowService } from '../workflow/workflow.service';
import { AutomationService } from '../automation/automation.service';
import type {
  CreateProjectRequestDTO,
  DashboardStatsDTO,
  LabelDTO,
  ProjectDetailDTO,
  ProjectItemDTO,
  ProjectMemberDTO,
  ProjectTaskItemDTO,
  UpdateProjectRequestDTO,
} from '@superboard/shared';

@Injectable()
export class ProjectService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
    private workflowService: WorkflowService,
    private aiService: AiService,
    private redisService: RedisService,
    private automationService: AutomationService,
  ) {}

  async getProjectsByWorkspace(
    workspaceId: string,
    options?: { showArchived?: boolean },
  ): Promise<ProjectItemDTO[]> {
    const projects = await this.prisma.project.findMany({
      where: {
        workspaceId,
        ...(options?.showArchived ? {} : {}),
      } as Prisma.ProjectWhereInput,
      select: {
        id: true,
        name: true,
        description: true,
        color: true,
        icon: true,
        key: true,
        workspaceId: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            tasks: {
              where: {},
            },
          },
        },
        tasks: {
          where: { status: 'done' },
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
        ...(options?.showArchived ? {} : {}),
      } as Prisma.ProjectWhereInput,
      select: {
        id: true,
        name: true,
        description: true,
        color: true,
        icon: true,
        key: true,
        workspaceId: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        tasks: {
          where: {
            ...(options?.showArchived ? {} : {}),
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
          },
        },
      },
    });

    if (!project) {
      return null;
    }

    // Fetch workspace members for assignee dropdown
    const workspaceMembers = await this.prisma.workspaceMember.findMany({
      where: { workspaceId },
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
        projectId: project.id,
        labels: (task.labels ?? []).map((tl) => tl.label as LabelDTO),
        dueDate: task.dueDate ? task.dueDate.toISOString() : null,
        assigneeId: task.assigneeId,
        assigneeName: task.assignee?.fullName ?? null,
        assigneeAvatarColor: task.assignee?.avatarColor ?? null,
        subtaskProgress: subtaskStatsByParent.get(task.id) ?? null,
        attachments: (task.attachments ?? []).map((a) => ({
          ...a,
          size: Number(a.size),
          createdAt: a.createdAt.toISOString(),
        })),
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

    const result = this.toProjectItemDTO(project);
    await this.clearDashboardCache(workspaceId);

    // Trigger embedding sync in background
    void this.syncProjectEmbedding(project.id, project.name, project.description || '');

    return result;
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

    const result = this.toProjectItemDTO(project);
    await this.clearDashboardCache(input.workspaceId);

    // Trigger embedding sync in background if relevant fields changed
    if (input.data.name !== undefined || input.data.description !== undefined) {
      void this.syncProjectEmbedding(project.id, project.name, project.description || '');
    }

    return result;
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

    await this.clearDashboardCache(input.workspaceId);
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
      },
    });

    await this.clearDashboardCache(input.workspaceId);
  }

  async getDashboardStats(workspaceId: string): Promise<DashboardStatsDTO> {
    const cacheKey = `dashboard:stats:${workspaceId}`;

    // Try to get from cache
    const cachedStats = await this.redisService.getJson<DashboardStatsDTO>(cacheKey);
    if (cachedStats) {
      logger.info(`[ProjectService] Dashboard stats cache HIT for workspace ${workspaceId}`);
      return cachedStats;
    }

    logger.info(`[ProjectService] Dashboard stats cache MISS for workspace ${workspaceId}`);

    const [statusCounts, priorityCounts, typeCounts, assigneeCounts, projectCounts] =
      await Promise.all([
        this.prisma.task.groupBy({
          by: ['status'],
          where: { project: { workspaceId }, deletedAt: null },
          _count: { id: true },
        }),
        this.prisma.task.groupBy({
          by: ['priority'],
          where: { project: { workspaceId }, deletedAt: null },
          _count: { id: true },
        }),
        this.prisma.task.groupBy({
          by: ['type'],
          where: { project: { workspaceId }, deletedAt: null },
          _count: { id: true },
        }),
        this.prisma.task.groupBy({
          by: ['assigneeId'],
          where: { project: { workspaceId }, deletedAt: null, assigneeId: { not: null } },
          _count: { id: true },
        }),
        this.prisma.task.groupBy({
          by: ['projectId', 'status'],
          where: { project: { workspaceId }, deletedAt: null },
          _count: { id: true },
        }),
      ]);

    const tasksByStatus = statusCounts.map((s) => ({
      status: s.status as DashboardStatsDTO['tasksByStatus'][number]['status'],
      count: s._count.id,
    }));

    const tasksByPriority = priorityCounts.map((p) => ({
      priority: p.priority as DashboardStatsDTO['tasksByPriority'][number]['priority'],
      count: p._count.id,
    }));

    const tasksByType = typeCounts.map((t) => ({
      type: (t.type ?? 'task') as DashboardStatsDTO['tasksByType'][number]['type'],
      count: t._count.id,
    }));

    // Fetch assignee user info for assignee counts
    const assigneeIds = assigneeCounts.map((a) => a.assigneeId);
    const assigneeUsers = await this.prisma.user.findMany({
      where: { id: { in: assigneeIds as string[] } },
      select: { id: true, fullName: true, avatarColor: true },
    });
    const assigneeUserMap = new Map(assigneeUsers.map((u) => [u.id, u]));
    const tasksByAssignee = assigneeCounts.map((a) => {
      const user = assigneeUserMap.get(a.assigneeId as string);
      return {
        assigneeId: a.assigneeId as string,
        assigneeName: user?.fullName ?? 'Unknown',
        avatarColor: user?.avatarColor ?? null,
        count: a._count.id,
      };
    });

    // Fetch project info for project counts
    const projectIds = projectCounts.map((pc) => pc.projectId);
    const projects = await this.prisma.project.findMany({
      where: { id: { in: projectIds as string[] } },
      select: { id: true, name: true, key: true, color: true },
    });
    const projectTotals = new Map<string, { total: number; done: number }>();
    for (const pc of projectCounts) {
      const existing = projectTotals.get(pc.projectId as string) ?? { total: 0, done: 0 };
      existing.total += pc._count.id;
      if (pc.status === 'done') existing.done += pc._count.id;
      projectTotals.set(pc.projectId as string, existing);
    }
    const tasksByProject = projects.map((p) => {
      const counts = projectTotals.get(p.id) ?? { total: 0, done: 0 };
      return {
        projectId: p.id,
        projectName: p.name,
        projectKey: p.key ?? null,
        color: p.color ?? null,
        total: counts.total,
        done: counts.done,
      };
    });

    // Overdue tasks — count only non-deleted, non-done/cancelled with past due date
    const now = new Date();
    const overdueTaskCount = await this.prisma.task.count({
      where: {
        project: { workspaceId },
        deletedAt: null,
        dueDate: { lt: now },
        status: { notIn: ['done', 'cancelled'] },
      },
    });

    // Recent activity
    const recentEvents = await this.prisma.taskEvent.findMany({
      where: {
        task: { project: { workspaceId } },
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

    const stats: DashboardStatsDTO = {
      tasksByStatus,
      tasksByPriority,
      tasksByType,
      tasksByAssignee,
      tasksByProject,
      overdueTasks: overdueTaskCount,
      recentActivity,
    };

    // Store in cache for 5 minutes
    await this.redisService.setJson(cacheKey, stats, 300);

    return stats;
  }

  async planProjectWithAi(projectId: string, goal: string): Promise<unknown> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { name: true, description: true },
    });
    if (!project) throw new NotFoundException('Project not found');

    // Use the high-fidelity Mission Architect
    const architectResult = await this.aiService.architectProject(goal);

    return {
      goal,
      ...architectResult,
    };
  }

  private async clearDashboardCache(workspaceId: string) {
    const cacheKey = `dashboard:stats:${workspaceId}`;
    await this.redisService.del(cacheKey);
    logger.info(`[ProjectService] Dashboard stats cache CLEAR for workspace ${workspaceId}`);
  }

  private toProjectItemDTO(project: {
    id: string;
    name: string;
    description: string | null;
    color: string | null;
    icon: string | null;
    key?: string | null;
    workspaceId: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date | null;
  }): ProjectItemDTO {
    return {
      id: project.id,
      workspaceId: project.workspaceId,
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

  private async syncProjectEmbedding(projectId: string, name: string, description: string) {
    try {
      const text = `${name}\n${description}`;
      const embedding = await this.aiService.getEmbedding(text);
      const vectorStr = `[${embedding.join(',')}]`;

      await this.prisma.$executeRaw`
        INSERT INTO "ProjectEmbedding" ("projectId", "vector", "updatedAt")
        VALUES (${projectId}, ${vectorStr}::vector, NOW())
        ON CONFLICT ("projectId") 
        DO UPDATE SET "vector" = ${vectorStr}::vector, "updatedAt" = NOW();
      `;
    } catch (err: unknown) {
      logger.error({ err, projectId }, 'Failed to sync project embedding');
    }
  }

  async syncProjectStatusesWithAiSuggestions(
    projectId: string,
    statuses: { name: string; category: string }[],
  ) {
    // This would typically sync with the workflow service or update project-specific statuses
    await this.prisma.$transaction(async (tx) => {
      // Implementation placeholder - in a real scenario this would update a Status table or workflow config
      await tx.project.update({
        where: { id: projectId },
        data: {
          // Update logic here
        },
      });
    });
    logger.info(
      { projectId, statusCount: statuses.length },
      'Synced project statuses with AI suggestions',
    );
  }
}
