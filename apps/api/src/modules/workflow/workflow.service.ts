import { BadRequestException, Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { WorkflowStatusDTO, WorkflowStatusCategory } from '@superboard/shared';

@Injectable()
export class WorkflowService {
  constructor(private prisma: PrismaService) {}

  /**
   * Initializes default statuses for a new workspace if none exist.
   */
  async initWorkspaceDefaultStatuses(workspaceId: string): Promise<void> {
    const existing = await this.prisma.workspaceWorkflowStatus.findFirst({
      where: { workspaceId },
    });

    if (existing) return;

    const defaultStatuses: Omit<Prisma.WorkspaceWorkflowStatusCreateManyInput, 'id'>[] = [
      { workspaceId, key: 'todo', name: 'To Do', category: 'todo', position: 1, isSystem: true },
      {
        workspaceId,
        key: 'in_progress',
        name: 'In Progress',
        category: 'in_progress',
        position: 2,
        isSystem: true,
      },
      {
        workspaceId,
        key: 'in_review',
        name: 'In Review',
        category: 'in_review',
        position: 3,
        isSystem: true,
      },
      { workspaceId, key: 'done', name: 'Done', category: 'done', position: 4, isSystem: true },
      {
        workspaceId,
        key: 'blocked',
        name: 'Blocked',
        category: 'blocked',
        position: 5,
        isSystem: true,
      },
    ];

    await this.prisma.workspaceWorkflowStatus.createMany({
      data: defaultStatuses as Prisma.WorkspaceWorkflowStatusCreateManyInput[],
    });

    // Create default transitions (all to all)
    const statuses = await this.prisma.workspaceWorkflowStatus.findMany({
      where: { workspaceId },
    });

    const transitions: Prisma.WorkspaceWorkflowTransitionCreateManyInput[] = [];
    for (const from of statuses) {
      for (const to of statuses) {
        if (from.id !== to.id) {
          transitions.push({
            workspaceId,
            fromStatusId: from.id,
            toStatusId: to.id,
          });
        }
      }
    }

    await this.prisma.workspaceWorkflowTransition.createMany({
      data: transitions,
    });
  }

  async getWorkspaceStatuses(workspaceId: string): Promise<WorkflowStatusDTO[]> {
    const statuses = await this.prisma.workspaceWorkflowStatus.findMany({
      where: { workspaceId },
      orderBy: { position: 'asc' },
    });

    return statuses.map((s) => ({
      id: s.id,
      key: s.key,
      name: s.name,
      category: s.category as WorkflowStatusCategory,
      position: s.position,
      isSystem: s.isSystem,
    }));
  }

  /**
   * Clones workspace template to a project.
   */
  async cloneWorkspaceTemplateToProject(workspaceId: string, projectId: string): Promise<void> {
    // 1. Get workspace statuses
    const workspaceStatuses = await this.prisma.workspaceWorkflowStatus.findMany({
      where: { workspaceId },
    });

    if (workspaceStatuses.length === 0) {
      await this.initWorkspaceDefaultStatuses(workspaceId);
      return this.cloneWorkspaceTemplateToProject(workspaceId, projectId);
    }

    // 2. Clone statuses to project
    await Promise.all(
      workspaceStatuses.map((ws) =>
        this.prisma.projectWorkflowStatus.create({
          data: {
            projectId,
            key: ws.key,
            name: ws.name,
            category: ws.category,
            position: ws.position,
            isSystem: ws.isSystem,
          },
        }),
      ),
    );

    // 3. Clone transitions
    const projectStatuses = await this.prisma.projectWorkflowStatus.findMany({
      where: { projectId },
    });

    const statusMap = new Map<string, string>(); // workspaceStatusKey -> projectStatusId
    workspaceStatuses.forEach((ws) => {
      const ps = projectStatuses.find((p) => p.key === ws.key);
      if (ps) statusMap.set(ws.id, ps.id);
    });

    const workspaceTransitions = await this.prisma.workspaceWorkflowTransition.findMany({
      where: { workspaceId },
    });

    const projectTransitions: Prisma.ProjectWorkflowTransitionCreateManyInput[] = [];
    for (const transition of workspaceTransitions) {
      const fromId = statusMap.get(transition.fromStatusId);
      const toId = statusMap.get(transition.toStatusId);

      if (fromId && toId) {
        projectTransitions.push({
          projectId,
          fromStatusId: fromId,
          toStatusId: toId,
        });
      }
    }

    if (projectTransitions.length > 0) {
      await this.prisma.projectWorkflowTransition.createMany({
        data: projectTransitions,
      });
    }
  }

  async getProjectStatuses(projectId: string): Promise<WorkflowStatusDTO[]> {
    const statuses = await this.prisma.projectWorkflowStatus.findMany({
      where: { projectId },
      orderBy: { position: 'asc' },
    });

    return statuses.map((s) => ({
      id: s.id,
      key: s.key,
      name: s.name,
      category: s.category as WorkflowStatusCategory,
      position: s.position,
      isSystem: s.isSystem,
    }));
  }

  /**
   * Validates if a transition is allowed for a project.
   */
  async validateTransition(
    projectId: string,
    fromStatusKey: string,
    toStatusKey: string,
  ): Promise<void> {
    if (fromStatusKey === toStatusKey) return;

    const fromStatus = await this.prisma.projectWorkflowStatus.findFirst({
      where: { projectId, key: fromStatusKey },
    });

    const toStatus = await this.prisma.projectWorkflowStatus.findFirst({
      where: { projectId, key: toStatusKey },
    });

    if (!fromStatus || !toStatus) {
      throw new BadRequestException(`Trạng thái không hợp lệ: ${fromStatusKey} -> ${toStatusKey}`);
    }

    const transition = await this.prisma.projectWorkflowTransition.findFirst({
      where: {
        projectId,
        fromStatusId: fromStatus.id,
        toStatusId: toStatus.id,
      },
    });

    if (!transition) {
      throw new BadRequestException(
        `Quy trình (workflow) không cho phép chuyển đổi từ "${fromStatus.name}" sang "${toStatus.name}".`,
      );
    }
  }
}
