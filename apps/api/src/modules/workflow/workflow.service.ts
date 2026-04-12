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

  async getWorkspaceWorkflow(workspaceId: string): Promise<{
    statuses: WorkflowStatusDTO[];
    transitions: { fromStatusId: string; toStatusId: string }[];
  }> {
    const statuses = await this.getWorkspaceStatuses(workspaceId);
    const transitions = await this.prisma.workspaceWorkflowTransition.findMany({
      where: { workspaceId },
      select: { fromStatusId: true, toStatusId: true },
    });

    return { statuses, transitions };
  }

  async createWorkspaceStatus(
    workspaceId: string,
    data: { key: string; name: string; category: WorkflowStatusCategory; position?: number },
  ): Promise<WorkflowStatusDTO> {
    const status = await this.prisma.workspaceWorkflowStatus.create({
      data: {
        workspaceId,
        key: data.key,
        name: data.name,
        category: data.category,
        position: data.position ?? 99,
        isSystem: false,
      },
    });

    return {
      id: status.id,
      key: status.key,
      name: status.name,
      category: status.category as WorkflowStatusCategory,
      position: status.position,
      isSystem: status.isSystem,
    };
  }

  async updateWorkspaceStatus(
    workspaceId: string,
    statusId: string,
    data: { name?: string; category?: WorkflowStatusCategory; position?: number },
  ): Promise<WorkflowStatusDTO> {
    const status = await this.prisma.workspaceWorkflowStatus.update({
      where: { id: statusId, workspaceId },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.category !== undefined ? { category: data.category } : {}),
        ...(data.position !== undefined ? { position: data.position } : {}),
      },
    });

    return {
      id: status.id,
      key: status.key,
      name: status.name,
      category: status.category as WorkflowStatusCategory,
      position: status.position,
      isSystem: status.isSystem,
    };
  }

  async deleteWorkspaceStatus(workspaceId: string, statusId: string): Promise<void> {
    const status = await this.prisma.workspaceWorkflowStatus.findUnique({
      where: { id: statusId, workspaceId },
    });

    if (!status) throw new BadRequestException('Trạng thái không tồn tại');
    if (status.isSystem) throw new BadRequestException('Không thể xoá trạng thái hệ thống');

    await this.prisma.$transaction(async (tx) => {
      // Remove workspace-level transitions referencing this status
      await tx.workspaceWorkflowTransition.deleteMany({
        where: { OR: [{ fromStatusId: statusId }, { toStatusId: statusId }] },
      });

      await tx.workspaceWorkflowStatus.delete({
        where: { id: statusId },
      });
    });
  }

  async updateWorkspaceTransitions(
    workspaceId: string,
    transitions: { fromStatusId: string; toStatusId: string }[],
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.workspaceWorkflowTransition.deleteMany({
        where: { workspaceId },
      });

      if (transitions.length > 0) {
        await tx.workspaceWorkflowTransition.createMany({
          data: transitions.map((t) => ({
            workspaceId,
            fromStatusId: t.fromStatusId,
            toStatusId: t.toStatusId,
          })),
        });
      }
    });
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

  async getProjectWorkflow(projectId: string): Promise<{
    statuses: WorkflowStatusDTO[];
    transitions: { fromStatusId: string; toStatusId: string }[];
  }> {
    const statuses = await this.getProjectStatuses(projectId);
    const transitions = await this.prisma.projectWorkflowTransition.findMany({
      where: { projectId },
      select: { fromStatusId: true, toStatusId: true },
    });

    return { statuses, transitions };
  }

  async createProjectStatus(
    projectId: string,
    data: { key: string; name: string; category: WorkflowStatusCategory; position?: number },
  ): Promise<WorkflowStatusDTO> {
    const status = await this.prisma.projectWorkflowStatus.create({
      data: {
        projectId,
        key: data.key,
        name: data.name,
        category: data.category,
        position: data.position ?? 99,
        isSystem: false,
      },
    });

    return {
      id: status.id,
      key: status.key,
      name: status.name,
      category: status.category as WorkflowStatusCategory,
      position: status.position,
      isSystem: status.isSystem,
    };
  }

  async updateProjectStatus(
    projectId: string,
    statusId: string,
    data: { name?: string; category?: WorkflowStatusCategory; position?: number },
  ): Promise<WorkflowStatusDTO> {
    const updateData: Prisma.ProjectWorkflowStatusUpdateInput = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.position !== undefined) updateData.position = data.position;

    const status = await this.prisma.projectWorkflowStatus.update({
      where: { id: statusId, projectId },
      data: updateData,
    });

    return {
      id: status.id,
      key: status.key,
      name: status.name,
      category: status.category as WorkflowStatusCategory,
      position: status.position,
      isSystem: status.isSystem,
    };
  }

  async deleteProjectStatus(
    projectId: string,
    statusId: string,
    migrateToId: string,
  ): Promise<void> {
    const status = await this.prisma.projectWorkflowStatus.findUnique({
      where: { id: statusId, projectId },
    });

    if (!status) throw new BadRequestException('Trạng thái không tồn tại');
    if (status.isSystem) throw new BadRequestException('Không thể xoá trạng thái hệ thống');

    const migrateTo = await this.prisma.projectWorkflowStatus.findUnique({
      where: { id: migrateToId, projectId },
    });
    if (!migrateTo) throw new BadRequestException('Trạng thái đích không hợp lệ');

    await this.prisma.$transaction(async (tx) => {
      // Migrate tasks
      await tx.task.updateMany({
        where: { projectId, status: status.key },
        data: { status: migrateTo.key },
      });

      // Remove transitions
      await tx.projectWorkflowTransition.deleteMany({
        where: { OR: [{ fromStatusId: statusId }, { toStatusId: statusId }] },
      });

      // Remove status
      await tx.projectWorkflowStatus.delete({
        where: { id: statusId },
      });
    });
  }

  async updateProjectTransitions(
    projectId: string,
    transitions: { fromStatusId: string; toStatusId: string }[],
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // Clear existing transitions for this project
      await tx.projectWorkflowTransition.deleteMany({
        where: { projectId },
      });

      // Create new transitions
      if (transitions.length > 0) {
        await tx.projectWorkflowTransition.createMany({
          data: transitions.map((t) => ({
            projectId,
            fromStatusId: t.fromStatusId,
            toStatusId: t.toStatusId,
          })),
        });
      }
    });
  }

  async syncWorkspaceToProjects(workspaceId: string): Promise<void> {
    const projects = await this.prisma.project.findMany({
      where: { workspaceId },
    });

    for (const project of projects) {
      // Clear existing and clone
      await this.prisma.projectWorkflowTransition.deleteMany({ where: { projectId: project.id } });
      await this.prisma.projectWorkflowStatus.deleteMany({ where: { projectId: project.id } });
      await this.cloneWorkspaceTemplateToProject(workspaceId, project.id);
    }
  }
}
